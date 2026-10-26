"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import BookingDatePreview from "./BookingDatePreview";
import { SystemButton, SystemField, SystemIconButton } from "./SystemPrimitives";
import { monthDates, moveMonth, programsForDate } from "../src/features/home-domain";
import { mediaPath } from "../src/lib/media";
import { positionCalendarPreview } from "../src/lib/calendar-preview";
import type { PreviewPoint } from "../src/lib/calendar-preview";
import type { Program } from "../types/sejong";

export type BookingCalendarProps = {
    month: string;
    selectedDate: string;
    today: string;
    programs: readonly Program[];
    dateLabel: (date: string) => string;
    onMonthChange: (month: string) => void;
    onDateChange: (date: string) => void;
};

// [일곱 열을 유지하는 달력 / A calendar retaining its seven-column spatial layout]
// 날짜 셀은 좁은 화면의 공간 관계를 보존하는 등록된 특수 조작입니다.
// Date cells are registered spatial controls, preserving the narrow-screen grid.
export function BookingCalendar({ month, selectedDate, today, programs, dateLabel, onMonthChange, onDateChange }: BookingCalendarProps) {
    const previewId = useId();
    const previewRef = useRef<HTMLElement>(null);
    const anchor = useRef<PreviewPoint>({ x: 0, y: 0 });
    const frame = useRef(0);
    const dismissal = useRef<ReturnType<typeof setTimeout>>();
    const [preview, setPreview] = useState<{ date: string; source: "pointer" | "focus" } | null>(null);
    const cancelDismissal = useCallback(() => clearTimeout(dismissal.current), []);
    const closePreview = useCallback(() => { cancelDismissal(); setPreview(null); }, [cancelDismissal]);
    const deferDismissal = () => { cancelDismissal(); dismissal.current = setTimeout(closePreview, 160); };
    const positionPreview = useCallback(() => {
        const element = previewRef.current;
        if (!element) return;
        const bounds = element.getBoundingClientRect();
        const point = positionCalendarPreview(anchor.current, bounds, { width: window.innerWidth, height: window.innerHeight });
        element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    }, []);
    const movePreview = (x: number, y: number) => {
        anchor.current = { x, y };
        if (!frame.current) frame.current = requestAnimationFrame(() => { frame.current = 0; positionPreview(); });
    };

    // [비차단 미리보기의 수명과 해제 / Nonblocking preview lifecycle and dismissal]
    useLayoutEffect(() => {
        if (!preview || !previewRef.current) return;
        positionPreview();
        // 웹폰트와 콘텐츠가 늦게 자리 잡아도 화면 안의 위치를 다시 계산합니다.
        // Recheck viewport collisions after web fonts or content change the card size.
        const observer = new ResizeObserver(positionPreview);
        observer.observe(previewRef.current);
        return () => observer.disconnect();
    }, [preview, programs, positionPreview]);
    useEffect(closePreview, [month, closePreview]);
    useEffect(() => {
        if (!preview) return;
        const escape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault(); event.stopPropagation(); closePreview();
        };
        const scroll = (event: Event) => {
            if (event.target instanceof Node && previewRef.current?.contains(event.target)) return;
            closePreview();
        };
        window.addEventListener("keydown", escape, true);
        window.addEventListener("scroll", scroll, true);
        window.addEventListener("resize", closePreview);
        return () => {
            window.removeEventListener("keydown", escape, true);
            window.removeEventListener("scroll", scroll, true);
            window.removeEventListener("resize", closePreview);
        };
    }, [preview, closePreview]);
    useEffect(() => () => { clearTimeout(dismissal.current); cancelAnimationFrame(frame.current); }, []);

    return (
        <div data-text="body" className="quick-calendar" id="home-booking-calendar" data-home-anchor data-component="BookingCalendar" data-component-id="booking-calendar">
            <div className="quick-calendar-heading">
                <h3 data-text="subheading" id="quick-month" aria-live="polite">{month.replace("-", ". ")}</h3>
                <div className="quick-month-controls">
                    <SystemIconButton data-text="action" id="home-booking-previous-month" onClick={() => onMonthChange(moveMonth(month, -1))} aria-label="이전 달"><Icon name="back" size={20} /></SystemIconButton>
                    <SystemButton data-text="action" variant="quiet" id="home-booking-today" onClick={() => { onMonthChange(today.slice(0, 7)); onDateChange(today); }}>오늘</SystemButton>
                    <SystemIconButton data-text="action" id="home-booking-next-month" onClick={() => onMonthChange(moveMonth(month, 1))} aria-label="다음 달"><Icon name="arrow" size={20} /></SystemIconButton>
                </div>
            </div>
            <div data-text="body" className="quick-native-date"><SystemField type="date" label="관람 날짜" value={selectedDate} onChange={event => {
                const date = event.currentTarget.value;
                if (date) onMonthChange(date.slice(0, 7));
                onDateChange(date);
            }} /></div>
            <div data-text="body" className="quick-calendar-week" aria-hidden="true">{["일", "월", "화", "수", "목", "금", "토"].map(day => <span data-text="body" key={day}>{day}</span>)}</div>
            <div data-text="body" className="quick-calendar-grid" role="group" aria-labelledby="quick-month">
                {monthDates(month).map((date, index) => {
                    if (!date) return <span key={`blank-${index}`} className="quick-calendar-blank" aria-hidden="true" />;
                    const count = programsForDate([...programs], date).length;
                    const current = date === today;
                    const selected = date === selectedDate;
                    return (
                        <button data-text="caption"
                            key={date}
                            id={`home-booking-date-${date}`}
                            data-home-anchor
                            data-system-part="calendar-day"
                            type="button"
                            onClick={() => { closePreview(); onDateChange(date); }}
                            onPointerEnter={event => {
                                if (event.pointerType === "touch") return;
                                cancelDismissal();
                                anchor.current = { x: event.clientX, y: event.clientY };
                                setPreview({ date, source: "pointer" });
                            }}
                            onPointerMove={event => { if (preview?.source === "pointer" && preview.date === date && event.pointerType !== "touch") movePreview(event.clientX, event.clientY); }}
                            onPointerLeave={deferDismissal}
                            onFocus={event => {
                                if (!event.currentTarget.matches(":focus-visible")) return;
                                cancelDismissal();
                                const bounds = event.currentTarget.getBoundingClientRect();
                                anchor.current = { x: bounds.right, y: bounds.bottom };
                                setPreview({ date, source: "focus" });
                            }}
                            onBlur={deferDismissal}
                            aria-label={`${dateLabel(date)}${current ? ", 오늘" : ""}, ${count ? `${count}개 프로그램` : "등록된 일정 없음"}`}
                            aria-pressed={selected}
                            aria-current={current ? "date" : undefined}
                            aria-describedby={preview?.date === date ? previewId : undefined}
                            className={`quick-date${selected ? " is-selected" : ""}${current ? " is-today" : ""}`}
                        >
                            <span data-text="body">{Number(date.slice(-2))}</span>{count > 0 && <i aria-hidden="true" />}
                        </button>
                    );
                })}
            </div>
            <p data-text="body" className="quick-calendar-key"><i aria-hidden="true" />프로그램이 있는 날</p>
            {preview && createPortal(<BookingDatePreview ref={previewRef} id={previewId} label={dateLabel(preview.date)} programs={programsForDate([...programs], preview.date)} onPointerEnter={cancelDismissal} onPointerLeave={deferDismissal} />, document.body)}
        </div>
    );
}

