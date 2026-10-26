import { NAV, PAGES } from "./data.js";
import { esc, href, icon, formatDate, readStore, todayISO } from "./core.js";
export const button = (label, path, variant = "dark") =>
  `<a class="button button--${esc(variant)}" href="${href(path)}">${esc(label)}${icon("arrow", 18)}</a>`;
export function pageHeader(meta = {}) {
  const group = NAV.find((n) => n.id === meta.group);
  const pieces = meta.path?.split("/").filter(Boolean) || [];
  const ancestors = pieces
    .slice(0, -1)
    .map((_, i) =>
      PAGES.find((p) => p.path === "/" + pieces.slice(0, i + 1).join("/")),
    )
    .filter(Boolean);
  return `<section class="page-heading"><div class="container"><nav class="breadcrumbs" aria-label="현재 위치"><a href="#/">홈</a>${ancestors.map((p) => `<span aria-hidden="true">/</span><a href="${href(p.path)}">${esc(p.title)}</a>`).join("")}<span aria-hidden="true">/</span><span aria-current="page">${esc(meta.title || "세종문화회관")}</span></nav><div class="page-title-row"><div><p class="eyebrow">${esc(meta.eyebrow || group?.id?.toUpperCase() || "SEJONG CENTER")}</p><h1>${esc(meta.title || "세종문화회관")}</h1>${meta.description ? `<p class="page-description">${esc(meta.description)}</p>` : ""}</div><div class="heading-mark" aria-hidden="true">✳︎</div></div>${group ? `<nav class="subnav" aria-label="${esc(group.title)} 하위 메뉴">${group.items.map(([title, path]) => `<a href="${href(path)}" class="${meta.path === path || meta.path?.startsWith(path + "/") ? "active" : ""}">${esc(title)}</a>`).join("")}</nav>` : ""}</div></section>`;
}
export function programCard(p) {
  const fav = readStore("favorites", []).includes(p.id);
  const isToday = p.start <= todayISO() && p.end >= todayISO();
  return `<article class="program-card"><div class="program-art"><a href="${href("/programs/" + p.id)}" aria-label="${esc(p.title)} 상세보기"><img src="${esc(p.image)}" alt="${esc(p.title)} 프로그램 포스터" loading="lazy" width="450" height="600"></a><span class="poster-tag ${isToday ? "today" : ""}">${isToday ? "TODAY" : esc(p.category)}</span><button class="favorite-button ${fav ? "selected" : ""}" data-favorite="${esc(p.id)}" aria-pressed="${fav}" aria-label="${esc(p.title)} 관심 프로그램 ${fav ? "해제" : "등록"}">${icon("heart", 19)}</button></div><div class="program-card-meta"><span>${esc(p.genre)}</span><span>${esc(p.status || "예매중")}</span></div><h3><a href="${href("/programs/" + p.id)}">${esc(p.title)}</a></h3><p class="program-card-date">${formatDate(p.start)} — ${formatDate(p.end)}</p><p class="program-card-venue">${esc(p.venue)}</p></article>`;
}
export function emptyState(
  title,
  description,
  actionPath,
  actionLabel = "전체 보기",
) {
  return `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">◌</span><h2>${esc(title)}</h2><p>${esc(description)}</p>${actionPath ? button(actionLabel, actionPath) : ""}</div>`;
}
export const brand = () =>
  `<img class="brand-wordmark" src="assets/images/sejong-wordmark.png" alt="세종문화회관" width="236" height="43">`;
