"use client";

import Script from "next/script";
import { SystemButton } from "./SystemPrimitives";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../src/lib/supabase";
import { loadGuestChat, saveGuestChat, type LocalChatLine } from "../src/lib/guest-chat-storage";

type DeepElement = HTMLElement & { connect?: unknown; loadHistory?: unknown; requestBodyLimits?: unknown; introMessage?: unknown };
const ENDPOINT = process.env.NEXT_PUBLIC_AI_CHAT_API_URL || "";
type Signal = { onResponse: (reply: { text?: string; error?: string }) => void };
function toChatLine(item: { role?: string; text?: string }): LocalChatLine | null {
  const role = item.role === "user" ? "user" : item.role === "ai" || item.role === "assistant" ? "assistant" : null;
  return role && typeof item.text === "string" ? { role, content: item.text } : null;
}
export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const enabled = Boolean(ENDPOINT);
  const [ready, setReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const element = useRef<DeepElement | null>(null);
  const history = useRef<LocalChatLine[]>([]);
  const token = useRef<string | null>(null);
  const [initialHistory, setInitialHistory] = useState<LocalChatLine[]>([]);

  useEffect(() => {
    if (!enabled) { setReady(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const session = await supabase?.auth.getSession();
        const access = session?.data.session?.access_token || null;
        token.current = access;
        const items = access
          ? await fetch(ENDPOINT, { headers: { authorization: `Bearer ${access}` }, cache: "no-store" })
              .then(async r => r.ok ? (await r.json()).messages as LocalChatLine[] : [])
          : await loadGuestChat();
        if (!cancelled) { history.current = Array.isArray(items) ? items.slice(-40) : []; setInitialHistory(history.current); }
      } catch { if (!cancelled) setInitialHistory([]); }
      finally { if (!cancelled) setReady(true); }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  const handler = async (body: { messages?: Array<{ text?: string; role?: string }> }, signals: Signal) => {
    const last = body.messages?.map(toChatLine).filter((x): x is LocalChatLine => Boolean(x)).at(-1);
    if (!last || last.role !== "user") { signals.onResponse({ error: "메시지를 입력해 주세요." }); return; }
    if (!enabled) { signals.onResponse({ error: "상담 서비스가 준비되지 않았습니다." }); return; }
    const messages = [...history.current, last].slice(-20);
    try {
      const session = await supabase?.auth.getSession();
      const access = session?.data.session?.access_token || null;
      const response = await fetch(ENDPOINT, {
        method: "POST", headers: { "content-type": "application/json", ...(access ? { authorization: `Bearer ${access}` } : {}) },
        body: JSON.stringify({ messages }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.text !== "string") throw new Error(typeof data.error === "string" ? data.error : "연결 실패");
      history.current = [...messages, { role: "assistant", content: data.text }].slice(-40);
      if (!access) await saveGuestChat(history.current).catch(() => undefined);
      signals.onResponse({ text: data.text });
    } catch (error) {
      signals.onResponse({ error: error instanceof Error ? error.message : "연결할 수 없습니다." });
    }
  };

  useEffect(() => {
    const chat = element.current;
    if (!scriptReady || !ready || !chat) return;
    chat.connect = { handler };
    chat.loadHistory = () => initialHistory.map(item => ({ role: item.role === "assistant" ? "ai" : "user", text: item.content }));
    chat.requestBodyLimits = { maxMessages: 1 };
    chat.introMessage = { text: "안녕하세요! 공연, 전시, 방문에 대해 무엇이 궁금하세요? 정확한 일정과 가격은 공식 안내에서 다시 확인해 주세요." };
  }, [ready, scriptReady, initialHistory]);

  return (
    <aside className="sejong-ai-widget" aria-label="AI 안내 상담" data-component-id="ai-chat-widget">
      {enabled && <Script src="https://unpkg.com/deep-chat@2.5.1/dist/deepChat.bundle.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />}
      {open && (
        <section className="sejong-ai-panel" aria-label="AI 상담 창">
          <div className="sejong-ai-panel-head"><strong>세종 AI 안내</strong><SystemButton variant="quiet" type="button" onClick={() => setOpen(false)} aria-label="상담 닫기">×</SystemButton></div>
          {!enabled ? <p className="sejong-ai-loading">AI 상담 서비스 준비 중입니다.</p> : ready && scriptReady
            ? <div ref={node => { element.current = node?.querySelector("deep-chat") as DeepElement | null; }}><div className="sejong-ai-deep-mount" ref={node => {
                if (!node || node.querySelector("deep-chat")) return;
                const chat = document.createElement("deep-chat") as DeepElement;
                chat.style.width = "100%";
                chat.style.height = "min(480px, 58vh)";
                chat.style.border = "none";
                chat.connect = { handler };
                chat.loadHistory = () => initialHistory.map(item => ({ role: item.role === "assistant" ? "ai" : "user", text: item.content }));
                chat.requestBodyLimits = { maxMessages: 1 };
                node.appendChild(chat);
                element.current = chat;
              }} /></div>
            : <p className="sejong-ai-loading">상담 기능을 불러오는 중...</p>}
        </section>
      )}
      <SystemButton variant="quiet" className="sejong-ai-trigger" type="button" aria-expanded={open} aria-label={open ? "AI 상담 닫기" : "AI 상담 열기"} onClick={() => setOpen(value => !value)}>
        <span aria-hidden="true">✦</span><span className="sejong-ai-trigger-tip">무엇을 도와드릴까요?</span>
      </SystemButton>
    </aside>
  );
}
