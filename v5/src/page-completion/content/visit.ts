import type { CompletionPage } from "../types.ts";

// [방문 안내의 공식 근거 / Official sources for visitor information]
const official = {
    directions: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200352",
    entrance: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200390",
    parking: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200391",
    walking: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200392",
    facilities: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200388",
    dining: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200389",
    accessibility: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200353",
    lost: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200354",
    inquiry: "https://www.sejongpac.or.kr/portal/singl/sound/list.do?menuNo=200355",
    faq: "https://www.sejongpac.or.kr/portal/bbs/B0000044/list.do?menuNo=200503",
    booking: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200322",
    tickets: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200323",
    cancellation: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200324",
    seats: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200368",
    performanceRules: "https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200320&performIdx=36789",
    map: "https://www.sejongpac.or.kr/static/portal/img/content/parking_0100.gif",
};

// [실물이 확인되지 않은 과거 분실물 주소 / Legacy item routes without a verified inventory record]
function unavailableLostDetail(path: string, item: string, identifyingFeatures: string): CompletionPage {
    return {
        path,
        title: `${item} 분실 문의`,
        summary: `이 주소에 연결된 ${item}의 습득 기록은 확인되지 않았습니다. 보관 여부를 문의해 주세요.`,
        sections: [
            { type: "facts", title: "확인 가능한 내용", items: [
                { label: "현재 상태", value: "개별 습득일·보관장소·사진이 공개된 물품 기록 없음" },
                { label: "분실물 확인", value: "안전관리팀 02-399-1112" },
            ] },
            { type: "prose", title: "이 정보를 알려 주세요", paragraphs: [
                `방문 날짜와 시간, 공연명, 좌석이나 마지막으로 사용한 장소를 적어 주세요. ${identifyingFeatures}도 함께 설명하면 물품을 구분하는 데 도움이 됩니다.`,
                "보관 확인을 받은 뒤 수령 방법을 안내받으세요. 물품은 소유 확인 후 인계하며, 공식 안내의 보관 기간은 습득일부터 3개월 이내입니다.",
            ] },
            { type: "links", title: "분실물 처리 안내", items: [
                { label: "안전관리팀에 전화하기", href: "tel:02-399-1112" },
                { label: "전체 분실물 안내", href: "/visit/support/lost" },
            ] },
        ],
        form: { kind: "inquiry", title: `${item} 보관 여부 문의`, description: "물품 특징과 분실한 일시·장소를 입력해 주세요. 다른 사람의 개인정보는 적지 마세요." },
        sources: [{ label: "세종문화회관 분실물 처리 절차", url: official.lost }],
    };
}

