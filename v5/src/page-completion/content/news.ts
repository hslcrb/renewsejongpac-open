import type { CompletionCard, CompletionPage } from "../types.ts";

// [공식 소식의 출처와 확인일 / Official news sources and verification date]
const verifiedOn = "2026-10-23";
const official = "https://www.sejongpac.or.kr";
const eventList = `${official}/portal/qestnar/qustnr/list.do?menuNo=200670&status=T`;
const endedList = `${official}/portal/qestnar/qustnr/list.do?menuNo=200442&status=F`;
const winnerList = `${official}/portal/bbs/B0000012/list.do?menuNo=200443`;
const newsletterList = `${official}/portal/bbs/B0000056/list.do?menuNo=200299`;
const magazineList = `${official}/portal/bbs/B0000067/list.do?menuNo=200300`;
const membershipIntro = `${official}/portal/main/contents.do?menuNo=200437`;
const membershipBenefits = `${official}/portal/main/contents.do?menuNo=200438`;
const membershipJoin = `${official}/portal/member/user/joinAgre.do?menuNo=200144`;
const goodsList = `${official}/portal/goods/store/userList.do?menuNo=200660`;
const recruitmentList = `${official}/portal/bbs/B0000065/list.do?menuNo=200571`;
const recruitment51 = `${official}/portal/bbs/B0000065/view.do?menuNo=200571&nttId=50182&pageIndex=1`;
const recruitment2027 = `${official}/portal/bbs/B0000065/view.do?menuNo=200571&nttId=50204&pageIndex=1`;
const autumnPromotion = `${official}/portal/qestnar/qustnr/view.do?menuNo=200670&pageIndex=1&pageUnit=10&qustnrSn=1162&status=T`;
const closedEventUrl = (id: number): string => `${official}/portal/qestnar/qustnr/view.do?menuNo=200442&pageIndex=1&pageUnit=10&qustnrSn=${id}&status=F`;
const newsletterUrl = (id: number): string => `${official}/portal/bbs/B0000056/view.do?menuNo=200299&nttId=${id}&pageIndex=1`;
const winnerUrl = (id: number): string => `${official}/portal/bbs/B0000012/view.do?menuNo=200443&nttId=${id}&pageIndex=1`;

// [공식 목록에서 확인한 상품; 판매·재고 보장은 아님 / Verified catalog records, without availability claims]
export const VERIFIED_GOODS: {
    id: string; title: string; description: string; sourceUrl: string; image?: string; price?: number | null;
}[] = [
    { id: "beats-oriental-ecobag", title: "BEATS OF TRADITION 오리엔탈 에코백", description: "공식 굿즈 목록의 공모전 수상작. 표시 가격 확인일 2026.10.23.", sourceUrl: goodsList, price: 49500 },
    { id: "beats-tshirt", title: "BEATS OF TRADITION 티셔츠", description: "공모전 수상작. 공식 목록 표기 색상 검정·흰색, 크기 M·L. 옵션별 재고 미확인.", sourceUrl: goodsList, price: 42000 },
    { id: "culture-crown-keyring", title: "문화의 관 키링", description: "공식 굿즈 목록의 공모전 수상작. 표시 가격 확인일 2026.10.23.", sourceUrl: goodsList, price: 18000 },
    { id: "sejong-center-keyring", title: "세종문화회관 키링", description: "공식 굿즈 목록의 공모전 수상작. 표시 가격 확인일 2026.10.23.", sourceUrl: goodsList, price: 14000 },
    { id: "sejong-keycap-set", title: "세종문화회관 포인트 키캡 세트", description: "공식 굿즈 목록의 공모전 수상작. 표시 가격 확인일 2026.10.23.", sourceUrl: goodsList, price: 39000 },
    { id: "sejong-najeon-light", title: "세종의 빛, 나전에 머물다", description: "공모전 수상작. 공식 목록 표기 색상 초록·파랑. 옵션별 재고 미확인.", sourceUrl: goodsList, price: 27000 },
    { id: "sejong-hojak-bell", title: "세종호작문종", description: "공모전 수상작. 공식 목록 표기 색상 검정·흰색. 옵션별 재고 미확인.", sourceUrl: goodsList, price: 65000 },
    { id: "ilmu-norigae-single", title: "일무 괴불노리개(1구)", description: "공모전 수상작. 공식 목록 표기 색상 검정·주황·파랑. 옵션별 재고 미확인.", sourceUrl: goodsList, price: 16000 },
    { id: "ilmu-norigae-triple", title: "일무 괴불노리개(3구)", description: "공모전 수상작. 공식 목록 표기 색상 검정·주황·파랑. 옵션별 재고 미확인.", sourceUrl: goodsList, price: 39500 },
    { id: "irworobongdo-orchestra-mat", title: "일월오봉도 오케스트라매트", description: "공식 굿즈 목록의 공모전 수상작. 표시 가격 확인일 2026.10.23.", sourceUrl: goodsList, price: 33000 }
];

