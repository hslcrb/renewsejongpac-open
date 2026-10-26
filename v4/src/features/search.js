import { PAGES } from "../data/catalog.js";
import { esc, href, icon } from "../lib/core.js";
import { SEARCH_KINDS, searchContent } from "../lib/discovery.js";
import { pageHeader, emptyState } from "../components/ui.js";

// [검색 결과의 분류와 다음 행동 / Group search results and next actions]
// 검색어를 유지하며 콘텐츠 유형을 좁히고 실제 상세 화면으로 연결합니다.
// Preserve the query across category changes and link to real detail pages.
export function renderSearch(query = new URLSearchParams()) {
    const q = (query.get("q") || "").trim();
    const kind = SEARCH_KINDS.some(([id]) => id === query.get("type")) ? query.get("type") : "all";
    const all = searchContent(q);
    const results = kind === "all" ? all : all.filter(item => item.kind === kind);
    const categories = SEARCH_KINDS.filter(([id]) => id !== "all");
    const count = id => id === "all" ? all.length : all.filter(item => item.kind === id).length;
    const path = id => href("/search?" + new URLSearchParams({ q, type: id }));
    return `${pageHeader({ ...PAGES.find(page => page.path === "/search"), description: "공연, 공간, 그리고 관람에 필요한 모든 것." })}
        <div class="container page-content discovery-page">
            <form class="search-results-form" id="search-page-form">
                <label class="sr-only" for="search-query">검색어</label>
                <input id="search-query" name="q" type="search" value="${esc(q)}" placeholder="어떤 예술을 찾고 계세요?" required>
                <button class="button button--dark" type="submit">검색 ${icon("search", 20)}</button>
            </form>
            <nav class="discovery-types" aria-label="검색 결과 종류">${SEARCH_KINDS.map(([id, label]) => `<a href="${path(id)}" ${kind === id ? 'aria-current="page"' : ""}>${label}<span>${count(id)}</span></a>`).join("")}</nav>
            ${q ? `<p class="search-count" role="status">‘<strong>${esc(q)}</strong>’ 검색 결과 <strong>${results.length}</strong>건</p>` : ""}
            ${results.length ? categories.filter(([id]) => results.some(item => item.kind === id)).map(([id, label]) => `<section class="discovery-group" aria-labelledby="search-${id}"><h2 id="search-${id}">${label}<span>${count(id)}</span></h2><div class="discovery-results">${results.filter(item => item.kind === id).map(item => `<article class="search-result"><a href="${href(item.path)}">${item.image ? `<img src="${esc(item.image)}" alt="" width="88" height="112" loading="lazy">` : ""}<div><h3>${esc(item.title)}</h3>${item.detail ? `<p class="discovery-detail">${esc(item.detail)}</p>` : ""}${item.description ? `<p>${esc(item.description)}</p>` : ""}</div>${icon("arrow", 22)}</a></article>`).join("")}</div></section>`).join("") : emptyState(q ? "아직 찾지 못했어요" : "당신의 다음 예술을 찾아보세요", q ? "공연명이나 공간 이름을 짧게 입력하거나, 아래 주제에서 시작해 보세요." : "공연부터 방문 준비까지, 필요한 정보를 한곳에서 찾을 수 있어요.", "/programs", "프로그램 둘러보기")}
            <div class="discovery-suggestions"><h2>이런 정보도 찾고 계신가요?</h2><a href="#/visit/plan">나의 방문 계획 ${icon("arrow", 20)}</a><a href="#/rental/compare">대관 공간 비교 ${icon("arrow", 20)}</a><a href="#/visit/accessibility">모두를 위한 관람 ${icon("arrow", 20)}</a><a href="#/account/bookings">예매내역 확인 ${icon("arrow", 20)}</a></div>
        </div>`;
}
