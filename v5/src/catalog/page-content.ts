import { PAGES, PROGRAMS, COMPANIES } from "../data/catalog.ts";
import type { PageContent, PageContentBlock } from "./types.ts";

// [검증한 업무 목적지와 읽을 수 있는 본문 / Verified service destinations and readable content]
// 요금·일정·접수 결과를 만들지 않고 해당 업무의 실제 안내로 연결합니다.
// Do not invent prices, dates or submission results; link to the actual service.
const origin = "https://www.sejongpac.or.kr";
const contents = (menu: number) => `${origin}/portal/main/contents.do?menuNo=${menu}`;
const official = {
    transport: contents(200352), parking: contents(200390), seats: contents(200368),
    amenities: contents(200388), accessibility: contents(200353), booking: contents(200322),
    tour: contents(200674), introduction: contents(200505), identity: contents(200508),
    membership: contents(200437), benefits: contents(200438), esg: contents(200632),
    ethics: contents(200521), disclosure: contents(200528), donation: contents(200514),
    everyone: contents(200446), classic: contents(200450), orchestra: contents(200464), summer: contents(200581),
    rental: `${origin}/portal/reservation/reservation/list.do?menuNo=200402`,
    faq: `${origin}/portal/singl/sound/list.do?menuNo=200355`, lost: contents(200354),
    education: `${origin}/portal/academy/academyProgram/list.do?menuNo=200560`,
    notices: `${origin}/portal/bbs/B0000058/list.do?menuNo=200568`,
    openings: `${origin}/portal/bbs/B0000049/list.do?menuNo=200440`,
    events: `${origin}/portal/qestnar/qustnr/list.do?menuNo=200670&status=T`,
    newsletter: `${origin}/portal/bbs/B0000056/list.do?menuNo=200299`,
    magazine: `${origin}/portal/bbs/B0000067/list.do?menuNo=200300`,
    season: `${origin}/portal/bbs/B0000033/list.do?menuNo=200302`,
    sync: `${origin}/portal/bbs/B0000053/list.do?menuNo=200667`,
    goods: `${origin}/portal/goods/store/userList.do?menuNo=200660`,
    organization: `${origin}/portal/organizationalList/organizationalList/list.do?menuNo=200471`,
    arts: `${origin}/dfac/main/main.do`, english: `${origin}/eng/main/main.do`,
};

type Profile = { description: string; source: string; blocks: PageContentBlock[] };
const profiles = new Map<string, Profile>();
const prose = (heading: string, ...paragraphs: string[]): PageContentBlock => ({ type: "prose", heading, paragraphs });
const facts = (title: string, items: [string, string][]): PageContentBlock => ({ type: "facts", title, items: items.map(([label, value]) => ({ label, value })) });
const actions = (...items: [string, string][]): PageContentBlock => ({ type: "actions", items: items.map(([label, href]) => ({ label, href, external: /^https:/.test(href) })) });
const add = (paths: string[], description: string, source: string, ...blocks: PageContentBlock[]) => {
    for (const path of paths) profiles.set(path, { description, source, blocks });
};

add(["/visit", "/visit/plan"], "교통편과 공연장 위치를 확인하고 관람에 필요한 안내를 준비하세요.", official.transport,
    facts("방문 전에 확인하세요", [["주소", "서울특별시 종로구 세종대로 175"], ["대중교통", "광화문역과 경복궁역에서 공연장 방향을 확인하세요."], ["공연장", "대극장·M씨어터·S씨어터·체임버홀은 출입구가 다릅니다."]]),
    actions(["대중교통과 주차", "/visit/directions"], ["공간과 좌석", "/visit/spaces"], ["접근성 서비스", "/visit/accessibility"]));
add(["/visit/directions"], "지하철 출구와 공연장 위치, 주차장 진입 안내를 나누어 확인하세요.", official.transport,
    facts("대중교통", [["5호선 광화문역", "공연장 방향 출구와 보행 동선을 확인하세요."], ["3호선 경복궁역", "광화문 방향으로 이동해 공연장 위치를 확인하세요."], ["목적지", "서울특별시 종로구 세종대로 175 세종문화회관"]]),
    { type: "map", address: "서울특별시 종로구 세종대로 175", href: official.transport, label: "공연장까지의 대중교통 경로" },
    actions(["출구·버스 노선 확인", official.transport], ["주차장 출입구·할인 확인", official.parking]));
