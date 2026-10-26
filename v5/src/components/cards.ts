// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { esc, href, icon, formatDate, readStore, todayISO } from "../lib/core.ts";

const lines = value => esc(value).replaceAll("\n", "<br>");

// [공통 포스터 매체 / Shared poster media]
// 목록과 상세 모두 같은 비율 유지 채우기 규칙을 사용합니다.
// Lists and detail pages share the same proportional fill rule.
export function posterMedia(program, { className = "program-art", tag = "", current = false, lazy = true } = {}) {
    return `<div class="poster-media ${esc(className)}"><img src="${esc(program.image)}" alt="${esc(program.title)} 포스터" ${lazy ? 'loading="lazy"' : ''} width="450" height="600" draggable="false">${tag ? `<span class="poster-tag${current ? " today" : ""}">${esc(tag)}</span>` : ""}</div>`;
}

// [카드-포스터 / Card-poster]
// 이미지와 아래 글을 하나의 링크·호버 영역으로 묶고 관심 버튼은 독립시킵니다.
// One link covers the media and copy; a separate overlay anchors the favorite to the poster.
export function programCard(program) {
    const favorite = readStore("favorites", []).includes(program.id);
    const current = program.start <= todayISO() && program.end >= todayISO();
    return `<article class="card card--poster program-card" data-card="poster" data-motion-key="program-${esc(program.id)}">
        <a class="card-poster-link" href="${href("/programs/" + program.id)}" draggable="false" aria-label="${esc(program.title)} 상세보기">
            ${posterMedia(program, { tag: current ? "진행 중" : program.category, current })}
            <div class="program-card-meta"><span>${esc(program.genre)}</span><span>${esc(program.status || "예매중")}</span></div>
            <h3>${esc(program.title)}</h3>
            <p class="program-card-date">${formatDate(program.start)} — ${formatDate(program.end)}</p>
            <p class="program-card-venue">${esc(program.venue)}</p>
        </a>
        <div class="card-poster-actions">
            <button type="button" class="favorite-button${favorite ? " selected" : ""}" data-favorite="${esc(program.id)}" aria-pressed="${favorite}" aria-label="${esc(program.title)} 관심 프로그램 ${favorite ? "해제" : "등록"}">${icon("heart", 24)}</button>
        </div>
    </article>`;
}

// [카드-히어로 / Card-hero]
// 재사용되는 슬라이드의 링크·정보·이미지 구조를 한곳에서 관리합니다.
// Keep the slide's full-card link, information and image in one component.
export function heroCard(item, active = false) {
    return `<article class="card card--hero season-slide season-${esc(item.theme)}${active ? " is-active" : ""}" data-card="hero" data-feature="${esc(item.id)}" ${active ? "" : 'inert aria-hidden="true"'}>
        <a class="season-card-link" href="${href("/programs/" + item.id)}" draggable="false" aria-label="${esc(item.name)} 자세히 보기">
            <img class="season-image" src="assets/images/${esc(item.image)}" alt="${esc(item.alt)}" width="1672" height="941" draggable="false" ${active ? 'fetchpriority="high"' : 'loading="eager"'}>
            <div class="season-copy"><p class="season-label">${esc(item.label)}</p><h2>${lines(item.title.replaceAll("<br>", "\n"))}</h2><p class="season-name">${esc(item.name)}</p><p class="season-meta">${esc(item.date)}<span>${esc(item.venue)}</span></p><span class="button button--yellow">공연·전시 자세히 보기 ${icon("arrow", 20)}</span></div>
        </a>
    </article>`;
}

// [카드-배너 / Card-banner]
// 큰 안내 배너도 카드의 변형으로 취급하며 전체 영역을 목적지에 연결합니다.
// A banner is a card variant with one destination covering the entire surface.
export function bannerCard({ id, title, path, action, year }) {
    return `<section class="card card--banner season-invitation container" id="${esc(id)}" data-card="banner" aria-labelledby="${esc(id)}-heading">
        <a class="card-banner-link" href="${href(path)}" draggable="false">
            <div><h2 id="${esc(id)}-heading">${lines(title)}</h2><span class="text-link">${esc(action)} ${icon("arrow", 22)}</span></div>
            <div class="invitation-art" aria-hidden="true"><span>${esc(year)}</span><i></i><b>SEJONG<br>SEASON</b></div>
        </a>
    </section>`;
}

// [공통 카드 입력 정책 / Shared card input policy]
// 우클릭을 유지하면서 이미지·텍스트·링크의 브라우저 기본 끌기를 막습니다.
// Preserve context menus while suppressing browser-native content dragging.
export function bindCards(root) {
    const preventDrag = event => { if (event.target.closest?.("[data-card]")) event.preventDefault(); };
    root.addEventListener("dragstart", preventDrag);
    return () => root.removeEventListener("dragstart", preventDrag);
}