const newsletterIssues: CompletionCard[] = [
    { id: "newsletter-202610", title: "2026년 10월 정기뉴스레터", href: newsletterUrl(50179), date: "2026-09-29", category: "2026년 10월호", description: "공식 게시물과 뉴스레터 본문 이미지에서 확인한 10월호입니다." },
    { id: "newsletter-202609", title: "2026년 9월 정기뉴스레터", href: newsletterUrl(50148), date: "2026-08-25", category: "2026년 9월호", description: "Sync Next 26, 서울시무용단 〈무감서기〉, 연극 〈스미레 미용실〉 등을 소개한 호입니다." },
    { id: "newsletter-202608", title: "2026년 8월 정기뉴스레터", href: newsletterUrl(50102), date: "2026-07-27", category: "2026년 8월호", description: "공식 게시물의 제목과 본문 이미지에 표시된 8월호입니다." },
    { id: "newsletter-202607", title: "2026년 7월 정기뉴스레터", href: newsletterUrl(50060), date: "2026-06-30", category: "2026년 7월호" },
    { id: "newsletter-202606", title: "2026년 6월 정기뉴스레터", href: newsletterUrl(50024), date: "2026-05-26", category: "2026년 6월호" },
    { id: "newsletter-202605", title: "2026년 5월 정기뉴스레터", href: newsletterUrl(50002), date: "2026-04-28", category: "2026년 5월호" }
];

// [연결 근거가 없는 과거 이벤트 경로 / Legacy event routes without a verified matching record]
function unavailableEvent(path: string, title: string, application = false): CompletionPage {
    return {
        path,
        title: application ? `${title} 신청 안내` : `${title} 기록 안내`,
        summary: "이벤트 정보를 확인할 수 없습니다. 현재 진행 중인 이벤트를 확인해 주세요.",
        sections: [
            { type: "facts", title: "기록 확인 상태", items: [
                { label: "이벤트명", value: title },
                { label: "상태", value: "일정·참여 조건 확인 불가 · 신청 중지" },
                { label: "확인 범위", value: "세종문화회관 진행중·종료 이벤트 및 당첨자 발표" },
                { label: "확인일", value: verifiedOn }
            ] },
            { type: "prose", title: application ? "신청을 접수하지 않는 이유" : "이전 링크로 방문하셨나요?", paragraphs: [
                "일정과 참여 조건이 확인되기 전까지 신청을 받지 않습니다. 관련 문의는 고객지원에 남겨 주세요.",
                application ? "확인된 모집 공고와 접수 기간이 없어 신청서 제출을 중지했습니다. 실제 참여 가능한 행사는 이벤트 목록에서 확인해 주세요." : "현재 확인된 공식 행사와 지난 이벤트는 아래 목록에서 각각 확인할 수 있습니다."
            ] },
            { type: "links", title: "다음으로 이동", items: [
                { label: "확인된 이벤트 보기", href: "/news/events" },
                { label: "공식 종료 이벤트 기록", href: endedList },
                { label: "당첨자 발표", href: "/news/events/winners" }
            ] }
        ],
        sources: [{ label: "공식 진행중 이벤트", url: eventList }, { label: "공식 종료 이벤트", url: endedList }],
        ...(application ? { form: { kind: "event" as const, title: "이벤트 신청", entityId: path, closed: true, closedReason: "이 경로와 일치하는 공식 모집 공고와 접수 기간을 확인할 수 없어 신청을 받지 않습니다." } } : {})
    };
}

