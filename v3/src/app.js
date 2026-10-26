import { PAGES, PROGRAMS } from "./data/catalog.js";
import { getRoute, href, readStore, writeStore, toast, todayISO } from "./lib/core.js";
import { header, footer, pageHeader, emptyState } from "./components/ui.js";
import { bindCards } from "./components/cards.js";
import { animateFeedback, animateSequence, captureLayout, animateLayout, bindPageMotion, bindShellMotion, bindReturnTop } from "./components/motion.js";
import { renderHome, bindHome } from "./features/home.js";
import { renderPrograms, bindPrograms } from "./features/programs.js";
import { renderPages, bindPages } from "./features/pages.js";
import { renderFlows, bindFlows } from "./features/flows.js";
import { renderUtilities, bindUtilities } from "./features/utilities.js";
import { renderGoods, bindGoods } from "./features/goods.js";

const main = document.querySelector("#main");
const head = document.querySelector("#header");
let dispose = () => {};
let initial = true;
let previousPath = null;
let previousView = "";
let previousQuery = new URLSearchParams();
let keyboardInput = false;

document.addEventListener("keydown", () => { keyboardInput = true; }, { capture: true });
document.addEventListener("pointerdown", () => { keyboardInput = false; }, { capture: true });

head.innerHTML = header();
document.querySelector("#footer").innerHTML = footer();
const shellMotion = bindShellMotion(head);
bindPageMotion(document.querySelector("#footer"));

function closeDialogs() {
    shellMotion.closeDialogs({ immediate: true, restoreFocus: false });
}

// [같은 페이지의 검색 조건 갱신 / Same-page filter updates]
// 조건만 바꿀 때는 읽던 위치와 입력 포커스를 이어 가고 실제 페이지 이동만 처음부터 보여 줍니다.
// Preserve reading position and input focus for filters; start fresh only on a new page.
function rememberFocus() {
    const element = document.activeElement;
    if (!main.contains(element) || element === main) return null;
    return {
        id: element.id,
        tag: element.tagName,
        name: element.getAttribute("name"),
        href: element.getAttribute("href"),
        text: element.textContent,
        type: element.getAttribute("type"),
        label: element.getAttribute("aria-label"),
        calendarDate: element.dataset.calendarDate,
    };
}

function restoreFocus(previous) {
    if (!previous) return false;
    const element = previous.id ? document.getElementById(previous.id) :
        [...main.querySelectorAll("a, button, input, select, textarea")].find(candidate => {
            if (candidate.tagName !== previous.tag || candidate.getAttribute("type") !== previous.type) return false;
            if (previous.name) return candidate.getAttribute("name") === previous.name;
            if (previous.calendarDate) return candidate.dataset.calendarDate === previous.calendarDate;
            if (previous.label) return candidate.getAttribute("aria-label") === previous.label;
            return candidate.getAttribute("href") === previous.href && candidate.textContent === previous.text;
        });
    if (!element || !main.contains(element)) return false;
    element.focus({ preventScroll: true });
    return document.activeElement === element;
}

