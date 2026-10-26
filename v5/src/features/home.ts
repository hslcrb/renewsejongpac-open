// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { PROGRAMS, NOTICES } from "../data/catalog.ts";
import { esc, icon, formatDate } from "../lib/core.ts";
import { programCard, heroCard } from "../components/cards.ts";
import { bindHero } from "../components/carousel.ts";
import { captureLayout, animateLayout, cancelMotion } from "../components/motion.ts";
import { renderHomeBooking, bindHomeBooking } from "./home-booking.ts";
import { discoverPrograms, seoulToday } from "./home-domain.ts";

const features = [
    { id: "dance", theme: "dance", label: "2026 세종시즌 · 서울시무용단", title: "일상을 깨우는,<br>예술의 순간.", name: "서울시무용단 〈일무〉", date: "2026.10.20 — 10.25", venue: "세종대극장", image: "hero-dance.png", alt: "금빛 무대에서 춤추는 무용수의 리뉴얼 콘셉트 이미지" },
    { id: "carmen", theme: "opera", label: "2026 세종시즌 · 서울시오페라단", title: "가장 뜨거운<br>자유의 노래.", name: "서울시오페라단 〈카르멘〉", date: "2026.10.15 — 10.18", venue: "세종대극장", image: "poster-carmen.svg", alt: "오페라 카르멘 콘셉트 포스터" },
    { id: "light", theme: "light", label: "전시 · 빛과 공간", title: "낯선 빛이 여는<br>새로운 감각.", name: "빛이 머무는 자리", date: "2026.10.01 — 11.15", venue: "세종미술관", image: "poster-light.svg", alt: "빛이 머무는 자리 전시 콘셉트 포스터" }
];

// [방문 안내와 대응 이미지 / Visitor links and matching images]
// 기존 사진·삽화를 항목별로 연결하며 실제 시설 사진과 안내용 삽화를 구분합니다.
// Match existing assets to each destination and distinguish photos from guide illustrations.
const visitGuides = [
    { id: "directions", title: "오시는 길과 주차", description: "지하철·버스·주차장 안내", path: "/visit/directions", image: "sejong-grand-facade.png", alt: "광화문 광장에 면한 세종문화회관 대극장 외관", kind: "photo", width: 1160, height: 680 },
    { id: "spaces", title: "공간과 좌석", description: "나의 공연장 미리 둘러보기", path: "/visit/spaces", image: "sejong-grand-auditorium.png", alt: "무대에서 바라본 세종대극장 객석", kind: "photo", width: 1160, height: 680 },
    { id: "accessibility", title: "모두를 위한 관람", description: "접근성 서비스와 편의시설", path: "/visit/accessibility", image: "visit-guide-access.png", alt: "휠체어와 경사로, 객석을 표현한 접근성 안내 삽화", kind: "illustration", width: 1254, height: 1254 },
    { id: "etiquette", title: "관람 전 알아두세요", description: "예매와 관람에 필요한 안내", path: "/visit/etiquette", image: "visit-guide-etiquette.png", alt: "객석과 닫힌 프로그램북, 뒤집어 둔 휴대전화를 표현한 관람 안내 삽화", kind: "illustration", width: 1254, height: 1254 },
];

function visitSection() {
    return `<section class="home-visit container" id="plan-your-visit" aria-labelledby="visit-heading">
        <figure class="visit-photograph">
            ${visitGuides.map((guide, index) => `<img src="assets/images/${guide.image}" alt="${guide.alt}" width="${guide.width}" height="${guide.height}" loading="lazy" data-visit-image="${guide.id}" data-visit-kind="${guide.kind}" aria-hidden="${index !== 0}">`).join("")}
        </figure>
        <div class="visit-editorial">
            <h2 id="visit-heading">예술을 만나는 길,<br>편안하게 오세요.</h2>
            <p class="visit-description">오는 길부터 공연이 끝나는 순간까지.<br>즐거운 관람에 필요한 정보를 모았어요.</p>
            <a class="text-link home-visit-planner" href="#/visit/plan">나의 방문 계획 만들기 ${icon("arrow", 20)}</a>
            <div class="visit-links-layout">
                <div class="visit-link-list">
                    ${visitGuides.map((guide, index) => `<a href="#${guide.path}" data-visit-preview="${guide.id}" class="${index === 0 ? "is-previewed" : ""}"><span><strong>${guide.title}</strong><small>${guide.description}</small></span>${icon("arrow", 22)}</a>`).join("")}
                </div>
                <div class="visit-hover-rail" aria-hidden="true">
                    <div class="visit-hover-preview">
                        ${visitGuides.map((guide, index) => `<img src="assets/images/${guide.image}" alt="" width="${guide.width}" height="${guide.height}" loading="lazy" data-visit-hover-image="${guide.id}" data-visit-kind="${guide.kind}" class="${index === 0 ? "is-active" : ""}">`).join("")}
                    </div>
                </div>
            </div>
        </div>
    </section>`;
}