// [정식 상품 연결이 없는 이전 경로 / Legacy product routes without an exact catalog match]
function unavailableGoods(path: string, title: string): CompletionPage {
    return {
        path, title,
        summary: "현재 상품 정보를 확인할 수 없습니다. 판매처에 상품명과 구성을 문의해 주세요.",
        sections: [
            { type: "facts", title: "상품 확인 상태", items: [
                { label: "찾으시는 상품", value: title },
                { label: "현재 상태", value: "상품 정보 확인 필요" },
                { label: "가격·구성·재고", value: "확인된 정보 없음" },
                { label: "구매 요청", value: "접수하지 않음" }
            ] },
            { type: "prose", title: "상품을 다시 찾아주세요", paragraphs: [
                "가격과 구성이 확인되기 전까지 이 상품의 구매 요청을 받지 않습니다.",
                "굿즈 목록에서 공식 명칭과 확인된 표시 가격을 살펴본 뒤 원하는 상품을 선택해 주세요. 실제 판매 여부와 재고는 별도 확인이 필요합니다."
            ] },
            { type: "links", title: "굿즈 이용", items: [
                { label: "확인된 굿즈 목록", href: "/news/goods" },
                { label: "장바구니", href: "/news/goods/cart" },
                { label: "세종문화회관 공식 굿즈 소개", href: goodsList }
            ] }
        ],
        sources: [{ label: `공식 굿즈 목록 · ${verifiedOn} 확인`, url: goodsList }]
    };
}