// [미완성 방문 페이지의 실제 이용 정보 / Practical information for unfinished visitor pages]
export const VISIT_COMPLETIONS: CompletionPage[] = [
    {
        path: "/visit", title: "방문 안내",
        summary: "교통편부터 티켓 수령, 공연 전후 이용할 시설까지 방문에 필요한 정보를 확인하세요.",
        sections: [
            { type: "facts", title: "처음 방문하시나요?", items: [
                { label: "주소", value: "서울특별시 종로구 세종대로 175, 세종문화회관 (03172)" },
                { label: "가까운 역", value: "5호선 광화문역 1·8번 또는 7번 출구" },
                { label: "전화예매·이용 문의", value: "02-399-1000 · 09:00~20:00" },
            ] },
            { type: "cards", title: "필요한 방문 정보", items: [
                { id: "visit-transport", title: "오시는 길", href: "/visit/directions", description: "지하철 출구와 버스 정류장별 노선, 공식 위치 지도를 확인하세요." },
                { id: "visit-parking", title: "주차 요금·할인", href: "/visit/directions/parking", description: "세종로 공영주차장 공연 관람객 4시간권은 8,000원입니다. 할인 적용 조건을 확인하세요." },
                { id: "visit-access", title: "접근성 안내", href: "/visit/accessibility", description: "엘리베이터·휠체어 리프트 위치와 해피콜 도움 요청 방법을 안내합니다." },
                { id: "visit-amenities", title: "편의시설·식음료", href: "/visit/amenities", description: "물품보관함, 돌봄시설, 오페라글라스와 식음료 매장을 찾아보세요." },
            ] },
            { type: "links", title: "관람을 준비하세요", items: [
                { label: "방문 순서와 준비물", href: "/visit/plan" },
                { label: "공연 관람 예절", href: "/visit/etiquette" },
                { label: "단체관람 문의", href: "/visit/group" },
                { label: "고객지원", href: "/visit/support" },
            ] },
        ], sources: [{ label: "공식 대중교통 이용안내", url: official.directions }, { label: "세종로 공영주차장 요금", url: official.parking }],
    },
    {
        path: "/visit/directions", title: "오시는 길",
        summary: "광화문역·경복궁역·종각역에서 세종문화회관으로 오실 수 있습니다.",
        sections: [
            { type: "facts", title: "목적지", items: [
                { label: "주소", value: "서울특별시 종로구 세종대로 175 (세종로), 세종문화회관" },
                { label: "대표전화", value: "02-399-1000 · 09:00~20:00" },
            ] },
            { type: "table", title: "지하철 출구", columns: ["노선·역", "출구", "이동 방향"], rows: [
                ["5호선 광화문역", "1·8번 또는 7번", "광화문 방향 약 200m"],
                ["3호선 경복궁역", "6번", "세종대로 방향"],
                ["1호선 종각역", "1번", "광화문 방향 약 350m"],
            ], note: "계단을 이용하기 어려우시면 접근성 안내에서 엘리베이터와 도움 요청 위치를 확인하세요." },
            { type: "table", title: "주변 버스 정류장", columns: ["정류장", "주요 노선"], rows: [
                ["세종문화회관", "간선 401·406·700·703·704 / 지선 1711·7016·7018·7022 / 마을 종로09·종로11 / 공항 6005"],
                ["광화문역 2번출구·KT광화문지사", "간선 109·606·708 / 지선 1020·1711·7016·7018·7212 / 마을 종로09·종로11"],
                ["광화문역 6번출구 (01120)", "간선 600·602·603·706 / 지선 7019"],
                ["광화문 중앙차로 (01009·01010)", "간선 103·150·160·260·270·271·273·370·470·601·702A·702B·705·707·720·721·741 / 심야 N26·N37 / 공항 6002"],
            ], note: "공식 안내에 기재된 노선입니다. 운행·정류장 위치는 변경될 수 있으니 출발 전 교통정보를 확인하세요." },
            { type: "image", title: "공식 위치 지도", image: { src: official.map, alt: "세종문화회관과 세종로 공영주차장 출입구, 주변 지하철 출구를 표시한 공식 지도", caption: "공식 주차장 출입구 안내에 제공된 위치 지도입니다." } },
            { type: "links", title: "공연장으로 이동하기", items: [
                { label: "세종로 공영주차장 안내", href: "/visit/directions/parking" },
                { label: "엘리베이터·해피콜 안내", href: "/visit/accessibility" },
                { label: "공식 공연장별 이동 경로", href: official.walking, description: "대극장·M씨어터·S씨어터·체임버홀, 미술관·아카데미별 경로" },
            ] },
        ], sources: [{ label: "대중교통 이용안내", url: official.directions }, { label: "공영주차장 출입구와 위치 지도", url: official.entrance }, { label: "공연장별 이동 경로", url: official.walking }],
    },
    {
        path: "/visit/directions/parking", title: "주차 안내",
        summary: "세종로 공영주차장을 이용하세요. 관람객 할인은 입차 95분 후부터 적용할 수 있습니다.",
        sections: [
            { type: "facts", title: "세종로 공영주차장", items: [
                { label: "위치", value: "서울특별시 종로구 세종로 79-10" },
                { label: "운영·문의", value: "24시간·연중무휴 / 02-2290-6566" },
                { label: "차량 높이", value: "1.8m 이상 차량 진입 불가" },
            ] },
            { type: "table", title: "요금과 관람객 할인", columns: ["구분", "요금", "조건"], rows: [
                ["일반 주차", "5분당 430원", "미세먼지 시즌제 12~3월에는 5등급 차량 5분당 645원"],
                ["공연 관람객", "4시간 8,000원", "공연 티켓 바코드·QR코드로 정산"],
                ["유료전시·체험 관람객", "2시간 4,000원", "해당 티켓 바코드 또는 별도 주차할인권 확인"],
                ["아카데미 수강생", "2시간 4,000원", "수강 관련 주차할인권 확인"],
            ], note: "시간제 할인 시간은 입차 시각부터 계산합니다. 세종로 공영주차장 이외의 주차장에는 적용되지 않습니다." },
            { type: "timeline", title: "할인 정산 순서", items: [
                { date: "입차 후", title: "티켓의 주차 QR코드 확인", body: "디지털 티켓은 ‘주차/물품’ 메뉴에서 확인하세요. 전시는 티켓이나 별도로 받은 할인권을 이용합니다." },
                { date: "입차 95분 이후", title: "무인정산기로 사전 정산", body: "차량번호와 티켓 바코드·QR코드를 이용해 할인을 적용하세요. 지하 식당가 이용객은 매장에서 주차할인권을 별도로 받으세요." },
                { date: "정산 후 15분 이내", title: "출차", body: "15분을 넘기면 5분당 430원의 추가요금이 발생합니다. 공연 종료 직후에는 출차가 혼잡할 수 있습니다." },
            ] },
            { type: "links", title: "출입구와 교통 상황", items: [
                { label: "공식 주차장 출입구 지도", href: official.map },
                { label: "대중교통으로 오시는 길", href: "/visit/directions", description: "광화문 행사나 차량 통제 시 주차장 이용이 제한될 수 있습니다." },
            ] },
        ], sources: [{ label: "공영주차장 주차요금·할인 조건", url: official.parking }, { label: "공영주차장 위치·운영", url: official.entrance }, { label: "디지털 티켓의 주차 QR코드", url: official.tickets }],
    },
    {
        path: "/visit/accessibility", title: "접근성 안내",
        summary: "이동 경로와 현장 도움 요청 방법을 확인하고, 좌석·할인 문의는 공연을 선택한 뒤 진행해 주세요.",
        sections: [
            { type: "table", title: "이동을 돕는 시설", columns: ["시설", "설치·이용 위치"], rows: [
                ["엘리베이터", "대극장 좌·우측 / 세종라운지·세종미술관·세종뜨락·M씨어터 로비 1층 연결"],
                ["휠체어 리프트", "대극장 1층, 세종뜨락, M씨어터 입구 계단"],
                ["점자촉지도", "대극장 입구"],
                ["점자블록", "대극장·M씨어터의 장애인 통로"],
            ] },
            { type: "facts", title: "해피콜로 현장 도움을 요청하세요", items: [
                { label: "버튼 위치", value: "중앙계단 좌·우측, 세종로 주차장 입구, 광화문역 1·8번 출구 방향, 예술의정원 입구" },
                { label: "이용 방법", value: "해피콜 버튼을 누르면 보안 담당자가 방문 위치로 찾아와 이동을 돕습니다." },
                { label: "방문 전 문의", value: "02-399-1000 · 09:00~20:00" },
            ] },
            { type: "prose", title: "좌석과 우대할인", paragraphs: [
                "휠체어 이용 여부와 필요한 동반 좌석을 예매 전 콜센터에 알려 주세요. 좌석 배치와 이용 가능 회차는 공연마다 다릅니다.",
                "공식 예매 안내는 장애인·국가유공자 우대할인을 안내하고 있습니다. 본인·동반인 적용 범위는 공연 상세의 할인 안내로 확인하고, 티켓 수령 시 복지카드 등 해당 증빙을 제시하세요. 대관공연은 주최사 정책이 다를 수 있습니다.",
            ] },
            { type: "links", title: "이동 경로와 좌석 확인", items: [
                { label: "휠체어 이용관객 이동 안내 영상", href: "https://www.youtube.com/playlist?list=PLzq6IvukAJKe0Gczz6dJOiL0_un06Zh9X" },
                { label: "공연장별 공식 이동 경로", href: official.walking },
                { label: "좌석배치도", href: official.seats },
                { label: "접근성 관련 문의하기", href: "/visit/support/inquiry" },
            ] },
        ], sources: [{ label: "장애인이용안내", url: official.accessibility }, { label: "우대할인 예매안내", url: official.booking }, { label: "공식 휠체어 이동 영상 연결", url: official.walking }],
    },
    {
        path: "/visit/amenities", title: "편의시설",
        summary: "공연 전후 필요한 서비스와 식음료 공간의 위치를 찾아보세요.",
        sections: [
            { type: "facts", title: "세종라운지", items: [
                { label: "위치", value: "세종문화회관 1층" },
                { label: "라운지 운영", value: "08:00~23:00 · 입점 매장별 운영시간은 다릅니다." },
                { label: "이용 공간", value: "서비스플라자, 서울마이소울샵, 베이커리카페 아티제" },
            ] },
            { type: "cards", title: "시설 찾기", items: [
                { id: "amenity-services", title: "물품보관·돌봄·대여", href: "/visit/amenities/facilities", description: "공연장별 물품보관함, 라바키즈 아이들세상, 대극장 오페라글라스 이용 방법" },
                { id: "amenity-dining", title: "식음료 매장", href: "/visit/amenities/dining", description: "아티제·오리지널팬케이크하우스·더베이크·친니·설가온 위치와 연락처" },
            ] },
            { type: "links", title: "현장 도움", items: [
                { label: "접근성 안내", href: "/visit/accessibility" },
                { label: "분실물 문의", href: "/visit/support/lost" },
            ] },
        ], sources: [{ label: "공식 편의시설 안내", url: official.facilities }, { label: "공식 F&B 안내", url: official.dining }],
    },
    {
        path: "/visit/amenities/facilities", title: "관람 편의시설",
        summary: "티켓 상담, 짐 보관, 오페라글라스와 어린이 돌봄시설을 이용하실 수 있습니다.",
        sections: [
            { type: "facts", title: "서비스플라자", items: [
                { label: "위치", value: "1층 세종라운지 안" },
                { label: "운영", value: "10:00~20:00, 연중무휴 / 13:00~14:00 점심시간 미운영" },
                { label: "서비스", value: "티켓 예매·발권과 이용 안내" },
            ] },
            { type: "table", title: "물품보관함 위치", columns: ["공연장", "위치"], rows: [
                ["대극장", "2층 203게이트 앞"], ["M씨어터", "객석 1층에서 2층으로 올라가는 계단 옆"],
                ["체임버홀", "1층 101게이트 옆"], ["S씨어터", "지하 2층 102게이트 옆"],
            ], note: "로비 개방부터 공연 종료 20분 후까지 이용합니다. 당일 티켓 QR코드로 최초 4시간 무료이며 중복 사용은 불가합니다. 초과 1시간당 소형 2,000원·대형 4,000원, 티켓 미소지자의 기본 4시간은 소형 1,000원·대형 2,000원입니다." },
            { type: "facts", title: "오페라글라스", items: [
                { label: "대여 위치", value: "대극장 2층 203게이트 앞 무인대여함" },
                { label: "요금·결제", value: "4,000원 / 카드·삼성페이 가능, 현금 불가" },
                { label: "운영", value: "대극장 로비 개방~공연 종료 20분 후 / 1인 1개 선착순" },
                { label: "인증", value: "카카오톡 또는 문자 수신 인증" },
            ] },
            { type: "facts", title: "라바키즈 아이들세상", items: [
                { label: "위치·문의", value: "중앙계단 2층 비즈니스라운지 안 / 02-399-1593" },
                { label: "이용 대상", value: "만 24개월~미취학 아동 / 만 36개월 미만은 보호자 동반" },
                { label: "준비물·비용", value: "당일 공연 입장권과 신분증 / 무료" },
                { label: "운영", value: "공연 30분 전~종료 10분 후 / 월요일 시설 점검으로 미운영" },
                { label: "평일 낮 공연", value: "공연 전날 낮 12시까지 사전 신청 필요" },
            ] },
            { type: "links", title: "돌봄시설 신청과 상세 조건", items: [
                { label: "공식 편의시설 안내에서 사전 신청", href: official.facilities, description: "아이들세상 신청 연결과 최신 이용 연령을 확인하세요." },
                { label: "시설 이용 문의", href: "tel:02-399-1000" },
            ] },
        ], sources: [{ label: "편의시설 위치·요금·운영시간", url: official.facilities }],
    },
    {
        path: "/visit/amenities/dining", title: "식음료 매장",
        summary: "카페·베이커리부터 식사 공간까지 매장별 위치와 운영시간을 안내합니다.",
        sections: [
            { type: "table", title: "카페·베이커리", columns: ["매장", "위치", "영업시간", "문의"], rows: [
                ["아티제", "1층 세종라운지", "월 08:30~20:00 / 화~금 08:00~21:30 / 주말 09:00~21:30", "02-734-2155"],
                ["오리지널팬케이크하우스", "지상 2층, 세종미술관 위", "5~10월 평일 09:00·주말/공휴일 08:00~22:00 / 11~4월 같은 개점시간~21:00", "0505-1375-7481"],
                ["더베이크", "예술동 1층, S씨어터 인근", "09:00~20:00", "02-738-3060"],
            ] },
            { type: "table", title: "식당", columns: ["매장", "종류·위치", "영업시간", "문의"], rows: [
                ["친니", "중식 / 지하 1층", "11:30~21:30, 15:00~17:00 브레이크타임", "02-733-3270"],
                ["설가온", "한정식 / 지하 1층", "11:30~21:30, 15:00~17:00 브레이크타임", "02-733-3276"],
            ], note: "운영시간·휴무·주문 마감은 매장 사정에 따라 달라질 수 있습니다. 예약과 단체 식사, 알레르기 관련 사항은 각 매장으로 문의하세요." },
            { type: "faq", title: "식사와 공연을 함께 계획할 때", items: [
                { question: "식당을 이용한 주차 할인은 어디서 받나요?", answer: "지하 식당가 이용객은 매장에서 후불 바코드 주차할인권을 별도로 받으세요. 공연 티켓의 할인과는 적용 방법을 구분해 확인하세요." },
                { question: "음식물을 객석에 가져갈 수 있나요?", answer: "공연별 반입 규정을 확인하세요. 음식물과 꽃다발 등 반입 제한 물품은 공연장 물품보관함을 이용할 수 있습니다. 보관한 음식물은 당일 찾아가세요." },
            ] },
        ], sources: [{ label: "공식 F&B 매장 운영정보", url: official.dining }, { label: "식당가 주차할인권 안내", url: official.parking }, { label: "반입제한 물품 보관 안내", url: official.facilities }],
    },
    {
        path: "/visit/plan", title: "관람 준비",
        summary: "공연장과 관람 연령을 확인하고 티켓 수령·입장·귀가 순서로 준비하세요.",
        sections: [
            { type: "timeline", title: "방문 순서", items: [
                { date: "출발 전", title: "예매내역과 준비물 확인", body: "공연장·날짜·회차·관람 연령을 확인하세요. 현장 수령에 필요한 예매내역서 또는 실물 신분증, 할인 증빙을 준비하세요." },
                { date: "공연 약 1시간 전", title: "티켓 수령", body: "공식 안내는 여유 있는 수령을 위해 1시간 전 도착을 권장합니다. 매표소는 통상 1시간 30분 전, 무인발권기는 2시간 전 운영을 시작하며 공연별로 다릅니다." },
                { date: "객석 입장 전", title: "공연장·층·게이트 확인", body: "디지털 티켓은 당일 활성화한 QR코드로 입장하세요. 캡처 이미지는 사용할 수 없습니다. 짐 보관과 화장실 이용도 입장 전에 마쳐 주세요." },
                { date: "관람 후", title: "보관물 수령과 주차 정산", body: "물품보관함은 공연 종료 20분 후까지 운영합니다. 주차 정산 후 15분 이내 출차하세요." },
            ] },
            { type: "downloads", title: "공식 좌석배치도", items: [
                { label: "대극장 1층 좌석 원본 이미지", href: "https://www.sejongpac.or.kr/static/portal/img/content/img_seat_0101.png" },
                { label: "대극장 2층 좌석 원본 이미지", href: "https://www.sejongpac.or.kr/static/portal/img/content/img_seat_0102.png" },
                { label: "대극장 3층 좌석 원본 이미지", href: "https://www.sejongpac.or.kr/static/portal/img/content/img_seat_0103.png" },
            ] },
            { type: "links", title: "방문 조건에 맞게 확인하세요", items: [
                { label: "전체 공연장 좌석배치도", href: official.seats }, { label: "아이 동반·짐 보관", href: "/visit/amenities/facilities" },
                { label: "이동 지원", href: "/visit/accessibility" }, { label: "식음료 매장", href: "/visit/amenities/dining" },
            ] },
        ], sources: [{ label: "티켓 수령·디지털 티켓 이용", url: official.tickets }, { label: "공식 좌석배치도", url: official.seats }, { label: "물품보관함 운영", url: official.facilities }, { label: "주차 정산", url: official.parking }],
    },
    {
        path: "/visit/etiquette", title: "관람 예절",
        summary: "같은 공간에서 공연을 즐기는 관객과 출연자를 위해 입장과 촬영·반입 규정을 확인해 주세요.",
        sections: [
            { type: "table", title: "공연 전후 확인할 사항", columns: ["상황", "안내"], rows: [
                ["공연 시작 전", "티켓의 관람 연령과 입장 시간을 확인하고, 휴대전화의 소리·진동·화면 빛이 관람을 방해하지 않도록 준비하세요."],
                ["늦게 도착한 경우", "공연에 따라 지정된 지연 입장 시간에만 입장하며, 예매 좌석 대신 지연 관객석으로 안내될 수 있습니다. 현장 안내원의 안내를 따라 주세요."],
                ["사진·영상·녹음", "사전 허용되지 않은 촬영·녹음은 제한됩니다. 커튼콜 촬영도 작품마다 허용 범위가 다르므로 현장 공지를 확인하세요."],
                ["음식물·꽃다발", "객석 반입 제한은 공연별 안내를 따릅니다. 반입이 제한된 물품은 보관함을 이용하세요."],
                ["공연 중 퇴장·재입장", "작품 진행에 따라 재입장이 제한될 수 있습니다. 부득이하게 이동할 때는 안내원에게 먼저 말씀해 주세요."],
            ], note: "공연마다 관람 연령, 지연 입장, 촬영과 반입 규정이 다릅니다. 예매한 작품의 상세 공지와 현장 안내를 우선해 주세요." },
            { type: "links", title: "입장 전에 준비하세요", items: [
                { label: "물품보관함 위치", href: "/visit/amenities/facilities" }, { label: "티켓 수령 안내", href: "/programs/booking-guide" },
                { label: "관람 관련 문의", href: "/visit/support/inquiry" },
            ] },
        ], sources: [{ label: "공식 공연별 관람 규정 예시: 가곡시대", url: official.performanceRules }, { label: "반입 제한 물품의 보관", url: official.facilities }],
    },
    {
        path: "/visit/group", title: "단체관람",
        summary: "학교·기관·모임의 관람을 계획하고 계신가요? 원하는 작품과 회차, 인원을 정해 문의해 주세요.",
        sections: [
            { type: "table", title: "문의 전에 정할 내용", columns: ["항목", "필요한 정보"], rows: [
                ["작품과 회차", "공연·전시명, 희망 날짜·시간, 조정 가능한 다른 회차"],
                ["관람 인원", "전체 인원, 인솔자 수, 어린이·청소년의 관람 연령 충족 여부"],
                ["좌석과 이동", "희망 좌석 등급, 함께 앉아야 하는 인원, 휠체어와 동반 좌석 등 필요한 지원"],
                ["담당자", "기관·단체명, 연락받을 담당자, 회신 가능한 연락처"],
            ] },
            { type: "faq", title: "단체관람 신청 전 확인", items: [
                { question: "몇 명부터 단체 할인을 받을 수 있나요?", answer: "작품별로 기준 인원·할인율·접수처가 다릅니다. 모든 공연에 같은 단체 기준이 적용되는 것은 아니므로 해당 공연의 할인 안내와 주최사 연락처를 확인하세요." },
                { question: "문의만 남기면 좌석이 확보되나요?", answer: "좌석 확보와 결제 조건은 공연별 판매처의 확인이 필요합니다. 인원·좌석 배정·결제 기한을 안내받은 뒤 예매를 진행하세요." },
                { question: "어린이도 인원에 포함할 수 있나요?", answer: "단체 인원과 별개로 공연별 관람 연령을 충족해야 합니다. 인솔자는 관람 대상자의 연령과 증빙 필요 여부를 먼저 확인하세요." },
            ] },
            { type: "links", title: "관람 준비", items: [
                { label: "공연·전시 찾기", href: "/programs" }, { label: "이동·접근성 안내", href: "/visit/accessibility" },
                { label: "전화로 문의하기", href: "tel:02-399-1000", description: "09:00~20:00" },
            ] },
        ], form: { kind: "group", title: "단체관람 문의", description: "단체명, 관람할 작품·회차, 인원과 필요한 지원을 입력해 주세요." },
        sources: [{ label: "공식 예매 안내", url: official.booking }, { label: "공연별 관람 조건 예시", url: official.performanceRules }],
    },
    {
        path: "/visit/support", title: "고객지원",
        summary: "예매·시설 문의와 분실물 확인에 필요한 연락처를 안내합니다.",
        sections: [
            { type: "table", title: "문의처", columns: ["문의 내용", "연락처", "운영 안내"], rows: [
                ["예매·공연장 이용", "02-399-1000", "09:00~20:00"],
                ["분실물 보관 여부", "02-399-1112", "안전관리팀"],
                ["세종로 공영주차장", "02-2290-6566", "서울시설공단 / 주차장 24시간 운영"],
                ["라바키즈 아이들세상", "02-399-1593", "이용 대상·평일 낮 공연 사전 신청 문의"],
            ] },
            { type: "cards", title: "도움받기", items: [
                { id: "support-faq", title: "자주 묻는 질문", href: "/visit/support/faq", description: "티켓 수령·디지털 티켓·취소·주차·물품보관 안내" },
                { id: "support-inquiry", title: "문의하기", href: "/visit/support/inquiry", description: "공연·시설 이용 중 궁금한 점과 개선 의견을 남겨 주세요." },
                { id: "support-lost", title: "분실물 찾기", href: "/visit/support/lost", description: "방문 일시와 물품 특징을 준비해 보관 여부를 확인하세요." },
            ] },
        ], sources: [{ label: "대표 이용 문의", url: official.directions }, { label: "분실물 문의", url: official.lost }, { label: "주차장 문의", url: official.entrance }, { label: "돌봄시설 문의", url: official.facilities }],
    },
    {
        path: "/visit/support/faq", title: "자주 묻는 질문",
        summary: "예매와 방문 중 자주 확인하는 이용 정보를 모았습니다.",
        sections: [
            { type: "faq", title: "예매·티켓", items: [
                { question: "비회원 예매를 확인하거나 취소하려면 어떻게 하나요?", answer: "공식 홈페이지 로그인 화면의 ‘비회원 예매내역 조회’에서 예매번호·예매자명·연락처로 조회하세요. 일부 공연은 비회원 예매가 제한됩니다." },
                { question: "디지털 티켓을 캡처해서 입장할 수 있나요?", answer: "캡처·촬영한 티켓으로는 입장할 수 없습니다. 공연 당일 알림톡의 디지털 티켓을 열어 활성화한 QR코드를 사용하세요." },
                { question: "할인받은 티켓도 무인발권기에서 받을 수 있나요?", answer: "할인 증빙 확인이 필요한 예매 건은 현장매표소에서 수령하세요. 증빙을 제시하지 못하면 할인 차액을 지불해야 합니다." },
                { question: "좌석이나 결제수단을 바꿀 수 있나요?", answer: "기존 예매를 취소하고 다시 결제해야 합니다. 취소 수수료가 발생할 수 있고, 취소한 좌석을 다른 사람이 먼저 예매할 수 있습니다." },
                { question: "공연 당일 취소할 수 있나요?", answer: "공식 일반 예매 안내의 취소 마감은 관람일 전일 17:00입니다. 당일 취소·변경·환불은 불가합니다. 예매처와 상품별 별도 규정도 확인하세요." },
            ] },
            { type: "faq", title: "방문·시설", items: [
                { question: "공연을 보면 주차가 무료인가요?", answer: "세종로 공영주차장의 공연 관람객 할인은 4시간 8,000원입니다. 입차 95분 후부터 티켓 바코드·QR코드로 할인 정산할 수 있습니다." },
                { question: "짐을 맡길 수 있나요?", answer: "대극장·M씨어터·체임버홀·S씨어터에 물품보관함이 있습니다. 당일 티켓 소지자는 QR코드로 최초 4시간 무료 이용할 수 있습니다." },
                { question: "물건을 잃어버렸어요.", answer: "안전관리팀 02-399-1112에 방문 일시·장소와 물품 특징을 알려 보관 여부를 확인하세요." },
            ] },
            { type: "links", title: "추가 문의", items: [{ label: "문의 남기기", href: "/visit/support/inquiry" }, { label: "공식 FAQ 전체", href: official.faq }] },
        ], sources: [{ label: "공식 FAQ", url: official.faq }, { label: "티켓 수령·디지털 티켓", url: official.tickets }, { label: "취소·변경", url: official.cancellation }, { label: "주차할인", url: official.parking }, { label: "보관함", url: official.facilities }, { label: "분실물", url: official.lost }],
    },
    {
        path: "/visit/support/inquiry", title: "문의하기",
        summary: "공연·전시·시설 이용에 관한 질문과 개선 의견을 남겨 주세요.",
        sections: [
            { type: "facts", title: "빠른 확인이 필요한 경우", items: [
                { label: "예매·이용 문의", value: "02-399-1000 · 09:00~20:00" },
                { label: "분실물", value: "안전관리팀 02-399-1112" },
                { label: "현장 티켓 상담", value: "1층 세종라운지 서비스플라자 · 10:00~20:00, 13:00~14:00 미운영" },
            ] },
            { type: "prose", title: "문의에 포함할 내용", paragraphs: [
                "공연·전시명, 이용 날짜와 회차, 문의 내용을 구체적으로 적어 주세요. 화면 오류는 발생한 단계와 화면에 표시된 문구를 함께 알려 주세요.",
                "비밀번호·주민등록번호·카드번호를 적지 마세요. 예매 취소나 결제 확인이 급한 경우 콜센터를 이용하고, 일반 취소는 관람일 전일 17시 마감 여부를 확인하세요.",
            ] },
            { type: "links", title: "먼저 확인해 보세요", items: [
                { label: "자주 묻는 질문", href: "/visit/support/faq" }, { label: "분실물 보관 절차", href: "/visit/support/lost" },
            ] },
        ], form: { kind: "inquiry", title: "고객 문의 작성", description: "답변받을 연락처와 문의 내용을 입력해 주세요." },
        sources: [{ label: "공식 고객의 소리 안내", url: official.inquiry }, { label: "서비스플라자 운영시간", url: official.facilities }, { label: "예매 취소 마감", url: official.cancellation }],
    },
    {
        path: "/visit/support/lost", title: "분실물 찾기",
        summary: "안전관리팀 02-399-1112로 보관 여부를 확인한 뒤 수령 방법을 안내받으세요.",
        sections: [
            { type: "timeline", title: "분실물 처리 절차", items: [
                { date: "습득", title: "공연장·구내에서 물품 접수", body: "습득한 물품은 안내데스크와 안전관리팀에서 관리합니다. 세종·충무공이야기 전시관의 습득물은 전시관 안내데스크에서 보관합니다." },
                { date: "보관", title: "습득일부터 3개월 이내 보관", body: "방문 일시·장소와 물품의 색상·형태 등 구별 가능한 특징을 알려 확인하세요." },
                { date: "인계", title: "소유 확인 후 본인에게 전달", body: "소유자가 나타나지 않으면 공식 안내 절차에 따라 경찰서 인계 또는 자체 폐기됩니다." },
            ] },
            { type: "cards", title: "공개된 개별 물품", items: [], emptyMessage: "공식 안내에서 공개된 개별 습득물 목록은 확인되지 않았습니다. 안전관리팀에 보관 여부를 문의해 주세요." },
            { type: "links", title: "분실물 확인 요청", items: [
                { label: "안전관리팀에 전화하기", href: "tel:02-399-1112" }, { label: "분실물 문의 남기기", href: "/visit/support/inquiry" },
            ] },
        ], sources: [{ label: "공식 분실물 처리 절차·연락처", url: official.lost }],
    },
    unavailableLostDetail("/visit/support/lost/glasses", "안경", "안경테 색상·모양, 브랜드나 케이스 유무"),
    unavailableLostDetail("/visit/support/lost/scarf", "스카프", "색상·무늬·재질과 크기"),
    unavailableLostDetail("/visit/support/lost/umbrella", "우산", "색상·무늬, 장우산·접이식 여부와 손잡이 모양"),
];
