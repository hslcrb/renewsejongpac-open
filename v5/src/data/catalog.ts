import type { Program, Venue, Notice, NavItem, PageMeta } from "../../types/sejong.ts";
import { CATALOG_SNAPSHOT } from "../catalog/snapshot.ts";

const page = (path: string, title: string, group: string, description = "", type = "content"): PageMeta => ({
    path,
    title,
    group,
    description,
    type,
    eyebrow:
        ({
            programs: "PROGRAMS",
            rental: "VENUE RENTAL",
            visit: "VISIT SEJONG",
            news: "NEWS & BENEFITS",
            about: "ABOUT SEJONG",
            account: "MY SEJONG",
        } as Record<string, string>)[group] || "SEJONG CENTER",
});

export const NAV: NavItem[] = [
    {
        id: "programs",
        title: "프로그램",
        path: "/programs",
        items: [
            ["공연", "/programs/performance"],
            ["전시", "/programs/exhibition"],
            ["교육", "/programs/education"],
            ["기획·시즌 프로그램", "/programs/season"],
            ["백스테이지 투어", "/programs/tour"],
            ["세종·충무공 이야기", "/programs/history"],
        ],
    },
    {
        id: "rental",
        title: "대관",
        path: "/rental",
        items: [
            ["대관안내", "/rental/guide"],
            ["대관시설", "/rental/venues"],
            ["대관일정", "/rental/schedule"],
            ["대관절차", "/rental/process"],
            ["대관신청", "/rental/apply"],
            ["대관문의", "/rental/contact"],
        ],
    },
    {
        id: "visit",
        title: "이용안내",
        path: "/visit",
        items: [
            ["공간안내", "/visit/spaces"],
            ["오시는 길·주차", "/visit/directions"],
            ["편의시설", "/visit/amenities"],
            ["장애인 이용안내", "/visit/accessibility"],
            ["관람 유의사항", "/visit/etiquette"],
            ["고객지원", "/visit/support"],
        ],
    },
    {
        id: "news",
        title: "소식과 혜택",
        path: "/news",
        items: [
            ["공지사항", "/news/notices"],
            ["이벤트", "/news/events"],
            ["뉴스레터·세종문화N", "/news/newsletter"],
            ["멤버십", "/news/membership"],
            ["세종 굿즈", "/news/goods"],
        ],
    },
    {
        id: "about",
        title: "세종문화회관",
        path: "/about",
        items: [
            ["기관소개", "/about/introduction"],
            ["서울시예술단", "/about/companies"],
            ["ESG 경영", "/about/esg"],
            ["정보공개", "/about/disclosure"],
            ["협력 및 협찬", "/about/partners"],
            ["후원", "/about/donation"],
        ],
    },
];

export const PAGES: PageMeta[] = [
    page("/", "홈", "home", "공연·전시·교육 일정, 예매와 이용 안내", "home"),
    ...NAV.flatMap((n) => [
        page(n.path, n.title, n.id),
        ...n.items.map(([t, p]) => page(p, t, n.id)),
    ]),
    ...[
        ["/programs/booking-guide", "예매안내", "programs"],
        ["/programs/education/apply-guide", "교육 신청안내", "programs"],
        ["/programs/season/sejong", "2026 세종시즌", "programs"],
        ["/programs/season/sync-next", "Sync Next", "programs"],
        ["/programs/season/everyone", "모든 누구나", "programs"],
        ["/programs/season/package", "시즌 패키지", "programs"],
        ["/programs/season/classic", "누구나 클래식", "programs"],
        ["/programs/season/orchestra", "누구나 꿈나무오케스트라", "programs"],
        ["/programs/season/summer", "누구나 세종썸머페스티벌", "programs"],
        ["/rental/guide/fees", "대관요금", "rental"],
        ["/rental/guide/eligibility", "대관 대상 및 기준", "rental"],
        ["/rental/process/documents", "신청서류 및 심사기준", "rental"],
        ["/rental/equipment", "무대 기술·장비 안내", "rental"],
        ["/visit/directions/parking", "주차안내", "visit"],
        ["/visit/amenities/dining", "F&B · 다이닝", "visit"],
        ["/visit/amenities/facilities", "편의시설 위치", "visit"],
        ["/visit/support/faq", "자주 묻는 질문", "visit"],
        ["/visit/support/inquiry", "문의하기", "visit"],
        ["/visit/support/lost", "분실물 안내", "visit"],
        ["/visit/group", "단체관람 안내·신청", "visit"],
        ["/news/events/winners", "당첨자 발표", "news"],
        ["/news/notices/recruit/apply", "공연장 안내원 지원서", "news"],
        ["/news/goods/art-postcards", "공연의 한 장면 · 엽서", "news"],
        ["/news/goods/canvas-bag", "캔버스 토트백", "news"],
        ["/news/goods/viewing-journal", "관람 기록 노트", "news"],
        ["/news/goods/cart", "굿즈 장바구니", "news"],
        ["/news/goods/orders", "굿즈 주문내역", "news"],
        ["/news/newsletter/archive", "뉴스레터 아카이브", "news"],
        ["/news/magazine", "세종문화N", "news"],
        ["/news/membership/benefits", "멤버십 혜택", "news"],
        ["/news/membership/join", "멤버십 가입", "news"],
        ["/about/introduction/greeting", "인사말", "about"],
        ["/about/introduction/history", "걸어온 역사", "about"],
        ["/about/introduction/organization", "조직도", "about"],
        ["/about/introduction/ci", "CI 소개", "about"],
        ["/about/esg/environment", "환경경영", "about"],
        ["/about/esg/social", "사회공헌", "about"],
        ["/about/esg/governance", "윤리경영", "about"],
        ["/about/disclosure/management", "경영공시", "about"],
        ["/about/disclosure/request", "정보공개 청구", "about"],
        ["/about/disclosure/ethics", "부패신고·규제혁신센터", "about"],
        ["/about/donation/apply", "후원 참여", "about"],
        ["/about/partners/apply", "협력·협찬 제안", "about"],
        ["/about/arts-center", "꿈의숲 아트센터", "about"],
        ["/account/login", "로그인", "account"],
        ["/account/signup", "회원가입", "account"],
        ["/account/recovery", "아이디·비밀번호 찾기", "account"],
        ["/account", "마이페이지", "account"],
        ["/account/bookings", "예매내역", "account"],
        ["/account/favorites", "관심 프로그램", "account"],
        ["/account/applications", "신청내역", "account"],
        ["/account/profile", "내 정보", "account"],
        ["/search", "통합검색", "utility"],
        ["/sitemap", "사이트맵", "utility"],
        ["/policy/privacy", "개인정보처리방침", "utility"],
        ["/policy/terms", "이용약관", "utility"],
        ["/policy/email", "이메일 무단수집거부", "utility"],
        ["/english", "English visitor guide", "utility"],
    ].map(([path, title, group]) => page(path, title, group)),
];

