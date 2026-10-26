import { PAGES, PROGRAMS } from "./data.js";
import {
  esc,
  href,
  getRoute,
  icon,
  readStore,
  writeStore,
  toast,
} from "./core.js";
import { header, footer, pageHeader, emptyState } from "./components.js";
import { renderHome, bindHome } from "./home.js";
import { renderPrograms, bindPrograms } from "./programs.js";
import { renderPages, bindPages } from "./pages.js";
import { renderFlows, bindFlows } from "./flows.js";
import { renderUtilities, bindUtilities } from "./utilities.js";
const main = document.querySelector("#main"),
  head = document.querySelector("#header");
head.innerHTML = header();
document.querySelector("#footer").innerHTML = footer();
let dispose = () => {};
let first = true;
function closePanels(focus = false) {
  head
    .querySelectorAll(".search-panel,.all-menu")
    .forEach((p) => (p.hidden = true));
  head
    .querySelectorAll(".search-toggle,.menu-toggle")
    .forEach((b) => b.setAttribute("aria-expanded", "false"));
  document.body.classList.remove("menu-open");
  if (focus) head.querySelector(".menu-toggle").focus();
}
function render() {
  dispose();
  dispose = () => {};
  closePanels();
  let path, query;
  try {
    ({ path, query } = getRoute());
  } catch {
    path = "/not-found";
    query = new URLSearchParams();
  }
  let html, bind;
  try {
    if (path === "/") {
      html = renderHome();
      bind = bindHome;
    } else {
      for (const [r, b] of [
        [renderFlows, bindFlows],
        [renderPrograms, bindPrograms],
        [renderPages, bindPages],
        [renderUtilities, bindUtilities],
      ]) {
        html = r(path, query);
        if (html !== null && html !== undefined) {
          bind = b;
          break;
        }
      }
    }
    if (html === null || html === undefined) {
      html =
        pageHeader({
          title: "페이지를 찾을 수 없습니다",
          eyebrow: "404 · NOT FOUND",
          path,
        }) +
        `<div class="container page-content">${emptyState("이 길의 끝에서, 다른 예술로.", "주소가 변경되었거나 존재하지 않는 페이지입니다. 전체 메뉴에서 원하는 페이지를 찾아보세요.", "/sitemap", "사이트맵 보기")}</div>`;
    }
    main.innerHTML = html;
    const clean = bind?.(main, path, query);
    if (typeof clean === "function") dispose = clean;
  } catch (error) {
    console.error("Page rendering failed", error);
    main.innerHTML =
      pageHeader({ title: "페이지를 불러오지 못했습니다", path }) +
      `<div class="container page-content">${emptyState("다시 한번 연결해 주세요.", "브라우저를 새로고침하거나 홈으로 이동해 주세요.", "/", "홈으로")}</div>`;
  }
  document.body.dataset.page = path;
  head
    .querySelectorAll(".nav-link")
    .forEach((a) =>
      a.classList.toggle("current", path.startsWith("/" + a.dataset.nav)),
    );
  document.title =
    (PAGES.find((p) => p.path === path)?.title ||
      (path.startsWith("/booking/") ? "프로그램 예매" : "세종문화회관")) +
    " | 세종문화회관";
  scrollTo({ top: 0, behavior: "instant" });
  if (!first) main.focus({ preventScroll: true });
  first = false;
  window.alert("이것은 공식 페이지가 아닙니다.\nThis is not an official website.");
}
window.addEventListener("hashchange", render);
document.querySelector(".skip-link").addEventListener("click", (e) => {
  e.preventDefault();
  main.focus({ preventScroll: true });
  main.scrollIntoView({ behavior: "instant", block: "start" });
});
head.querySelector(".menu-toggle").addEventListener("click", () => {
  const panel = head.querySelector(".all-menu");
  const was = panel.hidden;
  closePanels();
  panel.hidden = !was;
  head.querySelector(".menu-toggle").setAttribute("aria-expanded", String(was));
  document.body.classList.toggle("menu-open", was);
});
head.querySelector(".search-toggle").addEventListener("click", () => {
  const panel = head.querySelector(".search-panel");
  const was = panel.hidden;
  closePanels();
  panel.hidden = !was;
  head
    .querySelector(".search-toggle")
    .setAttribute("aria-expanded", String(was));
  if (was) head.querySelector("#global-search").focus();
});
head.querySelector("#header-search").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = new FormData(e.currentTarget).get("q").trim();
  if (q) {
    location.hash = href("/search?q=" + encodeURIComponent(q));
    closePanels();
  }
});
head.addEventListener("click", (e) => {
  if (e.target.closest("a")) closePanels();
});
head.querySelectorAll(".nav-item").forEach((n) => {
  const link = n.querySelector(".nav-link");
  n.addEventListener("mouseenter", () => {
    n.classList.remove("is-dismissed");
    link.setAttribute("aria-expanded", "true");
  });
  n.addEventListener("mouseleave", () =>
    link.setAttribute(
      "aria-expanded",
      String(
        n.contains(document.activeElement) &&
          !n.classList.contains("is-dismissed"),
      ),
    ),
  );
  n.addEventListener("focusin", (e) => {
    if (!n.contains(e.relatedTarget)) n.classList.remove("is-dismissed");
    link.setAttribute(
      "aria-expanded",
      String(!n.classList.contains("is-dismissed")),
    );
  });
  n.addEventListener("focusout", (e) => {
    if (!n.contains(e.relatedTarget))
      link.setAttribute("aria-expanded", "false");
  });
  link.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      n.classList.remove("is-dismissed");
      link.setAttribute("aria-expanded", "true");
      n.querySelector(".mega-links a")?.focus();
    }
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const focused =
      head.querySelector('.search-toggle[aria-expanded="true"]') ||
      head.querySelector('.menu-toggle[aria-expanded="true"]');
    closePanels();
    focused?.focus();
    const item = document.activeElement?.closest(".nav-item");
    if (item) {
      item.classList.add("is-dismissed");
      const link = item.querySelector(".nav-link");
      link.focus();
      link.setAttribute("aria-expanded", "false");
    }
  }
});
document.addEventListener("click", (e) => {
  if (!head.contains(e.target)) closePanels();
  const b = e.target.closest("[data-favorite]");
  if (b) {
    const id = b.dataset.favorite;
    if (!PROGRAMS.some((p) => p.id === id)) return;
    const previous = readStore("favorites", []).filter(
        (x) => typeof x === "string",
      ),
      exists = previous.includes(id);
    writeStore(
      "favorites",
      exists
        ? previous.filter((x) => x !== id)
        : [...new Set([...previous, id])],
    );
    document.querySelectorAll(`[data-favorite="${id}"]`).forEach((el) => {
      el.classList.toggle("selected", !exists);
      el.setAttribute("aria-pressed", String(!exists));
      el.setAttribute(
        "aria-label",
        PROGRAMS.find((p) => p.id === id).title +
          " 관심 프로그램 " +
          (exists ? "등록" : "해제"),
      );
    });
    toast(
      exists
        ? "관심 프로그램에서 삭제했습니다."
        : "관심 프로그램에 저장했습니다.",
    );
  }
});
document.querySelector("#family-site").addEventListener("change", (e) => {
  if (e.target.value) location.hash = href(e.target.value);
  e.target.value = "";
});
document
  .querySelector(".back-to-top")
  .addEventListener("click", () =>
    scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    }),
  );
window.addEventListener(
  "scroll",
  () =>
    document
      .querySelector(".back-to-top")
      .classList.toggle("visible", scrollY > 600),
  { passive: true },
);
render();
