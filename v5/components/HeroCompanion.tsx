"use client";
import { useCatalog } from "../src/catalog/CatalogProvider";

import { memo, useEffect, useState } from "react";
import Icon from "./Icon";
import LiquidGlass from "./LiquidGlass";
import { TICKET_OPENINGS_URL } from "../src/data/ticket-openings";
import { openingDateLabel, openingDayLabel, seoulClock, upcomingTicketOpenings } from "../src/lib/ticket-openings";

// [작품 옆의 예매 정보 / Booking information beside the featured work]
// 실시간 시계만 독립적으로 갱신하고 목록은 공식 공지로 연결합니다.
// Update the clock independently and link each release to its official announcement.
function HeroCompanion() {
    const { catalog } = useCatalog();
    const TICKET_OPENINGS = catalog.ticketOpenings;
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        const refresh = () => setNow(Date.now());
        const resume = () => {
            clearInterval(timer);
            if (!document.hidden) {
                refresh();
                timer = setInterval(refresh, 1000);
            }
        };
        resume();
        document.addEventListener("visibilitychange", resume);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", resume);
        };
    }, []);

    const next = now === null ? null : upcomingTicketOpenings(TICKET_OPENINGS, now)[0];
    const calendarDate = now === null ? "서울 기준" : new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", weekday: "short",
    }).format(now);

    return (
        <aside data-component-id="hero-companion" className="hero-companion" aria-label="티켓오픈과 현재 시각">
            <section className="hero-release-list" aria-labelledby="hero-release-heading">
                <div className="hero-companion-heading">
                    <h2 data-text="heading" id="hero-release-heading">티켓오픈</h2>
                    <a data-text="action" href={TICKET_OPENINGS_URL} target="_blank" rel="noreferrer" className="hero-companion-more" aria-label="티켓오픈 전체 안내 (새 창)">
                        <Icon name="plus" size={24} />
                    </a>
                </div>
                <ul>
                    {TICKET_OPENINGS.map(item => (
                        <li data-text="body" key={item.id}>
                            <a data-text="action" href={item.href} target="_blank" rel="noreferrer">
                                <strong data-text="item-title">{item.title}</strong>
                                <span className="hero-release-meta">
                                    <time data-text="meta" dateTime={item.opensAt}>{openingDateLabel(item.opensAt)}</time>
                                    <span data-text="body">{now === null ? "오픈 안내" : openingDayLabel(item.opensAt, now)}</span>
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </section>

            <LiquidGlass className="hero-time-glass" variant="hero">
                <div className="hero-clock-heading">
                    <span data-text="body">현재 시각 · 서울</span>
                    <Icon name="clock" size={22} />
                </div>
                <time data-text="meta" className="hero-clock" dateTime={now === null ? undefined : new Date(now).toISOString()} aria-label={now === null ? "현재 시각 확인 중" : `서울 현재 시각 ${seoulClock(now)}`}>
                    {now === null ? "--:--:--" : seoulClock(now)}
                </time>
                <p data-text="caption" className="hero-clock-date">{calendarDate}</p>
                <div data-text="body" className="hero-next-release">
                    <p data-text="body">다음 티켓오픈 <span data-text="body">{next && now !== null ? openingDayLabel(next.opensAt, now) : ""}</span></p>
                    {next ? (
                        <a data-text="action" href={next.href} target="_blank" rel="noreferrer" aria-label={`${next.title} 티켓오픈 안내 (새 창)`}>
                            <time data-text="meta" dateTime={next.opensAt}>{openingDateLabel(next.opensAt)}</time>
                            <span><span data-text="body">{next.title}</span><Icon name="diagonal" size={20} /></span>
                        </a>
                    ) : (
                        <a data-text="action" href={TICKET_OPENINGS_URL} target="_blank" rel="noreferrer">
                            <strong data-text="item-title">{now === null ? "일정을 확인하고 있어요" : "새로운 오픈 일정을 기다려 주세요"}</strong>
                            <span><span data-text="body">전체 티켓오픈 안내</span><Icon name="diagonal" size={20} /></span>
                        </a>
                    )}
                </div>
            </LiquidGlass>
        </aside>
    );
}

export default memo(HeroCompanion);
