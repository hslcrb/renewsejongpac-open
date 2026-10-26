import { PROGRAMS, NOTICES } from "../data/catalog.js";
import { esc, icon, formatDate } from "../lib/core.js";
import { programCard, heroCard, bannerCard } from "../components/cards.js";
import { bindHero } from "../components/carousel.js";
import { captureLayout, animateLayout, cancelMotion } from "../components/motion.js";

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
    const groups = [
        { id: "quick-booking", label: "일정·예매", links: [["calendar", "공연 일정", "/programs?view=calendar"], ["ticket", "예매 확인", "/account/bookings"]] },
        { id: "quick-visit", label: "방문 안내", links: [["pin", "오시는 길", "/visit/directions"], ["wheelchair", "관람 안내", "/visit/accessibility"]] },
    ];
    return `<nav class="quick-access container" aria-label="빠른 서비스">
        ${groups.map(({ id, label, links }) => `<div class="quick-access-group"><p class="quick-access-label" id="${id}">${label}</p><ul aria-labelledby="${id}">${links.map(([symbol, title, path]) => `<li><a href="#${path}">${icon(symbol, 26)}<span>${title}</span></a></li>`).join("")}</ul></div>`).join("")}
    </nav>`;
}

function programSelection(category = "전체") {
    const ids = category === "전체" ? ["dance", "carmen", "sumire", "hypnosis"] : null;
    const items = ids ? ids.map((id) => PROGRAMS.find((item) => item.id === id)).filter(Boolean) : PROGRAMS.filter((item) => item.category === category).slice(0, 4);
    return items.map(programCard).join("") || '<p class="selection-empty">현재 준비 중인 프로그램입니다. 전체 프로그램을 살펴보세요.</p>';
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
    <section class="home-programs container" id="discover-programs" aria-labelledby="discover-heading">
        <div class="section-heading"><div><h2 id="discover-heading">지금, 세종에서</h2><p class="section-description">마음이 가는 공연부터 새로운 취향까지.</p></div><a class="text-link" href="#/programs">모든 프로그램 ${icon("arrow", 20)}</a></div>
        <div class="program-filter-row"><div class="program-choice" role="group" aria-label="프로그램 분류">${["전체", "공연", "전시", "교육"].map((category, index) => `<button type="button" data-home-category="${category}" aria-pressed="${index === 0}" class="${index === 0 ? "is-selected" : ""}">${category}</button>`).join("")}</div><a class="calendar-link" href="#/programs?view=calendar">${icon("calendar", 18)} 일정으로 보기</a></div>
        <p class="sr-only" id="program-selection-status" role="status"></p><div class="home-program-grid" id="home-program-results">${programSelection()}</div><p class="home-demo-note">프로그램 일정과 요금은 리뉴얼 체험용 예시입니다.</p>
    </section>
    ${bannerCard({ id: "season-invitation", title: "좋아하는 예술 하나쯤,\n당신의 일상 가까이에.", path: "/programs/season/sejong", action: "올해의 세종시즌 살펴보기", year: "2026" })}
    ${visitSection()}
    <section class="home-news container" id="sejong-news" aria-labelledby="news-heading"><div class="section-heading"><div><h2 id="news-heading">세종의 소식과 혜택</h2><p class="section-description">새로운 소식과 오래 즐길 수 있는 예술.</p></div><a href="#/news" class="text-link">소식 전체 보기 ${icon("arrow", 20)}</a></div><div class="home-news-layout"><div class="news-editorial-list">${NOTICES.slice(0, 4).map((notice) => `<a href="#/news/notices/${notice.id}"><span class="news-category">${esc(notice.category)}</span><h3>${esc(notice.title)}</h3><time datetime="${notice.date}">${formatDate(notice.date)}</time>${icon("arrow", 22)}</a>`).join("")}</div><aside class="membership-feature" aria-labelledby="membership-heading"><p class="membership-label">세종 멤버십</p><h3 id="membership-heading">좋아하는 예술을,<br>더 가까이.</h3><p>나에게 맞는 멤버십과 관람 혜택을 살펴보세요.</p><a class="text-link" href="#/news/membership">멤버십 알아보기 ${icon("arrow", 22)}</a></aside></div></section>
    <section class="home-identity" id="our-identity" aria-labelledby="identity-heading"><div class="container identity-layout"><div><h2 id="identity-heading">서울의 중심,<br>예술의 다음.</h2><p class="identity-description">하늘과 땅, 그리고 사람.<br>서로 다른 우리가 예술로 만나는 곳입니다.</p><a class="identity-link" href="#/about">세종문화회관을 소개합니다 ${icon("arrow", 23)}</a></div><a href="#/about/introduction/ci" class="identity-composition" aria-label="천지인 색상과 세종문화회관의 아이덴티티 알아보기"><div class="identity-channel channel-sky"><i></i><span>天<span>하늘</span></span></div><div class="identity-channel channel-earth"><i></i><span>地<span>땅</span></span></div><div class="identity-channel channel-human"><i></i><span>人<span>사람</span></span></div></a></div></section>`;
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
    }));

    return () => {
        disposeHero();
        disposeVisitPreview();
    };
}
