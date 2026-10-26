import type { CompletionPage } from "../types.ts";

// [프로그램 안내의 공식 근거 / Official sources for program information]
const official = {
    booking: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200322",
    tickets: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200323",
    cancellation: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200324",
    academy: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200561",
    academyFaq: "https://www.sejongpac.or.kr/portal/bbs/B0000059/list.do?menuNo=200562",
    courses: "https://www.sejongpac.or.kr/portal/academy/academyProgram/list.do?menuNo=200560",
    season: "https://www.sejongpac.or.kr/season/season2026/seasonMain.do",
    seasonPrograms: "https://www.sejongpac.or.kr/season/season2026/seasonProgram.do",
    seasonArchive: "https://www.sejongpac.or.kr/portal/bbs/B0000033/list.do?menuNo=200302",
    season2025: "https://www.sejongpac.or.kr/season/season2025/seasonMain.do",
    season2024: "https://www.sejongpac.or.kr/portal/season/main_2024.do",
    season2023: "https://www.sejongpac.or.kr/portal/season/main_2023.do",
    packages: "https://www.sejongpac.or.kr/season/season2026/pck.do",
    packageFaq: "https://www.sejongpac.or.kr/portal/bbs/B0000044/list.do?menuNo=200503&pageIndex=4",
    everyone: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200446",
    classic: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200450",
    classicSchedule: "https://www.sejongpac.or.kr/portal/classic4all/schedule/yearList.do?menuNo=200452",
    orchestra: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200464",
    orchestraHistory: "https://www.sejongpac.or.kr/portal/htmlContents/htmlContents/view.do?menuCd=footprints&menuNo=200463",
    summer: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200581",
    summerPrograms: "https://www.sejongpac.or.kr/portal/sejongSummer/sejongSummer/list.do?menuNo=200592",
    sync: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200666",
    syncArchive: "https://www.sejongpac.or.kr/portal/bbs/B0000053/list.do?menuNo=200667",
};