add(["/visit/directions/parking"], "공영주차장 출입구와 관람객 할인 조건을 확인하세요.", official.parking,
    prose("세종로 공영주차장", "광화문 일대 행사와 교통 상황에 따라 입·출차가 지연될 수 있습니다.", "주차 요금과 관람객 할인은 주차장 안내에 따릅니다. 이용한 공연·전시의 할인 조건과 정산 방법을 확인하세요."),
    actions(["주차장 출입구와 정산 안내", official.parking], ["대중교통으로 오시는 길", "/visit/directions"]));
add(["/visit/spaces"], "공연장과 전시 공간의 위치·용도·좌석배치를 확인하세요.", official.seats,
    prose("공간 선택", "공연장 이름은 관람 티켓에 표시되어 있습니다. 출발 전에 정확한 공연장과 입장 위치를 확인하세요."),
    actions(["공식 좌석배치도", official.seats], ["대관시설 비교", "/rental/compare"]));
add(["/visit/amenities", "/visit/amenities/facilities"], "관람 전후에 이용할 수 있는 편의시설과 위치를 확인하세요.", official.amenities,
    facts("시설 이용", [["위치", "편의시설은 공연장과 층별로 다릅니다. 방문할 공간의 위치 안내를 확인하세요."], ["이용 시간", "공연·전시 운영 시간과 시설별 영업시간을 확인하세요."], ["도움이 필요할 때", "현장 안내 직원 또는 고객센터 02-399-1000에 문의하세요."]]),
    actions(["편의시설 위치 안내", official.amenities], ["장애인 이용안내", "/visit/accessibility"]));
add(["/visit/amenities/dining"], "식음 공간의 위치와 운영 여부를 방문 전에 확인하세요.", official.amenities,
    prose("공연 전후의 식사", "공연장별 매장과 휴게 공간의 위치를 먼저 확인하세요. 매장별 운영 시간과 이용 조건은 현장 안내에 따릅니다."),
    actions(["식음·휴게시설 확인", official.amenities], ["관람 유의사항", "/visit/etiquette"]));
add(["/visit/accessibility"], "이동 동선과 휠체어석, 관람 지원 서비스를 확인하세요.", official.accessibility,
    facts("관람 지원", [["좌석", "휠체어석과 동반 관람 좌석은 공연별 판매처에서 확인하세요."], ["이동", "공연장별 승강기와 접근 가능한 출입구를 확인하세요."], ["사전 문의", "이용할 공연장과 필요한 지원 내용을 고객센터 02-399-1000에 알려 주세요."]]),
    actions(["접근 가능한 출입구·서비스", official.accessibility], ["공연장 위치", "/visit/spaces"]));
add(["/visit/etiquette", "/programs/booking-guide"], "관람 연령·입장 시간·변경과 취소 조건을 예매 전에 확인하세요.", official.booking,
    facts("공연별로 확인할 사항", [["관람 연령", "프로그램 상세의 관람 연령과 입장 제한을 확인하세요."], ["입장", "지연 입장과 재입장 가능 시점은 작품과 현장 운영에 따라 다릅니다."], ["촬영·음식물", "공연장과 작품의 촬영·녹음·음식물 반입 안내를 따라 주세요."], ["변경·취소", "예매처와 취소 시점에 따른 수수료·환불 조건을 확인하세요."]]),
    actions(["티켓 구매·변경·취소 안내", official.booking], ["프로그램 확인", "/programs"]));
add(["/visit/group"], "단체관람은 인원과 회차를 정해 해당 공연의 접수 조건을 확인하세요.", official.booking,
    facts("문의할 내용", [["공연·회차", "관람할 프로그램과 희망 날짜·시간"], ["인원", "전체 인원과 관람 연령, 필요한 접근성 지원"], ["확인 사항", "단체 적용 기준·좌석 배정·결제 기한은 해당 판매처에 확인하세요."]]),
    actions(["관람할 공연 찾기", "/programs"], ["고객센터 안내", "/visit/support"]));
add(["/visit/support", "/visit/support/inquiry"], "티켓·시설·분실물 문의를 담당하는 실제 상담 경로를 확인하세요.", official.faq,
    facts("문의 준비", [["고객센터", "02-399-1000"], ["예매 문의", "프로그램명·회차·예매처를 확인한 뒤 문의하세요."], ["시설 문의", "공연장 이름과 필요한 시설·서비스를 알려 주세요."]]),
    actions(["고객문의 접수", official.faq], ["자주 묻는 질문", "/visit/support/faq"], ["분실물 찾기", "/visit/support/lost"]));
