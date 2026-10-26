import type { Program } from "../../types/sejong.ts";

export interface BookingState {
    month: string;
    date: string;
    programId: string;
    time: string;
    participants: number;
}

export type BookingChange =
    | { type: "month"; value: string }
    | { type: "date"; value: string }
    | { type: "program"; value: string }
    | { type: "time"; value: string }
    | { type: "participants"; value: string | number };

// [날짜와 선택 상태 / Dates and selection state]
// 달력의 표시 월과 확정 날짜를 분리하고 날짜는 서울을 기준으로 해석합니다.
export function seoulToday(now = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
}

function validDate(value?: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function monthDates(month?: string): string[] {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) return [];
    const [year, number] = (month || "").split("-").map(Number);
    const first = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
    const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
    const entries: string[] = Array(first).fill("");
    for (let day = 1; day <= days; day++) entries.push(`${month}-${String(day).padStart(2, "0")}`);
    while (entries.length % 7) entries.push("");
    return entries;
}

export function moveMonth(month: string, step: number): string {
    if (!monthDates(month).length || !Number.isInteger(step)) return month;
    const [year, number] = month.split("-").map(Number);
    return new Date(Date.UTC(year, number - 1 + step, 1)).toISOString().slice(0, 7);
}

export function programsForDate(programs: Program[], date?: string): Program[] {
    if (!validDate(date)) return [];
    return programs.filter((program) => (program.start || "") <= (date || "") && (program.end || "") >= (date || ""));
}

export function canSelectProgram(program?: Program): boolean {
    return Boolean(
        program &&
        program.times?.length &&
        !/매진|종료|마감|예정|준비|오픈\s*전/.test(program.status || "")
    );
}

export function createBookingState(date = seoulToday()): BookingState {
    const selectedDate = validDate(date) ? date : seoulToday();
    return { month: selectedDate.slice(0, 7), date: selectedDate, programId: "", time: "", participants: 1 };
}

export function changeBookingState(
    state: BookingState,
    change: BookingChange,
    programs: Program[]
): BookingState {
    if (change.type === "month") {
        return monthDates(change.value).length ? { ...state, month: change.value } : state;
    }
    if (change.type === "date") {
        return validDate(change.value)
            ? createBookingState(change.value)
            : { ...state, date: "", programId: "", time: "", participants: 1 };
    }
    if (change.type === "program") {
        const program = programsForDate(programs, state.date).find((item) => item.id === change.value);
        return { ...state, programId: canSelectProgram(program) ? program!.id : "", time: "", participants: 1 };
    }
    if (change.type === "time") {
        const program = programs.find((item) => item.id === state.programId);
        return { ...state, time: program?.times?.includes(change.value) ? change.value : "" };
    }
    if (change.type === "participants") {
        const count = Number(change.value);
        return { ...state, participants: Number.isInteger(count) && count >= 1 && count <= 4 ? count : 0 };
    }
    return state;
}

// [다음 단계로 전달 / Handoff to the next step]
// 선택을 다시 검증한 뒤 동일한 값으로 공연·전시·교육 흐름을 엽니다.
export function bookingDestination(state: BookingState, programs: Program[], today = seoulToday()): string {
    const program = programsForDate(programs, state.date).find((item) => item.id === state.programId);
    if (
        !canSelectProgram(program) ||
        state.date < today ||
        !program?.times?.includes(state.time) ||
        !Number.isInteger(state.participants) ||
        state.participants < 1 ||
        state.participants > 4
    )
        return "";
    const params = new URLSearchParams();
    params.set("date", state.date);
    params.set("time", state.time);
    params.set("participants", String(state.participants));
    params.set("source", "home");
    return `/booking/${encodeURIComponent(program.id)}?${params}`;
}

const seasonPrograms = new Set([
    "autumn",
    "carmen",
    "dance",
    "sumire",
    "hypnosis",
    "choral",
    "ballet",
    "winter",
    "everyone-classic",
    "chamber-autumn",
]);

export function discoverPrograms(programs: Program[], category = "전체", today = seoulToday()): Program[] {
    return programs
        .filter(
            (program) =>
                (program.end || "") >= today &&
                (category === "전체" ||
                    (category === "기획·시즌" ? seasonPrograms.has(program.id) : program.category === category))
        )
        .sort((left, right) => {
            const leftToday = (left.start || "") <= today;
            const rightToday = (right.start || "") <= today;
            if (leftToday !== rightToday) return leftToday ? -1 : 1;
            if (leftToday && canSelectProgram(left) !== canSelectProgram(right))
                return canSelectProgram(left) ? -1 : 1;
            if (leftToday) return (left.end || "").localeCompare(right.end || "");
            return (left.start || "").localeCompare(right.start || "");
        });
}
