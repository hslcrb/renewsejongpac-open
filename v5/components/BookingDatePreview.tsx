"use client";

import { forwardRef } from "react";
import type { PointerEventHandler } from "react";
import SystemSurface from "./SystemSurface";
import { mediaPath } from "../src/lib/media";
import type { Program } from "../types/sejong";

// [선택을 바꾸지 않는 날짜 미리보기 / A date preview that never commits a selection]
const BookingDatePreview = forwardRef<HTMLElement, {
    id: string;
    label: string;
    programs: readonly Program[];
    onPointerEnter: PointerEventHandler<HTMLElement>;
    onPointerLeave: PointerEventHandler<HTMLElement>;
}>(function BookingDatePreview({ id, label, programs, onPointerEnter, onPointerLeave }, ref) {
    return <aside ref={ref} id={id} role="tooltip" className="booking-date-preview"
        data-component-part="booking-date-preview" data-component-owner="booking-calendar"
        onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
        <SystemSurface variant="elevated" padding="sm" className="booking-date-preview-surface">
            <header className="booking-date-preview-heading"><strong data-text="item-title">{label}</strong><span data-text="meta">{programs.length}개 프로그램</span></header>
            {programs.length ? <ul className="booking-date-preview-list">{programs.slice(0, 3).map(program => <li key={program.id}>
                <img src={mediaPath(program.image)} alt="" width={54} height={72} onError={event => {
                    if (event.currentTarget.dataset.fallback) return;
                    event.currentTarget.dataset.fallback = "true";
                    event.currentTarget.src = mediaPath();
                }} />
                <div><span data-text="meta">{program.category}</span><strong data-text="label">{program.title}</strong><span data-text="meta">{program.venue}</span></div>
            </li>)}</ul> : <p data-text="body" className="booking-date-preview-empty">등록된 프로그램이 없습니다.</p>}
            {programs.length > 3 && <p data-text="meta" className="booking-date-preview-more">외 {programs.length - 3}개 · 날짜를 선택하면 전체 목록을 볼 수 있습니다.</p>}
        </SystemSurface>
    </aside>;
});

export default BookingDatePreview;
