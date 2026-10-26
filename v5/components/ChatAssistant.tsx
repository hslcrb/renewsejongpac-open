"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useAccountIdentity from "./useAccountIdentity";
import { supabase } from "../src/lib/supabase.ts";
import { clearGuestChat, loadGuestChat, sanitizeChatLines, saveGuestChat } from "../src/lib/chat-vault.ts";
import type { ChatLine } from "../src/lib/chat-vault.ts";
import styles from "./ChatAssistant.module.css";

type Provider = "auto" | "groq" | "mistral";
type ChatReply = { text: string; provider?: string; model?: string };
type ChatSignals = { onResponse: (reply: { text?: string; error?: string }) => Promise<void> };
type ChatElement = HTMLElement & {
    history: ChatLine[];
    introMessage: { text: string };
    names: boolean;
    scrollButton: boolean;
    requestBodyLimits: { maxMessages: number; totalMessagesMaxCharLength: number };
    textInput: { placeholder: { text: string }; characterLimit: number };
    connect: { handler: (body: { messages?: unknown }, signals: ChatSignals) => void };
    clearMessages: () => void;
    focusInput: () => void;
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const CHAT_ENDPOINT = URL ? `${URL.replace(/\/$/, "")}/functions/v1/sejong-ai-chat` : "";
const DEEP_CHAT_SCRIPT = "https://unpkg.com/deep-chat@2.5.1/dist/deepChat.bundle.js";
let loader: Promise<void> | null = null;

function loadDeepChat(): Promise<void> {
    if (customElements.get("deep-chat")) return Promise.resolve();
    if (!loader) {
        loader = new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = DEEP_CHAT_SCRIPT;
            script.async = true;
            script.crossOrigin = "anonymous";
            script.onload = () => {
                customElements.whenDefined("deep-chat").then(resolve, reject);
            };
            script.onerror = () => reject(new Error("채팅 UI를 불러오지 못했습니다."));
            document.head.append(script);
        }).catch(error => { loader = null; throw error; });
    }
    return loader;
}

async function apiRequest(method: "GET" | "POST" | "DELETE", isLoggedIn: boolean, body?: object): Promise<unknown> {
    if (!CHAT_ENDPOINT || !PUBLIC_KEY) throw new Error("채팅 연결 설정을 확인해 주세요.");
    const headers: Record<string, string> = {
        apikey: PUBLIC_KEY,
        "Content-Type": "application/json",
    };
    if (isLoggedIn) {
        const { data: { session }, error } = await supabase!.auth.getSession();
        if (error || !session?.access_token) throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
        headers.Authorization = `Bearer ${session.access_token}`;
    }
    const response = await fetch(CHAT_ENDPOINT, {
        method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store",
    });
    if (!response.ok) {
        if (response.status === 429) throw new Error("이용량 한도에 도달했습니다. 잠시 후 다시 이용해 주세요.");
        if (response.status === 401) throw new Error("로그인 상태를 다시 확인해 주세요.");
        if (response.status === 503) throw new Error("AI 상담 서비스가 준비되지 않았습니다.");
        throw new Error("AI 답변을 받지 못했습니다. 다시 시도해 주세요.");
    }
    return response.json();
}

/**
 * Site-wide, text-only Deep Chat launcher. Hover opens on desktop; tap/keyboard toggles
 * on touch/keyboard. Static Next.js export delegates all model calls to an Edge Function.
 * Deep Chat's plaintext browserStorage and client directConnection are deliberately off.
 */
