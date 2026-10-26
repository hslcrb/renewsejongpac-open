import { PROGRAMS, VENUES } from "../data/catalog.js";
import {
    esc,
    href,
    icon,
    toast,
    readStore,
    writeStore,
    validateBooking,
    money,
    formatDate,
    navigate,
} from "../lib/core.js";
import { pageHeader, programCard, emptyState, button } from "../components/ui.js";

const bookingDrafts = new Map();
const applicationDrafts = new Map();
const accountState = { cancelId: "", message: "", recovery: "" };
const aliases = {
    "/login": "/account/login",
    "/signup": "/account/signup",
    "/recovery": "/account/recovery",
    "/profile": "/account/profile",
    "/bookings": "/account/bookings",
    "/favorites": "/account/favorites",
    "/applications": "/account/applications",
};
const accountPaths = [
    "/account",
    "/account/login",
    "/account/signup",
    "/account/recovery",
    "/account/profile",
    "/account/bookings",
    "/account/favorites",
    "/account/applications",
];
const labels = {
    "/account": "마이페이지",
    "/account/login": "로그인",
    "/account/signup": "회원가입",
    "/account/recovery": "계정 찾기",
    "/account/profile": "내 정보",
    "/account/bookings": "예매내역",
    "/account/favorites": "관심 프로그램",
    "/account/applications": "신청내역",
};
const safeArray = (key) =>
    readStore(key, []).filter(
        (item) => item && typeof item === "object" && !Array.isArray(item),
    );
function savedBookings() {
    return safeArray("bookings").filter((b) => {
        const program = PROGRAMS.find((p) => p.id === b.programId);
        if (
            typeof b.id !== "string" ||
            !/^[A-Za-z0-9_-]{1,100}$/.test(b.id) ||
            !program ||
            !Array.isArray(b.seats) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(b.date || "") ||
            !/^\d{2}:\d{2}$/.test(b.time || "") ||
            !Number.isFinite(b.total) ||
            b.total < 0
        )
            return false;
        if (program.category === "전시") {
            const quantity = b.quantity ?? b.seats.length;
            return Number.isInteger(quantity) && quantity >= 1 && quantity <= 4;
        }
        return (
            b.seats.length > 0 &&
            b.seats.length <= 4 &&
            b.seats.every((seat) => /^[A-F](?:[1-9]|1[0-2])$/.test(seat))
        );
    });
}
const savedApplications = () =>
    safeArray("applications").filter(
        (a) => typeof a.id === "string" && typeof a.title === "string",
    );
const favoriteIds = () =>
    readStore("favorites", []).filter(
        (id) => typeof id === "string" && PROGRAMS.some((p) => p.id === id),
    );
function profile() {
    const value = readStore("profile", {});
    return {
        name: typeof value.name === "string" ? value.name : "",
        email: typeof value.email === "string" ? value.email : "",
        phone: typeof value.phone === "string" ? value.phone : "",
    };
}
function hasSession() {
    const value = readStore("session", {});
    return value && value.active === true;
}
function reference(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
function frame(title, eyebrow, description, content, extra = "") {
    return `<div class="flow-page ${extra}">${pageHeader({ title, eyebrow, description, group: "account", path: "" })}<div class="container page-content flow-content">${content}</div></div>`;
}
function demoNote(
    text = "입력한 내용은 이 브라우저에만 저장됩니다. 실제 예매·결제·접수가 진행되지 않는 체험 서비스입니다.",
) {
    return `<div class="flow-demo">${icon("ticket", 18)}<p><strong>이용 흐름 체험</strong><span>${text}</span></p></div>`;
}
function actions(backLabel, backAttr, nextLabel, nextAttr = 'type="submit"') {
    return `<div class="flow-actions"><button class="button button--outline" type="button" ${backAttr}>${backLabel}</button><button class="button button--dark" ${nextAttr}>${nextLabel}${icon("arrow", 18)}</button></div>`;
}
function errorBox(message = "") {
    return `<div class="flow-error" id="flow-error" role="alert" tabindex="-1" ${message ? "" : "hidden"}>${esc(message)}</div>`;
}
function steps(current, items) {
    return `<ol class="flow-steps" aria-label="진행 단계">${items.map((item, i) => `<li class="${i + 1 === current ? "is-current" : i + 1 < current ? "is-complete" : ""}" ${i + 1 === current ? 'aria-current="step"' : ""}><span>${i + 1 < current ? icon("check", 16) : String(i + 1).padStart(2, "0")}</span>${esc(item)}</li>`).join("")}</ol>`;
}
function showError(root, message, target) {
    const area = root.querySelector("#flow-error");
    if (area) {
        area.hidden = false;
        area.textContent = message;
        area.focus();
    }
    if (target) {
        const input = root.querySelector(`[name="${target}"]`);
        if (input) {
            input.setAttribute("aria-invalid", "true");
            input.setAttribute("aria-describedby", "flow-error");
            input.focus();
        }
    }
}
function cleanErrors(root) {
    root.querySelectorAll("[aria-invalid]").forEach((input) => {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
    });
    const error = root.querySelector("#flow-error");
    if (error) error.hidden = true;
}
function commonValidation(values, fields) {
    for (const field of fields) {
        const value = String(values[field.name] || "").trim();
        if (field.required !== false && !value)
            return {
                message: `${field.label}${field.type === "select" ? "을(를) 선택" : "을(를) 입력"}해 주세요.`,
                field: field.name,
            };
        if (!value) continue;
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return {
                message: "이메일 주소를 정확하게 입력해 주세요.",
                field: field.name,
            };
        if (field.type === "tel" && !/^[+\d][\d\s()-]{7,19}$/.test(value))
            return {
                message: "연락처를 숫자 8~20자리로 입력해 주세요.",
                field: field.name,
            };
        if (
            field.type === "number" &&
            (!Number.isFinite(Number(value)) ||
                Number(value) < (field.min ?? 1) ||
                Number(value) > (field.max ?? 100000000) ||
                !Number.isInteger(Number(value)))
        )
            return {
                message: `${field.label}: ${field.min ?? 1}~${field.max ?? 100000000} 사이의 정수를 입력해 주세요.`,
                field: field.name,
            };
        if (
            field.type === "select" &&
            !field.options.some(
                (option) => (Array.isArray(option) ? option[0] : option) === value,
            )
        )
            return {
                message: `${field.label}을(를) 다시 선택해 주세요.`,
                field: field.name,
            };
        if (
            field.type === "date" &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
                !Number.isFinite(Date.parse(value)) ||
                new Date(value).toISOString().slice(0, 10) !== value ||
                (field.min && value < field.min) ||
                (field.max && value > field.max))
        )
            return {
                message: "안내된 범위 안에서 날짜를 선택해 주세요.",
                field: field.name,
            };
        const maxLength =
            field.maxlength || (field.type === "textarea" ? 2000 : 200);
        if (value.length > maxLength)
            return {
                message: `${field.label}을(를) ${maxLength}자 이내로 입력해 주세요.`,
                field: field.name,
            };
    }
    return null;
}
function fieldMarkup(field, value = "") {
    const id = `flow-${field.name}`,
        required = field.required !== false;
    const attrs = `id="${id}" name="${field.name}" ${required ? "required" : ""} ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ""} ${field.min !== undefined ? `min="${esc(field.min)}"` : ""} ${field.max !== undefined ? `max="${esc(field.max)}"` : ""}`;
    let input;
    if (field.type === "select")
        input = `<select ${attrs}><option value="">선택해 주세요</option>${field.options
            .map((option) => {
                const [val, label] = Array.isArray(option) ? option : [option, option];
                return `<option value="${esc(val)}" ${value === val ? "selected" : ""}>${esc(label)}</option>`;
            })
            .join("")}</select>`;
    else if (field.type === "textarea")
        input = `<textarea ${attrs} rows="5" maxlength="${field.maxlength || 2000}" placeholder="${esc(field.placeholder || "내용을 입력해 주세요")}">${esc(value)}</textarea>`;
    else
        input = `<input ${attrs} type="${field.type || "text"}" value="${esc(value)}" maxlength="${field.maxlength || 200}" ${field.placeholder ? `placeholder="${esc(field.placeholder)}"` : ""}>`;
    return `<div class="form-field ${field.wide || field.type === "textarea" ? "flow-field--wide" : ""}"><label for="${id}">${esc(field.label)} ${required ? '<span class="flow-required" aria-hidden="true">*</span><span class="sr-only">필수</span>' : '<span class="flow-optional">선택</span>'}</label>${input}${field.hint ? `<small>${esc(field.hint)}</small>` : ""}</div>`;
}
const contactFields = [
    { name: "name", label: "이름", autocomplete: "name", maxlength: 40 },
    { name: "email", label: "이메일", type: "email", autocomplete: "email" },
    {
        name: "phone",
        label: "연락처",
        type: "tel",
        autocomplete: "tel",
        placeholder: "010-1234-5678",
    },
];
function consentMarkup(
    checked = false,
    text = "체험 서비스 안내 및 입력 내용의 브라우저 저장에 동의합니다.",
) {
    return `<label class="flow-consent"><input name="consent" type="checkbox" ${checked ? "checked" : ""} required><span>${esc(text)} <strong>(필수)</strong></span></label>`;
}
function valuesFrom(form) {
    return Object.fromEntries(new FormData(form));
}
function dateList(program) {
    const dates = [];
    const end = new Date(program.end + "T12:00:00Z");
    for (
        let d = new Date(program.start + "T12:00:00Z");
        d <= end && dates.length < 100;
        d.setUTCDate(d.getUTCDate() + 1)
    )
        dates.push(d.toISOString().slice(0, 10));
    return dates;
}
const DISCOUNTS = [
    { id: "general", label: "일반", rate: 0 },
    { id: "membership", label: "멤버십", rate: 10 },
    { id: "youth", label: "청소년", rate: 20 },
];
const selectedDiscount = (draft) =>
    DISCOUNTS.find((d) => d.id === draft.discount) || DISCOUNTS[0];