// Published content is generated from the database; navigation stays in code.
export const { programs: PROGRAMS, venues: VENUES, companies: COMPANIES, notices: NOTICES } = CATALOG_SNAPSHOT;

for (const p of PROGRAMS)
    if (!PAGES.some((page) => page.path === "/programs/" + p.id))
        PAGES.push(
            page("/programs/" + p.id, p.title, "programs", p.description, "program")
        );

for (const v of VENUES) {
    PAGES.push(
        page("/rental/venues/" + v.id, v.name, "rental", v.description, "venue")
    );
    PAGES.push(
        page(
            "/visit/spaces/" + v.id,
            v.name + " 공간안내",
            "visit",
            v.description,
            "space"
        )
    );
}

for (const c of COMPANIES)
    PAGES.push(
        page("/about/companies/" + c.id, c.name, "about", c.description, "company")
    );

for (const n of NOTICES)
    PAGES.push(page("/news/notices/" + n.id, n.title, "news", n.content, "notice"));

for (const [id, title] of [
    ["autumn-walk", "가을의 취향을 나누다"],
    ["review", "관람 후기 이벤트"],
    ["summer-end", "여름의 기억"],
])
    PAGES.push(
        page(
            "/news/events/" + id,
            title,
            "news",
            "이벤트 상세 안내입니다.",
            "event"
        )
    );

for (const [path, title, group, description] of [
    [
        "/news/events/autumn-walk/apply",
        "가을의 취향을 나누다 · 참여",
        "news",
        "관심 있는 공연과 기대평을 남겨 보세요.",
    ],
    [
        "/news/events/review/apply",
        "관람 후기 이벤트 · 참여",
        "news",
        "관람한 작품에 대한 후기를 남겨 주세요.",
    ],
    [
        "/visit/support/lost/umbrella",
        "분실물 상세 · 우산",
        "visit",
        "가상의 습득물 정보와 문의 경로를 확인하세요.",
    ],
    [
        "/visit/support/lost/scarf",
        "분실물 상세 · 머플러",
        "visit",
        "가상의 습득물 정보와 문의 경로를 확인하세요.",
    ],
    [
        "/visit/support/lost/glasses",
        "분실물 상세 · 안경",
        "visit",
        "가상의 습득물 정보와 문의 경로를 확인하세요.",
    ],
])
    PAGES.push(page(path, title, group, description));

PAGES.push(
    { path: "/visit/plan", title: "방문 계획", description: "관람 날짜와 이동 방법, 준비할 안내를 정리합니다.", group: "visit", eyebrow: "방문 준비", type: "content" },
    { path: "/rental/compare", title: "대관 공간 비교", description: "규모와 무대, 장비를 비교하고 맞는 공간으로 이어가세요.", group: "rental", eyebrow: "대관 준비", type: "content" },
    { path: "/design-rules", title: "디자인 시스템", description: "컬러·16px 타이포그래피·컴포넌트·모션을 정의한 v5 디자인 가이드", group: "rules", eyebrow: "디자인 설계", type: "content" }
);