function heroSlides(active = 0) {
    return [-2, -1, 0, 1, 2].map(offset => heroCard(features[(active + offset + features.length) % features.length], offset === 0)).join("");
}

// [관람 준비 바로가기 / Visit preparation shortcuts]
// 일정·예매와 방문 안내를 두 묶음의 간결한 링크로 제공합니다.
// Group scheduling and visitor information into compact navigation links.
function quickLinks() {
    const links = [
        ["calendar", "나를 위한 한 편", "공연·전시·교육 살펴보기", "/programs"],
        ["ticket", "함께하는 관람", "단체관람 안내와 신청", "/visit/group"],
        ["pin", "당신의 무대를 위해", "대관 시설과 일정 확인", "/rental"],
    ];
    return `<nav class="home-pathways container" aria-label="이용 목적별 바로가기">
        ${links.map(([symbol, title, description, path]) => `<a href="#${path}">${icon(symbol, 26)}<span><strong>${title}</strong><small>${description}</small></span>${icon("arrow", 22)}</a>`).join("")}
    </nav>`;
}

function programSelection(category = "전체") {
    const items = discoverPrograms(PROGRAMS, category, seoulToday()).slice(0, 4);
    return items.map(programCard).join("") || '<p class="selection-empty">이 분류의 다음 일정을 준비하고 있어요. <a href="#/programs">전체 프로그램을 살펴보세요.</a></p>';
}

// [소식에서 참여로 / From news to participation]
// 공지 분류는 실제 목록을 보여주고 각 참여 항목은 기존 상세 경로로 연결합니다.
// News filters show actual entries; participation links lead to existing destinations.
function noticeSelection(category = "전체") {
    const notices = NOTICES.filter(notice => category === "전체" || notice.category === category).slice(0, 4);
    return notices.map(notice => `<a href="#/news/notices/${notice.id}"><span class="news-category">${esc(notice.category)}</span><h3>${esc(notice.title)}</h3><time datetime="${notice.date}">${formatDate(notice.date)}</time>${icon("arrow", 22)}</a>`).join("");
}

function participationLinks() {
    return [
        ["이벤트", "예술과 만나는 또 다른 즐거움", "/news/events"],
        ["뉴스레터 · 세종문화N", "무대 너머의 이야기를 만나세요", "/news/newsletter"],
        ["문화예술 후원", "더 많은 사람에게 전하는 예술", "/about/donation"],
    ].map(([title, description, path]) => `<a href="#${path}"><span><strong>${title}</strong><small>${description}</small></span>${icon("arrow", 22)}</a>`).join("");
}

function newsSection() {
    return `<section class="home-news container" id="sejong-news" aria-labelledby="news-heading">
        <div class="section-heading"><div><p class="home-section-label">예술을 이어가는 이야기</p><h2 id="news-heading">소식과 참여</h2><p class="section-description">새로운 무대의 소식, 오래 함께할 즐거움.</p></div><a href="#/news" class="text-link">소식 전체 보기 ${icon("arrow", 20)}</a></div>
        <div class="home-news-layout"><div>
            <div class="home-news-filters" role="group" aria-label="소식 분류">${["전체", "공지", "티켓오픈", "대관공고"].map((category, index) => `<button type="button" data-home-news="${category}" aria-pressed="${index === 0}">${category}</button>`).join("")}</div>
            <div class="news-editorial-list" id="home-news-results">${noticeSelection()}</div><p class="sr-only" id="home-news-status" role="status"></p>
        </div><aside class="membership-feature" aria-labelledby="membership-heading"><p class="membership-label">세종 멤버십</p><h3 id="membership-heading">좋아하는 예술을,<br>더 가까이.</h3><p>나에게 맞는 관람 혜택을 살펴보고<br>다음 무대를 함께 기다려요.</p><a class="text-link" href="#/news/membership">멤버십 알아보기 ${icon("arrow", 22)}</a></aside></div>
        <nav class="home-participation" aria-label="문화예술 참여">${participationLinks()}</nav>
    </section>`;
}

