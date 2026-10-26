// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { PAGES, PROGRAMS } from "./data/catalog.ts";
import { getRoute, href, readStore, writeStore, toast, todayISO } from "./lib/core.ts";
import { header, footer, pageHeader, emptyState } from "./components/ui.ts";
import { bindCards } from "./components/cards.ts";
import { animateFeedback, animateSequence, captureLayout, animateLayout, bindPageMotion, bindShellMotion, bindReturnTop } from "./components/motion.ts";
import { renderHome, bindHome } from "./features/home.ts";
import { renderPrograms, bindPrograms } from "./features/programs.ts";
import { renderPages, bindPages } from "./features/pages.ts";
import { renderFlows, bindFlows } from "./features/flows.ts";
import { renderUtilities, bindUtilities } from "./features/utilities.ts";
import { renderGoods, bindGoods } from "./features/goods.ts";
import { renderStory, bindStory } from "./features/story.ts";
import { renderJourneys, bindJourneys } from "./features/journeys.ts";
import { renderDesignRules, bindDesignRules } from "./features/design-rules.ts";
import { onAuthStateChange } from "./lib/supabase.ts";

export function initSejongApp() {
    if (typeof window === "undefined") return;

    // Supabase Auth 상태 동기화 (Google OAuth 로그인 등)
    onAuthStateChange((event, session) => {
        if (session && session.user) {
            const user = session.user;
            const meta = user.user_metadata || {};
            const name = meta.full_name || meta.name || user.email?.split("@")[0] || "회원";
            const email = user.email || "";
            const phone = meta.phone || "";

            writeStore("session", { active: true, user_id: user.id });
            writeStore("profile", { name, email, phone });
            
            // 만약 현재 OAuth 콜백 해시 처리 중이거나 계정 페이지라면 렌더링 갱신
            if (event === "SIGNED_IN") {
                toast(`${name}님, Google 계정으로 로그인되었습니다.`);
            }
        } else if (event === "SIGNED_OUT") {
            writeStore("session", { active: false });
        }
    });

    const main = document.querySelector("#main");
    const head = document.querySelector("#header");
    if (!main || !head) return;

    let dispose = () => {};
    let initial = true;
    let previousPath = null;
    let previousView = "";
    let previousQuery = new URLSearchParams();
    let keyboardInput = false;

    document.addEventListener("keydown", () => { keyboardInput = true; }, { capture: true });
    document.addEventListener("pointerdown", () => { keyboardInput = false; }, { capture: true });

    head.innerHTML = header();
    const footerEl = document.querySelector("#footer");
    if (footerEl) footerEl.innerHTML = footer();
    const shellMotion = bindShellMotion(head);
    if (footerEl) bindPageMotion(footerEl);

    function closeDialogs() {
        shellMotion?.closeDialogs?.({ immediate: true, restoreFocus: false });
    }

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
            calendarDate: element.dataset?.calendarDate,
        };
    }

    function restoreFocus(previous) {
        if (!previous) return false;
        const element = previous.id ? document.getElementById(previous.id) :
            [...main.querySelectorAll("a, button, input, select, textarea")].find(candidate => {
                if (candidate.tagName !== previous.tag || candidate.getAttribute("type") !== previous.type) return false;
                if (previous.name) return candidate.getAttribute("name") === previous.name;
                if (previous.calendarDate) return candidate.dataset?.calendarDate === previous.calendarDate;
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
            target?.scrollIntoView?.();
            target?.focus?.({ preventScroll: true });
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
            ({ path, query } = getRoute());
        } catch {
            path = "/not-found";
        }

        const view = JSON.stringify(["document", "issue", "step", "receipt", "detail"].map(key => query.get(key)));
        const samePage = !initial && previousPath === path && previousView === view;
        let disposeFeature = () => {};
        try {
            let html;
            let bind;
            if (path === "/") {
                html = renderHome();
                bind = bindHome;
            } else if (path === "/design-rules") {
                html = renderDesignRules();
                bind = bindDesignRules;
            } else {
                for (const [renderer, binder] of [[renderJourneys, bindJourneys], [renderStory, bindStory], [renderFlows, bindFlows], [renderPrograms, bindPrograms], [renderGoods, bindGoods], [renderPages, bindPages], [renderUtilities, bindUtilities]]) {
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

        const disposePageMotion = bindPageMotion(main, { enter: !samePage });
        if (samePage) {
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

    const siteSearch = document.querySelector("#site-search");
    if (siteSearch) {
        siteSearch.addEventListener("submit", (event) => {
            event.preventDefault();
            const query = new FormData(event.currentTarget).get("q")?.trim?.();
            if (query) {
                location.hash = href("/search?q=" + encodeURIComponent(query));
                closeDialogs();
            }
        });
    }

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

    const familySite = document.querySelector("#family-site");
    if (familySite) {
        familySite.addEventListener("change", (event) => {
            if (event.target.value) location.hash = href(event.target.value);
            event.target.value = "";
        });
    }

    const topButton = document.querySelector(".return-top");
    if (topButton) {
        topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
        bindReturnTop(topButton);
    }

    window.addEventListener("hashchange", render);
    render();
}
