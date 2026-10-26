// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { PROGRAMS, PAGES, VENUES } from "../data/catalog.ts";
import {
    esc,
    href,
    filterPrograms,
    readStore,
    writeStore,
    formatDate,
    money,
    todayISO,
    icon,
    navigate,
    toast,
} from "../lib/core.ts";
import { pageHeader, programCard, emptyState, button } from "../components/ui.ts";
import { posterMedia } from "../components/cards.ts";
import { animateFeedback, animatePresence, cancelMotion } from "../components/motion.ts";

const categoryPaths = {
    전체: "/programs",
    공연: "/programs/performance",
    전시: "/programs/exhibition",
    교육: "/programs/education",
};
const listPaths = Object.values(categoryPaths);
const descriptions = {
    전체: "오늘의 취향에서, 새로운 발견까지. 당신의 일상에 예술을 더하세요.",
    공연: "음악, 움직임, 그리고 이야기. 무대 위의 특별한 순간을 만납니다.",
    전시: "익숙한 일상을 낯설게 바라보는 시간. 작품 앞에서 새로운 감각을 발견하세요.",
    교육: "보고 듣는 즐거움에서 알아가는 즐거움으로. 예술과 조금 더 가까워지는 시간.",
};
const demonstration =
    "이 페이지의 프로그램·일정·금액은 리뉴얼 시연을 위한 예시입니다. 실제 운영 정보는 공식 공지를 확인해 주세요.";
const dateRange = (p) =>
    `${formatDate(p.start)}${p.start !== p.end ? " — " + formatDate(p.end) : ""}`;
const page = (path, description) => ({
    ...(PAGES.find((p) => p.path === path) || {
        path,
        title: "프로그램",
        group: "programs",
        eyebrow: "PROGRAMS",
    }),
    ...(description ? { description } : {}),
});
const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const [year, month, day] = value.split("-").map(Number);
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return false;
    return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
};
const validMonth = (value) =>
    /^\d{4}-(0[1-9]|1[0-2])$/.test(value || "") &&
    Number(value.slice(0, 4)) >= 1900 &&
    Number(value.slice(0, 4)) <= 2100;
const url = (path, values) => {
    const query = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== "" && value != null) query.set(key, String(value));
    });
    return path + (query.size ? "?" + query.toString() : "");
};
const link = (label, path, className = "text-link") =>
    `<a class="${className}" href="${esc(href(path))}">${esc(label)} ${icon("arrow", 18)}</a>`;
const note = (text) =>
    `<p class="program-note">${icon("clock", 17)}<span>${esc(text)}</span></p>`;
const cards = (items) =>
    `<div class="program-results-grid">${items.map(programCard).join("")}</div>`;

function listState(path, query) {
    const routeCategory =
        Object.entries(categoryPaths).find(([, p]) => p === path)?.[0] || "전체";
    const requestedCategory = query.get("category");
    const category =
        routeCategory === "전체" && Object.hasOwn(categoryPaths, requestedCategory)
            ? requestedCategory
            : routeCategory;
    const date = validDate(query.get("date")) ? query.get("date") : "";
    const month = validMonth(query.get("month"))
        ? query.get("month")
        : date
            ? date.slice(0, 7)
            : todayISO().slice(0, 7);
    return {
        category,
        date,
        month,
        search: query.get("search") || query.get("q") || "",
        genre: query.get("genre") || "",
        venue: query.get("venue") || "",
        view: query.get("view") === "calendar" ? "calendar" : "list",
    };
}

function categoryTabs(active) {
    return `<nav class="program-category-tabs" aria-label="프로그램 종류">${Object.entries(
        categoryPaths,
    )
        .map(
            ([name, path]) =>
                `<a href="${href(path)}" ${active === name ? 'aria-current="page" class="active"' : ""}>${name}</a>`,
        )
        .join("")}<a href="${href("/programs/season")}">기획·시즌</a></nav>`;
}

function renderFilters(state) {
    const eligible =
        state.category === "전체"
            ? PROGRAMS
            : PROGRAMS.filter((p) => p.category === state.category);
    const genres = [...new Set(eligible.map((p) => p.genre))];
    const venues = [...new Set(eligible.map((p) => p.venue))];
    const option = (value, current) =>
        `<option value="${esc(value)}"${current === value ? " selected" : ""}>${esc(value)}</option>`;
    return `
        <form class="program-filter" data-program-filter role="search" aria-label="프로그램 찾기">
            <div class="program-filter-intro">
                <h2>나에게 맞는 프로그램 찾기</h2>
                <button class="program-filter__reset" type="button" data-filter-reset>조건 초기화</button>
            </div>
            <div class="program-filter__search">
                <label class="sr-only" for="program-search">프로그램명, 장르 또는 장소</label>
                <div>
                    ${icon("search", 22)}
                    <input
                        id="program-search"
                        name="search"
                        type="search"
                        placeholder="어떤 공연을 찾으세요?"
                        value="${esc(state.search)}"
                    >
                </div>
            </div>
            <div class="program-filter__row">
                <label>
                    장르
                    <select name="genre">
                        <option value="">모든 장르</option>
                        ${genres.map((genre) => option(genre, state.genre)).join("")}
                    </select>
                </label>
                <label>
                    공간
                    <select name="venue">
                        <option value="">모든 공간</option>
                        ${venues.map((venue) => option(venue, state.venue)).join("")}
                    </select>
                </label>
                <label>
                    관람 날짜
                    <input name="date" type="date" value="${esc(state.date)}">
                </label>
                <button class="button button--dark" type="submit">
                    프로그램 찾기 ${icon("arrow", 18)}
                </button>
            </div>
        </form>`;
}

