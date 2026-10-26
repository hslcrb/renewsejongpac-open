// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { NAV, PAGES, VENUES, NOTICES, COMPANIES, PROGRAMS } from "../data/catalog.ts";
import {
    esc,
    href,
    icon,
    toast,
    formatDate,
    money,
    readStore,
    writeStore,
} from "../lib/core.ts";
import { pageHeader, programCard, emptyState, button } from "../components/ui.ts";
import { informationNotice } from "../components/notices.ts";
import { animateFeedback, captureLayout, animateLayout, cancelMotion } from "../components/motion.ts";

const getMeta = (path) => PAGES.find((p) => p.path === path);
const qget = (q, key, fallback = "") => q.get(key) || fallback;
const link = (label, path, cls = "text-link") =>
    `<a class="${cls}" href="${href(path)}">${esc(label)} ${icon("arrow", 18)}</a>`;
const note = (text, title = "이용 전 확인해 주세요") =>
    informationNotice(text, title);
const demo = () =>
    note(
        "이 사이트의 일정·금액·접수 현황은 리뉴얼 시연용입니다. 실제 이용 전 세종문화회관 공식 홈페이지에서 최신 정보를 확인해 주세요.",
        "체험용 정보 안내",
    );
const table = (heads, rows) =>
    `<div class="info-table-wrap"><table class="info-table"><thead><tr>${heads.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<${i ? "td" : 'th scope="row"'}>${esc(v)}</${i ? "td" : "th"}>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const heading = (label, title, desc = "") =>
    `<div class="info-section-heading"><h2>${esc(title)}</h2>${desc ? `<p>${esc(desc)}</p>` : ""}</div>`;
const section = (label, title, content, desc = "") =>
    `<section class="info-section">${heading(label, title, desc)}${content}</section>`;
const tabs = (items, path, query = "") =>
    `<nav class="info-tabs" aria-label="관련 페이지">${items.map(([t, p]) => `<a href="${href(p)}"${p === path || p === `${path}${query}` ? ' aria-current="page"' : ""}>${esc(t)}</a>`).join("")}</nav>`;
const download = (id, label) =>
    `<button class="button info-download" type="button" data-download="${esc(id)}">${icon("download", 18)} ${esc(label)}</button>`;
const cards = (items) =>
    `<div class="info-link-grid">${items.map(([tag, title, text, path]) => `<a class="info-link-card" href="${href(path)}"><h3>${esc(title)}</h3><p>${esc(text)}</p><span class="info-card-arrow">${icon("diagonal", 25)}</span></a>`).join("")}</div>`;
const facts = (rows) =>
    `<dl class="info-facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
