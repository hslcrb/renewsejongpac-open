// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { VENUES, COMPANIES } from "../data/catalog.ts";
import { esc, href, icon } from "../lib/core.ts";
import { animateFeedback, cancelMotion } from "../components/motion.ts";

const ownsStory = path => path === "/about" || path === "/about/introduction";
const storyLink = (label, path, className = "story-link") => `
    <a class="${className}" href="${href(path)}">${esc(label)} ${icon("arrow", 20)}</a>`;

// [기존 공간 데이터와 공식 사진 / Existing venue data and official photography]
// 사진 출처는 assets/images/README.txt를 유지하며 일러스트를 실제 공간 사진으로 표시하지 않습니다.
// Preserve asset provenance and distinguish venue illustrations from official photographs.
function renderSpace(venue) {
    const photograph = !/\.svg(?:$|\?)/i.test(venue.image);
    const source = venue.image;
    return `
        <figure class="story-space-image${photograph ? "" : " story-space-illustration"}">
            <img src="${esc(source)}" width="1160" height="680" alt="${esc(venue.name)} ${photograph ? "공식 공간 사진" : "공간 안내 일러스트"}" loading="lazy" decoding="async">
            <figcaption>${photograph ? "사진: 세종문화회관" : "공간의 성격을 소개하는 일러스트"}</figcaption>
        </figure>
        <div class="story-space-copy">
            <p class="story-kicker">${esc(venue.kind)}</p>
            <h3>${esc(venue.name)}</h3>
            <p>${esc(venue.description)}</p>
            <p class="story-space-use">${esc(venue.area)}</p>
            ${storyLink("이 공간 자세히 보기", "/visit/spaces/" + venue.id)}
        </div>`;
}

