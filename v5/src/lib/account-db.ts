import { supabase } from "./supabase.ts";
import { cancelReservation, reservationError } from "./reservations.ts";
import type { AccountBooking, AccountNote, AccountNoteDraft, AccountSpace } from "./account-space.ts";
import { DEFAULT_ACCOUNT_SPACE, parseAccountSpace } from "./account-space.ts";
import type { UserProfile } from "../../types/sejong.ts";

// [인증한 회원의 DB만 사용 / Only the authenticated member's database records]
export const MEMBER_TABLES = {
    profiles: "sejong_profiles", spaces: "sejong_spaces", favorites: "sejong_favorites",
    notes: "sejong_notes", bookings: "sejong_bookings",
} as const;

function database() {
    if (!supabase) throw new Error("저장 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    return supabase;
}

export async function authenticatedMember() {
    const client = database();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error("로그인한 뒤 이용해 주세요.");
    return { client, user: data.user };
}

function checked<T>(result: { data: T; error: { message: string } | null }): T {
    if (result.error) throw new Error("저장 서비스 요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    return result.data;
}

type BookingRow = {
    id: string; program_id: string; title: string; event_date: string; event_time: string;
    venue: string; seats: string[]; total: number; status: AccountBooking["status"]; created_at: string; expires_at: string; session_id: string;
};
const bookingFromRow = (row: BookingRow): AccountBooking => ({
    id: row.id, programId: row.program_id, title: row.title, date: row.event_date,
    time: row.event_time.slice(0, 5), venue: row.venue, seats: row.seats,
    total: row.total, reference: row.id, status: row.status, createdAt: row.created_at, expiresAt: row.expires_at, sessionId: row.session_id,
});

export async function loadMemberAccount(expectedUserId: string) {
    const { client, user } = await authenticatedMember();
    if (user.id !== expectedUserId) throw new Error("로그인한 계정이 변경되었습니다.");
    const [spaceResult, notesResult, bookingsResult] = await Promise.all([
        client.from(MEMBER_TABLES.spaces).select("nickname,message,theme,light_on").eq("user_id", user.id).maybeSingle(),
        client.from(MEMBER_TABLES.notes).select("id,program_id,event_date,body").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        client.rpc("get_member_reservations"),
    ]);
    const row = checked(spaceResult);
    const space = row ? parseAccountSpace(JSON.stringify({ ...row, lightOn: row.light_on })) : { ...DEFAULT_ACCOUNT_SPACE };
    const notes: AccountNote[] = (checked(notesResult) || []).map(row => ({ id: row.id, programId: row.program_id, date: row.event_date, body: row.body }));
    const bookings = ((checked(bookingsResult) || []) as BookingRow[]).map(bookingFromRow);
    return { space, notes, bookings };
}

export async function saveMemberSpace(space: AccountSpace, expectedUserId: string) {
    const { client, user } = await authenticatedMember();
    if (user.id !== expectedUserId) throw new Error("로그인한 계정이 변경되었습니다.");
    checked(await client.from(MEMBER_TABLES.spaces).upsert({ user_id: user.id, nickname: space.nickname, message: space.message, theme: space.theme, light_on: space.lightOn, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("user_id").single());
}

export async function saveMemberProfile(profile: UserProfile, expectedUserId: string) {
    const { client, user } = await authenticatedMember();
    if (user.id !== expectedUserId) throw new Error("로그인한 계정이 변경되었습니다.");
    checked(await client.from(MEMBER_TABLES.profiles).upsert({ user_id: user.id, name: profile.name, email: user.email || "", phone: profile.phone, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("user_id").single());
}

export async function loadMemberProfile(expectedUserId: string): Promise<UserProfile | null> {
    const { client, user } = await authenticatedMember();
    if (user.id !== expectedUserId) throw new Error("로그인한 계정이 변경되었습니다.");
    const row = checked(await client.from(MEMBER_TABLES.profiles).select("name,phone").eq("user_id", user.id).maybeSingle());
    return row ? { name: row.name, phone: row.phone, email: user.email || "" } : null;
}

export async function createMemberNote(draft: AccountNoteDraft, expectedUserId: string): Promise<AccountNote> {
    const { client, user } = await authenticatedMember();
    if (user.id !== expectedUserId) throw new Error("로그인한 계정이 변경되었습니다.");
    const row = checked(await client.from(MEMBER_TABLES.notes).insert({ user_id: user.id, program_id: draft.programId, event_date: draft.date, body: draft.body }).select("id,program_id,event_date,body").single());
    return { id: row.id, programId: row.program_id, date: row.event_date, body: row.body };
}

export async function removeMemberNote(id: string, expectedUserId: string) {
    const { client, user } = await authenticatedMember();
    if (user.id !== expectedUserId) throw new Error("로그인한 계정이 변경되었습니다.");
    const rows = checked(await client.from(MEMBER_TABLES.notes).delete().eq("user_id", user.id).eq("id", id).select("id"));
    if (!rows?.length) throw new Error("삭제할 기록을 찾지 못했습니다. 목록을 새로 불러와 주세요.");
}

// Reservations are created exclusively by holdSeats/confirmReservation RPCs.
export async function createMemberBooking(_booking: AccountBooking, _expectedUserId: string): Promise<AccountBooking> {
    throw new Error("회차와 좌석을 선택한 뒤 예약해 주세요.");
}
export async function cancelMemberBooking(id: string, expectedUserId: string) {
    const { user } = await authenticatedMember();
    if (user.id !== expectedUserId) throw new Error("로그인한 계정이 변경되었습니다.");
    const result = await cancelReservation(id);
    if (result.kind === "error") throw new Error(reservationError(result.code));
    return result.reservation;
}
