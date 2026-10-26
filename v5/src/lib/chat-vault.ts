/**
 * Browser-only encrypted conversation vault for signed-out visitors.
 * The non-extractable AES-GCM key is stored as a CryptoKey in IndexedDB;
 * only the IV and ciphertext are placed in localStorage. Never enable
 * Deep Chat's built-in plaintext browserStorage alongside this vault.
 */
export type ChatLine = { role: "user" | "ai"; text: string };
const DATA_KEY = "sejong-ai-chat-guest-v1";
const DATABASE = "sejong-ai-chat-keys-v1";
const KEY_NAME = "visitor-aes-gcm";
const MAX_LINES = 32;
const MAX_TEXT = 4000;

export function sanitizeChatLines(lines: unknown): ChatLine[] {
    if (!Array.isArray(lines)) return [];
    return lines.filter((line): line is ChatLine =>
        line !== null && typeof line === "object" &&
        (line.role === "user" || line.role === "ai") &&
        typeof line.text === "string" && line.text.trim().length > 0
    ).slice(-MAX_LINES).map(line => ({
        role: line.role,
        text: line.text.slice(0, MAX_TEXT),
    }));
}

function openKeyDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains("keys")) request.result.createObjectStore("keys");
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getGuestKey(): Promise<CryptoKey> {
    const db = await openKeyDatabase();
    try {
        const stored = await new Promise<CryptoKey | undefined>((resolve, reject) => {
            const tx = db.transaction("keys", "readonly");
            const request = tx.objectStore("keys").get(KEY_NAME);
            request.onsuccess = () => resolve(request.result as CryptoKey | undefined);
            request.onerror = () => reject(request.error);
        });
        if (stored) return stored;
        const created = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("keys", "readwrite");
            tx.objectStore("keys").put(created, KEY_NAME);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        return created;
    } finally {
        db.close();
    }
}

function encodeBase64(bytes: Uint8Array): string {
    let result = "";
    for (let i = 0; i < bytes.length; i += 4096) {
        result += String.fromCharCode(...bytes.subarray(i, i + 4096));
    }
    return btoa(result);
}
function decodeBase64(value: string): Uint8Array {
    return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

export async function loadGuestChat(): Promise<ChatLine[]> {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return [];
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== "object" ||
        !("iv" in payload) || !("ciphertext" in payload) ||
        typeof payload.iv !== "string" || typeof payload.ciphertext !== "string") throw new Error("저장된 채팅 기록을 읽을 수 없습니다.");
    const key = await getGuestKey();
    const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: decodeBase64(payload.iv) as Uint8Array<ArrayBuffer> },
        key,
        decodeBase64(payload.ciphertext) as Uint8Array<ArrayBuffer>,
    );
    return sanitizeChatLines(JSON.parse(new TextDecoder().decode(plain)));
}

export async function saveGuestChat(lines: ChatLine[]): Promise<void> {
    const key = await getGuestKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(sanitizeChatLines(lines)));
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    localStorage.setItem(DATA_KEY, JSON.stringify({
        version: 1, iv: encodeBase64(iv), ciphertext: encodeBase64(new Uint8Array(cipher)),
    }));
}

export function clearGuestChat(): void {
    localStorage.removeItem(DATA_KEY);
}