export function renderStory(path) {
    if (!ownsStory(path)) return null;
    return `
        <article class="sejong-story" data-story aria-labelledby="story-title">
            <header class="story-opening container" id="sejong-story">
                <p class="story-kicker">세종문화회관 소개</p>
                <h1 id="story-title">예술이 모이고,<br>일상이 넓어지는 곳.</h1>
                <div class="story-opening-bottom">
                    <p>광화문에서 만나는 공연과 전시, 그리고 배움.<br>세종문화회관은 시민의 곁에서 예술의 시간을 이어갑니다.</p>
                    <button class="story-scroll-button" type="button" data-story-jump="institution-introduction">
                        세종의 이야기 ${icon("up", 20)}
                    </button>
                </div>
            </header>

            <figure class="story-hero-media" data-story-media>
                <div class="story-hero-frame">
                    <img src="assets/images/sejong-grand-facade.png" width="1160" height="680" alt="푸른 하늘 아래 세종문화회관의 기둥과 예술 부조가 있는 건물 외관" fetchpriority="high" decoding="async">
                </div>
                <figcaption class="container">사진: 세종문화회관</figcaption>
            </figure>

            <section class="story-scene story-experience container" id="institution-introduction" aria-labelledby="story-experience-title" data-story-scene>
                <div class="story-sticky-copy" data-story-reveal>
                    <p class="story-kicker">예술과 시민</p>
                    <h2 id="story-experience-title" tabindex="-1">처음의 설렘부터,<br>다시 찾는<br><span class="story-emphasis">즐거움까지.</span></h2>
                    <p>하나의 작품이 새로운 시선을 열고,<br>함께한 시간이 우리의 일상이 됩니다.</p>
                    ${storyLink("세종의 인사말", "/about/introduction/greeting")}
                </div>
                <div class="story-experience-list">
                    <article>
                        <h3>무대와 마주하는 시간.</h3>
                        <p>음악의 울림과 배우의 호흡, 무용수의 움직임까지. 서로 다른 예술이 살아 있는 무대에서 만납니다.</p>
                        ${storyLink("공연 만나기", "/programs/performance")}
                    </article>
                    <article>
                        <h3>새로운 시선으로 보는 하루.</h3>
                        <p>작품 앞에 잠시 머물며 저마다의 이야기를 발견하세요. 도심의 일상에 전시를 만나는 시간을 더합니다.</p>
                        ${storyLink("전시 둘러보기", "/programs/exhibition")}
                    </article>
                    <article>
                        <h3>알아갈수록 가까워지는 예술.</h3>
                        <p>감상에서 배움으로, 호기심에서 나만의 취향으로. 함께 듣고 생각하며 예술의 즐거움을 넓혀갑니다.</p>
                        ${storyLink("예술교육 알아보기", "/programs/education")}
                    </article>
                </div>
            </section>

            <section class="story-scene story-spaces" id="story-spaces" aria-labelledby="story-spaces-title" data-story-scene>
                <div class="container">
                    <div class="story-section-heading" data-story-reveal>
                        <div><p class="story-kicker">예술이 머무는 공간</p><h2 id="story-spaces-title">같은 광화문,<br><span class="story-emphasis">다른 깊이의 만남.</span></h2></div>
                        <p>크고 작은 무대와 전시장.<br>만나고 싶은 공간을 골라 살펴보세요.</p>
                    </div>
                    <fieldset class="story-space-picker">
                        <legend>공간 둘러보기</legend>
                        ${VENUES.map((venue, index) => `
                            <label class="story-space-choice">
                                <input type="radio" name="story-space" value="${esc(venue.id)}" data-story-space="${esc(venue.id)}" aria-controls="story-space-panel"${index === 0 ? " checked" : ""}>
                                <span>${esc(venue.name)}</span>
                            </label>`).join("")}
                    </fieldset>
                    <div class="story-space-panel" id="story-space-panel" data-story-space-panel>${renderSpace(VENUES[0])}</div>
                    <p class="story-space-status" role="status" aria-live="polite" aria-atomic="true" data-story-status>세종대극장을 보고 있습니다.</p>
                    <div class="story-space-footer">${storyLink("모든 공간 안내", "/visit/spaces")}${storyLink("편안한 관람을 위한 접근성 안내", "/visit/accessibility")}</div>
                </div>
            </section>

            <section class="story-scene story-companies container" id="story-companies" aria-labelledby="story-companies-title" data-story-scene>
                <div class="story-company-stage" data-story-reveal>
                    <figure><img src="assets/images/sejong-ilmu-video.jpg" width="640" height="480" alt="서울시무용단 일무 공연 홍보 이미지의 두 무용수" loading="lazy" decoding="async"><figcaption>서울시무용단 〈일무〉 · 세종문화회관</figcaption></figure>
                    <div><p class="story-kicker">서울시예술단</p><h2 id="story-companies-title">서로 다른 목소리,<br><span class="story-emphasis">오늘의 무대.</span></h2><p>전통의 깊이에서 동시대의 질문까지.<br>예술가의 시선으로 서울의 이야기를 이어갑니다.</p>${storyLink("서울시예술단 소개", "/about/companies")}</div>
                </div>
                <ul class="story-company-list">${COMPANIES.map(company => `
                    <li><a href="${href("/about/companies/" + company.id)}"><span>${esc(company.name)}</span><span class="story-company-genre">${esc(company.genre)}</span>${icon("arrow", 20)}</a></li>`).join("")}
                </ul>
            </section>

            <section class="story-scene story-history" id="story-history" aria-labelledby="story-history-title" data-story-scene>
                <div class="container story-history-layout">
                    <div class="story-sticky-copy" data-story-reveal><p class="story-kicker">함께 쌓아온 시간</p><h2 id="story-history-title">서울의 기억에,<br><span class="story-emphasis">예술의 다음 장을.</span></h2><p>1978년 개관 이후 공연·전시·예술교육을 통해 일상 속 문화예술의 자리를 넓혀왔습니다.</p>${storyLink("걸어온 역사 보기", "/about/introduction/history")}${storyLink("무대 뒤의 사람들", "/about/introduction/organization")}</div>
                    <ol class="story-timeline">
                        <li><p class="story-year">1978</p><h3>광화문에 문을 열다.</h3><p>세종문화회관 개관. 서울의 중심에서 시민과 예술이 만나는 새로운 무대가 시작되었습니다.</p></li>
                        <li><p class="story-year">1999</p><h3>새로운 출발을 함께하다.</h3><p>재단법인 세종문화회관으로 운영 체계를 전환했습니다.</p></li>
                        <li><p class="story-year">2018</p><h3>무대의 가능성을 넓히다.</h3><p>가변형 공연장 세종S씨어터가 문을 열며 다양한 무대 구성을 선보였습니다.</p></li>
                    </ol>
                </div>
            </section>

            <section class="story-scene story-identity" id="sejong-identity" aria-labelledby="institution-identity-heading" data-story-scene>
                <div class="container">
                    <div class="story-section-heading" data-story-reveal><div><p class="story-kicker">천지인 아이덴티티</p><h2 id="institution-identity-heading">하늘과 땅,<br>그리고 다양한 우리.</h2></div><div><p>천지인의 세 가지 색으로 자연과 사람을 잇습니다. 검정과 흰색 위에 펼쳐지는 색은 예술을 만나는 사람만큼 다양해집니다.</p>${storyLink("천지인 아이덴티티", "/about/introduction/ci")}</div></div>
                    <div class="story-identity-channels" role="group" aria-label="천 하늘색, 지 황토색, 인 노란색">
                        <div class="story-identity-channel story-identity-sky"><span class="story-identity-symbol" aria-hidden="true"></span><strong>천 天</strong><span>하늘</span></div>
                        <div class="story-identity-channel story-identity-earth"><span class="story-identity-symbol" aria-hidden="true"></span><strong>지 地</strong><span>땅</span></div>
                        <div class="story-identity-channel story-identity-human"><span class="story-identity-symbol" aria-hidden="true"></span><strong>인 人</strong><span>사람</span></div>
                    </div>
                </div>
            </section>

            <section class="story-scene story-values container" id="institution-values" aria-labelledby="story-values-title" data-story-scene>
                <div class="story-section-heading" data-story-reveal><div><p class="story-kicker">함께 만드는 문화예술의 내일</p><h2 id="story-values-title">더 많은 사람에게,<br><span class="story-emphasis">더 오래 이어지도록.</span></h2></div><p>열린 운영과 지속가능한 실천,<br>뜻을 나누는 협력으로 예술의 자리를 넓힙니다.</p></div>
                <div class="story-value-links">${[
                    ["지속가능한 운영", "환경과 사회를 생각하는 세종의 실천", "/about/esg"],
                    ["정보공개", "투명한 경영과 공개된 기관 정보", "/about/disclosure"],
                    ["협력과 협찬", "문화예술의 가능성을 함께 넓히는 일", "/about/partners"],
                    ["예술 후원", "더 많은 사람의 예술 경험을 위한 참여", "/about/donation"],
                ].map(([title, text, destination]) => `
                    <a href="${href(destination)}"><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>${icon("arrow", 24)}</a>`).join("")}
                </div>
                <div class="story-closing"><p>이제, 당신의 예술을 만날 차례.</p>${storyLink("지금 만나는 프로그램", "/programs", "story-primary-link")}${storyLink("오시는 길", "/visit/directions")}</div>
            </section>
        </article>`;
}

