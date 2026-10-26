// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { PROGRAMS, VENUES } from "../data/catalog.ts";
import { esc, href, icon, formatDate, readStore, writeStore } from "../lib/core.ts";
import { pageHeader, button } from "../components/ui.ts";
import { animateFeedback, cancelMotion } from "../components/motion.ts";
import { venueTech, venueLocation } from "./pages.ts";

// [관람과 대관을 잇는 두 도구 / Two tools connecting visits and venue rental]
// 기존 프로그램·공간·신청 경로를 사용하며 확정 일정이나 실시간 이동 정보를 만들지 않습니다.
// Reuse maintained programs, venues and application routes without inventing live availability.
export const JOURNEY_PAGES = [
    { path: "/visit/plan", title: "나의 방문 계획", description: "기대하는 하루를, 오는 길부터 함께 준비해요.", group: "visit" },
    { path: "/rental/compare", title: "대관 공간 비교", description: "어떤 무대를 준비하고 있나요? 공간의 차이를 나란히 살펴보세요.", group: "rental" },
];

const transports = [
    { id: "gwanghwamun", label: "지하철 · 광화문역", text: "5호선 광화문역 1·8번 출구 방향의 안내를 확인하세요. 계단 없는 이동이 필요하면 역사와 현장의 승강기 안내를 먼저 확인해 주세요.", origin: "gwanghwamun" },
    { id: "gyeongbokgung", label: "지하철 · 경복궁역", text: "3호선 경복궁역에서 세종대로·광화문광장 방향 안내를 따라 이동하세요. 출구와 현장 표지를 확인해 주세요.", origin: "gyeongbokgung" },
    { id: "bus", label: "버스", text: "광화문·세종문화회관 주변 정류장과 이용 노선을 출발 전에 확인하세요. 정류장별 하차 위치는 교통 안내에서 살펴볼 수 있어요.", origin: "" },
    { id: "car", label: "자가용 · 주차", text: "세종로 공영주차장과 공연별 주차 안내를 확인하세요. 주차 상황에 따라 시간이 달라지므로 여유 있게 도착해 주세요.", origin: "parking" },
];
const accessOptions = [
    { id: "none", label: "일반 관람 안내", text: "관람 연령과 입장 안내를 확인하고 티켓 또는 예매내역을 준비해 주세요." },
    { id: "wheelchair", label: "휠체어·이동 지원", text: "휠체어석, 승강기와 계단 없는 동선은 공연장과 작품별로 확인해야 합니다. 필요한 지원을 관람 전에 문의해 주세요." },
    { id: "hearing", label: "청각·시각 지원 확인", text: "자막·음성 등 지원 방식은 프로그램마다 다릅니다. 제공 여부와 이용 방법을 예매 전에 문의해 주세요." },
    { id: "companion", label: "어린이·동반 관람", text: "공연별 관람 연령과 동반자 입장 조건을 확인하세요. 편의시설 위치도 함께 살펴보면 좋아요." },
];
const asQuery = value => value instanceof URLSearchParams ? value : new URLSearchParams(value);
const route = (path, values = {}) => {
    const query = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== "" && value != null));
    return path + (query.size ? "?" + query.toString() : "");
};
const validDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const year = Number(value.slice(0, 4));
    if (year < 1900 || year > 2100) return false;
    const date = new Date(value + "T12:00:00Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// [주소와 선택값의 검증 / Validate URL and selection state]
// 잘못된 날짜·회차는 비우고 안내하며, 프로그램의 실제 등록 공간을 우선합니다.
// Clear invalid dates and sessions with a notice; prefer the program's maintained venue.
export function getVisitPlan(value = new URLSearchParams()) {
    const query = asQuery(value);
    const issues = [];
    const program = PROGRAMS.find(item => item.id === query.get("program")) || null;
    if (query.get("program") && !program) issues.push("주소의 프로그램을 찾지 못했어요. 다시 선택해 주세요.");
    const requestedVenue = VENUES.find(item => item.id === query.get("venue")) || null;
    const venue = program ? VENUES.find(item => item.name === program.venue) || null : requestedVenue;
    if (query.get("venue") && (!requestedVenue || (program && requestedVenue !== venue))) {
        issues.push(program ? "공간을 프로그램에 등록된 장소로 맞췄어요." : "주소의 공간을 찾지 못했어요. 다시 선택해 주세요.");
    }
    let date = query.get("date") || "";
    if (date && (!validDate(date) || (program && (date < program.start || date > program.end)))) {
        date = "";
        issues.push("관람 가능한 날짜를 다시 선택해 주세요.");
    }
    let time = query.get("time") || "";
    if (time && (!program || !program.times.includes(time))) {
        time = "";
        issues.push("주소의 회차를 사용할 수 없어요. 프로그램의 회차를 다시 선택해 주세요.");
    }
    const transport = transports.find(item => item.id === query.get("transport")) || transports[0];
    const access = accessOptions.find(item => item.id === query.get("access")) || accessOptions[0];
    if (query.get("transport") && query.get("transport") !== transport.id) issues.push("이동수단을 기본값으로 돌렸어요. 출발 방법을 확인해 주세요.");
    if (query.get("access") && query.get("access") !== access.id) issues.push("관람 지원 항목을 다시 확인해 주세요.");
    const canonical = new URLSearchParams();
    if (program) canonical.set("program", program.id);
    if (venue) canonical.set("venue", venue.id);
    if (date) canonical.set("date", date);
    if (time) canonical.set("time", time);
    canonical.set("transport", transport.id);
    canonical.set("access", access.id);
    return {
        program, venue, date, time, transport: transport.id, access: access.id, issues,
        ready: Boolean(date && (program ? time : venue)), query: canonical.toString(),
    };
}

export function getComparison(value = new URLSearchParams()) {
    const query = asQuery(value);
    const supplied = (query.get("ids") || "").split(",").map(id => id.trim()).filter(Boolean);
    const unique = [...new Set(supplied)];
    const valid = unique.filter(id => VENUES.some(venue => venue.id === id));
    const issues = [];
    if (valid.length !== unique.length) issues.push("찾을 수 없는 공간은 비교에서 제외했어요.");
    if (unique.length !== supplied.length) issues.push("같은 공간은 한 번씩만 비교해요.");
    if (valid.length > 3) issues.push("한 번에 최대 세 공간을 비교할 수 있어요. 먼저 선택한 세 공간을 보여드려요.");
    const ids = valid.slice(0, 3);
    return { ids, venues: ids.map(id => VENUES.find(venue => venue.id === id)), issues, query: ids.length ? new URLSearchParams({ ids: ids.join(",") }).toString() : "" };
}

const options = (items, selected, placeholder = "") =>
    `${placeholder ? `<option value="">${esc(placeholder)}</option>` : ""}${items.map(item => `<option value="${esc(item.id)}"${item.id === selected ? " selected" : ""}>${esc(item.label || item.name || item.title)}</option>`).join("")}`;
const issueMarkup = issues => issues.length ? `<div class="journey-notice"><p>${issues.map(esc).join(" ")}</p></div>` : "";
const textLink = (label, path) => `<a class="text-link" href="${esc(href(path))}">${esc(label)} ${icon("arrow", 20)}</a>`;
const planPath = plan => "/visit/plan?" + plan.query;

// [선택한 하루를 읽는 일정 / A readable itinerary for the selected day]
// 시간표는 선택 회차와 준비 순서만 보여 주며 이동시간·운영시간을 추정하지 않습니다.
// Show the chosen session and preparation order without estimating travel or opening hours.
function visitResult(plan) {
    if (!plan.ready) {
        return `<div class="journey-empty"><span class="journey-empty-icon" aria-hidden="true">${icon("calendar", 32)}</span><h2>당신의 하루를 기다리고 있어요.</h2><p>날짜와 공간을 선택해 주세요.<br>프로그램을 고르면 해당 장소와 회차로 일정을 만들 수 있어요.</p><p class="journey-meta">선택 내용은 주소에 반영됩니다. 완성한 계획은 이 브라우저에 저장할 수 있어요.</p></div>`;
    }
    const transport = transports.find(item => item.id === plan.transport);
    const access = accessOptions.find(item => item.id === plan.access);
    const program = plan.program;
    const venueName = plan.venue?.name || program?.venue;
    // [경로가 특정되지 않은 교통 안내 / Transport guidance without an assumed route]
    // 교육장이나 버스처럼 등록된 출발·도착 조합이 없으면 일반 안내로 연결합니다.
    // Use general guidance when the maintained data cannot identify both endpoints.
    const hasArrivalRoute = Boolean(transport.origin && plan.venue);
    const directions = hasArrivalRoute
        ? route("/visit/directions", { origin: transport.origin, venue: plan.venue.id })
        : "/visit/directions?overview=1";
    const heading = program?.title || `${venueName}에서 보내는 하루`;
    const stage = (label, title, text, action = "") => `<li><span class="journey-step-label">${label}</span><div><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div></li>`;
    return `<div class="journey-itinerary">
        <p class="journey-date">${icon("calendar", 21)} <time datetime="${plan.date}">${formatDate(plan.date)}</time></p>
        <h2>${esc(heading)}</h2>
        <p class="journey-destination">${esc(venueName)}${plan.venue ? ` · ${esc(venueLocation[plan.venue.id])}` : ""}</p>
        <ol class="journey-timeline">
            ${stage("출발 전", "예매와 관람 조건 확인", program ? `${program.age} · ${program.duration}. 일정과 예매 조건을 프로그램 상세에서 다시 확인해 주세요.` : "공간별 운영과 관람 조건을 확인하세요. 이 계획은 공간의 입장이나 이용을 예약하지 않습니다.", textLink(program ? "프로그램 상세" : "공간 안내", program ? "/programs/" + program.id : "/visit/spaces/" + plan.venue.id))}
            ${stage("오는 길", transport.label, transport.text, textLink(hasArrivalRoute ? "이동 안내 보기" : "교통 안내 확인", directions))}
            ${stage("입장 준비", access.label, access.text, textLink(plan.access === "none" ? "관람 유의사항" : "관람 지원 확인", plan.access === "none" ? "/visit/etiquette" : "/visit/accessibility"))}
            ${stage(program ? esc(plan.time) : "머무는 동안", program ? program.title : "선택한 공간 둘러보기", program ? `${program.venue} · ${program.duration}. 입장 시작과 종료 시간은 현장 안내를 확인해 주세요.` : "공연·전시 일정과 방문 가능한 공간을 현장 안내에 따라 확인하세요.", textLink(program ? "내 예매내역 확인" : "이 공간의 프로그램", program ? "/account/bookings" : route("/programs", { venue: venueName })))}
        </ol>
        ${plan.transport === "car" ? `<div class="journey-parking">${textLink("주차 이용 조건 확인", "/visit/directions/parking")}</div>` : ""}
        <p class="journey-meta">선택한 정보로 만든 방문 준비 계획입니다. 이동 경로는 개략 안내이며 실시간 교통·시설 운영을 반영하지 않습니다. 프로그램 일정은 체험용 예시입니다.</p>
    </div>`;
}

function savedPlanMarkup() {
    const saved = readStore("visit-plan", "");
    if (typeof saved !== "string" || !saved) return "";
    const plan = getVisitPlan(new URLSearchParams(saved));
    if (!plan.ready) return "";
    return `<div class="journey-saved"><div><strong>이 브라우저에 저장한 계획</strong>${textLink(`${formatDate(plan.date)} · ${plan.program?.title || plan.venue?.name}`, planPath(plan))}</div><button type="button" class="journey-text-button" data-clear-plan>삭제</button></div>`;
}

function renderVisit(query) {
    const plan = getVisitPlan(query);
    const program = plan.program;
    return `${pageHeader(JOURNEY_PAGES[0])}<div class="container page-content journey-page">
        <div data-saved-plan>${savedPlanMarkup()}</div>
        <div class="journey-intro"><p>한 번의 관람이<br><strong>편안한 하루가 되도록.</strong></p><span>예매한 프로그램을 고르거나, 방문하고 싶은 공간부터 선택하세요.</span></div>
        <div class="journey-layout">
            <section class="journey-editor" aria-labelledby="journey-form-heading">
                <h2 id="journey-form-heading">어떤 하루를 계획하시나요?</h2>
                <div data-journey-issues>${issueMarkup(plan.issues)}</div>
                <form id="visit-plan-form">
                    <div class="journey-field"><label for="journey-program">프로그램</label><select id="journey-program" name="program">${options(PROGRAMS.map(item => ({ ...item, label: `${item.category} · ${item.title}` })), program?.id, "프로그램 없이 공간 둘러보기")}</select></div>
                    <div class="journey-field-pair">
                        <div class="journey-field"><label for="journey-date">방문 날짜</label><input id="journey-date" name="date" type="date" value="${plan.date}" min="${program?.start || "1900-01-01"}" max="${program?.end || "2100-12-31"}" required aria-describedby="journey-date-help"></div>
                        <div class="journey-field"><label for="journey-time">회차</label><select id="journey-time" name="time"${program ? " required" : " disabled"}>${options((program?.times || []).map(time => ({ id: time, label: time })), plan.time, program ? "회차 선택" : "프로그램 선택 후 지정")}</select></div>
                    </div>
                    <p class="journey-meta journey-field-help" id="journey-date-help">${program ? `${formatDate(program.start)} — ${formatDate(program.end)} · 체험용 일정` : "방문 날짜를 정해 주세요. 실제 운영일과 관람 조건은 별도로 확인해야 합니다."}</p>
                    <div class="journey-field"><label for="journey-venue">방문 공간</label><select id="journey-venue" name="venue"${program ? " disabled" : " required"}>${options(VENUES, plan.venue?.id, program && !plan.venue ? program.venue : "공간 선택")}</select><p class="journey-meta">프로그램을 선택하면 등록된 장소로 연결됩니다.</p></div>
                    <div class="journey-field"><label for="journey-transport">오는 방법</label><select id="journey-transport" name="transport">${options(transports, plan.transport)}</select></div>
                    <div class="journey-field"><label for="journey-access">함께 확인할 관람 안내</label><select id="journey-access" name="access">${options(accessOptions, plan.access)}</select></div>
                    <button class="button button--dark journey-submit" type="submit">내 일정 확인 ${icon("arrow", 20)}</button>
                </form>
                <div class="journey-help">${textLink("도움이 필요하다면 문의하기", "/visit/support/inquiry")}</div>
            </section>
            <section class="journey-result" aria-label="나의 방문 일정"><div data-visit-result>${visitResult(plan)}</div></section>
        </div>
        <section class="journey-share" aria-labelledby="journey-share-heading">
            <div><h2 id="journey-share-heading">함께 볼 계획을 남겨두세요.</h2><p>주소에는 선택한 프로그램과 방문 조건만 담깁니다.</p></div>
            <div class="journey-share-actions"><button type="button" class="button button--dark" data-save-plan${plan.ready ? "" : " disabled"}>이 브라우저에 저장 ${icon("check", 19)}</button><button type="button" class="button" data-copy-plan>주소 복사 ${icon("diagonal", 19)}</button></div>
            <div class="journey-share-address"><label for="journey-share-url">공유할 주소</label><input id="journey-share-url" type="text" readonly value="" autocomplete="off"></div>
        </section>
        <p class="journey-status" data-journey-status role="status" aria-atomic="true"></p>
    </div>`;
}

// [정원·기술·다음 단계의 비교 / Compare capacity, technical guidance and next steps]
// 기술 안내는 기존 공간 상세와 같은 데이터를 사용하며 없는 장비 수량이나 요금을 만들지 않습니다.
// Share the venue detail data rather than inventing equipment quantities or rental prices.
function comparisonResult(comparison) {
    if (!comparison.venues.length) return `<div class="journey-empty comparison-empty"><span class="journey-empty-icon" aria-hidden="true">${icon("building", 32)}</span><h2>무대를 고르는 첫걸음.</h2><p>공간을 하나부터 세 개까지 선택하면<br>규모와 제작 조건을 함께 살펴볼 수 있어요.</p>${textLink("전체 공간 자세히 보기", "/rental/venues")}</div>`;
    return `<div class="comparison-grid" data-comparison-count="${comparison.venues.length}">${comparison.venues.map(venue => `<article class="comparison-card">
        <img src="${venue.image}" width="700" height="480" alt="${esc(venue.name)} 공간 일러스트">
        <div class="comparison-heading"><p>${esc(venue.kind)}</p><h2>${esc(venue.name)}</h2></div>
        <dl class="comparison-facts">
            <div><dt>정원·공간</dt><dd><strong>${esc(venue.capacity)}${venue.kind === "공연장" ? "석" : ""}</strong>${venue.id === "s-theater" ? "<span>구성에 따라 수용 인원 변경</span>" : venue.kind === "공연장" ? "<span>공연별 운영 좌석 확인</span>" : "<span>전시별 동선·구성 확인</span>"}</dd></div>
            <div><dt>추천 용도</dt><dd>${esc(venue.area)}</dd></div>
            <div><dt>공간 구성</dt><dd>${esc(venueTech[venue.id][0])}</dd></div>
            <div><dt>장비·제작 협의</dt><dd>${esc(venueTech[venue.id][2])}</dd></div>
            <div><dt>위치</dt><dd>${esc(venueLocation[venue.id])}</dd></div>
            <div><dt>상세·준비 자료</dt><dd>${textLink("공간 정보와 기술 체크리스트", "/rental/venues/" + venue.id)}</dd></div>
        </dl>
        <div class="comparison-actions">${button("이 공간의 일정 확인", "/rental/schedule?venue=" + venue.id, "dark")}${button("이 공간으로 신청", "/rental/apply?venue=" + venue.id, "outline")}${textLink("이 공간 문의하기", "/rental/contact?venue=" + venue.id)}</div>
    </article>`).join("")}</div>`;
}

function renderCompare(query) {
    const comparison = getComparison(query);
    return `${pageHeader(JOURNEY_PAGES[1])}<div class="container page-content journey-page comparison-page">
        <div class="journey-intro"><p>작품의 크기보다,<br><strong>잘 맞는 무대를 먼저.</strong></p><span>용도와 제작 조건을 비교한 뒤 일정 확인과 신청으로 이어가세요.</span></div>
        <div data-journey-issues>${issueMarkup(comparison.issues)}</div>
        <form id="venue-compare-form" class="comparison-picker"><fieldset><legend>비교할 공간 <span>최대 3개</span></legend><div class="comparison-choices">${VENUES.map(venue => `<label class="comparison-choice"><input type="checkbox" name="venue" value="${venue.id}"${comparison.ids.includes(venue.id) ? " checked" : ""}><span>${esc(venue.name)}</span></label>`).join("")}</div></fieldset><button type="button" class="journey-text-button" data-clear-comparison>선택 초기화</button></form>
        <p class="journey-status" data-journey-status role="status" aria-atomic="true"></p>
        <div class="comparison-status-row"><p data-comparison-summary>${comparison.ids.length}개 공간 선택</p>${textLink("대관 절차 확인", "/rental/process")}</div>
        <div data-comparison-result>${comparisonResult(comparison)}</div>
        <aside class="journey-consultation" aria-labelledby="journey-consultation-heading"><div><h2 id="journey-consultation-heading">어느 단계에서든, 함께 준비해요.</h2><p>정확한 장비·도면·요금과 실제 사용 가능 여부는 제작 조건에 따라 담당자와 확인해야 합니다.</p></div><div>${button("대관 문의", "/rental/contact", "dark")}${textLink("신청 서류와 심사기준", "/rental/process/documents")}${textLink("무대 기술·장비 안내", "/rental/equipment")}</div></aside>
        <p class="journey-meta">기존 공간 안내를 비교한 체험 화면입니다. 공간 선택과 예시 일정 확인은 실제 예약이나 대관 확정을 의미하지 않습니다.</p>
    </div>`;
}

export function renderJourneys(path, query = new URLSearchParams()) {
    if (path === "/visit/plan") return renderVisit(asQuery(query));
    if (path === "/rental/compare") return renderCompare(asQuery(query));
    return null;
}

// [빠른 입력·주소 공유·화면 정리 / Fast input, shareable state and cleanup]
// 입력은 즉시 반영하고 결과만 교체합니다. 기존 모션과 경로 해제 계약을 따릅니다.
// Commit controls immediately, replace only results and use existing animation cleanup.
export function bindJourneys(root, path, query = new URLSearchParams()) {
    const form = root.querySelector(path === "/visit/plan" ? "#visit-plan-form" : "#venue-compare-form");
    if (!form) return () => {};
    const events = new AbortController();
    let disposed = false;
    let plan = getVisitPlan(query);
    let comparison = getComparison(query);
    const status = root.querySelector("[data-journey-status]");
    const tell = message => { if (!disposed) status.textContent = message; };
    const replaceAddress = destination => {
        history.replaceState(history.state, "", href(destination));
        const address = root.querySelector("#journey-share-url");
        if (address) address.value = location.href;
    };
    const updateVisit = () => {
        plan = getVisitPlan(new URLSearchParams(new FormData(form)));
        const result = root.querySelector("[data-visit-result]");
        cancelMotion(result);
        result.innerHTML = visitResult(plan);
        root.querySelector("[data-journey-issues]").innerHTML = issueMarkup(plan.issues);
        root.querySelector("[data-save-plan]").disabled = !plan.ready;
        replaceAddress(planPath(plan));
        animateFeedback(result, "content");
        tell(plan.ready ? `${formatDate(plan.date)} 방문 계획을 갱신했어요.` : "날짜·공간과 필요한 회차를 선택해 주세요.");
    };
    const updateComparison = ids => {
        comparison = getComparison(new URLSearchParams({ ids: ids.join(",") }));
        const result = root.querySelector("[data-comparison-result]");
        cancelMotion(result);
        result.innerHTML = comparisonResult(comparison);
        root.querySelector("[data-comparison-summary]").textContent = `${comparison.ids.length}개 공간 선택`;
        root.querySelector("[data-journey-issues]").innerHTML = "";
        replaceAddress("/rental/compare" + (comparison.query ? "?" + comparison.query : ""));
        animateFeedback(result, "content");
        tell(comparison.ids.length ? `${comparison.ids.length}개 공간의 비교 정보를 갱신했어요.` : "비교할 공간을 선택해 주세요.");
    };

    if (path === "/visit/plan") {
        root.querySelector("#journey-share-url").value = new URL(href(planPath(plan)), location.href).href;
        form.addEventListener("change", event => {
            if (event.target.name === "program") {
                const program = PROGRAMS.find(item => item.id === event.target.value);
                const dateInput = form.elements.date;
                dateInput.min = program?.start || "1900-01-01";
                dateInput.max = program?.end || "2100-12-31";
                if (program && (!validDate(dateInput.value) || dateInput.value < program.start || dateInput.value > program.end)) dateInput.value = program.start;
                form.elements.time.disabled = !program;
                form.elements.time.required = Boolean(program);
                form.elements.time.innerHTML = options((program?.times || []).map(time => ({ id: time, label: time })), "", program ? "회차 선택" : "프로그램 선택 후 지정");
                form.elements.venue.disabled = Boolean(program);
                form.elements.venue.required = !program;
                const venue = program ? VENUES.find(item => item.name === program.venue) : VENUES.find(item => item.id === form.elements.venue.value);
                form.elements.venue.innerHTML = options(VENUES, venue?.id, program && !venue ? program.venue : "공간 선택");
                root.querySelector("#journey-date-help").textContent = program ? `${formatDate(program.start)} — ${formatDate(program.end)} · 체험용 일정` : "실제 운영일과 관람 조건은 별도로 확인해야 합니다.";
            }
            updateVisit();
        }, { signal: events.signal });
        form.addEventListener("submit", event => {
            event.preventDefault();
            updateVisit();
            if (plan.ready) {
                const heading = root.querySelector("[data-visit-result] h2");
                heading.tabIndex = -1;
                heading.focus({ preventScroll: false });
            }
        }, { signal: events.signal });
    } else {
        form.addEventListener("submit", event => event.preventDefault(), { signal: events.signal });
        form.addEventListener("change", event => {
            if (event.target.name !== "venue") return;
            const selected = [...form.querySelectorAll("input:checked")].map(input => input.value);
            if (selected.length > 3) {
                event.target.checked = false;
                tell("최대 세 공간까지 비교할 수 있어요. 선택한 공간 하나를 해제한 뒤 추가해 주세요.");
                return;
            }
            updateComparison(selected);
        }, { signal: events.signal });
    }
    root.addEventListener("click", async event => {
        const target = event.target.closest("button");
        if (!target) return;
        if (target.hasAttribute("data-clear-comparison")) {
            form.querySelectorAll("input:checked").forEach(input => { input.checked = false; });
            updateComparison([]);
        }
        if (target.hasAttribute("data-save-plan") && plan.ready) {
            const saved = writeStore("visit-plan", plan.query);
            if (saved) root.querySelector("[data-saved-plan]").innerHTML = savedPlanMarkup();
            tell(saved ? "방문 계획을 이 브라우저에 저장했어요. 상단의 저장한 계획에서 다시 열 수 있습니다." : "브라우저 저장을 사용할 수 없어요. 공유할 주소를 복사해 계획을 남겨 주세요.");
            animateFeedback(target, "status");
        }
        if (target.hasAttribute("data-clear-plan")) {
            const removed = writeStore("visit-plan", "");
            if (removed) {
                root.querySelector("[data-saved-plan]").innerHTML = "";
                form.elements.program.focus();
            }
            tell(removed ? "저장한 방문 계획을 삭제했어요. 현재 선택은 유지됩니다." : "저장소를 변경할 수 없어요. 브라우저 설정에서 저장된 정보를 확인해 주세요.");
        }
        if (target.hasAttribute("data-copy-plan")) {
            const address = root.querySelector("#journey-share-url");
            try {
                if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
                await navigator.clipboard.writeText(address.value);
                tell("방문 계획 주소를 복사했어요.");
            } catch {
                if (disposed) return;
                address.focus();
                address.select();
                tell("주소를 선택했어요. 복사해서 함께 볼 사람에게 전달해 주세요.");
            }
        }
    }, { signal: events.signal });
    return () => {
        disposed = true;
        events.abort();
        cancelMotion(root);
    };
}