add(["/visit/support/faq"], "예매와 관람 중 자주 확인하는 내용을 살펴보세요.", official.faq,
    { type: "faq", items: [
        { question: "예매를 변경하거나 취소하려면 어떻게 하나요?", answer: "구매한 예매처에서 해당 티켓의 변경·취소 가능 시점과 수수료를 확인하세요." },
        { question: "관람 연령은 어디에서 확인하나요?", answer: "공연별 상세 페이지의 관람 연령을 확인하세요. 같은 공연장이라도 작품별 기준이 다릅니다." },
        { question: "현장에 물건을 두고 왔어요.", answer: "관람한 공연장·날짜·좌석과 물건의 특징을 정리해 분실물 담당 경로에 문의하세요." },
    ] }, actions(["공식 FAQ와 문의", official.faq], ["분실물 문의", "/visit/support/lost"]));
add(["/visit/support/lost", "/visit/support/lost/umbrella", "/visit/support/lost/scarf", "/visit/support/lost/glasses"], "습득 여부는 실제 분실물 안내에서 확인할 수 있습니다.", official.lost,
    facts("분실물 문의", [["방문 정보", "관람 날짜·공연장·좌석 또는 방문한 시설"], ["물건의 특징", "품목·색상·형태·분실 추정 장소"], ["수령", "습득 여부와 본인 확인·보관 조건을 담당자에게 확인하세요."]]),
    actions(["습득물·수령 방법 확인", official.lost], ["고객센터 안내", "/visit/support"]));

// [대관: 시설 정보와 실제 신청 절차 / Rental: facilities and real application handoff]
add(["/rental", "/rental/guide"], "행사 성격에 맞는 공간과 접수 중인 공고를 확인하세요.", official.rental,
    facts("대관 준비", [["공간", "공연·전시의 형식과 예상 관객 수에 맞는 시설"], ["일정", "설치·리허설·공연·철수에 필요한 전체 기간"], ["신청", "공고의 접수 기간·대상·제출 서류에 맞춰 접수"]]),
    actions(["대관시설", "/rental/venues"], ["현재 대관공고", official.rental], ["진행 절차", "/rental/process"]));
add(["/rental/venues", "/rental/compare"], "공간의 규모와 용도를 비교하고 필요한 기술 조건을 확인하세요.", official.seats,
    prose("시설 비교", "공연장별 좌석배치와 무대 형식이 다릅니다. 관객 수만으로 결정하지 말고 공연 형식·장비·설치 동선을 함께 확인하세요."),
    actions(["공식 좌석·공간 안내", official.seats], ["무대 기술·장비", "/rental/equipment"], ["접수 중인 공고", official.rental]));
add(["/rental/schedule"], "실제 접수 가능한 일정은 대관공고와 담당자의 확인을 기준으로 합니다.", official.rental,
    prose("공고별 일정 확인", "시설별 공고에서 사용 기간과 접수 기한을 확인하세요. 희망일을 선택하거나 문의한 것만으로 대관이 확정되지는 않습니다."),
    actions(["대관공고와 접수 일정", official.rental], ["대관 문의", "/rental/contact"]));
add(["/rental/process"], "공고 확인부터 신청·심사·계약까지 필요한 절차를 확인하세요.", official.rental,
    { type: "timeline", items: [
        { date: "01", title: "공고·시설 확인", body: "신청 대상·사용 기간과 시설의 적합성을 확인합니다." },
        { date: "02", title: "서류 접수", body: "공고에서 요구하는 공연·전시 계획과 서류를 제출합니다." },
        { date: "03", title: "심사·결과 확인", body: "접수 결과와 승인 조건을 확인합니다." },
        { date: "04", title: "계약·운영 협의", body: "사용 조건과 기술·안전·설치·철수 계획을 협의합니다." },
    ] }, actions(["신청서류 확인", "/rental/process/documents"], ["대관공고", official.rental]));
