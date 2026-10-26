import type { TicketOpening } from "../data/ticket-openings.ts";

const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const date = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", weekday: "short",
});

// [기기가 어디에 있든 서울 시각으로 / Seoul time independent of the visitor's timezone]
export function seoulClock(now: number): string {
    return clock.format(now);
}

export function openingDateLabel(opensAt: string): string {
    return `${date.format(new Date(opensAt))} ${clock.format(new Date(opensAt)).slice(0, 5)}`;
}

export function upcomingTicketOpenings(entries: readonly TicketOpening[], now: number): TicketOpening[] {
    if (!Number.isFinite(now)) return [];
    return entries.filter(item => Date.parse(item.opensAt) > now)
        .sort((a, b) => Date.parse(a.opensAt) - Date.parse(b.opensAt));
}

export function openingDayLabel(opensAt: string, now: number): string {
    const opening = Date.parse(opensAt);
    if (opening <= now) return "예매 오픈";
    const seoulDay = (timestamp: number) => Math.floor((timestamp + 9 * 3600000) / 86400000);
    const days = seoulDay(opening) - seoulDay(now);
    return days === 0 ? "오늘 오픈" : `D-${days}`;
}
