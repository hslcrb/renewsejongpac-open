import type { CompletionPage, CompletionSection } from "../types.ts";

// [공식 대관 절차·요금·기술 자료 / Verified rental procedures, fees and technical documents]
const base = "https://www.sejongpac.or.kr";
const content = (menu: number) => `${base}/portal/main/contents.do?menuNo=${menu}`;
const announcements = `${base}/portal/reservation/reservation/list.do?menuNo=200402`;
const procedures = content(200404);
const rules = content(200405);
const fees = content(200406);
const technical = content(200407);
const file = (id: string, number: number) => `${base}/portal/cmmn/file/fileDown.do?atchFileId=${id}&fileSn=${number}`;
const source = (label: string, url: string) => ({ label, url });
const steps: CompletionSection = { type: "timeline", title: "공고에서 계약까지", items: [
    { date: "01", title: "공고 확인", body: "공간별 정기·수시 공고에서 신청 대상, 사용 기간, 접수 기한을 확인합니다. 공고되지 않은 일정은 대관 대상이 아닙니다." },
    { date: "02", title: "신청 준비", body: "행사 개요와 설치·리허설·공연·철수에 필요한 기간을 정하고 계획서를 준비합니다." },
    { date: "03", title: "심사", body: "공연·전시 계획을 대관심의위원회에서 심사합니다. 희망일 입력이나 상담만으로 사용 일정이 확정되지는 않습니다." },
    { date: "04", title: "결과 확인", body: "공연장 정기대관은 접수 마감 후 4~5주, 수시대관은 2~3주 내 결과를 안내합니다. 미술관은 정기대관 약 한 달, 수시대관 개별 통보를 기준으로 합니다." },
    { date: "05", title: "계약·기술 협의", body: "승인 조건에 따라 계약금·잔금을 납부하고 기술·안전·입장권 검인 등 운영 사항을 협의합니다." },
] };
const contacts: CompletionSection = { type: "table", title: "공간별 대관 문의", columns: ["공간", "담당 연락처", "확인할 내용"], rows: [
    ["세종대극장", "02-399-1626", "공연 일정·계약·기술 협의"],
    ["세종M씨어터", "02-399-1624", "공연 일정·계약·기술 협의"],
    ["세종미술관 1·2관", "02-399-1048", "전시 기획·설치·철수"],
    ["한글갤러리", "02-399-1152", "전시 대관"],
    ["종합 안내", "02-399-1000", "담당 공간과 문의 부서 확인"],
], note: "미술관 전화 문의는 평일 09:00~18:00, 휴게시간 12:00~13:00를 제외합니다." };
const technicalDownloads: CompletionSection = { type: "downloads", title: "세종대극장 기술 자료", items: [
    { label: "CAD 전체", href: file("c0ca952f227440ad958310880b605290", 2), description: "전체 도면 묶음" },
    { label: "무대 평면도", href: file("c0ca952f227440ad958310880b605290", 1) },
    { label: "무대 단면도", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 2) },
    { label: "조명 회로도", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 3) },
    { label: "음향 배치도", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 4) },
    { label: "영상 배치도", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 5) },
    { label: "무대종합정보", href: file("9a91df8423e447518b237a7664e58c4a", 1) },
    { label: "반입구 정보", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 10) },
    { label: "각종 제출 서식", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 15) },
] };

