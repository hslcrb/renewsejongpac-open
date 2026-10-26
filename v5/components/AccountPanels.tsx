"use client";

import type { MembershipMode, TicketVariant } from "../src/system/component-contracts";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import type { Program } from "../types/sejong.ts";
import type { AccountBooking, AccountNote, AccountNoteDraft } from "../src/lib/account-space.ts";
import { mediaPath } from "../src/lib/media";
import { reservationStatusLabel } from "../src/lib/reservations.ts";
import { SystemBadge, SystemButton, SystemField, SystemIconButton, SystemLink, SystemNotice } from "./SystemPrimitives";
import Icon from "./Icon";

// [개인 프로필과 멤버십 길잡이 / Personal profile and membership navigation]
export function AccountMembershipCard({ name, message, mode, counts, onEdit, onLogout }: {
    name: string; message: string; mode: MembershipMode;
    counts: { upcoming: number; favorites: number; notes: number };
    onEdit: () => void; onLogout: () => void;
}) {
    const signedIn = mode === "oauth";
    return (
        <section className="account-identity" data-component="AccountMembershipCard" data-component-id="account-membership" aria-label="나의 프로필">
            <div className="account-identity-top"><span data-text="body" className="account-avatar" aria-hidden="true">{Array.from(name)[0] || "나"}</span><SystemBadge data-text="meta" tone={mode === "oauth" ? "info" : "neutral"}>{mode === "oauth" ? "로그인됨" : mode === "demo" ? "내 프로필" : "방문자 공간"}</SystemBadge></div>
            <h2 data-text="heading">{name}<span data-text="body">님의 세종</span></h2>
            <p data-text="body" className="account-status-message">{message || "나만의 한 줄을 남겨 보세요."}</p>
            <SystemButton data-text="action" variant="secondary" shape="pill" onClick={onEdit}>나의 공간 꾸미기 <Icon name="plus" size={20} /></SystemButton>
            <dl className="account-profile-counts">
                <div><dt data-text="label">다가올 관람</dt><dd data-text="body">{counts.upcoming}<span data-text="body">건</span></dd></div>
                <div><dt data-text="label">관심 프로그램</dt><dd data-text="body">{counts.favorites}<span data-text="body">편</span></dd></div>
                <div><dt data-text="label">남긴 관람노트</dt><dd data-text="body">{counts.notes}<span data-text="body">개</span></dd></div>
            </dl>
            <div className="account-membership-guide">
                <h3 data-text="subheading">나의 멤버십</h3>
                <p data-text="body">세종문화회관의 회원 등급·포인트·쿠폰을 확인하세요.</p>
                <SystemLink data-text="action" variant="quiet" href="https://www.sejongpac.or.kr/portal/myPage/individual/list.do?menuNo=200479" target="_blank">멤버십 확인 <Icon name="diagonal" size={20} /></SystemLink>
            </div>
            <div data-text="body" className="account-identity-session">{signedIn ? <SystemButton data-text="action" variant="quiet" onClick={onLogout}>로그아웃 <Icon name="arrow" size={20} /></SystemButton> : <SystemLink data-text="action" href="/account/login/" variant="quiet">로그인 / 프로필 만들기 <Icon name="arrow" size={20} /></SystemLink>}</div>
        </section>
    );
}