const discountLabel = (draft) =>
    `${selectedDiscount(draft).label} · ${selectedDiscount(draft).rate}%`;
const ticketCount = (program, draft) =>
    program.category === "전시"
        ? (draft.quantity ?? draft.seats.length)
        : draft.seats.length;
const bookingSelection = (program, draft) =>
    program.category === "전시"
        ? `입장권 ${ticketCount(program, draft)}매 · ${ticketCount(program, draft)}명`
        : draft.seats.map(esc).join(", ");
const bookingTotal = (program, draft) =>
    Math.round(
        (program.price *
            ticketCount(program, draft) *
            (100 - selectedDiscount(draft).rate)) /
            100,
    );
function validateDraftBooking(draft, program) {
    if (program.category !== "전시") return validateBooking(draft, program);
    if (!dateList(program).includes(draft.date))
        return { ok: false, error: "관람 가능한 날짜를 선택해 주세요." };
    if (!program.times.includes(draft.time))
        return { ok: false, error: "관람 시간을 선택해 주세요." };
    if (
        !Number.isInteger(draft.quantity) ||
        draft.quantity < 1 ||
        draft.quantity > 4
    )
        return { ok: false, error: "관람인원을 1~4명으로 선택해 주세요." };
    return { ok: true };
}
function draftFor(program) {
    if (!bookingDrafts.has(program.id))
        bookingDrafts.set(program.id, {
            step: 1,
            date: program.start,
            time: program.times[0],
            seats: [],
            quantity: 1,
            discount: "general",
            customer: profile(),
            consent: false,
            done: null,
            submitting: false,
        });
    return bookingDrafts.get(program.id);
}
function occupied(program, draft) {
    const booked = savedBookings()
        .filter(
            (b) =>
                b.programId === program.id &&
                b.date === draft.date &&
                b.time === draft.time &&
                b.status !== "cancelled",
        )
        .flatMap((b) => b.seats);
    return new Set([
        "A3",
        "A4",
        "A9",
        "B5",
        "B6",
        "C8",
        "C9",
        "D2",
        "E10",
        ...booked,
    ]);
}
function bookingSummary(program, draft) {
    return `<aside class="booking-summary" aria-label="예매 선택 내역"><div class="booking-summary__program"><img src="${esc(program.image)}" alt="${esc(program.title)} 포스터"><div><span class="flow-kicker">${esc(program.genre)}</span><h3>${esc(program.title)}</h3><p>${esc(program.venue)}</p></div></div><dl class="flow-detail-list"><div><dt>관람일</dt><dd>${formatDate(draft.date)}</dd></div><div><dt>관람시간</dt><dd>${esc(draft.time)}</dd></div><div><dt>${program.category === "전시" ? "관람인원" : "선택좌석"}</dt><dd data-seat-summary>${program.category === "전시" ? bookingSelection(program, draft) : draft.seats.length ? bookingSelection(program, draft) : "좌석을 선택해 주세요"}</dd></div><div><dt>티켓가격</dt><dd>${money(program.price)} / 1매</dd></div><div><dt>적용 할인</dt><dd data-discount-summary>${discountLabel(draft)}</dd></div></dl><div class="booking-total"><span>총 <b data-seat-count>${ticketCount(program, draft)}</b>매</span><strong data-booking-total aria-live="polite">${money(bookingTotal(program, draft))}</strong></div><p class="flow-fineprint">${program.category === "전시" ? "시연용 전시 입장권" : "시연용 지정석"} · 최대 4매<br>실제 금액이 청구되지 않습니다.</p></aside>`;
}
function bookingContent(program, draft) {
    if (draft.step === 4 && draft.done)
        return (
            receipt(
                "예매 체험이 완료되었습니다.",
                "선택한 프로그램을 마이페이지에서 다시 확인할 수 있습니다. 실제 관람 티켓은 발급되지 않습니다.",
                draft.done.id,
                `<dl class="flow-detail-list"><div><dt>프로그램</dt><dd>${esc(program.title)}</dd></div><div><dt>일시</dt><dd>${formatDate(draft.date)} ${esc(draft.time)}</dd></div><div><dt>${program.category === "전시" ? "입장권" : "좌석"}</dt><dd>${bookingSelection(program, draft)}</dd></div><div><dt>적용 할인</dt><dd>${discountLabel(draft)}</dd></div><div><dt>체험 예매금액</dt><dd>${money(draft.done.total)}</dd></div></dl>`,
                "/account/bookings",
                "예매내역 확인",
            ) +
            '<div class="flow-restart"><button class="flow-text-button" data-booking-restart>다른 일정으로 다시 예매하기</button></div>'
        );
    let panel = "";
    if (draft.step === 1)
        panel = `<form data-booking-date novalidate><div class="flow-panel-heading"><h2>기대하는 하루를 선택하세요.</h2><p>${formatDate(program.start)} — ${formatDate(program.end)}</p></div>${errorBox()}<div class="form-field"><label for="booking-date">관람일</label><input id="booking-date" name="date" type="date" min="${program.start}" max="${program.end}" value="${esc(draft.date)}" required></div><fieldset class="flow-fieldset"><legend>관람시간</legend><div class="flow-choice-row">${program.times.map((time) => `<label class="flow-radio-choice"><input name="time" type="radio" value="${time}" ${draft.time === time ? "checked" : ""}><span>${time}</span></label>`).join("")}</div></fieldset><div class="flow-info-box"><strong>${esc(program.age)} 관람</strong><p>${esc(program.duration)} · ${esc(program.venue)}<br>일정과 ${program.category === "전시" ? "입장권" : "잔여 좌석"}은 서비스 체험을 위한 예시입니다.</p></div>${actions("프로그램 상세로", `data-go="/programs/${program.id}"`, program.category === "전시" ? "관람인원 선택" : "좌석 선택")}</form>`;
    if (draft.step === 2 && program.category !== "전시") {
        const taken = occupied(program, draft);
        panel = `<div class="flow-panel-heading"><h2>당신의 자리를 골라보세요.</h2><p>원하는 좌석을 최대 4개까지 선택할 수 있습니다.</p></div>${errorBox()}<div class="seat-legend"><span><i></i>선택 가능</span><span><i class="selected"></i>선택한 좌석</span><span><i class="occupied"></i>선택 불가</span></div><div class="seat-map" role="group" aria-label="시연용 좌석 배치도"><div class="seat-stage">STAGE</div><div class="seat-rows">${[
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
        ]
            .map(
                (row) =>
                    `<div class="seat-row"><span class="seat-row-label">${row}</span>${Array.from(
                        { length: 12 },
                        (_, i) => {
                            const seat = row + (i + 1),
                                selected = draft.seats.includes(seat);
                            return `<button type="button" class="seat ${selected ? "is-selected" : ""} ${i === 5 ? "seat--aisle" : ""}" data-seat="${seat}" aria-label="${row}열 ${i + 1}번${taken.has(seat) ? " 선택 불가" : ""}" aria-pressed="${selected}" ${taken.has(seat) ? "disabled" : ""}>${i + 1}</button>`;
                        },
                    ).join("")}</div>`,
            )
            .join(
                "",
            )}</div><p class="seat-caption">시연용 좌석도 · 실제 공연장 배치와 다릅니다.</p></div>${actions("날짜 다시 선택", 'data-booking-back="1"', "선택 내용 확인", 'type="button" data-booking-next="3"')}`;
    }
    if (draft.step === 2 && program.category === "전시")
        panel = `<div class="flow-panel-heading"><h2>함께할 인원을 선택하세요.</h2><p>전시 입장권은 1인당 1매이며 최대 4매까지 예매할 수 있습니다.</p></div>${errorBox()}<fieldset class="flow-fieldset"><legend>관람인원</legend><div class="flow-choice-row admission-choices">${[1, 2, 3, 4].map((quantity) => `<label class="flow-radio-choice"><input type="radio" name="quantity" value="${quantity}" ${draft.quantity === quantity ? "checked" : ""}><span><strong>${quantity}명</strong><small>입장권 ${quantity}매</small></span></label>`).join("")}</div></fieldset><div class="flow-info-box"><strong>자유롭게 만나는 전시의 순간</strong><p>${esc(program.title)}<br>${formatDate(draft.date)} ${esc(draft.time)} 입장 · ${esc(program.venue)}<br>좌석 지정 없이 전시 공간을 자유롭게 관람합니다.</p></div>${actions("날짜 다시 선택", 'data-booking-back="1"', "선택 내용 확인", 'type="button" data-booking-next="3"')}`;
    if (draft.step === 3)
        panel = `<form data-booking-review novalidate><div class="flow-panel-heading"><h2>이제, 설레는 기다림만.</h2><p>선택 내용을 확인하고 체험 예매를 완료하세요.</p></div>${errorBox()}${fieldMarkup({ name: "discount", label: "할인 선택", type: "select", options: DISCOUNTS.map((d) => [d.id, `${d.label} · ${d.rate}%`]), hint: "시연용 할인율입니다. 실제 혜택과 자격 기준은 다르며, 실제 예매 시 멤버십 또는 청소년 자격 확인이 필요합니다. 선택한 할인은 모든 티켓에 적용되며 중복되지 않습니다." }, draft.discount)}<div class="flow-form-grid">${contactFields.map((f) => fieldMarkup(f, draft.customer[f.name] || "")).join("")}</div><div class="flow-info-box"><strong>선택한 일정과 ${program.category === "전시" ? "관람인원" : "좌석"}을 확인해 주세요.</strong><p>${esc(program.title)}<br>${formatDate(draft.date)} ${esc(draft.time)} · ${bookingSelection(program, draft)}<br><span data-review-discount>${discountLabel(draft)}</span> · 총 ${ticketCount(program, draft)}매 · <strong data-review-total>${money(bookingTotal(program, draft))}</strong></p></div>${consentMarkup(draft.consent)}${actions(program.category === "전시" ? "관람인원 수정" : "좌석 수정", 'data-booking-back="2"', "체험 예매 완료")}</form>`;
    return `<div class="booking-layout"><section class="flow-panel">${panel}</section>${bookingSummary(program, draft)}</div>`;
}
function renderBooking(path, query = new URLSearchParams()) {
    const id = path.slice("/booking/".length);
    const program = PROGRAMS.find((p) => p.id === id);
    if (!program)
        return frame(
            "프로그램을 찾을 수 없습니다.",
            "BOOKING",
            "",
            emptyState(
                "예매할 프로그램을 다시 선택해 주세요.",
                "주소가 변경되었거나 제공되지 않는 프로그램입니다.",
                "/programs",
                "프로그램 둘러보기",
            ),
        );
    if (program.category === "교육")
        return frame(
            "교육 신청",
            "LEARN WITH SEJONG",
            "예술을 알아가는 새로운 시작.",
            `${demoNote()}${emptyState("이 프로그램은 교육 신청으로 참여할 수 있습니다.", program.title + "의 수강 정보를 확인하고 신청을 진행해 주세요.", "/apply/education?program=" + program.id, "교육 신청하기")}`,
        );
    const draft = draftFor(program),
        requestedDate = query.get("date") || "";
    if (
        requestedDate &&
        dateList(program).includes(requestedDate) &&
        draft.sourceDate !== requestedDate
    ) {
        draft.date = requestedDate;
        draft.step = 1;
        draft.seats = [];
        draft.quantity = 1;
        draft.discount = "general";
        draft.done = null;
        draft.sourceDate = requestedDate;
    }
    return frame(
        program.category === "전시"
            ? "전시 예매"
            : program.category === "교육"
                ? "프로그램 예매"
                : "공연 예매",
        "BOOK YOUR MOMENT",
        program.category === "전시"
            ? "예술과 만나는 하루, 전시 관람을 준비합니다."
            : "예술과 만나는 하루, 당신의 자리를 준비합니다.",
        `${demoNote()}${steps(draft.step, ["날짜·시간", program.category === "전시" ? "관람인원" : "좌석 선택", "예매 확인", "완료"])}${bookingContent(program, draft)}`,
        "booking-page",
    );
}
function receipt(
    title,
    description,
    id,
    details = "",
    path = "/account/applications",
    label = "신청내역 확인",
) {
    return `<section class="flow-receipt"><div class="receipt-check">${icon("check", 34)}</div><h2 tabindex="-1">${title}</h2><p>${description}</p><div class="receipt-reference"><span>체험 확인번호</span><strong>${esc(id)}</strong></div>${details}<div class="flow-actions">${button("홈으로", "/", "outline")}${button(label, path, "dark")}</div></section>`;
}
const venueOptions = VENUES.map((v) => [v.id, v.name]);
const programOptions = PROGRAMS.map((p) => [p.id, p.title]);
const field = (name, label, type = "text", extra = {}) => ({
    name,
    label,
    type,
    ...extra,
});
const formConfigs = {
    "/news/events/autumn-walk/apply": {
        title: "가을의 취향을 나누다 · 이벤트 응모",
        eyebrow: "SHARE YOUR AUTUMN",
        description: "당신의 가을에 어울리는 공연과 이야기를 들려주세요.",
        intro:
            "관심 있는 공연과 기대평을 남기는 이벤트 응모 체험입니다. 실제 응모나 경품 추첨에 참여하지 않습니다.",
        contactFields: contactFields.slice(0, 2),
        fields: [
            field("program", "관심 있는 공연", "select", {
                options: PROGRAMS.filter((p) => p.category === "공연").map((p) => [
                    p.id,
                    p.title,
                ]),
                wide: true,
            }),
            field("message", "나의 가을 취향과 기대평", "textarea", {
                hint: "선택한 공연을 보고 싶은 이유를 자유롭게 작성해 주세요.",
            }),
        ],
    },
    "/news/events/review/apply": {
        title: "관람 후기 이벤트 응모",
        eyebrow: "YOUR MOMENT, YOUR STORY",
        description: "오래 남은 예술의 순간을 나누어 주세요.",
        intro:
            "관람 후기를 작성하는 이벤트 응모 체험입니다. 실제 응모나 경품 추첨에 참여하지 않습니다.",
        contactFields: contactFields.slice(0, 2),
        fields: [
            field("program", "후기를 남길 공연", "select", {
                options: PROGRAMS.filter((p) => p.category === "공연").map((p) => [
                    p.id,
                    p.title,
                ]),
                wide: true,
            }),
            field("message", "관람 후기", "textarea", {
                hint: "기억에 남는 장면이나 감상을 작성해 주세요. 시연용 후기로도 체험할 수 있습니다.",
            }),
        ],
    },
    "/rental/apply": {
        title: "대관신청",
        eyebrow: "A STAGE FOR YOUR STORY",
        description: "당신의 무대를 세종에서 펼쳐보세요.",
        intro:
            "행사와 공간에 대한 정보를 남겨주세요. 신청 내용을 검토하는 과정을 체험할 수 있습니다.",
        fields: [
            field("organization", "단체·기관명"),
            field("event", "행사명"),
            field("venue", "희망 시설", "select", { options: venueOptions }),
            field("date", "희망 대관일", "date", {
                min: "2026-10-01",
                max: "2027-12-31",
            }),
            field("category", "행사 유형", "select", {
                options: ["공연", "전시", "강연·행사", "기타"],
            }),
            field("participants", "예상 관람인원", "number", { min: 1, max: 3022 }),
            field("message", "행사 소개 및 운영 계획", "textarea", {
                hint: "주요 출연진, 일정, 필요한 무대 장비를 알려주세요.",
            }),
        ],
    },
    "/rental/contact": {
        title: "대관문의",
        eyebrow: "LET’S MAKE IT HAPPEN",
        description: "무대를 준비하는 첫걸음, 궁금한 점을 나눠주세요.",
        intro: "시설과 대관 절차에 대한 궁금한 사항을 작성해 주세요.",
        fields: [
            field("venue", "문의 시설", "select", { options: venueOptions }),
            field("category", "문의 유형", "select", {
                options: ["대관 일정", "대관 요금", "시설·장비", "신청 절차", "기타"],
            }),
            field("subject", "문의 제목", "text", { wide: true }),
            field("message", "문의 내용", "textarea"),
        ],
    },
    "/visit/support/inquiry": {
        title: "문의하기",
        eyebrow: "WE ARE HERE FOR YOU",
        description: "더 나은 관람 경험을 위해 귀 기울이겠습니다.",
        intro: "예매와 관람, 시설 이용에 관한 문의 내용을 작성해 주세요.",
        fields: [
            field("category", "문의 유형", "select", {
                options: [
                    "예매·취소",
                    "공연·전시",
                    "편의시설·주차",
                    "접근성 지원",
                    "건의사항",
                    "기타",
                ],
            }),
            field("subject", "문의 제목"),
            field("message", "문의 내용", "textarea"),
        ],
    },
    "/visit/group": {
        title: "단체관람 신청",
        eyebrow: "ART IS BETTER TOGETHER",
        description: "함께 나누면 더 깊어지는 예술의 순간.",
        intro:
            "10인 이상 단체의 희망 관람 정보를 남겨주세요. 실제 할인이나 좌석은 확정되지 않습니다.",
        fields: [
            field("organization", "단체명"),
            field("program", "희망 프로그램", "select", { options: programOptions }),
            field("date", "희망 관람일", "date", {
                min: "2026-10-01",
                max: "2026-12-31",
            }),
            field("participants", "관람인원", "number", { min: 10, max: 1000 }),
            field("message", "요청사항", "textarea", { required: false }),
        ],
    },
    "/apply/education": {
        title: "교육 신청",
        eyebrow: "OPEN YOUR MIND TO ART",
        description: "예술을 알아가는 즐거움, 새로운 배움의 시작.",
        intro:
            "참여할 강좌와 수강 정보를 확인해 주세요. 수강료가 결제되거나 실제 수강 등록이 이루어지지 않습니다.",
        fields: [
            field("program", "수강 프로그램", "select", {
                options: PROGRAMS.filter((p) => p.category === "교육").map((p) => [
                    p.id,
                    `${p.title} · ${money(p.price)}`,
                ]),
                wide: true,
            }),
            field("participants", "신청인원", "number", { min: 1, max: 4 }),
            field("message", "수강 동기 및 요청사항", "textarea", {
                required: false,
            }),
        ],
    },
    "/news/membership/join": {
        title: "멤버십 가입",
        eyebrow: "CLOSER TO THE ARTS",
        description: "예술과 더 가까워지는 방법.",
        intro:
            "관심 분야를 선택하고 나만의 세종 멤버십을 체험해 보세요. 실제 회원 서비스에는 가입되지 않습니다.",
        fields: [
            field("membership", "멤버십 종류", "select", {
                options: ["일반회원 · 무료"],
            }),
            field("interest", "관심 분야", "select", {
                options: [
                    "클래식·오페라",
                    "연극·뮤지컬",
                    "무용·발레",
                    "국악·합창",
                    "전시·교육",
                    "모든 예술",
                ],
            }),
        ],
    },
    "/about/donation/apply": {
        title: "후원 참여",
        eyebrow: "GIVE ART A TOMORROW",
        description: "당신의 마음이 예술의 내일이 됩니다.",
        intro:
            "희망하는 후원 방식과 관심 분야를 남겨주세요. 후원금은 청구되지 않습니다.",
        fields: [
            field("type", "희망 후원 방식", "select", {
                options: ["정기후원", "일시후원", "법인·단체 후원"],
            }),
            field("amount", "희망 후원금액 (원)", "number", {
                min: 1000,
                max: 100000000,
            }),
            field("purpose", "관심 후원 분야", "select", {
                options: [
                    "예술창작 지원",
                    "문화소외계층 관람 지원",
                    "어린이·청소년 예술교육",
                    "공간과 시설 개선",
                ],
            }),
            field("message", "전하고 싶은 말", "textarea", { required: false }),
        ],
    },
    "/about/partners/apply": {
        title: "협력·협찬 제안",
        eyebrow: "CREATE MORE, TOGETHER",
        description: "예술과 브랜드, 새로운 가능성을 함께 만듭니다.",
        intro: "함께하고 싶은 프로젝트의 이야기를 들려주세요.",
        fields: [
            field("organization", "기업·기관명"),
            field("type", "협력 유형", "select", {
                options: [
                    "공연·전시 협찬",
                    "공동 프로젝트",
                    "물품·서비스 협찬",
                    "문화예술 캠페인",
                    "기타",
                ],
            }),
            field("subject", "제안 제목", "text", { wide: true }),
            field("message", "제안 내용", "textarea", {
                hint: "협력 목적, 예상 일정, 지원 규모 등을 자유롭게 작성해 주세요.",
            }),
        ],
    },
    "/about/disclosure/request": {
        title: "정보공개 청구",
        eyebrow: "OPEN AND TRANSPARENT",
        description: "시민과 함께하는 투명한 문화기관.",
        intro:
            "정보공개 청구서 작성 흐름을 체험합니다. 이 신청은 법적 정보공개 청구로 접수되지 않으며 처리 기한이 발생하지 않습니다.",
        fields: [
            field("subject", "청구 제목", "text", { wide: true }),
            field("category", "정보 분야", "select", {
                options: ["기관 운영", "예산·재정", "사업·성과", "시설·대관", "기타"],
            }),
            field("method", "희망 공개 방법", "select", {
                options: ["전자파일", "열람", "사본"],
            }),
            field("message", "청구 내용", "textarea", {
                hint: "필요한 정보의 기간과 범위를 구체적으로 작성해 주세요. 주민등록번호 등 민감정보는 입력하지 마세요.",
            }),
        ],
    },
    "/about/disclosure/ethics": {
        title: "부패신고·규제혁신센터",
        eyebrow: "A BETTER SEJONG",
        description: "공정하고 신뢰받는 세종을 위한 목소리.",
        intro:
            "의견 제출 흐름을 체험하는 화면입니다. 실제 신고가 접수되지 않으므로 실제 사건이나 개인의 민감정보를 입력하지 마세요.",
        fields: [
            field("category", "의견 유형", "select", {
                options: [
                    "윤리경영 의견",
                    "규제개선 제안",
                    "공정거래 의견",
                    "기타 건의",
                ],
            }),
            field("subject", "제목"),
            field("message", "의견 내용", "textarea"),
        ],
    },
};
function applicationDraft(path, query) {
    const key = path + "?" + query.toString();
    if (!applicationDrafts.has(key)) {
        const values = {
                ...profile(),
                participants: path === "/visit/group" ? "10" : "1",
                ...(path.includes("membership")
                    ? { membership: "일반회원 · 무료" }
                    : {}),
            },
            invalidPrefills = [];
        for (const name of ["program", "venue", "date", "subject"]) {
            const configField = formConfigs[path].fields.find((f) => f.name === name);
            if (!configField || !query.has(name)) continue;
            const value = query.get(name) || "";
            if (!value || commonValidation({ [name]: value }, [configField]))
                invalidPrefills.push(configField.label);
            else values[name] = value;
        }
        applicationDrafts.set(key, {
            step: 1,
            values,
            prefillWarning: invalidPrefills.length
                ? `링크의 ${invalidPrefills.join(", ")} 정보가 유효하지 않습니다. 아래에서 다시 선택해 주세요.`
                : "",
            done: null,
            submitting: false,
        });
    }
    return applicationDrafts.get(key);
}
function fieldDisplay(field, value) {
    if (field.type === "select") {
        const match = field.options.find(
            (option) => (Array.isArray(option) ? option[0] : option) === value,
        );
        return Array.isArray(match) ? match[1] : value;
    }
    return value;
}
function renderApplication(path, query) {
    const config = formConfigs[path];
    if (
        path === "/apply/education" &&
        query.has("program") &&
        !PROGRAMS.some(
            (p) => p.category === "교육" && p.id === query.get("program"),
        )
    )
        return frame(
            config.title,
            config.eyebrow,
            config.description,
            `${demoNote()}${emptyState("신청할 교육 프로그램을 찾을 수 없습니다.", "주소의 프로그램이 없거나 교육 프로그램이 아닙니다. 목록에서 강좌를 다시 선택해 주세요.", "/programs/education", "교육 프로그램 보기")}`,
            "application-page",
        );
    const draft = applicationDraft(path, query),
        applicantFields = config.contactFields || contactFields,
        allFields = [...applicantFields, ...config.fields];
    let content;
    if (draft.step === 3 && draft.done)
        content =
            receipt(
                "신청 체험이 완료되었습니다.",
                "작성한 내용은 이 브라우저의 신청내역에 저장되었습니다. 기관에 실제로 전송되지 않았습니다.",
                draft.done.id,
                `<dl class="flow-detail-list"><div><dt>신청 유형</dt><dd>${esc(config.title)}</dd></div><div><dt>신청자</dt><dd>${esc(draft.values.name)}</dd></div></dl>`,
            ) +
            `<div class="flow-restart"><button class="flow-text-button" data-application-restart>새로운 신청 작성하기</button></div>`;
    else if (draft.step === 2)
        content = `<section class="flow-panel flow-form-panel"><div class="flow-panel-heading"><h2>작성하신 내용을 확인해 주세요.</h2><p>수정이 필요하면 이전 단계로 돌아갈 수 있습니다.</p></div>${errorBox()}<dl class="flow-review-list">${allFields.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(fieldDisplay(f, draft.values[f.name] || "")) || "—"}</dd></div>`).join("")}</dl><p class="flow-fineprint">신청 내용은 현재 기기의 브라우저에만 저장됩니다.</p>${actions("내용 수정", "data-application-back", "신청 체험 완료", 'type="button" data-application-submit')}</section>`;
    else
        content = `<form class="flow-panel flow-form-panel" data-application-form novalidate><div class="flow-panel-heading"><h2>${esc(config.title)} 작성</h2><p>${esc(config.intro)}</p></div>${errorBox(draft.prefillWarning)}<h3 class="flow-form-section-title">신청자 정보 <small>* 필수 입력</small></h3><div class="flow-form-grid">${applicantFields.map((f) => fieldMarkup(f, draft.values[f.name] || "")).join("")}</div><h3 class="flow-form-section-title">${esc(config.title)} 정보</h3><div class="flow-form-grid">${config.fields.map((f) => fieldMarkup(f, draft.values[f.name] || "")).join("")}</div>${consentMarkup(draft.values.consent === "on")}${actions("관련 안내로", `data-go="${parentPage(path)}"`, "작성 내용 확인")}</form>`;
    return frame(
        config.title,
        config.eyebrow,
        config.description,
        `${demoNote()}${steps(draft.step, ["정보 입력", "내용 확인", "완료"])}${content}`,
        "application-page",
    );
}
function parentPage(path) {
    return (
        {
            "/news/events/autumn-walk/apply": "/news/events/autumn-walk",
            "/news/events/review/apply": "/news/events/review",
            "/rental/apply": "/rental/process",
            "/rental/contact": "/rental",
            "/visit/support/inquiry": "/visit/support",
            "/visit/group": "/visit",
            "/apply/education": "/programs/education",
            "/news/membership/join": "/news/membership",
            "/about/donation/apply": "/about/donation",
            "/about/partners/apply": "/about/partners",
            "/about/disclosure/request": "/about/disclosure",
            "/about/disclosure/ethics": "/about/disclosure",
        }[path] || "/"
    );
}
function accountNav(path) {
    return `<nav class="account-nav" aria-label="마이페이지 메뉴">${[
        ["/account", "마이페이지"],
        ["/account/bookings", "예매내역"],
        ["/account/favorites", "관심 프로그램"],
        ["/account/applications", "신청내역"],
        ["/account/profile", "내 정보"],
    ]
        .map(
            ([url, title]) =>
                `<a href="${href(url)}" ${path === url ? 'aria-current="page"' : ""}>${title}</a>`,
        )
        .join("")}</nav>`;
}
function dashboard() {
    const user = profile(),
        bookings = savedBookings().filter((b) => b.status !== "cancelled");
    return `<section class="account-welcome"><div><h2>${esc(hasSession() ? user.name || "관람객" : "관람객")}님,<br>오늘도 예술 가까이.</h2><p>${hasSession() ? "나의 문화생활을 한곳에서 만나보세요." : "체험 프로필을 만들고 나만의 문화생활을 모아보세요."}</p></div>${hasSession() ? '<button class="button button--outline" data-logout>체험 로그아웃</button>' : button("체험 로그인", "/account/login", "dark")}</section><div class="account-stats">${[
        ["예매내역", bookings.length, "bookings", "ticket"],
        ["관심 프로그램", favoriteIds().length, "favorites", "heart"],
        ["신청내역", savedApplications().length, "applications", "mail"],
    ]
        .map(
            ([name, count, url, ic]) =>
                `<a href="${href("/account/" + url)}">${icon(ic, 26)}<span>${name}</span><strong>${count}<small>건</small></strong>${icon("arrow", 20)}</a>`,
        )
        .join(
            "",
        )}</div><div class="account-feature"><div><h3>다음 감동을 만나볼까요?</h3><p>공연부터 전시, 배움의 순간까지.<br>당신을 기다리는 프로그램을 찾아보세요.</p></div>${button("프로그램 둘러보기", "/programs", "dark")}</div>`;
}
function bookingList() {
    const bookings = savedBookings().slice().reverse();
    if (!bookings.length)
        return emptyState(
            "아직 예매한 프로그램이 없습니다.",
            "새로운 예술의 순간을 만나보세요. 체험 예매내역이 이곳에 표시됩니다.",
            "/programs",
            "프로그램 둘러보기",
        );
    return `<div class="account-list">${bookings
        .map((booking) => {
            const p = PROGRAMS.find((p) => p.id === booking.programId),
                cancelled = booking.status === "cancelled";
            return `<article class="account-booking"><img src="${esc(p.image)}" alt="${esc(p.title)} 포스터"><div class="account-booking__body"><div class="flow-record-top"><span class="flow-tag ${cancelled ? "is-muted" : ""}">${cancelled ? "취소 완료" : "체험 예매 완료"}</span><small>${esc(booking.id)}</small></div><a href="${href("/programs/" + p.id)}"><h3>${esc(p.title)}</h3></a><p>${formatDate(booking.date)} ${esc(booking.time)} · ${esc(p.venue)}</p><p>${p.category === "전시" ? bookingSelection(p, booking) : "좌석 " + bookingSelection(p, booking)} · ${money(booking.total)} · ${discountLabel(booking)}</p>${!cancelled ? (accountState.cancelId === booking.id ? `<div class="booking-cancel-confirm" role="alertdialog" aria-labelledby="cancel-title" aria-describedby="cancel-description"><h4 id="cancel-title">이 체험 예매를 취소할까요?</h4><p id="cancel-description">${p.category === "전시" ? "입장권 예매내역이 취소 상태로 변경됩니다." : "선택한 좌석이 다시 예매 가능한 상태로 변경됩니다."}</p><div><button class="button button--outline" data-cancel-dismiss>예매 유지</button><button class="button button--dark" data-cancel-confirm="${esc(booking.id)}">취소 확정</button></div></div>` : `<button class="flow-text-button" data-cancel-booking="${esc(booking.id)}">예매 취소</button>`) : ""}</div></article>`;
        })
        .join("")}</div>`;
}
function favoriteList() {
    const ids = [...new Set(favoriteIds())];
    if (!ids.length)
        return emptyState(
            "관심 프로그램을 모아보세요.",
            "마음에 드는 프로그램의 하트를 누르면 이곳에서 다시 만날 수 있습니다.",
            "/programs",
            "프로그램 둘러보기",
        );
    return `<div class="flow-favorites">${ids
        .map((id) => {
            const p = PROGRAMS.find((p) => p.id === id);
            return `<div class="flow-favorite">${programCard(p)}<button class="flow-text-button" data-remove-favorite="${esc(id)}" aria-label="${esc(p.title)} 관심 목록에서 삭제">${icon("close", 16)} 관심 목록에서 삭제</button></div>`;
        })
        .join("")}</div>`;
}
function applicationList() {
    const records = savedApplications().slice().reverse();
    if (!records.length)
        return emptyState(
            "아직 신청한 내역이 없습니다.",
            "대관, 교육, 단체관람 등 체험 신청을 완료하면 내역이 표시됩니다.",
            "/programs/education",
            "교육 프로그램 보기",
        );
    return `<div class="account-applications">${records
        .map(
            (a) =>
                `<details class="application-record"><summary><div><span class="flow-tag">${a.status === "cancelled" ? "철회 완료" : "체험 저장 완료"}</span><h3>${esc(a.title)}</h3><p>${esc(formatDate(String(a.createdAt || "").slice(0, 10)))} · ${esc(a.id)}</p></div>${icon("plus", 22)}</summary><div class="application-record__details"><p>현재 브라우저에 저장된 체험 신청입니다. 실제 접수 내역이 아닙니다.</p><dl class="flow-review-list">${
                    Array.isArray(a.fields)
                        ? a.fields
                                .filter(
                                    (f) =>
                                        f &&
                                        typeof f.label === "string" &&
                                        typeof f.value === "string",
                                )
                                .map(
                                    (f) =>
                                        `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value) || "—"}</dd></div>`,
                                )
                                .join("")
                        : ""
                }</dl>${a.status !== "cancelled" ? `<button class="flow-text-button" data-withdraw-application="${esc(a.id)}">체험 신청 철회</button>` : ""}</div></details>`,
        )
        .join("")}</div>`;
}
function loginForm(signup = false) {
    const user = profile();
    return `
        <div class="account-auth-layout">
            <section class="account-auth-intro" aria-labelledby="account-intro-title">

                <h2 id="account-intro-title">좋아하는 예술로<br>채우는 나의 일상.</h2>
                <p>${signup ? "관심 가는 프로그램을 모으고, 다음 관람을 준비해 보세요." : "나의 예매와 관심 프로그램을 한곳에서 만나보세요."}</p>
                <img class="account-auth-photo" src="../assets/images/sejong-grand-auditorium.png" width="1160" height="680" alt="세종대극장의 객석">
                <span class="account-auth-caption">예술과 가까워지는 나만의 공간.</span>
            </section>
            <form class="flow-panel" data-account-auth="${signup ? "signup" : "login"}" novalidate>
                <h2>${signup ? "체험 프로필 만들기" : "체험 로그인"}</h2>
                <p class="flow-fineprint">이 브라우저에서만 사용하는 체험 프로필입니다. 실제 회원 인증과 연결되지 않으며 비밀번호는 입력하지 않습니다.</p>
                ${errorBox()}
                ${fieldMarkup(contactFields[0], user.name || (!signup ? "예술을 사랑하는 관람객" : ""))}
                ${fieldMarkup(contactFields[1], user.email || (!signup ? "visitor@example.com" : ""))}
                ${signup ? fieldMarkup({ ...contactFields[2], required: false }, user.phone) : ""}
                ${consentMarkup(false, "체험 프로필을 이 브라우저에 저장하는 데 동의합니다.")}
                <button class="button button--dark flow-button-full" type="submit">${signup ? "프로필 만들기" : "체험 시작하기"}${icon("arrow", 18)}</button>
                <div class="account-auth-links">${signup ? `<a href="${href("/account/login")}">로그인으로 돌아가기</a>` : `<a href="${href("/account/signup")}">회원가입 체험</a><a href="${href("/account/recovery")}">저장된 계정 찾기</a>`}</div>
            </form>
        </div>`;
}
function recoveryForm() {
    return `<form class="flow-panel account-narrow" data-recovery novalidate><div class="flow-panel-heading"><h2>이 브라우저의 체험 계정 찾기</h2><p>프로필에 입력했던 이메일을 확인합니다. 비밀번호는 저장되지 않으며 복구 메일도 발송되지 않습니다.</p></div>${errorBox()}${fieldMarkup(contactFields[1])}<button class="button button--dark flow-button-full" type="submit">저장된 프로필 확인</button>${accountState.recovery ? `<div class="flow-info-box" role="status">${esc(accountState.recovery)}</div>` : ""}<div class="account-auth-links"><a href="${href("/account/login")}">체험 로그인</a><a href="${href("/account/signup")}">새 프로필 만들기</a></div></form>`;
}
function profileForm() {
    const user = profile();
    return `<form class="flow-panel account-narrow" data-profile novalidate><div class="flow-panel-heading"><h2>내 체험 프로필</h2><p>예매·신청 입력에 사용할 기본 정보를 저장하세요.</p></div>${errorBox()}${contactFields.map((f) => fieldMarkup({ ...f, required: f.name !== "phone" }, user[f.name])).join("")}<button class="button button--dark" type="submit">변경사항 저장${icon("check", 18)}</button>${accountState.message ? `<p class="flow-success" role="status">${esc(accountState.message)}</p>` : ""}</form>`;
}
function renderAccount(path) {
    let content = "";
    const auth =
        path === "/account/login" ||
        path === "/account/signup" ||
        path === "/account/recovery";
    if (path === "/account") content = dashboard();
    if (path === "/account/bookings") content = bookingList();
    if (path === "/account/favorites") content = favoriteList();
    if (path === "/account/applications") content = applicationList();
    if (path === "/account/login" || path === "/account/signup")
        content = loginForm(path.endsWith("signup"));
    if (path === "/account/recovery") content = recoveryForm();
    if (path === "/account/profile") content = profileForm();
    return frame(
        labels[path],
        "MY SEJONG",
        "예술로 채워지는 나의 일상, 나만의 세종.",
        `${!auth ? accountNav(path) : ""}${demoNote("현재 브라우저에서 사용하는 체험 서비스입니다. 실제 회원정보나 기관의 예매·신청 내역과 연결되지 않습니다.")}${content}`,
        "account-page",
    );
}

export function renderFlows(path, query = new URLSearchParams()) {
    path = aliases[path] || path;
    if (path.startsWith("/booking/")) return renderBooking(path, query);
    if (formConfigs[path]) return renderApplication(path, query);
    if (accountPaths.includes(path)) return renderAccount(path);
    return null;
}
export function bindFlows(root, path, query = new URLSearchParams()) {
    path = aliases[path] || path;
    const area = root.matches?.(".flow-page")
        ? root
        : root.querySelector(".flow-page");
    if (!area) return;
    const redraw = (focusSelector) => {
        const html = renderFlows(path, query);
        if (!html) return;
        const wrap = document.createElement("div");
        wrap.innerHTML = html;
        const next = wrap.firstElementChild;
        area.replaceWith(next);
        bindFlows(next, path, query);
        if (focusSelector) next.querySelector(focusSelector)?.focus();
    };
    area
        .querySelectorAll("[data-go]")
        .forEach((btn) =>
            btn.addEventListener("click", () => navigate(btn.dataset.go)),
        );
    area
        .querySelectorAll("input,select,textarea")
        .forEach((input) =>
            input.addEventListener("input", () =>
                input.removeAttribute("aria-invalid"),
            ),
        );
    if (path.startsWith("/booking/")) {
        const program = PROGRAMS.find(
            (p) => p.id === path.slice("/booking/".length),
        );
        if (!program) return;
        const draft = draftFor(program);
        area
            .querySelector("[data-booking-restart]")
            ?.addEventListener("click", () => {
                bookingDrafts.delete(program.id);
                redraw("#booking-date");
            });
        area
            .querySelector("[data-booking-date]")
            ?.addEventListener("submit", (event) => {
                event.preventDefault();
                cleanErrors(area);
                const values = valuesFrom(event.currentTarget);
                if (!dateList(program).includes(values.date))
                    return showError(area, "관람 가능한 날짜를 선택해 주세요.", "date");
                if (!program.times.includes(values.time))
                    return showError(area, "관람 시간을 선택해 주세요.", "time");
                if (draft.date !== values.date || draft.time !== values.time)
                    draft.seats = [];
                draft.date = values.date;
                draft.time = values.time;
                draft.step = 2;
                redraw(
                    program.category === "전시"
                        ? "[name=quantity]:checked"
                        : "[data-seat]:not(:disabled)",
                );
            });
        area.querySelectorAll("[data-booking-back]").forEach((btn) =>
            btn.addEventListener("click", () => {
                const form = area.querySelector("[data-booking-review]");
                if (form) {
                    const values = valuesFrom(form);
                    draft.customer = {
                        name: values.name || "",
                        email: values.email || "",
                        phone: values.phone || "",
                    };
                    draft.consent = values.consent === "on";
                }
                draft.step = Number(btn.dataset.bookingBack);
                redraw(
                    draft.step === 1
                        ? "#booking-date"
                        : program.category === "전시"
                            ? "[name=quantity]:checked"
                            : "[data-seat]:not(:disabled)",
                );
            }),
        );
        area.querySelectorAll("[data-seat]").forEach((btn) =>
            btn.addEventListener("click", () => {
                const seat = btn.dataset.seat;
                if (occupied(program, draft).has(seat)) return;
                const current = draft.seats.indexOf(seat);
                if (current >= 0) draft.seats.splice(current, 1);
                else if (draft.seats.length >= 4) {
                    showError(area, "한 번에 최대 4개의 좌석을 선택할 수 있습니다.");
                    return;
                } else draft.seats.push(seat);
                draft.seats.sort(
                    (a, b) =>
                        a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1)),
                );
                cleanErrors(area);
                btn.classList.toggle("is-selected", draft.seats.includes(seat));
                btn.setAttribute("aria-pressed", String(draft.seats.includes(seat)));
                area.querySelector("[data-seat-summary]").textContent =
                    draft.seats.join(", ") || "좌석을 선택해 주세요";
                area.querySelector("[data-seat-count]").textContent =
                    draft.seats.length;
                area.querySelector("[data-booking-total]").textContent = money(
                    bookingTotal(program, draft),
                );
            }),
        );
        area.querySelectorAll("[name=quantity]").forEach((input) =>
            input.addEventListener("change", () => {
                draft.quantity = Number(input.value);
                const result = validateDraftBooking(draft, program);
                if (!result.ok) return showError(area, result.error, "quantity");
                cleanErrors(area);
                area.querySelector("[data-seat-summary]").textContent =
                    bookingSelection(program, draft);
                area.querySelector("[data-seat-count]").textContent = ticketCount(
                    program,
                    draft,
                );
                area.querySelector("[data-booking-total]").textContent = money(
                    bookingTotal(program, draft),
                );
            }),
        );
        area.querySelector("[data-booking-next]")?.addEventListener("click", () => {
            if (program.category === "전시")
                draft.quantity = Number(
                    area.querySelector("[name=quantity]:checked")?.value,
                );
            const result = validateDraftBooking(draft, program);
            if (!result.ok) return showError(area, result.error);
            draft.step = 3;
            redraw("#flow-name");
        });
        area
            .querySelector("[name=discount]")
            ?.addEventListener("change", (event) => {
                const value = event.target.value;
                if (!DISCOUNTS.some((d) => d.id === value))
                    return showError(
                        area,
                        "안내된 할인 종류를 선택해 주세요.",
                        "discount",
                    );
                draft.discount = value;
                cleanErrors(area);
                area.querySelector("[data-discount-summary]").textContent =
                    discountLabel(draft);
                area.querySelector("[data-booking-total]").textContent = money(
                    bookingTotal(program, draft),
                );
                area.querySelector("[data-review-discount]").textContent =
                    discountLabel(draft);
                area.querySelector("[data-review-total]").textContent = money(
                    bookingTotal(program, draft),
                );
            });
        area
            .querySelector("[data-booking-review]")
            ?.addEventListener("submit", (event) => {
                event.preventDefault();
                if (draft.submitting || draft.done) return;
                cleanErrors(area);
                const values = valuesFrom(event.currentTarget);
                if (!DISCOUNTS.some((d) => d.id === values.discount))
                    return showError(
                        area,
                        "안내된 할인 종류를 선택해 주세요.",
                        "discount",
                    );
                draft.discount = values.discount;
                const invalid = commonValidation(values, contactFields);
                if (invalid) return showError(area, invalid.message, invalid.field);
                if (values.consent !== "on")
                    return showError(
                        area,
                        "체험 서비스 안내 및 브라우저 저장에 동의해 주세요.",
                        "consent",
                    );
                const result = validateDraftBooking(draft, program);
                if (!result.ok) return showError(area, result.error);
                if (
                    !program.times.includes(draft.time) ||
                    (program.category !== "전시" &&
                        draft.seats.some((seat) => occupied(program, draft).has(seat)))
                )
                    return showError(
                        area,
                        "선택한 좌석의 상태가 변경되었습니다. 이전 단계에서 다시 선택해 주세요.",
                    );
                draft.submitting = true;
                draft.customer = {
                    name: values.name.trim(),
                    email: values.email.trim(),
                    phone: values.phone.trim(),
                };
                draft.consent = true;
                const booking = {
                    id: reference("SJ"),
                    programId: program.id,
                    date: draft.date,
                    time: draft.time,
                    seats: [...draft.seats],
                    quantity: ticketCount(program, draft),
                    ticketType: program.category === "전시" ? "admission" : "reserved",
                    subtotal: program.price * ticketCount(program, draft),
                    discount: draft.discount,
                    discountRate: selectedDiscount(draft).rate,
                    total: bookingTotal(program, draft),
                    status: "confirmed",
                    createdAt: new Date().toISOString(),
                };
                const stored = writeStore("bookings", [...savedBookings(), booking]);
                draft.done = booking;
                draft.step = 4;
                draft.submitting = false;
                redraw(".flow-receipt h2");
                if (!stored)
                    toast("브라우저 저장이 제한되어 현재 세션에서만 확인할 수 있습니다.");
            });
        return;
    }
    if (formConfigs[path]) {
        const config = formConfigs[path],
            draft = applicationDraft(path, query),
            fields = [...(config.contactFields || contactFields), ...config.fields];
        area
            .querySelector("[data-application-restart]")
            ?.addEventListener("click", () => {
                applicationDrafts.delete(path + "?" + query.toString());
                redraw("#flow-name");
            });
        area
            .querySelector("[data-application-form]")
            ?.addEventListener("submit", (event) => {
                event.preventDefault();
                cleanErrors(area);
                const values = valuesFrom(event.currentTarget);
                draft.values = values;
                draft.prefillWarning = "";
                const invalid = commonValidation(values, fields);
                if (invalid) return showError(area, invalid.message, invalid.field);
                if (path === "/visit/group") {
                    const program = PROGRAMS.find((p) => p.id === values.program);
                    if (
                        !program ||
                        values.date < program.start ||
                        values.date > program.end
                    )
                        return showError(
                            area,
                            `선택한 프로그램의 일정(${formatDate(program?.start)}~${formatDate(program?.end)}) 안에서 관람일을 선택해 주세요.`,
                            "date",
                        );
                }
                if (values.consent !== "on")
                    return showError(
                        area,
                        "체험 신청 내용의 브라우저 저장에 동의해 주세요.",
                        "consent",
                    );
                draft.step = 2;
                redraw("[data-application-submit]");
            });
        area
            .querySelector("[data-application-back]")
            ?.addEventListener("click", () => {
                draft.step = 1;
                redraw("#flow-name");
            });
        area
            .querySelector("[data-application-submit]")
            ?.addEventListener("click", () => {
                if (draft.submitting || draft.done) return;
                draft.submitting = true;
                const record = {
                    id: reference("APP"),
                    type: path,
                    title: config.title,
                    createdAt: new Date().toISOString(),
                    status: "saved",
                    fields: fields.map((f) => ({
                        label: f.label,
                        value: String(fieldDisplay(f, draft.values[f.name] || "")),
                    })),
                };
                const stored = writeStore("applications", [
                    ...savedApplications(),
                    record,
                ]);
                draft.done = record;
                draft.step = 3;
                draft.submitting = false;
                redraw(".flow-receipt h2");
                if (!stored)
                    toast("브라우저 저장이 제한되어 현재 세션에서만 확인할 수 있습니다.");
            });
        return;
    }
    if (accountPaths.includes(path)) {
        area
            .querySelector("[data-account-auth]")
            ?.addEventListener("submit", (event) => {
                event.preventDefault();
                cleanErrors(area);
                const values = valuesFrom(event.currentTarget),
                    fields =
                        event.currentTarget.dataset.accountAuth === "signup"
                            ? contactFields.map((f) => ({
                                    ...f,
                                    required: f.name !== "phone",
                                }))
                            : contactFields.slice(0, 2);
                const invalid = commonValidation(values, fields);
                if (invalid) return showError(area, invalid.message, invalid.field);
                if (values.consent !== "on")
                    return showError(
                        area,
                        "체험 프로필의 브라우저 저장에 동의해 주세요.",
                        "consent",
                    );
                const stored = writeStore("profile", {
                    name: values.name.trim(),
                    email: values.email.trim(),
                    phone: (values.phone || profile().phone || "").trim(),
                });
                writeStore("session", { active: true });
                toast(
                    stored
                        ? "체험 프로필로 시작합니다."
                        : "현재 세션에서 사용할 체험 프로필을 만들었습니다.",
                );
                navigate("/account");
            });
        area.querySelector("[data-logout]")?.addEventListener("click", () => {
            writeStore("session", { active: false });
            toast("체험 로그아웃되었습니다.");
            redraw();
        });
        area
            .querySelector("[data-profile]")
            ?.addEventListener("submit", (event) => {
                event.preventDefault();
                cleanErrors(area);
                const values = valuesFrom(event.currentTarget),
                    invalid = commonValidation(
                        values,
                        contactFields.map((f) => ({ ...f, required: f.name !== "phone" })),
                    );
                if (invalid) return showError(area, invalid.message, invalid.field);
                const stored = writeStore("profile", {
                    name: values.name.trim(),
                    email: values.email.trim(),
                    phone: values.phone.trim(),
                });
                accountState.message = stored
                    ? "변경사항을 이 브라우저에 저장했습니다."
                    : "변경사항을 현재 세션에 저장했습니다. 브라우저 저장이 제한되어 있습니다.";
                redraw(".flow-success");
            });
        area
            .querySelector("[data-recovery]")
            ?.addEventListener("submit", (event) => {
                event.preventDefault();
                cleanErrors(area);
                const values = valuesFrom(event.currentTarget),
                    invalid = commonValidation(values, [contactFields[1]]);
                if (invalid) return showError(area, invalid.message, invalid.field);
                const user = profile();
                accountState.recovery =
                    user.email &&
                    user.email.toLowerCase() === values.email.trim().toLowerCase()
                        ? `${user.name}님의 체험 프로필이 이 브라우저에 저장되어 있습니다. 체험 로그인에서 다시 시작할 수 있습니다.`
                        : "이 브라우저에 해당 이메일의 체험 프로필이 없습니다. 새 프로필을 만들어 주세요.";
                redraw(".flow-info-box");
            });
        area.querySelectorAll("[data-remove-favorite]").forEach((btn) =>
            btn.addEventListener("click", () => {
                writeStore(
                    "favorites",
                    favoriteIds().filter((id) => id !== btn.dataset.removeFavorite),
                );
                toast("관심 목록에서 삭제했습니다.");
                redraw();
            }),
        );
        area.querySelectorAll("[data-cancel-booking]").forEach((btn) =>
            btn.addEventListener("click", () => {
                accountState.cancelId = btn.dataset.cancelBooking;
                redraw("[data-cancel-dismiss]");
            }),
        );
        area
            .querySelector("[data-cancel-dismiss]")
            ?.addEventListener("click", () => {
                const id = accountState.cancelId;
                accountState.cancelId = "";
                redraw(`[data-cancel-booking="${id}"]`);
            });
        area
            .querySelector("[data-cancel-confirm]")
            ?.addEventListener("click", (event) => {
                const id = event.currentTarget.dataset.cancelConfirm;
                writeStore(
                    "bookings",
                    savedBookings().map((b) =>
                        b.id === id ? { ...b, status: "cancelled" } : b,
                    ),
                );
                for (const [programId, draft] of bookingDrafts)
                    if (draft.done?.id === id) bookingDrafts.delete(programId);
                accountState.cancelId = "";
                toast("체험 예매가 취소되었습니다.");
                redraw();
            });
        area
            .querySelector('[role="alertdialog"]')
            ?.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    const id = accountState.cancelId;
                    accountState.cancelId = "";
                    redraw(`[data-cancel-booking="${id}"]`);
                }
                if (event.key === "Tab") {
                    const buttons = [...event.currentTarget.querySelectorAll("button")];
                    if (event.shiftKey && document.activeElement === buttons[0]) {
                        event.preventDefault();
                        buttons.at(-1).focus();
                    } else if (
                        !event.shiftKey &&
                        document.activeElement === buttons.at(-1)
                    ) {
                        event.preventDefault();
                        buttons[0].focus();
                    }
                }
            });
        area.querySelectorAll("[data-withdraw-application]").forEach((btn) =>
            btn.addEventListener("click", () => {
                const id = btn.dataset.withdrawApplication;
                writeStore(
                    "applications",
                    savedApplications().map((a) =>
                        a.id === id ? { ...a, status: "cancelled" } : a,
                    ),
                );
                toast("체험 신청을 철회했습니다.");
                redraw();
            }),
        );
    }
}