export const RENTAL_COMPLETIONS: CompletionPage[] = [
    { path: "/rental", title: "대관", summary: "공연과 전시에 맞는 공간을 고르고 신청에 필요한 조건을 확인하세요.", image: { src: "/v5/assets/images/sejong-grand-interior.png", alt: "세종대극장 객석과 무대" }, sections: [
        { type: "cards", title: "준비 단계에 맞춰 시작하세요", items: [
            { id: "spaces", title: "공간 비교", href: "/rental/compare", description: "공간의 용도와 수용 규모를 나란히 비교합니다." },
            { id: "schedule", title: "공고·일정 확인", href: "/rental/schedule", description: "게시된 공고와 실제 접수 기간을 확인합니다." },
            { id: "apply", title: "상담·신청 준비", href: "/rental/apply", description: "희망 공간·일정·행사 내용을 남기고 저장 내역을 확인합니다." },
        ] },
        { type: "facts", title: "대관 유형", items: [{ label: "공연", value: "세종대극장·M씨어터·S씨어터·체임버홀" }, { label: "전시", value: "세종미술관·한글갤러리" }, { label: "별도 대여", value: "강의실·야외공간·의상과 소품은 각 대여 안내에서 조건을 확인합니다." }] },
        { type: "links", title: "공간과 서류", items: [{ label: "대관시설", href: "/rental/venues" }, { label: "요금", href: "/rental/guide/fees" }, { label: "무대 기술·장비", href: "/rental/equipment" }, { label: "접수 중 공고", href: announcements }] },
    ], sources: [source("공간별 대관 공고", announcements), source("공연장 대관 절차", procedures)] },
    { path: "/rental/guide", title: "대관안내", summary: "정기·수시 대관의 차이와 신청 전에 확인할 사항을 정리했습니다.", sections: [
        { type: "table", title: "접수 유형", columns: ["유형", "공연장", "미술관"], rows: [["정기대관", "차기년도 사용분을 전년도 3~4월 중 공고", "5~7월경 공고를 통해 접수 일정 안내"], ["수시대관", "정기대관 뒤 유휴일정이 생기면 별도 공고", "유휴일정 공고 후 정기대관과 같은 절차"], ["장기공연", "전년도 2~3월 중 별도 공고·심사", "전시 기간과 설치·철수 조건을 담당자와 협의"]], note: "일반적인 공고 시기이며, 실제 신청 기간과 사용 가능일은 개별 공고가 기준입니다." },
        { type: "faq", title: "신청 전 확인", items: [{ question: "희망일을 정하면 바로 사용할 수 있나요?", answer: "공고된 일정에 신청하고 심사·승인·계약을 거쳐야 합니다. 상담 기록은 사용 승인이나 계약을 뜻하지 않습니다." }, { question: "미술관 대관에도 홈페이지 회원 계정을 쓰나요?", answer: "공식 미술관 접수는 대관시스템의 기획사·개인 회원 승인 후 가능합니다. 일반 홈페이지 회원가입과 별도 절차입니다." }] },
        { type: "links", title: "다음 준비", items: [{ label: "신청 대상과 기준", href: "/rental/guide/eligibility" }, { label: "서류와 심사", href: "/rental/process/documents" }, { label: "대관 문의", href: "/rental/contact" }] },
    ], sources: [source("공연장 정기·수시 대관", procedures), source("미술관 대관 절차", content(200420))] },
    { path: "/rental/compare", title: "대관 공간 비교", summary: "최대 세 공간을 선택해 규모·위치·시설 특징을 비교하세요.", special: "venue-compare", sections: [
        { type: "prose", title: "규모와 공연 형식을 함께 확인하세요", paragraphs: ["같은 인원이라도 무대 구성과 음향·반입 조건에 따라 적합한 공간이 달라집니다. 좌석 수는 수용 규모이며 임의의 날짜에 예약할 수 있는 잔여석을 뜻하지 않습니다."] },
        { type: "links", title: "공간별 원본 자료", items: [{ label: "대극장 기술자료", href: technical }, { label: "M씨어터 기술자료", href: content(200411) }, { label: "S씨어터 기술자료", href: content(200415) }, { label: "체임버홀 기술자료", href: content(200419) }, { label: "미술관 기술자료", href: content(200423) }] },
    ], sources: [source("공간별 좌석배치", content(200368)), source("무대 종합정보", technical)] },
    { path: "/rental/schedule", title: "대관일정", summary: "공고 게시일을 월별로 확인하고 공고에 명시된 신청·사용 기간을 살펴보세요.", special: "rental-calendar", sections: [
        { type: "prose", title: "공고 일정과 사용 가능일은 다릅니다", paragraphs: ["이 달력은 게시된 대관 공고의 날짜를 보여줍니다. 날짜에 표시가 없다는 이유로 공간을 사용할 수 있는 것은 아닙니다. 공고에 없는 일정은 임의로 신청 가능 상태로 표시하지 않습니다."] },
        { type: "links", title: "공고와 상담", items: [{ label: "공식 대관 공고", href: announcements }, { label: "희망 일정 상담", href: "/rental/contact" }, { label: "대관 신청 준비", href: "/rental/apply" }] },
    ], sources: [source("공간별 접수 중 공고", announcements), source("공고되지 않은 일정에 대한 기준", procedures)] },
    { path: "/rental/process", title: "대관절차", summary: "심사·승인·계약과 공연 준비에 이르는 순서를 확인하세요.", sections: [steps,
        { type: "facts", title: "승인 뒤의 기한", items: [{ label: "계약금", value: "공연장 승인 통보 후 9일 이내. 정기대관은 총 대관료의 20%, 수시대관은 40%를 기준으로 합니다." }, { label: "계약", value: "계약금 납부 후 7일 이내 계약 체결. 공연장 전자계약은 ‘도뉴’를 사용하며 방문계약 조건도 안내합니다." }, { label: "입장권 검인", value: "공연 전 유·무료 입장권 전체를 검인받아야 하며, 온라인 발매 최소 2주 전 신청합니다. 대관료와 부대설비 사전신청 비용 완납이 필요합니다." }] },
        { type: "links", title: "준비 자료", items: [{ label: "서류와 심사기준", href: "/rental/process/documents" }, { label: "신청 준비 기록", href: "/rental/apply" }, { label: "세종대극장 절차 원문", href: procedures }, { label: "미술관 절차 원문", href: content(200420) }] },
    ], sources: [source("공연장 계약·검인 절차", procedures), source("전시 대관 절차", content(200420))] },
    { path: "/rental/apply", title: "대관신청", summary: "희망 공간과 일정을 정리해 상담·신청 준비 내용을 저장하세요.", sections: [
        { type: "facts", title: "작성 전에 준비하세요", items: [{ label: "공간", value: "행사 형식과 관객 수에 맞는 공간" }, { label: "기간", value: "설치·리허설·행사·철수에 필요한 날짜 전체" }, { label: "행사 개요", value: "행사명·참여진·대상 관객·기술 및 접근성 지원 요청" }] },
        { type: "prose", title: "신청 기록 이후", paragraphs: ["저장하면 접수번호로 본인 기록을 확인하고 취소할 수 있습니다. 사용 승인·계약·대관료 납부는 심사와 담당자 확인이 필요한 별도 단계입니다. 공식 제출서류와 공고 조건도 함께 준비해 주세요."] },
        { type: "links", title: "작성에 필요한 안내", items: [{ label: "공간 비교", href: "/rental/compare" }, { label: "서류·양식", href: "/rental/process/documents" }, { label: "접수 중 공고", href: announcements }] },
    ], form: { kind: "rental", title: "대관 상담·신청서" }, sources: [source("공연장 신청과 심사", procedures), source("전시 신청서류", content(200420))] },
    { path: "/rental/contact", title: "대관문의", summary: "공간·사용 기간·행사 내용을 알려주시면 상담에 필요한 기록으로 남습니다.", sections: [contacts,
        { type: "links", title: "전화 문의", items: [{ label: "세종대극장 02-399-1626", href: "tel:023991626" }, { label: "세종M씨어터 02-399-1624", href: "tel:023991624" }, { label: "세종미술관 02-399-1048", href: "tel:023991048" }] },
    ], form: { kind: "inquiry", title: "대관 문의 남기기" }, sources: [source("대극장 담당", procedures), source("M씨어터 담당", content(200408)), source("미술관·갤러리 담당", content(200420))] },
    { path: "/rental/equipment", title: "무대 기술·장비 안내", summary: "무대·조명·음향·영상과 반입 동선을 원본 도면으로 확인하세요.", sections: [
        { type: "facts", title: "기술 협의 항목", items: [{ label: "무대", value: "무대 크기·전환·상부 기계·설치와 철수 계획" }, { label: "조명·음향·영상", value: "기본 설비와 추가 장비·전력·오퍼레이팅 조건" }, { label: "안전·반입", value: "반입구·설치 동선·방염 서류와 무대 안전 관련 준비" }] }, technicalDownloads,
        { type: "links", title: "다른 공간의 자료", items: [{ label: "M씨어터", href: content(200411) }, { label: "S씨어터", href: content(200415) }, { label: "체임버홀", href: content(200419) }, { label: "미술관·한글갤러리", href: content(200423) }, { label: "세종대극장 VR", href: `${base}/upload/vr/vr3/tour.html` }] },
    ], sources: [source("대극장 도면·안전 서류", technical)] },
    { path: "/rental/guide/fees", title: "대관요금", summary: "공간·장르·사용 시간에 따라 달라지는 요금을 확인하세요.", sections: [
        { type: "table", title: "세종대극장 공연 대관", columns: ["장르", "1회 5시간", "초과 30분"], rows: [["공연", "6,300,000원", "630,000원"], ["뮤지컬·콘서트", "10,300,000원", "1,030,000원"], ["행사", "11,500,000원", "1,150,000원"]], note: "부가가치세 별도. 2026.10.23 공식 대관료 표 확인. 부대설비와 준비·철수 대관료는 별도입니다." },
        { type: "table", title: "세종대극장 준비·철수 기본대관", columns: ["장르", "기본 4시간", "초과 30분"], rows: [["공연", "3,150,000원", "370,000원"], ["뮤지컬·콘서트", "6,180,000원", "820,000원"], ["행사", "6,900,000원", "920,000원"]], note: "주간·종일 사용은 원문 구간별 표를 확인하세요. 표의 금액을 최종 견적으로 표시하지 않습니다." },
        { type: "links", title: "공간별 요금표", items: [{ label: "대극장 전체 요금", href: fees }, { label: "M씨어터", href: content(200410) }, { label: "S씨어터", href: content(200414) }, { label: "체임버홀", href: content(200418) }, { label: "미술관·한글갤러리", href: content(200422) }, { label: "견적·요금 문의", href: "/rental/contact" }] },
    ], sources: [source("대극장 장르·시간별 대관료", fees)] },
    { path: "/rental/guide/eligibility", title: "대관 대상 및 기준", summary: "행사 성격과 사용 목적이 공간별 공고·규정에 맞는지 확인하세요.", sections: [
        { type: "facts", title: "신청 적합성 확인", items: [{ label: "공고", value: "해당 시설에 공고된 사용 기간과 신청 대상인지 확인합니다." }, { label: "행사 계획", value: "작품·전시 성격, 참여진, 관객과 운영 계획을 설명할 수 있어야 합니다." }, { label: "시설·안전", value: "무대·전시시설의 사용 목적과 기술·안전 조건을 함께 검토합니다." }, { label: "미술관", value: "공식 접수는 별도 대관시스템의 기획사·개인 회원 승인과 포트폴리오 제출 조건을 확인합니다." }] },
        { type: "links", title: "판단 기준 원문", items: [{ label: "대관규정·공연장대관내규", href: rules }, { label: "미술관 대관규정", href: content(200421) }] },
        { type: "links", title: "계속 준비하기", items: [{ label: "공간 비교", href: "/rental/compare" }, { label: "신청 서류", href: "/rental/process/documents" }] },
    ], sources: [source("대관규정과 내규", rules), source("미술관 신청 조건", content(200420))] },
    { path: "/rental/process/documents", title: "신청서류 및 심사기준", summary: "공연·전시 계획과 기술·안전 자료를 구분해 준비하세요.", sections: [
        { type: "table", title: "서류 준비 목록", columns: ["구분", "준비 내용", "확인처"], rows: [["행사 개요", "행사명·기간·참여진·대상 관객·운영 계획", "해당 공고와 신청서"], ["전시 포트폴리오", "전시 내용을 알 수 있는 도판과 계획. 공식 접수의 PDF 첨부는 30MB 이내", "미술관 대관 절차"], ["무대·설치", "평면도·반입·설치·철수·전력과 장비 요청", "공간별 기술자료"], ["안전", "방염 및 무대 사용 관련 제출 서식", "기술 담당자와 최신 양식"], ["계약", "승인 뒤 계약 주체·사업자 등 필요한 증빙", "승인 통보와 계약 안내"]] },
        { type: "downloads", title: "공연장 준비 양식", items: [{ label: "각종 제출 서식", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 15) }, { label: "방염처리 안내문", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 12) }, { label: "방염 관련 준비 서류", href: file("cd837dc85dcf4e00b051f3db1a9b2177", 13) }] },
        { type: "prose", title: "심사와 제출 시점", paragraphs: ["대관심의위원회가 공고와 제출 계획을 심사합니다. 서류 목록과 제출 기한은 개별 공고의 조건이 우선하며, 계약 이후 필요한 기술·안전 자료와 신청 단계의 자료는 구분해 준비하세요."] },
    ], sources: [source("미술관 포트폴리오 조건", content(200420)), source("공연장 기술·안전 양식", technical), source("대관 심사", procedures)] },
];