// [같은 티켓의 요약형과 상세형 / Compact and detailed views of the same ticket]
export function AccountTicket({ booking, program, variant = "full", onCancel }: {
    booking: AccountBooking; program?: Program; variant?: TicketVariant;
    onCancel?: (booking: AccountBooking, trigger: HTMLButtonElement) => void;
}) {
    const active = booking.status === "held" || booking.status === "reserved_unpaid";
    const closed = booking.status === "cancelled" || booking.status === "expired" || booking.status === "released";
    const expires = booking.expiresAt && Number.isFinite(Date.parse(booking.expiresAt))
        ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(booking.expiresAt)) : "";
    return (
        <article className="account-ticket" data-component="AccountTicket" data-component-id="account-ticket" data-variant={variant} data-cancelled={closed || undefined} data-reservation-status={booking.status}>
            <div className="account-ticket-date"><strong data-text="item-title">{booking.date.slice(5).replace("-", ".")}</strong><span data-text="body">{booking.time}</span></div>
            {program?.image ? <img className="account-ticket-poster" src={mediaPath(program.image)} alt={program.imageAlt || booking.title} width={450} height={600} loading="lazy" /> : <div className="account-ticket-poster" data-text="body" role="img" aria-label="공식 이미지 준비 중">공식 이미지 준비 중</div>}
            <div data-text="body" className="account-ticket-body">
                <SystemBadge data-text="meta" tone={active ? "info" : "neutral"}>{reservationStatusLabel(booking.status)}</SystemBadge>
                <h3 data-text="subheading"><Link data-text="action" href={`/programs/${booking.programId}/`}>{booking.title}</Link></h3>
                <p data-text="body">{booking.venue}</p>
                <p data-text="body">{booking.seats.join(", ")} · {booking.seats.length}매</p>
                {variant === "full" && <p data-text="body" className="account-ticket-reference">{booking.id} · {booking.total.toLocaleString()}원</p>}
                {active && expires && <p data-text="body">{booking.status === "held" ? "좌석 보류" : "미결제 예약"} 기한: {expires} (서울)</p>}
            </div>
            <div data-text="body" className="account-ticket-action">{variant === "compact" ? <SystemLink data-text="action" variant="secondary" href={`/programs/${booking.programId}/`}>공연 상세 <Icon name="arrow" size={20} /></SystemLink> : active && onCancel ? <SystemButton data-text="action" variant="quiet" onClick={event => onCancel(booking, event.currentTarget)}>예약 취소</SystemButton> : null}</div>
        </article>
    );
}

// [관람 후 한 줄과 날짜를 보관하는 노트 / Dated personal performance notes]
export function AccountDiary({ programs, notes, today, onSave, onDelete }: {
    programs: readonly Program[]; notes: readonly AccountNote[]; today: string;
    onSave: (draft: AccountNoteDraft) => boolean | Promise<boolean>; onDelete: (id: string) => void | Promise<void>;
}) {
    const [programId, setProgramId] = useState(programs[0]?.id || "");
    const [date, setDate] = useState(today);
    const [body, setBody] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        try {
            if (!await onSave({ programId, date, body })) { setError("공연과 오늘 이전의 관람일, 1~500자의 감상을 확인해 주세요."); return; }
            setError(""); setBody("");
        } catch (error) { setError(error instanceof Error ? error.message : "관람노트를 저장하지 못했습니다."); }
        finally { setSaving(false); }
    }
    return (
        <section className="account-diary" data-component="AccountDiary" data-component-id="account-diary" aria-labelledby="account-diary-heading">
            <div className="account-section-heading"><div><p data-text="body" className="account-section-kicker">공연이 끝난 뒤에도</p><h2 data-text="heading" id="account-diary-heading">나의 관람노트</h2></div><span data-text="body">{notes.length}개의 기록</span></div>
            <form className="account-note-form" onSubmit={submit}>
                <div className="account-form-pair"><SystemField data-text="body" as="select" label="기록할 프로그램" id="account-note-program" value={programId} onChange={event => setProgramId(event.target.value)} required>{programs.map(program => <option data-text="label" key={program.id} value={program.id}>{program.title}</option>)}</SystemField><SystemField data-text="body" label="관람일" type="date" id="account-note-date" value={date} max={today} onChange={event => setDate(event.target.value)} required /></div>
                <SystemField data-text="body" as="textarea" id="account-note-body" label="오래 남기고 싶은 장면" value={body} onChange={event => setBody(event.target.value)} rows={4} maxLength={500} required placeholder="오늘의 무대에서 마음에 남은 순간은 무엇인가요?" />
                {error && <SystemNotice data-text="body" error title="노트를 저장하지 못했어요">{error}</SystemNotice>}
                <div className="account-note-form-footer"><p data-text="body">{body.length}/500</p><SystemButton data-text="action" type="submit" disabled={saving}>{saving ? "저장 중…" : "노트 남기기"} <Icon name="plus" size={20} /></SystemButton></div>
            </form>
            <div data-text="body" className="account-note-list">{notes.length ? notes.map(note => {
                const program = programs.find(item => item.id === note.programId);
                return <article className="account-note" key={note.id}><div><time data-text="meta" dateTime={note.date}>{note.date.replaceAll("-", ".")}</time><h3 data-text="subheading">{program?.title || "나의 관람 기록"}</h3><p data-text="body">{note.body}</p></div><SystemIconButton data-text="action" aria-label={`${program?.title || "관람"} 노트 삭제`} onClick={() => onDelete(note.id)}><Icon name="close" size={20} /></SystemIconButton></article>;
            }) : <p data-text="body" className="account-empty-note">첫 관람노트를 기다리고 있어요. 짧은 한 줄이어도 좋아요.</p>}</div>
        </section>
    );
}