add(["/rental/process/documents", "/rental/guide/eligibility"], "신청 대상과 제출 서류는 해당 대관공고의 기준을 확인하세요.", official.rental,
    facts("준비할 정보", [["신청자", "계약 주체와 담당자 연락처"], ["행사 계획", "작품·참여진·기간·대상 관객·운영 계획"], ["기술·안전", "무대·장비·설치·철수와 관객 안전 계획"], ["제출 서류", "공고에 첨부된 서식과 증빙 목록을 사용하세요."]]),
    actions(["현재 공고·첨부 서식 확인", official.rental], ["대관 절차", "/rental/process"]));
add(["/rental/guide/fees"], "시설·사용 시간·부대 장비에 따른 실제 요금 기준을 확인하세요.", official.rental,
    prose("요금 확인", "기본 시설 사용료 외에 장비·부대시설·운영 비용이 적용될 수 있습니다. 해당 시설의 규정과 공고를 확인하고 필요한 항목을 담당자에게 문의하세요."),
    actions(["시설별 공고와 규정", official.rental], ["대관 상담", "/rental/contact"]));
add(["/rental/equipment"], "공연 형식과 장비 목록을 정리해 해당 시설의 기술 조건을 확인하세요.", official.rental,
    facts("기술 협의", [["무대", "크기·장치·반입·전환 계획"], ["음향·조명", "보유 장비와 추가 반입 장비, 운영 인력"], ["준비 시간", "설치·리허설·공연·철수에 필요한 시간"]]),
    actions(["시설별 기술·대관 안내", official.rental], ["좌석과 공간", official.seats]));
add(["/rental/contact", "/rental/apply"], "대관 상담과 신청은 해당 시설의 공식 접수 경로에서 진행합니다.", official.rental,
    prose("대관 접수", "시설·희망 기간·행사 개요를 준비한 뒤 접수 중인 공고를 확인하세요. 서류 제출 방법과 담당 연락처는 각 공고에서 확인할 수 있습니다."),
    actions(["대관공고·신청 경로", official.rental], ["신청 절차", "/rental/process"]));

// [프로그램과 소식의 목적별 안내 / Program and news information by purpose]
add(["/programs/performance", "/programs/exhibition", "/programs/education"], "분류별 프로그램과 실제 운영 일정·신청 조건을 확인하세요.", official.education,
    prose("프로그램 선택", "관람 날짜·장소·대상 연령을 확인한 뒤 상세 정보로 이동하세요. 회차와 모집 상태는 프로그램별로 확인합니다."),
    actions(["프로그램 전체", "/programs"], ["교육 일정·신청", official.education]));
add(["/programs/education/apply-guide"], "강좌별 모집 대상·일정·수강료·취소 조건을 확인한 뒤 신청하세요.", official.education,
    facts("수강 신청", [["대상", "강좌별 모집 대상과 필요한 준비 사항"], ["일정", "전체 수업일·시간·강의 장소"], ["신청", "잔여 인원·수강료와 취소·환불 조건"]]),
    actions(["교육 일정과 신청", official.education], ["교육 프로그램", "/programs/education"]));
add(["/programs/history"], "세종대왕과 충무공의 이야기를 전시관에서 만나보세요.", "https://www.sejongstory.or.kr",
    prose("세종·충무공 이야기", "광화문 일대의 전시관에서 인물과 시대를 다루는 전시·교육 프로그램을 확인할 수 있습니다. 운영 시간과 입장·단체 방문 안내를 출발 전에 확인하세요."),
    actions(["전시관과 운영 정보", "https://www.sejongstory.or.kr"], ["오시는 길", "/visit/directions"]));
const seasonProfiles: [string, string, string, string][] = [
    ["/programs/season", "시즌·기획 프로그램", "세종시즌과 기획 프로그램의 작품·공연 일정을 확인하세요.", official.season],
    ["/programs/season/sejong", "세종시즌", "서울시예술단과 기획 공연을 시즌별로 확인하세요.", official.season],
    ["/programs/season/sync-next", "Sync Next", "동시대 공연예술을 소개하는 프로그램과 시즌 소식을 확인하세요.", official.sync],
    ["/programs/season/everyone", "모든 누구나", "시민을 위한 문화예술 프로그램과 참여 안내를 확인하세요.", official.everyone],
    ["/programs/season/classic", "누구나 클래식", "프로그램별 관람 안내와 참여 조건을 확인하세요.", official.classic],
    ["/programs/season/orchestra", "누구나 꿈나무오케스트라", "오케스트라 소개·활동과 후원 안내를 확인하세요.", official.orchestra],
    ["/programs/season/summer", "누구나 세종썸머페스티벌", "축제 소개와 해당 시즌의 공연 정보를 확인하세요.", official.summer],
    ["/programs/season/package", "시즌 패키지", "패키지 구성 공연과 구매·변경 조건을 확인하세요.", official.season],
];
for (const [path, title, description, source] of seasonProfiles) add([path], description, source,
    prose(title, description, "연도별 구성과 판매·참여 조건은 해당 시즌의 발표 내용을 확인하세요."), actions([`${title} 안내`, source], ["프로그램 찾기", "/programs"]));
