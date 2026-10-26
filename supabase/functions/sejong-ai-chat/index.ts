import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { routeChat, RouterError } from "./router.ts";
import type { ChatLine, Provider } from "./router.ts";

/**
 * [세종 AI 상담 / Encrypted member history + dual-provider router]
 * Supabase Edge Function for Next.js 'output: export'. The public anon key
 * identifies the project, not an authenticated person; JWTs are checked with
 * auth.getUser and each caller is subject to an atomic database quota.
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAX_BODY_BYTES = 20000;
const MAX_HISTORY = 32;
const ALLOWED_ORIGINS = new Set(
    (Deno.env.get("CHAT_ALLOWED_ORIGINS") ||
        "https://renewsejongpac.rhee.life,http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173")
        .split(",").map(origin => origin.trim()).filter(Boolean),
);
type HistoryRow = { ciphertext: string; iv: string };

function keys(): string[] {
    const result = [
        Deno.env.get("SUPABASE_ANON_KEY") || "",
        Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "",
    ].filter(Boolean);
    try {
        const data = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
        if (data && typeof data === "object") {
            for (const value of Object.values(data)) {
                if (typeof value === "string" && value.length) result.push(value);
            }
        }
    } catch { /* The legacy anon key can still identify the project. */ }
    return result;
}

function json(data: unknown, status: number, origin: string | null): Response {
    const headers = new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Vary": "Origin",
        "X-Content-Type-Options": "nosniff",
    });
    if (origin && ALLOWED_ORIGINS.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
    return new Response(JSON.stringify(data), { status, headers });
}

function base64(buffer: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < buffer.length; i += 4096) {
        binary += String.fromCharCode(...buffer.subarray(i, i + 4096));
    }
    return btoa(binary);
}
function unbase64(value: string): Uint8Array {
    return Uint8Array.from(atob(value), byte => byte.charCodeAt(0));
}

async function deriveCipherKey(secret: string): Promise<CryptoKey> {
    const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({
        name: "HKDF", hash: "SHA-256", salt: encoder.encode("sejong-ai-chat-key-salt-v1"),
        info: encoder.encode("sejong-member-history-aes256gcm-v1"),
    }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function seal(key: CryptoKey, history: ChatLine[]): Promise<HistoryRow> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const content = encoder.encode(JSON.stringify(history.slice(-MAX_HISTORY)));
    const bytes = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, content);
    return { iv: base64(iv), ciphertext: base64(new Uint8Array(bytes)) };
}
async function unseal(key: CryptoKey, row: HistoryRow): Promise<ChatLine[]> {
    const plaintext = await crypto.subtle.decrypt({
        name: "AES-GCM", iv: unbase64(row.iv),
    }, key, unbase64(row.ciphertext));
    const parsed: unknown = JSON.parse(decoder.decode(plaintext));
    return Array.isArray(parsed) ? parseLines(parsed, MAX_HISTORY) : [];
}

function parseLines(value: unknown, max: number): ChatLine[] {
    if (!Array.isArray(value) || value.length > max) throw new RouterError("대화 길이를 확인해 주세요.", 413);
    const messages: ChatLine[] = [];
    let total = 0;
    for (const row of value) {
        if (!row || typeof row !== "object" || !("role" in row) ||
            !("text" in row) || (row.role !== "user" && row.role !== "ai") ||
            typeof row.text !== "string" || !row.text.trim() || row.text.length > 10000) {
            throw new RouterError("텍스트 대화만 지원합니다.", 400);
        }
        total += row.text.length;
        if (total > 16000) throw new RouterError("대화 내용이 너무 깁니다.", 413);
        messages.push({ role: row.role, text: row.text.trim() });
    }
    return messages;
}