// [스크롤과 공간 탐색의 수명 / Scroll and venue exploration lifecycle]
// 모든 내용은 정적으로 읽을 수 있고, 이동량만 RAF로 보강하며 경로 이탈 시 해제합니다.
// Keep content readable at rest; enhance geometry with one RAF and dispose on route changes.
export function bindStory(root, path) {
    if (!ownsStory(path)) return () => {};
    const story = root.querySelector("[data-story]");
    if (!story) return () => {};
    const document = root.ownerDocument;
    const view = document.defaultView;
    const events = new view.AbortController();
    const preference = view.matchMedia("(prefers-reduced-motion: reduce)");
    const media = story.querySelector("[data-story-media]");
    const panel = story.querySelector("[data-story-space-panel]");
    const status = story.querySelector("[data-story-status]");
    const scenes = [...story.querySelectorAll("[data-story-scene]")];
    const revealed = new Set();
    let observer;
    let frame = 0;
    let disposed = false;
    let selected = VENUES[0].id;

    function resetMedia() {
        media?.style.removeProperty("--story-media-inset");
        media?.style.removeProperty("--story-media-scale");
    }

    function updateMedia() {
        frame = 0;
        if (disposed || preference.matches || document.hidden || !media) return;
        if (view.innerWidth < 768) {
            resetMedia();
            return;
        }
        const bounds = media.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > view.innerHeight) return;
        const progress = Math.max(0, Math.min(1, (view.innerHeight * 0.7 - bounds.top) / (view.innerHeight * 0.65)));
        media.style.setProperty("--story-media-inset", `${(4 * (1 - progress)).toFixed(3)}%`);
        media.style.setProperty("--story-media-scale", (1.06 - progress * 0.06).toFixed(4));
    }

    function queueMedia() {
        if (!disposed && !preference.matches && !document.hidden && !frame) frame = view.requestAnimationFrame(updateMedia);
    }

    function settleMotion() {
        if (frame) view.cancelAnimationFrame(frame);
        frame = 0;
        resetMedia();
        cancelMotion(story);
    }

    story.addEventListener("change", event => {
        const input = event.target.closest("[data-story-space]");
        if (!input?.checked || !story.contains(input)) return;
        const venue = VENUES.find(item => item.id === input.value);
        if (!venue || venue.id === selected) return;
        selected = venue.id;
        cancelMotion(panel);
        panel.innerHTML = renderSpace(venue);
        status.textContent = `${venue.name} 안내로 바뀌었습니다.`;
        if (!preference.matches) animateFeedback(panel, "content");
    }, { signal: events.signal });

    story.addEventListener("click", event => {
        const trigger = event.target.closest("[data-story-jump]");
        if (!trigger || !story.contains(trigger)) return;
        const target = story.querySelector(`#${trigger.dataset.storyJump}`);
        if (!target) return;
        target.scrollIntoView({ behavior: preference.matches ? "instant" : "smooth", block: "start" });
        target.querySelector("h2")?.focus({ preventScroll: true });
    }, { signal: events.signal });

    // [장면 강조와 공통 WAAPI 재사용 / Scene emphasis with the shared WAAPI helper]
    // 공통 등장 selector와 다른 소유 class를 사용하여 이중 애니메이션을 피합니다.
    // Dedicated classes avoid duplicate entrance ownership by bindPageMotion.
    if (typeof view.IntersectionObserver === "function") {
        observer = new view.IntersectionObserver(entries => {
            if (disposed) return;
            for (const entry of entries) {
                entry.target.classList.toggle("is-current-scene", entry.isIntersecting);
                if (!entry.isIntersecting || revealed.has(entry.target)) continue;
                revealed.add(entry.target);
                const heading = entry.target.querySelector("[data-story-reveal]");
                if (!preference.matches && !document.hidden && heading && !heading.contains(document.activeElement)) {
                    animateFeedback(heading, "step");
                }
            }
        }, { rootMargin: "-12% 0px -22% 0px", threshold: 0.08 });
        scenes.forEach(scene => observer.observe(scene));
    }

    view.addEventListener("scroll", queueMedia, { passive: true, signal: events.signal });
    view.addEventListener("resize", queueMedia, { passive: true, signal: events.signal });
    preference.addEventListener("change", () => {
        if (preference.matches) settleMotion();
        else queueMedia();
    }, { signal: events.signal });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) settleMotion();
        else queueMedia();
    }, { signal: events.signal });
    queueMedia();

    return () => {
        disposed = true;
        events.abort();
        observer?.disconnect();
        settleMotion();
        revealed.clear();
    };
}