// [포스터를 포함한 선택 타일 / Rich selection tile with a program poster]
export function BookingProgramChoice({ program, selected, available, past, onSelect }: {
    program: Program; selected: boolean; available: boolean; past: boolean; onSelect: () => void;
}) {
    return (
        <button data-text="action"
            id={`home-booking-program-${program.id}`}
            data-home-anchor
            data-component="BookingProgramChoice" data-component-id="booking-choice"
            data-system-part="program-choice"
            type="button"
            className={`quick-program${selected ? " is-selected" : ""}`}
            onClick={onSelect}
            aria-pressed={selected}
            disabled={!available}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaPath(program.image)} alt="" width="90" height="120" loading="lazy" onError={event => {
                if (event.currentTarget.dataset.fallback) return;
                event.currentTarget.dataset.fallback = "true";
                event.currentTarget.src = mediaPath();
            }} />
            <span className="quick-program-copy">
                <span data-text="caption" className="quick-program-category">{program.category} · {available ? program.status : past ? "지난 일정" : program.status}</span>
                <strong data-text="item-title">{program.title}</strong><span data-text="body">{program.venue}</span><span data-text="body">{program.times?.join(" · ")}</span>
            </span>
            <span data-text="body" className="quick-program-check" aria-hidden="true">{selected ? "✓" : "+"}</span>
        </button>
    );
}
