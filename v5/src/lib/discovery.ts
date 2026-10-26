// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { PAGES, PROGRAMS, VENUES, COMPANIES, NOTICES } from "../data/catalog.ts";

// [목적별 콘텐츠 검색 / Search content by visitor intent]
// 제목·상세 데이터와 동의어를 함께 검색하되 동일한 목적지는 한 번만 반환합니다.
// Search titles, detailed records and synonyms while returning each destination once.
export const SEARCH_KINDS = [
    ["all", "전체"], ["programs", "프로그램"], ["spaces", "공간"],
    ["visit", "이용안내"], ["news", "소식과 혜택"], ["about", "세종문화회관"],
];

const normalize = value => String(value || "").normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
const searchAliases = {
    "/visit/accessibility": "휠체어 장애인 접근성 배리어프리 보조견 유모차",
    "/visit/directions": "찾아오는길 지하철 버스 광화문 교통",
    "/visit/directions/parking": "주차 자동차 차량",
    "/visit/plan": "나의방문계획 일정 동선 여행 준비",
    "/rental/compare": "공간비교 시설비교 정원 규모 장비 대관",
    "/rental/schedule": "가능일 대관공고 대관일정",
    "/account/bookings": "나의예매 예약확인 취소 티켓내역",
    "/news/membership": "회원 멤버십 혜택 할인",
};

function classify(page) {
    if (page.type === "program" || page.group === "programs") return "programs";
    if (page.path.startsWith("/visit/spaces") || page.group === "rental") return "spaces";
    return ["visit", "news", "about"].includes(page.group) ? page.group : "visit";
}

function enrich(page) {
    const program = PROGRAMS.find(item => page.path === "/programs/" + item.id);
    const venue = VENUES.find(item => page.path.endsWith("/" + item.id) && /spaces|venues/.test(page.path));
    const notice = NOTICES.find(item => page.path === "/news/notices/" + item.id);
    const company = COMPANIES.find(item => page.path === "/about/companies/" + item.id);
    const record = program || venue || notice || company;
    return {
        ...page,
        kind: classify(page),
        description: record?.description || notice?.body || page.description || "",
        image: program?.image || venue?.image || "",
        detail: program ? `${program.category} · ${program.venue} · ${program.start} ~ ${program.end}` : venue ? `${venue.kind} · ${venue.capacity}${/^[\d,]+$/.test(venue.capacity) ? "석" : ""}` : notice ? `${notice.category} · ${notice.date}` : "",
        terms: [record ? JSON.stringify(record) : "", searchAliases[page.path], page.eyebrow, page.path].join(" "),
    };
}

export function searchContent(query, kind = "all") {
    const terms = String(query || "").trim().split(/\s+/).map(normalize).filter(Boolean);
    const phrase = normalize(query);
    if (!phrase || !SEARCH_KINDS.some(([id]) => id === kind)) return [];
    return PAGES.filter(page => page.path !== "/" && !/\/apply$|\/checkout$/.test(page.path))
        .map(enrich)
        .filter(item => kind === "all" || item.kind === kind)
        .map(item => {
            const title = normalize(item.title);
            const body = normalize([item.title, item.description, item.terms].join(" "));
            const matches = body.includes(phrase) || terms.every(term => body.includes(term));
            return { ...item, score: !matches ? 0 : title === phrase ? 100 : title.includes(phrase) ? 60 : item.image ? 30 : 10 };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ko"));
}