// [상호 참고 홈 구성 / Cross-reference home composition]
// 기존 흐름을 유지하며 설명과 혜택 진입점을 읽기 쉽게 연결합니다.
// Preserve the existing journey while clarifying context and benefit discovery.
export function renderHome() {
    return `<h1 class="sr-only">세종문화회관, 예술로 채우는 당신의 일상</h1><section class="season-hero" id="featured-season" aria-label="주요 프로그램" aria-roledescription="캐러셀">
        <div class="season-stage"><div class="season-track">${heroSlides(0)}</div></div>
        <div class="season-toolbar container"><p>예술로 채우는 당신의 일상</p><div class="season-controls"><span class="season-pagination" aria-hidden="true"><span data-season-current>01</span><span class="season-pagination-total"> / 03</span></span><span class="season-progress" aria-hidden="true"><i></i></span><button type="button" class="round-button" data-hero="previous" aria-label="이전 프로그램">${icon("arrow", 24)}</button><button type="button" class="round-button" data-hero="next" aria-label="다음 프로그램">${icon("arrow", 24)}</button><button type="button" class="round-button" data-hero="pause" aria-label="자동 재생 일시정지">${icon("pause", 24)}</button><span class="sr-only" id="season-status" aria-live="polite"></span></div></div>
    </section>
    ${quickLinks()}
    ${renderHomeBooking()}
    <section class="home-programs container" id="discover-programs" aria-labelledby="discover-heading">
        <div class="section-heading"><div><p class="home-section-label">오늘부터 다음 계절까지</p><h2 id="discover-heading">마음이 향하는<br>예술을 찾아보세요.</h2><p class="section-description">오늘 만나는 프로그램부터 다가오는 무대까지.</p></div><a class="text-link" href="#/programs">모든 프로그램 ${icon("arrow", 20)}</a></div>
        <div class="program-filter-row"><div class="program-choice" role="group" aria-label="프로그램 분류">${["전체", "공연", "전시", "교육", "기획·시즌"].map((category, index) => `<button type="button" data-home-category="${category}" aria-pressed="${index === 0}" class="${index === 0 ? "is-selected" : ""}">${category}</button>`).join("")}</div><a class="calendar-link" href="#/programs?view=calendar">${icon("calendar", 18)} 일정으로 보기</a></div>
        <p class="sr-only" id="program-selection-status" role="status"></p><div class="home-program-grid" id="home-program-results">${programSelection()}</div><p class="home-demo-note">프로그램 일정과 요금은 리뉴얼 체험용 예시입니다.</p>
        <a href="#/programs/season" class="home-season-link"><span><strong>한 편에서 시작하는, 나만의 시즌.</strong><span>세종시즌부터 Sync Next까지, 취향을 넓히는 기획 프로그램</span></span><span>기획·시즌 살펴보기 ${icon("arrow", 22)}</span></a>
    </section>
    ${visitSection()}
    ${newsSection()}
    <section class="home-identity" id="our-identity" aria-labelledby="identity-heading"><div class="container identity-layout"><div><h2 id="identity-heading">서울의 중심,<br>예술의 다음.</h2><p class="identity-description">하늘과 땅, 그리고 사람.<br>서로 다른 우리가 예술로 만나는 곳입니다.</p><a class="identity-link" href="#/about">세종문화회관을 소개합니다 ${icon("arrow", 23)}</a></div><a href="#/about/introduction/ci" class="identity-composition" aria-label="천지인 색상과 세종문화회관의 아이덴티티 알아보기"><div class="identity-channel channel-sky"><i></i><span>天<span>하늘</span></span></div><div class="identity-channel channel-earth"><i></i><span>地<span>땅</span></span></div><div class="identity-channel channel-human"><i></i><span>人<span>사람</span></span></div></a></div><nav class="home-institution-links container" aria-label="기관 이야기"><a href="#/about/companies">서울시예술단 ${icon("arrow", 20)}</a><a href="#/about/esg">지속가능한 예술 ${icon("arrow", 20)}</a><a href="#/about/disclosure">정보공개 ${icon("arrow", 20)}</a><a href="#/about/partners">협력과 협찬 ${icon("arrow", 20)}</a></nav></section>`;
}

