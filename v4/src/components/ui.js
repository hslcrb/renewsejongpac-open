import { NAV, PAGES } from "../data/catalog.js";
import { esc, href, icon } from "../lib/core.js";

export const button = (label, path, variant = "dark") =>
    `<a class="button button--${esc(variant)}" href="${href(path)}">${esc(label)}${icon("arrow", 18)}</a>`;

export function pageHeader(meta = {}) {
    const group = NAV.find((item) => item.id === meta.group);
    const pieces = meta.path?.split("/").filter(Boolean) || [];
    const ancestors = pieces.slice(0, -1).map((_, index) =>
        PAGES.find((item) => item.path === "/" + pieces.slice(0, index + 1).join("/"))
    ).filter(Boolean);

    return `<section class="page-heading" id="page-heading">
        <div class="container">
            <nav class="breadcrumbs" aria-label="현재 위치">
                <a href="#/">홈</a>
                ${ancestors.map((item) => `<span aria-hidden="true">/</span><a href="${href(item.path)}">${esc(item.title)}</a>`).join("")}
                <span aria-hidden="true">/</span><span aria-current="page">${esc(meta.title || "세종문화회관")}</span>
            </nav>
            <div class="page-title-row">
                <div>
                    <h1>${esc(meta.title || "세종문화회관")}</h1>
                    ${meta.description ? `<p class="page-description">${esc(meta.description)}</p>` : ""}
                </div>
            </div>
            ${group ? `<nav class="subnav" aria-label="${esc(group.title)} 하위 메뉴">${group.items.map(([title, path]) => `<a href="${href(path)}" ${meta.path === path || meta.path?.startsWith(path + "/") ? 'class="active" aria-current="page"' : ""}>${esc(title)}</a>`).join("")}</nav>` : ""}
        </div>
    </section>`;
}

export { programCard } from "./cards.js";

export function emptyState(title, description, actionPath, actionLabel = "전체 보기") {
    return `<div class="empty-state"><span aria-hidden="true">${icon("search", 36)}</span><h2>${esc(title)}</h2><p>${esc(description)}</p>${actionPath ? button(actionLabel, actionPath) : ""}</div>`;
}

export const brand = () => `<img class="sejong-wordmark" src="assets/images/sejong-wordmark.png" alt="세종문화회관" width="236" height="43">`;

export function header() {
    return `<div class="project-note"><span>v4 · 예술로 이어지는 하루 <span lang="en">· Unofficial design concept</span></span><a href="../index.html">버전 선택 ${icon("diagonal", 13)}</a></div>
        <div class="masthead container">
            <a href="#/" class="sejong-brand" aria-label="세종문화회관 홈">${brand()}</a>
            <nav class="desktop-nav" aria-label="주 메뉴">${NAV.map((item) => `<a href="${href(item.path)}" data-nav="${item.id}">${item.title}</a>`).join("")}</nav>
            <div class="masthead-actions">
                <a href="#/account/login" class="account-link">로그인</a>
                <a href="#/account/signup" class="account-link signup-link">회원가입</a>
                <a href="#/english" class="english-link" lang="en">EN</a>
                <button type="button" class="round-button" data-open-dialog="search-dialog" aria-label="통합검색 열기">${icon("search", 23)}</button>
                <button type="button" class="round-button" data-open-dialog="menu-dialog" aria-label="전체 메뉴 열기">${icon("menu", 23)}</button>
            </div>
        </div>
        <dialog class="navigation-dialog" id="search-dialog" aria-labelledby="search-heading">
            <div class="dialog-top"><button type="button" class="round-button" data-close-dialog aria-label="검색 닫기">${icon("close")}</button></div>
            <h2 id="search-heading">어떤 예술을 찾고 계세요?</h2>
            <form class="site-search" id="site-search"><label class="sr-only" for="global-query">검색어</label><input id="global-query" name="q" type="search" placeholder="공연, 전시, 공간을 검색해 보세요" required autocomplete="off"><button class="round-button" type="submit" aria-label="검색">${icon("search")}</button></form>
            <div class="search-terms"><span>추천 검색어</span>${["일무", "클래식", "주차", "대관"].map((term) => `<a href="#/search?q=${encodeURIComponent(term)}">${term}</a>`).join("")}</div>
        </dialog>
        <dialog class="navigation-dialog menu-dialog" id="menu-dialog" aria-labelledby="menu-heading">
            <div class="dialog-top"><h2 id="menu-heading">세종의 모든 순간</h2><button type="button" class="round-button" data-close-dialog aria-label="전체 메뉴 닫기">${icon("close")}</button></div>
            <div class="menu-journeys"><a href="#/visit/plan"><span>예술을 만나는 하루</span><strong>나의 방문 계획 ${icon("arrow", 22)}</strong></a><a href="#/rental/compare"><span>새로운 무대를 준비할 때</span><strong>대관 공간 비교 ${icon("arrow", 22)}</strong></a></div>
            <nav class="menu-columns" aria-label="전체 메뉴">${NAV.map((group) => `<div><a class="menu-title" href="${href(group.path)}">${group.title}</a>${group.items.map(([label, path]) => `<a href="${href(path)}">${esc(label)}</a>`).join("")}</div>`).join("")}</nav>
            <nav class="menu-utilities" aria-label="개인 서비스"><a href="#/account">마이페이지</a><a href="#/account/bookings">예매내역</a><a href="#/account/favorites">관심 프로그램</a><a href="#/sitemap">사이트맵</a><a href="#/english" lang="en">English guide</a></nav>
        </dialog>`;
}

export function footer() {
    return `<div class="footer-utility"><div class="container"><p>예술과 더 가까워지는 방법.</p><a href="#/news/newsletter">세종의 소식 받아보기 ${icon("arrow", 22)}</a></div></div>
        <div class="container footer-main">
            <div class="footer-identity"><a href="#/" aria-label="세종문화회관 홈">${brand()}</a><p>서울의 중심에서<br>당신의 일상에 예술을.</p><span class="identity-marks" aria-hidden="true"><i></i><i></i><i></i></span></div>
            <div class="footer-information"><nav class="footer-policy" aria-label="정책과 안내"><a href="#/policy/privacy">개인정보처리방침</a><a href="#/policy/terms">이용약관</a><a href="#/visit/support">고객지원</a><a href="#/sitemap">사이트맵</a></nav><address>서울특별시 종로구 세종대로 175<br>재단법인 세종문화회관</address><p class="footer-small">© SEJONG CENTER FOR THE PERFORMING ARTS.</p><p class="footer-small">이것은 공식 페이지가 아닙니다. <span lang="en">This is not an official website.</span><br>프로그램·일정·요금은 체험용이며 실제 예매나 신청은 이루어지지 않습니다.</p></div>
            <div class="footer-service"><span>전화예매 및 문의</span><a class="footer-phone" href="tel:023991000">02-399-1000</a><label for="family-site" class="sr-only">관련 페이지</label><select id="family-site"><option value="">패밀리 사이트</option><option value="/about/companies">서울시예술단</option><option value="/programs/education">세종예술아카데미</option><option value="/programs/history">세종·충무공 이야기</option></select><a class="version-link" href="../index.html">버전 비교 ${icon("diagonal", 16)}</a></div>
        </div>`;
}