/* 과거 구현을 보존하되 현재 사용되지 않는 컴포넌트는 공개 export에서 제외한다. */
function ChatAssistant() {
    const { isLoggedIn, identityId, ready } = useAccountIdentity();
    const [open, setOpen] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState("");
    const [provider, setProvider] = useState<Provider>("auto");
    const [lastModel, setLastModel] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const chatRef = useRef<ChatElement | null>(null);
    const historyRef = useRef<ChatLine[]>([]);
    const providerRef = useRef<Provider>(provider);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    providerRef.current = provider;

    const reveal = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(true);
        setHasOpened(true);
    }, []);
    const dismiss = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(false);
    }, []);
    const scheduleClose = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => {
            if (!rootRef.current?.contains(document.activeElement)) setOpen(false);
        }, 220);
    };
    useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

    useEffect(() => {
        if (!hasOpened || !ready || !contentRef.current) return;
        let cancelled = false;
        let node: ChatElement | null = null;
        setLoaded(false);
        setError("");
        historyRef.current = [];
        const mount = async () => {
            try {
                const results = await Promise.all([
                    loadDeepChat(),
                    isLoggedIn
                        ? apiRequest("GET", true).then(value => sanitizeChatLines((value as { messages?: unknown }).messages))
                        : loadGuestChat(),
                ]);
                if (cancelled) return;
                const history = results[1];
                historyRef.current = history;
                node = document.createElement("deep-chat") as ChatElement;
                node.setAttribute("aria-label", "세종 AI 상담 대화");
                node.style.display = "block";
                node.style.width = "100%";
                node.style.height = "100%";
                node.style.border = "none";
                node.style.background = "transparent";
                node.history = history;
                node.introMessage = { text: "안녕하세요! 세종문화회관의 공연·전시·이용 안내에 관해 무엇이든 물어보세요. AI 답변은 공식 안내와 다를 수 있어요." };
                node.names = true;
                node.scrollButton = true;
                node.requestBodyLimits = { maxMessages: 16, totalMessagesMaxCharLength: 10000 };
                node.textInput = { placeholder: { text: "궁금한 점을 입력해 보세요" }, characterLimit: 2000 };
                node.connect = {
                    handler: (body, signals) => {
                        void (async () => {
                            try {
                                const lines = sanitizeChatLines(body.messages);
                                if (!lines.length || lines[lines.length - 1].role !== "user") {
                                    throw new Error("질문 내용을 확인해 주세요.");
                                }
                                const result = await apiRequest("POST", isLoggedIn, {
                                    provider: providerRef.current, messages: lines,
                                }) as ChatReply;
                                if (typeof result.text !== "string" || !result.text.trim()) throw new Error("빈 답변을 받았습니다.");
                                const updated = sanitizeChatLines([...lines, { role: "ai", text: result.text }]);
                                if (!isLoggedIn) await saveGuestChat(updated);
                                historyRef.current = updated;
                                if (cancelled) return;
                                setLastModel([result.provider, result.model].filter(Boolean).join(" · "));
                                await signals.onResponse({ text: result.text });
                            } catch (problem) {
                                if (!cancelled) await signals.onResponse({
                                    error: problem instanceof Error ? problem.message : "메시지를 전송하지 못했습니다.",
                                });
                            }
                        })();
                    },
                };
                chatRef.current = node;
                contentRef.current?.replaceChildren(node);
                setLoaded(true);
            } catch (problem) {
                if (!cancelled) setError(problem instanceof Error ? problem.message : "대화 기록을 불러오지 못했습니다.");
            }
        };
        void mount();
        return () => {
            cancelled = true;
            node?.remove();
            if (chatRef.current === node) chatRef.current = null;
        };
    }, [hasOpened, ready, isLoggedIn, identityId]);

    const clear = async () => {
        try {
            setError("");
            if (isLoggedIn) await apiRequest("DELETE", true);
            else clearGuestChat();
            historyRef.current = [];
            chatRef.current?.clearMessages();
            setLastModel("");
        } catch (problem) {
            setError(problem instanceof Error ? problem.message : "기록을 삭제하지 못했습니다.");
        }
    };

    return (
        <div
            ref={rootRef}
            data-component-id="chat-assistant"
            className={styles.launcher}
            onMouseEnter={() => {
                if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) reveal();
            }}
            onMouseLeave={scheduleClose}
            onKeyDown={event => {
                if (event.key === "Escape" && open) {
                    event.stopPropagation();
                    dismiss();
                    buttonRef.current?.focus();
                }
            }}
        >
            <section
                id="sejong-ai-panel"
                className={`${styles.panel} ${open ? styles.visible : ""}`}
                aria-label="세종 AI 상담"
                aria-hidden={!open}
                inert={!open}
            >
                <header className={styles.panelHeader}>
                    <span className={styles.heading}><span aria-hidden="true" className={styles.sparkle}>✳</span> 세종 AI 도우미</span>
                    <div className={styles.actions}>
                        <button type="button" className={styles.minorButton} onClick={() => void clear()} aria-label="대화 기록 삭제">기록 삭제</button>
                        <button type="button" className={styles.closeButton} onClick={dismiss} aria-label="채팅 닫기">×</button>
                    </div>
                </header>
                <div className={styles.toolbar}>
                    <label htmlFor="sejong-chat-provider">AI 모델</label>
                    <select id="sejong-chat-provider" value={provider} onChange={event => setProvider(event.target.value as Provider)}>
                        <option value="auto">자동 선택</option>
                        <option value="groq">Groq</option>
                        <option value="mistral">Mistral</option>
                    </select>
                    <span className={styles.storage}>{isLoggedIn ? "계정 암호화 기록" : "이 기기 암호화 기록"}</span>
                </div>
                <div ref={contentRef} className={styles.chat} aria-busy={hasOpened && !loaded && !error}>
                    {!loaded && !error && <p className={styles.notice}>대화 기록을 불러오는 중…</p>}
                    {error && <p className={styles.error} role="alert">{error}</p>}
                </div>
                {lastModel && <p className={styles.model} aria-live="polite">응답 모델: {lastModel}</p>}
                <p className={styles.disclaimer}>AI가 작성한 답변입니다. 실제 공연·예매 정보는 반드시 확인해 주세요.</p>
            </section>
            <button
                ref={buttonRef}
                type="button"
                className={styles.trigger}
                aria-label={open ? "AI 상담 접기" : "AI 상담 열기"}
                aria-controls="sejong-ai-panel"
                aria-expanded={open}
                onClick={() => open ? dismiss() : reveal()}
            >
                <svg viewBox="0 0 48 48" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.7" aria-hidden="true">
                    <path d="M9 13a7 7 0 0 1 7-7h17a7 7 0 0 1 7 7v17a7 7 0 0 1-7 7H21l-11 7V30a7 7 0 0 1-1-4Z" strokeLinejoin="round" />
                    <path d="m18 26 3-9 3 9m-5-3h4m7-6v9" strokeLinecap="round" />
                    <path d="M32 11v3m-1.5-1.5h3" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className={styles.logoLabel}>AI</span>
            </button>
        </div>
    );
}