// [공연·교육·시즌별 완성 본문 / Completed booking, education and seasonal program content]
export const PROGRAM_COMPLETIONS: CompletionPage[] = [
    {
        path: "/programs/booking-guide", title: "예매 안내",
        summary: "예매 방법과 티켓 수령, 취소·변경 조건을 확인하세요. 공연별 별도 공지가 있으면 해당 안내를 함께 확인해 주세요.",
        sections: [
            { type: "table", title: "예매 채널", columns: ["방법", "운영시간", "이용 안내"], rows: [
                ["인터넷·모바일", "24시간 / 통상 공연 2시간 전 마감", "공연·날짜·회차·좌석 선택 후 결제. 일부 공연 비회원 예매 가능"],
                ["전화 02-399-1000", "09:00~20:00, 연중무휴", "통상 공연 2시간 전까지. 일부 공연 전화예매 제외"],
                ["서비스플라자", "10:00~20:00 / 13:00~14:00 미운영", "1층 세종라운지 내 방문 예매"],
            ], note: "세종문화회관 자체 예매 채널의 예매 수수료는 없습니다. 결제수단과 마감은 작품별로 확인하세요." },
            { type: "table", title: "티켓 받기", columns: ["방법", "준비·확인 사항"], rows: [
                ["현장매표소", "예매내역서 또는 실물 신분증, 휴대폰 뒷 4자리. 할인 예매는 증빙자료 지참"],
                ["무인발권기", "알림톡의 티켓 QR코드 또는 예매번호·휴대폰 뒷 4자리. 할인 증빙이 필요하면 매표소 이용"],
                ["디지털 티켓", "지원 공연에 한해 카카오톡 알림톡으로 발권. 당일 활성화한 QR코드로 입장하며 캡처본은 사용 불가"],
            ], note: "매표소는 통상 공연 1시간 30분 전, 무인발권기는 2시간 전부터 운영합니다. 공연별 수령 방법·운영시간은 다를 수 있습니다." },
            { type: "table", title: "일반 예매 취소 기준", columns: ["취소 시점", "취소수수료"], rows: [
                ["관람일 10일 전 자정까지", "없음"], ["관람일 9일 전~1일 전 17:00", "티켓 금액의 10%"],
                ["관람일 전일 17:00 이후~당일", "취소·변경·환불 불가"],
            ], note: "공식 안내는 관람일 3일 전까지 예매한 건을 인터넷 예매 당일 자정까지 취소하면 수수료가 없으며, 2일 전부터는 당일 취소도 수수료가 발생한다고 설명합니다. 상품·예매처별 규정도 확인하세요." },
            { type: "faq", title: "변경과 할인 증빙", items: [
                { question: "날짜·좌석·결제수단만 바꿀 수 있나요?", answer: "기존 예매를 취소하고 다시 결제해야 합니다. 취소 수수료가 발생하거나 취소 좌석을 다른 사람이 먼저 예매할 수 있습니다." },
                { question: "할인 증빙을 가져오지 못하면 어떻게 되나요?", answer: "현장에서 증빙을 확인하지 못하면 정가 기준 차액을 지불해야 합니다. 공연 상세의 대상·증빙·동반인 적용 범위를 확인하세요." },
            ] },
            { type: "links", title: "예매·방문 준비", items: [{ label: "프로그램 선택", href: "/programs" }, { label: "방문 순서 확인", href: "/visit/plan" }, { label: "예매 문의", href: "tel:02-399-1000" }] },
        ], sources: [{ label: "티켓 구입방법", url: official.booking }, { label: "티켓 수령방법", url: official.tickets }, { label: "예매 취소·변경 안내", url: official.cancellation }],
    },
    {
        path: "/programs/education/apply-guide", title: "교육 수강 안내",
        summary: "예술 감상과 실기 강좌의 일정·커리큘럼을 확인하고 수강을 신청하세요.",
        sections: [
            { type: "prose", title: "세종예술아카데미", paragraphs: ["2007년 6월 개원한 시민 예술교육 공간입니다. 점심·저녁 시간을 활용한 클래식·뮤지컬·미술 감상 강좌와 청소년 문화강좌 등을 운영합니다."] },
            { type: "timeline", title: "수강 신청 순서", items: [
                { date: "강좌 선택", title: "일정과 커리큘럼 확인", body: "대상, 강의 날짜·회차, 강의실, 수강료와 재료비를 강좌 상세에서 확인하세요. ‘진행중’ 표시가 신규 접수 가능을 뜻하는지는 잔여 정원과 별도로 확인해야 합니다." },
                { date: "신청", title: "회원 로그인 후 접수", body: "공식 홈페이지 수강신청에는 회원가입이 필요합니다. 공식 FAQ는 개강 약 1개월 전부터 홈페이지·콜센터·현장에서 접수를 안내합니다." },
                { date: "수강 전", title: "결제와 준비물 확인", body: "신청 강좌와 수강 확정 여부, 첫 수업 일시·장소를 확인하세요. 재료와 준비물은 강좌마다 다릅니다." },
            ] },
            { type: "cards", title: "2026 하반기 운영 강좌", items: [
                { id: "course-vocal-2026", title: "뮤지컬 보컬 스테이션", href: "https://www.sejongpac.or.kr/portal/academy/academyProgram/view.do?courseCd=CS102103262790000064&listType=1&menuNo=200560&pageIndex=1&searchYear=2026", meta: "2026.10.14~12.16 · 수요일 · 서클홀", description: "공식 교육 일정에 진행 중인 강좌로 등록되어 있습니다. 회차와 신청 조건은 강좌 상세에서 확인하세요." },
                { id: "course-brunch-2026", title: "클래식 브런치", href: "https://www.sejongpac.or.kr/portal/academy/academyProgram/view.do?courseCd=CS102103262030000050&listType=1&menuNo=200560&pageIndex=1&searchYear=2026", meta: "2026.09.09~11.25 · 수요일 · 서클홀", description: "하반기 클래식 감상 강좌입니다. 정규 강좌와 1회권의 신청 조건을 구분해 확인하세요." },
                { id: "course-musical-2026", title: "뮤지컬의 탄생: 유럽뮤지컬–역사와 문학의 향연", href: "https://www.sejongpac.or.kr/portal/academy/academyProgram/view.do?courseCd=CS102103262030000049&listType=1&menuNo=200560&pageIndex=1&searchYear=2026", meta: "2026.09.03~11.05 · 목요일 · 서클홀", description: "유럽뮤지컬을 주제로 한 하반기 강좌입니다. 회차별 내용과 잔여 정원을 확인하세요." },
            ] },
            { type: "faq", title: "취소·환불과 문의", items: [
                { question: "개강 전에 취소하면 환불되나요?", answer: "공식 FAQ는 개강일 전날까지 취소하면 전액 환불을 안내합니다. 재료 준비가 필요한 강좌의 재료비는 강의 시작 4일 전까지 취소해야 반환받을 수 있습니다." },
                { question: "수업이 시작된 뒤에는 어떻게 취소하나요?", answer: "콜센터 02-399-1000으로 문의하세요. 강좌 기간·진행 시점과 패키지 할인 여부에 따라 환불액이 달라집니다. 단순 결석이 취소 신청을 대신하지 않습니다." },
            ] },
        ], form: { kind: "education", title: "교육 수강 신청", description: "희망 강좌명과 회차, 수강 관련 요청을 입력해 주세요. 강좌별 수강료와 잔여 정원을 확인한 후 신청하세요." },
        sources: [{ label: "아카데미 소개", url: official.academy }, { label: "수강 신청·환불 FAQ", url: official.academyFaq }, { label: "2026 공식 교육 일정", url: official.courses }],
    },
    {
        path: "/programs/history", title: "지난 프로그램",
        summary: "연도별 세종시즌과 Sync Next 기록을 살펴보세요. 지난 기록의 요금과 예매 일정은 당시 기준입니다.",
        sections: [
            { type: "timeline", title: "최근 세종시즌 기록", items: [
                { date: "2025", title: "예술단 레퍼토리와 기획공연", body: "서울시발레단 ‘오하드 나하린 데카당스’, 서울시오페라단 ‘파우스트’, 서울시뮤지컬단 ‘더 퍼스트 그레잇 쇼’ 등이 공연되었습니다." },
                { date: "2024", title: "서울시발레단 창단 공연", body: "창단 사전 공연 ‘봄의 제전’과 창단 공연 ‘한여름 밤의 꿈’이 시즌에 포함되었습니다. 합창·국악·무용·연극·뮤지컬·오페라와 클래식 기획공연을 확인할 수 있습니다." },
                { date: "2023", title: "28개 공연 라인업", body: "공식 시즌 소개는 28개 공연·251회의 라인업을 안내했습니다. 연극 ‘카르멘’, ‘맥베스’, 뮌헨 필하모닉 내한공연 등이 기록되어 있습니다." },
            ] },
            { type: "cards", title: "연도별 공식 기록", searchable: true, items: [
                { id: "archive-season-2025", title: "2025 세종시즌", href: official.season2025, date: "2025", description: "월별 라인업과 당시 구독·패키지 안내", image: { src: "https://www.sejongpac.or.kr/static/season/season2025/img/program/img_program01.png", alt: "2025 세종시즌 오하드 나하린 데카당스 공식 공연 이미지" } },
                { id: "archive-season-2024", title: "2024 세종시즌", href: official.season2024, date: "2024", description: "장르별 공연과 월별 일정, 공식 시즌북" },
                { id: "archive-season-2023", title: "2023 세종시즌", href: official.season2023, date: "2023", description: "예술단·기획공연과 당시 패키지 구성" },
                { id: "archive-sync", title: "Sync Next 시즌 아카이브", href: official.syncArchive, description: "Sync Next 22·23·24·25·26 연도별 기록" },
            ] },
            { type: "downloads", title: "공식 자료", items: [{ label: "2024 세종시즌 시즌북 PDF", href: "https://www.sejongpac.or.kr/portal/cmmn/file/fileDown.do?atchFileId=bedb1ae634e7404eaf5da097e359152e&fileSn=3", description: "공식 2024 시즌 페이지에서 제공하는 32쪽 시즌북" }] },
            { type: "links", title: "현재 시즌과 전체 기록", items: [{ label: "2026 세종시즌", href: "/programs/season/sejong" }, { label: "연도별 전체 시즌 기록", href: official.seasonArchive }] },
        ], sources: [{ label: "세종시즌 연도별 목록", url: official.seasonArchive }, { label: "2025 세종시즌", url: official.season2025 }, { label: "2024 세종시즌", url: official.season2024 }, { label: "2023 세종시즌", url: official.season2023 }, { label: "Sync Next 연도별 기록", url: official.syncArchive }],
    },
    {
        path: "/programs/season/classic", title: "누구나 클래식",
        summary: "클래식 공연에 해설을 더하고 관객이 관람료를 선택하는 세종문화회관의 문화동행 프로그램입니다.",
        sections: [
            { type: "facts", title: "관람 방식", items: [
                { label: "프로그램의 시작", value: "2007년부터 이어 온 대표 사회공헌 프로그램" },
                { label: "관람료 선택제", value: "1,000원·3,000원·5,000원·10,000원 중 선택 / 선택 금액과 좌석은 무관" },
                { label: "신청·관람", value: "온라인 회원 신청 후 추첨 / 1인 최대 2매 / 만 7세 미만 입장 불가" },
                { label: "행복동행석", value: "객석 일부를 문화소외계층을 위한 좌석으로 운영" },
            ] },
            { type: "timeline", title: "신청부터 관람까지", items: [
                { date: "신청", title: "공연별 기간에 신청", body: "공식 홈페이지 회원가입 후 신청합니다. 같은 공연에 중복 신청할 수 없습니다." },
                { date: "추첨 후", title: "기간 내 좌석 선택·결제", body: "당첨 여부를 확인하고 정해진 기간에 예매하세요. 당첨 자체가 티켓 발권을 뜻하지는 않습니다." },
                { date: "잔여석", title: "미예매·취소 좌석 선착순 예매", body: "당첨자가 예매하지 않았거나 취소된 좌석은 일반 예매로 이용할 수 있습니다. 잔여석이 없으면 예매할 수 없습니다." },
            ] },
            { type: "faq", title: "신청 전 알아두세요", items: [
                { question: "당첨 후 예매하지 않으면 불이익이 있나요?", answer: "공식 FAQ는 당첨 후 미예매에는 불이익이 없다고 안내합니다. 예매 후 취소 없이 관람하지 않으면 향후 3회 신청이 제한됩니다." },
                { question: "신청 일정은 어디서 확인하나요?", answer: "회차별 공연 안내에서 신청 기간·당첨 발표·예매 기간을 확인하세요. 회차마다 일정과 프로그램이 다릅니다." },
            ] },
            { type: "links", title: "회차별 안내", items: [{ label: "누구나 클래식 연간 공연과 이달의 공연", href: official.classicSchedule }, { label: "누구나 클래식 공식 신청 안내", href: official.classic }, { label: "행복동행석 등 이용 문의", href: "/visit/support/inquiry" }] },
        ],
        sources: [{ label: "누구나 클래식 소개·신청·관람료", url: official.classic }, { label: "공식 연간 공연 일정", url: official.classicSchedule }, { label: "미예매·미관람 FAQ", url: "https://www.sejongpac.or.kr/portal/bbs/B0000044/list.do?menuNo=200503" }],
    },
    {
        path: "/programs/season/everyone", title: "모든 누구나",
        summary: "공연 관람, 예술교육, 찾아가는 공연과 시민 합주로 일상에서 예술을 만나는 문화동행 사업입니다.",
        sections: [
            { type: "table", title: "문화동행 프로그램", columns: ["사업", "참여 방식·대상"], rows: [
                ["누구나 클래식", "오페라·교향곡·성악·발레 등 클래식 공연과 해설, 관람료 선택제"],
                ["누구나 꿈나무오케스트라", "문화예술교육 기회가 적은 아동·청소년의 음악교육과 합주"],
                ["누구나 예술로 동행", "공연장 방문이 어려운 가족과 이웃을 찾아가는 공연"],
                ["누구나 동행챔버오케스트라", "음악으로 모인 시민들의 앙상블 활동"],
                ["누구나 세종썸머페스티벌", "광화문 광장 등 열린 공간에서 만나는 야외 공연"],
            ] },
            { type: "cards", title: "참여할 프로그램 알아보기", items: [
                { id: "everyone-classic", title: "누구나 클래식", href: "/programs/season/classic", description: "추첨 신청·잔여석 예매와 관람료 선택제" },
                { id: "everyone-orchestra", title: "누구나 꿈나무오케스트라", href: "/programs/season/orchestra", description: "아동·청소년 음악교육의 취지와 활동 안내" },
                { id: "everyone-summer", title: "누구나 세종썸머페스티벌", href: "/programs/season/summer", description: "도심 야외무대의 축제 기록과 장소 안내" },
            ] },
            { type: "prose", title: "사업별로 참여 조건이 다릅니다", paragraphs: ["공연 예매, 참가자 모집과 기관 신청은 서로 다른 절차로 운영됩니다. 참여하려는 사업을 선택한 뒤 대상·모집 기간·신청처를 확인하세요. 일반 프로그램 예매가 교육단원 선발이나 기관 방문 공연 신청을 대신하지 않습니다."] },
        ], sources: [{ label: "모든 누구나 사업 소개", url: official.everyone }],
    },
    {
        path: "/programs/season/orchestra", title: "누구나 꿈나무오케스트라",
        summary: "문화예술을 접하기 어려운 아동·청소년이 음악을 배우고 함께 합주하며 성장하는 예술교육 사업입니다.",
        sections: [
            { type: "prose", title: "함께 배우는 음악교육", paragraphs: [
                "저소득층·다문화 가정 등 문화소외 아동·청소년에게 예술교육 기회를 제공합니다. 악기 기량뿐 아니라 함께 음악을 만드는 과정과 예술 경험을 통한 성장을 목표로 합니다.",
                "세종문화회관은 자체 예술 역량을 활용한 ‘한국형 엘 시스테마’의 방향으로 이 음악교육을 추진하고 있습니다.",
            ] },
            { type: "facts", title: "활동의 방향", items: [
                { label: "대상", value: "문화예술교육 기회가 적은 유·청소년" },
                { label: "교육", value: "음악과 다양한 예술 경험, 합주를 통한 협력" },
                { label: "목표", value: "잠재력 발견과 자아 성장, 문화 참여 기회 확대" },
            ] },
            { type: "faq", title: "참여와 공연 관람", items: [
                { question: "지금 단원을 신청할 수 있나요?", answer: "이 안내에서 현재 모집 중인 기수·연령·악기별 정원은 확인되지 않았습니다. 모집 공고가 게시되면 공고에 적힌 대상·접수 기간·방법을 확인하세요. 일반 공연 예매와 단원 신청은 별개입니다." },
                { question: "사업의 활동 기록을 볼 수 있나요?", answer: "공식 ‘발자취’에서 연주와 활동 기록을 확인할 수 있습니다. 개별 공연 관람 조건은 해당 공연 공지를 따릅니다." },
            ] },
            { type: "links", title: "사업 확인·문의", items: [{ label: "공식 발자취", href: official.orchestraHistory }, { label: "참여 관련 문의", href: "/visit/support/inquiry" }, { label: "모든 누구나 사업", href: "/programs/season/everyone" }] },
        ], sources: [{ label: "꿈나무오케스트라 대상·교육 목적", url: official.orchestra }, { label: "활동 발자취", url: official.orchestraHistory }],
    },
    {
        path: "/programs/season/package", title: "세종시즌 패키지",
        summary: "2026 세종시즌은 장르·가족·연령별 여덟 가지 패키지를 안내합니다. 구매 후 개별 공연의 회차와 좌석을 지정해야 합니다.",
        sections: [
            { type: "table", title: "2026 패키지 구성", columns: ["패키지", "공연 선택", "대상·특징"], rows: [
                ["무용", "3개 이상", "서울시무용단·서울시발레단"], ["연극·뮤지컬", "3개 이상", "서울시극단·서울시뮤지컬단·기획 및 공동주최 공연"],
                ["오페라", "3개 모두", "서울시오페라단"], ["음악", "3개 이상", "합창·국악관현악·오케스트라"],
                ["세종 인스피레이션", "1개 고정+2개 이상", "리딩·리스닝 스테이지와 초연작"], ["가족", "3개 이상", "온 가족을 위한 시즌 공연"],
                ["실버", "6개 모두", "1961년생 포함 이전 출생자 본인"], ["올패스", "5개 모두", "2002.01.01~2019.12.31 출생자 본인"],
            ], note: "2026 공식 안내 기준입니다. 장르 패키지 최대 35%, 실버·올패스 70% 할인을 안내하며, 판매 기간·잔여 수량·개별 작품의 적용 조건은 구매 단계에서 확인하세요." },
            { type: "timeline", title: "구매 후 이용", items: [
                { date: "1", title: "패키지와 작품 선택", body: "대상 연령·공연 목록·좌석 등급을 확인하세요. 동일 작품을 중복 선택할 수 없으며 구매 후 선택 작품 변경에는 제한이 있습니다." },
                { date: "2", title: "개별 공연 좌석 예매", body: "구매한 예매권으로 관람 날짜·회차·좌석을 지정하세요. 패키지 구매만으로 좌석이 배정되지는 않으며 조기 매진된 회차는 예매할 수 없습니다." },
                { date: "3", title: "예매내역 확인", body: "공식 홈페이지 마이페이지의 공연예매내역에서 패키지와 개별 공연의 예매내역을 확인하세요." },
            ] },
            { type: "faq", title: "취소 전 확인", items: [{ question: "패키지를 취소하면 개별 공연도 함께 취소되나요?", answer: "공식 FAQ는 개별 공연을 취소한 뒤 패키지를 별도로 취소해야 환불된다고 안내합니다. 일반적으로 해당 패키지 첫 공연 전일 17시가 환불 마감이며, 구매 상품의 규정을 확인해야 합니다." }] },
            { type: "links", title: "상품과 공연 확인", items: [{ label: "공식 2026 패키지 상세", href: official.packages }, { label: "2026 세종시즌 공연", href: "/programs/season/sejong" }] },
        ], sources: [{ label: "2026 패키지 구성·대상", url: official.packages }, { label: "패키지 예매·취소 FAQ", url: official.packageFaq }],
    },
    {
        path: "/programs/season/sejong", title: "2026 세종시즌",
        summary: "서울시예술단과 기획·공동주최 공연의 2026 시즌을 만나보세요. 작품마다 공연장과 예매 조건이 다릅니다.",
        sections: [
            { type: "prose", title: "연간 공연을 미리 고르는 시즌", paragraphs: ["합창·국악관현악·무용·발레·연극·뮤지컬·오페라와 기획공연을 연간 라인업으로 소개합니다. 국립극장 등 외부 공연장에서 열리는 작품도 있으므로 예매한 작품의 장소를 확인하세요."] },
            { type: "cards", title: "2026 하반기 주요 작품", searchable: true, items: [
                { id: "season2026-gagok", title: "가곡시대", href: "https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200320&performIdx=36789", date: "2026.10.23~10.24", meta: "서울시합창단 · 세종체임버홀", description: "서울시합창단의 가곡 무대. 공연 시간과 관람 조건은 작품 상세에서 확인하세요." },
                { id: "season2026-enemy", title: "에너미", href: "https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200320&performIdx=37669", date: "2026.10.26~11.14", meta: "서울시극단 · 세종M씨어터", description: "서울시극단의 2026 시즌 연극입니다. 회차·출연진은 작품별 상세를 확인하세요." },
                { id: "season2026-boheme", title: "라보엠", href: "https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200320&performIdx=36791", date: "2026.11.05~11.08", meta: "서울시오페라단 · 세종대극장", description: "서울시오페라단의 하반기 오페라. 캐스팅과 좌석 등급별 요금은 작품 상세에 안내합니다." },
                { id: "season2026-christmas", title: "크리스마스 캐럴", href: "https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200320&performIdx=36793", date: "2026.12.02~12.27", meta: "서울시뮤지컬단 · 세종M씨어터", description: "연말 시즌에 만나는 서울시뮤지컬단의 뮤지컬입니다. 휴연일·관람 연령을 확인하세요." },
            ] },
            { type: "table", title: "시즌을 고르는 방법", columns: ["방법", "이용 방식"], rows: [
                ["개별 공연", "원하는 작품·회차·좌석을 선택해 예매"], ["구독", "2026 구독 라이트·플러스의 선예매·할인 조건 확인 후 개별 공연 예매"],
                ["패키지", "장르·가족·연령별 작품 묶음을 구매한 뒤 개별 좌석 지정"],
            ] },
            { type: "links", title: "시즌 더 보기", items: [{ label: "전체 2026 라인업", href: official.seasonPrograms }, { label: "패키지 구성", href: "/programs/season/package" }, { label: "지난 시즌", href: "/programs/history" }] },
        ], sources: [{ label: "2026 세종시즌 공식 라인업", url: official.season }, { label: "2026 전체 프로그램", url: official.seasonPrograms }],
    },
    {
        path: "/programs/season/summer", title: "누구나 세종썸머페스티벌",
        summary: "공연장을 벗어나 광화문 광장 등 열린 공간에서 만나는 야외 클래식 축제입니다.",
        sections: [
            { type: "prose", title: "도심에서 만나는 야외 공연", paragraphs: ["누구나 쉽게 클래식 음악을 접할 수 있도록 기획된 시민 친화적 야외 프로그램입니다. 공연장 밖의 열린 공간으로 무대를 넓혀 일상에서 음악을 만나는 기회를 제공합니다."] },
            { type: "cards", title: "2026 공식 공연 기록", items: [
                { id: "summer2026-aria", title: "광화문에서 만나는 아리아", href: "https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200592&performIdx=37166", date: "2026.05.22~05.23", meta: "광화문 광장", status: "공연 종료", description: "2026 공식 축제 목록에 등록된 광화문 야외 공연입니다." },
                { id: "summer2026-traviata", title: "제4회 야외오페라 라 트라비아타", href: "https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200592&performIdx=37179", date: "2026.05.22~05.23", meta: "여의도 한강공원 물빛무대", status: "공연 종료", description: "공식 올해의 축제 목록에 함께 안내된 야외오페라입니다. 광화문 광장과 장소가 다릅니다." },
            ] },
            { type: "faq", title: "다음 축제를 준비할 때", items: [
                { question: "여름에만 열리나요?", answer: "행사명만으로 날짜를 판단하지 마세요. 2026 공식 목록에는 5월 공연이 안내되어 있습니다. 새 축제의 날짜·장소는 해당 연도 공지로 확인하세요." },
                { question: "누구나 무료로 입장할 수 있나요?", answer: "공연마다 사전 신청·좌석·관람료 조건이 다를 수 있습니다. 야외 행사라는 이유만으로 무료·자유입장으로 안내하지 않으며, 개별 공연의 관람 안내를 확인해야 합니다." },
                { question: "비가 오면 어떻게 하나요?", answer: "야외 공연은 기상 상황에 따른 운영 공지를 확인하세요. 우천 시 진행·변경 여부는 해당 공연 주최 측이 안내합니다." },
            ] },
            { type: "links", title: "연도별 안내", items: [{ label: "공식 올해의 축제·지난 축제", href: official.summerPrograms }, { label: "광화문 대중교통", href: "/visit/directions" }] },
        ], sources: [{ label: "썸머페스티벌의 취지", url: official.summer }, { label: "2026 공식 축제 목록", url: official.summerPrograms }],
    },
    {
        path: "/programs/season/sync-next", title: "Sync Next",
        summary: "세종S씨어터의 블랙박스 무대에서 장르의 경계를 넘는 동시대 예술을 소개하는 여름 시즌입니다.",
        sections: [
            { type: "facts", title: "Sync Next 26", items: [
                { label: "시즌", value: "2026년 다섯 번째 시즌" },
                { label: "주요 공간", value: "세종S씨어터" },
                { label: "구성", value: "공연과 워크숍 / 개별 프로그램마다 다른 무대 구성" },
            ] },
            { type: "table", title: "2026 프로그램 기록", columns: ["아티스트·프로그램", "일정", "구분"], rows: [
                ["천하제일탈공작소·baan", "2026.07.10~07.11", "공연 종료"],
                ["여유와 설빈", "2026.07.17~07.19", "공연 종료"],
                ["김관지 워크숍", "2026.07.26", "워크숍 종료"],
                ["김혜경 워크숍", "2026.08.23", "워크숍 종료"],
                ["김창완밴드", "2026.08.28~08.29", "공연 종료"],
                ["HYPNOSIS THERAPY", "2026.09.04~09.05", "공연 종료"],
            ], note: "2026 공식 시즌에 공지된 일정의 기록입니다. 현재 예매 가능 공연 목록을 뜻하지 않습니다." },
            { type: "prose", title: "공연별 접근성 정보", paragraphs: ["공식 시즌 페이지에는 쉬운 글·영문 안내와 접근성 아카이브가 마련되어 있습니다. 작품마다 좌석 배치와 관람 방식이 다르므로 개별 작품의 안내를 확인하세요. 계단 이용이 어려운 경우 이동 경로와 지원 사항을 예매 전에 문의해 주세요."] },
            { type: "links", title: "작품과 시즌 아카이브", items: [
                { label: "Sync Next 26 전체 프로그램·접근성 아카이브", href: official.sync },
                { label: "2022~2026 시즌 기록", href: official.syncArchive },
                { label: "공연장 이동 지원", href: "/visit/accessibility" },
            ] },
        ],
        sources: [{ label: "Sync Next 26 공식 소개·프로그램·접근성", url: official.sync }, { label: "Sync Next 연도별 목록", url: official.syncArchive }],
    },
];