const numbered = (items) =>
    `<ol class="info-steps">${items.map(([title, text], i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></li>`).join("")}</ol>`;
const rail = () =>
    `<aside class="info-rail" aria-label="대관 상담 및 신청"><h3>당신의 무대를<br>함께 준비합니다.</h3><p>공간 선택부터 서류 준비까지,<br>대관 담당자에게 문의하세요.</p>${link("대관문의", "/rental/contact")}${link("대관신청", "/rental/apply")}</aside>`;
const rentalTabs = (path) =>
    tabs(
        [
            ["대관안내", "/rental/guide"],
            ["대관시설", "/rental/venues"],
            ["대관일정", "/rental/schedule"],
            ["대관절차", "/rental/process"],
            ["신청하기", "/rental/apply"],
        ],
        path,
    );
const wrap = (path, body, { rental = false, nav = "", showEyebrow = true, showIdentityMarks = true } = {}) =>
    `${pageHeader({ ...(getMeta(path) || { title: "세종의 이야기", eyebrow: "SEJONG CENTER", path }), showEyebrow, showIdentityMarks })}<div class="container page-content info-page">${nav}${rental ? `<div class="info-layout"><div>${body}</div>${rail()}</div>` : body}</div>`;

function overviewIntro({ label, title, text, image, alt, primary, secondary, tone = "sky" }) {
    return `
        <section class="overview-intro overview-intro-${tone}" id="page-introduction">
            <div class="overview-intro-copy">

                <h2>${title}</h2>
                <p>${esc(text)}</p>
                <div class="info-actions">
                    ${button(primary[0], primary[1], "dark")}
                    ${secondary ? link(secondary[0], secondary[1]) : ""}
                </div>
            </div>
            <figure class="overview-intro-media">
                <img src="assets/images/${image}" alt="${esc(alt)}" width="1160" height="680">
            </figure>
        </section>`;
}

function serviceLinks(items) {
    return `<div class="overview-services">${items.map(([number, title, text, path]) => `
        <a class="overview-service${number ? "" : " overview-service--plain"}" href="${href(path)}">
            ${number ? `<span class="overview-service-number">${esc(number)}</span>` : ""}
            <div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
            ${icon("arrow", 22)}
        </a>`).join("")}</div>`;
}

function overviewPage(path) {
    if (path === "/visit") {
        const intro = overviewIntro({
            label: "PLAN YOUR VISIT",
            title: "처음 오는 길도,<br>익숙한 발걸음처럼.",
            text: "교통부터 객석까지. 예술을 만나는 하루를 편안하게 준비하세요.",
            image: "sejong-grand-facade.png",
            alt: "광화문광장에서 바라본 세종문화회관 외관",
            primary: ["오시는 길", "/visit/directions"],
            secondary: ["주차 안내", "/visit/directions/parking"]
        });
        return wrap(path, `${intro}
            <dl class="overview-quick-facts" role="group" aria-label="방문 기본 정보">
                <div><dt>주소</dt><dd>서울 종로구 세종대로 175</dd></div>
                <div><dt>지하철</dt><dd>5호선 광화문역 · 1, 8번 출구</dd></div>
                <div><dt>문의</dt><dd><a href="tel:023991000">02-399-1000</a></dd></div>
            </dl>
            <section class="overview-section" id="visit-services">
                <div class="overview-section-heading"><h2>필요한 안내를<br>바로 찾아보세요.</h2></div>
                ${serviceLinks([
                    ["01", "공간과 객석", "공연장·전시실의 위치와 공간별 이용 안내", "/visit/spaces"],
                    ["02", "모두를 위한 관람", "휠체어 좌석, 접근 가능한 동선과 관람 지원", "/visit/accessibility"],
                    ["03", "편의시설", "식음료, 물품 보관과 방문객 편의시설", "/visit/amenities"],
                    ["04", "관람 전 확인사항", "입장 시간, 촬영과 반입 물품 안내", "/visit/etiquette"],
                    ["05", "자주 묻는 질문", "예매·취소·관람에서 자주 궁금한 내용", "/visit/support/faq"],
                    ["06", "분실물 찾기", "잃어버린 물건과 습득물 보관 안내", "/visit/support/lost"]
                ])}
            </section>
            <section class="overview-help" id="visit-support">
                <div><h2>도움이 필요한 순간에도<br>함께하겠습니다.</h2><p>단체 관람을 준비하거나 방문 전 궁금한 점이 있나요?</p></div>
                <div class="overview-help-links">${link("고객지원", "/visit/support")}${link("단체 관람 문의", "/visit/group")}${link("문의하기", "/visit/support/inquiry")}</div>
            </section>`);
    }

    if (path === "/rental") {
        return wrap(path, `${overviewIntro({
            label: "YOUR NEXT STAGE",
            title: "당신의 이야기가<br>무대가 되는 곳.",
            text: "공연의 규모와 성격에 맞는 공간을 찾고, 관객을 만날 순간을 준비하세요.",
            image: "sejong-grand-interior.png",
            alt: "무대를 향해 펼쳐진 세종대극장 객석",
            primary: ["대관시설 살펴보기", "/rental/venues"],
            secondary: ["대관신청 체험", "/rental/apply"],
            tone: "earth"
        })}
            <section class="overview-section" id="rental-preparation">
                <div class="overview-section-heading"><h2>준비는 명확하게.<br>창작은 자유롭게.</h2><p>공간, 일정, 신청 서류를 순서대로 확인하세요.</p></div>
                <ol class="overview-process">
                    <li><span>01</span><h3>공간을 고르세요</h3><p>관객 규모, 무대 구성, 장비 조건에 맞는 공간을 비교합니다.</p>${link("공간별 시설·기술정보", "/rental/venues")}</li>
                    <li><span>02</span><h3>일정을 계획하세요</h3><p>공연일과 함께 설치, 리허설, 철수에 필요한 시간을 고려합니다.</p>${link("대관 일정 확인", "/rental/schedule")}</li>
                    <li><span>03</span><h3>작품을 소개해 주세요</h3><p>작품 계획과 필요 서류를 준비하고 신청 절차를 확인합니다.</p>${link("신청 절차와 서류", "/rental/process")}</li>
                </ol>
            </section>
            <section class="overview-section overview-section-split" id="rental-resources">
                <div class="overview-section-heading"><h2>신청 전에<br>확인할 것들.</h2><p>대관 승인과 실제 일정은 공식 공고와 담당자 안내를 확인해 주세요.</p></div>
                ${serviceLinks([
                    ["A", "대관 대상과 기준", "문화예술 프로젝트의 신청 자격과 심사 안내", "/rental/guide/eligibility"],
                    ["B", "대관료 안내", "공간·장비·운영 항목별 요금 체계", "/rental/guide/fees"],
                    ["C", "기술과 장비", "무대·조명·음향을 위한 기술 협의", "/rental/equipment"],
                    ["D", "대관 문의", "준비 과정에서 필요한 상담과 문의", "/rental/contact"]
                ])}
            </section>${demo()}`);
    }

    if (path === "/about" || path === "/about/introduction") {
        // [중복 장식 제거 / Remove redundant decoration]
        // 중복 영문·사진 캡션은 제거하되, 최신 요청에 따라 하단 천지인 도형은 보존합니다.
        // Keep the lower identity diagram and useful copy while removing redundant labels and captions.
        return wrap(path, `
            <section class="institution-story" id="sejong-story">
                <div class="institution-story-heading"><h2>시대의 예술이 모이고,<br>우리의 일상이 넓어지는 곳.</h2><p>광화문에서 만나는 공연과 전시, 그리고 배움.<br>세종문화회관은 시민의 곁에서 예술의 시간을 이어갑니다.</p></div>
                <figure><img src="assets/images/sejong-grand-facade.png" width="1160" height="680" alt="세종문화회관의 넓은 계단과 건물 외관"></figure>
            </section>
            <section class="overview-section overview-section-split" id="institution-introduction">
                <div class="overview-section-heading"><h2>예술과 사람,<br>서울을 잇습니다.</h2><p>1978년 개관 이후 공연·전시·예술교육을 통해 일상 속 문화예술의 자리를 넓혀왔습니다.</p></div>
                ${serviceLinks([
                    [null, "세종의 이야기", "인사말과 기관의 지향점", "/about/introduction/greeting"],
                    [null, "함께 쌓아온 시간", "세종문화회관이 걸어온 역사", "/about/introduction/history"],
                    [null, "무대 뒤의 사람들", "창작과 운영을 연결하는 조직", "/about/introduction/organization"],
                    [null, "서울시예술단", "전통에서 동시대까지, 예술단의 무대", "/about/companies"]
                ])}
            </section>
            <section class="identity-story" id="sejong-identity" aria-labelledby="institution-identity-heading">
                <div><h2 id="institution-identity-heading">하늘과 땅,<br>그리고 다양한 우리.</h2><p>천지인의 세 가지 색으로 자연과 사람을 잇습니다. 검정과 흰색 위에 펼쳐지는 색은 예술을 만나는 사람만큼 다양해집니다.</p>${link("천지인 아이덴티티", "/about/introduction/ci")}</div>
                <div class="identity-story-channels" role="group" aria-label="천 하늘색, 지 황토색, 인 노란색">
                    <div class="identity-channel identity-channel-sky"><span class="identity-shape" aria-hidden="true"></span><strong>천 天</strong><small>하늘 · SKY</small></div>
                    <div class="identity-channel identity-channel-earth"><span class="identity-shape" aria-hidden="true"></span><strong>지 地</strong><small>땅 · EARTH</small></div>
                    <div class="identity-channel identity-channel-human"><span class="identity-shape" aria-hidden="true"></span><strong>인 人</strong><small>사람 · HUMAN</small></div>
                </div>
            </section>
            <section class="overview-section" id="institution-values">
                <div class="overview-section-heading"><h2>함께 만드는<br>문화예술의 내일.</h2></div>
                ${serviceLinks([
                    [null, "지속가능한 운영", "환경과 사회를 생각하는 세종의 실천", "/about/esg"],
                    [null, "정보공개", "투명한 경영과 공개된 기관 정보", "/about/disclosure"],
                    [null, "협력과 협찬", "문화예술의 가능성을 함께 넓히는 일", "/about/partners"],
                    [null, "예술 후원", "더 많은 사람의 예술 경험을 위한 참여", "/about/donation"]
                ])}
            </section>`, { showEyebrow: false, showIdentityMarks: false });
    }

    if (path === "/news") {
        const latest = NOTICES[0];
        return wrap(path, `
            <section class="news-editorial" id="news-featured">
                <div class="news-editorial-copy"><h2>무대의 안과 밖,<br>새로운 이야기.</h2><p>새로운 공연부터 세종의 일상까지.<br>지금 알아두면 좋은 소식을 모았습니다.</p>${link("세종문화N 읽기", "/news/magazine")}</div>
                <a class="news-editorial-feature" href="${href("/news/notices/" + latest.id)}"><img src="assets/images/sejong-grand-auditorium.png" width="1160" height="680" alt="공연을 기다리는 세종대극장의 객석"><div><span class="eyebrow">${esc(latest.category)} · ${esc(latest.date)}</span><h3>${esc(latest.title)}</h3>${icon("diagonal", 26)}</div></a>
            </section>
            <section class="overview-section news-overview-notices" id="news-notices">
                <div class="overview-section-heading"><h2>놓치지 말아야 할 소식.</h2>${link("공지사항 전체보기", "/news/notices")}</div>
                ${noticeRows(NOTICES.slice(0, 5))}
            </section>
            <section class="overview-section" id="news-discovery">
                ${serviceLinks([
                    ["EVENT", "함께하는 이벤트", "다양한 참여 프로그램과 이벤트 안내", "/news/events"],
                    ["LETTER", "일상에 예술 한 통", "새로운 무대와 예술가의 이야기", "/news/newsletter"],
                    ["MEMBER", "세종 멤버십", "더 자주 만나는 예술과 회원 혜택", "/news/membership"],
                    ["GOODS", "무대의 기억을 일상으로", "세종의 이야기를 담은 굿즈", "/news/goods"]
                ])}
            </section>`);
    }
    return null;
}

// [출발지별 이동 안내 / Arrival routes by starting point]
// 개략도와 보유한 안내만 사용하며 실제 거리·시간이나 실시간 경로를 생성하지 않습니다.
// Use the existing schematic and directions without inventing distances or live routing.
const arrivalOrigins = [
    {
        id: "gwanghwamun",
        name: "광화문역 · 5호선",
        path: "M404 335H438V300",
        x: 404,
        y: 335,
        steps: [
            ["광화문역에서 출발", "1·8번 출구에서 세종문화회관 방향 안내를 확인하세요."],
            ["광화문광장 서측으로 이동", "광장 서쪽의 세종문화회관을 찾고 현장 표지를 따라 이동하세요."],
        ],
    },
    {
        id: "gyeongbokgung",
        name: "경복궁역 · 3호선",
        path: "M200 65V300H438",
        x: 200,
        y: 65,
        steps: [
            ["경복궁역에서 출발", "세종대로·광화문광장 방향 안내를 따라 지상으로 이동하세요."],
            ["세종문화회관 방향 확인", "광화문광장 서측의 세종문화회관을 목적지로 이동하세요."],
        ],
    },
    {
        id: "parking",
        name: "세종로 공영주차장",
        path: "M368 402H438V300",
        x: 368,
        y: 402,
        steps: [
            ["주차장에서 지상으로 이동", "보행자 출구 안내에 따라 지상으로 이동하세요. 승강기 위치는 현장 표지에서 확인해 주세요."],
            ["광장 서측의 회관으로 이동", "광화문광장 서측 세종문화회관 입구 방향으로 이동하세요."],
        ],
    },
];

export function neighborhoodMap(route = null) {
    const overlay = route ? `<g class="arrival-map-route" aria-hidden="true"><path d="${route.path}"/><circle cx="${route.x}" cy="${route.y}" r="10"/><circle cx="438" cy="300" r="10"/></g>` : "";
    return `<figure class="info-map${route ? " arrival-map" : ""}"><svg viewBox="0 0 900 470" role="img" aria-labelledby="sejong-map-title sejong-map-desc"><title id="sejong-map-title">세종문화회관 주변 교통 개략도</title><desc id="sejong-map-desc">세종문화회관은 광화문광장 서쪽, 세종대로와 사직로 사이에 있습니다. 광화문역은 남쪽, 경복궁역은 북쪽에 있습니다.</desc><rect width="900" height="470" fill="#eeeDE7"/><path d="M550 0v470M0 335h900M0 65h900M200 0v470" stroke="#fff" stroke-width="44"/><path d="M550 0v470" stroke="#dcd9cf" stroke-width="2" stroke-dasharray="8 9"/><rect x="235" y="110" width="242" height="170" rx="12" fill="#171815"/><rect x="512" y="100" width="77" height="190" rx="28" fill="#e3e9cf"/><rect x="623" y="95" width="215" height="105" rx="8" fill="#dedbd0"/><rect x="285" y="370" width="166" height="64" rx="8" fill="#dedbd0"/><path class="map-default-route" d="M404 334v-34h-40v-20" stroke="#a58a00" stroke-width="6" fill="none" stroke-dasharray="8 6"/><circle cx="404" cy="335" r="20" fill="#8c56a5"/><text x="404" y="342" text-anchor="middle" fill="white" font-size="19" font-weight="700">5</text><circle cx="200" cy="65" r="20" fill="#d78026"/><text x="200" y="72" text-anchor="middle" fill="white" font-size="19" font-weight="700">3</text><g font-family="sans-serif" font-size="18" fill="#343530"><text x="358" y="182" text-anchor="middle" fill="#ffe348" font-size="24" font-weight="700">세종문화회관</text><text x="358" y="215" text-anchor="middle" fill="white" font-size="15">SEJONG CENTER</text><text x="550" y="222" text-anchor="middle" font-size="15" transform="rotate(-90 550 222)">광화문광장</text><text x="404" y="378" text-anchor="middle">광화문역</text><text x="244" y="52">경복궁역</text><text x="728" y="151" text-anchor="middle">대한민국역사박물관</text><text x="368" y="409" text-anchor="middle">세종로 공영주차장</text><text x="665" y="325">종로 →</text><text x="620" y="45">↑ 경복궁</text><text x="25" y="440" font-size="13">위치 이해를 위한 개략도 · 실제 거리와 다릅니다</text></g><circle cx="438" cy="300" r="5" fill="#171815"/><text x="463" y="309" font-family="sans-serif" font-size="13">광장 방향 출입구</text>${overlay}</svg><figcaption>서울특별시 종로구 세종대로 175 · 광화문광장 서측${route ? "<br>강조선은 이동 방향을 설명하는 개략 표시입니다. 실제 보행 경로·거리와 다르며 현장 안내를 확인하세요." : ""}</figcaption></figure>`;
}

const venueLocation = {
    grand: "본관 · 대극장 로비",
    "m-theater": "본관 · M씨어터 로비",
    "s-theater": "세종S씨어터 · 별도 출입구",
    chamber: "본관 · 체임버홀 로비",
    gallery: "세종미술관 · 전시장 입구",
};
// [길찾기 선택과 결과 / Arrival selection and results]
// 선택값은 URL에 보존하고 결과만 갱신해 사용자의 스크롤과 폼 위치를 유지합니다.
// Persist selections in the URL while updating only the result area.
function arrivalSelection(query) {
    return {
        origin: arrivalOrigins.find((item) => item.id === query.get("origin")) || arrivalOrigins[0],
        venue: VENUES.find((item) => item.id === query.get("venue")) || VENUES[0],
    };
}

function arrivalResult(origin, venue) {
    const destination = venue.id === "s-theater"
        ? "세종S씨어터는 별도 출입구를 이용합니다. 회관에 도착한 뒤 S씨어터 현장 안내 표지를 확인하세요."
        : `${venueLocation[venue.id]} 안내를 따라 이동하세요. 티켓에 적힌 공간명과 입구를 다시 확인해 주세요.`;
    return `<div class="arrival-result-layout">
        ${neighborhoodMap(origin)}
        <div class="arrival-instructions">
            <h3 id="arrival-result-heading" tabindex="-1">${esc(origin.name)}에서<br>${esc(venue.name)}까지</h3>
            ${numbered([...origin.steps, [venue.name + " 도착", destination]])}
            <div class="info-actions">${link("목적지 공간 안내", "/visit/spaces/" + venue.id)}${link("접근성 안내", "/visit/accessibility")}</div>
        </div>
    </div>`;
}

function arrivalPlanner(query) {
    const { origin, venue } = arrivalSelection(query);
    return `<section class="arrival-planner" id="arrival-planner" aria-labelledby="arrival-heading">
        <div class="info-section-heading"><h2 id="arrival-heading">어디에서 오시나요?</h2><p>가까운 역과 주차장에서 공연장까지, 이동 순서를 확인하세요.</p></div>
        <form class="experience-filters" data-arrival-planner>
            <label for="arrival-origin">출발 지점<select id="arrival-origin" name="origin">${arrivalOrigins.map((item) => `<option value="${item.id}"${item.id === origin.id ? " selected" : ""}>${item.name}</option>`).join("")}</select></label>
            <label for="arrival-venue">도착 공간<select id="arrival-venue" name="venue">${VENUES.map((item) => `<option value="${item.id}"${item.id === venue.id ? " selected" : ""}>${esc(item.name)}</option>`).join("")}</select></label>
            <button class="button button--dark" type="submit">이동 안내 보기 ${icon("arrow", 18)}</button>
        </form>
        <div data-arrival-result>${arrivalResult(origin, venue)}</div>
    </section>`;
}

const venueTech = {
    grand: [
        "프로시니엄 무대",
        "대형 공연 제작에 적합",
        "오케스트라 피트 · 무대기계 협의",
    ],
    "m-theater": [
        "프로시니엄 무대",
        "중규모 공연과 연극에 적합",
        "조명·음향 운용 계획 사전 협의",
    ],
    "s-theater": [
        "가변형 블랙박스",
        "작품에 맞추는 자유로운 구성",
        "객석·무대 구성에 따라 수용 인원 변경",
    ],
    chamber: [
        "어쿠스틱 콘서트홀",
        "실내악·독주·성악에 적합",
        "악기 반입·조율·리허설 시간 협의",
    ],
    gallery: [
        "전시 공간",
        "회화·설치·미디어 전시에 적합",
        "작품 반입·벽체·전력 사용 사전 협의",
    ],
};
function seating(v) {
    const gallery = v.id === "gallery";
    return `<figure class="venue-diagram"><svg viewBox="0 0 700 410" role="img" aria-label="${esc(v.name)} ${gallery ? "전시 동선" : "객석 구역"} 개략도"><rect x="70" y="30" width="560" height="345" rx="12" fill="#f3f2ed" stroke="#d4d3cb"/><rect x="205" y="65" width="290" height="62" rx="4" fill="#181917"/><text x="350" y="104" text-anchor="middle" fill="white" font-size="21" font-family="sans-serif">${gallery ? "전시실 A" : "STAGE"}</text>${gallery ? `<rect x="110" y="160" width="185" height="160" rx="8" fill="#e3dec5"/><rect x="405" y="160" width="185" height="160" rx="8" fill="#e3dec5"/><text x="203" y="245" text-anchor="middle" font-size="20" font-family="sans-serif">전시실 B</text><text x="498" y="245" text-anchor="middle" font-size="20" font-family="sans-serif">전시실 C</text><path d="M350 360V170M325 195l25-25 25 25" fill="none" stroke="#a9940a" stroke-width="5"/>` : [0, 1, 2, 3, 4].map((r) => Array.from({ length: 14 }, (_, i) => `<rect x="${151 + i * 29}" y="${160 + r * 30}" width="19" height="18" rx="4" fill="${r === 4 && (i === 0 || i === 13) ? "#b3b1a5" : r < 2 ? "#f0d742" : "#deddd3"}"/>`).join("")).join("")}<text x="350" y="345" text-anchor="middle" font-size="15" font-family="sans-serif">${gallery ? "입구 / 안내데스크" : "입구 · 로비 / 휠체어석은 배치 확인 필요"}</text></svg><figcaption>${gallery ? "전시 동선" : "객석 구역"} 이해를 위한 개략도입니다. 실제 ${gallery ? "전시 배치" : "좌석 번호와 층별 배치"}는 작품별로 달라질 수 있습니다.</figcaption></figure>`;
}
function venueList(rental) {
    return `<div class="venue-list">${VENUES.map((v, i) => `<article class="venue-row"><a class="venue-row-image" href="${href(`/${rental ? "rental/venues" : "visit/spaces"}/${v.id}`)}"><img src="${v.image}" alt="${esc(v.name)} 공간 일러스트" loading="lazy"></a><div><span class="eyebrow">${String(i + 1).padStart(2, "0")} / ${v.kind}</span><h2>${esc(v.name)}</h2><p>${esc(v.description)}</p><div class="venue-meta"><strong>${esc(v.capacity)}${v.kind === "공연장" ? "석" : ""}</strong><span>${esc(v.area)}</span></div>${link(rental ? "규모·기술정보 보기" : "공간·객석 안내", `/${rental ? "rental/venues" : "visit/spaces"}/${v.id}`)}</div></article>`).join("")}</div>`;
}
function venueDetail(v, rental) {
    return `<div class="venue-detail-hero"><img src="${v.image}" alt="${esc(v.name)} 공간 일러스트"><div class="venue-detail-number"><strong>${esc(v.capacity)}</strong><span>${v.kind === "공연장" ? "객석 / SEATS" : "EXHIBITION SPACE"}</span></div></div>${section(
        "THE SPACE",
        "공간을 만나보세요",
        `<p class="info-lead">${esc(v.description)}</p>${facts([
            ["공간 유형", v.kind],
            ["추천 프로그램", v.area],
            ["위치", venueLocation[v.id]],
            [
                "좌석 안내",
                v.id === "s-theater"
                    ? "최대 300석 · 구성에 따라 달라짐"
                    : v.kind === "공연장"
                        ? `${v.capacity}석 · 공연별 운영 좌석 확인`
                        : "전시에 따라 동선·구성 변경",
            ],
        ])}`,
    )}${
        rental
            ? section(
                    "TECHNICAL INFORMATION",
                    "무대를 위한 기본 정보",
                    table(
                        ["항목", "안내"],
                        venueTech[v.id].map((s, i) => [
                            ["무대 유형", "제작 특성", "기술 협의"][i],
                            s,
                        ]),
                    ) +
                        `<div class="info-actions">${download("venue-" + v.id, "공간 기술 협의 체크리스트")}${link("무대 기술·장비 안내", "/rental/equipment")}</div>`,
                )
            : ""
    }${section(rental ? "FLOOR PLAN" : "SEATING & FLOW", rental ? "공간 구성 개략도" : "객석과 입장 동선", seating(v) + note("정확한 도면·실측 치수·장비 수량은 제작 조건에 따라 담당자와 확인해야 합니다. 이 개략도는 공식 기술도면이나 실제 좌석 선택 화면이 아닙니다.", "공간 안내"))}${section(
        "PLAN YOUR VISIT",
        rental ? "다음 무대를 준비하세요" : "편안한 관람을 준비하세요",
        cards(
            rental
                ? [
                        [
                            "01",
                            "대관일정 확인",
                            "희망 일자의 상담 가능 상태를 확인해 보세요.",
                            `/rental/schedule?venue=${v.id}`,
                        ],
                        [
                            "02",
                            "대관신청",
                            "공연 개요와 일정으로 신청을 시작하세요.",
                            `/rental/apply?venue=${v.id}`,
                        ],
                    ]
                : [
                        [
                            "01",
                            "오시는 길",
                            "대중교통과 주차 정보를 확인하세요.",
                            "/visit/directions",
                        ],
                        [
                            "02",
                            "이 공간의 프로그램",
                            "무대와 전시를 발견하는 시간.",
                            `/programs?venue=${encodeURIComponent(v.name)}`,
                        ],
                        [
                            "03",
                            "장애인 이용안내",
                            "이동 동선과 관람 지원을 안내합니다.",
                            "/visit/accessibility",
                        ],
                    ],
        ),
    )}`;
}

function rentalCalendar(q) {
    const raw = qget(q, "month", "2026-10");
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : "2026-10";
    const [year, m] = month.split("-").map(Number);
    const venue = VENUES.find((v) => v.id === qget(q, "venue")) || VENUES[0];
    const first = new Date(year, m - 1, 1).getDay();
    const count = new Date(year, m, 0).getDate();
    const selected = qget(q, "date");
    const state = (day) =>
        (day + VENUES.indexOf(venue) * 3) % 7 === 0
            ? "hold"
            : day % 4 === 0
                ? "busy"
                : "open";
    const labels = { open: "상담 가능", hold: "일정 협의", busy: "예시 일정" };
    const dateFor = (day) => `${month}-${String(day).padStart(2, "0")}`;
    return `${demo()}<div class="rental-calendar"><div class="info-filter"><label class="form-field">공간 선택<select data-rental-venue>${VENUES.map((v) => `<option value="${v.id}"${venue.id === v.id ? " selected" : ""}>${esc(v.name)}</option>`).join("")}</select></label><div class="info-month"><button type="button" data-rental-month="-1" data-month="${month}" aria-label="이전 달">${icon("back", 20)}</button><h2>${year}.${String(m).padStart(2, "0")}</h2><button type="button" data-rental-month="1" data-month="${month}" aria-label="다음 달">${icon("arrow", 20)}</button></div></div><div class="rental-calendar-legend"><span><i class="open"></i>상담 가능</span><span><i class="hold"></i>일정 협의</span><span><i class="busy"></i>예시 일정 있음</span></div><div class="rental-calendar-grid" role="group" aria-label="${year}년 ${m}월 ${esc(venue.name)} 대관 시연 일정">${["일", "월", "화", "수", "목", "금", "토"].map((d) => `<div class="calendar-weekday">${d}</div>`).join("")}${Array.from({ length: first }, () => '<div class="calendar-blank" aria-hidden="true"></div>').join("")}${Array.from(
        { length: count },
        (_, i) => {
            const d = i + 1,
                date = dateFor(d);
            return `<a class="rental-day ${state(d)}${selected === date ? " selected" : ""}" href="${href(`/rental/schedule?month=${month}&venue=${venue.id}&date=${date}`)}" aria-label="${m}월 ${d}일 ${labels[state(d)]}${selected === date ? ", 선택됨" : ""}"${selected === date ? ' aria-current="date"' : ""}><span>${d}</span><small>${labels[state(d)]}</small></a>`;
        },
    ).join(
        "",
    )}</div></div>${selected && selected.startsWith(month) && Number(selected.slice(8)) >= 1 && Number(selected.slice(8)) <= count ? `<div class="info-selected"><div><h3>${formatDate(selected)} · ${esc(venue.name)}</h3><p>희망 일자를 선택했습니다. 실제 사용 가능 여부는 대관 심사와 담당자 확인 후 결정됩니다.</p></div>${button("이 일정으로 신청", `/rental/apply?venue=${venue.id}&date=${selected}`, "yellow")}</div>` : note("원하는 날짜를 선택하면 대관신청으로 이어집니다. 실제 예약 가능 여부를 나타내는 달력이 아닙니다.", "희망 일자를 선택하세요")}${section("RENTAL NEWS", "대관공고", noticeRows(NOTICES.filter((n) => n.category === "대관공고")))}`;
}

function rentalPage(path, q) {
    const v = VENUES.find((v) => path === `/rental/venues/${v.id}`);
    if (v) return wrap(path, venueDetail(v, true), { rental: true });
    let body;
    if (path === "/rental" || path === "/rental/guide")
        body = `<div class="info-statement"><h2>상상하던 무대가<br>현실이 되는 곳.</h2><p>공연과 전시의 성격에 맞는 공간을 찾고, 제작부터 관객과의 만남까지 차근차근 준비하세요.</p>${button("대관시설 둘러보기", "/rental/venues", "yellow")}${link("공간 비교하며 고르기", "/rental/compare")}</div>${section(
            "START HERE",
            "대관 준비, 세 가지부터",
            cards([
                [
                    "01 / SPACE",
                    "공간 선택",
                    "공연 규모, 무대 구성, 관객 동선에 맞는 공간을 살펴보세요.",
                    "/rental/venues",
                ],
                [
                    "02 / SCHEDULE",
                    "일정 확인",
                    "준비·설치·리허설·철수 시간을 포함해 계획하세요.",
                    "/rental/schedule",
                ],
                [
                    "03 / APPLY",
                    "서류 준비",
                    "신청 자격과 작품 계획, 필요 서류를 확인하세요.",
                    "/rental/process/documents",
                ],
            ]),
        )}${section(
            "RENTAL OVERVIEW",
            "대관 운영 안내",
            facts([
                [
                    "정기대관",
                    "공고 기간에 다음 연도 또는 지정 기간의 계획을 접수합니다.",
                ],
                ["수시대관", "정기대관 이후 잔여 일정에 한해 별도 협의합니다."],
                ["대관 대상", "문화예술 공연·전시를 기획하는 개인, 단체 및 기관"],
                ["확정 기준", "신청 접수 → 심사 → 승인 → 계약 및 사용료 납부"],
            ]) +
                `<div class="info-actions">${link("대관 대상 및 기준", "/rental/guide/eligibility")}${link("요금 체계 알아보기", "/rental/guide/fees")}</div>`,
        )}${demo()}`;
    else if (path === "/rental/venues") body = `<section class="journey-entry"><div><h2>우리 무대에 맞는 공간은?</h2><p>규모와 무대, 장비를 나란히 놓고 살펴보세요.</p></div>${button("대관 공간 비교", "/rental/compare", "dark")}</section>` + venueList(true);
    else if (path === "/rental/guide/eligibility")
        body = section(
            "WHO CAN APPLY",
            "함께 만들어가는 문화예술",
            `<p class="info-lead">작품성과 공공성, 안전한 운영 계획을 갖춘 문화예술 프로젝트를 기다립니다.</p>${table(
                ["구분", "검토 사항"],
                [
                    ["공연", "오페라·뮤지컬·연극·무용·음악 등 무대예술 공연"],
                    ["전시", "시각예술 전시와 문화예술 교류 프로젝트"],
                    [
                        "신청 주체",
                        "행사 기획과 계약, 안전관리의 책임을 질 수 있는 개인·단체",
                    ],
                    ["검토 기준", "공간 적합성, 예술성, 실행 가능성, 운영·안전 계획"],
                    [
                        "사용 제한",
                        "시설 목적에 맞지 않는 행사 또는 안전·법령상 문제가 있는 경우",
                    ],
                ],
            )}${note("선정 기준과 제한 사항은 해당 대관 공고 및 대관 규정이 우선합니다. 신청 전 담당자에게 행사 성격과 공간 적합성을 확인해 주세요.")}${button("신청서류와 심사기준 보기", "/rental/process/documents")}`,
        );
    else if (path === "/rental/guide/fees")
        body = section(
            "RENTAL FEE",
            "어떻게 계산하나요?",
            `<p class="info-lead">기본 대관료에 사용 시간과 제작에 필요한 부대설비를 더해 전체 예산을 계획하세요.</p><div class="fee-equation"><span>기본 대관료</span><b>+</b><span>준비·철수 사용료</span><b>+</b><span>부대설비·인력</span></div>${table(
                ["항목", "산정 기준", "확인 시점"],
                [
                    [
                        "공간 사용료",
                        "시설·사용일·공연 회차·시간대에 따라 산정",
                        "일정 및 공간 협의 시",
                    ],
                    [
                        "준비·리허설·철수",
                        "무대 설치, 연습, 장비 반출에 필요한 시간",
                        "제작 일정 확정 시",
                    ],
                    [
                        "무대·조명·음향",
                        "사용 장비, 운용 인력, 기술 지원 범위",
                        "기술 회의 시",
                    ],
                    [
                        "기타 운영 비용",
                        "하우스 운영·안전·추가 서비스 등의 필요 여부",
                        "계약 및 최종 정산 시",
                    ],
                ],
            )}${note("본 프로토타입은 확정된 공식 요금표를 제공하지 않습니다. 정확한 금액과 부가세, 취소·환불 기준은 해당 공고 및 계약 조건을 확인해 주세요.", "예산 확인 안내")}<div class="info-actions">${download("budget", "대관 예산 점검표 다운로드")}${button("견적·요금 문의", "/rental/contact")}</div>`,
        );
    else if (path === "/rental/schedule") body = rentalCalendar(q);
    else if (path === "/rental/process")
        body = section(
            "FROM IDEA TO STAGE",
            "대관은 이렇게 진행됩니다",
            numbered([
                [
                    "공간·일정 확인",
                    "시설 규모와 장비를 살펴보고 준비·공연·철수 일정을 계획합니다.",
                ],
                [
                    "공고 확인·신청",
                    "모집 대상과 접수 기한을 확인한 뒤 공연·전시 계획과 서류를 제출합니다.",
                ],
                [
                    "심사·결과 안내",
                    "작품의 성격, 공간 적합성, 운영 계획을 검토합니다. 접수만으로 일정이 확정되지는 않습니다.",
                ],
                [
                    "계약·사용료 납부",
                    "승인 내용과 계약 조건을 확인하고 기한에 따라 사용료를 납부합니다.",
                ],
                [
                    "기술 회의·행사 운영",
                    "무대·음향·조명·안전 계획을 확정하고 현장 운영 담당자와 협의합니다.",
                ],
                [
                    "철수·정산",
                    "시설을 원상 복구하고 사용 내역과 추가 비용을 정산합니다.",
                ],
            ]) +
                `<div class="info-actions">${button("신청서류 준비하기", "/rental/process/documents", "yellow")}${link("대관신청 시작", "/rental/apply")}</div>`,
        );
    else if (path === "/rental/process/documents")
        body =
            section(
                "APPLICATION KIT",
                "좋은 무대를 위한 준비",
                table(
                    ["서류", "포함할 내용"],
                    [
                        ["대관신청서", "신청자·단체 정보, 공간, 희망 사용 기간, 행사명"],
                        [
                            "공연·전시 계획서",
                            "기획 의도, 작품 내용, 출연·참여진, 일정, 관람 대상",
                        ],
                        [
                            "기술·운영 계획",
                            "무대 구성, 장비, 설치·철수 일정, 관객 및 안전관리",
                        ],
                        [
                            "단체 소개·활동자료",
                            "단체 이력, 유사 프로젝트 경험 및 참고 자료",
                        ],
                        [
                            "기타 증빙",
                            "공고에서 별도로 요구하는 서류 및 계약 주체 확인 자료",
                        ],
                    ],
                ) +
                    `<div class="info-actions">${download("rental-application", "대관신청 준비 양식 (.txt)")}${download("safety", "안전관리 점검 양식 (.txt)")}</div>`,
            ) +
            section(
                "REVIEW",
                "심사에서 살펴보는 것",
                cards([
                    [
                        "ARTISTIC VALUE",
                        "작품의 완성도",
                        "기획의 독창성과 예술적 목표가 분명한지 살펴봅니다.",
                        "/rental/guide/eligibility",
                    ],
                    [
                        "FEASIBILITY",
                        "실행 가능성",
                        "일정과 예산, 제작·운영 인력의 준비 상태를 검토합니다.",
                        "/rental/process",
                    ],
                    [
                        "PUBLIC VALUE",
                        "관객과의 연결",
                        "시설의 목적과 공간 특성, 관객 경험에 적합한지 검토합니다.",
                        "/rental/venues",
                    ],
                ]),
            ) +
            note(
                "다운로드 파일은 이 사이트에서 제공하는 준비용 텍스트 양식입니다. 공식 제출 양식은 해당 대관 공고를 확인해야 합니다.",
                "양식 안내",
            );
    else if (path === "/rental/equipment")
        body = section(
            "BACKSTAGE",
            "무대를 완성하는 기술",
            `<p class="info-lead">작품이 의도한 빛과 소리, 움직임을 구현할 수 있도록 제작 초기부터 기술 협의를 시작하세요.</p>${table(
                ["분야", "협의할 사항"],
                [
                    [
                        "무대",
                        "무대 크기, 세트 반입, 하중, 막·장치 운용, 리허설 및 철수 계획",
                    ],
                    ["조명", "조명 도면, 회로·전력, 추가 장비, 포커싱 시간, 오퍼레이터"],
                    [
                        "음향",
                        "마이크·입출력 목록, 스피커 구성, 모니터, 재생 파일, 음향 점검",
                    ],
                    ["영상", "프로젝션·LED 사용, 신호 연결, 콘텐츠 규격, 설치 구조물"],
                    ["악기", "보유 악기 사용 여부, 반입·보관, 조율 일정, 전문 운반"],
                    ["안전", "작업 인력, 특수효과, 방염, 관객 동선, 비상 대피 계획"],
                ],
            )}${note("시설별 보유 장비와 사용 가능 여부, 추가 사용료는 기술 담당자 확인이 필요합니다. 외부 장비 반입 전 사전 협의를 진행해 주세요.")}<div class="info-actions">${download("technical", "기술 회의 체크리스트")}${button("기술·장비 문의", "/rental/contact")}</div>`,
        );
    else return null;
    return wrap(path, body, { rental: true });
}

const FAQS = [
    [
        "예매",
        "예매한 티켓은 어디에서 확인하나요?",
        "마이페이지의 예매내역에서 공연명, 일시, 선택 좌석을 확인할 수 있습니다. 이 사이트의 예매는 결제 없는 체험이며 내역은 현재 브라우저에만 저장됩니다.",
        "/account/bookings",
    ],
    [
        "예매",
        "예매 취소와 환불은 어떻게 하나요?",
        "공연별 취소 가능 시간과 수수료가 다를 수 있으므로 예매 전 상세 규정을 확인하세요. 시연 예매는 마이페이지 예매내역에서 취소할 수 있으며 실제 환불은 발생하지 않습니다.",
        "/programs/booking-guide",
    ],
    [
        "관람",
        "늦게 도착해도 입장할 수 있나요?",
        "공연의 흐름을 보호하기 위해 지연 입장을 제한할 수 있습니다. 현장 안내원의 안내에 따라 지정된 시점에 입장하며, 잠시 다른 좌석에서 관람할 수 있습니다.",
        "/visit/etiquette",
    ],
    [
        "교통",
        "주차장은 어디에 있나요?",
        "인근 세종로 공영주차장을 이용할 수 있습니다. 주말에는 혼잡하므로 대중교통을 권장합니다. 요금과 할인 적용 조건은 방문 당일 운영 정보를 확인해 주세요.",
        "/visit/directions/parking",
    ],
    [
        "편의",
        "휠체어석은 어떻게 이용하나요?",
        "휠체어석 위치와 동반인 좌석은 공연장 및 작품에 따라 다릅니다. 예매 전 고객지원으로 관람 일정과 필요한 지원을 문의해 주세요.",
        "/visit/accessibility",
    ],
    [
        "대관",
        "대관 신청만 하면 일정이 확정되나요?",
        "신청은 검토를 위한 접수 단계입니다. 심사와 승인, 계약 절차를 거쳐 사용 일정이 확정됩니다. 준비·철수 시간을 포함해 신청해 주세요.",
        "/rental/process",
    ],
    [
        "관람",
        "어린이와 함께 관람할 수 있나요?",
        "작품마다 관람 가능 연령이 다릅니다. 프로그램 상세의 관람 연령을 확인하고, 연령 확인 서류가 필요한 경우 안내에 따라 준비해 주세요.",
        "/programs",
    ],
    [
        "분실물",
        "공연장에서 물건을 잃어버렸어요.",
        "관람 일시, 공연장, 좌석과 물품 특징을 정리해 고객지원으로 문의하세요. 개인정보와 소유 확인을 위해 분실물의 상세 사진은 공개하지 않습니다.",
        "/visit/support/lost",
    ],
    [
        "교육",
        "교육 신청 내역은 어디서 확인하나요?",
        "신청 후 마이페이지의 신청내역에서 강좌와 신청 상태를 확인할 수 있습니다. 이 프로토타입에서는 실제 수강 접수가 진행되지 않습니다.",
        "/account/applications",
    ],
];
function faq(q) {
    const category = qget(q, "category", "전체"),
        search = qget(q, "search");
    const filtered = FAQS.filter(
        (f) =>
            (category === "전체" || f[0] === category) &&
            f.join(" ").toLowerCase().includes(search.toLowerCase()),
    );
    return `<form class="info-search" data-info-search><label class="sr-only" for="faq-search">질문 검색</label><input id="faq-search" name="search" type="search" placeholder="궁금한 내용을 검색해 보세요" value="${esc(search)}"><button class="button button--dark" type="submit">${icon("search", 18)} 검색</button></form><nav class="info-chips" aria-label="질문 분류">${["전체", ...new Set(FAQS.map((f) => f[0]))].map((c) => `<a href="${href(`/visit/support/faq?category=${encodeURIComponent(c)}&search=${encodeURIComponent(search)}`)}"${category === c ? ' aria-current="page"' : ""}>${esc(c)}</a>`).join("")}</nav><p class="info-result-count">총 <strong>${filtered.length}</strong>개의 질문</p><div class="faq-list">${filtered.length ? filtered.map((f) => `<details><summary><span class="faq-category">${esc(f[0])}</span><span>${esc(f[1])}</span>${icon("plus", 20)}</summary><div class="faq-answer"><p>${esc(f[2])}</p>${link("관련 안내 보기", f[3])}</div></details>`).join("") : emptyState("검색 결과가 없습니다", "다른 검색어를 입력하거나 전체 분류를 선택해 주세요.", "/visit/support/faq", "전체 질문 보기")}</div><div class="info-footer-cta"><div><h2>찾으시는 답변이 없나요?</h2><p>문의 내용을 남겨주시면 필요한 안내를 확인할 수 있습니다.</p></div>${button("문의하기", "/visit/support/inquiry")}</div>`;
}

const LOST_ITEMS = [
    {
        id: "umbrella",
        title: "검은색 접이식 우산",
        date: "2026-10-11",
        venue: "세종대극장 로비",
        status: "보관 중",
        number: "DEMO-LF-1011",
        type: "우산",
        description:
            "공연 종료 후 로비 휴식 공간에서 발견한 접이식 우산의 예시입니다. 손잡이 모양과 제품 표기 등 세부 특징은 문의 시 확인합니다.",
    },
    {
        id: "scarf",
        title: "베이지색 머플러",
        date: "2026-10-10",
        venue: "세종M씨어터 객석",
        status: "보관 중",
        number: "DEMO-LF-1010",
        type: "의류·잡화",
        description:
            "공연 종료 후 객석 점검 중 발견한 머플러의 예시입니다. 재질과 무늬, 관람 좌석 정보를 함께 알려주시면 소유 확인에 도움이 됩니다.",
    },
    {
        id: "glasses",
        title: "안경 및 안경 케이스",
        date: "2026-10-09",
        venue: "세종체임버홀 로비",
        status: "보관 중",
        number: "DEMO-LF-1009",
        type: "생활용품",
        description:
            "로비에서 발견한 안경과 케이스의 예시입니다. 안경테의 색상과 형태, 케이스 안쪽 표기 등 소유자가 확인할 수 있는 특징을 준비해 주세요.",
    },
];
function lostIllustration(item) {
    const drawing =
        item.id === "umbrella"
            ? '<path d="M45 105a65 65 0 0 1 130 0H45Zm65 0v65a15 15 0 0 0 30 0M110 27v13"/>'
            : item.id === "scarf"
                ? '<path d="M65 45h88v36H65zm7 36h29v95H72zm50 0h24v65h-24M77 176v12m9-12v12m10-12v12m31-42v12m9-12v12m8-12v12"/>'
                : '<rect x="35" y="92" width="60" height="43" rx="18"/><rect x="125" y="92" width="60" height="43" rx="18"/><path d="M95 109q15-15 30 0M35 107 24 75m161 32 11-32"/>';
    return `<div class="lost-item-art"><svg viewBox="0 0 220 220" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg><small>물품 종류 안내 그림 · 실제 사진 아님</small></div>`;
}
function lostList() {
    return `<div class="lost-item-grid">${LOST_ITEMS.map((item) => `<a class="lost-item-card" href="${href("/visit/support/lost/" + item.id)}">${lostIllustration(item)}<div class="lost-item-status"><span>${esc(item.type)}</span><strong>예시 · ${esc(item.status)}</strong></div><h3>${esc(item.title)}</h3><p>${formatDate(item.date)} 발견 · ${esc(item.venue)}</p><span class="text-link">물품 상세 확인 ${icon("arrow", 17)}</span></a>`).join("")}</div>`;
}
function lostDetail(item) {
    return `<div class="lost-item-detail">${lostIllustration(item)}<div><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p>${facts(
        [
            ["관리번호", item.number],
            ["발견 일자", formatDate(item.date)],
            ["발견 장소", item.venue],
            ["보관 상태", "예시 · " + item.status],
        ],
    )}</div></div>${note("위 물품과 날짜, 보관 상태는 분실물 조회 흐름을 위한 가상 사례입니다. 실제 습득·보관 기록이 아니며, 이 사이트의 문의는 실제 담당자에게 전달되지 않습니다.", "시연용 분실물")}<div class="info-actions">${button("이 물품에 대해 문의하기", "/visit/support/inquiry?subject=" + encodeURIComponent("분실물 확인 문의 · " + item.title + " (" + item.number + ")"), "yellow")}${link("분실물 목록으로", "/visit/support/lost")}</div>${section(
        "CLAIM YOUR ITEM",
        "문의할 때 알려주세요",
        numbered([
            [
                "관람 정보를 준비하세요",
                "공연명, 관람 날짜와 회차, 좌석 또는 마지막으로 물품을 확인한 위치를 정리해 주세요.",
            ],
            [
                "소유 확인에 필요한 특징",
                "색상, 모양, 제품 표기 등 본인의 물품임을 확인할 수 있는 특징을 알려주세요. 주민등록번호나 결제 정보는 보내지 마세요.",
            ],
            [
                "안내를 받은 뒤 방문하세요",
                "실제 물품의 보관 여부와 수령 절차는 공식 고객지원에서 확인한 후 방문해 주세요.",
            ],
        ]),
    )}`;
}
function visitPage(path, q) {
    const v = VENUES.find((v) => path === `/visit/spaces/${v.id}`);
    if (v) return wrap(path, venueDetail(v, false));
    const item = LOST_ITEMS.find(
        (item) => path === "/visit/support/lost/" + item.id,
    );
    if (item) return wrap(path, lostDetail(item));
    let body;
    if (path === "/visit")
        body = `<div class="info-statement"><h2>예술을 만나는 하루,<br>편안한 시작.</h2><p>처음 방문하는 순간부터 공연의 여운을 안고 돌아가는 길까지, 필요한 정보를 한곳에서 확인하세요.</p></div><section class="journey-entry"><div><h2>오늘의 관람을 미리 그려보세요.</h2><p>프로그램과 이동 방법을 선택하면 도착부터 귀가까지 순서대로 안내해 드려요.</p></div>${button("나의 방문 계획 만들기", "/visit/plan", "dark")}</section>${cards(
            [
                [
                    "SPACES",
                    "공간안내",
                    "공연장과 전시 공간, 객석과 이동 동선.",
                    "/visit/spaces",
                ],
                [
                    "DIRECTIONS",
                    "오시는 길·주차",
                    "광화문에서 시작되는 오늘의 여정.",
                    "/visit/directions",
                ],
                [
                    "AMENITIES",
                    "편의시설",
                    "공연 전후의 시간을 더 편안하게.",
                    "/visit/amenities",
                ],
                [
                    "ACCESSIBILITY",
                    "장애인 이용안내",
                    "모두에게 열린 예술 경험.",
                    "/visit/accessibility",
                ],
                [
                    "ETIQUETTE",
                    "관람 유의사항",
                    "함께 만드는 좋은 관람 문화.",
                    "/visit/etiquette",
                ],
                [
                    "SUPPORT",
                    "고객지원",
                    "궁금한 점과 도움이 필요한 순간.",
                    "/visit/support",
                ],
            ],
        )}`;
    else if (path === "/visit/spaces")
        body =
            venueList(false) +
            section("FIND YOUR WAY", "광화문, 예술의 중심에서", neighborhoodMap());
    else if (path === "/visit/directions")
        body =
            (q.get("overview") === "1" ? "" : arrivalPlanner(q)) +
            section(
                "PUBLIC TRANSPORT",
                "대중교통으로 오세요",
                table(
                    ["교통수단", "이용 안내"],
                    [
                        [
                            "지하철 5호선",
                            "광화문역 1·8번 출구에서 세종문화회관 방향으로 이동",
                        ],
                        ["지하철 3호선", "경복궁역에서 세종대로·광화문광장 방향으로 이동"],
                        ["지하철 1호선", "시청역에서 세종대로를 따라 광화문 방향으로 이동"],
                        [
                            "버스",
                            "세종문화회관·광화문 정류장 하차. 노선별 정류장 위치 확인",
                        ],
                        ["도로명 주소", "서울특별시 종로구 세종대로 175"],
                    ],
                ) +
                    `<div class="info-actions">${button("주차 안내", "/visit/directions/parking")}${link("공간별 출입구 확인", "/visit/spaces")}</div>`,
            ) +
            note(
                "광화문광장 행사와 집회 등으로 교통 상황이 달라질 수 있습니다. 공연 시작 전 여유 있게 도착해 주세요.",
            );
    else if (path === "/visit/directions/parking")
        body =
            section(
                "PARKING",
                "차량으로 방문하신다면",
                facts([
                    ["이용 주차장", "인근 세종로 공영주차장"],
                    ["방문 전 확인", "운영 시간, 기본 요금, 할인 대상 및 적용 방법"],
                    ["관람객 할인", "공연·전시별 적용 여부와 인증 방법을 현장에서 확인"],
                    ["권장 동선", "주차 후 지상으로 이동 → 광장 서측 세종문화회관 입구"],
                ]) + neighborhoodMap(),
            ) +
            section(
                "BEFORE YOU LEAVE",
                "출차 전 확인사항",
                numbered([
                    [
                        "관람 내역 확인",
                        "모바일 티켓 또는 관람 증빙을 준비하고 할인 적용 여부를 확인하세요.",
                    ],
                    ["요금 정산", "주차장 안내에 따라 정산한 뒤 차량으로 이동하세요."],
                    [
                        "여유 있는 출차",
                        "공연 종료 직후에는 출차가 집중됩니다. 주변 보행자 안전에 유의하세요.",
                    ],
                ]),
            ) +
            note(
                "실시간 주차 잔여 면수나 확정 요금은 이 사이트에서 제공하지 않습니다. 주말·공휴일에는 대중교통 이용을 권장합니다.",
            );
    else if (path === "/visit/amenities")
        body =
            section(
                "STAY A LITTLE LONGER",
                "공연 전후, 조금 더 머무는 시간",
                cards([
                    [
                        "FOOD & DRINK",
                        "F&B · 다이닝",
                        "가벼운 음료부터 공연 후의 식사까지, 방문에 여유를 더해 보세요.",
                        "/visit/amenities/dining",
                    ],
                    [
                        "FACILITIES",
                        "편의시설 위치",
                        "물품보관, 수유 공간, 화장실과 이동 편의를 확인하세요.",
                        "/visit/amenities/facilities",
                    ],
                    [
                        "ACCESSIBLE VISIT",
                        "관람 지원",
                        "휠체어 이동과 도움이 필요한 관람객을 위한 안내.",
                        "/visit/accessibility",
                    ],
                ]),
            ) +
            section(
                "AT A GLANCE",
                "필요한 순간, 가까운 곳에",
                table(
                    ["시설", "이용 안내"],
                    [
                        [
                            "물품보관",
                            "공연장 로비 운영 여부와 보관 가능한 물품을 현장에서 확인",
                        ],
                        ["수유·가족 편의", "필요한 시설과 접근 동선을 안내데스크에 문의"],
                        ["화장실", "공연장 로비별 안내 표지 확인, 쉬는 시간 혼잡 유의"],
                        ["휴식 공간", "광장과 로비 내 휴식 공간 이용, 운영 시간 확인"],
                    ],
                ),
            );
    else if (path === "/visit/amenities/dining")
        body = `<div class="dining-visual"><span>${icon("coffee", 72)}</span><div><h2>예술 사이,<br>맛있는 쉼표.</h2></div></div>${section(
            "F&B GUIDE",
            "방문 시간에 맞춰 즐기세요",
            numbered([
                [
                    "공연 시작 전",
                    "가볍게 즐길 수 있는 음료와 간식으로 여유를 가지세요. 로비 매점은 공연 운영 시간에 따라 이용이 달라집니다.",
                ],
                [
                    "인터미션",
                    "대기 시간을 고려해 가까운 편의시설을 이용하세요. 객석 내 음식물 반입 규정을 확인해 주세요.",
                ],
                [
                    "공연이 끝난 뒤",
                    "광화문과 세종로 일대에서 식사와 산책으로 하루를 마무리해 보세요.",
                ],
            ]),
        )}${note("입점 매장과 영업시간은 변경될 수 있습니다. 특정 매장의 현재 운영 여부나 할인 혜택을 보장하지 않습니다.")}${link("편의시설 위치 보기", "/visit/amenities/facilities")}`;
    else if (path === "/visit/amenities/facilities")
        body =
            section(
                "FACILITY DIRECTORY",
                "필요한 시설을 찾아보세요",
                table(
                    ["구역", "주요 편의", "확인 사항"],
                    [
                        [
                            "공연장 로비",
                            "안내데스크 · 티켓 확인 · 물품보관",
                            "해당 공연장 운영 시간 내 이용",
                        ],
                        [
                            "공연장 공용부",
                            "화장실 · 엘리베이터 · 휴식 공간",
                            "층별 안내 표지와 현장 동선 확인",
                        ],
                        ["전시 공간", "전시 안내 · 매표 · 휴식", "전시별 운영 방식 확인"],
                        [
                            "광장·야외",
                            "보행 동선 · 휴식 공간",
                            "행사 일정과 날씨에 따라 달라짐",
                        ],
                        [
                            "도움이 필요한 경우",
                            "안내데스크 또는 현장 안내원",
                            "수유 공간·이동 지원·응급 상황 문의",
                        ],
                    ],
                ),
            ) +
            neighborhoodMap() +
            link("공연장별 공간안내", "/visit/spaces");
    else if (path === "/visit/accessibility")
        body = `<div class="info-statement access-statement"><span>${icon("wheelchair", 60)}</span><h2>모두에게 열려 있는<br>예술의 문.</h2><p>필요한 지원을 미리 확인하고, 자신의 속도로 공연과 전시를 즐기세요.</p></div>${section(
            "BEFORE YOUR VISIT",
            "관람 전 지원을 확인하세요",
            numbered([
                [
                    "휠체어석·동반인 좌석",
                    "공연장별 휠체어석 위치와 판매 방식이 다릅니다. 예매 전 필요한 좌석과 동반인 관람 여부를 확인해 주세요.",
                ],
                [
                    "출입구·이동 경로",
                    "계단을 이용하기 어려운 경우 엘리베이터와 무단차 이동 경로를 안내받으세요. 임시 행사로 동선이 변경될 수 있습니다.",
                ],
                [
                    "접근성 프로그램",
                    "수어 통역, 자막, 음성 해설 등은 작품별 제공 여부를 확인해야 합니다. 상세 페이지의 관람 정보를 확인하세요.",
                ],
                [
                    "현장 지원",
                    "현장 안내원에게 필요한 도움을 알려주세요. 보조기기 대여는 보유 현황과 이용 조건을 사전에 문의해 주세요.",
                ],
            ]),
        )}<div class="info-actions">${button("관람 지원 문의", "/visit/support/inquiry", "yellow")}${link("공간별 안내", "/visit/spaces")}</div>`;
    else if (path === "/visit/etiquette")
        body =
            section(
                "GOOD AUDIENCE, GREAT EXPERIENCE",
                "함께 만드는 좋은 관람",
                numbered([
                    [
                        "관람 연령을 확인해 주세요",
                        "프로그램마다 관람 가능 연령과 증빙 안내가 다릅니다. 예매 전 상세 페이지를 확인해 주세요.",
                    ],
                    [
                        "조금 일찍 도착해 주세요",
                        "티켓 확인, 물품 보관, 객석 이동 시간을 고려해 여유 있게 도착해 주세요. 지연 입장은 작품별로 제한됩니다.",
                    ],
                    [
                        "휴대전화는 잠시 쉬어갑니다",
                        "공연 시작 전 소리와 진동을 끄고 화면 밝기도 다른 관객에게 방해가 되지 않도록 해주세요.",
                    ],
                    [
                        "촬영은 허용된 순간에만",
                        "사진·영상 촬영과 녹음은 원칙적으로 제한되며, 커튼콜 등 별도 안내가 있는 경우 그 안내를 따라주세요.",
                    ],
                    [
                        "음식물과 큰 짐은 객석 밖에",
                        "객석 반입 규정을 확인하고, 관람과 대피 동선에 방해되는 물품은 안내에 따라 보관해 주세요.",
                    ],
                    [
                        "안내원의 안내를 따라주세요",
                        "비상 상황에서는 침착하게 현장 안내와 대피 표지에 따라 이동해 주세요.",
                    ],
                ]),
            ) +
            cards([
                [
                    "BOOKING",
                    "예매 안내",
                    "티켓 수령·변경·취소 안내를 확인하세요.",
                    "/programs/booking-guide",
                ],
                [
                    "GROUP VISIT",
                    "단체관람",
                    "여럿이 함께하는 관람을 계획하세요.",
                    "/visit/group",
                ],
            ]);
    else if (path === "/visit/support")
        body =
            cards([
                [
                    "FAQ",
                    "자주 묻는 질문",
                    "예매부터 관람, 교통과 대관까지 빠르게 답을 찾으세요.",
                    "/visit/support/faq",
                ],
                [
                    "CONTACT",
                    "문의하기",
                    "궁금한 내용을 분야별로 남겨주세요.",
                    "/visit/support/inquiry",
                ],
                [
                    "LOST & FOUND",
                    "분실물 안내",
                    "잃어버린 물품을 찾는 방법을 안내합니다.",
                    "/visit/support/lost",
                ],
            ]) +
            section(
                "HOW CAN WE HELP?",
                "문의 전에 준비해 주세요",
                facts([
                    ["예매 문의", "공연명, 관람 일시, 예매 관련 내용"],
                    ["방문·시설 문의", "방문 예정일, 이용 공간, 필요한 지원"],
                    ["대관 문의", "행사 성격, 희망 공간과 일정"],
                    [
                        "개인정보 보호",
                        "비밀번호, 결제 정보, 주민등록번호는 보내지 마세요.",
                    ],
                ]),
            );
    else if (path === "/visit/support/faq") body = faq(q);
    else if (path === "/visit/support/lost")
        body =
            section(
                "FOUND ITEMS",
                "최근 습득 물품",
                note(
                    "아래 물품과 발견 일자, 보관 상태는 모두 시연용 가상 사례입니다. 실제 보관 현황은 공식 고객지원에서 확인해 주세요.",
                    "시연용 분실물 목록",
                ) + lostList(),
            ) +
            section(
                "LOST & FOUND",
                "소중한 물건을 찾고 계신가요?",
                `<p class="info-lead">관람하신 공간과 시간을 알려주시면 분실물 확인에 도움이 됩니다.</p>${numbered(
                    [
                        [
                            "물품 정보를 정리하세요",
                            "분실 일시, 공연명, 공연장·좌석, 물품 종류와 색상 등 식별할 수 있는 특징을 준비하세요.",
                        ],
                        [
                            "고객지원으로 문의하세요",
                            "분실물 문의에서 필요한 정보를 작성하세요. 민감한 개인정보는 내용에 포함하지 마세요.",
                        ],
                        [
                            "확인 후 수령하세요",
                            "물품 보관 여부와 수령 방법을 안내받은 뒤 방문하세요. 소유 확인을 위한 증빙이 필요할 수 있습니다.",
                        ],
                    ],
                )}<div class="info-actions">${button("분실물 문의하기", "/visit/support/inquiry?subject=" + encodeURIComponent("분실물 확인 문의"), "yellow")}${link("자주 묻는 질문", "/visit/support/faq?category=%EB%B6%84%EC%8B%A4%EB%AC%BC")}</div>${note("실제 분실물 보관 현황은 이 프로토타입과 연결되어 있지 않습니다. 실제 문의는 공식 홈페이지의 고객지원 연락처를 확인해 주세요.", "보관 현황 안내")}`,
            );
    else return null;
    return wrap(path, body);
}

function noticeRows(list) {
    return `<div class="notice-rows">${list.map((n) => `<a href="${href("/news/notices/" + n.id)}" class="notice-row"><span class="notice-category">${esc(n.category)}</span><h3>${n.pinned ? '<span class="notice-pin">주요</span>' : ""}${esc(n.title)}</h3><time datetime="${n.date}">${formatDate(n.date)}</time>${icon("diagonal", 19)}</a>`).join("")}</div>`;
}
const EVENTS = [
    {
        id: "autumn-walk",
        title: "가을의 취향을 나누다",
        tag: "진행중",
        period: "2026.10.01 — 10.31",
        color: "yellow",
        subtitle: "광화문에서 발견한 나만의 예술",
        body: "공연과 전시를 만나는 하루, 마음에 남은 장면을 함께 나누는 참여형 이벤트입니다. 관람 후 느낀 점과 다음에 만나고 싶은 프로그램을 생각해 보세요.",
        steps: [
            [
                "프로그램 둘러보기",
                "이번 달 공연·전시 중 마음에 드는 프로그램을 찾아보세요.",
            ],
            [
                "관심 프로그램 저장",
                "프로그램 상세의 관심 버튼을 눌러 나만의 목록을 만드세요.",
            ],
            [
                "이벤트 참여하기",
                "아래 참여 버튼에서 관심 프로그램과 예술을 만난 이야기를 작성해 보세요. 신청은 현재 브라우저에서만 저장됩니다.",
            ],
        ],
    },
    {
        id: "review",
        title: "관람 후기 이벤트",
        tag: "진행중",
        period: "2026.10.10 — 11.10",
        color: "purple",
        subtitle: "당신의 감상이 또 다른 초대가 됩니다",
        body: "예술의 감동은 서로의 언어로 나눌 때 더 오래 머뭅니다. 관람한 작품에서 가장 인상 깊었던 순간을 떠올려 보세요.",
        steps: [
            [
                "관람한 작품 찾기",
                "프로그램 목록에서 내가 만난 작품의 상세 페이지를 확인하세요.",
            ],
            ["감상 기록하기", "좋았던 장면과 나만의 생각을 기록해 보세요."],
            [
                "후기 참여하기",
                "아래 참여 버튼에서 관람한 작품과 후기를 작성해 보세요. 실제 심사와 경품 지급은 진행되지 않습니다.",
            ],
        ],
    },
    {
        id: "summer-end",
        title: "여름의 기억",
        tag: "종료",
        period: "2026.08.01 — 08.31",
        color: "blue",
        subtitle: "여름밤, 함께 만든 예술의 장면",
        body: "여름의 공연과 야외 프로그램을 함께한 관객들의 이야기를 돌아봅니다. 이 이벤트는 종료되었으며 현재 참여 접수를 받지 않습니다.",
        steps: [
            [
                "여름을 함께한 관객",
                "광화문의 열린 공간과 무대에서 다양한 예술을 만났습니다.",
            ],
            [
                "이어지는 만남",
                "계절은 바뀌어도 예술과의 만남은 계속됩니다. 가을 프로그램을 확인하세요.",
            ],
        ],
    },
];
const eventCards = (list) =>
    `<div class="event-grid">${list.map((e) => `<a class="event-card" href="${href("/news/events/" + e.id)}"><div class="event-art ${e.color}"><span>SEJONG<br>WITH YOU</span><i aria-hidden="true">${e.id === "review" ? "“" : "✳︎"}</i><small>${esc(e.tag)}</small></div><h2>${esc(e.title)}</h2><p>${esc(e.subtitle)}</p><time>${esc(e.period)}</time></a>`).join("")}</div>`;
const ARTICLES = [
    [
        "october",
        "2026.10",
        "가을의 빛, 무대의 온도",
        "공연장으로 향하는 길 위에서 발견하는 가을의 감각. 음악과 무용, 미술이 만나는 이달의 세종을 소개합니다.",
    ],
    [
        "september",
        "2026.09",
        "예술이 일상이 되는 순간",
        "일상의 작은 틈에서 예술을 만나는 방법. 새로운 계절의 프로그램과 공간의 이야기를 담았습니다.",
    ],
    [
        "august",
        "2026.08",
        "도시의 여름, 열린 무대",
        "햇살이 긴 계절, 광화문을 채운 소리와 움직임. 예술가와 관객이 함께 만든 장면을 돌아봅니다.",
    ],
];
function articleList(path) {
    return `<div class="magazine-grid">${ARTICLES.map((a, i) => `<a href="${href(`${path}?issue=${a[0]}`)}"><div class="magazine-cover magazine-cover-${i}"><span>SEJONG<br><b>문화N</b></span><small>VOL. ${a[1]}</small><i aria-hidden="true">${["◯", "✳︎", "↗"][i]}</i></div><span class="eyebrow">${a[1]}</span><h2>${esc(a[2])}</h2><p>${esc(a[3])}</p></a>`).join("")}</div>`;
}
function articleDetail(a) {
    return `<article class="info-article"><span class="eyebrow">문화N · ${a[1]}</span><h2>${esc(a[2])}</h2><p class="info-lead">${esc(a[3])}</p><div class="article-pullquote">예술을 만나는 방식은<br>우리의 일상만큼 다양합니다.</div><h3>무대 앞에서 시작되는 새로운 시선</h3><p>하나의 공연은 많은 사람의 시간이 모여 완성됩니다. 연습실에서 반복되는 움직임, 무대 뒤에서 조율하는 빛과 소리, 그리고 객석에 앉는 관객의 기대가 만나 그날만의 장면을 만듭니다. 작품을 고를 때에는 장르뿐 아니라 내가 어떤 감각을 만나고 싶은지도 생각해 보세요.</p><h3>공간과 함께 읽는 예술</h3><p>커다란 무대의 울림부터 작은 공연장의 가까운 호흡까지, 공간에 따라 작품을 경험하는 방식도 달라집니다. 공연장 소개에서 객석의 특징과 관람 동선을 살펴보고, 조금 일찍 도착해 로비와 광장의 풍경을 느껴보세요.</p><h3>다음 만남을 위한 작은 기록</h3><p>마음에 남는 선율과 장면을 한 문장으로 적어보는 것은 어떨까요. 관심 프로그램을 저장하고 다음 달의 공연과 연결해 보는 것도 나만의 예술 지도를 만드는 좋은 방법입니다.</p>${note("세종문화N의 편집 방향을 보여주기 위해 작성한 리뉴얼 시연용 기사입니다. 공식 발행물의 원문이 아닙니다.", "콘텐츠 안내")}<div class="info-actions">${button("이달의 프로그램 보기", "/programs")}${link("아카이브로 돌아가기", "/news/newsletter/archive")}</div></article>`;
}
function membershipBenefits() {
    return table(
        ["혜택", "일반회원", "유료 멤버십 안내"],
        [
            ["관심 프로그램 저장", "이용 가능", "이용 가능"],
            ["예매·신청 내역 관리", "이용 가능", "이용 가능"],
            ["공연 할인", "공연별 일반 할인 적용", "대상 작품·등급별 할인 확인"],
            ["선예매·특별 초청", "개별 안내 확인", "운영 시 대상 및 일정 별도 공지"],
            ["소식 수신", "별도 동의 후 이용", "별도 동의 후 이용"],
            [
                "가입·이용료",
                "이 프로토타입에서 무료 체험",
                "실제 가격 및 운영 여부 공식 안내 확인",
            ],
        ],
    );
}
// [이벤트 응모 상태 조회 / Local event application lookup]
// 실제 추첨 결과를 만들지 않고 이 브라우저에 저장한 응모와 철회 상태를 보여줍니다.
// Show saved and withdrawn applications without inventing real drawing results.
function eventApplicationRecords() {
    return readStore("applications", []).filter((record) => record
        && typeof record.id === "string"
        && typeof record.type === "string"
        && EVENTS.some((event) => record.type === "/news/events/" + event.id + "/apply"));
}

function eventApplicationResults(query) {
    const eventId = EVENTS.some((event) => event.id === query.get("event")) ? query.get("event") : "";
    const reference = qget(query, "reference").trim().toLocaleLowerCase();
    const allRecords = eventApplicationRecords();
    const records = allRecords.filter((record) => (!eventId || record.type === "/news/events/" + eventId + "/apply")
        && (!reference || record.id.toLocaleLowerCase().includes(reference))).slice().reverse();
    if (!records.length) {
        return emptyState(
            allRecords.length ? "일치하는 응모내역이 없습니다" : "아직 저장한 이벤트 응모가 없습니다",
            allRecords.length ? "이벤트와 접수번호를 다시 확인하거나 필터를 초기화해 주세요." : "이벤트에 참여하면 이 브라우저에서 접수번호와 응모 상태를 확인할 수 있습니다.",
            "/news/events", "참여할 이벤트 보기",
        );
    }
    return `<p class="info-result-count" role="status">조회된 응모 <strong>${records.length}</strong>건</p>
        <div class="event-status-list">${records.map((record) => {
            const event = EVENTS.find((item) => record.type === "/news/events/" + item.id + "/apply");
            const withdrawn = record.status === "cancelled";
            return `<article class="event-status-record" data-motion-key="event-${esc(record.id)}">
                <div><span class="experience-state">${withdrawn ? "철회 완료" : "체험 응모 저장"}</span><h3>${esc(event.title)}</h3><p>접수번호 <strong>${esc(record.id)}</strong></p><p>${esc(formatDate(String(record.createdAt || "").slice(0, 10)))}</p></div>
                <div><p>${withdrawn ? "이 브라우저에서 응모를 철회했습니다." : "작성한 응모가 이 브라우저에 저장되어 있습니다. 실제 추첨과 당첨 발표는 진행되지 않습니다."}</p>${link("내 신청 내용 확인", "/account/applications")}</div>
            </article>`;
        }).join("")}</div>`;
}

function eventParticipation(query) {
    const eventId = qget(query, "event");
    return `${tabs([["진행중", "/news/events"], ["종료", "/news/events?status=종료"], ["당첨자 발표·내 응모", "/news/events/winners"]], "/news/events/winners")}
        <section id="event-participation" aria-labelledby="event-participation-heading">
            <div class="info-section-heading"><h2 id="event-participation-heading">내 이벤트 응모 확인</h2><p>참여한 이벤트와 접수번호로 저장된 응모를 확인하세요. 이 사이트는 체험용이며 실제 당첨 결과를 제공하지 않습니다.</p></div>
            <form class="experience-filters" data-event-lookup>
                <label for="event-lookup-event">이벤트<select id="event-lookup-event" name="event"><option value="">전체 이벤트</option>${EVENTS.map((event) => `<option value="${event.id}"${event.id === eventId ? " selected" : ""}>${esc(event.title)}</option>`).join("")}</select></label>
                <label for="event-lookup-reference">접수번호<input id="event-lookup-reference" name="reference" type="search" maxlength="100" value="${esc(qget(query, "reference"))}" placeholder="APP- 접수번호 전체 또는 일부"></label>
                <button class="button button--dark" type="submit">응모 조회 ${icon("search", 18)}</button>
                <button class="text-link" type="reset">초기화</button>
            </form>
            <div data-event-results tabindex="-1">${eventApplicationResults(query)}</div>
        </section>`;
}

function newsPage(path, q) {
    let body;
    const n = NOTICES.find((n) => path === "/news/notices/" + n.id);
    const event = EVENTS.find((e) => path === "/news/events/" + e.id);
    if (n)
        body = `<article class="info-article notice-article"><div class="article-meta"><span>${esc(n.category)}</span><time datetime="${n.date}">${formatDate(n.date)}</time></div><p class="info-lead">${esc(n.body)}</p>${facts(n.details)}${
            n.id === "recruit"
                ? section(
                        "RECRUITMENT",
                        "관객과 가장 가까운 곳에서",
                        `<p>공연장 안내원은 티켓 확인, 객석 안내, 관객 응대와 안전한 관람 환경 조성을 지원합니다. 공연 운영 특성을 이해하고 관객에게 정확하고 친절하게 정보를 전달하는 역할입니다.</p>${numbered(
                            [
                                [
                                    "서류 확인",
                                    "지원 자격, 근무 일정, 제출 서류를 실제 공고에서 확인합니다.",
                                ],
                                [
                                    "전형 안내",
                                    "서류 검토와 면접 등 공고에 명시된 전형 절차에 참여합니다.",
                                ],
                                [
                                    "결과 확인",
                                    "공식 채용 채널에 게시되는 합격 및 후속 안내를 확인합니다.",
                                ],
                            ],
                        )}<div class="info-actions">${button("채용 지원서 작성", "/news/notices/recruit/apply", "yellow")}${download("recruit", "지원 준비 체크리스트")}</div>`,
                    )
                : n.id === "rental-2027"
                    ? section(
                            "APPLICATION",
                            "접수 전 확인사항",
                            `<p>공간의 성격, 대관 기간 및 심사 기준을 확인해 주세요. 희망 공연일 외에 장치 설치·리허설·철수 일정도 함께 계획해야 합니다.</p><div class="info-actions">${button("대관 일정·신청 안내", "/rental/schedule")}${download("rental-application", "대관신청 준비 양식")}</div>`,
                        )
                    : `<div class="info-actions">${button(n.id === "parking" ? "교통·주차 안내" : n.id === "access" ? "접근성 서비스 안내" : n.id === "academy-notice" ? "교육 프로그램 보기" : "프로그램 확인", n.id === "parking" ? "/visit/directions" : n.id === "access" ? "/visit/accessibility" : n.id === "academy-notice" ? "/programs/education" : "/programs")}</div>`
        }${demo()}<div class="article-back">${link("공지사항 목록", "/news/notices")}</div></article>`;
    else if (event)
        body = `<div class="event-detail-banner ${event.color}"><span class="eyebrow">${esc(event.tag)}</span><h2>${esc(event.subtitle)}</h2><p>${esc(event.period)}</p></div>${section("ABOUT THIS EVENT", "예술로 함께하는 시간", `<p class="info-lead">${esc(event.body)}</p>${numbered(event.steps)}${note("이벤트 내용은 시연용이며 실제 응모, 경품 지급, 당첨자 선정은 진행되지 않습니다. 참여 신청과 관심 프로그램 저장은 현재 브라우저에서 체험할 수 있습니다.", "이벤트 체험 안내")}<div class="info-actions">${event.tag === "진행중" ? button("이벤트 참여하기", "/news/events/" + event.id + "/apply", "yellow") : ""}${button("프로그램 둘러보기", "/programs")}${link("당첨자 발표", "/news/events/winners")}${link("이벤트 목록", "/news/events")}</div>`)}`;
    else if (path === "/news")
        body =
            section(
                "LATEST NEWS",
                "지금, 세종의 소식",
                noticeRows(NOTICES.slice(0, 4)) +
                    `<div class="info-actions">${link("공지사항 전체보기", "/news/notices")}</div>`,
            ) +
            section(
                "BE PART OF SEJONG",
                "예술을 더 가까이",
                cards([
                    ["EVENT", "이벤트", "예술과 함께하는 참여의 기회.", "/news/events"],
                    [
                        "NEWSLETTER",
                        "뉴스레터·세종문화N",
                        "새로운 무대와 예술가의 이야기를 만나보세요.",
                        "/news/newsletter",
                    ],
                    [
                        "MEMBERSHIP",
                        "멤버십",
                        "더 자주, 더 가까이 만나는 세종.",
                        "/news/membership",
                    ],
                    [
                        "GOODS",
                        "세종 굿즈",
                        "무대의 기억을 일상으로 가져오세요.",
                        "/news/goods",
                    ],
                ]),
            );
    else if (path === "/news/notices") {
        const cat = qget(q, "category", "전체"),
            search = qget(q, "search");
        const results = NOTICES.filter(
            (n) =>
                (cat === "전체" || n.category === cat) &&
                (n.title + n.body).includes(search),
        );
        body = `<form class="info-search" data-info-search><label class="sr-only" for="notice-search">공지사항 검색</label><input id="notice-search" name="search" type="search" value="${esc(search)}" placeholder="찾으시는 소식을 검색해 보세요"><button class="button button--dark" type="submit">${icon("search", 18)} 검색</button></form><nav class="info-chips" aria-label="공지사항 분류">${["전체", "공지", "티켓오픈", "대관공고", "채용", "교육"].map((c) => `<a href="${href(`/news/notices?category=${encodeURIComponent(c)}&search=${encodeURIComponent(search)}`)}"${c === cat ? ' aria-current="page"' : ""}>${esc(c)}</a>`).join("")}</nav><p class="info-result-count">총 <strong>${results.length}</strong>건</p>${results.length ? noticeRows(results) : emptyState("검색 결과가 없습니다", "분류 또는 검색어를 변경해 주세요.", "/news/notices", "전체 소식 보기")}${demo()}`;
    } else if (path === "/news/events") {
        const status = qget(q, "status", "진행중");
        body =
            tabs(
                [
                    ["진행중", "/news/events?status=진행중"],
                    ["종료", "/news/events?status=종료"],
                    ["당첨자 발표", "/news/events/winners"],
                ],
                path,
                `?status=${status}`,
            ) +
            eventCards(EVENTS.filter((e) => e.tag === status)) +
            demo();
    } else if (path === "/news/events/winners")
        body = eventParticipation(q);
    else if (path === "/news/newsletter")
        body = `<div class="newsletter-intro"><div><h2>당신의 일상에<br>예술 한 통.</h2><p>새로운 공연 소식, 예술가의 이야기,<br>놓치기 아쉬운 순간을 가장 가까이에서.</p></div><div class="newsletter-envelope" aria-hidden="true"><span>SEJONG<br>LETTER.</span>${icon("diagonal", 48)}</div></div><section class="newsletter-subscribe"><h2>뉴스레터 구독 체험</h2><p>이메일 주소는 저장하지 않습니다. 구독 동의 상태만 현재 브라우저에 저장되며 실제 메일은 발송되지 않습니다.</p><form data-newsletter><label class="form-field">이메일 주소<input id="newsletter-email" name="email" type="email" autocomplete="email" placeholder="name@example.com" required maxlength="254"></label><label class="newsletter-consent"><input type="checkbox" name="consent" required> 구독 체험을 위한 이메일 입력과 로컬 동의 상태 저장에 동의합니다.</label><div class="info-actions"><button class="button button--yellow" type="submit">구독 체험하기 ${icon("arrow", 18)}</button><button type="button" class="text-link" data-newsletter-cancel>구독 체험 해지</button></div><p class="newsletter-result" data-newsletter-result role="status">${readStore("newsletter-consent", false) ? "이 브라우저에서 구독 체험에 동의한 상태입니다." : ""}</p></form></section>${section(
            "READ THE STORIES",
            "세종의 이야기를 읽어보세요",
            cards([
                [
                    "ARCHIVE",
                    "뉴스레터 아카이브",
                    "지난 계절의 소식과 추천 프로그램.",
                    "/news/newsletter/archive",
                ],
                [
                    "MAGAZINE",
                    "세종문화N",
                    "무대와 사람, 문화예술의 깊은 이야기.",
                    "/news/magazine",
                ],
            ]),
        )}`;
    else if (path === "/news/newsletter/archive" || path === "/news/magazine") {
        const a = ARTICLES.find((a) => a[0] === qget(q, "issue"));
        body = a
            ? articleDetail(a)
            : articleList(path) +
                note(
                    "아카이브 표지와 기사는 리뉴얼 경험을 위한 창작 예시입니다. 공식 뉴스레터와 세종문화N 발행물은 공식 홈페이지를 확인해 주세요.",
                    "발행물 안내",
                );
    } else if (path === "/news/membership")
        body = `<div class="membership-hero"><h2>좋아하는 예술을<br>더 가까이, 더 자주.</h2><p>새로운 취향을 발견하고,<br>기다리던 무대와의 만남을 이어가세요.</p>${button("멤버십 가입 체험", "/news/membership/join", "yellow")}<div class="membership-card" aria-hidden="true">SEJONG<br><b>MEMBER.</b><span>ART IN YOUR EVERYDAY</span></div></div>${section("MEMBER BENEFITS", "당신의 관람을 넓히는 혜택", membershipBenefits() + `<div class="info-actions">${link("멤버십 혜택 자세히", "/news/membership/benefits")}</div>`)}${demo()}`;
    else if (path === "/news/membership/benefits")
        body =
            section(
                "MORE THAN A TICKET",
                "멤버십 혜택 한눈에 보기",
                membershipBenefits(),
            ) +
            section(
                "HOW TO USE",
                "혜택 이용 전에 확인하세요",
                numbered([
                    [
                        "회원 정보 확인",
                        "혜택 대상과 회원 등급을 확인한 후 프로그램을 선택하세요.",
                    ],
                    [
                        "프로그램별 조건 확인",
                        "할인율, 적용 좌석, 매수 제한과 중복 할인 가능 여부는 작품마다 다릅니다.",
                    ],
                    [
                        "할인 증빙 준비",
                        "필요한 경우 본인 확인과 증빙 자료를 준비해 주세요.",
                    ],
                ]),
            ) +
            note(
                "이 사이트에서는 결제나 실제 멤버십 발급을 진행하지 않습니다. 가입 체험은 브라우저 안에서만 저장됩니다.",
            ) +
            button("멤버십 가입 체험", "/news/membership/join", "yellow");
    else return null;
    return wrap(path, body);
}

const aboutNav = (path) =>
    tabs(
        [
            ["인사말", "/about/introduction/greeting"],
            ["걸어온 역사", "/about/introduction/history"],
            ["조직도", "/about/introduction/organization"],
            ["CI 소개", "/about/introduction/ci"],
        ],
        path,
    );
const esgNav = (path) =>
    tabs(
        [
            ["ESG 비전", "/about/esg"],
            ["환경", "/about/esg/environment"],
            ["사회", "/about/esg/social"],
            ["거버넌스", "/about/esg/governance"],
        ],
        path,
    );
function companyDetail(c) {
    const related = PROGRAMS.filter((p) => p.genre === c.genre);
    return `<div class="company-hero"><h2>${esc(c.description)}</h2><span class="company-letter" aria-hidden="true">${esc(c.genre.slice(0, 1))}</span></div>${section(
        "OUR ART",
        "서울의 예술, 오늘의 무대",
        `<p class="info-lead">${esc(c.name)}은 ${esc(c.genre)}의 풍부한 표현을 바탕으로 예술가와 관객, 전통과 동시대를 잇는 무대를 만들어갑니다.</p><p>작품을 깊이 탐구하는 창작 활동과 다양한 관객을 만나는 공연을 통해, 서울의 문화예술이 가진 가능성을 펼칩니다. 익숙한 장르의 새로운 매력을 발견하고 예술단의 다음 무대를 만나보세요.</p>${facts(
            [
                ["예술 분야", c.genre],
                ["주요 활동", "정기 공연 · 창작 및 레퍼토리 공연 · 시민과의 만남"],
                ["공연 안내", "아래 프로그램 또는 공연 목록에서 일정과 상세 내용 확인"],
            ],
        )}`,
    )}${section("ON STAGE", "관련 프로그램", related.length ? `<div class="info-program-grid">${related.map(programCard).join("")}</div>` : cards([["PROGRAMS", "다음 무대를 만나보세요", "공연 목록에서 새로운 프로그램을 확인하세요.", "/programs/performance"]]))}<div class="info-actions">${link("서울시예술단 전체보기", "/about/companies")}</div>`;
}
// [공개자료 열람·다운로드 / Prototype document library]
// 실제 사이트 카탈로그와 이용 안내를 공개하며 공식 공시나 재무 실적으로 표시하지 않습니다.
// Publish this site's catalog and guidance without implying official disclosure or financial results.
function disclosureDocuments() {
    return [
        {
            id: "prior", section: "information", category: "기관·이용", title: "이용정보 목록",
            description: "이 사이트에서 확인할 수 있는 공간·방문·기관 안내를 한 목록으로 읽습니다.",
            source: "이 사이트의 등록 페이지 목록", scope: "리뉴얼 시연용 안내 목록 · 공식 사전정보공표 자료가 아닙니다.",
            columns: ["안내 분야", "자료명", "내부 주소"],
            rows: PAGES.filter((item) => ["visit", "about"].includes(item.group) && !item.path.endsWith("apply"))
                .map((item) => [item.group === "visit" ? "방문 안내" : "기관 안내", item.title, "#" + item.path]),
            related: ["전체 페이지 보기", "/sitemap"],
        },
        {
            id: "contracts", section: "information", category: "기관·이용", title: "대관 계약 준비 자료",
            description: "대관 단계별 확인 사항과 비용 협의 항목을 정리한 준비 자료입니다.",
            source: "이 사이트의 대관절차·대관요금 안내", scope: "대관 준비용 설명 자료 · 실제 계약 내역이나 확정 견적이 아닙니다.",
            columns: ["단계", "확인할 내용", "준비 항목"],
            rows: [
                ["신청", "공간과 희망 일정", "행사 계획·신청 단체·준비 및 철수 일정"],
                ["심사", "공간 적합성·실행 가능성", "작품 계획·참여진·운영 및 안전 계획"],
                ["계약", "승인 범위와 사용 조건", "사용 기간·기본 대관료·변경 및 취소 조건"],
                ["기술 협의", "장비·인력·작업 시간", "무대·조명·음향·추가 서비스"],
                ["정산", "실제 사용 범위 확인", "시설 원상 복구·추가 사용 내역"],
            ], related: ["대관절차 자세히", "/rental/process"],
        },
        {
            id: "rules", section: "information", category: "기관·이용", title: "관람 준비 안내",
            description: "관람 전 확인할 연령, 입장, 촬영, 편의 및 접근성 안내를 모았습니다.",
            source: "이 사이트의 관람 유의사항·접근성 안내", scope: "관람 준비용 요약 · 기관의 공식 규정 원문이 아닙니다.",
            columns: ["구분", "관람 전 확인 사항"],
            rows: [
                ["관람 연령", "프로그램 상세에 표시된 연령과 동반 관람 조건 확인"],
                ["입장", "티켓 확인과 이동 시간을 고려해 도착하고 지연 입장 안내 확인"],
                ["촬영", "작품별 촬영·녹음 허용 범위와 현장 안내 확인"],
                ["객석 이용", "음식물 반입과 휴대전화 이용 안내 확인"],
                ["이동 지원", "휠체어석·동반인 좌석과 승강기·무단차 이동 경로 문의"],
                ["편의시설", "물품보관·수유 공간·보조기기 이용 조건 확인"],
            ], related: ["관람 유의사항", "/visit/etiquette"],
        },
        {
            id: "open-data", section: "information", category: "공간", title: "공간 안내 데이터",
            description: "공간명, 분류, 소개 규모와 주요 용도를 표와 CSV로 확인합니다.",
            source: "이 사이트의 공간 카탈로그", scope: "리뉴얼 시연용 공간 데이터 · 실제 운영 현황을 보장하지 않습니다.",
            columns: ["공간명", "분류", "소개 규모", "주요 용도"],
            rows: VENUES.map((item) => [item.name, item.kind, item.capacity, item.area]),
            related: ["공간별 상세 안내", "/visit/spaces"],
        },
        {
            id: "operations", section: "management", category: "프로그램", title: "프로그램 운영 목록",
            description: "공연·전시·교육의 이름, 일정, 장소를 현재 카탈로그 기준으로 살펴봅니다.",
            source: "이 사이트의 프로그램 카탈로그", scope: "시연용 프로그램 일정 · 실제 사업 실적이나 확정 일정이 아닙니다.",
            columns: ["프로그램", "분류", "시작일", "종료일", "장소"],
            rows: PROGRAMS.map((item) => [item.title, item.category, item.start, item.end, item.venue]),
            related: ["프로그램 둘러보기", "/programs"],
        },
        {
            id: "finance", section: "management", category: "프로그램", title: "프로그램 기준 요금",
            description: "예매 체험에서 사용하는 프로그램별 기본 금액을 확인하고 내려받습니다.",
            source: "이 사이트의 프로그램별 기본 가격 데이터", scope: "1인 기준 시연 금액 · 기관의 예산·매출·결산 실적이 아닙니다.",
            columns: ["프로그램", "분류", "기본 금액 (원)", "단위"],
            rows: PROGRAMS.map((item) => [item.title, item.category, String(item.price), "1인 · 시연용"]),
            related: ["티켓 가격·예매 안내", "/programs/booking-guide"],
        },
        {
            id: "organization", section: "management", category: "기관·이용", title: "예술단 소개 목록",
            description: "소개된 예술단의 이름, 예술 분야와 소개 문구를 확인합니다.",
            source: "이 사이트의 서울시예술단 카탈로그", scope: "리뉴얼 소개 자료 · 직원 수·보수·현행 직제에 대한 인사 공시가 아닙니다.",
            columns: ["예술단", "예술 분야", "소개"],
            rows: COMPANIES.map((item) => [item.name, item.genre, item.description]),
            related: ["서울시예술단 보기", "/about/companies"],
        },
        {
            id: "evaluation", section: "management", category: "기관·이용", title: "이용 준비 점검 자료",
            description: "관람과 신청을 준비할 때 확인할 정보와 해당 화면을 연결합니다.",
            source: "이 사이트의 관람·신청 안내", scope: "이용 준비를 위한 점검 자료 · 감사 결과나 공인 평가 점수가 아닙니다.",
            columns: ["점검 분야", "확인할 내용", "내부 주소"],
            rows: [
                ["관람 준비", "작품별 연령·입장·촬영 안내", "#/visit/etiquette"],
                ["접근성", "좌석과 이동 지원 안내", "#/visit/accessibility"],
                ["신청 확인", "이 브라우저에 저장한 신청과 철회 상태", "#/account/applications"],
                ["개인정보", "체험 저장 정보와 삭제 안내", "#/policy/privacy"],
                ["개선 의견", "문의·윤리경영 의견 작성", "#/about/disclosure/ethics"],
            ], related: ["고객지원", "/visit/support"],
        },
    ];
}

function disclosureList(query, management) {
    const path = management ? "/about/disclosure/management" : "/about/disclosure";
    const search = qget(query, "search").trim().toLocaleLowerCase();
    const category = ["프로그램", "공간", "기관·이용"].includes(qget(query, "category")) ? qget(query, "category") : "";
    const records = disclosureDocuments().filter((item) => item.section === (management ? "management" : "information")
        && (!category || item.category === category)
        && (!search || [item.title, item.description, ...item.rows.flat()].join(" ").toLocaleLowerCase().includes(search)));
    return `<p class="info-result-count" role="status">열람 가능한 시연 자료 <strong>${records.length}</strong>건</p>
        ${records.length ? `<div class="disclosure-record-list">${records.map((item) => `<article data-motion-key="document-${item.id}">
            <a href="${href(path + "?document=" + item.id)}"><div><span class="experience-state">${item.category} · 시연 자료</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><p>${item.rows.length}개 항목 · CSV 제공</p></div>${icon("arrow", 24)}</a>
        </article>`).join("")}</div>` : emptyState("일치하는 자료가 없습니다", "검색어 또는 자료 분야를 바꾸어 주세요.", path, "전체 자료 보기")}`;
}

function disclosure(q, management = false) {
    const path = management ? "/about/disclosure/management" : "/about/disclosure";
    const nav = tabs([
        ["정보공개 자료", "/about/disclosure"], ["경영공시 자료", "/about/disclosure/management"],
        ["정보공개 청구", "/about/disclosure/request"], ["부패신고·규제혁신", "/about/disclosure/ethics"],
    ], path);
    const current = disclosureDocuments().find((item) => item.id === q.get("document")
        && item.section === (management ? "management" : "information"));
    if (current) {
        return `${nav}<article class="disclosure-document" id="disclosure-document" aria-labelledby="disclosure-document-heading">
            <span class="experience-state">${current.category} · 시연 자료</span>
            <h2 id="disclosure-document-heading">${esc(current.title)}</h2>
            <p class="info-lead">${esc(current.description)}</p>
            ${facts([["자료 성격", current.scope], ["자료 출처", current.source], ["수록 항목", current.rows.length + "개 · 현재 화면과 동일한 CSV 제공"]])}
            <div class="info-actions"><button class="button button--dark" type="button" data-disclosure-download="${current.id}">${icon("download", 18)} 자료 다운로드 (.csv)</button>${link(...current.related)}</div>
            <p class="experience-table-hint" id="disclosure-table-hint">표를 좌우로 이동하면 모든 항목을 확인할 수 있습니다.</p>
            <div class="disclosure-data" tabindex="0" role="region" aria-describedby="disclosure-table-hint" aria-label="${esc(current.title)} 데이터 표">${table(current.columns, current.rows)}</div>
            <div class="info-actions">${link("자료 목록으로", path)}${button("추가 정보 청구 작성", "/about/disclosure/request?subject=" + encodeURIComponent(current.title + " 관련 문의"))}</div>
        </article>`;
    }
    const category = qget(q, "category");
    return `${nav}<section id="disclosure-library" aria-labelledby="disclosure-library-heading">
        ${q.has("document") ? '<p class="experience-query-notice" role="status">요청한 자료를 찾을 수 없어 자료 목록을 보여드립니다. 아래에서 필요한 자료를 선택해 주세요.</p>' : ""}
        <div class="info-section-heading"><h2 id="disclosure-library-heading">${management ? "운영 자료를 살펴보세요" : "필요한 자료를 찾아보세요"}</h2><p>이 사이트에 수록한 프로그램·공간·이용 안내를 직접 열람하고 내려받을 수 있습니다. 모든 자료는 리뉴얼 시연용이며 공식 공시 원문이 아닙니다.</p></div>
        <form class="experience-filters" data-disclosure-search>
            <label for="disclosure-search">자료 검색<input id="disclosure-search" name="search" type="search" maxlength="100" value="${esc(qget(q, "search"))}" placeholder="자료명 또는 수록 내용"></label>
            <label for="disclosure-category">자료 분야<select id="disclosure-category" name="category"><option value="">전체 분야</option>${["프로그램", "공간", "기관·이용"].map((item) => `<option${item === category ? " selected" : ""}>${item}</option>`).join("")}</select></label>
            <button class="button button--dark" type="submit">자료 검색 ${icon("search", 18)}</button>
            <button class="text-link" type="reset">초기화</button>
        </form>
        <div data-disclosure-results tabindex="-1">${disclosureList(q, management)}</div>
    </section>`;
}

// [표 데이터 파일 생성 / Downloadable table data]
function disclosureCsv(record) {
    const cell = (value) => {
        const text = String(value ?? "");
        const safe = /^[=+@-]/.test(text) ? "'" + text : text;
        return '"' + safe.replaceAll('"', '""') + '"';
    };
    return [["자료명", record.title], ["자료 성격", record.scope], ["출처", record.source], [], record.columns, ...record.rows]
        .map((row) => row.map(cell).join(",")).join("\r\n");
}

function aboutPage(path, q) {
    let body,
        nav = "";
    const c = COMPANIES.find((c) => path === "/about/companies/" + c.id);
    if (c) return wrap(path, companyDetail(c));
    if (path === "/about" || path === "/about/introduction")
        body = `<div class="about-brand"><h2>예술로 연결되는<br>서울의 중심.</h2><p>시대를 담는 무대, 사람을 잇는 예술.<br>세종문화회관은 더 넓은 문화예술의 일상을 만들어갑니다.</p><span class="about-brand-mark" aria-hidden="true">S</span></div>${section(
            "OUR STORY",
            "서울과 함께, 예술과 함께",
            `<p class="info-lead">1978년 문을 연 세종문화회관은 광화문에서 공연과 전시, 예술교육을 통해 시민의 일상과 문화예술을 이어왔습니다.</p>${cards(
                [
                    [
                        "GREETINGS",
                        "인사말",
                        "예술로 열리는 일상을 향한 약속.",
                        "/about/introduction/greeting",
                    ],
                    [
                        "HISTORY",
                        "걸어온 역사",
                        "서울과 함께 쌓아온 문화예술의 시간.",
                        "/about/introduction/history",
                    ],
                    [
                        "ORGANIZATION",
                        "조직도",
                        "무대와 관객을 연결하는 사람들.",
                        "/about/introduction/organization",
                    ],
                    [
                        "IDENTITY",
                        "CI 소개",
                        "이름과 상징에 담긴 세종의 가치.",
                        "/about/introduction/ci",
                    ],
                ],
            )}`,
        )}${section(
            "MORE ABOUT US",
            "세종이 만드는 내일",
            cards([
                [
                    "ARTISTS",
                    "서울시예술단",
                    "서울의 예술, 동시대의 무대.",
                    "/about/companies",
                ],
                [
                    "ESG",
                    "지속가능한 문화예술",
                    "환경과 사회를 생각하는 운영.",
                    "/about/esg",
                ],
                [
                    "DISCLOSURE",
                    "정보공개",
                    "신뢰를 만드는 투명한 정보.",
                    "/about/disclosure",
                ],
                [
                    "SUPPORT",
                    "협력과 후원",
                    "더 많은 만남을 함께 만드는 방법.",
                    "/about/donation",
                ],
            ]),
        )}`;
    else if (path === "/about/introduction/greeting") {
        nav = aboutNav(path);
        body = `<article class="info-article"><h2>누구나 예술을 누리고,<br>예술로 서로를 만나는 곳.</h2><p class="info-lead">세종문화회관을 찾아주신 여러분을 환영합니다.</p><p>광화문에서 시작되는 예술의 만남은 누군가에게는 설레는 첫 관람이고, 누군가에게는 오래 기다린 작품과의 재회입니다. 우리는 그 모든 순간이 풍부하고 편안한 경험이 되기를 바랍니다.</p><p>공연과 전시, 교육을 통해 더 많은 시민이 예술을 가까이에서 누릴 수 있도록, 전통의 깊이와 새로운 표현을 함께 담는 무대를 고민합니다. 예술가에게는 도전의 공간을, 관객에게는 발견의 기회를 제공하는 것이 세종문화회관이 이어갈 역할입니다.</p><p>다양한 사람들의 목소리가 만나는 열린 문화공간으로서 서울의 오늘을 담고 내일의 가능성을 함께 만들어가겠습니다.</p><p class="article-signature">세종문화회관</p>${note("이 글은 기관의 방향을 설명하기 위한 리뉴얼 시연용 소개문이며, 현직 기관장의 공식 인사말을 인용한 글이 아닙니다.", "편집 안내")}</article>`;
    } else if (path === "/about/introduction/history") {
        nav = aboutNav(path);
        body = section(
            "SINCE 1978",
            "서울의 기억 속, 예술의 순간들",
            `<ol class="history-timeline">${[
                [
                    "1978",
                    "세종문화회관 개관",
                    "서울의 중심 광화문에 문화예술을 위한 새로운 무대가 열렸습니다.",
                ],
                [
                    "1999",
                    "재단법인으로 새로운 출발",
                    "재단법인 세종문화회관으로 운영 체계를 전환했습니다.",
                ],
                [
                    "2009",
                    "세종·충무공 이야기",
                    "광화문에서 역사와 문화를 만나는 전시의 장을 넓혔습니다.",
                ],
                [
                    "2018",
                    "세종S씨어터 개관",
                    "다양한 무대 구성을 시도하는 가변형 공연장을 선보였습니다.",
                ],
                [
                    "TODAY",
                    "예술로 열리는 일상",
                    "공연·전시·교육과 예술단 활동으로 시민의 문화예술 경험을 이어갑니다.",
                ],
            ]
                .map(
                    ([year, title, text]) =>
                        `<li><strong>${year}</strong><div><h3>${title}</h3><p>${text}</p></div></li>`,
                )
                .join("")}</ol>`,
        );
    } else if (path === "/about/introduction/organization") {
        nav = aboutNav(path);
        body = section(
            "PEOPLE BEHIND THE STAGE",
            "무대와 관객을 연결하는 사람들",
            `<p class="info-lead">예술 창작에서 안전한 공간 운영까지, 서로 다른 전문성이 하나의 관람 경험을 만듭니다.</p><div class="organization-chart"><div class="org-top">세종문화회관</div><div class="org-branches">${[
                ["공연·전시·교육", "프로그램 기획", "예술단 운영", "시민 참여"],
                ["관객·대외협력", "관람객 서비스", "홍보·마케팅", "협력·후원"],
                ["공간·기술·운영", "무대 기술", "시설·안전관리", "경영 지원"],
            ]
                .map(
                    (r) =>
                        `<div><h3>${r[0]}</h3>${r
                            .slice(1)
                            .map((t) => `<span>${t}</span>`)
                            .join("")}</div>`,
                )
                .join(
                    "",
                )}</div></div>${note("이 도표는 이용자의 이해를 위한 기능 중심 안내도입니다. 현행 공식 직제·부서명·담당자 명단은 공식 기관 안내를 확인해 주세요.", "조직 안내")}${link("업무별 문의하기", "/visit/support/inquiry")}`,
        );
    } else if (path === "/about/introduction/ci") {
        nav = aboutNav(path);
        body = section(
            "IDENTITY",
            "이름에 담긴 문화의 중심",
            `<div class="ci-specimen"><img src="assets/images/sejong-wordmark.png" width="236" height="43" alt="세종문화회관"><small>SEJONG CENTER FOR THE PERFORMING ARTS</small></div>
            <p class="info-lead">하늘과 땅, 그리고 사람. 천지인 세 가지 색으로 열린 문화예술을 이야기합니다.</p>
            <p>검정과 흰색을 기본 바탕으로, 천(天)은 하늘색, 지(地)는 황토색, 인(人)은 노란색을 사용합니다. 세 채널은 서로 독립적으로 바뀔 수 있어, 예술을 만나는 관람객의 다양성을 표현합니다.</p>
            <div class="identity-palette">
                <article class="identity-swatch identity-swatch-black"><div aria-hidden="true"></div><h3>검정 · Main</h3><p>RGB 0 · 0 · 0<br>CMYK 0 · 0 · 0 · 100<br><code>#000000</code></p></article>
                <article class="identity-swatch identity-swatch-sky"><div aria-hidden="true"></div><h3>천 天 · 하늘색</h3><p>PANTONE 305 C<br>RGB 84 · 200 · 232<br>CMYK 60 · 0 · 7.5 · 0<br><code>#54C8E8</code></p></article>
                <article class="identity-swatch identity-swatch-earth"><div aria-hidden="true"></div><h3>지 地 · 황토색</h3><p>PANTONE 7414 C<br>RGB 195 · 109 · 21<br>CMYK 30 · 67.5 · 100 · 0<br><code>#C36D15</code></p></article>
                <article class="identity-swatch identity-swatch-human"><div aria-hidden="true"></div><h3>인 人 · 노란색</h3><p>PANTONE 803 C<br>RGB 255 · 232 · 0<br>CMYK 0 · 5 · 100 · 0<br><code>#FFE800</code></p></article>
                <article class="identity-swatch identity-swatch-white"><div aria-hidden="true"></div><h3>흰색 · Background</h3><p>RGB 255 · 255 · 255<br>CMYK 0 · 0 · 0 · 0<br><code>#FFFFFF</code></p></article>
            </div>
            ${note("이 화면은 제공받은 컬러 아이덴티티를 바탕으로 구성한 비공식 리뉴얼입니다. 공식 로고 사용과 원본 파일은 기관의 사용 규정을 확인해 주세요.", "CI 사용 안내")}${download("ci", "리뉴얼 시각 가이드 (.txt)")}`,
        );
    } else if (path === "/about/companies")
        body = `<p class="info-lead">전통과 동시대, 장르와 경계를 넘어.<br>서울의 예술을 만들어가는 일곱 개의 목소리.</p><div class="company-list">${COMPANIES.map((c, i) => `<a href="${href("/about/companies/" + c.id)}"><span class="company-index">0${i + 1}</span><div><span class="eyebrow">${esc(c.genre)}</span><h2>${esc(c.name)}</h2><p>${esc(c.description)}</p></div>${icon("diagonal", 28)}</a>`).join("")}</div>`;
    else if (path.startsWith("/about/esg")) {
        nav = esgNav(path);
        if (path === "/about/esg")
            body = `<div class="esg-statement"><h2>예술이 지속되는 미래,<br>함께 만드는 변화.</h2><p>환경을 생각하고, 모든 사람에게 열려 있으며,<br>신뢰로 운영하는 문화예술 공간을 지향합니다.</p></div>${cards(
                [
                    [
                        "ENVIRONMENT",
                        "환경경영",
                        "공간 운영에서 줄이고, 다시 쓰고, 오래 사용하는 방법.",
                        "/about/esg/environment",
                    ],
                    [
                        "SOCIAL",
                        "사회공헌",
                        "누구나 참여할 수 있는 문화예술의 기회.",
                        "/about/esg/social",
                    ],
                    [
                        "GOVERNANCE",
                        "윤리경영",
                        "투명하고 책임 있는 기관 운영.",
                        "/about/esg/governance",
                    ],
                ],
            )}`;
        else if (path === "/about/esg/environment")
            body =
                section(
                    "E / ENVIRONMENT",
                    "좋은 무대를 오래 이어가기 위해",
                    numbered([
                        [
                            "자원 사용을 줄이는 운영",
                            "디지털 안내와 종이 사용 절감, 적정 에너지 사용 등 일상 운영의 변화를 생각합니다.",
                        ],
                        [
                            "다시 쓰는 제작 문화",
                            "공연·전시 제작 과정에서 자재의 재사용과 폐기물 분리, 장비의 지속적인 관리를 고려합니다.",
                        ],
                        [
                            "관객과 함께하는 실천",
                            "대중교통 이용, 올바른 분리배출, 개인 물품 활용으로 관람의 환경 영향을 줄이는 데 참여해 주세요.",
                        ],
                    ]),
                ) +
                cards([
                    [
                        "VISIT GREEN",
                        "대중교통으로 오세요",
                        "광화문에서 시작하는 가벼운 발걸음.",
                        "/visit/directions",
                    ],
                    [
                        "RENTAL GUIDE",
                        "제작 단계부터 함께",
                        "안전과 환경을 고려한 무대 기술 협의.",
                        "/rental/equipment",
                    ],
                ]);
        else if (path === "/about/esg/social")
            body =
                section(
                    "S / SOCIAL",
                    "예술을 누릴 기회를 더 넓게",
                    numbered([
                        [
                            "문화예술 접근성",
                            "관람 환경과 정보 접근성을 개선하고 다양한 관객이 예술을 경험할 수 있는 길을 고민합니다.",
                        ],
                        [
                            "시민과의 만남",
                            "공연과 교육, 열린 프로그램을 통해 문화예술이 생활 가까이에 머물도록 합니다.",
                        ],
                        [
                            "예술가와의 동행",
                            "새로운 창작과 예술적 실험을 위한 무대, 지속적인 활동을 이어갈 기회를 만들어갑니다.",
                        ],
                    ]),
                ) +
                cards([
                    [
                        "ART FOR EVERYONE",
                        "누구나 프로그램",
                        "열린 문화예술의 만남을 확인하세요.",
                        "/programs/season/everyone",
                    ],
                    [
                        "ACCESSIBILITY",
                        "장애인 이용안내",
                        "관람 지원과 이동 동선을 살펴보세요.",
                        "/visit/accessibility",
                    ],
                    [
                        "ARTS EDUCATION",
                        "꿈의숲 아트센터",
                        "배움과 참여로 함께 자라는 예술.",
                        "/about/arts-center",
                    ],
                ]);
        else if (path === "/about/esg/governance")
            body =
                section(
                    "G / GOVERNANCE",
                    "신뢰 위에 세우는 예술의 미래",
                    numbered([
                        [
                            "투명한 정보",
                            "공개 항목과 기관 운영 정보를 이해하기 쉽게 전달하는 것을 지향합니다.",
                        ],
                        [
                            "공정한 절차",
                            "계약과 대관, 채용 등 각 업무의 기준과 절차를 확인할 수 있도록 안내합니다.",
                        ],
                        [
                            "함께 지키는 윤리",
                            "부당한 관행과 불편 사항을 개선하기 위한 의견 접수 경로를 제공합니다.",
                        ],
                    ]),
                ) +
                cards([
                    [
                        "DISCLOSURE",
                        "정보공개",
                        "공개 자료와 경영공시 항목을 확인하세요.",
                        "/about/disclosure",
                    ],
                    [
                        "ETHICS",
                        "부패신고·규제혁신센터",
                        "기관 운영 개선을 위한 목소리를 남겨주세요.",
                        "/about/disclosure/ethics",
                    ],
                ]);
        else return null;
        body += note(
            "이 내용은 ESG 방향을 소개하는 설명입니다. 정량 실적과 공인 인증을 주장하지 않으며, 실제 추진 현황은 공식 공개자료를 확인해 주세요.",
            "ESG 정보 안내",
        );
    } else if (
        path === "/about/disclosure" ||
        path === "/about/disclosure/management"
    )
        body = disclosure(q, path.endsWith("management"));
    else if (path === "/about/partners")
        body = `<div class="info-statement"><h2>같은 가치를 만나,<br>더 큰 가능성으로.</h2><p>예술의 힘을 믿는 기업과 기관, 지역사회와 함께<br>새로운 문화예술 경험을 만들어갑니다.</p></div>${section(
            "WAYS TO PARTNER",
            "함께할 수 있는 방법",
            cards([
                [
                    "PROGRAM",
                    "프로그램 협력",
                    "공연·전시·교육의 기획과 운영을 함께 지원합니다.",
                    "/about/partners/apply?type=program",
                ],
                [
                    "BRAND",
                    "브랜드 협찬",
                    "서로의 가치에 맞는 문화예술 경험을 설계합니다.",
                    "/about/partners/apply?type=brand",
                ],
                [
                    "COMMUNITY",
                    "공익·문화나눔",
                    "더 많은 시민에게 예술의 기회가 닿도록 연결합니다.",
                    "/about/partners/apply?type=community",
                ],
            ]),
        )}${section(
            "LET’S BEGIN",
            "제안부터 실행까지",
            numbered([
                [
                    "협력 제안",
                    "협력 목적, 대상, 예상 일정과 지원 형태를 정리해 주세요.",
                ],
                [
                    "적합성 검토·협의",
                    "기관과 프로그램의 방향, 실행 조건과 역할을 함께 검토합니다.",
                ],
                [
                    "실행·결과 공유",
                    "합의한 범위에 따라 프로젝트를 진행하고 성과를 함께 돌아봅니다.",
                ],
            ]),
        )}<div class="info-actions">${button("협력·협찬 제안하기", "/about/partners/apply", "yellow")}${download("partnership", "협력 제안 준비 양식")}</div>`;
    else if (path === "/about/donation")
        body = `<div class="donation-hero"><h2>당신의 마음이<br>다음 무대를 엽니다.</h2><p>예술가의 새로운 시도, 누군가의 첫 공연,<br>우리 모두의 문화예술을 응원하는 방법.</p>${button("후원 참여 체험", "/about/donation/apply", "yellow")}</div>${section(
            "THE IMPACT OF GIVING",
            "후원이 이어가는 가치",
            cards([
                [
                    "CREATION",
                    "새로운 창작",
                    "예술가가 새로운 작품과 표현을 탐색하도록 응원합니다.",
                    "/about/companies",
                ],
                [
                    "ACCESS",
                    "문화예술의 기회",
                    "더 많은 시민이 예술과 만날 기회를 넓힙니다.",
                    "/programs/season/everyone",
                ],
                [
                    "EDUCATION",
                    "배움과 성장",
                    "예술을 배우며 자라는 다음 세대를 함께 응원합니다.",
                    "/about/arts-center",
                ],
            ]),
        )}${section(
            "HOW TO GIVE",
            "참여 방법을 살펴보세요",
            facts([
                ["개인 후원", "관심 분야와 참여 방식에 맞춰 마음을 전합니다."],
                ["기업·기관 후원", "문화예술의 가치와 사회적 기여를 함께 설계합니다."],
                ["후원 상담", "사용 목적, 참여 조건, 관련 안내는 담당자와 확인합니다."],
            ]),
        )}${note("후원 참여 화면은 신청 과정을 체험하는 양식입니다. 실제 기부금 결제·수납·영수증 발급은 진행되지 않습니다.", "후원 체험 안내")}`;
    else if (path === "/about/arts-center")
        body = section(
            "ART GROWS WITH US",
            "예술로 배우고 함께 자라는 곳",
            `<p class="info-lead">꿈의숲 아트센터는 예술을 통한 배움과 참여, 나눔의 가치를 소개하는 공간입니다.</p><p>음악과 다양한 예술 활동을 통해 각자의 가능성을 발견하고, 서로의 소리를 듣고 함께 표현하는 경험을 나눕니다. 프로그램별 참여 대상과 모집 조건을 확인해 주세요.</p>${cards(
                [
                    [
                        "ORCHESTRA",
                        "누구나 꿈나무오케스트라",
                        "함께 연주하며 성장하는 예술교육.",
                        "/programs/season/orchestra",
                    ],
                    [
                        "EDUCATION",
                        "예술교육 프로그램",
                        "새로운 배움과 발견을 시작하세요.",
                        "/programs/education",
                    ],
                    [
                        "SUPPORT",
                        "예술교육 응원하기",
                        "더 많은 배움의 기회를 함께 만드세요.",
                        "/about/donation",
                    ],
                ],
            )}${note("실제 시설 운영 및 교육 모집 현황은 공식 안내를 확인해 주세요. 이 페이지는 제공된 정보구조에 따른 시연용 소개입니다.")}`,
        );
    else return null;
    return wrap(path, body, { nav });
}

export function renderPages(path, query = new URLSearchParams()) {
    const overview = overviewPage(path);
    if (overview) return overview;
    const q =
        query instanceof URLSearchParams ? query : new URLSearchParams(query);
    if (path.startsWith("/rental")) return rentalPage(path, q);
    if (path.startsWith("/visit")) return visitPage(path, q);
    if (path.startsWith("/news")) return newsPage(path, q);
    if (path.startsWith("/about")) return aboutPage(path, q);
    return null;
}

function templateText(id) {
    const disclaimer =
        "세종문화회관 리뉴얼 시연용 준비 양식\n공식 제출 서식이 아닙니다. 실제 제출 전 공고와 담당자의 안내를 확인하세요.\n\n";
    const templates = {
        "rental-application":
            "대관 신청 준비서\n\n신청 단체/성명: \n행사명: \n행사 유형: \n희망 공간: \n준비 일시: \n공연/전시 일시: \n철수 일시: \n기획 의도: \n주요 참여진: \n예상 관객: \n운영/안전 담당자: \n필요 장비: \n첨부 예정 자료: \n",
        safety:
            "안전관리 점검표\n\n[ ] 설치/철수 작업 책임자 지정\n[ ] 비상 연락망 및 대피 동선 확인\n[ ] 세트 방염 및 구조물 안전 확인\n[ ] 전력/케이블/장비 설치 계획 확인\n[ ] 관객 동선 및 휠체어 이동 경로 확보\n[ ] 작업 인력과 보호장비 확인\n[ ] 특수효과 사용 사전 협의\n",
        technical:
            "기술 회의 체크리스트\n\n행사명: \n공간: \n담당자: \n\n무대 도면/세트/반입 계획: \n조명 도면/장비/전력: \n음향 입출력/마이크/재생 파일: \n영상 해상도/연결 방식: \n설치/리허설/철수 시간: \n악기/조율: \n특수효과 및 안전계획: \n",
        budget:
            "대관 예산 점검표\n\n공간 사용료: \n준비/리허설 사용료: \n철수 사용료: \n무대/조명/음향 장비: \n기술 인력: \n하우스 운영: \n안전관리/보험: \n추가 서비스: \n부가세 적용 여부: \n취소/변경 조건: \n\n합계: \n확인한 공고/규정/견적 날짜: \n",
        recruit:
            "채용 지원 준비 체크리스트\n\n[ ] 실제 채용 공고 및 지원 기간 확인\n[ ] 지원 자격과 근무 일정 확인\n[ ] 지정 지원서 및 동의 서류 확인\n[ ] 관련 경력/활동 내용 정리\n[ ] 제출 파일명/형식 확인\n[ ] 공식 접수처와 접수 완료 여부 확인\n\n이 파일로는 채용 지원이 이루어지지 않습니다.\n",
        partnership:
            "협력 제안 준비서\n\n기관/기업명: \n협력 목적: \n관심 프로그램/분야: \n제안 형태(프로그램/브랜드/공익): \n희망 일정: \n지원 가능 자원: \n기대 성과: \n협의가 필요한 사항: \n",
        ci: "리뉴얼 시각 가이드\n\n본 문서는 제공받은 컬러 아이덴티티를 반영한 비공식 리뉴얼 시연 안내입니다.\n공식 CI 규정으로 사용할 수 없습니다.\n\n기본 색상: BLACK #000000 / WHITE #FFFFFF\n천(天): SKY #54C8E8 / RGB 84 200 232 / PANTONE 305 C\n지(地): EARTH #C36D15 / RGB 195 109 21 / PANTONE 7414 C\n인(人): HUMAN #FFE800 / RGB 255 232 0 / PANTONE 803 C\n명칭: 세종문화회관\n영문: SEJONG CENTER FOR THE PERFORMING ARTS\n원칙: 높은 대비, 명확한 정보 위계, 여유 있는 여백, 독립적으로 확장할 수 있는 천지인 세 채널\n공식 로고 사용은 기관의 승인과 공식 원본 파일을 확인하세요.\n",
    };
    if (id.startsWith("venue-")) {
        const v = VENUES.find((v) => v.id === id.slice(6));
        return (
            disclaimer +
            `${v?.name || "공간"} 기술 협의 체크리스트\n\n` +
            templates.technical
        );
    }
    if (id.startsWith("disclosure-"))
        return (
            disclaimer +
            "공개자료 확인 체크리스트\n\n공개 항목: \n자료 제목: \n기준일/보고 기간: \n공개 부서: \n공식 원본 주소: \n산정 기준: \n추가 확인 사항: \n정보공개 청구 필요 여부: \n"
        );
    return disclaimer + (templates[id] || templates.technical);
}

export function bindPages(root, path, query = new URLSearchParams()) {
    const q =
        query instanceof URLSearchParams ? query : new URLSearchParams(query);
    // [내부 안내와 자료 검색의 상태 전환 / In-page guide and library state changes]
    const updateExperience = (form, target, renderer, focusTarget = target, kind = "collection") => {
        const next = new URLSearchParams();
        for (const [name, value] of new FormData(form)) {
            const text = String(value).trim();
            if (text) next.set(name, text);
        }
        history.replaceState(history.state, "", href(path + (next.size ? "?" + next.toString() : "")));
        const container = root.querySelector(target);
        const snapshot = kind === "collection" ? captureLayout(container, "[data-motion-key]") : null;
        cancelMotion(container);
        container.innerHTML = renderer(next);
        root.querySelector(focusTarget)?.focus({ preventScroll: true });
        if (kind === "route") {
            // [이동 방향의 설명 / Explain the selected travel direction]
            // 개략도의 강조선만 출발지에서 도착지로 그리며 지도와 안내문은 고정합니다.
            // Draw only the schematic route from origin to destination, keeping the map and text still.
            animateFeedback(container.querySelector(".arrival-map-route path"), "route");
            animateFeedback(container.querySelector(".arrival-map-route circle:last-child"), "status");
        } else {
            animateLayout(container, snapshot, "[data-motion-key]");
            const targets = [...container.querySelectorAll(".info-result-count, .empty-state")];
            container.dispatchEvent(new CustomEvent("content:updated", { bubbles: true, detail: { container, targets, kind: "status" } }));
        }
    };
    root.querySelector("[data-arrival-planner]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        updateExperience(event.currentTarget, "[data-arrival-result]", (next) => {
            const { origin, venue } = arrivalSelection(next);
            return arrivalResult(origin, venue);
        }, "#arrival-result-heading", "route");
    });
    for (const [selector, target, renderer] of [
        ["[data-event-lookup]", "[data-event-results]", eventApplicationResults],
        ["[data-disclosure-search]", "[data-disclosure-results]", (next) => disclosureList(next, path.endsWith("management"))],
    ]) {
        const form = root.querySelector(selector);
        form?.addEventListener("submit", (event) => {
            event.preventDefault();
            updateExperience(form, target, renderer);
        });
        form?.addEventListener("reset", (event) => {
            event.preventDefault();
            form.querySelectorAll("input, select").forEach((control) => { control.value = ""; });
            updateExperience(form, target, renderer);
        });
    }
    root.querySelectorAll("[data-disclosure-download]").forEach((control) => {
        control.addEventListener("click", () => {
            const record = disclosureDocuments().find((item) => item.id === control.dataset.disclosureDownload);
            if (!record) return;
            const url = URL.createObjectURL(new Blob(["\uFEFF" + disclosureCsv(record)], { type: "text/csv;charset=utf-8" }));
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `sejong-${record.id}-prototype.csv`;
            document.body.append(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast("화면에 표시된 시연 자료를 CSV로 내려받았습니다.");
        });
    });

    root.querySelectorAll("[data-info-search]").forEach((form) =>
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const next = new URLSearchParams(q);
            const search = new FormData(form).get("search").trim();
            search ? next.set("search", search) : next.delete("search");
            location.hash = href(path + (next.size ? "?" + next.toString() : ""));
        }),
    );
    root
        .querySelector("[data-rental-venue]")
        ?.addEventListener("change", (event) => {
            const next = new URLSearchParams(q);
            next.set("venue", event.target.value);
            next.delete("date");
            location.hash = href(path + "?" + next.toString());
        });
    root.querySelectorAll("[data-rental-month]").forEach((btn) =>
        btn.addEventListener("click", () => {
            const [y, m] = btn.dataset.month.split("-").map(Number);
            const d = new Date(y, m - 1 + Number(btn.dataset.rentalMonth), 1);
            const next = new URLSearchParams(q);
            next.set(
                "month",
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            );
            next.delete("date");
            location.hash = href(path + "?" + next.toString());
        }),
    );
    root.querySelectorAll("[data-download]").forEach((btn) =>
        btn.addEventListener("click", () => {
            const id = btn.dataset.download;
            const url = URL.createObjectURL(
                new Blob(["\uFEFF" + templateText(id)], {
                    type: "text/plain;charset=utf-8",
                }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `sejong-${id}-template.txt`;
            document.body.append(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast("준비용 텍스트 양식을 다운로드했습니다.");
        }),
    );
    root
        .querySelector("[data-newsletter]")
        ?.addEventListener("submit", (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            if (!form.reportValidity()) return;
            const saved = writeStore("newsletter-consent", true);
            root.querySelector("[data-newsletter-result]").textContent =
                "구독 체험을 완료했습니다. " +
                (saved
                    ? "동의 상태가 이 브라우저에 저장되었습니다."
                    : "동의 상태는 현재 세션에서만 유지됩니다.") +
                " 이메일 주소는 저장되지 않으며 실제 메일은 발송되지 않습니다.";
            form.reset();
            animateFeedback(root.querySelector("[data-newsletter-result]"), "status");
            toast("뉴스레터 구독 체험이 완료되었습니다.");
        });
    root
        .querySelector("[data-newsletter-cancel]")
        ?.addEventListener("click", () => {
            writeStore("newsletter-consent", false);
            root.querySelector("[data-newsletter-result]").textContent =
                "구독 체험 동의를 해지했습니다. 이 작업은 실제 뉴스레터 구독에 영향을 주지 않습니다.";
            animateFeedback(root.querySelector("[data-newsletter-result]"), "status");
            toast("구독 체험 동의를 해지했습니다.");
        });
}

// [공간 비교를 위한 자료 / Shared venue information]
// 공간 상세와 비교 화면에서 동일한 장비와 위치 자료를 사용합니다.
// Use the same venue evidence in visit plans and rental comparison.
export { venueTech, venueLocation };