// [소식·구독·상품·회원 서비스 완성 콘텐츠 / Completed news and service content]
export const NEWS_COMPLETIONS: CompletionPage[] = [
    {
        path: "/news/events", title: "이벤트",
        summary: "참여 기간과 대상이 확인된 행사, 종료된 이벤트, 당첨자 발표를 살펴보세요.",
        sections: [
            { type: "cards", title: "공식 목록에서 확인한 진행 행사", searchable: true, items: [
                { id: "autumn-promotion-2026", title: "2026 세종시즌 : 가을 특별 프로모션", href: autumnPromotion, category: "전체회원", meta: "2026.09.03–11.08", status: "공식 안내 확인", description: "2026.10.23 공식 진행중 목록에 게시된 프로모션입니다. 적용 공연과 참여 방법은 상세 공고에서 확인해 주세요." }
            ] },
            { type: "cards", title: "종료된 이벤트 기록", searchable: true, items: [
                { id: "hans-zimmer-2026", title: "한스짐머 영화음악 콘서트 세종S멤버십 회원 기대평 이벤트", href: closedEventUrl(1161), category: "스타트·스페셜·시그니처", meta: "2026.10.14–10.21", status: "종료" },
                { id: "diana-krall-2026", title: "SJF at the Theater 2026 - Diana Krall 세종S멤버십 회원 기대평 이벤트", href: closedEventUrl(1160), category: "스타트·스페셜·시그니처", meta: "2026.10.08–10.15", status: "종료" },
                { id: "nature-of-forgetting-2026", title: "연극 〈네이처 오브 포겟팅〉 세종S멤버십 회원 기대평 이벤트", href: closedEventUrl(1159), category: "스타트·스페셜·시그니처", meta: "2026.09.01–09.16", status: "종료" }
            ] },
            { type: "links", title: "참여 전 확인", items: [
                { label: "당첨자 발표", href: "/news/events/winners" },
                { label: "세종S멤버십 등급 안내", href: "/news/membership" },
                { label: "공식 진행중 이벤트 전체", href: eventList }
            ] }
        ],
        sources: [{ label: `공식 진행중 이벤트 · ${verifiedOn} 확인`, url: eventList }, { label: "가을 특별 프로모션 공고", url: autumnPromotion }, { label: "공식 종료 이벤트", url: endedList }]
    },
    unavailableEvent("/news/events/autumn-walk", "가을 산책 이벤트"),
    unavailableEvent("/news/events/autumn-walk/apply", "가을 산책 이벤트", true),
    unavailableEvent("/news/events/review", "관람 후기 이벤트"),
    unavailableEvent("/news/events/review/apply", "관람 후기 이벤트", true),
    unavailableEvent("/news/events/summer-end", "여름 마무리 이벤트"),
    {
        path: "/news/events/winners", title: "당첨자 발표",
        summary: "공식 당첨 발표문과 안내 절차를 확인하세요. 개인별 명단은 원문에서 확인할 수 있습니다.",
        sections: [
            { type: "cards", title: "최근 발표", searchable: true, items: [
                { id: "winner-50219", title: "〈한스 짐머 영화음악 콘서트 2026〉 세종S멤버십 기대평 이벤트 당첨자 발표", href: winnerUrl(50219), date: "2026-10-23", meta: "이벤트 기간 2026.10.14–10.21", status: "발표" },
                { id: "winner-50209", title: "SJF at the Theater 〈Diana Krall〉 세종S멤버십 기대평 이벤트 당첨자 발표", href: winnerUrl(50209), date: "2026-10-19", meta: "이벤트 기간 2026.10.08–10.15", status: "발표" },
                { id: "winner-50201", title: "2026 누구나 클래식 with 국립심포니오케스트라 이벤트 당첨자 발표", href: winnerUrl(50201), date: "2026-10-12", meta: "이벤트 기간 2026.09.08–10.06", status: "발표" }
            ] },
            { type: "faq", title: "발표 확인 안내", items: [
                { question: "이름과 연락처는 어디서 확인하나요?", answer: "해당 이벤트의 공식 발표문에서 확인하세요. 이 화면에는 당첨자의 이름이나 연락처를 복제하지 않습니다." },
                { question: "당첨 안내를 받지 못했다면?", answer: "한스 짐머 이벤트 발표문은 회원정보상의 휴대전화로 안내한다고 명시합니다. 회원정보를 확인한 뒤 해당 발표문에 기재된 담당 부서로 문의해 주세요. 안내 방식은 행사마다 다를 수 있습니다." }
            ] }
        ],
        sources: [{ label: "공식 당첨자 발표 목록", url: winnerList }, { label: "한스 짐머 이벤트 발표문", url: winnerUrl(50219) }]
    },
    {
        path: "/news/goods", title: "세종굿즈",
        summary: "공식 굿즈 목록에서 확인한 상품을 살펴보고 구매 요청할 상품을 장바구니에 담으세요.",
        special: "goods",
        sections: [
            { type: "facts", title: "구매 요청 전 확인", items: [
                { label: "상품·가격 확인", value: "2026.10.23 세종문화회관 공식 굿즈 소개 기준" },
                { label: "재고·옵션", value: "실시간 확인 불가 · 요청 후 별도 확인 필요" },
                { label: "접수 범위", value: "미결제 구매 요청 저장" }
            ] },
            { type: "prose", title: "선택부터 구매 요청까지", paragraphs: [
                "상품을 장바구니에 담아 수량과 표시 금액을 확인할 수 있습니다. 제출하면 웹사이트 운영자에게 구매 요청이 접수됩니다. 결제, 재고 확보, 배송 확정은 이루어지지 않습니다.",
                "표시 가격은 공식 소개 페이지의 확인 당시 금액입니다. 최종 판매 가격, 선택 가능한 옵션과 수령 방법은 실제 판매처 확인이 필요합니다."
            ] },
            { type: "links", title: "상품·요청 확인", items: [
                { label: "장바구니", href: "/news/goods/cart" },
                { label: "내 구매 요청", href: "/news/goods/orders" },
                { label: "공식 전체 굿즈 목록", href: goodsList }
            ] }
        ],
        sources: [{ label: `공식 굿즈 소개 · ${verifiedOn} 가격 확인`, url: goodsList }]
    },
    unavailableGoods("/news/goods/art-postcards", "아트 엽서 상품 안내"),
    unavailableGoods("/news/goods/canvas-bag", "캔버스백 상품 안내"),
    {
        path: "/news/goods/cart", title: "장바구니", special: "cart",
        summary: "담은 상품과 수량을 확인하고 미결제 구매 요청을 제출하세요.",
        sections: [
            { type: "prose", title: "제출 전 확인", paragraphs: [
                "상품의 표시 가격과 수량으로 요청 금액을 계산합니다. 재고, 옵션, 배송비와 최종 판매 금액은 확인되지 않았습니다.",
                "구매 요청을 제출해도 대금이 청구되지 않으며 상품 확보나 배송이 확정되지 않습니다. 저장한 요청의 접수 상태는 내 구매 요청에서 확인할 수 있습니다."
            ] },
            { type: "links", title: "계속 이용하기", items: [
                { label: "굿즈 더 살펴보기", href: "/news/goods" },
                { label: "내 구매 요청 확인", href: "/news/goods/orders" }
            ] }
        ],
        sources: [{ label: "상품과 표시 가격의 공식 출처", url: goodsList }]
    },
    {
        path: "/news/goods/orders", title: "내 구매 요청", special: "orders",
        summary: "제출한 상품과 수량, 미결제 구매 요청의 상태를 확인하세요.",
        sections: [
            { type: "faq", title: "구매 요청 상태 안내", items: [
                { question: "접수는 무엇을 뜻하나요?", answer: "상품과 수량, 연락 정보가 웹사이트 운영자에게 전달된 상태입니다. 결제가 완료되거나 공식 판매처 주문번호가 발급된 상태를 뜻하지 않습니다." },
                { question: "재고가 확보된 건가요?", answer: "재고를 확보하지 않습니다. 실제 판매 여부, 옵션과 수령 방법은 판매처 확인이 필요합니다." },
                { question: "공식 매장에서 구매한 내역도 보이나요?", answer: "이 화면에는 장바구니에서 제출한 구매 요청을 표시합니다. 공식 매장이나 외부 판매처의 결제·구매 내역은 해당 판매처에서 확인하세요." }
            ] },
            { type: "links", title: "굿즈 이용", items: [{ label: "굿즈 목록", href: "/news/goods" }, { label: "장바구니", href: "/news/goods/cart" }] }
        ],
        sources: [{ label: "세종문화회관 공식 굿즈 소개", url: goodsList }]
    },
    unavailableGoods("/news/goods/viewing-journal", "관람 기록 노트 상품 안내"),
    {
        path: "/news/magazine", title: "세종문화N",
        summary: "공식 발행물의 호별 기록과 전자책 열람 경로를 찾아보세요.",
        sections: [
            { type: "table", title: "공식 발행 목록", columns: ["공식 호 표기", "목록의 발행월", "게시일"], rows: [
                ["SEJONG CENTER MAGAZINE N24", "2026년 8월", "2026.09.02"],
                ["SEJONG CENTER MAGAZINE N24", "2026년 6월", "2026.06.29"],
                ["SEJONG CENTER MAGAZINE N23", "2026년 4월", "2026.05.08"],
                ["SEJONG CENTER MAGAZINE N22", "2026년 2월", "2026.03.06"],
                ["SEJONG CENTER MAGAZINE N21", "2025년 12월", "2025.12.29"],
                ["SEJONG CENTER MAGAZINE N20", "2025년 10월", "2025.11.04"]
            ], note: "2026.10.23 확인 기준입니다. 공식 목록에 N24가 두 번 표시되어 있어 발행월과 게시일을 함께 기재했습니다." },
            { type: "downloads", title: "공식 PDF 발행본", items: [
                { label: "2026년 8월 표기호 PDF", href: `${official}/upload/pdf/202609020927512170.pdf`, description: "2026.09.02 게시 · 공식 목록에 연결된 PDF 원문" }
            ] },
            { type: "links", title: "호별 원문과 전자책", items: [
                { label: "공식 세종문화N 전체 목록", href: magazineList, description: "호별 표지와 공식 열람 링크 확인" },
                { label: "교보문고 세종문화N 검색", href: "https://search.kyobobook.co.kr/search?keyword=%EC%84%B8%EC%A2%85%EB%AC%B8%ED%99%94N&gbCode=TOT&target=total" },
                { label: "예스24 세종문화N 검색", href: "https://www.yes24.com/Product/Search?domain=ALL&query=%EC%84%B8%EC%A2%85%EB%AC%B8%ED%99%94N" },
                { label: "알라딘 세종문화N 검색", href: "https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=%EC%84%B8%EC%A2%85%EB%AC%B8%ED%99%94N&x=0&y=0" }
            ] },
            { type: "prose", title: "열람 안내", paragraphs: ["공식 홈페이지는 교보문고, 예스24, 알라딘, 밀리의서재를 전자책 제공 경로로 안내합니다. 서비스별 제공 호와 이용 조건은 해당 서비스에서 확인해 주세요."] }
        ],
        sources: [{ label: `공식 세종문화N 목록 및 전자책 안내 · ${verifiedOn}`, url: magazineList }]
    },
    {
        path: "/news/membership", title: "세종S멤버십",
        summary: "공식 예매·관람 실적으로 산정하는 세종문화회관 멤버십의 등급 조건을 확인하세요.",
        sections: [
            { type: "table", title: "등급 산정 조건", columns: ["등급", "S포인트", "공연·전시 관람"], rows: [
                ["웰컴", "공식 회원가입 시", "별도 실적 조건 없음"],
                ["스타트", "3,000 S 이상", "2회 이상"],
                ["스페셜", "6,000 S 이상", "4회 이상"],
                ["시그니처", "10,000 S 이상", "7회 이상"]
            ], note: "스타트 이상은 포인트와 관람 횟수 조건을 함께 충족해야 합니다. 실제 등급과 적용 혜택은 공식 회원 계정에서 확인하세요." },
            { type: "facts", title: "실적과 유효 기간", items: [
                { label: "기본 등급", value: "전년도 1–12월 실적으로 당해 연도 등급 산정" },
                { label: "중간 승급", value: "당해 1–6월 실적이 상위 등급 조건을 충족하면 하반기 상향" },
                { label: "포인트 성격", value: "등급 산정용 · 현금 사용 불가 · 매년 1월 1일 승급 후 소멸" }
            ] },
            { type: "links", title: "멤버십 이용", items: [
                { label: "등급별 혜택과 제휴 이용 조건", href: "/news/membership/benefits" },
                { label: "가입 안내 및 문의", href: "/news/membership/join" },
                { label: "공식 포인트 적립 기준 전체", href: membershipIntro }
            ] }
        ],
        sources: [{ label: `공식 세종S멤버십 소개 · ${verifiedOn} 확인`, url: membershipIntro }]
    },
    {
        path: "/news/membership/benefits", title: "멤버십 혜택",
        summary: "공연 할인과 선예매, 초대 및 제휴 혜택의 적용 조건을 확인하세요.",
        sections: [
            { type: "table", title: "공식 등급별 주요 혜택", columns: ["등급", "공연·전시 할인", "아카데미", "초대"], rows: [
                ["웰컴", "비정기 할인 쿠폰", "별도 정률 할인 안내 없음", "별도 초대 횟수 안내 없음"],
                ["스타트", "최대 20% · 1인 2매", "5%", "최대 1회"],
                ["스페셜", "최대 30% · 1인 4매", "10%", "최대 2회"],
                ["시그니처", "최대 35% · 1인 4매", "10%", "최대 3회"]
            ], note: "모든 등급에 비정기 할인 쿠폰·예매수수료 면제·제휴 혜택이 안내되어 있습니다. 선예매는 스타트 이상입니다. 혜택은 1년 단위이며 일부 공연·전시는 할인율과 매수가 다릅니다." },
            { type: "faq", title: "제휴 혜택 이용 조건", items: [
                { question: "제휴 매장에서 무엇을 제시하나요?", answer: "공식 홈페이지 회원 로그인 화면을 이용 전에 제시해야 합니다. 티켓 소지자 혜택은 당일 티켓에 한해 예매내역이나 실물 티켓을 미리 제시합니다." },
                { question: "다른 할인과 함께 쓸 수 있나요?", answer: "공식 안내는 회원 본인 1회 또는 테이블당 1회 적용, 다른 할인과 중복 불가를 명시합니다. 일부 품목이 제외될 수 있으므로 매장별 조건을 확인하세요." }
            ] },
            { type: "links", title: "상세 조건 확인", items: [
                { label: "공식 제휴업체 혜택", href: membershipBenefits },
                { label: "등급 조건 확인", href: "/news/membership" },
                { label: "가입 안내 및 문의", href: "/news/membership/join" }
            ] }
        ],
        sources: [{ label: "공식 등급별 혜택", url: membershipIntro }, { label: "공식 제휴 이용 조건", url: membershipBenefits }]
    },
    {
        path: "/news/membership/join", title: "멤버십 가입 안내",
        summary: "공식 가입 절차와 필요한 정보를 확인하고 궁금한 내용을 문의하세요.",
        sections: [
            { type: "timeline", title: "공식 가입과 혜택 확인", items: [
                { date: "1", title: "가입 약관과 개인정보 항목 확인", body: "공식 회원가입 화면에서 해당 약관과 수집 항목을 확인합니다." },
                { date: "2", title: "공식 회원가입 완료", body: "세종문화회관 공식 홈페이지에 회원으로 가입하면 웰컴 등급부터 시작합니다." },
                { date: "3", title: "예매·관람 후 실적 확인", body: "공식 회원 계정에서 누적 실적과 등급을 확인하고 해당하는 혜택을 이용합니다." }
            ] },
            { type: "prose", title: "회원 자격과 혜택 확인", paragraphs: ["공식 회원가입 완료 후 웰컴 등급부터 시작하며, 이후 예매·관람 실적으로 등급을 산정합니다. 회원번호, 현재 등급과 적용 가능한 할인은 공식 회원 계정에서 확인하세요."] },
            { type: "links", title: "공식 절차와 이용 조건", items: [
                { label: "세종문화회관 공식 회원가입", href: membershipJoin },
                { label: "멤버십 혜택 확인", href: "/news/membership/benefits" },
                { label: "개인정보 안내", href: "/policy/privacy" }
            ] }
        ],
        form: { kind: "membership", title: "멤버십 가입 안내 요청", entityId: "sejong-s-membership-guide", description: "접수 대상은 웹사이트 운영자입니다. 가입 안내 요청을 접수하며, 공식 회원번호와 등급은 위 공식 가입 절차에서 발급·확인할 수 있습니다." },
        sources: [{ label: "공식 멤버십 가입 안내", url: membershipIntro }, { label: "공식 회원가입 약관", url: membershipJoin }]
    },
    {
        path: "/news/newsletter", title: "뉴스레터",
        summary: "월별 공연·전시 소식의 공식 발행본을 읽고 구독 방법을 확인하세요.",
        sections: [
            { type: "cards", title: "최근 발행본", items: newsletterIssues.slice(0, 3) },
            { type: "prose", title: "구독 요청 안내", paragraphs: [
                "공식 뉴스레터는 세종문화회관 홈페이지의 구독 신청 메뉴에서 신청·해지할 수 있습니다. 공식 발행본은 구독 여부와 관계없이 지난 뉴스레터에서 열람할 수 있습니다."
            ] },
            { type: "links", title: "발행본과 수신 안내", items: [
                { label: "지난 뉴스레터 전체 보기", href: "/news/newsletter/archive" },
                { label: "공식 뉴스레터 구독 메뉴", href: newsletterList },
                { label: "개인정보 안내", href: "/policy/privacy" }
            ] }
        ],
        form: { kind: "newsletter", title: "뉴스레터 구독 요청", entityId: "newsletter", description: "접수 대상은 웹사이트 운영자입니다. 구독 요청을 접수하며, 세종문화회관 공식 발송 명단 등록·해지는 위 공식 구독 메뉴에서 진행해 주세요." },
        sources: [{ label: "공식 뉴스레터 목록 및 구독 메뉴", url: newsletterList }, { label: "2026년 9월호", url: newsletterUrl(50148) }]
    },
    {
        path: "/news/newsletter/archive", title: "지난 뉴스레터",
        summary: "호별 제목이나 발행월로 공식 뉴스레터를 찾아보세요.",
        sections: [
            { type: "cards", title: "2026년 뉴스레터", searchable: true, items: newsletterIssues, emptyMessage: "일치하는 호가 없습니다. 연도나 월을 바꾸어 검색해 주세요." },
            { type: "prose", title: "발행 정보 읽는 법", paragraphs: [
                "날짜는 공식 목록의 게시일입니다. 발행월보다 앞선 날짜에 게시된 호가 있습니다.",
                "공식 10월호와 8월호의 발행년도 필드에는 2027년이 표시되지만, 게시물 제목과 본문 이미지는 2026년으로 표시됩니다. 이 목록은 제목과 본문을 기준으로 정리했으며 원문을 함께 연결했습니다."
            ] },
            { type: "links", title: "다른 발행본과 구독", items: [{ label: "공식 전체 아카이브", href: newsletterList }, { label: "구독 안내", href: "/news/newsletter" }] }
        ],
        sources: [{ label: `공식 뉴스레터 목록 · ${verifiedOn} 확인`, url: newsletterList }, { label: "10월호 제목·발행년도 원문", url: newsletterUrl(50179) }, { label: "8월호 제목·발행년도 원문", url: newsletterUrl(50102) }]
    },
    {
        path: "/news/notices/recruit/apply", title: "채용 지원 안내",
        summary: "확인된 모집 공고와 접수 상태를 확인하세요. 종료된 공고에는 지원서를 제출할 수 없습니다.",
        sections: [
            { type: "table", title: "최근 확인한 채용 안내", columns: ["공고", "접수 상태", "확인할 내용"], rows: [
                ["공연장 안내원 51기", "접수 종료 · 2026.10.15 18:00", "공식 공고의 합격자 개별 안내 및 교육 일정"],
                ["2027년 상반기 직원 채용 일정 사전 안내", "본 채용 공고 전 사전 안내", "향후 확정 공고에서 직무·인원·접수 기간 확인"]
            ], note: "2026.10.23 확인 기준입니다. 사전 안내에 적힌 일정은 변경될 수 있으며 확정 모집 일정으로 사용하지 않습니다." },
            { type: "prose", title: "현재 지원서를 받지 않습니다", paragraphs: [
                "안내원 51기는 접수 마감일이 지났고, 2027년 상반기 직원 채용 문서는 본 모집 공고 전의 사전 안내입니다. 현재 이 페이지와 연결할 수 있는 접수 중 모집을 확인하지 못해 지원서 제출을 닫았습니다.",
                "새 공고가 게시되면 해당 공고에 명시된 접수 기간, 자격, 제출 서류와 접수처를 확인해 주세요."
            ] },
            { type: "downloads", title: "종료 공고의 참고 자료", items: [
                { label: "공연장 안내원 51기 지원서 양식 HWPX", href: `${official}/portal/cmmn/file/fileDown.do?atchFileId=0aac3e2ec36746cca915cf651b6e5189&bbsId=B0000065&fileSn=1`, description: "공식 종료 공고의 첨부 양식 · 신규 공고에 재사용하기 전에 최신 양식 확인" }
            ] },
            { type: "links", title: "공식 공고 확인", items: [
                { label: "공연장 안내원 51기 공고 원문", href: recruitment51 },
                { label: "2027년 상반기 채용 사전 안내", href: recruitment2027 },
                { label: "공식 채용공고 전체", href: recruitmentList }
            ] }
        ],
        form: { kind: "recruitment", title: "채용 지원서", entityId: "recruitment-unavailable", closed: true, closedReason: "공연장 안내원 51기 접수는 2026.10.15 18:00 종료됐습니다. 2027년 상반기 채용은 사전 안내 단계로, 현재 연결할 수 있는 접수 중 공고가 없습니다." },
        sources: [{ label: "안내원 51기 접수 기간과 첨부 양식", url: recruitment51 }, { label: "2027년 상반기 채용 사전 안내", url: recruitment2027 }, { label: "공식 채용공고 목록", url: recruitmentList }]
    }
];