add(["/news", "/news/notices"], "공연과 티켓오픈·대관·운영 관련 공지를 확인하세요.", official.notices,
    prose("공지 확인", "게시일과 공지의 적용 기간을 확인하세요. 변경·취소와 추가 안내는 원문의 최신 내용을 기준으로 확인합니다."),
    actions(["세종소식", official.notices], ["티켓오픈 공지", official.openings]));
add(["/news/notices/recruit/apply"], "채용·모집 공고의 실제 접수 기간과 지원 경로를 확인하세요.", official.notices,
    prose("지원 전 확인", "모집 중인 공고의 자격·근무 조건·제출 서류를 확인하세요. 지원서는 해당 공고에서 정한 방식으로 제출합니다."),
    actions(["현재 모집 공고 확인", official.notices], ["소식 목록", "/news/notices"]));
add(["/news/newsletter", "/news/newsletter/archive"], "뉴스레터에서 공연·전시·교육 소식을 읽어보세요.", official.newsletter,
    prose("뉴스레터", "발행된 뉴스레터를 읽고 관심 있는 프로그램의 상세 정보와 최신 일정을 확인하세요."),
    actions(["뉴스레터 보기·구독 안내", official.newsletter], ["세종문화N", "/news/magazine"]));
add(["/news/magazine"], "세종문화N의 공연예술 이야기와 인터뷰를 읽어보세요.", official.magazine,
    prose("세종문화N", "발행호별 공연·예술가·문화 소식을 확인할 수 있습니다. 기사에 소개된 공연의 현재 일정은 프로그램 상세에서 확인하세요."),
    actions(["발행호와 기사 읽기", official.magazine], ["현재 프로그램", "/programs"]));
add(["/news/membership", "/news/membership/join", "/news/membership/benefits"], "회원 등급과 가입·관람 혜택의 적용 조건을 확인하세요.", official.membership,
    facts("멤버십 확인", [["가입", "가입 대상·기간·회비와 운영 기준"], ["관람 혜택", "적용 공연·좌석·할인율과 제외 조건"], ["회원 기록", "나의 등급·포인트·쿠폰은 회원 계정에서 확인"]]),
    actions(["멤버십 소개", official.membership], ["등급별 혜택", official.benefits], ["마이페이지", "/account"]));
add(["/news/goods", "/news/goods/art-postcards", "/news/goods/canvas-bag", "/news/goods/viewing-journal", "/news/goods/cart", "/news/goods/orders"], "세종 굿즈의 실제 상품과 판매·수령 경로를 확인하세요.", official.goods,
    prose("상품·구매 확인", "상품의 디자인·가격·재고·배송 또는 현장 수령 조건은 판매처에서 확인하세요. 주문과 결제 내역은 구매한 판매처에서 조회합니다."),
    actions(["판매 중인 굿즈 확인", official.goods], ["고객 문의", "/visit/support"]));
add(["/news/events", "/news/events/winners", "/news/events/autumn-walk", "/news/events/review", "/news/events/summer-end", "/news/events/autumn-walk/apply", "/news/events/review/apply"], "이벤트의 진행 여부·참여 조건·발표 일정을 확인하세요.", official.events,
    facts("참여 전 확인", [["기간", "모집 기간과 결과 발표 일정"], ["대상", "참여 자격·중복 참여와 당첨 조건"], ["접수", "각 이벤트의 참여 페이지에서 신청하고 결과를 확인하세요."]]),
    actions(["진행 중인 이벤트·발표 확인", official.events], ["세종소식", "/news/notices"]));

