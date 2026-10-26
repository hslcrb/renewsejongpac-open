"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { CompletionPage } from "../src/page-completion/types";
import { defineServiceForm, validateServiceValues } from "../src/page-completion/requests";
import type { ServiceRequest, ServiceValues } from "../src/page-completion/requests";
import { cancelServiceRequest, loadServiceRequests, submitServiceRequest } from "../src/page-completion/request-db";
import useAccountIdentity from "./useAccountIdentity";
import SystemSurface from "./SystemSurface";
import { SystemButton, SystemCheckbox, SystemField, SystemLink, SystemNotice } from "./SystemPrimitives";
import { SystemDisclosure } from "./SystemNavigation";
import { showSmallNotification } from "./SmallNotificationModal";
import "../styles/service-requests.css";

// [신청 입력·저장·본인 기록 / Request entry, confirmed persistence and owner history]
export default function ServiceRequestForm({ page, onSaved }: { page: CompletionPage; onSaved?: (request: ServiceRequest) => void }) {
    const identity = useAccountIdentity();
    const owner = identity.isLoggedIn ? identity.identityId : null;
    const activeOwner = useRef(owner);
    activeOwner.current = owner;
    const generation = useRef(0);
    const form = useMemo(() => defineServiceForm(page), [page]);
    const [values, setValues] = useState<ServiceValues>({ consent: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [records, setRecords] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [pending, setPending] = useState(false);
    const [failure, setFailure] = useState("");
    const [saved, setSaved] = useState<ServiceRequest | null>(null);
    const [cancelling, setCancelling] = useState("");
    const key = useRef<string | null>(null);
    const requestValues = useRef<ServiceValues | null>(null);
    const dirty = useRef(false);
    const errorBox = useRef<HTMLDivElement>(null);
    const id = `request-${page.path.replace(/[^a-z0-9]/gi, "-")}`;

    useEffect(() => {
        let stopped = false;
        generation.current += 1;
        dirty.current = false; key.current = null; requestValues.current = null;
        const query = new URLSearchParams(window.location.search);
        setValues({ name: identity.profile.name, email: identity.profile.email, phone: identity.profile.phone, subject: page.form?.entityId || "", venue: query.get("venue") || "", consent: false });
        setRecords([]); setErrors({}); setFailure(""); setSaved(null); setPending(false); setCancelling("");
        if (owner && form) {
            setLoading(true);
            void loadServiceRequests(owner, form.id).then(rows => { if (!stopped && activeOwner.current === owner) setRecords(rows); })
                .catch(error => { if (!stopped && activeOwner.current === owner) setFailure(error instanceof Error ? error.message : "신청 기록을 불러오지 못했습니다."); })
                .finally(() => { if (!stopped && activeOwner.current === owner) setLoading(false); });
        } else setLoading(false);
        return () => { stopped = true; };
        // 계정·경로가 바뀔 때만 작성 중인 내용을 초기화합니다. / Reset drafts only when the account or route changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [owner, form?.id]);

    useEffect(() => {
        if (!dirty.current) setValues(current => ({ ...current, name: identity.profile.name, email: identity.profile.email, phone: identity.profile.phone }));
    }, [identity.profile.name, identity.profile.email, identity.profile.phone]);

    function change(name: string, value: string | boolean) {
        dirty.current = true;
        key.current = null; requestValues.current = null;
        setValues(current => ({ ...current, [name]: value }));
        setErrors(current => ({ ...current, [name]: "" }));
        setSaved(null);
    }
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form || !owner || pending || !form.enabled) return;
        // 프로필 전용 초기값은 신청 정의에 포함된 경우에만 전송합니다. / Send only fields owned by this form.
        const clean: ServiceValues = Object.fromEntries(form.fields.map(field => [field.name, typeof values[field.name] === "string" ? String(values[field.name]).trim() : ""]));
        clean.consent = values.consent === true;
        const nextErrors = validateServiceValues(form, clean);
        setErrors(nextErrors); setFailure("");
        if (Object.keys(nextErrors).length) {
            setFailure("입력한 내용을 확인해 주세요.");
            requestAnimationFrame(() => errorBox.current?.focus());
            return;
        }
        if (!key.current) { key.current = crypto.randomUUID(); requestValues.current = clean; }
        const capturedOwner = owner;
        setPending(true);
        const capturedGeneration = generation.current;
        const current = () => activeOwner.current === capturedOwner && generation.current === capturedGeneration;
        try {
            const request = await submitServiceRequest(owner, form.id, key.current, requestValues.current || clean);
            if (!current()) return;
            setSaved(request); setRecords(current => [request, ...current.filter(item => item.id !== request.id)]);
            key.current = null; requestValues.current = null;
            setValues(current => ({ ...current, consent: false }));
            showSmallNotification("신청 내용을 저장했습니다.");
            onSaved?.(request);
        } catch (error) {
            if (current()) { setFailure(error instanceof Error ? error.message : "저장하지 못했습니다. 다시 시도해 주세요."); requestAnimationFrame(() => errorBox.current?.focus()); }
        } finally { if (current()) setPending(false); }
    }
    async function cancel(request: ServiceRequest) {
        if (!owner || cancelling) return;
        const capturedOwner = owner;
        setCancelling(request.id); setFailure("");
        const capturedGeneration = generation.current;
        const current = () => activeOwner.current === capturedOwner && generation.current === capturedGeneration;
        try {
            const changed = await cancelServiceRequest(owner, request.id);
            if (!current()) return;
            setRecords(current => current.map(item => item.id === changed.id ? changed : item));
            if (saved?.id === changed.id) setSaved(changed);
            showSmallNotification("신청을 취소했습니다.");
        } catch (error) { if (current()) setFailure(error instanceof Error ? error.message : "취소하지 못했습니다."); }
        finally { if (current()) setCancelling(""); }
    }
    if (!form) return null;
    return <section className="service-request" data-component-id="service-request" aria-labelledby={`${id}-title`}>
        <h2 data-text="subheading" id={`${id}-title`}>{form.title}</h2>
        {page.form?.description && <p data-text="body">{page.form.description}</p>}
        {!form.enabled ? <SystemNotice title="신청 접수 안내">{page.form?.closedReason || "현재 접수할 수 없습니다."}</SystemNotice>
            : !identity.ready ? <p data-text="body" role="status">로그인 정보를 확인하고 있습니다.</p>
            : !owner ? <SystemNotice title="로그인 후 신청할 수 있습니다"><p data-text="body">신청 내역은 본인 계정에서 확인하고 취소할 수 있습니다.</p><SystemLink href="/account/login" target="_blank" variant="secondary" shape="pill">로그인하기 · 새 창</SystemLink></SystemNotice>
            : <SystemSurface as="form" variant="panel" padding="lg" className="service-request-form" onSubmit={submit} noValidate aria-busy={pending}>
                {failure && <SystemNotice error tabIndex={-1} ref={errorBox}>{failure}</SystemNotice>}
                {saved && <SystemNotice title={saved.status === "cancelled" ? "취소된 신청입니다" : "신청 내용을 저장했습니다"}><p data-text="body">접수번호 {saved.reference}</p><p data-text="body">{form.kind === "order" ? "구매 요청이 저장됐습니다. 결제·배송 상태는 아직 확정되지 않았습니다." : "아래 신청 내역에서 저장한 내용을 확인할 수 있습니다."}</p></SystemNotice>}
                <div className="service-request-fields">{form.fields.map(field => {
                    const common = { id: `${id}-${field.name}`, name: field.name, label: field.label, required: field.required, value: String(values[field.name] || ""), disabled: pending, error: errors[field.name], onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => change(field.name, event.currentTarget.value) };
                    if (field.type === "textarea") return <SystemField key={field.name} {...common} as="textarea" rows={5} maxLength={field.maxLength} outerClassName="service-request-wide" />;
                    if (field.type === "select") return <SystemField key={field.name} {...common} as="select"><option data-text="body" value="">선택해 주세요</option>{field.options?.map(option => <option data-text="body" key={option.value} value={option.value}>{option.label}</option>)}</SystemField>;
                    return <SystemField key={field.name} {...common} type={field.type} maxLength={field.maxLength} min={field.min} max={field.max} step={field.type === "number" ? 1 : undefined} autoComplete={field.name === "name" ? "name" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : undefined} />;
                })}</div>
                <SystemDisclosure summary="신청정보 수집·이용 안내" appearance="plain"><dl className="service-request-privacy"><div><dt data-text="label">처리 주체·목적</dt><dd data-text="body">이 사이트 운영자가 신청 확인과 답변을 위해 처리합니다.</dd></div><div><dt data-text="label">수집 항목</dt><dd data-text="body">이름·이메일{form.kind !== "newsletter" ? "·연락처" : ""}와 이 양식에 입력한 신청 내용, 동의 기록</dd></div><div><dt data-text="label">보관 기간</dt><dd data-text="body">접수일로부터 90일 보관 후 자동 삭제합니다. 동의를 거부할 수 있으며, 이 경우 신청을 저장할 수 없습니다.</dd></div></dl></SystemDisclosure>
                <SystemCheckbox checked={values.consent === true} disabled={pending} onChange={event => change("consent", event.target.checked)} aria-describedby={errors.consent ? `${id}-consent-error` : undefined} label="신청정보 수집·이용에 동의합니다 (필수)" />
                {errors.consent && <p data-text="body" id={`${id}-consent-error`}>{errors.consent}</p>}
                <div className="service-request-actions"><SystemButton type="submit" disabled={pending} shape="pill">{pending ? "저장 중" : form.kind === "order" ? "구매 요청 저장" : "신청 내용 저장"}</SystemButton><p data-text="meta">저장 완료 후 접수번호가 표시됩니다.</p></div>
            </SystemSurface>}
        {owner && <div className="service-request-history"><h3 data-text="item-title">나의 신청 내역</h3>{loading ? <p data-text="body" role="status">내역을 불러오고 있습니다.</p> : !records.length ? <p data-text="body">저장한 신청 내역이 없습니다.</p> : records.map(request => <SystemDisclosure key={request.id} summary={<span data-text="label">{request.reference} · {request.status === "cancelled" ? "취소" : "접수"} · {new Date(request.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</span>}>
            <dl className="service-request-privacy">{form.fields.map(field => <div key={field.name}><dt data-text="label">{field.label}</dt><dd data-text="body">{String(request.values[field.name] || "—")}</dd></div>)}</dl>
            {request.status === "submitted" && <SystemButton variant="secondary" shape="pill" disabled={Boolean(cancelling)} onClick={() => void cancel(request)}>{cancelling === request.id ? "취소 중" : "신청 취소"}</SystemButton>}
        </SystemDisclosure>)}</div>}
        {failure && (!form.enabled || !owner) && <SystemNotice error>{failure}</SystemNotice>}
    </section>;
}
