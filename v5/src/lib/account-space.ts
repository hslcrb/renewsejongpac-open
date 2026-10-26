import type { BookingRecord } from "../../types/sejong.ts";

// [개인 공간과 브라우저 기록 / Personal space and browser records]
// 회원 식별자별로 분리하며 손상된 값은 화면을 중단시키지 않습니다.
// Scope records to an identity and recover malformed persisted values.
export type AccountTheme = "paper" | "sky" | "sun";
export type AccountSpace = { nickname: string; message: string; theme: AccountTheme; lightOn: boolean };
export type AccountNoteDraft = { programId: string; date: string; body: string };
export type AccountNote = AccountNoteDraft & { id: string };
export type AccountBooking = BookingRecord & { status?: "held" | "reserved_unpaid" | "expired" | "cancelled" | "released"; expiresAt?: string; sessionId?: string };
export const ACCOUNT_THEMES: readonly { id: AccountTheme; label: string }[] = [
    { id: "paper", label: "종이빛" }, { id: "sky", label: "하늘빛" }, { id: "sun", label: "햇살빛" },
];
export const DEFAULT_ACCOUNT_SPACE: AccountSpace = { nickname: "", message: "좋아하는 공연을 모으고, 오래 남을 순간을 기록해요.", theme: "paper", lightOn: true };
export const accountStorageKey = (identity: string, kind = "space") => `sejong-v5:${kind}:${encodeURIComponent(identity)}`;
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
function decode(raw: string | null): unknown { try { return JSON.parse(raw || "null"); } catch { return null; } }
export function parseAccountSpace(raw: string | null): AccountSpace {
    const data = decode(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return { ...DEFAULT_ACCOUNT_SPACE };
    const value = data as Record<string, unknown>;
    return { nickname: text(value.nickname, 24), message: typeof value.message === "string" ? value.message.trim().slice(0, 100) : DEFAULT_ACCOUNT_SPACE.message, theme: ACCOUNT_THEMES.some(theme => theme.id === value.theme) ? value.theme as AccountTheme : "paper", lightOn: typeof value.lightOn === "boolean" ? value.lightOn : true };
}
export function validAccountDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
export function accountToday(): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function validateAccountNote(draft: AccountNoteDraft, programs: ReadonlySet<string>, today: string): AccountNoteDraft | null {
    const body = draft.body.trim();
    return programs.has(draft.programId) && validAccountDate(draft.date) && draft.date <= today && body.length > 0 && body.length <= 500 ? { programId: draft.programId, date: draft.date, body } : null;
}
export function parseAccountNotes(raw: string | null): AccountNote[] {
    const data = decode(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data.filter((entry): entry is AccountNote => {
        if (!entry || typeof entry !== "object" || typeof entry.id !== "string" || seen.has(entry.id) || typeof entry.programId !== "string" || typeof entry.date !== "string" || !validAccountDate(entry.date) || typeof entry.body !== "string" || !entry.body.trim() || entry.body.length > 500) return false;
        seen.add(entry.id);
        return true;
    }).slice(0, 100);
}
export function parseAccountBookings(raw: string | null): AccountBooking[] {
    const data = decode(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((entry): entry is AccountBooking => entry && typeof entry.id === "string" && typeof entry.programId === "string" && typeof entry.title === "string" && typeof entry.date === "string" && validAccountDate(entry.date) && typeof entry.time === "string" && typeof entry.venue === "string" && Array.isArray(entry.seats) && entry.seats.every((seat: unknown) => typeof seat === "string") && typeof entry.total === "number" && Number.isFinite(entry.total));
}
export function accountBookingSummary<T extends { date: string; time: string; status?: string }>(bookings: readonly T[], today: string) {
    const active = bookings.filter(booking => booking.status === "held" || booking.status === "reserved_unpaid");
    const upcoming = active.filter(booking => booking.date >= today).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    return { next: upcoming[0], upcoming: upcoming.length, cancelled: bookings.filter(booking => booking.status === "cancelled").length, visited: active.filter(booking => booking.date < today).length };
}
