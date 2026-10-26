import type { CompletionPage, ServiceKind } from "./types.ts";

// [신청 정의와 클라이언트 검증 / Request definitions and client validation]
export type ServiceField = { name: string; label: string; type: "text" | "email" | "tel" | "textarea" | "date" | "number" | "select"; required?: boolean; maxLength?: number; min?: number; max?: number; options?: { value: string; label: string }[] };
export type ServiceFormDefinition = { id: string; path: string; kind: ServiceKind; title: string; enabled: boolean; fields: ServiceField[] };
export type ServiceValues = Record<string, string | boolean>;
export type ServiceRequest = { id: string; reference: string; form_id: string; kind: ServiceKind; status: "submitted" | "cancelled"; values: Record<string, unknown>; created_at: string; expires_at: string };
export type ServiceGood = { id: string; title: string; description: string; source_url: string; image: string | null; price: number | null };
export type ServiceCartLine = { good_id: string; quantity: number; sejong_goods: ServiceGood };

const text = (name: string, label: string, required = true, maxLength = 120): ServiceField => ({ name, label, type: "text", required, maxLength });
const message = (label = "신청 내용", required = true): ServiceField => ({ name: "message", label, type: "textarea", required, maxLength: 2000 });
const venue: ServiceField = { name: "venue", label: "희망 공간", type: "select", required: true, options: [
    { value: "grand", label: "세종대극장" }, { value: "m-theater", label: "세종M씨어터" }, { value: "s-theater", label: "세종S씨어터" }, { value: "chamber", label: "세종체임버홀" }, { value: "gallery", label: "세종미술관" },
] };
const date: ServiceField = { name: "date", label: "희망일", type: "date", required: true };
const attendees: ServiceField = { name: "attendees", label: "예상 인원", type: "number", required: true, min: 1, max: 10000 };

export function defineServiceForm(page: CompletionPage): ServiceFormDefinition | null {
    if (!page.form) return null;
    const kind = page.form.kind;
    const common: ServiceField[] = [text("name", "이름", true, 80), { name: "email", label: "연락받을 이메일", type: "email", required: true, maxLength: 254 }];
    if (kind !== "newsletter") common.push({ name: "phone", label: "연락처", type: "tel", required: !["event", "membership"].includes(kind), maxLength: 30 });
    const specific: Record<ServiceKind, ServiceField[]> = {
        rental: [text("organization", "단체·기관명"), venue, date, { ...date, name: "endDate", label: "종료 희망일" }, attendees, text("subject", "행사명", true, 160), message("행사 개요와 필요한 시설")],
        group: [text("organization", "단체·기관명"), text("program", "희망 프로그램", true, 160), date, attendees, text("subject", "문의 제목", false, 160), message("관람 목적과 필요한 지원")],
        inquiry: [text("subject", "문의 제목", true, 160), message("문의 내용")],
        partnership: [text("organization", "기관·기업명"), text("subject", "제안 제목", true, 160), message("제안 내용과 협력 방식")],
        donation: [text("organization", "소속", false), { name: "amount", label: "희망 후원 금액(원, 선택)", type: "number", min: 1, max: 1000000000 }, { name: "frequency", label: "후원 방식", type: "select", required: true, options: [{ value: "once", label: "일시 후원" }, { value: "regular", label: "정기 후원 상담" }] }, message("관심 사업과 상담 내용", false)],
        recruitment: [text("subject", "지원 분야", true, 160), { name: "experience", label: "관련 경험", type: "textarea", required: true, maxLength: 3000 }, text("portfolio", "포트폴리오 URL(선택)", false, 500), message("지원 동기")],
        event: [text("subject", "참여 이벤트", true, 160), message("참여 내용", false)],
        newsletter: [{ name: "interests", label: "관심 소식", type: "select", required: true, options: [{ value: "all", label: "공연·전시·교육 전체" }, { value: "performance", label: "공연" }, { value: "exhibition", label: "전시" }, { value: "education", label: "교육" }] }],
        membership: [{ name: "interests", label: "관심 분야", type: "select", required: true, options: [{ value: "performance", label: "공연" }, { value: "exhibition", label: "전시" }, { value: "education", label: "교육" }] }, message("가입 상담 내용", false)],
        education: [text("program", "희망 교육 프로그램", true, 160), message("신청·상담 내용")],
        order: [message("상품·수령 관련 요청(선택)", false)],
    };
    return { id: page.path, path: page.path, kind, title: page.form.title, enabled: !page.form.closed, fields: [...common, ...specific[kind]] };
}

export function validateServiceValues(form: ServiceFormDefinition, values: ServiceValues): Record<string, string> {
    const errors: Record<string, string> = {};
    const allowed = new Set([...form.fields.map(field => field.name), "consent"]);
    if (Object.keys(values).some(key => !allowed.has(key))) errors._form = "신청 항목이 변경되었습니다. 입력 내용을 확인해 주세요.";
    if (values.consent !== true) errors.consent = "신청정보 수집·이용에 동의해 주세요.";
    for (const field of form.fields) {
        const value = typeof values[field.name] === "string" ? (values[field.name] as string).trim() : "";
        if (!value) { if (field.required) errors[field.name] = `${field.label}을(를) 입력해 주세요.`; continue; }
        if (field.maxLength && value.length > field.maxLength) errors[field.name] = `${field.maxLength}자 이내로 입력해 주세요.`;
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.name] = "이메일 주소를 확인해 주세요.";
        if (field.type === "tel" && !/^[+\d()\s-]{8,30}$/.test(value)) errors[field.name] = "연락처를 확인해 주세요.";
        if (field.type === "number" && (!/^\d+$/.test(value) || Number(value) < (field.min ?? 0) || Number(value) > (field.max ?? Number.MAX_SAFE_INTEGER))) errors[field.name] = "허용된 범위의 정수를 입력해 주세요.";
        if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) errors[field.name] = "날짜를 확인해 주세요.";
        if (field.type === "select" && !field.options?.some(option => option.value === value)) errors[field.name] = "목록에서 선택해 주세요.";
        if (field.name === "portfolio" && !/^https?:\/\//.test(value)) errors[field.name] = "http 또는 https로 시작하는 주소를 입력해 주세요.";
    }
    if (!errors.date && !errors.endDate && values.date && values.endDate && String(values.endDate) < String(values.date)) errors.endDate = "종료일은 시작일 이후로 선택해 주세요.";
    return errors;
}