// [기관 정보: 검증되지 않은 인물·수치를 작성하지 않음 / Institutional information without invented people or figures]
add(["/about", "/about/introduction/history"], "세종문화회관의 공간과 운영·발자취를 확인하세요.", official.introduction,
    { type: "timeline", items: [{ date: "1978", title: "세종문화회관 개관", body: "광화문에서 공연·전시와 시민 문화예술 활동을 이어오고 있습니다." }] },
    actions(["기관 개요와 발자취", official.introduction], ["기관 소개", "/about/introduction"], ["공간안내", "/visit/spaces"]));
add(["/about/introduction/greeting"], "현재 기관장의 인사말과 기관 운영 방향을 확인하세요.", official.introduction,
    prose("기관장 인사말", "기관장 이름과 직책·인사말은 공식 기관 소개의 최신 게시 내용을 확인하세요."),
    actions(["공식 기관 소개", official.introduction], ["조직도", "/about/introduction/organization"]));
add(["/about/introduction/organization"], "조직 구성과 업무별 담당 부서를 확인하세요.", official.organization,
    prose("담당 부서 찾기", "사업·시설·대관·고객지원 등 문의할 업무를 정리한 뒤 조직도에서 담당 부서를 확인하세요."),
    actions(["현재 조직도와 담당 업무", official.organization], ["고객센터", "/visit/support"]));
add(["/about/introduction/ci"], "기관의 아이덴티티와 로고 사용 기준을 확인하세요.", official.identity,
    facts("아이덴티티", [["상징", "하늘·땅·사람의 관계를 표현하는 기관 아이덴티티"], ["사용", "로고의 비례·색상·여백은 공식 사용 기준에 따릅니다."], ["자료", "배포된 원본과 사용 규정을 확인한 뒤 사용하세요."]]),
    actions(["공식 로고와 사용 기준", official.identity], ["v5 디자인 시스템", "/design-rules"]));
add(["/about/esg", "/about/esg/environment", "/about/esg/social"], "환경·사회·운영 원칙과 기관의 공개 자료를 확인하세요.", official.esg,
    facts("ESG 경영", [["환경", "시설 운영과 문화행사의 환경 영향을 줄이는 활동"], ["사회", "접근성과 시민 참여를 넓히는 문화예술 활동"], ["운영", "공개된 경영·윤리 기준에 따른 기관 운영"]]),
    actions(["ESG 경영체계·활동", official.esg], ["윤리경영", "/about/esg/governance"], ["정보공개", "/about/disclosure"]));
add(["/about/esg/governance", "/about/disclosure/ethics"], "윤리 기준과 신고·규제혁신 경로를 확인하세요.", official.ethics,
    prose("윤리 기준과 신고", "신고 유형별 접수 경로와 처리·보호 기준을 확인하세요. 개인 식별 정보와 관련 자료는 해당 접수처에서 요구하는 방식으로 제출합니다."),
    actions(["윤리경영과 신고 경로", official.ethics], ["공개된 경영자료", "/about/disclosure"]));
add(["/about/disclosure", "/about/disclosure/management", "/about/disclosure/request"], "사전 공개 자료를 확인하고 필요한 정보의 청구 경로를 찾으세요.", official.disclosure,
    facts("정보공개", [["사전 공개", "공개 항목과 공표 주기·담당 부서 확인"], ["경영자료", "공시 기간과 자료의 기준일 확인"], ["청구", "공개되지 않은 정보는 청구 대상과 접수 절차 확인"]]),
    actions(["사전 공표와 정보공개 청구", official.disclosure], ["조직도", "/about/introduction/organization"]));
add(["/about/donation", "/about/donation/apply", "/about/partners", "/about/partners/apply"], "문화예술 후원과 기업 협력의 참여 방법을 확인하세요.", official.donation,
    prose("후원·협력 상담", "후원 목적과 관심 사업을 정리한 뒤 참여 유형과 상담 절차를 확인하세요. 기부·협찬의 조건과 처리 서류는 담당자와 협의합니다."),
    actions(["후원회·기부·기업협찬 안내", official.donation], ["기관 소개", "/about/introduction"]));
add(["/about/companies"], "서울시예술단의 분야별 소개와 공연 소식을 확인하세요.", official.introduction,
    prose("서울시예술단", "국악·무용·뮤지컬·합창·오페라·연극·발레 분야의 예술단과 공연을 살펴보세요."),
    actions(["공연 일정", "/programs/performance"], ["공식 기관·예술단 안내", official.introduction]));