// [포커스에 따른 이미지 미리보기 / Image previews on hover and focus]
// 마지막 입력만 반영하고 링크 이동·터치 조작을 가로막지 않습니다.
// Keep the latest request, preserving native links and one-tap touch navigation.
function bindVisitPreview(root) {
    const section = root.querySelector("#plan-your-visit");
    const links = [...section.querySelectorAll("[data-visit-preview]")];
    const images = [...section.querySelectorAll("[data-visit-image]")];
    const hoverImages = [...section.querySelectorAll("[data-visit-hover-image]")];
    const hoverPreview = section.querySelector(".visit-hover-preview");
    const controller = new AbortController();
    let request = 0;

    // [원본 목록의 화면 중앙 고정 / Reference list viewport centering]
    // 한 이미지가 목록 범위 안에서 화면 세로 중앙을 따라가도록 실제 높이를 반영합니다.
    // Keep one image vertically centered in the viewport, bounded by its list rail.
    function centerPreview() {
        const height = hoverPreview.getBoundingClientRect().height;
        const headerBottom = Math.max(0, document.querySelector("#header")?.getBoundingClientRect().bottom || 0);
        const top = Math.max(headerBottom + 16, (window.innerHeight - height) / 2);
        hoverPreview.style.setProperty("--visit-preview-top", `${top}px`);
    }

    const previewObserver = new ResizeObserver(centerPreview);
    previewObserver.observe(hoverPreview);
    window.addEventListener("resize", centerPreview, { signal: controller.signal });
    centerPreview();

    function selectImages(id) {
        images.forEach(item => item.setAttribute("aria-hidden", String(item.dataset.visitImage !== id)));
        hoverImages.forEach(item => item.classList.toggle("is-active", item.dataset.visitHoverImage === id));
    }

    async function preview(id) {
        const currentRequest = ++request;
        const image = images.find(item => item.dataset.visitImage === id);
        if (!image) return;
        links.forEach(link => link.classList.toggle("is-previewed", link.dataset.visitPreview === id));
        if (image.getAttribute("aria-hidden") === "false") {
            selectImages(id);
            return;
        }
        image.loading = "eager";
        try {
            await image.decode();
        } catch {
            return;
        }
        if (controller.signal.aborted || currentRequest !== request) return;
        selectImages(id);
    }

    links.forEach(link => {
        link.addEventListener("pointerenter", event => {
            if (event.pointerType === "touch") return;
            preview(link.dataset.visitPreview);
        }, { signal: controller.signal });
        link.addEventListener("focus", () => {
            preview(link.dataset.visitPreview);
        }, { signal: controller.signal });
    });

    return () => {
        controller.abort();
        previewObserver.disconnect();
    };
}

export function bindHome(root) {
    const disposeHero = bindHero(root.querySelector(".season-hero"), features);
    const disposeVisitPreview = bindVisitPreview(root);
    const disposeBooking = bindHomeBooking(root);
    const controller = new AbortController();

    // [분류 간 카드의 위치 연결 / Card continuity between categories]
    // 같은 분류는 유지하고 남아 있는 프로그램은 이전 위치에서 새 배열로 연결합니다.
    // Keep unchanged selections still and connect retained programs to their new positions.
    root.querySelectorAll("[data-home-category]").forEach((control) => control.addEventListener("click", () => {
        if (control.getAttribute("aria-pressed") === "true") return;
        const results = root.querySelector("#home-program-results");
        const snapshot = captureLayout(results, ".program-card");
        cancelMotion(results);
        root.querySelectorAll("[data-home-category]").forEach((button) => {
            const selected = button === control;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
        results.innerHTML = programSelection(control.dataset.homeCategory);
        animateLayout(results, snapshot, ".program-card");
        root.querySelector("#program-selection-status").textContent = `${control.dataset.homeCategory} 프로그램 ${root.querySelectorAll("#home-program-results .program-card").length}개를 표시합니다.`;
    }, { signal: controller.signal }));

    root.querySelectorAll("[data-home-news]").forEach(control => control.addEventListener("click", () => {
        if (control.getAttribute("aria-pressed") === "true") return;
        root.querySelectorAll("[data-home-news]").forEach(button => button.setAttribute("aria-pressed", String(button === control)));
        root.querySelector("#home-news-results").innerHTML = noticeSelection(control.dataset.homeNews);
        root.querySelector("#home-news-status").textContent = `${control.dataset.homeNews} 소식 ${root.querySelectorAll("#home-news-results a").length}개를 표시합니다.`;
    }, { signal: controller.signal }));

    return () => {
        controller.abort();
        disposeBooking();
        cancelMotion(root.querySelector("#home-program-results"));
        disposeHero();
        disposeVisitPreview();
    };
}
