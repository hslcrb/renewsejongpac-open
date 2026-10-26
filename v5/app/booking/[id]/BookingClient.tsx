"use client";
import React,{useEffect,useRef,useState} from "react";
import type {Program} from "../../../types/sejong.ts";
import {SystemButton,SystemField,SystemLink,SystemNotice} from "../../../components/SystemPrimitives";
import SystemSurface from "../../../components/SystemSurface";
import useAccountIdentity from "../../../components/useAccountIdentity";
import {useCatalog} from "../../../src/catalog/CatalogProvider";
import {cancelReservation,confirmReservation,getSessionSeats,holdSeats,reservationError,reservationStatusLabel,sessionLocalParts,validateBookingPrefill} from "../../../src/lib/reservations.ts";
import type {InventoryResult,Reservation,ReservationResult} from "../../../src/lib/reservations.ts";

// [서버 회차·좌석과 실제 예약 / Server sessions, inventory, and unpaid reservations]
export default function BookingClient({program:initialProgram}:{program:Program}) {
    const identity=useAccountIdentity();
    const owner=useRef(identity.identityId);owner.current=identity.identityId;
    const {catalog,error:catalogError,loading:catalogLoading}=useCatalog();
    const program=catalog.programs.find(item=>item.id===initialProgram.id)||initialProgram;
    const sessions=catalog.sessions.filter(session=>session.programId===program.id);
    const [sessionId,setSessionId]=useState("");
    const [participants,setParticipants]=useState(1);
    const [inventory,setInventory]=useState<InventoryResult|null>(null);
    const [selected,setSelected]=useState<string[]>([]);
    const [reservation,setReservation]=useState<Reservation|null>(null);
    const [error,setError]=useState("");
    const [busy,setBusy]=useState(false);
    const [now,setNow]=useState(Date.now());
    const clockOffset=useRef(0);
    const attempts=useRef(new Map<string,string>());
    const prefilling=useRef(false);
    useEffect(()=>{if(prefilling.current||catalogLoading)return;prefilling.current=true;const prefill=validateBookingPrefill(new URLSearchParams(window.location.search),sessions);setSessionId(prefill.sessionId);setParticipants(prefill.participants);setError(prefill.error);},[sessions,catalogLoading]);
    useEffect(()=>{setReservation(null);setSelected([]);attempts.current.clear();},[identity.identityId]);
    useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()+clockOffset.current),1000);return()=>clearInterval(timer);},[]);
    async function refreshSeats(id=sessionId) {if(!id)return;const result=await getSessionSeats(id);if(result.kind==="inventory")clockOffset.current=new Date(result.serverNow).valueOf()-Date.now();setInventory(result);}
    useEffect(()=>{let current=true;setSelected([]);setInventory(null);if(sessionId)getSessionSeats(sessionId).then(result=>{if(current){setInventory(result);if(result.kind==="inventory")clockOffset.current=new Date(result.serverNow).valueOf()-Date.now();}}).catch(cause=>{if(current)setError(cause.message);});return()=>{current=false;};},[sessionId]);
    const remaining=reservation?Math.max(0,Math.ceil((new Date(reservation.expiresAt).valueOf()-now)/1000)):0;
    const active=reservation&&["held","reserved_unpaid"].includes(reservation.status)&&remaining>0;
    const requestKey=(key:string)=>{const saved=attempts.current.get(key)||crypto.randomUUID();attempts.current.set(key,saved);return saved;};
    async function act(operation:()=>Promise<ReservationResult>) {
        if(busy)return;if(!identity.isLoggedIn){setError("로그인한 뒤 예약해 주세요.");return;}
        const expected=owner.current;setBusy(true);setError("");
        try {const result=await operation();if(owner.current!==expected)return;if(result.kind==="error")setError(reservationError(result.code));else{setReservation(result.reservation);clockOffset.current=new Date(result.serverNow).valueOf()-Date.now();setNow(new Date(result.serverNow).valueOf());}await refreshSeats();}
        catch(cause){if(owner.current===expected)setError(cause instanceof Error?cause.message:"예약 요청을 처리하지 못했습니다.");}finally{setBusy(false);}
    }
    const seats=inventory?.kind==="inventory"?inventory.seats:[];
    const total=seats.filter(seat=>selected.includes(seat.id)).reduce((sum,seat)=>sum+seat.price,0);
    if(!catalogLoading&&!catalogError&&!catalog.programs.some(item=>item.id===initialProgram.id)) return <div className="container page-layout"><SystemNotice title="공개가 종료된 프로그램입니다"><SystemLink href="/programs/">프로그램 목록</SystemLink></SystemNotice></div>;
    return <div className="container page-layout booking-page">
        <nav className="page-layout-breadcrumbs" aria-label="현재 위치"><SystemLink variant="quiet" href="/">홈</SystemLink><span data-text="body">/</span><SystemLink variant="quiet" href={`/programs/${program.id}`}>{program.title}</SystemLink><span data-text="body">/ 예약</span></nav>
        <header className="page-layout-heading"><p data-text="body">{program.venue}</p><h1 data-text="title">{program.title}</h1></header>
        <div className="booking-page-content" data-text="body">
            {(error||catalogError)&&<SystemNotice error title="확인이 필요합니다">{error||catalogError}</SystemNotice>}
            {!identity.isLoggedIn&&<SystemNotice title="로그인 후 예약할 수 있습니다"><SystemLink href="/account/login/">로그인하기</SystemLink></SystemNotice>}
            <SystemSurface as="section" padding="lg" className="booking-page-panel"><h2 data-text="heading">회차와 인원</h2>
                {sessions.length?<div className="booking-page-fields"><SystemField as="select" variant="flow" id="booking-session" label="관람 회차" value={sessionId} disabled={Boolean(active)||busy} onChange={event=>{setSessionId(event.target.value);setReservation(null);setError("");}}>
                    <option data-text="label" value="">회차 선택</option>{sessions.map(session=>{const local=sessionLocalParts(session);return <option data-text="label" key={session.id} value={session.id} disabled={!session.bookingEnabled}>{local.date} {local.time}{!session.bookingEnabled?" · 예약 준비 중":""}</option>;})}</SystemField>
                    <SystemField as="select" variant="flow" id="booking-participants" label="인원" value={participants} disabled={Boolean(active)||busy} onChange={event=>{setParticipants(Number(event.target.value));setSelected([]);}}>{[1,2,3,4].map(count=><option data-text="label" key={count} value={count}>{count}명</option>)}</SystemField></div>
                :<SystemNotice title="예약 가능한 회차를 준비하고 있습니다">확인된 관람 일정과 좌석이 등록되면 이곳에서 예약할 수 있습니다.</SystemNotice>}
            </SystemSurface>
            {sessionId&&<SystemSurface as="section" padding="lg" className="booking-page-panel"><h2 data-text="heading">좌석 선택</h2>
                {!inventory?<p data-text="body" role="status">좌석을 불러오는 중입니다.</p>:inventory.kind==="error"?<SystemNotice error title="회차 확인">{reservationError(inventory.code)}</SystemNotice>:!inventory.bookingEnabled?<SystemNotice title="예약 준비 중">현재 선택할 수 없는 회차입니다.</SystemNotice>:<>
                    {!seats.some(seat=>seat.available)&&!active&&<SystemNotice title="현재 선택 가능한 좌석이 없습니다">좌석을 새로 불러와 다시 확인할 수 있습니다.</SystemNotice>}
                    <p data-text="body">{participants}석을 선택해 주세요. 선택한 좌석은 5분간 보류됩니다.</p>
                    <div className="booking-page-seat-scroll" role="region" aria-label="좌석 목록" tabIndex={0}><div className="booking-page-seat-rows">{[...new Set(seats.map(seat=>seat.row))].map(row=><div className="booking-page-seat-row" key={row}>{seats.filter(seat=>seat.row===row).map(seat=><SystemButton key={seat.id} variant={selected.includes(seat.id)?"primary":"secondary"} aria-pressed={selected.includes(seat.id)} disabled={Boolean(active)||busy||!seat.available} onClick={()=>setSelected(current=>current.includes(seat.id)?current.filter(id=>id!==seat.id):current.length<participants?[...current,seat.id]:current)}>{seat.label} · {seat.price.toLocaleString()}원{!seat.available?" · 선택 불가":""}</SystemButton>)}</div>)}</div></div>
                    {!active&&<div className="page-layout-actions"><SystemButton variant="secondary" disabled={busy} onClick={()=>refreshSeats().catch(cause=>setError(cause.message))}>좌석 새로고침</SystemButton><SystemButton disabled={busy||selected.length!==participants} onClick={()=>act(()=>holdSeats(sessionId,selected,requestKey(`hold:${identity.identityId}:${sessionId}:${[...selected].sort().join(",")}`)))}>{busy?"처리 중…":`${total.toLocaleString()}원 · ${selected.length}석 보류하기`}</SystemButton></div>}
                </>}
            </SystemSurface>}
            {reservation&&<SystemSurface as="section" padding="lg" className="booking-page-panel"><h2 data-text="heading">{active?reservationStatusLabel(reservation.status):["held","reserved_unpaid"].includes(reservation.status)?"기한 만료":reservationStatusLabel(reservation.status)}</h2>
                <p data-text="body">{reservation.date} {reservation.time} · {reservation.seats.join(", ")} · {reservation.total.toLocaleString()}원</p>{active&&<p data-text="body" role="timer">남은 시간 {Math.floor(remaining/60)}분 {remaining%60}초</p>}
                <p data-text="body">{reservation.status==="reserved_unpaid"?"예약이 접수되었습니다. 결제와 발권은 아직 진행되지 않았으며, 기한이 지나면 좌석이 해제됩니다.":"예약 내용을 확인한 뒤 예약을 접수해 주세요."}</p>
                <div className="page-layout-actions">{active&&reservation.status==="held"&&<SystemButton disabled={busy} onClick={()=>act(()=>confirmReservation(reservation.id,requestKey(`confirm:${reservation.id}`)))}>예약 접수하기</SystemButton>}{active&&<SystemButton variant="secondary" disabled={busy} onClick={()=>act(()=>cancelReservation(reservation.id))}>예약 취소</SystemButton>}{!active&&<SystemButton variant="secondary" disabled={busy} onClick={()=>{attempts.current.clear();setReservation(null);setSelected([]);void refreshSeats().catch(cause=>setError(cause.message));}}>새 예약 선택</SystemButton>}<SystemLink href="/account/bookings/">예약 내역 확인</SystemLink></div>
            </SystemSurface>}
        </div>
    </div>;
}