for (const company of COMPANIES) add([`/about/companies/${company.id}`], `${company.name}의 소개와 공연 프로그램을 확인하세요.`, official.introduction,
    prose(company.name, company.description), actions(["공연 프로그램", "/programs/performance"], ["예술단과 기관 안내", official.introduction]));
add(["/about/arts-center"], "꿈의숲아트센터의 공연·전시와 공간·방문 정보를 확인하세요.", official.arts,
    prose("꿈의숲아트센터", "방문할 공연장과 주소를 확인하세요. 광화문 세종문화회관과 위치가 다릅니다. 프로그램 일정과 교통·주차 정보는 아트센터 안내를 이용하세요."),
    actions(["꿈의숲아트센터 프로그램·방문 안내", official.arts]));

add(["/policy/privacy"], "개인정보 처리 항목·목적·보유 기간과 권리 행사 방법을 확인하세요.", official.introduction,
    prose("개인정보 처리 확인", "로그인과 회원 데이터는 인증한 계정의 접근 권한으로 관리됩니다. 개인정보 문의와 기관 서비스의 처리방침은 해당 서비스의 최신 게시 내용을 확인하세요."),
    actions(["기관 홈페이지의 개인정보처리방침", `${origin}/portal/main/contents.do?menuNo=200148`], ["회원정보 관리", "/account/profile"]));
add(["/policy/terms"], "회원 서비스와 예매·신청에 적용되는 이용 조건을 확인하세요.", official.booking,
    prose("서비스 이용 조건", "예매·교육·대관·상품 구매에는 각 업무의 이용 조건과 취소·환불 규정이 적용됩니다. 처리 전 해당 접수처의 최신 조건을 확인하세요."),
    actions(["예매 이용 안내", official.booking], ["기관 홈페이지 이용약관", `${origin}/portal/main/contents.do?menuNo=200635`]));
add(["/policy/email"], "이메일 주소 수집과 활용에 관한 기관의 안내를 확인하세요.", official.introduction,
    prose("이메일 무단수집거부", "게시된 연락처를 수집·활용할 때에는 기관이 공지한 이용 기준과 관련 규정을 확인하세요."),
    actions(["기관 홈페이지의 이메일 수집 안내", `${origin}/portal/main/contents.do?menuNo=200150`]));
add(["/english"], "Visitor information for performances, venues and access to Sejong Center.", official.english,
    facts("Plan your visit", [["Address", "175 Sejong-daero, Jongno-gu, Seoul"], ["Venues", "Check the venue and entry information on your performance ticket."], ["Tickets", "Confirm dates, age restrictions and booking conditions for each program."]]),
    actions(["Sejong Center visitor information", official.english], ["Directions", official.transport]));
add(["/sitemap"], "프로그램·대관·방문·소식·기관 정보의 주요 경로를 확인하세요.", official.introduction,
    prose("사이트맵", "원하는 업무의 메뉴를 선택하면 해당 안내로 이동합니다. 회원의 예약·관심 프로그램·관람노트는 마이페이지에서 확인할 수 있습니다."),
    actions(["프로그램", "/programs"], ["대관", "/rental"], ["이용안내", "/visit"], ["소식과 혜택", "/news"], ["세종문화회관", "/about"], ["마이페이지", "/account"]));
add(["/search"], "프로그램 이름·장르·공간을 검색해 상세 정보로 이동하세요.", official.introduction,
    prose("검색 범위", "공연·전시·교육 프로그램과 장소·장르를 검색할 수 있습니다. 검색어를 바꾸거나 프로그램 분류를 선택해 결과를 좁혀 보세요."),
    actions(["프로그램 검색", "/programs"], ["고객 문의", "/visit/support"]));

// [DB 수입용 원본과 제품 조회 / Source for SQL import and product lookup]
const programPaths = new Set(PROGRAMS.map(program => `/programs/${program.id}`));
const routeMeta = new Map(PAGES.map(page => [page.path, page]));
export const PAGE_CONTENT: PageContent[] = [...profiles].map(([path, profile]): PageContent => ({
    path, title: routeMeta.get(path)?.title || path, description: profile.description,
    blocks: profile.blocks, status: "published", revision: 1,
    sourceUrl: profile.source, verifiedAt: "2026-10-23T00:00:00+09:00",
})).filter(page => !programPaths.has(page.path));

export const pageContentFor = (path: string): PageContent | undefined => PAGE_CONTENT.find(page => page.path === path);