function render() {
    if (!initial && location.hash && !location.hash.startsWith("#/")) {
        const target = document.getElementById(location.hash.slice(1));
        target?.scrollIntoView();
        target?.focus({ preventScroll: true });
        return;
    }
    const focus = rememberFocus();
    const position = { left: window.scrollX, top: window.scrollY };
    const cardPositions = captureLayout(main, ".program-results-grid > .program-card");
    dispose();
    dispose = () => {};
    closeDialogs();
    let path = "/";
    let query = new URLSearchParams();
    try {
        if (location.hash.startsWith("#/")) ({ path, query } = getRoute());
    } catch {
        path = "/not-found";
    }
    // [검색 조건과 새 화면의 구분 / Distinguish filters from a new view]
    // 같은 경로라도 자료·기사·주문 단계·투어 상세가 바뀌면 제목에서 읽기를 다시 시작합니다.
    // Document, issue, checkout and tour-detail changes begin at the new heading even on the same path.
    const view = JSON.stringify(["document", "issue", "step", "receipt", "detail"].map(key => query.get(key)));
    const samePage = !initial && previousPath === path && previousView === view;
    let disposeFeature = () => {};
    try {
        let html;
        let bind;
        if (path === "/") {
            html = renderHome();
            bind = bindHome;
        } else {
            for (const [renderer, binder] of [[renderFlows, bindFlows], [renderPrograms, bindPrograms], [renderGoods, bindGoods], [renderPages, bindPages], [renderUtilities, bindUtilities]]) {
                html = renderer(path, query);
                if (html !== null && html !== undefined) {
                    bind = binder;
                    break;
                }
            }
        }
        main.innerHTML = html ?? pageHeader({ title: "페이지를 찾을 수 없어요", path }) + `<div class="container page-content">${emptyState("다른 페이지에서 만나볼까요?", "주소를 확인하거나 전체 프로그램을 살펴보세요.", "/programs", "프로그램 보기")}</div>`;
        const cleanup = bind?.(main, path, query);
        const disposeCards = bindCards(main);
        disposeFeature = () => { if (typeof cleanup === "function") cleanup(); disposeCards(); };
    } catch (error) {
        console.error("Page rendering failed", error);
        main.innerHTML = pageHeader({ title: "페이지를 불러오지 못했어요", path }) + `<div class="container page-content">${emptyState("다시 한번 연결해 주세요", "새로고침하거나 홈에서 다시 시작해 주세요.", "/", "홈으로")}</div>`;
    }
    document.body.dataset.page = path;
    head.querySelectorAll("[data-nav]").forEach((link) => {
        if (path.startsWith("/" + link.dataset.nav)) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    });
    document.title = `${PAGES.find((item) => item.path === path)?.title || (path.startsWith("/booking/") ? "예매 체험" : "예술로 채우는 일상")} | 세종문화회관`;
    window.scrollTo({ ...(samePage ? position : { left: 0, top: 0 }), behavior: "instant" });
    if (samePage) {
        if (!restoreFocus(focus)) main.focus({ preventScroll: true });
    } else if (!initial) main.focus({ preventScroll: true });
    // [고지 이후의 실제 페이지 진입 / Begin visible motion after the native notice]
    // 필수 고지를 닫기 전에 진입 애니메이션이 끝나 버리지 않도록 시작 순서를 맞춥니다.
    // Keep the notice while starting entrances only when the page can actually be seen.
    window.alert("이것은 공식 페이지가 아닙니다.\nThis is not an official website.");
    const disposePageMotion = bindPageMotion(main, { enter: !samePage });
    if (samePage) {
        // [달력 방향과 결과의 연속성 / Calendar direction and result continuity]
        // 월 이동만 방향을 표현하고 날짜·입력·금액은 즉시 읽을 수 있는 위치를 유지합니다.
        // Show direction only for month navigation; keep dates, inputs and amounts immediately readable.
        const monthOf = values => values.get("month") || values.get("date")?.slice(0, 7) || todayISO().slice(0, 7);
        const month = monthOf(query);
        const oldMonth = monthOf(previousQuery);
        main.querySelectorAll(".program-calendar__grid, .rental-calendar-grid").forEach(element => {
            if (month !== oldMonth) animateFeedback(element, keyboardInput ? "content" : month > oldMonth ? "forward" : "backward");
            else if (previousQuery.get("view") !== query.get("view") || previousQuery.get("venue") !== query.get("venue")) animateFeedback(element, "content");
        });
        main.querySelectorAll(".program-results-grid").forEach(element => animateLayout(element, cardPositions, ".program-card"));
        animateSequence(main.querySelectorAll(".search-result"));
        main.querySelectorAll(".faq-list, .notice-rows, .search-count, .empty-state").forEach(element => animateFeedback(element, "content"));
    }
    dispose = () => { disposePageMotion(); disposeFeature(); };
    previousPath = path;
    previousView = view;
    previousQuery = new URLSearchParams(query);
    initial = false;
}

document.querySelector("#site-search").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q").trim();
    if (query) {
        location.hash = href("/search?q=" + encodeURIComponent(query));
        closeDialogs();
    }
});

document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-favorite]");
    if (!control) return;
    const program = PROGRAMS.find((item) => item.id === control.dataset.favorite);
    if (!program) return;
    const previous = readStore("favorites", []).filter((id) => typeof id === "string");
    const exists = previous.includes(program.id);
    writeStore("favorites", exists ? previous.filter((id) => id !== program.id) : [...new Set([...previous, program.id])]);
    document.querySelectorAll(`[data-favorite="${program.id}"]`).forEach((node) => {
        node.classList.toggle("selected", !exists);
        node.setAttribute("aria-pressed", String(!exists));
        node.setAttribute("aria-label", `${program.title} 관심 프로그램 ${exists ? "등록" : "해제"}`);
        animateFeedback(node, "favorite");
    });
    toast(exists ? "관심 프로그램에서 삭제했어요." : "관심 프로그램에 저장했어요.");
});

document.querySelector("#family-site").addEventListener("change", (event) => {
    if (event.target.value) location.hash = href(event.target.value);
    event.target.value = "";
});

const topButton = document.querySelector(".return-top");
topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
bindReturnTop(topButton);
window.addEventListener("hashchange", render);
render();