async function fingerprint(secret: string, subject: string): Promise<string> {
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(subject)));
    return Array.from(signed, byte => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async request => {
    const origin = request.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "허용되지 않은 사이트입니다." }, 403, origin);
    if (request.method === "OPTIONS") {
        const headers = new Headers({
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "authorization, apikey, content-type",
            "Access-Control-Max-Age": "7200",
            "Vary": "Origin",
        });
        if (origin) headers.set("Access-Control-Allow-Origin", origin);
        return new Response(null, { status: 204, headers });
    }
    if (!["GET", "POST", "DELETE"].includes(request.method)) return json({ error: "허용되지 않은 요청입니다." }, 405, origin);
    const publishable = request.headers.get("apikey") || "";
    if (!publishable || !keys().includes(publishable)) return json({ error: "잘못된 프로젝트 키입니다." }, 401, origin);

    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
    const historySecret = Deno.env.get("CHAT_ENCRYPTION_KEY") || serviceKey;
    if (!url || !serviceKey || !historySecret) return json({ error: "서비스를 준비하지 못했습니다." }, 503, origin);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const authorization = request.headers.get("authorization");
    let userId: string | null = null;
    if (authorization) {
        const match = /^Bearer ([a-zA-Z0-9._-]+)$/.exec(authorization);
        if (!match) return json({ error: "로그인 정보가 올바르지 않습니다." }, 401, origin);
        const { data, error } = await admin.auth.getUser(match[1]);
        if (error || !data.user) return json({ error: "로그인 세션을 확인하지 못했습니다." }, 401, origin);
        userId = data.user.id;
    }
    const key = userId ? await deriveCipherKey(historySecret) : null;
    try {
        if (request.method === "GET") {
            if (!userId) return json({ messages: [] }, 200, origin);
            const { data, error } = await admin.from("sejong_chat_threads").select("iv,ciphertext").eq("user_id", userId).maybeSingle();
            if (error) throw new RouterError("대화 기록을 불러오지 못했습니다.", 503);
            return json({ messages: data && key ? await unseal(key, data) : [] }, 200, origin);
        }
        if (request.method === "DELETE") {
            if (userId) {
                const { error } = await admin.from("sejong_chat_threads").delete().eq("user_id", userId);
                if (error) throw new RouterError("기록을 삭제하지 못했습니다.", 503);
            }
            return json({ ok: true }, 200, origin);
        }

        if (Number(request.headers.get("content-length") || "0") > MAX_BODY_BYTES) {
            return json({ error: "입력할 수 있는 대화 길이를 초과했습니다." }, 413, origin);
        }
        const raw = await request.text();
        if (encoder.encode(raw).length > MAX_BODY_BYTES) return json({ error: "대화 내용이 너무 깁니다." }, 413, origin);
        const incoming: unknown = JSON.parse(raw);
        if (!incoming || typeof incoming !== "object" || !("messages" in incoming)) throw new RouterError("메시지 형식을 확인해 주세요.", 400);
        const messages = parseLines(incoming.messages, 16);
        if (!messages.length || messages.at(-1)?.role !== "user" ||
            messages.at(-1)!.text.length > 2000) throw new RouterError("질문을 확인해 주세요.", 400);
        const preference: unknown = "provider" in incoming ? incoming.provider : "auto";
        if (preference !== "auto" && preference !== "groq" && preference !== "mistral") throw new RouterError("지원되지 않는 제공자입니다.", 400);

        // An atomic DB quota is enforced even for guests (who only keep local encrypted history).
        const remote = request.headers.get("cf-connecting-ip") ||
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const subject = userId ? `user:${userId}` : `visitor:${remote}`;
        const bucketKey = await fingerprint(historySecret, subject);
        const { data: allowed, error: quotaError } = await admin.rpc("sejong_chat_take_quota", {
            p_key: bucketKey, p_limit: userId ? 40 : 12,
        });
        if (quotaError) throw new RouterError("요청 한도를 확인하지 못했습니다.", 503);
        if (!allowed) return json({ error: "시간당 AI 질문 한도에 도달했습니다." }, 429, origin);

        const answer = await routeChat(messages, preference as Provider);
        if (userId && key) {
            const encrypted = await seal(key, [...messages, { role: "ai", text: answer.text }]);
            const { error } = await admin.from("sejong_chat_threads").upsert({
                user_id: userId, ...encrypted, updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
            if (error) throw new RouterError("대화 기록을 암호화 저장하지 못했습니다.", 503);
        }
        return json(answer, 200, origin);
    } catch (error) {
        if (!(error instanceof RouterError)) console.warn("Chat function request failed", error instanceof Error ? error.name : "unknown");
        const status = error instanceof RouterError ? error.status : error instanceof SyntaxError ? 400 : 503;
        const message = error instanceof RouterError ? error.message : "채팅 서비스를 이용할 수 없습니다.";
        return json({ error: message }, status, origin);
    }
});
