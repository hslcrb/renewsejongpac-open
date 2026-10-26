import { PAGES, PROGRAMS } from "./data/catalog.js";
import { getRoute, href, readStore, writeStore, toast } from "./lib/core.js";
import { header, footer, pageHeader, emptyState } from "./components/ui.js";
import { bindCards } from "./components/cards.js";
import { renderHome, bindHome } from "./features/home.js";
import { renderPrograms, bindPrograms } from "./features/programs.js";
import { renderPages, bindPages } from "./features/pages.js";
import { renderFlows, bindFlows } from "./features/flows.js";
import { renderUtilities, bindUtilities } from "./features/utilities.js";

const main = document.querySelector("#main");
const head = document.querySelector("#header");
let dispose = () => {};
let initial = true;

head.innerHTML = header();
document.querySelector("#footer").innerHTML = footer();

function closeDialogs() {
    head.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
}

function render() {
    if (!initial && location.hash && !location.hash.startsWith("#/")) {
        const target = document.getElementById(location.hash.slice(1));
        target?.scrollIntoView();
        target?.focus({ preventScroll: true });
        return;
    }
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
    try {
        let html;
        let bind;
        if (path === "/") {
            html = renderHome();
            bind = bindHome;
        } else {
            for (const [renderer, binder] of [[renderFlows, bindFlows], [renderPrograms, bindPrograms], [renderPages, bindPages], [renderUtilities, bindUtilities]]) {
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
        dispose = () => { if (typeof cleanup === "function") cleanup(); disposeCards(); };
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
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!initial) main.focus({ preventScroll: true });
    initial = false;
    window.alert("이것은 공식 페이지가 아닙니다.\nThis is not an official website.");
}

head.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-open-dialog]");
    if (opener) document.getElementById(opener.dataset.openDialog).showModal();
    const closer = event.target.closest("[data-close-dialog]");
    if (closer) closer.closest("dialog").close();
    if (event.target.matches("dialog") || event.target.closest("dialog a")) closeDialogs();
});

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
    });
    toast(exists ? "관심 프로그램에서 삭제했어요." : "관심 프로그램에 저장했어요.");
});

document.querySelector("#family-site").addEventListener("change", (event) => {
    if (event.target.value) location.hash = href(event.target.value);
    event.target.value = "";
});

const topButton = document.querySelector(".return-top");
topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
window.addEventListener("scroll", () => { topButton.hidden = window.scrollY < 800; }, { passive: true });
window.addEventListener("hashchange", render);
render();
