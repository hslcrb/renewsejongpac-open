import { supabase } from "./supabase.ts";
import type { BookingRecord } from "../../types/sejong.ts";
import type { ProgramSession } from "../catalog/types.ts";
export type ReservationStatus = "held" | "reserved_unpaid" | "expired" | "cancelled" | "released";
export type Reservation = BookingRecord & { sessionId: string; status: ReservationStatus; expiresAt: string };
export type ReservationResult = { kind: "reservation"; reservation: Reservation; serverNow: string } | { kind: "error"; code: string };
export interface SessionSeat { id: string; label: string; row: string; number: number; price: number; available: boolean; }
export type InventoryResult = { kind: "inventory"; sessionId: string; bookingEnabled: boolean; seats: SessionSeat[]; serverNow: string } | { kind: "error"; code: string };
const messages: Record<string,string> = { SESSION_NOT_FOUND:"회차를 찾을 수 없습니다.", BOOKING_DISABLED:"현재 예약할 수 없는 회차입니다.", INVALID_SELECTION:"선택한 좌석을 다시 확인해 주세요.", SEATS_UNAVAILABLE:"다른 관람객이 선택한 좌석입니다. 다시 선택해 주세요.", MEMBER_LIMIT:"한 회차에는 보류 중인 좌석을 포함해 최대 4석까지 예약할 수 있습니다.", IDEMPOTENCY_CONFLICT:"이전 요청과 선택 내용이 다릅니다. 목록을 새로 불러와 주세요.", RESERVATION_NOT_FOUND:"예약을 찾을 수 없습니다.", AUTH_REQUIRED:"로그인한 뒤 예약해 주세요." };
export function reservationError(code: string): string { return messages[code] || "예약 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."; }
export const reservationStatusLabel = (status?: string) => ({held:"좌석 보류 중",reserved_unpaid:"예약됨 · 미결제",expired:"기한 만료",cancelled:"취소됨",released:"해제됨"}[status || ""] || "상태 확인 중");
async function rpc<T>(name:string,args:Record<string,unknown>):Promise<T> {
    if (!supabase) throw new Error("예약 서비스에 연결하지 못했습니다.");
    const {data,error} = await supabase.rpc(name,args);
    if(error) throw new Error(error.code === "42501" ? reservationError("AUTH_REQUIRED") : "예약 요청에 실패했습니다. 같은 선택으로 다시 시도해 주세요.");
    return data as T;
}
export const getSessionSeats = (sessionId:string) => rpc<InventoryResult>("get_session_seats",{p_session_id:sessionId});
export const holdSeats = (sessionId:string,seatIds:string[],requestKey:string) => rpc<ReservationResult>("hold_seats",{p_session_id:sessionId,p_seat_ids:seatIds,p_request_key:requestKey});
export const confirmReservation = (reservationId:string,requestKey:string) => rpc<ReservationResult>("confirm_reservation",{p_reservation_id:reservationId,p_request_key:requestKey});
export const cancelReservation = (reservationId:string) => rpc<ReservationResult>("cancel_reservation",{p_reservation_id:reservationId});
export function sessionLocalParts(session: ProgramSession) {
    const parts = new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(session.startsAt));
    const get=(name:string)=>parts.find(part=>part.type===name)?.value || "";
    return {date:`${get("year")}-${get("month")}-${get("day")}`,time:`${get("hour")}:${get("minute")}`};
}
export function validateBookingPrefill(search: URLSearchParams, sessions: ProgramSession[]): {sessionId:string;participants:number;error:string} {
    const supplied = ["date","time","participants"].some(key=>search.has(key));
    if (!supplied) return {sessionId:"",participants:1,error:""};
    const participants=Number(search.get("participants"));
    const selected=sessions.find(session=>{const value=sessionLocalParts(session); return value.date===search.get("date") && value.time===search.get("time") && session.bookingEnabled;});
    if (!selected || !Number.isInteger(participants) || participants<1 || participants>4) return {sessionId:"",participants:1,error:"전달된 날짜·회차·인원을 확인할 수 없습니다. 예약 가능한 회차를 다시 선택해 주세요."};
    return {sessionId:selected.id,participants,error:""};
}
