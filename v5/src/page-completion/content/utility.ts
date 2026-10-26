import type { CompletionPage } from "../types.ts";

// [정책 원문과 방문 정보의 공식 출처 / Primary policy and visitor information sources]
const official = "https://www.sejongpac.or.kr";
const privacy = `${official}/portal/main/contents.do?menuNo=200148`;
const terms = `${official}/portal/main/contents.do?menuNo=200635`;
const email = `${official}/portal/main/contents.do?menuNo=200150`;
const english = `${official}/eng/main/main.do`;
const transport = `${official}/eng/main/contents.do?menuNo=700040`;
const booking = `${official}/eng/main/contents.do?menuNo=700089`;
const access = `${official}/eng/main/contents.do?menuNo=700018`;
const sitemap = `${official}/portal/singl/siteMap/list.do?menuNo=200162`;

// [개인정보·약관 요약, 영문 방문 안내, 전체 경로 / Policy summaries, English visitor guide and sitemap]
export const UTILITY_COMPLETIONS: CompletionPage[] = [
    {
        path: "/policy/privacy", title: "개인정보 안내",
        summary: "신청 정보의 처리 범위와 세종문화회관 공식 개인정보처리방침을 확인하세요.",
        sections: [
            { type: "prose", title: "신청 정보를 제출하기 전에", paragraphs: [
                "신청·문의·구매 요청의 접수 대상은 웹사이트 운영자입니다. 기관의 공식 회원·예매 시스템 등록이나 담당 기관에 대한 전달은 별도 절차입니다.",
                "제출 전 각 양식에 표시된 수집 항목, 이용 목적, 보유 기간과 동의 내용을 확인해 주세요. 아래의 세종문화회관 처리방침 요약은 기관이 처리하는 정보에 대한 안내이며, 신청 양식의 별도 수집·이용 동의를 대신하지 않습니다."
            ] },
            { type: "facts", title: "공식 기관 처리방침 요약", items: [
                { label: "방침의 주체", value: "재단법인 세종문화회관" },
                { label: "현행 원문의 시행일", value: "2026년 7월 1일" },
                { label: "포함하는 내용", value: "처리 목적·항목·보유 기간, 제3자 제공, 위탁, 파기, 권리 행사와 안전성 확보조치" },
                { label: "정보주체의 권리", value: "열람·정정·삭제·처리정지 등을 기관에 요구할 수 있으며 법령에 따른 제한이 있을 수 있음" }
            ] },
            { type: "prose", title: "기관 정보의 확인과 권리 행사", paragraphs: [
                "공식 원문은 회원정보, 채용지원자 정보 등 개인정보파일별 처리 범위를 구분합니다. 불필요해진 정보는 파기하고, 법령상 보존 의무가 있는 정보는 구분해 보관한다고 안내합니다.",
                "공식 기관에 보유된 정보의 열람 등은 원문의 담당 부서와 서식을 이용하세요. 아래 서식은 세종문화회관에 권리를 행사할 때 사용하는 공식 자료입니다. 이 화면은 원문을 대체하지 않습니다."
            ] },
            { type: "downloads", title: "공식 권리 행사 서식", items: [
                { label: "개인정보 열람 요구서", href: `${official}/portal/cmmn/file/fileDown.do?atchFileId=507bc7cd887f4c33bea1a0f02b098151&fileSn=1` },
                { label: "대리인 위임장", href: `${official}/portal/cmmn/file/fileDown.do?atchFileId=507bc7cd887f4c33bea1a0f02b098151&fileSn=2` }
            ] },
            { type: "links", title: "적용 범위와 전체 원문", items: [
                { label: "세종문화회관 개인정보처리방침 전체", href: privacy, description: "개인정보파일별 항목·보유 기간, 담당 부서와 이전 방침 확인" },
                { label: "신청 정보 문의", href: "/visit/support/inquiry" },
                { label: "이용약관 안내", href: "/policy/terms" }
            ] }
        ],
        sources: [{ label: "세종문화회관 현행 개인정보처리방침 · 2026.10.23 확인", url: privacy }]
    },
    {
        path: "/policy/terms", title: "이용약관 안내",
        summary: "신청·구매 요청의 처리 범위와 공식 회원 서비스의 이용 조건을 확인하세요.",
        sections: [
            { type: "prose", title: "접수 결과의 의미", paragraphs: [
                "문의·신청·구매 요청을 제출하면 웹사이트 운영자에게 접수 기록이 생성됩니다. 기관의 공식 접수처에 제출이 필요한 업무는 해당 공고의 절차를 확인하세요.",
                "공식 회원 자격, 공연 예매, 결제와 티켓 발행은 각 공식 서비스의 절차 및 이용 조건에 따라 확인해야 합니다. 굿즈 구매 요청은 미결제 상태로 접수되며 판매·재고·배송을 확정하지 않습니다."
            ] },
            { type: "table", title: "공식 회원 약관의 주요 항목", columns: ["구분", "원문에서 확인할 내용"], rows: [
                ["서비스 이용계약", "공식 가입 양식 작성과 가입 완료, 가입 제한 및 취소 사유"],
                ["회원과 서비스", "회원 자격·혜택·이용 조건 및 관련 개별 규정"],
                ["이용자의 책임", "타인 명의·정보 도용, 허위 정보와 서비스 방해 등에 관한 제한"],
                ["공연 주체", "기획·공동 주최·대관 공연의 권한과 책임 범위 구분"]
            ] },
            { type: "prose", title: "세부 조건은 해당 서비스에서 확인하세요", paragraphs: [
                "공식 약관은 세종문화회관과 공식 회원 간의 권리·의무 및 책임을 다루며, 별도 서비스 규정과 함께 적용된다고 안내합니다. 공연별 판매처, 할인 증빙, 취소·환불 기준은 실제 예매 화면과 해당 공연 공고도 함께 확인하세요.",
                "이 페이지는 핵심 내용을 읽기 쉽게 정리한 요약입니다. 정확한 적용 조항과 개정 내용은 공식 원문을 확인해 주세요."
            ] },
            { type: "links", title: "전체 규정과 이용 안내", items: [
                { label: "공식 회원 이용약관 전체", href: terms },
                { label: "예매 안내", href: "/programs/booking-guide" },
                { label: "개인정보 안내", href: "/policy/privacy" },
                { label: "이용 문의", href: "/visit/support/inquiry" }
            ] }
        ],
        sources: [{ label: "세종문화회관 공식 이용약관 · 2026.10.23 확인", url: terms }]
    },
    {
        path: "/policy/email", title: "이메일 무단수집 거부",
        summary: "게시된 연락처의 용도를 존중해 주세요. 공식 기관의 이메일 무단수집 거부 고지를 안내합니다.",
        sections: [
            { type: "prose", title: "공식 기관의 고지", paragraphs: [
                "세종문화회관은 홈페이지에 게시한 이메일 주소를 수집 프로그램이나 기술적 장치로 무단 수집하는 것을 거부한다고 고지합니다. 원문은 위반 시 관련 법에 따른 처벌 가능성을 안내합니다.",
                "기관의 공식 고지 게시일은 2015년 10월 12일입니다. 전체 문구는 아래 공식 원문에서 확인할 수 있습니다."
            ] },
            { type: "faq", title: "연락처 이용 안내", items: [
                { question: "게시된 담당자 이메일로 무엇이든 보내도 되나요?", answer: "해당 연락처에 안내된 업무와 접수 목적을 먼저 확인해 주세요. 특히 채용 서류 접수 전용 주소처럼 사용 기간과 목적이 제한된 주소가 있습니다." },
                { question: "뉴스레터 신청도 무단수집에 해당하나요?", answer: "본인이 수신 안내를 확인하고 구독을 신청하는 절차와 게시된 타인의 주소를 무단으로 수집하는 행위는 구분됩니다. 구독 신청 화면의 수집·이용 내용을 확인해 주세요." }
            ] },
            { type: "links", title: "고지와 문의", items: [
                { label: "공식 이메일 무단수집 거부 고지", href: email },
                { label: "고객 문의 작성", href: "/visit/support/inquiry" },
                { label: "뉴스레터 구독 안내", href: "/news/newsletter" }
            ] }
        ],
        sources: [{ label: "세종문화회관 이메일 무단수집 거부", url: email }, { label: "채용 전용 이메일의 목적·기간 안내", url: `${official}/portal/bbs/B0000065/view.do?menuNo=200571&nttId=50182&pageIndex=1` }]
    },
    {
        path: "/english", title: "Visit Sejong Center",
        summary: "Find performances, plan your journey and check ticket information for your visit to central Seoul.",
        sections: [
            { type: "facts", title: "Before you travel", items: [
                { label: "Address", value: "175 Sejong-daero, Jongno-gu, Seoul 03172, Republic of Korea" },
                { label: "Ticket enquiries", value: "+82 2 399 1000 · 09:00–20:00" },
                { label: "Main venues", value: "Sejong Grand Theater, Sejong M Theater, Sejong S Theater and Sejong Chamber Hall" }
            ] },
            { type: "table", title: "Arriving by subway", columns: ["Line", "Station", "Walking route"], rows: [
                ["5", "Gwanghwamun", "Exits 1, 7 or 8; approximately 200 metres toward Gwanghwamun"],
                ["3", "Gyeongbokgung", "Exit 6; walk toward Sejong-daero"],
                ["1", "Jonggak", "Exit 1; approximately 350 metres toward Gwanghwamun"]
            ], note: "Routes follow the official visitor guide. Check current station access and transport information before travelling." },
            { type: "timeline", title: "Plan your performance visit", items: [
                { date: "1", title: "Choose a performance", body: "Check the date, time, venue, age restrictions and language information on the individual listing." },
                { date: "2", title: "Book through the official service", body: "The official English booking guide describes email verification, date and seat selection, and payment. Online booking usually closes two hours before the performance; exceptions apply." },
                { date: "3", title: "Check collection and cancellation rules", body: "Use the instructions supplied with your confirmed booking. An enquiry or saved request does not issue a ticket." }
            ] },
            { type: "prose", title: "Accessibility and assistance", paragraphs: [
                "The official accessibility guide describes tactile guidance, assistance call buttons, wheelchair lifts and elevators. Contact the centre before your visit to confirm a suitable entrance and assistance for your venue.",
                "For current ticket availability and confirmed booking information, follow the official English links below."
            ] },
            { type: "links", title: "Official English information", items: [
                { label: "What's on", href: `${official}/eng/performance/engperformance/performList.do?menuNo=700007` },
                { label: "How to purchase tickets", href: booking },
                { label: "Public transport and maps", href: transport },
                { label: "Accessibility information", href: access },
                { label: "English guided backstage tour", href: `${official}/eng/main/contents.do?menuNo=700092` },
                { label: "Official English homepage", href: english }
            ] }
        ],
        sources: [{ label: "Official English homepage", url: english }, { label: "Official transport guide", url: transport }, { label: "Official ticket purchase guide", url: booking }, { label: "Official accessibility guide", url: access }]
    },
    {
        path: "/sitemap", title: "사이트맵", special: "sitemap",
        summary: "공연과 방문 준비부터 소식, 기관 정보, 신청 내역까지 필요한 페이지를 찾아보세요.",
        sections: [
            { type: "links", title: "자주 찾는 목적지", items: [
                { label: "공연·전시·교육", href: "/programs" },
                { label: "찾아오시는 길", href: "/visit/directions" },
                { label: "예매 안내", href: "/programs/booking-guide" },
                { label: "고객 문의", href: "/visit/support/inquiry" },
                { label: "내 예매 내역", href: "/account/bookings" },
                { label: "English visitor guide", href: "/english" }
            ] },
            { type: "links", title: "신청과 소식 찾기", items: [
                { label: "대관 절차와 신청", href: "/rental/process" },
                { label: "교육 신청 안내", href: "/programs/education/apply-guide" },
                { label: "이벤트와 당첨자 발표", href: "/news/events" },
                { label: "지난 뉴스레터", href: "/news/newsletter/archive" },
                { label: "굿즈 구매 요청 확인", href: "/news/goods/orders" },
                { label: "기관 소개와 정보공개", href: "/about" }
            ] }
        ],
        sources: [{ label: "세종문화회관 공식 사이트맵", url: sitemap }]
    }
];