export function header() {
  return `<div class="header-inner"><a href="#/" class="brand" aria-label="세종문화회관 홈">${brand()}</a><nav class="primary-nav" aria-label="주 메뉴">${NAV.map((n) => `<div class="nav-item"><a href="${href(n.path)}" class="nav-link" data-nav="${n.id}" aria-expanded="false">${n.title}</a><div class="mega-panel"><div class="mega-heading"><span class="eyebrow">EXPLORE SEJONG</span><strong>${n.title}</strong><p>당신의 다음 순간을<br>세종에서 만나보세요.</p></div><div class="mega-links">${n.items.map(([t, p]) => `<a href="${href(p)}">${t}${icon("diagonal", 18)}</a>`).join("")}</div><a class="mega-feature" href="${href(n.id === "rental" ? "/rental/apply" : "/programs/season/sejong")}"><span>ART FOR EVERYONE</span><strong>${n.id === "rental" ? "당신의 무대가<br>시작되는 곳" : "예술이 있는<br>모든 순간"}</strong>${icon("arrow", 28)}</a></div></div>`).join("")}</nav><div class="header-actions"><a href="#/account/login" class="login-link">로그인</a><a href="#/english" class="language-link" aria-label="English visitor guide">EN</a><button class="icon-button search-toggle" aria-label="통합검색 열기" aria-expanded="false">${icon("search")}</button><button class="icon-button menu-toggle" aria-label="전체 메뉴 열기" aria-expanded="false">${icon("menu")}</button></div></div><div class="search-panel" hidden><form id="header-search" class="container"><label for="global-search">어떤 예술을 찾고 계신가요?</label><div class="search-input-wrap"><input id="global-search" name="q" type="search" placeholder="공연, 전시, 교육 또는 공간을 검색하세요" required autocomplete="off"><button class="icon-button" aria-label="검색">${icon("search", 30)}</button></div><div class="search-suggestions"><span>추천 검색어</span>${["클래식", "카르멘", "대관", "주차"].map((t) => `<a href="#/search?q=${encodeURIComponent(t)}">${t}</a>`).join("")}</div></form></div><div class="all-menu" hidden><div class="container"><div class="all-menu-top"><span class="eyebrow">ALL ABOUT SEJONG</span><a href="#/sitemap">전체 사이트맵 ${icon("diagonal", 16)}</a></div><div class="all-menu-grid">${NAV.map((n) => `<div><a class="menu-group-title" href="${href(n.path)}">${n.title}</a>${n.items.map(([t, p]) => `<a href="${href(p)}">${t}</a>`).join("")}</div>`).join("")}</div><div class="mobile-account"><a href="#/account">마이페이지</a><a href="#/account/bookings">예매내역</a><a href="#/account/favorites">관심 프로그램</a><a href="#/account/login">로그인</a><a href="#/english">ENGLISH</a></div></div></div>`;
}
export function footer() {
  return `<div class="container"><div class="footer-top"><a class="footer-brand" href="#/" aria-label="세종문화회관 홈"><img src="assets/images/sejong-wordmark.png" alt="세종문화회관" width="236" height="43" loading="lazy"><span>서울의 중심에서, 예술의 시작.</span></a><div class="footer-contact"><span>전화예매 및 문의</span><a href="tel:023991000">02-399-1000</a><p>재단법인 세종문화회관</p></div></div>
    <div class="footer-services"><nav aria-label="주요 서비스"><a href="#/visit/support">고객지원 ${icon("diagonal", 16)}</a><a href="#/news/newsletter">뉴스레터 ${icon("diagonal", 16)}</a><a href="#/programs">티켓 예매 ${icon("diagonal", 16)}</a></nav><label class="family-select"><span class="sr-only">관련 페이지</span><select id="family-site"><option value="">패밀리 사이트</option><option value="/about/companies">서울시예술단</option><option value="/programs/education">세종예술아카데미</option><option value="/programs/history">세종·충무공 이야기</option><option value="/about/arts-center">꿈의숲 아트센터</option></select></label></div>
    <div class="footer-links"><a class="footer-seoul" href="https://www.seoul.go.kr/" target="_blank" rel="noopener noreferrer" aria-label="서울특별시 홈페이지, 새 창"><img src="assets/images/seoul-footer-logo.png" alt="서울특별시 Seoul My Soul" width="454" height="76" loading="lazy"></a><nav aria-label="약관 및 정책"><a href="#/policy/terms">이용약관</a><a href="#/policy/privacy"><strong>개인정보처리방침</strong></a><a href="#/policy/email">이메일 무단수집거부</a><a href="#/sitemap">사이트맵</a></nav></div>
    <div class="footer-bottom"><div><p>03172 서울특별시 종로구 세종대로 175 (세종로)</p><p class="copyright">© SEJONG CENTER FOR THE PERFORMING ARTS.</p></div><div class="footer-demo"><span class="status-dot"></span> 리뉴얼 체험 사이트<p>공연 일정·요금은 예시이며, 예매·신청은 실제 접수되지 않습니다.</p></div></div>
  </div>`;
}
