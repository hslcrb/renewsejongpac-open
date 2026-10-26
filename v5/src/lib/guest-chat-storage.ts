/** Guest history ciphertext is in localStorage; its non-exportable key stays in IndexedDB. */
export type LocalChatLine = { role: "user" | "assistant"; content: string };
const STORAGE = "sejong-ai-chat-cipher-v1";
const DB = "sejong-ai-chat-key-v1";
function keyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("keys");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
async function browserKey(): Promise<CryptoKey> {
  const db = await keyStore();
  try {
    const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const tx = db.transaction("keys", "readonly");
      const request = tx.objectStore("keys").get("guest");
      request.onsuccess = () => resolve(request.result as CryptoKey | undefined);
      request.onerror = () => reject(request.error);
    });
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("keys", "readwrite");
      tx.objectStore("keys").put(key, "guest");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return key;
  } finally { db.close(); }
}
const pack = (bytes: Uint8Array) => Array.from(bytes, n => n.toString(16).padStart(2, "0")).join("");
const unpack = (hex: string) => new Uint8Array(hex.match(/.{2}/g)?.map(x => parseInt(x, 16)) || []);
export async function loadGuestChat(): Promise<LocalChatLine[]> {
  const raw = localStorage.getItem(STORAGE);
  if (!raw) return [];
  try {
    const [iv, body] = raw.split(".");
    const value = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unpack(iv) }, await browserKey(), unpack(body));
    const history = JSON.parse(new TextDecoder().decode(value));
    return Array.isArray(history) ? history.filter(x => ["user", "assistant"].includes(x?.role) && typeof x?.content === "string").slice(-40) : [];
  } catch { return []; }
}
export async function saveGuestChat(history: LocalChatLine[]) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await browserKey(), new TextEncoder().encode(JSON.stringify(history.slice(-40))));
  localStorage.setItem(STORAGE, pack(iv) + "." + pack(new Uint8Array(raw)));
}