function shiftedMonth(month, delta) {
    const [year, index] = month.split("-").map(Number);
    const next = new Date(Date.UTC(year, index - 1 + delta, 1));
    return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

function calendar(path, state, items) {
    const [year, month] = state.month.split("-").map(Number);
    const startDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const today = todayISO();
    const focusDate = state.date.startsWith(state.month)
        ? state.date
        : today.startsWith(state.month)
            ? today
            : `${state.month}-01`;
    const monthQuery = (delta) =>
        url(path, {
            ...state,
            date: "",
            month: shiftedMonth(state.month, delta),
            view: "calendar",
        });
    const monthEnd = `${state.month}-${String(days).padStart(2, "0")}`;
    const monthItems = items.filter(
        (p) => p.start <= monthEnd && p.end >= state.month + "-01",
    );
    const dayCells = Array.from(
        { length: startDay },
        () => '<div class="program-calendar__blank" aria-hidden="true"></div>',
    );
    for (let day = 1; day <= days; day++) {
        const date = `${state.month}-${String(day).padStart(2, "0")}`;
        const matches = filterPrograms(items, { date });
        const current = date === state.date;
        dayCells.push(
            `<a class="program-calendar__day${current ? " is-selected" : ""}${date === today ? " is-today" : ""}${matches.length ? " has-program" : ""}" href="${esc(href(url(path, { ...state, date, view: "calendar" })))}" data-calendar-date="${date}" tabindex="${date === focusDate ? "0" : "-1"}" aria-label="${year}년 ${month}월 ${day}일, 프로그램 ${matches.length}개${date === today ? ", 오늘" : ""}${current ? ", 선택됨" : ""}"${current ? ' aria-current="date"' : ""}><span class="program-calendar__number">${day}</span><span class="program-calendar__event">${matches.length ? `<span class="program-calendar__dot"></span><span class="program-calendar__count">${matches.length}개의 프로그램</span>` : '<span class="program-calendar__none">—</span>'}</span></a>`,
        );
    }
    while (dayCells.length % 7)
        dayCells.push(
            '<div class="program-calendar__blank" aria-hidden="true"></div>',
        );
    return `<section class="program-calendar" aria-label="월간 프로그램 캘린더">
        <div class="program-calendar__top"><a href="${esc(href(monthQuery(-1)))}" class="program-calendar__arrow" aria-label="이전 달">${icon("chevron", 24)}</a><h2>${year}<span>.</span>${String(month).padStart(2, "0")}</h2><a href="${esc(href(monthQuery(1)))}" class="program-calendar__arrow" aria-label="다음 달">${icon("chevron", 24)}</a><a class="program-calendar__today" href="${esc(href(url(path, { ...state, date: today, month: today.slice(0, 7), view: "calendar" })))}">오늘</a></div>
        <div class="program-calendar__week" aria-hidden="true">${["일", "월", "화", "수", "목", "금", "토"].map((d) => `<span>${d}</span>`).join("")}</div><div class="program-calendar__grid">${dayCells.join("")}</div>
        <p class="program-calendar__hint">날짜를 선택하면 해당 날짜에 진행되는 프로그램을 확인할 수 있습니다.</p>
    </section>
    <div class="program-results-heading"><h2>${state.date ? formatDate(state.date) + " 프로그램" : `${month}월의 프로그램`}</h2><span>총 <strong>${state.date ? filterPrograms(items, { date: state.date }).length : monthItems.length}</strong>건</span>${state.date ? link("선택일 해제", url(path, { ...state, date: "", view: "calendar" })) : ""}</div>
    ${(state.date ? filterPrograms(items, { date: state.date }) : monthItems).length ? cards(state.date ? filterPrograms(items, { date: state.date }) : monthItems) : emptyState("진행 중인 프로그램이 없습니다", "다른 날짜나 다음 달을 선택해 새로운 프로그램을 찾아보세요.", url(path, { view: "calendar", month: state.month }), "필터 초기화")}`;
}

function renderList(path, query) {
    const state = listState(path, query);
    const items = filterPrograms(PROGRAMS, { ...state, date: "" });
    const filtered = filterPrograms(items, { date: state.date });
    const titles = {
        전체: "예술을 고르는 시간",
        공연: "무대가 주는 설렘",
        전시: "새로운 시선을 만나다",
        교육: "배움으로 가까워지는 예술",
    };
    return `
        <header class="container program-page-heading">
            <div>

                <h1>${titles[state.category]}</h1>
                <p class="program-page-description">${descriptions[state.category]}</p>
            </div>
            <a class="program-season-shortcut" href="${href("/programs/season")}">
                <span>2026 세종시즌</span>
                <strong>올해의 새로운 발견 ${icon("diagonal", 20)}</strong>
            </a>
        </header>
        <div class="container page-content program-browse">
            ${categoryTabs(state.category)}
            ${renderFilters(state)}
            <div class="program-results-toolbar">
                <p role="status">${state.view === "list" ? `<strong>${filtered.length}</strong>개의 프로그램` : "일정에 맞춰 골라보세요"}</p>
                <nav class="program-view-switch" aria-label="보기 방식">
                    <a href="${esc(href(url(path, { ...state, view: "list" })))}"${state.view === "list" ? ' aria-current="page" class="active"' : ""}>
                        ${icon("menu", 18)} 목록
                    </a>
                    <a href="${esc(href(url(path, { ...state, view: "calendar" })))}"${state.view === "calendar" ? ' aria-current="page" class="active"' : ""}>
                        ${icon("calendar", 18)} 달력
                    </a>
                </nav>
            </div>
            ${state.view === "calendar" ? calendar(path, state, items) : filtered.length ? cards(filtered) : emptyState("조건에 맞는 프로그램이 없어요", "다른 날짜나 장르를 선택하거나 검색어를 바꿔보세요.", path, "모든 프로그램 보기")}
            ${note(demonstration)}
            <aside class="program-help">
                <div>

                    <h2>${state.category === "교육" ? "처음 배우는 순간도, 편안하게." : "기다려지는 하루를 준비하세요."}</h2>
                    <p>${state.category === "교육" ? "신청 방법부터 준비 사항까지 차근차근 안내해 드려요." : "예매 방법과 찾아오는 길, 관람에 필요한 정보를 모았어요."}</p>
                </div>
                <div>
                    ${link(state.category === "교육" ? "교육 신청안내" : "예매안내", state.category === "교육" ? "/programs/education/apply-guide" : "/programs/booking-guide")}
                    ${link("오시는 길", "/visit/directions")}
                    ${link("단체관람 안내", "/visit/group")}
                </div>
            </aside>
        </div>`;
}

const detailTabs = [
    ["overview", "소개"],
    ["schedule", "일정·캐스팅"],
    ["booking", "할인·예매"],
    ["visit", "관람안내"],
];
const cast = {
    autumn: [
        "서울시국악관현악단",
        "전통의 선율을 오늘의 감각으로 전하는 국악관현악 프로그램",
    ],
    carmen: ["서울시오페라단", "조르주 비제의 오페라를 만나는 시즌 프로그램"],
    dance: ["서울시무용단", "전통의 움직임과 현대적 무대 언어의 만남"],
    sumire: ["서울시극단", "일상을 통해 서로의 마음을 들여다보는 연극"],
    choral: ["서울시합창단", "여러 목소리가 함께 만드는 도시의 하모니"],
    ballet: ["서울시발레단", "해설과 함께 만나는 발레의 언어"],
    winter: ["서울시뮤지컬단", "노래와 이야기로 채우는 따뜻한 무대"],
};

function programAction(p, label) {
    return button(
        label ||
            (p.category === "교육"
                ? p.id === "tour"
                    ? "투어 신청하기"
                    : "수강 신청하기"
                : "예매하기"),
        p.category === "교육"
            ? `/apply/education?program=${encodeURIComponent(p.id)}`
            : "/booking/" + p.id,
        "yellow",
    );
}

function overviewPanel(p) {
    const learning = p.category === "교육";
    return `<div class="program-editorial"><div><h2>${esc(p.title)}</h2><p class="program-editorial__lead">${esc(p.description)}</p><p>${learning ? "예술을 알아가는 과정은 새로운 취향을 발견하는 시간이기도 합니다. 처음 접하는 분도 편안하게 참여할 수 있도록 감상과 이야기를 함께 구성했습니다." : p.category === "전시" ? "작품을 천천히 바라보고, 자신만의 이야기를 발견하세요. 전시 공간을 거닐며 빛과 색, 그리고 새로운 시선을 만나는 시간을 제안합니다." : "객석의 불이 꺼지고, 우리만의 시간이 시작됩니다. 작품이 전하는 이야기와 예술가들의 생생한 호흡을 세종문화회관에서 만나보세요."}</p><div class="program-tag-row"><span>${esc(p.category)}</span><span>${esc(p.genre)}</span><span>${esc(p.venue)}</span></div></div><div class="program-quote"><span aria-hidden="true">“</span><p>${learning ? "예술을 알아가는<br>나만의 속도." : p.category === "전시" ? "다르게 보는 순간,<br>새로운 세계가 열린다." : "예술이 일상이 되는<br>바로 그 순간."}</p></div></div>
        ${learning ? `<div class="program-info-box"><h3>${p.id === "tour" ? "이렇게 둘러봅니다" : "이렇게 함께 배웁니다"}</h3><ol class="program-simple-list">${(p.id === "tour" ? ["극장 로비에서 만나는 세종문화회관의 역사", "공연을 만드는 무대 장치와 공간 이야기", "무대 뒤의 역할과 관람 문화 알아보기"] : p.genre === "미술" ? ["작품을 바라보는 감상 방법과 미술사의 흐름", "시대와 작가를 연결해 읽는 작품 이야기", "나의 취향을 기록하고 함께 나누는 감상"] : ["시대와 음악가를 이해하는 클래식 이야기", "주요 악기와 작품을 듣고 감상하는 시간", "공연장에서 더 깊게 듣기 위한 감상 길잡이"]).map((v) => `<li>${v}</li>`).join("")}</ol><p>위 구성은 체험용 안내입니다. 실제 강의 구성과 운영 공간은 개강·참여 안내에서 확정됩니다.</p></div>` : ""}`;
}

function schedulePanel(p) {
    const contributors = cast[p.id];
    return `<h2 class="program-panel-title">일정 및 참여 안내</h2><dl class="program-details-table"><div><dt>진행 기간</dt><dd>${dateRange(p)}</dd></div><div><dt>${p.category === "전시" ? "입장 시간 예시" : "회차 예시"}</dt><dd>${p.times.map(esc).join(" · ")}<small>날짜별 회차는 ${p.category === "교육" ? "신청" : "예매"} 단계에서 확인해 주세요.</small></dd></div><div><dt>소요 시간</dt><dd>${esc(p.duration)}</dd></div><div><dt>장소</dt><dd>${esc(p.venue)}</dd></div></dl><div class="program-info-box"><h3>${p.category === "교육" ? "강사·진행 안내" : p.category === "전시" ? "작가·작품 안내" : "출연·제작 안내"}</h3>${contributors ? `<p class="program-cast-name">${contributors[0]}</p><p>${contributors[1]}</p>` : `<p>${p.category === "교육" ? "교육·투어 참여자에게 진행자 및 준비 사항을 안내하는 흐름을 체험할 수 있습니다." : p.category === "전시" ? "동시대의 다양한 시선을 소개하는 기획 전시 예시입니다." : "동시대 예술가들의 창작과 새로운 무대를 소개하는 프로그램입니다."}</p>`}<p>개별 출연진, 강사진 및 날짜별 캐스팅은 이 시연에서 확정 정보를 제공하지 않습니다. 실제 참여 전 공식 상세 공지를 확인해 주세요.</p></div>${note("기간 내 날짜와 회차를 선택하는 예시 일정입니다. 실제 공연일·휴관일을 의미하지 않습니다.")}`;
}

function bookingPanel(p) {
    return `<h2 class="program-panel-title">${p.category === "교육" ? "수강료 및 신청" : "티켓 가격 및 예매"}</h2><div class="program-price-block"><span>${p.category === "교육" ? "참가비" : "일반 가격"}</span><strong>${p.price ? money(p.price) : "무료"}</strong><span>1인 기준 · 시연용 금액</span></div><div class="program-info-columns"><article><h3>${p.category === "교육" ? "신청 방법" : "예매 방법"}</h3><ol class="program-simple-list">${(p.category === "교육" ? ["참여할 강좌·투어와 신청 인원을 확인합니다.", "신청자 연락처와 참여 정보를 입력합니다.", "동의 사항을 확인한 후 접수 내용을 확인합니다."] : ["관람할 날짜와 회차를 선택합니다.", "좌석 또는 입장 인원과 할인 유형을 선택합니다.", "예약자 정보를 입력하고 예약 확인서를 확인합니다."]).map((t) => `<li>${t}</li>`).join("")}</ol></article><article><h3>할인·취소 안내</h3><p>할인 유형과 적용 금액은 예매 단계에서 확인할 수 있습니다. 할인 대상자는 관람 당일 해당 증빙을 준비해 주세요.</p><p>시연 예약은 마이페이지의 예매내역에서 확인·취소할 수 있습니다. 실제 판매에는 공연별 취소 기한과 수수료 규정이 적용됩니다.</p></article></div>${note("체험 과정에서는 실제 결제, 좌석 확보 또는 운영기관에 대한 접수가 이루어지지 않습니다.")}<div class="program-panel-actions">${programAction(p)}${link(p.category === "교육" ? "교육 신청안내" : "예매안내 자세히", p.category === "교육" ? "/programs/education/apply-guide" : "/programs/booking-guide")}</div>`;
}

function visitPanel(p) {
    const venue = VENUES.find((v) => v.name === p.venue);
    return `<h2 class="program-panel-title">편안한 관람을 위한 안내</h2><div class="program-info-columns"><article><span class="program-info-icon">${icon("clock", 30)}</span><h3>여유 있게 도착해 주세요</h3><p>입장권 확인과 이동 시간을 고려해 시작 전 여유 있게 도착해 주세요. 시작 후 입장은 진행에 따라 제한될 수 있습니다.</p></article><article><span class="program-info-icon">${icon("user", 30)}</span><h3>${esc(p.age)} ${p.category === "교육" ? "참여" : "관람"}</h3><p>연령 기준과 동반 관람 조건은 프로그램에 따라 다를 수 있습니다. 예매 전 상세 조건을 확인해 주세요.</p></article><article><span class="program-info-icon">${icon("pin", 30)}</span><h3>${esc(p.venue)}</h3><p>서울 종로구 세종대로 175. 지하철 5호선 광화문역과 인접해 있습니다.</p>${link("교통·주차 안내", "/visit/directions")}</article><article><span class="program-info-icon">${icon("wheelchair", 30)}</span><h3>모두에게 열린 관람</h3><p>휠체어석, 이동 지원과 편의시설 정보를 미리 확인하고 필요한 도움을 요청해 주세요.</p>${link("접근성 서비스", "/visit/accessibility")}</article></div><div class="program-panel-actions">${button("나의 방문 계획", "/visit/plan?program=" + encodeURIComponent(p.id), "dark")}${venue ? button("공간·좌석 안내", "/visit/spaces/" + venue.id) : button("공간안내", "/visit/spaces")}${link("관람 유의사항", "/visit/etiquette")}${link("고객지원", "/visit/support")}</div>`;
}

function renderDetail(p, path, query) {
    const activeTab = detailTabs.some(([id]) => id === query.get("tab"))
        ? query.get("tab")
        : "overview";
    const saved = readStore("favorites", []).includes(p.id);
    const related = PROGRAMS.filter(
        (other) => other.id !== p.id && other.category === p.category,
    ).slice(0, 3);
    const content = {
        overview: overviewPanel(p),
        schedule: schedulePanel(p),
        booking: bookingPanel(p),
        visit: visitPanel(p),
    };
    return `
        <div class="container program-detail">
            <nav class="program-breadcrumb" aria-label="현재 위치">
                <a href="${href("/programs")}">프로그램</a>
                <span aria-hidden="true">/</span>
                <a href="${href(categoryPaths[p.category])}">${esc(p.category)}</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">상세</span>
            </nav>
            <div class="program-detail-hero">
                <div class="program-detail-artwork">
                    ${posterMedia(p, { className: "program-detail-poster", lazy: false })}
                </div>
                <div class="program-detail-summary">
                    <div class="program-detail-labels">
                        <span>${esc(p.category)} · ${esc(p.genre)}</span>
                        <span class="program-status">${p.category === "교육" ? "신청 가능" : esc(p.status)}</span>
                    </div>
                    <h1>${esc(p.title)}</h1>
                    <p class="program-detail-intro">${esc(p.description)}</p>
                    <dl class="program-detail-meta">
                        <div><dt>기간</dt><dd>${dateRange(p)}</dd></div>
                        <div><dt>장소</dt><dd>${esc(p.venue)}</dd></div>
                        <div><dt>소요 시간</dt><dd>${esc(p.duration)}</dd></div>
                        <div><dt>${p.category === "교육" ? "참여 대상" : "관람 연령"}</dt><dd>${esc(p.age)}</dd></div>
                    </dl>
                    <div class="program-detail-booking">
                        <div class="program-detail-price">
                            <span>${p.category === "교육" ? "참가비" : "티켓 가격"}</span>
                            <p><strong>${p.price ? money(p.price) : "무료"}</strong><span>1인 기준 · 시연용</span></p>
                        </div>
                        <div class="program-detail-cta">
                            ${programAction(p)}
                            <button type="button" class="program-icon-button${saved ? " is-saved" : ""}" data-program-favorite="${esc(p.id)}" aria-pressed="${saved}" aria-label="${saved ? "관심 프로그램에서 삭제" : "관심 프로그램에 저장"}">
                                ${icon("heart", 24)}
                            </button>
                            <button type="button" class="program-icon-button" data-program-share aria-expanded="false" aria-controls="program-share-panel" aria-label="프로그램 공유">
                                ${icon("diagonal", 24)}
                            </button>
                        </div>
                        <p class="program-booking-disclaimer">시연 프로그램으로, 실제 결제나 좌석 확보는 이루어지지 않습니다.</p>
                    </div>
                    <div id="program-share-panel" class="program-share" hidden>
                        <label for="program-share-url">프로그램 주소</label>
                        <div>
                            <input id="program-share-url" type="text" readonly aria-label="공유할 프로그램 주소">
                            <button type="button" data-copy-program>복사</button>
                        </div>
                        <p>주소를 복사해 관심 있는 프로그램을 공유하세요.</p>
                    </div>
                </div>
            </div>
            <section class="program-detail-content" aria-label="프로그램 상세 정보">
                <div class="program-detail-tabs" role="tablist" aria-label="프로그램 상세 정보">
                    ${detailTabs.map(([id, title]) => `
                        <button id="program-tab-${id}" type="button" role="tab" aria-selected="${activeTab === id}" aria-controls="program-panel-${id}" tabindex="${activeTab === id ? "0" : "-1"}" data-program-tab="${id}">${title}</button>
                    `).join("")}
                </div>
                ${detailTabs.map(([id]) => `
                    <div id="program-panel-${id}" class="program-tab-panel" role="tabpanel" aria-labelledby="program-tab-${id}" tabindex="0"${activeTab !== id ? " hidden" : ""}>
                        ${content[id]}
                    </div>
                `).join("")}
            </section>
            ${related.length ? `
                <section class="program-related">
                    <div class="program-results-heading">
                        <div><h2>이런 프로그램은 어때요?</h2></div>
                        ${link(p.category + " 전체보기", categoryPaths[p.category])}
                    </div>
                    ${cards(related)}
                </section>
            ` : ""}
            <div class="program-back-link">${link("프로그램 목록으로", categoryPaths[p.category])}</div>
        </div>`;
}

const seasons = [
    {
        id: "sejong",
        title: "2026 세종시즌",
        english: "SEJONG SEASON",
        phrase: "당신의 일상에,<br>예술의 새로운 계절.",
        description:
            "세종문화회관의 제작 공연과 서울시예술단의 작품을 한자리에서 만나는 연간 프로그램입니다.",
        color: "yellow",
        number: "01",
        ids: ["autumn", "carmen", "dance", "sumire", "choral", "ballet", "winter"],
        points: [
            [
                "세종의 제작 공연",
                "음악과 무용, 연극과 오페라까지 세종의 무대를 만드는 다양한 작품을 소개합니다.",
            ],
            [
                "일 년의 예술 여정",
                "계절을 따라 나의 취향을 발견하고, 새로운 장르를 만나는 계획을 세워보세요.",
            ],
        ],
    },
    {
        id: "sync-next",
        title: "Sync Next",
        english: "SYNC NEXT",
        phrase: "다음의 감각과<br>동기화되는 시간.",
        description:
            "장르의 경계를 넘는 동시대 예술. 세종S씨어터에서 만나는 실험과 새로운 가능성을 소개합니다.",
        color: "purple",
        number: "02",
        ids: ["hypnosis", "dance"],
        points: [
            [
                "경계를 넘는 무대",
                "음악과 퍼포먼스, 움직임과 영상이 새로운 방식으로 만나는 공연을 탐색합니다.",
            ],
            [
                "가까운 거리의 경험",
                "예술가와 관객의 관계를 다르게 바라보는 공연 경험을 제안합니다.",
            ],
        ],
    },
    {
        id: "everyone",
        title: "모든 누구나",
        english: "ART FOR EVERYONE",
        phrase: "예술 앞에서는,<br>모든 누구나.",
        description:
            "문화예술을 향유할 기회를 넓히는 세종의 열린 프로그램. 관객과 미래의 예술가, 도시의 일상을 함께 연결합니다.",
        color: "green",
        number: "03",
        ids: ["everyone-classic"],
        children: ["classic", "orchestra", "summer"],
        points: [
            [
                "열린 문화 경험",
                "누구나 예술을 가까이에서 경험하고 일상의 감동을 발견할 수 있도록 기회를 넓힙니다.",
            ],
            [
                "함께 자라는 예술",
                "관람부터 참여와 배움까지 서로 다른 세대와 취향을 잇습니다.",
            ],
        ],
    },
    {
        id: "package",
        title: "시즌 패키지",
        english: "MAKE YOUR SEASON",
        phrase: "좋아하는 무대를,<br>나만의 시즌으로.",
        description:
            "음악, 무용, 이야기. 취향에 맞는 작품을 함께 살펴보고 나만의 관람 계획을 완성해 보세요.",
        color: "pink",
        number: "04",
        ids: ["autumn", "carmen", "dance", "chamber-autumn"],
        points: [
            [
                "먼저 취향을 골라보세요",
                "클래식과 오페라, 무용 등 관심 장르의 작품을 비교해 보세요.",
            ],
            [
                "관람 계획을 완성하세요",
                "관심 프로그램으로 저장하고 각 작품의 일정과 회차를 확인해 예매할 수 있습니다. 실제 패키지 판매 조건은 별도 공지됩니다.",
            ],
        ],
    },
    {
        id: "classic",
        title: "누구나 클래식",
        english: "CLASSIC FOR EVERYONE",
        phrase: "천 원의 시작,<br>큰 울림의 클래식.",
        description:
            "클래식을 처음 만나는 순간도, 다시 듣고 싶은 순간도. 문턱을 낮춘 공연으로 더 많은 시민과 음악을 나눕니다.",
        color: "yellow",
        number: "05",
        ids: ["everyone-classic"],
        points: [
            [
                "부담 없이 만나는 음악",
                "작은 시작으로 공연장의 깊은 울림을 경험하는 프로그램입니다.",
            ],
            [
                "음악이 친근해지는 시간",
                "익숙한 선율과 새로운 작품을 가까이 만나는 관람 경험을 제안합니다.",
            ],
        ],
    },
    {
        id: "orchestra",
        title: "누구나 꿈나무오케스트라",
        english: "GROW WITH MUSIC",
        phrase: "함께 연주하며,<br>함께 자라는 꿈.",
        description:
            "음악으로 나를 표현하고, 서로의 소리를 들으며 성장하는 어린이·청소년 문화예술 교육 프로그램을 소개합니다.",
        color: "green",
        number: "06",
        ids: [],
        points: [
            [
                "함께 배우는 합주",
                "개별 악기 교육과 합주를 통해 음악의 즐거움과 협력의 가치를 경험합니다.",
            ],
            [
                "참여 안내",
                "모집 대상, 교육 장소, 선발 일정과 지원 방법은 모집 공지에서 확인할 수 있습니다. 현재 시연에는 해당 모집이 등록되어 있지 않습니다.",
            ],
        ],
    },
    {
        id: "summer",
        title: "누구나 세종썸머페스티벌",
        english: "SUMMER IN THE CITY",
        phrase: "도시의 여름에,<br>예술을 더하다.",
        description:
            "도심의 열린 공간에서 함께 즐기는 여름의 축제. 계절의 공기와 예술이 만나는 특별한 시간을 소개합니다.",
        color: "blue",
        number: "07",
        ids: [],
        points: [
            [
                "도시가 무대가 되는 순간",
                "열린 공간에서 다양한 예술가와 시민이 함께 만나는 축제를 지향합니다.",
            ],
            [
                "다음 축제를 기다리며",
                "세부 일정과 참여 프로그램은 공식 공지를 통해 안내됩니다. 현재 등록된 여름 축제 일정은 없습니다.",
            ],
        ],
    },
];

function seasonTile(s) {
    return `<a href="${href("/programs/season/" + s.id)}" class="program-season-tile program-season-tile--${s.color}"><div><span class="program-season-number">${s.number}</span></div><h2>${s.phrase}</h2><div class="program-season-tile__bottom"><span>${s.title}</span>${icon("diagonal", 28)}</div></a>`;
}

function renderSeasonIndex(path) {
    return `${pageHeader(page(path, "당신의 취향에 닿을 새로운 제안. 세종의 다양한 기획을 한자리에서 만납니다."))}<div class="container page-content"><div class="program-season-grid">${seasons.slice(0, 4).map(seasonTile).join("")}</div><section class="program-season-sub"><div class="program-results-heading"><div><h2>누구에게나, 예술이 가까이</h2></div></div><div class="program-season-grid program-season-grid--three">${seasons.slice(4).map(seasonTile).join("")}</div></section>${note("시즌 소개와 연계 프로그램은 리뉴얼 시연을 위한 큐레이션입니다. 실제 시즌 구성과 판매 일정은 공식 공지를 확인해 주세요.")}</div>`;
}

function renderSeason(s, path) {
    const items = s.ids
        .map((id) => PROGRAMS.find((p) => p.id === id))
        .filter(Boolean);
    return `${pageHeader(page(path, s.description))}<div class="container page-content"><section class="program-season-banner program-season-tile--${s.color}"><h2>${s.phrase}</h2><span class="program-season-banner__mark" aria-hidden="true">${s.id === "sync-next" ? "↗" : s.id === "everyone" ? "✳︎" : "S"}</span><p>${s.title}</p></section><div class="program-info-columns program-season-story">${s.points.map(([title, text]) => `<article><h2>${title}</h2><p>${text}</p></article>`).join("")}</div>${s.children ? `<div class="program-season-grid program-season-grid--three">${s.children.map((id) => seasonTile(seasons.find((season) => season.id === id))).join("")}</div>` : ""}<section class="program-related"><div class="program-results-heading"><div><h2>${s.id === "package" ? "나만의 시즌을 채울 작품" : "함께 만나는 프로그램"}</h2></div>${link("프로그램 전체보기", "/programs")}</div>${items.length ? cards(items) : emptyState("새로운 소식을 준비하고 있습니다", s.id === "orchestra" ? "모집 공지가 등록되면 참여 대상과 신청 일정을 확인할 수 있습니다." : "다음 축제의 일정과 프로그램은 공지사항에서 확인해 주세요.", "/news/notices", "공지사항 보기")}</section>${s.id === "package" ? `<div class="program-info-box"><h3>관람 계획은 관심 프로그램에 모아두세요</h3><p>각 작품 상세에서 하트 버튼을 누르면 마이페이지에서 나만의 관람 목록을 확인할 수 있습니다. 이 시연에서는 개별 작품 예매를 체험할 수 있으며, 패키지 결합 할인이나 묶음 결제는 제공하지 않습니다.</p>${link("내 관심 프로그램", "/account/favorites")}</div>` : ""}${note("소개 및 연계 프로그램은 시연을 위한 편집 예시입니다. 공식 시즌의 확정 출연진·판매 일정이 아닙니다.")}<div class="program-back-link">${link("기획·시즌 전체보기", "/programs/season")}</div></div>`;
}

function guideSteps(steps) {
    return `<ol class="program-guide-steps">${steps.map(([title, detail], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${detail}</p></li>`).join("")}</ol>`;
}

function renderGuide(path, education) {
    const steps = education
        ? [
                ["강좌 선택", "관심 분야의 강좌를 찾아 일정과 참여 대상을 확인하세요."],
                ["신청 정보 입력", "인원과 신청자 연락처, 참여 정보를 입력하세요."],
                ["내용 확인", "신청 내용과 동의 사항을 확인한 뒤 제출하세요."],
                ["접수 확인", "신청내역에서 접수 내용과 진행 상태를 확인하세요."],
            ]
        : [
                ["프로그램 선택", "날짜와 장르로 작품을 찾고 상세 정보를 확인하세요."],
                [
                    "날짜·좌석 선택",
                    "원하는 회차를 선택한 뒤 좌석 또는 인원을 골라주세요.",
                ],
                ["예약 정보 입력", "할인 유형과 예약자 정보를 확인해 주세요."],
                ["예약 확인", "예매내역에서 관람 일정과 좌석 정보를 확인하세요."],
            ];
    return `${pageHeader(page(path, education ? "새로운 배움의 시작을 차근차근 안내합니다." : "기대되는 무대를 만나는 첫걸음. 예매부터 관람까지 한눈에 확인하세요."))}<div class="container page-content program-guide"><section><h2 class="program-section-title">${education ? "배움으로 이어지는 네 단계" : "예술을 만나는 네 단계"}</h2>${guideSteps(steps)}</section><section class="program-guide-section"><h2>신청 전 확인해 주세요</h2><div class="program-info-columns"><article><h3>${education ? "참여 대상·준비물" : "관람 연령·소요 시간"}</h3><p>${education ? "강좌마다 참여 대상과 수업 구성이 다릅니다. 상세 페이지에서 기간, 장소, 준비 사항을 확인해 주세요." : "관람 연령은 프로그램마다 다릅니다. 예매 전 관람 가능 연령과 소요 시간, 입장 조건을 확인해 주세요."}</p></article><article><h3>${education ? "수강료 안내" : "할인·증빙 안내"}</h3><p>${education ? "수강료는 강좌별로 표시됩니다. 교재·재료비의 포함 여부와 세부 준비 사항은 운영 공지를 확인해 주세요." : "할인 대상과 할인율은 프로그램별로 다릅니다. 증빙 확인이 필요한 할인은 관람 당일 해당 자료를 준비해 주세요."}</p></article><article><h3>변경·취소 안내</h3><p>${education ? "참여 일정 변경이나 취소가 필요한 경우 고객지원에 문의해 주세요. 실제 수강 취소에는 접수 시 고지된 환불 규정이 적용됩니다." : "시연 예약은 마이페이지의 예매내역에서 취소할 수 있습니다. 실제 예매의 변경·취소 마감 시간과 수수료는 판매 조건에 따릅니다."}</p></article><article><h3>기록 확인</h3><p>이 사이트에서 작성한 내용은 현재 브라우저에 저장됩니다. 마이페이지의 ${education ? "신청내역" : "예매내역"}에서 다시 확인할 수 있습니다.</p>${link(education ? "신청내역 보기" : "예매내역 보기", education ? "/account/applications" : "/account/bookings")}</article></div></section><section class="program-guide-section"><h2>자주 묻는 안내</h2><div class="program-guide-faq">${(education
        ? [
                [
                    "처음 배우는 사람도 신청할 수 있나요?",
                    "강좌 상세의 참여 대상과 수업 구성을 확인해 주세요. 입문자를 위한 음악·미술 감상 강좌도 함께 소개합니다.",
                ],
                [
                    "백스테이지 투어도 신청할 수 있나요?",
                    "백스테이지 투어 상세에서 운영 내용을 살펴본 뒤 투어 신청하기로 이동할 수 있습니다.",
                ],
                [
                    "신청하면 실제로 접수되나요?",
                    "이 사이트는 체험용이며 실제 기관에 접수되거나 결제되지 않습니다. 신청 정보는 현재 브라우저에서만 확인할 수 있습니다.",
                ],
            ]
        : [
                [
                    "예매한 내역은 어디에서 볼 수 있나요?",
                    "상단의 마이페이지에서 예매내역으로 이동하면 이 브라우저에 저장한 시연 예약을 확인할 수 있습니다.",
                ],
                [
                    "단체로 관람하려면 어떻게 하나요?",
                    "단체관람 안내에서 작품과 희망 일정, 인원, 담당자 정보를 작성하여 단체 신청 흐름을 체험할 수 있습니다.",
                ],
                [
                    "온라인 예매가 어려운 경우에는요?",
                    "고객지원에서 자주 묻는 질문을 확인하거나 문의하기를 이용하세요. 휠체어석과 이동 지원 정보는 장애인 이용안내에서 확인할 수 있습니다.",
                ],
            ]
    )
        .map(
            ([title, detail]) =>
                `<details><summary>${title}${icon("plus", 20)}</summary><p>${detail}</p></details>`,
        )
        .join(
            "",
        )}</div></section>${note("본 사이트의 예매와 신청은 시연입니다. 실제 결제·기관 접수·좌석 확보는 이루어지지 않습니다.")}<div class="program-panel-actions">${button(education ? "교육 프로그램 찾기" : "프로그램 찾기", education ? "/programs/education" : "/programs", "yellow")}${link("고객지원", "/visit/support")}${education ? link("백스테이지 투어", "/programs/tour") : link("단체관람 안내", "/visit/group")}</div></div>`;
}

function renderTour(path) {
    const p = PROGRAMS.find((p) => p.id === "tour");
    return `${pageHeader(page(path, "무대의 감동이 만들어지는 곳. 커튼 너머 숨겨진 이야기를 만나보세요."))}<div class="container page-content"><section class="program-feature"><div class="program-feature__image"><img src="assets/images/venue-grand.svg" width="1000" height="700" alt="세종대극장 무대와 객석"></div><div class="program-feature__copy"><h2>객석에서 무대 뒤로.<br>새로운 시선의 세종.</h2><p>공연을 만드는 사람들의 공간, 무대 장치의 비밀, 극장이 품은 시간. 익숙한 공연장을 다른 시선으로 바라보는 여행을 시작합니다.</p><dl class="program-detail-meta"><div><dt>장소</dt><dd>세종대극장 일대</dd></div><div><dt>소요시간</dt><dd>약 90분</dd></div><div><dt>참가비 예시</dt><dd>${money(p.price)} / 1인</dd></div></dl>${programAction(p)}</div></section><section class="program-guide-section"><h2>극장의 이야기 속으로</h2>${guideSteps(
        [
            ["만남과 시작", "로비에서 극장의 역사와 공간에 대한 이야기를 듣습니다."],
            [
                "무대를 만드는 공간",
                "공연이 만들어지는 과정과 무대 기술을 알아봅니다.",
            ],
            [
                "보이지 않던 발견",
                "운영 상황에 맞춰 평소 접하기 어려운 공간을 살펴봅니다.",
            ],
            ["함께 나누는 이야기", "궁금했던 극장의 이야기를 묻고 경험을 나눕니다."],
        ],
    )}</section><div class="program-info-box"><h3>참여 전 꼭 확인하세요</h3><ul class="program-simple-list"><li>공연 준비와 시설 운영에 따라 방문 공간과 동선이 달라질 수 있습니다.</li><li>편안한 신발을 착용하고 진행자의 안내에 따라 이동해 주세요.</li><li>이동 지원이 필요한 경우 참여 전 고객지원에 문의해 주세요.</li><li>안내된 기간·가격·동선은 시연 예시이며 실제 운영 일정은 공식 공지를 확인해 주세요.</li></ul></div><div class="program-panel-actions">${programAction(p)}${link("일정·참여 정보 확인", "/programs/tour?tab=schedule&detail=1")}${link("투어 문의하기", "/visit/support/inquiry")}</div></div>`;
}

function renderHistory(path) {
    return `${pageHeader(page(path, "광화문 아래, 우리 역사의 두 큰 이야기를 만나는 열린 문화공간입니다."))}<div class="container page-content"><section class="program-history-hero"><h2>세종의 뜻을 읽고,<br>충무공의 용기를 만나다.</h2><p>세종대왕의 창조 정신과 충무공 이순신의 삶을 살펴보며<br>오늘의 우리에게 이어진 역사를 생각합니다.</p><div class="program-history-type" aria-hidden="true">훈민정음 <span>忠武公</span></div></section><div class="program-history-stories"><article><h2>세종이야기</h2><p>백성을 향한 마음과 새로운 생각으로 시대를 열었던 세종대왕. 한글 창제와 과학, 예술, 문화의 성취를 살펴보며 그 가치를 만납니다.</p><ul><li>한글의 창제와 훈민정음의 가치</li><li>백성의 생활을 바꾼 과학과 기술</li><li>세종 시대의 음악과 문화</li></ul></article><article><h2>충무공이야기</h2><p>어려운 순간에도 책임을 다했던 충무공 이순신. 삶과 기록, 바다에서의 여정을 통해 용기와 리더십의 의미를 돌아봅니다.</p><ul><li>이순신의 생애와 삶의 기록</li><li>조선 수군과 해전의 이야기</li><li>오늘에 이어지는 충무공의 정신</li></ul></article></div><section class="program-guide-section"><h2>방문을 준비해 보세요</h2><dl class="program-details-table"><div><dt>위치</dt><dd>광화문광장 지하 전시 공간</dd></div><div><dt>관람 형태</dt><dd>상설 전시 · 자유 관람</dd></div><div><dt>접근 안내</dt><dd>광화문역과 광화문광장 주변 이동 동선을 확인해 주세요.</dd></div><div><dt>운영 정보</dt><dd>운영시간, 휴관일, 체험 프로그램은 방문 전 공식 안내를 확인해 주세요.</dd></div></dl>${note("이 화면은 전시 공간 소개를 위한 시연입니다. 최신 운영시간과 체험 가능 여부를 실시간으로 제공하지 않습니다.")}<div class="program-panel-actions">${button("오시는 길", "/visit/directions", "yellow")}${link("단체관람 문의", "/visit/group")}${link("전시 프로그램 보기", "/programs/exhibition")}</div></section></div>`;
}

export function renderPrograms(path, query = new URLSearchParams()) {
    if (!path.startsWith("/programs")) return null;
    if (listPaths.includes(path)) return renderList(path, query);
    if (path === "/programs/season") return renderSeasonIndex(path);
    if (path.startsWith("/programs/season/")) {
        const season = seasons.find((s) => path === "/programs/season/" + s.id);
        if (season) return renderSeason(season, path);
    }
    if (path === "/programs/booking-guide") return renderGuide(path, false);
    if (path === "/programs/education/apply-guide")
        return renderGuide(path, true);
    if (path === "/programs/history") return renderHistory(path);
    if (path === "/programs/tour" && query.get("detail") !== "1")
        return renderTour(path);
    const program = PROGRAMS.find((p) => path === "/programs/" + p.id);
    if (program) return renderDetail(program, path, query);
    return `${pageHeader({ path, title: "프로그램을 찾을 수 없습니다", group: "programs", eyebrow: "PROGRAMS" })}<div class="container page-content">${emptyState("요청한 프로그램이 없습니다", "프로그램이 변경되었거나 주소가 올바르지 않습니다. 목록에서 다른 프로그램을 찾아보세요.", "/programs", "프로그램 목록으로")}</div>`;
}

export function bindPrograms(root, path, query = new URLSearchParams()) {
    const filter = root.querySelector("[data-program-filter]");
    if (filter) {
        const state = listState(path, query);
        filter.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(filter);
            const date = String(data.get("date") || "");
            navigate(
                url(path, {
                    ...state,
                    search: String(data.get("search") || "").trim(),
                    genre: data.get("genre"),
                    venue: data.get("venue"),
                    date,
                    month: date ? date.slice(0, 7) : state.month,
                }),
            );
        });
        root
            .querySelector("[data-filter-reset]")
            ?.addEventListener("click", () =>
                navigate(url(path, { view: state.view, month: state.month })),
            );
        const dates = [...root.querySelectorAll("[data-calendar-date]")];
        dates.forEach((day, index) => {
            day.addEventListener("focus", () => {
                dates.forEach((item) => {
                    item.tabIndex = item === day ? 0 : -1;
                });
            });
            day.addEventListener("keydown", (event) => {
                const offsets = {
                    ArrowLeft: -1,
                    ArrowRight: 1,
                    ArrowUp: -7,
                    ArrowDown: 7,
                };
                let target;
                if (Object.hasOwn(offsets, event.key))
                    target = index + offsets[event.key];
                else if (event.key === "Home") {
                    const weekday = new Date(day.dataset.calendarDate + "T12:00:00Z").getUTCDay();
                    target = index - weekday;
                } else if (event.key === "End") {
                    const weekday = new Date(day.dataset.calendarDate + "T12:00:00Z").getUTCDay();
                    target = index + 6 - weekday;
                }
                else return;
                event.preventDefault();
                dates[Math.max(0, Math.min(dates.length - 1, target))]?.focus();
            });
        });
    }
    const favorite = root.querySelector("[data-program-favorite]");
    favorite?.addEventListener("click", () => {
        const id = favorite.dataset.programFavorite;
        const saved = readStore("favorites", []);
        const exists = saved.includes(id);
        writeStore(
            "favorites",
            exists ? saved.filter((value) => value !== id) : [...saved, id],
        );
        favorite.setAttribute("aria-pressed", String(!exists));
        favorite.setAttribute(
            "aria-label",
            exists ? "관심 프로그램에 저장" : "관심 프로그램에서 삭제",
        );
        favorite.classList.toggle("is-saved", !exists);
        animateFeedback(favorite.querySelector("svg"), "favorite");
        toast(
            exists
                ? "관심 프로그램에서 삭제했습니다."
                : "관심 프로그램에 저장했습니다.",
        );
    });
    const tabs = [...root.querySelectorAll("[data-program-tab]")];
    // [탭의 방향과 키보드 반응 / Tab direction and immediate keyboard response]
    // 클릭은 이동 방향을 짧게 연결하고 화살표 키 탐색은 즉시 결과를 보여 줍니다.
    // Pointer changes retain direction; arrow-key navigation shows its result immediately.
    function selectTab(tab, immediate = false) {
        const previous = tabs.findIndex((item) => item.getAttribute("aria-selected") === "true");
        const next = tabs.indexOf(tab);
        if (previous === next) return;
        const active = tab.dataset.programTab;
        tabs.forEach((item) => {
            item.setAttribute("aria-selected", String(item === tab));
            item.tabIndex = item === tab ? 0 : -1;
        });
        root.querySelectorAll(".program-tab-panel").forEach((panel) => {
            cancelMotion(panel);
            panel.hidden = panel.id !== "program-panel-" + active;
            if (!panel.hidden && !immediate) animateFeedback(panel, next > previous ? "forward" : "backward");
        });
        const updated = new URLSearchParams(query);
        updated.set("tab", active);
        history.replaceState(null, "", href(path + "?" + updated.toString()));
    }
    tabs.forEach((tab, index) => {
        tab.addEventListener("click", (event) => selectTab(tab, event.detail === 0));
        tab.addEventListener("keydown", (event) => {
            let next;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft")
                next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            else return;
            event.preventDefault();
            tabs[next].focus();
            selectTab(tabs[next], true);
        });
    });
    const share = root.querySelector("[data-program-share]");
    const panel = root.querySelector("#program-share-panel");
    const input = root.querySelector("#program-share-url");
    // [공유 패널의 열기·닫기 / Reversible share-panel presence]
    // 논리 상태는 즉시 바꾸고 닫힘 중 재입력과 Escape의 초점 복귀를 보존합니다.
    // Update logical state immediately, allowing reversal and Escape focus restoration.
    share?.addEventListener("click", () => {
        const open = share.getAttribute("aria-expanded") !== "true";
        share.setAttribute("aria-expanded", String(open));
        animatePresence(panel, open, { trigger: share });
        if (open) {
            input.value = location.href;
            input.focus();
            input.select();
        }
    });
    panel?.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        share.setAttribute("aria-expanded", "false");
        animatePresence(panel, false, { trigger: share });
        share.focus();
    });
    root
        .querySelector("[data-copy-program]")
        ?.addEventListener("click", async () => {
            input.focus();
            input.select();
            try {
                await navigator.clipboard.writeText(input.value);
                toast("프로그램 주소를 복사했습니다.");
            } catch {
                toast(
                    "선택된 주소를 복사해 주세요. Ctrl+C 또는 복사를 이용할 수 있습니다.",
                );
            }
        });
}
