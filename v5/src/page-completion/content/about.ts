import type { CompletionPage } from '../types.ts';

// [공식 기관 자료 주소 / Official institutional source addresses]
const contents = (menu: number): string => `https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=${menu}`;
const forest = (menu: number): string => `https://www.sejongpac.or.kr/dfac/main/contents.do?menuNo=${menu}`;
const company = (code: string, menu: number): string => `https://www.sejongpac.or.kr/portal/sjartgroups/artMember/list.do?bcode=${code}&menuNo=${menu}`;
const file = (id: string, number: number): string => `https://www.sejongpac.or.kr/portal/cmmn/file/fileDown.do?atchFileId=${id}&fileSn=${number}`;
const organization = 'https://www.sejongpac.or.kr/portal/organizationalList/organizationalList/list.do?menuNo=200471';
const disclosure = contents(200528);
const budget = 'https://www.sejongpac.or.kr/portal/bbs/B0000102/view.do?menuNo=200603';
const accounts = 'https://www.sejongpac.or.kr/portal/bbs/B0000113/list.do?menuNo=200614';
const esgReports = 'https://www.sejongpac.or.kr/portal/bbs/B0000123/list.do?menuNo=200633';
const board = 'https://www.sejongpac.or.kr/portal/bbs/B0000105/list.do?menuNo=200606';
const donationReport = 'https://www.sejongpac.or.kr/portal/bbs/B0000118/list.do?menuNo=200617';
const patronsForm = file('a223a62f-42a8-4007-b36f-dd3fd6d0f54b', 1);
const patronsGuide = file('b7d94b1ce7e748f6911cfd1c8b288aaf', 2);
const facade = {
    src: 'https://www.sejongpac.or.kr/cmmn/file/imageSrc.do?fileStreCours=8f2884203bc68b99a313565134d881f5&streFileNm=fe52049bee2203de20659d7fb97d8b27f91317191ed56d5d878495e687f379bf',
    alt: '세종문화회관 건물 전경',
};

// [기관·예술단·책임경영·후원 콘텐츠 / Institutional, company, governance and support content]
// 공식 페이지 확인: 2026-10-23. 인사·편성·담당 연락처의 원문은 각 페이지 sources에 보존한다.
// Official pages checked on 2026-10-23; each entry retains its specific primary sources.
export const ABOUT_COMPLETIONS: CompletionPage[] = [
    {
        path: '/about', title: '세종문화회관',
        summary: '공연을 만들고, 예술을 나누며, 시민의 문화생활을 넓히는 서울의 문화예술기관입니다.',
        image: facade,
        sections: [
            { type: 'prose', title: '시민과 함께하는 제작극장', paragraphs: [
                '세종문화회관은 서울특별시가 설립한 문화예술기관입니다. 1978년 문을 열었으며 1999년 재단법인으로 출범했습니다. 공연·전시·교육을 운영하고 예술가에게는 창작과 발표의 공간을 제공합니다.',
                '서울시예술단의 창작 활동과 여러 규모의 공연장을 바탕으로 작품을 제작합니다. 광화문의 공연장과 미술관, 북서울 꿈의숲아트센터를 통해 다양한 예술 경험을 시민과 나눕니다.',
            ] },
            { type: 'facts', title: '기관 기본 정보', items: [
                { label: '기관명', value: '재단법인 세종문화회관' },
                { label: '개관', value: '1978년 4월 14일' },
                { label: '재단법인 출범', value: '1999년 7월 1일' },
                { label: '주소', value: '서울특별시 종로구 세종대로 175 (세종로), 03172' },
                { label: '대표 문의', value: '02-399-1000' },
            ] },
            { type: 'cards', title: '기관을 알아보세요', items: [
                { id: 'about-introduction', title: '기관 소개', href: '/about/introduction', description: '설립 취지와 세종문화회관이 지향하는 역할' },
                { id: 'about-companies', title: '서울시예술단', href: '/about/companies', description: '국악·무용·뮤지컬·합창·오페라·연극·발레의 창작 활동' },
                { id: 'about-esg', title: 'ESG경영', href: '/about/esg', description: '환경, 사회적 책임, 청렴·윤리경영의 전략과 공개자료' },
                { id: 'about-dfac', title: '꿈의숲아트센터', href: '/about/arts-center', description: '북서울 꿈의숲에서 만나는 공연장과 어린이 미술관' },
            ] },
        ],
        sources: [{ label: '세종문화회관 개요', url: contents(200505) }, { label: '공식 연혁', url: contents(200506) }],
    },
    {
        path: '/about/arts-center', title: '꿈의숲아트센터',
        summary: '북서울 꿈의숲 안에서 공연·미술·산책을 함께 즐길 수 있는 문화공간입니다.',
        sections: [
            { type: 'prose', title: '자연 가까이에서 만나는 예술', paragraphs: [
                '꿈의숲아트센터는 2009년 10월 17일 개관했습니다. 클래식 음악을 위한 콘서트홀, 무대와 객석의 거리가 가까운 퍼포먼스홀, 어린이를 위한 상상톡톡미술관과 전망대가 있습니다.',
                '공연과 전시는 프로그램별 일정과 관람 조건이 다릅니다. 방문 날짜에 맞는 공연·전시와 이용 공지를 확인한 뒤 공원 산책 동선을 함께 계획해 보세요.',
            ] },
            { type: 'table', title: '공간별 특징', columns: ['공간', '이용 목적과 특징'], rows: [
                ['콘서트홀', '어쿠스틱 음악에 맞춘 클래식 전문 공연장. 음향 반사판으로 높이와 각도를 조절합니다.'],
                ['퍼포먼스홀', '무대와 객석 사이에 단이 없는 다목적 공연장. 다양한 장르의 공연을 가까이에서 만납니다.'],
                ['상상톡톡미술관', '자연과 미술을 연결하는 어린이 미술관. 어린이의 눈높이에 맞춘 전시와 프로그램을 선보입니다.'],
                ['전망대', '북한산·도봉산·수락산과 서울 도심을 조망하는 공간입니다.'],
            ] },
            { type: 'image', title: '공간 위치 안내', image: {
                src: 'https://www.sejongpac.or.kr/static/portal/img/content/img_space2_map.png',
                alt: '꿈의숲아트센터 조감도. 전망대, 아트센터, 퍼포먼스홀, 상상톡톡미술관, 드림갤러리의 위치',
            } },
            { type: 'facts', title: '방문 정보', items: [
                { label: '주소', value: '서울특별시 강북구 월계로 173 (번동), 01228' },
                { label: '문의', value: '02-399-1000' },
                { label: '가까운 출입구', value: '북서울 꿈의숲 서문. 동문에서는 아트센터까지 도보 약 10분이 걸립니다.' },
                { label: '지하철 연계', value: '4호선 미아사거리역에서 강북05 또는 1124번 버스로 서문 이동' },
                { label: '주차 확인', value: '아트센터 주차장은 방문자센터 주차장과 별도로 운영됩니다.' },
            ] },
            { type: 'links', title: '방문 전 확인', items: [
                { label: '꿈의숲아트센터 공연·전시', href: 'https://www.sejongpac.or.kr/dfac/main/main.do' },
                { label: '대중교통 안내', href: forest(1200055) },
                { label: '주차 안내', href: forest(1200054) },
                { label: '꿈의숲 대관공고', href: 'https://www.sejongpac.or.kr/dfac/reservation/reservation/list.do?menuNo=1200060' },
            ] },
        ],
        sources: [
            { label: '꿈의숲 공간 소개', url: forest(1200059) }, { label: '콘서트홀', url: forest(1200022) },
            { label: '퍼포먼스홀', url: forest(1200023) }, { label: '상상톡톡미술관', url: forest(1200025) },
            { label: '전망대', url: forest(1200026) }, { label: '오시는 길', url: forest(1200055) },
            { label: '세종문화회관 연혁', url: contents(200506) },
        ],
    },
    {
        path: '/about/companies', title: '서울시예술단',
        summary: '서로 다른 예술 언어로 오늘의 무대를 만드는 서울시예술단을 소개합니다.',
        sections: [
            { type: 'prose', title: '작품을 만드는 예술단', paragraphs: [
                '세종문화회관은 서울시예술단의 창작역량을 기반으로 공연을 제작합니다. 전통음악의 새로운 해석부터 한국 창작춤, 뮤지컬, 합창, 오페라, 연극과 컨템퍼러리 발레까지 장르별 작품을 선보입니다.',
                '예술단별 페이지에서 창단 배경과 공연의 특징을 살펴보세요. 출연진과 관람 연령, 공연 장소는 작품마다 다르므로 관람할 공연의 상세 정보를 함께 확인하는 것이 좋습니다.',
            ] },
            { type: 'cards', title: '예술단 둘러보기', items: [
                { id: 'company-traditional', title: '서울시국악관현악단', href: '/about/companies/traditional', description: '1965년 창단. 전통음악의 계승과 창작 국악관현악', category: '국악' },
                { id: 'company-dance', title: '서울시무용단', href: '/about/companies/dance', description: '1974년 창단. 우리 문화에 뿌리를 둔 한국 창작춤', category: '무용' },
                { id: 'company-musical', title: '서울시뮤지컬단', href: '/about/companies/musical', description: '1961년 예그린악단에서 시작한 창작·가족뮤지컬', category: '뮤지컬' },
                { id: 'company-chorus', title: '서울시합창단', href: '/about/companies/chorus', description: '1978년 창단. 합창 명작과 국내 작곡가 위촉 작품', category: '합창' },
                { id: 'company-opera', title: '서울시오페라단', href: '/about/companies/opera', description: '1985년 창단. 극장과 야외에서 만나는 오페라 제작', category: '오페라' },
                { id: 'company-theater', title: '서울시극단', href: '/about/companies/theater', description: '1997년 창단. 고전·각색·창작·가족극을 아우르는 연극', category: '연극' },
                { id: 'company-ballet', title: '서울시발레단', href: '/about/companies/ballet', description: '2024년 출범. 작품별 프로덕션으로 만드는 컨템퍼러리 발레', category: '발레' },
            ] },
            { type: 'links', title: '공연과 참여', items: [
                { label: '공연 일정', href: '/programs' },
                { label: '세종시즌', href: '/programs/season/sejong' },
                { label: '예술단 채용 공고', href: '/news/notices/recruit' },
            ] },
        ],
        sources: [
            { label: '서울시국악관현악단', url: company('TRADITION', 200261) }, { label: '서울시무용단', url: company('DANCE', 200262) },
            { label: '서울시뮤지컬단', url: company('MUSICAL', 200264) }, { label: '서울시합창단', url: company('CHORUS', 200263) },
            { label: '서울시오페라단', url: company('OPERA', 200266) }, { label: '서울시극단', url: company('THEATER', 200265) },
            { label: '서울시발레단', url: company('BALLET', 200580) },
        ],
    },
    {
        path: '/about/companies/ballet', title: '서울시발레단',
        summary: '동시대의 안무와 작품을 중심으로 새로운 발레 무대를 만듭니다.',
        sections: [
            { type: 'prose', title: '작품마다 새롭게 구성하는 발레', paragraphs: [
                '2024년 출범한 서울시발레단은 공공 컨템퍼러리 발레단입니다. 안무가와 무용수, 작품을 중심에 두고 공연별 맞춤형 프로덕션으로 운영합니다.',
                '국내외 창작진과 무용수가 동시대의 성찰을 담은 작품을 선보입니다. 시즌 무용수와 객원 무용수, 안무가, 예술스태프의 구성은 공식 예술단 페이지에서 확인할 수 있습니다.',
            ] },
            { type: 'facts', title: '활동 정보', items: [
                { label: '출범', value: '2024년' }, { label: '중심 장르', value: '컨템퍼러리 발레' },
                { label: '운영 방식', value: '공연별 맞춤형 프로덕션' }, { label: '공식 인스타그램', value: '@seoulmetropolitanballet' },
            ] },
            { type: 'table', title: '2026년 공식 편성', columns: ['작품', '일정', '장소'], rows: [
                ['더블 빌 Bliss & Jakie', '3월 14일–22일', '세종M씨어터'],
                ['In the Bamboo Forest', '5월 15일–17일', '세종M씨어터'],
                ['더블 빌 죽음과 소녀', '8월 14일–16일', '국립극장 해오름극장'],
                ['트리플 빌 올 포 한스 판 마넨', '11월 19일–22일', '세종M씨어터'],
            ], note: '예술단 공식 소개에 게시된 편성입니다. 예매 가능 여부와 출연진은 개별 공연에서 확인해 주세요.' },
            { type: 'links', title: '무용수와 창작진', items: [
                { label: '공식 예술단·시즌 무용수 소개', href: company('BALLET', 200580) },
                { label: '서울시발레단 소개북', href: 'https://www.sejongpac.or.kr/e-book/ecatalog5.jsp?Dir=100&catimage=' },
                { label: '공연 일정 살펴보기', href: '/programs' },
            ] },
        ],
        sources: [{ label: '서울시발레단 소개·2026 공연 편성', url: company('BALLET', 200580) }],
        relatedPrograms: { title: '서울시발레단 공연', query: '서울시발레단' },
    },
    {
        path: '/about/companies/chorus', title: '서울시합창단',
        summary: '목소리가 어우러지는 합창의 깊이와 새로운 무대 형식을 선보입니다.',
        sections: [
            { type: 'prose', title: '합창 명작에서 동시대 작품까지', paragraphs: [
                '서울시합창단은 1978년 세종문화회관 개관과 함께 창단했습니다. 합창 음악의 발전과 시민의 정서함양을 목적으로 활동합니다.',
                '음악사적 걸작과 국내외 작곡가의 다양한 합창곡, 국내 작곡가 위촉 작품을 함께 다룹니다. 오케스트라와 함께하는 교향악적 합창 대작뿐 아니라 다른 장르를 접목한 합창 콘서트도 선보입니다.',
            ] },
            { type: 'facts', title: '예술단 정보', items: [
                { label: '창단', value: '1978년' }, { label: '단장', value: '이영만' },
                { label: '구성', value: '소프라노·알토·테너·베이스와 반주' },
                { label: '문의', value: '02-399-1726' }, { label: '공식 인스타그램', value: '@sejongcenter_smchorus' },
            ] },
            { type: 'prose', title: '단원과 음악을 만나는 방법', paragraphs: [
                '공식 소개에서 성부별 단원과 반주자 프로필을 볼 수 있습니다. 서울시소년소녀합창단은 같은 공식 메뉴 안의 별도 탭으로 소개됩니다.',
                '곡목에 따라 합창단 단독 연주 또는 기악 연주자와의 협연으로 편성됩니다. 공연 상세에서 작곡가·곡목·지휘·협연진을 살펴보면 무대의 구성을 미리 이해할 수 있습니다.',
            ] },
            { type: 'links', title: '공식 자료', items: [
                { label: '단원 소개와 합창단 공연', href: company('CHORUS', 200263) },
                { label: '서울시소년소녀합창단 소개', href: company('JUNIOR', 200263) },
            ] },
        ],
        sources: [{ label: '서울시합창단 소개·단장·성부별 단원', url: company('CHORUS', 200263) }],
        relatedPrograms: { title: '합창 공연', category: '합창', query: '서울시합창단' },
    },
    {
        path: '/about/companies/dance', title: '서울시무용단',
        summary: '우리 문화에 뿌리를 두고 한국 창작춤의 표현을 넓혀갑니다.',
        sections: [
            { type: 'prose', title: '한국 창작춤의 무대', paragraphs: [
                '1974년 창단한 서울시무용단은 한국의 문화와 춤을 바탕으로 창작 활동을 이어왔습니다. 예술단체의 사회적 역할을 고민하며 국내외 무대에서 작품을 선보입니다.',
                '1984년 LA 올림픽 폐막식과 1990년 북경 아시안게임 예술축전 등 국제행사에 참여했고, 해외 순회공연과 문화예술축전을 통해 한국 춤을 소개해 왔습니다.',
            ] },
            { type: 'facts', title: '예술단 정보', items: [
                { label: '창단', value: '1974년' }, { label: '단장', value: '윤혜정' },
                { label: '문의', value: '02-399-1765' }, { label: '공식 인스타그램', value: '@seoulmetropolitandancetheatre' },
            ] },
            { type: 'table', title: '2026년 공식 편성', columns: ['작품', '일정', '장소'], rows: [
                ['스피드', '5월 1일–3일', '세종M씨어터'], ['무감서기', '9월 10일–13일', '세종대극장'],
            ], note: '공식 예술단 소개에 게시된 편성입니다. 작품별 안무와 출연진은 공연 상세를 확인해 주세요.' },
            { type: 'links', title: '창작진과 공연', items: [
                { label: '단장·단원 프로필', href: company('DANCE', 200262) }, { label: '공연 일정', href: '/programs' },
            ] },
        ],
        sources: [{ label: '서울시무용단 소개·2026 공연 편성', url: company('DANCE', 200262) }],
        relatedPrograms: { title: '서울시무용단 공연', category: '무용', query: '서울시무용단' },
    },
    {
        path: '/about/companies/musical', title: '서울시뮤지컬단',
        summary: '창작뮤지컬과 온 가족이 함께 보는 작품으로 관객을 만납니다.',
        sections: [
            { type: 'prose', title: '예그린악단에서 이어온 뮤지컬', paragraphs: [
                '서울시뮤지컬단은 1961년 창단한 예그린악단을 모태로 합니다. 창작극을 개발하며 한국 창작뮤지컬의 활성화에 기여하고, 가족뮤지컬을 통해 공연 관객의 폭을 넓혀왔습니다.',
                '서울시가무단, 국립가무단, 서울시립가무단을 거쳐 1999년 세종문화회관의 재단법인 출범과 함께 현재의 명칭을 사용하게 되었습니다. 한국적 소재의 창작 작품과 해외 뮤지컬을 함께 소개합니다.',
            ] },
            { type: 'facts', title: '예술단 정보', items: [
                { label: '출발', value: '1961년 예그린악단' }, { label: '현재 명칭', value: '1999년부터 서울시뮤지컬단' },
                { label: '단장', value: '김덕희' }, { label: '문의', value: '02-399-1732' },
                { label: '공식 인스타그램', value: '@smmt.musical' },
            ] },
            { type: 'table', title: '2026년 공식 편성', columns: ['작품', '일정', '장소'], rows: [
                ['더 트라이브', '6월 9일–27일', '세종M씨어터'], ['크리스마스 캐럴', '12월 2일–27일', '세종M씨어터'],
            ], note: '관람 연령·할인·캐스팅·예매 상태는 각 공연 상세에서 확인해 주세요.' },
            { type: 'links', title: '예술단을 더 알아보세요', items: [
                { label: '서울시뮤지컬단 단원·작품 소개', href: company('MUSICAL', 200264) },
                { label: '공연 예매 안내', href: '/programs/booking-guide' },
            ] },
        ],
        sources: [{ label: '서울시뮤지컬단 소개·2026 공연 편성', url: company('MUSICAL', 200264) }],
        relatedPrograms: { title: '서울시뮤지컬단 공연', category: '뮤지컬', query: '서울시뮤지컬단' },
    },
    {
        path: '/about/companies/opera', title: '서울시오페라단',
        summary: '극장과 야외 무대에서 시민에게 가까이 다가가는 오페라를 제작합니다.',
        sections: [
            { type: 'prose', title: '다양한 관객을 위한 오페라 제작', paragraphs: [
                '1985년 창단한 서울시오페라단은 오페라 애호가와 입문자를 함께 만나는 공연을 제작합니다. 작품의 예술성과 관객의 접근성을 함께 고민하며 오페라 관객층을 넓혀왔습니다.',
                '극장 공연과 야외오페라를 통해 시민의 문화향유 기회를 확대합니다. 같은 오페라도 공연별로 연출과 성악가, 오케스트라, 장소가 달라지므로 개별 작품의 제작 정보를 살펴보세요.',
            ] },
            { type: 'facts', title: '예술단 정보', items: [
                { label: '창단', value: '1985년' }, { label: '중심 활동', value: '오페라 제작·야외오페라·갈라 공연' },
                { label: '문의', value: '02-399-1783' }, { label: '공식 인스타그램', value: '@seoul_metropolitan_opera' },
            ] },
            { type: 'table', title: '2026년 공식 편성', columns: ['작품', '일정', '장소'], rows: [
                ['나부코', '4월 9일–12일', '세종대극장'],
                ['제4회 야외오페라 라 트라비아타', '5월 22일–23일', '여의도 한강공원 물빛무대'],
                ['라보엠', '11월 5일–8일', '세종대극장'], ['오페라 갈라', '12월 12일', '세종대극장'],
            ], note: '예술단 공식 편성입니다. 야외 공연의 입장 방식과 운영 공지는 해당 공연에서 확인해 주세요.' },
            { type: 'links', title: '작품과 예술단 정보', items: [
                { label: '서울시오페라단 공식 소개', href: company('OPERA', 200266) }, { label: '공연 일정', href: '/programs' },
            ] },
        ],
        sources: [{ label: '서울시오페라단 소개·2026 공연 편성', url: company('OPERA', 200266) }],
        relatedPrograms: { title: '서울시오페라단 공연', category: '오페라', query: '서울시오페라단' },
    },
    {
        path: '/about/companies/theater', title: '서울시극단',
        summary: '고전과 창작극을 통해 시민과 동시대의 질문을 나누는 연극을 만듭니다.',
        sections: [
            { type: 'prose', title: '시민과 함께 생각하는 연극', paragraphs: [
                '서울시극단은 시민의 문화수요를 충족하고 수준 높은 연극을 제공하기 위해 1997년 창단했습니다. 연극의 공공성과 미학, 보편적인 주제를 통한 대중적 가치를 지향합니다.',
                '고전극과 장르를 넘나드는 각색극, 동시대를 다른 시선으로 바라보는 창작극, 가족극을 선보여 왔습니다. 시민연극교실과 신진예술가 발굴을 통해 관객의 참여와 창작환경의 확대에도 힘씁니다.',
            ] },
            { type: 'facts', title: '예술단 정보', items: [
                { label: '창단', value: '1997년' }, { label: '단장', value: '이준우' },
                { label: '문의', value: '02-399-1133' }, { label: '공식 인스타그램', value: '@smt_theatre' },
            ] },
            { type: 'table', title: '2026년 공식 편성', columns: ['작품', '일정', '장소'], rows: [
                ['빅 마더', '3월 30일–4월 25일', '세종M씨어터'], ['에너미', '10월 26일–11월 14일', '세종M씨어터'],
            ], note: '회차별 공연 시간, 관람 연령과 캐스팅은 공연 상세를 기준으로 확인해 주세요.' },
            { type: 'links', title: '연극과 참여 소식', items: [
                { label: '서울시극단 단원·작품 소개', href: company('THEATER', 200265) },
                { label: '시민 참여·모집 소식', href: '/news/notices' },
            ] },
        ],
        sources: [{ label: '서울시극단 소개·2026 공연 편성', url: company('THEATER', 200265) }],
        relatedPrograms: { title: '서울시극단 공연', category: '연극', query: '서울시극단' },
    },
    {
        path: '/about/companies/traditional', title: '서울시국악관현악단',
        summary: '전통음악을 계승하고 새로운 창작곡으로 국악관현악의 가능성을 넓힙니다.',
        sections: [
            { type: 'prose', title: '전통과 현재를 잇는 관현악', paragraphs: [
                '서울시국악관현악단은 국악관현악의 현대화·대중화·세계화를 목표로 1965년 창단한 대한민국 최초의 국악관현악단입니다. 전통음악을 창조적으로 계승하고 새로운 국악관현악 작품을 선보여 왔습니다.',
                '관현악곡과 협주곡, 실내악을 연주하고 다른 장르의 예술가들과 협업합니다. 전통 악기의 소리를 바탕으로 오늘의 감각을 담은 창작곡을 만날 수 있습니다.',
            ] },
            { type: 'facts', title: '예술단 정보', items: [
                { label: '창단', value: '1965년' }, { label: '단장', value: '이승훤' },
                { label: '문의', value: '02-399-1761' }, { label: '공식 인스타그램', value: '@sejongcenter_smto' },
            ] },
            { type: 'table', title: '2026년 공식 편성', columns: ['작품', '일정', '장소'], rows: [
                ['믹스드 오케스트라 26', '4월 16일', '세종대극장'],
                ['Re-프로젝트 형식의 재발견', '5월 29일', '세종M씨어터'],
                ['실내악 시리즈 일노래', '7월 3일', '세종체임버홀'],
                ['창작 국악 시리즈 신풍류전', '9월 4일', '세종M씨어터'], ['송년 음악회', '12월 10일', '세종대극장'],
            ], note: '예매 여부와 곡목·지휘·협연자는 개별 공연 상세에서 확인해 주세요.' },
            { type: 'links', title: '공식 자료', items: [
                { label: '예술단원·수석객원지휘자·상주작곡가 소개', href: company('TRADITION', 200261) },
                { label: '공연 일정', href: '/programs' },
            ] },
        ],
        sources: [{ label: '서울시국악관현악단 소개·2026 공연 편성', url: company('TRADITION', 200261) }],
        relatedPrograms: { title: '국악관현악 공연', category: '국악', query: '서울시국악관현악단' },
    },
    {
        path: '/about/disclosure', title: '정보공개',
        summary: '사업·예산·결산·회의록 등 기관 운영 자료와 정보공개청구 경로를 안내합니다.',
        sections: [
            { type: 'prose', title: '공개자료 찾기', paragraphs: [
                '세종문화회관은 사전공표목록을 통해 공개항목과 공표주기, 시기, 담당 부서를 안내합니다. 이미 공개된 정보는 항목별 자료실에서 바로 확인할 수 있습니다.',
                '연간 계획은 주요업무계획과 예산에서, 집행 결과는 결산보고서와 운영보고서에서 살펴보세요. 필요한 기록을 공개자료에서 찾기 어려운 경우 정보공개포털의 청구 절차를 이용할 수 있습니다.',
            ] },
            { type: 'table', title: '주요 사전공표 항목', columns: ['항목', '공표주기·시기', '담당 부서'], rows: [
                ['사업설명서·예산', '연 1회 · 1월', '기획조정팀'], ['주요업무계획', '연 1회 · 3월', '기획조정팀'],
                ['경영실적 평가결과·ESG 경영 보고서', '연 1회 · 12월', '기획조정팀'],
                ['이사회 회의록', '회의 개최 시', '기획조정팀'], ['업무추진비·정보목록', '월별', '재무행정팀'],
                ['조직도', '조직 개편 시', '기획조정팀'],
            ], note: '공식 사전공표목록의 안내 기준입니다. 자료 게시 여부와 상세 항목은 원문 자료실에서 확인해 주세요.' },
            { type: 'cards', title: '목적에 맞게 확인하세요', items: [
                { id: 'disclosure-management', title: '경영공시', href: '/about/disclosure/management', description: '예산·결산·경영평가와 공개 재무자료' },
                { id: 'disclosure-ethics', title: '윤리경영', href: '/about/disclosure/ethics', description: '윤리헌장, 임직원행동강령과 부조리 신고 안내' },
                { id: 'disclosure-request', title: '정보공개청구', href: '/about/disclosure/request', description: '청구 전 확인할 자료와 공식 접수 경로' },
            ] },
            { type: 'links', title: '공식 자료실', items: [
                { label: '사전공표목록 전체', href: disclosure }, { label: '이사회 회의록', href: board },
                { label: '기부금 모금·활용실적', href: donationReport },
            ] },
        ],
        sources: [{ label: '정보공개 사전공표목록', url: disclosure }],
    },
    {
        path: '/about/disclosure/ethics', title: '윤리경영',
        summary: '공정한 조직문화와 투명한 운영을 위한 윤리기준·예방활동·신고 경로입니다.',
        sections: [
            { type: 'prose', title: '시민의 신뢰를 위한 운영 원칙', paragraphs: [
                '세종문화회관의 윤리헌장은 합법적이고 투명한 경영, 문화예술의 창작·보급, 시민공연과 예술교육, 해외 문화교류를 통한 사회적 책임을 제시합니다.',
                '윤리경영 추진전략은 부패 사전예방, 자문·진단 감사, 공직기강 확립을 중심으로 운영됩니다. 윤리교육과 제도개선, 정기·수시·일상감사, 시설 안전점검 등을 추진과제로 안내합니다.',
            ] },
            { type: 'table', title: '규범과 확인할 내용', columns: ['공식 자료', '내용'], rows: [
                ['윤리헌장', '공공 문화예술기관으로서 지켜야 할 가치와 실천 방향'],
                ['임직원행동강령', '직무 수행 과정에서 준수할 행동기준'],
                ['청렴계약제', '공정한 계약을 위한 청렴 기준'],
                ['신고자 보상내규', '비윤리행위 신고자 보호와 보상에 관한 기준'],
            ] },
            { type: 'facts', title: '부조리 신고 안내', items: [
                { label: '주요 대상', value: '입찰 피해, 예산낭비, 계약 관계의 부당행위, 임직원 비리' },
                { label: '작성 내용', value: '신고자·위반자 정보, 언제·어디서·어떤 일이 있었는지에 대한 구체적인 내용과 관련 자료' },
                { label: '감사관 전용 전화', value: '02-399-1170' }, { label: '팩스', value: '02-399-1175' },
            ] },
            { type: 'links', title: '규범 원문과 공식 신고', items: [
                { label: '윤리헌장', href: contents(200551) }, { label: '임직원행동강령', href: contents(200552) },
                { label: '청렴계약제', href: contents(200553) }, { label: '신고자 보상내규', href: contents(200554) },
                { label: '부조리 신고센터', href: contents(200517) }, { label: '윤리경영 추진전략', href: contents(200521) },
            ] },
        ],
        sources: [
            { label: '윤리헌장', url: contents(200551) }, { label: '윤리경영 추진전략', url: contents(200521) },
            { label: '부조리 신고센터', url: contents(200517) },
        ],
    },
    {
        path: '/about/disclosure/management', title: '경영공시',
        summary: '기관의 계획과 집행 결과를 예산·결산·평가 자료로 확인할 수 있습니다.',
        sections: [
            { type: 'prose', title: '계획과 결과를 함께 읽으세요', paragraphs: [
                '사업설명서와 주요업무계획은 기관이 추진하는 사업을, 예산은 해당 연도의 재원과 지출 계획을 보여줍니다. 회계결산보고서와 재무상태표·운영성과표는 회계연도별 결과를 확인하는 자료입니다.',
                '공시 자료를 비교할 때에는 회계연도와 자료명을 먼저 확인해 주세요. 당초 예산과 집행 결과는 구분해 읽고, 세부 금액과 주석은 공식 첨부 원문을 기준으로 확인할 수 있습니다.',
            ] },
            { type: 'table', title: '자료별 활용', columns: ['알고 싶은 내용', '확인할 자료'], rows: [
                ['연간 사업의 방향과 구성', '사업설명서·주요업무계획'], ['한 해의 재정 계획', '세종문화회관 예산'],
                ['회계연도별 재정 결과', '회계결산보고서·재무상태표·운영성과표'],
                ['기관 운영 평가', '경영실적 평가결과·고객만족도 조사결과'],
                ['의사결정 기록', '이사회 회의록'], ['후원금 활용', '기부금 모금·활용실적'],
            ] },
            { type: 'links', title: '공시 원문 자료실', items: [
                { label: '사업설명서', href: 'https://www.sejongpac.or.kr/portal/bbs/B0000100/list.do?menuNo=200597' },
                { label: '주요업무계획', href: 'https://www.sejongpac.or.kr/portal/bbs/B0000101/list.do?menuNo=200600' },
                { label: '예산', href: budget }, { label: '회계결산보고서', href: accounts, description: '2025·2024·2023·2022 회계연도 보고서가 게시되어 있습니다.' },
                { label: '경영실적 평가결과', href: 'https://www.sejongpac.or.kr/portal/bbs/B0000103/view.do?menuNo=200604' },
                { label: '이사회 회의록', href: board }, { label: '기부금 모금·활용실적', href: donationReport },
                { label: 'ESG 경영 보고서', href: esgReports },
            ] },
        ],
        sources: [
            { label: '공식 사전공표목록', url: disclosure }, { label: '예산 공개', url: budget },
            { label: '회계결산보고서 목록', url: accounts },
        ],
    },
    {
        path: '/about/disclosure/request', title: '정보공개청구',
        summary: '먼저 공개자료를 확인한 뒤, 필요한 기록을 정보공개포털에서 청구할 수 있습니다.',
        sections: [
            { type: 'prose', title: '청구 전에 확인하세요', paragraphs: [
                '세종문화회관 사전공표목록에는 공개된 경영·재정·회의 자료의 위치가 안내되어 있습니다. 자료가 이미 공개되어 있다면 해당 자료실에서 바로 열람하는 것이 빠릅니다.',
                '공식 정보공개청구 접수 경로는 정보공개포털입니다. 청구기관을 선택하고 필요한 기록의 제목, 대상 기간과 범위를 구체적으로 작성해 주세요. 접수와 처리 내역은 포털에서 확인합니다.',
            ] },
            { type: 'timeline', title: '청구 준비와 접수', items: [
                { date: '1', title: '사전공표목록 검색', body: '예산·결산·업무계획·정보목록 등 이미 게시된 자료를 찾습니다.' },
                { date: '2', title: '기록의 범위 정리', body: '필요한 문서명이나 사업명, 대상 연도·기간, 확인하려는 항목을 정리합니다.' },
                { date: '3', title: '정보공개포털에서 청구', body: '포털 안내에 따라 청구기관과 공개 방법을 선택하고 신청합니다.' },
                { date: '4', title: '처리 내역 확인', body: '청구번호를 보관하고 포털의 통지·보완 요청·결정 내용을 확인합니다.' },
            ] },
            { type: 'faq', title: '문의 유형에 맞는 창구', items: [
                { question: '예매 변경이나 공연 문의도 정보공개청구로 하나요?', answer: '공연·예매·시설 이용에 관한 문의는 고객문의 또는 대표전화 02-399-1000을 이용해 주세요. 정보공개청구는 기관이 보유한 기록의 공개를 요청하는 절차입니다.' },
                { question: '공개가 제한되는 정보는 어디서 확인하나요?', answer: '공식 정보공개 메뉴의 비공개 대상정보를 참고하세요. 개별 청구의 공개 범위와 결정 내용은 접수기관의 통지를 확인해야 합니다.' },
            ] },
            { type: 'links', title: '공식 접수와 자료 확인', items: [
                { label: '정보공개포털에서 청구', href: 'https://www.open.go.kr/com/main/mainView.do' },
                { label: '세종문화회관 사전공표목록', href: disclosure },
                { label: '비공개 대상정보', href: 'https://www.sejongpac.or.kr/portal/bbs/B0000107/view.do?menuNo=200608' },
                { label: '공연·이용 문의', href: '/visit/support/inquiry' },
            ] },
        ],
        sources: [{ label: '사전공표목록·공식 정보공개청구 연결', url: disclosure }],
    },
    {
        path: '/about/donation', title: '후원 안내',
        summary: '세종문화회관의 발전과 문화예술 향유 기회 확대에 함께하는 후원회입니다.',
        sections: [
            { type: 'prose', title: '예술의 기반을 함께 만듭니다', paragraphs: [
                '세종문화회관 후원회는 회관 발전을 위한 기금을 마련하고 문화예술 향유 계층과 메세나 활동을 확대하기 위해 활동합니다. 회원 간 친교와 예술인과의 교류도 이어갑니다.',
                '개인과 법인 회원을 구분해 운영하며 후원금에 따른 등급과 예우 프로그램을 안내합니다. 가입 전 담당자에게 후원 목적과 회원 유형을 상담하고, 공식 안내문에서 적용 기준을 확인해 주세요.',
            ] },
            { type: 'timeline', title: '공식 가입 절차', items: [
                { date: '1', title: '가입신청서 제출', body: '공식 가입신청서를 작성해 후원회 담당자에게 제출합니다.' },
                { date: '2', title: '운영진 승인', body: '후원회 운영진의 가입 승인 절차를 거칩니다.' },
                { date: '3', title: '후원금 납부', body: '승인 후 담당자가 안내하는 방식으로 납부합니다.' },
                { date: '4', title: '가입 완료', body: '후원회 가입과 해당 예우 프로그램을 안내받습니다.' },
            ] },
            { type: 'facts', title: '후원회 연락처', items: [
                { label: '전화', value: '02-399-1722, 02-399-1724' }, { label: '팩스', value: '02-399-1798' },
                { label: '이메일', value: 'sponsorship@sejongpac.or.kr' },
                { label: '공통 예우 안내', value: '총회와 후원회 음악회 초대, 기부금 영수증 발급, 세종문화N 구독 등. 세부 조건은 공식 안내문을 확인해 주세요.' },
            ] },
            { type: 'downloads', title: '후원회 공식 서식', items: [
                { label: '후원회 가입신청서', href: patronsForm }, { label: '후원회 안내', href: patronsGuide, description: '회원 등급과 예우 프로그램을 확인할 수 있습니다.' },
            ] },
            { type: 'links', title: '상담과 공개자료', items: [
                { label: '후원 상담 신청', href: '/about/donation/apply' },
                { label: '기부금 모금·활용실적', href: donationReport }, { label: '공식 후원회 소개', href: contents(200514) },
            ] },
        ],
        sources: [{ label: '후원회 소개·가입 절차·문의', url: contents(200514) }, { label: '기부금 모금·활용실적', url: donationReport }],
    },
    {
        path: '/about/donation/apply', title: '후원 상담 신청',
        summary: '후원 목적과 관심 분야를 남겨주시면 상담에 필요한 내용을 확인할 수 있습니다.',
        sections: [
            { type: 'prose', title: '어떤 후원을 생각하고 계신가요?', paragraphs: [
                '개인 후원, 법인 후원, 후원회 가입 등 상담하려는 유형과 관심 분야를 적어 주세요. 후원 대상이나 시기를 아직 정하지 않았다면 검토 중인 내용을 편하게 남기실 수 있습니다.',
                '이 신청은 후원 상담을 위한 접수입니다. 후원회 가입은 공식 가입신청서 제출, 운영진 승인, 후원금 납부 절차를 거쳐 완료됩니다. 접수만으로 가입이나 결제가 완료되지는 않습니다.',
            ] },
            { type: 'facts', title: '상담을 위해 준비할 내용', items: [
                { label: '신청 주체', value: '개인 또는 법인·단체명, 담당자 이름' }, { label: '연락 방법', value: '회신받을 이메일과 연락처' },
                { label: '후원 관심 내용', value: '관심 있는 예술 활동, 후원의 목적, 희망 시기' },
                { label: '예산·금액', value: '검토 중인 범위가 있으면 본문에 기재해 주세요.' },
            ] },
            { type: 'downloads', title: '정식 가입을 위한 자료', items: [
                { label: '후원회 가입신청서', href: patronsForm }, { label: '후원회 안내문', href: patronsGuide },
            ] },
            { type: 'links', title: '담당자에게 직접 문의', items: [
                { label: '후원회 전화 02-399-1722', href: 'tel:02-399-1722' },
                { label: '후원회 이메일', href: 'mailto:sponsorship@sejongpac.or.kr' },
            ] },
        ],
        form: { kind: 'donation', title: '후원 상담 신청', description: '후원 유형과 관심 분야, 희망하는 상담 내용을 작성해 주세요.' },
        sources: [{ label: '후원회 공식 신청 절차·문의', url: contents(200514) }],
    },
    {
        path: '/about/esg', title: 'ESG경영',
        summary: '환경을 생각하고, 예술의 기회를 넓히고, 신뢰받는 기관 운영을 실천합니다.',
        sections: [
            { type: 'prose', title: '지속가능한 예술 생태계를 향해', paragraphs: [
                '세종문화회관은 시민과 예술을 잇는 문화 플랫폼으로서 지속가능한 예술 생태계를 이끄는 것을 ESG 미션으로 제시합니다. 비전은 누구나 예술을 누리면서 함께 지속하는 문화예술기관을 만드는 것입니다.',
                '친환경 경영, 동반·상생의 사회적 책임 경영, 청렴·윤리 경영의 세 영역에 10대 전략과제를 두고 있습니다. 구체적인 연간 활동과 실적은 ESG 경영 보고서에서 확인할 수 있습니다.',
            ] },
            { type: 'cards', title: '세 가지 실천 영역', items: [
                { id: 'esg-environment', title: '환경', href: '/about/esg/environment', description: '에너지 효율, 폐기물 감축, 지속가능한 공연 제작' },
                { id: 'esg-social', title: '사회', href: '/about/esg/social', description: '예술 접근성, 약자와의 동행, 안전·인권과 상생협력' },
                { id: 'esg-governance', title: '지배구조', href: '/about/esg/governance', description: '청렴·준법, 정보공개, ESG 성과관리' },
            ] },
            { type: 'links', title: '전략과 활동 원문', items: [
                { label: '공식 ESG경영 전략체계', href: contents(200632) },
                { label: 'ESG 경영 보고서', href: esgReports, description: '2025년·2024년 보고서가 게시되어 있습니다.' },
                { label: '경영공시', href: '/about/disclosure/management' },
            ] },
        ],
        sources: [{ label: 'ESG경영 전략체계', url: contents(200632) }, { label: 'ESG 경영 보고서 목록', url: esgReports }],
    },
    {
        path: '/about/esg/environment', title: '환경경영',
        summary: '공간 운영과 공연 제작 과정에서 환경 부담을 줄이는 방향을 제시합니다.',
        sections: [
            { type: 'table', title: '환경 분야의 세 가지 전략과제', columns: ['과제', '추진 방향'], rows: [
                ['탄소중립과 에너지 효율', '공연장과 시설 운영에서 에너지 효율을 높이고 탄소중립을 고려합니다.'],
                ['친환경 운영과 폐기물 감축', '기관 운영 과정의 환경 부담과 폐기물 발생을 줄이는 방향입니다.'],
                ['지속가능한 공연 제작', '작품 제작과 운영의 지속가능성을 높이는 체계를 확대합니다.'],
            ], note: '공식 ESG 전략과제의 취지를 정리했습니다. 연도별 이행 실적과 산정 기준은 ESG 경영 보고서 원문을 확인해 주세요.' },
            { type: 'prose', title: '관람할 때 함께할 수 있는 일', paragraphs: [
                '공연장 방문 시 대중교통을 이용하고, 현장의 분리배출 안내에 맞춰 쓰레기를 배출해 주세요. 필요할 때 모바일 예매 내역과 온라인 공연 정보를 활용하면 종이 사용을 줄이는 데 도움이 됩니다.',
                '친환경 운영의 실제 성과는 목표와 구분해 살펴보는 것이 좋습니다. 연간 보고서를 읽을 때에는 보고 대상 기간, 에너지·배출량의 측정 범위와 이전 연도 비교 기준을 함께 확인해 보세요.',
            ] },
            { type: 'links', title: '관련 자료와 방문 정보', items: [
                { label: 'ESG 경영 보고서', href: esgReports }, { label: 'ESG 전략체계', href: contents(200632) },
                { label: '대중교통으로 오시는 길', href: '/visit/directions' },
            ] },
        ],
        sources: [{ label: '환경 분야 ESG 전략과제', url: contents(200632) }, { label: '연간 ESG 경영 보고서', url: esgReports }],
    },
    {
        path: '/about/esg/governance', title: '투명경영',
        summary: '청렴·준법과 정보공개를 바탕으로 시민의 신뢰를 높입니다.',
        sections: [
            { type: 'table', title: '지배구조 분야 전략과제', columns: ['과제', '확인할 내용'], rows: [
                ['청렴·준법과 내부통제', '윤리경영 추진전략, 임직원행동강령, 감사·신고 제도'],
                ['시민참여와 정보공개', '사전공표목록, 예산·결산·업무추진비, 이사회 회의록'],
                ['ESG 운영·성과관리', 'ESG 전략체계와 연간 경영 보고서'],
            ] },
            { type: 'prose', title: '의사결정과 운영자료 공개', paragraphs: [
                '기관의 공식 조직도에서 이사회와 사장, 본부·부서 구성을 확인할 수 있습니다. 이사회 회의록은 회의 개최 시 공개하는 사전공표 항목입니다.',
                '윤리기준은 윤리헌장과 임직원행동강령 등으로 안내하고 있습니다. 입찰 피해나 예산낭비, 부당한 계약 관계, 임직원 비리 관련 신고는 공식 부조리 신고센터에서 접수합니다.',
            ] },
            { type: 'links', title: '투명경영 확인 경로', items: [
                { label: '조직과 이사회', href: '/about/introduction/organization' }, { label: '이사회 회의록 원문', href: board },
                { label: '경영공시 자료', href: '/about/disclosure/management' }, { label: '윤리경영·신고 안내', href: '/about/disclosure/ethics' },
                { label: 'ESG 경영 보고서', href: esgReports },
            ] },
        ],
        sources: [
            { label: 'ESG 전략과제', url: contents(200632) }, { label: '조직도', url: organization },
            { label: '사전공표목록', url: disclosure }, { label: '부조리 신고센터', url: contents(200517) },
        ],
    },
    {
        path: '/about/esg/social', title: '사회적 책임',
        summary: '문화예술의 접근성을 높이고 안전·인권·상생을 함께 살핍니다.',
        sections: [
            { type: 'facts', title: '사회 분야 전략과제', items: [
                { label: '접근환경', value: '예술공간에 접근하기 쉽도록 환경과 이용 편의를 개선합니다.' },
                { label: '문화향유', value: '약자와 동행하며 문화예술을 경험할 기회를 넓힙니다.' },
                { label: '안전과 인권', value: '안전과 인권을 중심에 두고 기관을 운영합니다.' },
                { label: '상생', value: '일자리와 포용적인 조직문화를 만들고 협력 주체와 상생합니다.' },
            ] },
            { type: 'prose', title: '일상 속에서 누리는 예술', paragraphs: [
                '사회공헌 프로그램 「모든 누구나」는 시민의 문화예술 경험을 넓히기 위한 사업입니다. 「누구나 클래식」은 해설을 더한 공연과 관람료 선택제를, 「누구나 꿈나무오케스트라」는 저소득층·다문화 가정 유·청소년의 예술교육 기회를 제공합니다.',
                '「누구나 세종썸머페스티벌」은 시민을 위한 야외 공연예술 축제입니다. 프로그램별 참가 대상과 일정, 신청 방식은 각 사업의 공지를 확인해 주세요.',
            ] },
            { type: 'prose', title: '이용자와 일하는 사람의 인권', paragraphs: [
                '세종문화회관은 기관의 경영활동과 사업 수행에서 인간의 존엄과 가치를 중시하는 인권경영을 안내합니다. 임직원·협력사·지역주민 등 이해관계자의 인권침해 요인을 조사하고 예방하며, 피해자 구제제도를 통해 권리를 보호하는 방향입니다.',
            ] },
            { type: 'links', title: '참여와 권리 보호', items: [
                { label: '모든 누구나 사업 소개', href: contents(200446) }, { label: '장애인·접근성 이용 안내', href: '/visit/accessibility' },
                { label: '인권경영 소개', href: contents(200524) }, { label: '인권침해신고센터', href: contents(200654) },
                { label: 'ESG 경영 보고서', href: esgReports },
            ] },
        ],
        sources: [
            { label: '사회 분야 ESG 전략과제', url: contents(200632) }, { label: '모든 누구나 소개', url: contents(200446) },
            { label: '인권경영이란?', url: contents(200524) },
        ],
    },
    {
        path: '/about/introduction/ci', title: 'CI 소개',
        summary: '세종문화회관의 건축과 한글에서 출발한 심볼, 로고와 색상 체계를 소개합니다.',
        sections: [
            { type: 'image', title: '공식 심볼마크', image: {
                src: 'https://www.sejongpac.or.kr/static/portal/img/content/ci_0101.png', alt: '세종문화회관 공식 심볼마크',
            } },
            { type: 'prose', title: '한글과 건축이 만나는 심볼', paragraphs: [
                '심볼마크는 세종문화회관 첫 음절의 초성인 「ㅅ」과 건물 전면의 보 하나·기둥 여섯 개를 형상화했습니다. 기둥은 장막이 걷힌 무대를 암시하는 프레임으로도 확장됩니다.',
                '공식 대표 이미지이면서 다양한 시각 결과물에 활용할 수 있는 가변 프레임입니다. 프레임으로 활용할 때에도 가로획과 세로획 사이의 간격을 유지하도록 안내합니다.',
            ] },
            { type: 'table', title: '기본 색상', columns: ['구분', '색상', 'RGB'], rows: [
                ['주색', '검정', '0, 0, 0'], ['보조색 · 천', '하늘색', '84, 200, 232'],
                ['보조색 · 지', '황토색', '195, 109, 21'], ['보조색 · 인', '노란색', '255, 232, 0'],
                ['보조색', '흰색', '255, 255, 255'],
            ], note: '천·지·인을 색상 체계로 표현하며 다양한 관람객을 나타낼 수 있도록 색상 확장성을 둡니다. 인쇄용 색상과 세부 적용은 공식 컬러 안내를 확인해 주세요.' },
            { type: 'downloads', title: '공식 원본 내려받기', items: [
                { label: '심볼마크 AI', href: file('2a174cf0db4c4746a10da4b1811e3808', 4) },
                { label: '심볼마크 JPG', href: file('2a174cf0db4c4746a10da4b1811e3808', 2) },
                { label: '로고타입 AI', href: file('2a174cf0db4c4746a10da4b1811e3808', 6) },
                { label: '로고타입 JPG', href: file('2a174cf0db4c4746a10da4b1811e3808', 5) },
            ] },
            { type: 'links', title: '사용 기준과 변화 과정', items: [
                { label: '공식 로고·시그니처·사용 크기', href: contents(200508) },
                { label: '아이덴티티 컬러', href: contents(200510) }, { label: 'CI 히스토리', href: contents(200509) },
            ] },
        ],
        sources: [{ label: '공식 아이덴티티 로고', url: contents(200508) }, { label: '공식 아이덴티티 컬러', url: contents(200510) }],
    },
    {
        path: '/about/introduction/greeting', title: 'CEO 인사말',
        summary: '시민의 예술 참여와 향유를 넓히고, 도전적인 작품을 만드는 세종문화회관의 방향입니다.',
        sections: [
            { type: 'image', title: '세종문화회관 사장', image: {
                src: 'https://www.sejongpac.or.kr/static/portal/img/content/img_ceo01.png', alt: '세종문화회관 사장 안호상',
            } },
            { type: 'facts', title: '기관 대표', items: [
                { label: '사장', value: '안호상' }, { label: '기관', value: '재단법인 세종문화회관' },
            ] },
            { type: 'prose', title: '공식 인사말의 주요 방향', paragraphs: [
                '안호상 사장은 세종문화회관을 한국 공연예술의 역사와 함께해 온 문화예술기관으로 소개하며 시민의 예술 참여와 향유 확대를 강조합니다.',
                '서울시예술단의 창작역량을 바탕으로 도전적이고 차별화된 작품을 선보여 제작극장의 정체성을 확립하고, 공연·전시·교육을 통해 서울의 문화적 긍지를 보여주는 예술공간을 지향합니다.',
                '이 페이지는 공식 인사말의 취지를 요약한 소개입니다. 인사말 전문과 현재 기관 대표 정보는 아래 공식 원문에서 확인할 수 있습니다.',
            ] },
            { type: 'links', title: '기관의 방향과 활동', items: [
                { label: 'CEO 인사말 전문', href: contents(200469) }, { label: '서울시예술단', href: '/about/companies' },
                { label: '조직도', href: '/about/introduction/organization' },
            ] },
        ],
        sources: [{ label: '공식 CEO 인사말', url: contents(200469) }],
    },
    {
        path: '/about/introduction/history', title: '연혁',
        summary: '1978년 개관부터 공연장 확장과 시민공간 조성으로 이어지는 주요 발자취입니다.',
        sections: [
            { type: 'prose', title: '공연장을 넘어 복합 문화공간으로', paragraphs: [
                '1974년 착공한 세종문화회관은 1978년 4월 14일 개관했습니다. 1999년 재단법인 출범 이후 공연장과 미술관, 예술교육 공간을 확장하며 시민과 만나는 방식을 넓혀왔습니다.',
            ] },
            { type: 'timeline', title: '개관과 재단 출범', items: [
                { date: '1974.01.01', title: '세종문화회관 착공', body: '현재 세종문화회관으로 이어지는 건립 공사가 시작되었습니다.' },
                { date: '1978.04.14', title: '준공 및 개관', body: '세종문화회관이 시민을 맞이했습니다.' },
                { date: '1999.07.01', title: '재단법인 출범', body: '재단법인 세종문화회관이 설립되었습니다.' },
            ] },
            { type: 'timeline', title: '예술공간의 확장', items: [
                { date: '2004.03.02', title: '대극장 재개관', body: '시설 개·보수공사를 마치고 재개관했습니다.' },
                { date: '2006.08.14', title: '세종체임버홀 개관', body: '실내악을 위한 공연공간을 열었습니다.' },
                { date: '2007.06.19', title: '세종예술아카데미 개원', body: '시민의 예술교육을 위한 공간이 마련되었습니다.' },
                { date: '2007.12.01', title: '세종M씨어터 개관', body: '다양한 작품을 만나는 중규모 공연장이 문을 열었습니다.' },
                { date: '2009.10.09', title: '세종이야기 개관', body: '세종대왕의 업적을 만나는 전시공간을 열었습니다.' },
                { date: '2009.10.17', title: '북서울 꿈의숲아트센터 개관', body: '북서울 지역에 공연·전시 문화공간을 열었습니다.' },
                { date: '2010.04.28', title: '충무공이야기 개관', body: '충무공 이순신의 생애와 업적을 소개하는 공간을 열었습니다.' },
                { date: '2012.12.01', title: '세종예술동 증축', body: '예술 활동을 위한 공간을 확충했습니다.' },
                { date: '2015.04.06', title: '세종미술관 재개관', body: '전시공간을 새롭게 정비했습니다.' },
                { date: '2018.10.18', title: '세종S씨어터 개관', body: '새로운 공연 형식을 선보일 수 있는 공간을 열었습니다.' },
            ] },
            { type: 'timeline', title: '시민을 위한 공간', items: [
                { date: '2019.06.19', title: '세종 아티스트라운지 개장', body: '예술가를 위한 교류공간을 마련했습니다.' },
                { date: '2023.02.07', title: '세종라운지 개장', body: '관람과 휴식을 연결하는 공간을 열었습니다.' },
                { date: '2023.12.29', title: '자료실 및 시민편의공간 개장', body: '시민을 위한 이용공간을 확장했습니다.' },
            ] },
            { type: 'links', title: '더 긴 역사와 오늘의 공간', items: [
                { label: '공식 연혁 전체', href: contents(200506), description: '부민관·시민회관으로 이어지는 이전 역사도 확인할 수 있습니다.' },
                { label: '공연장과 공간 안내', href: '/visit' },
            ] },
        ],
        sources: [{ label: '세종문화회관 공식 연혁', url: contents(200506) }],
    },
    {
        path: '/about/introduction/organization', title: '조직도',
        summary: '이사회와 사장, 경영·공연예술·문화사업 부문의 구성과 담당 창구를 안내합니다.',
        sections: [
            { type: 'facts', title: '기관 운영', items: [
                { label: '이사장', value: '조미진' }, { label: '상임이사·사장', value: '안호상' },
                { label: '사장 직속 조직', value: '정책보좌역, 감사실, 커뮤니케이션팀, 리빌딩추진단' },
            ] },
            { type: 'table', title: '본부별 구성', columns: ['본부', '소속 부서'], rows: [
                ['경영본부', '기획조정팀 · 재무행정팀 · 인사팀 · 시설운영팀 · 안전관리팀'],
                ['공연예술본부', '공연DX팀 · 공연제작1팀 · 공연제작2팀 · 발레제작팀 · 공연장운영팀 · 무대기술팀'],
                ['문화사업본부', '문화Biz개발팀 · 교육전시팀 · 시민예술팀 · 꿈의숲아트센터팀'],
            ], note: '2026년 10월 공식 조직도에서 확인한 구성입니다. 최신 조직과 직원별 담당업무·연락처는 공식 조직도에서 확인할 수 있습니다.' },
            { type: 'prose', title: '담당 부서를 찾으실 때', paragraphs: [
                '공식 조직도에서 부서 이름을 선택하면 담당업무와 연락처를 볼 수 있습니다. 문의할 공연명·공간명·신청 유형을 먼저 정리하면 담당자에게 내용을 전달하기 쉽습니다.',
                '공연 관람과 예매 문의는 대표전화 02-399-1000으로, 후원회와 협력 제안은 각 안내 페이지의 담당 창구로 문의해 주세요. 예술단 정보는 서울시예술단 소개에서 확인할 수 있습니다.',
            ] },
            { type: 'links', title: '조직과 담당 창구', items: [
                { label: '공식 조직도·직원별 담당업무', href: organization }, { label: '서울시예술단', href: '/about/companies' },
                { label: '후원회 문의', href: '/about/donation' }, { label: '협력·협찬 문의', href: '/about/partners' },
                { label: '이사회 회의록', href: board },
            ] },
        ],
        sources: [{ label: '공식 조직도·이사회', url: organization }],
    },
    {
        path: '/about/partners', title: '협력·협찬',
        summary: '기업과 다양한 협력 주체가 예술단·공간·콘텐츠·문화공헌 활동에 함께할 수 있습니다.',
        sections: [
            { type: 'prose', title: '예술을 함께 만드는 파트너십', paragraphs: [
                '세종문화회관은 기업과 다양한 협력 주체가 가치를 공유하는 파트너십을 통해 시민과 예술가에게 더 넓은 기회를 제공하고자 합니다. 공식 안내는 예술단, 공간, 콘텐츠, 문화공헌 콘텐츠와의 협업을 제시합니다.',
                '협력하고 싶은 대상과 목적을 먼저 정리해 주세요. 사업의 내용과 일정, 제공 가능한 자원과 기대하는 협력 방식에 따라 구체적인 실행 범위를 협의할 수 있습니다.',
            ] },
            { type: 'table', title: '공식 협업 분야', columns: ['분야', '제안할 때 정리할 내용'], rows: [
                ['예술단과 협업', '관심 예술단이나 작품, 협력 목적과 희망 시기'],
                ['공간과 협업', '희망 공간, 사용 목적, 운영 방식과 일정'],
                ['콘텐츠와 협업', '콘텐츠 주제, 제작·유통 방식과 각 기관의 역할'],
                ['문화공헌 콘텐츠와 협업', '참여 대상, 예술 경험을 나누는 방식과 지원 내용'],
            ], note: '협업 분야는 공식 파트너십 안내를 따릅니다. 구체적인 실행 조건과 권리는 개별 협의가 필요합니다.' },
            { type: 'facts', title: '파트너십 문의', items: [
                { label: '전화', value: '02-399-1722' }, { label: '팩스', value: '02-399-1798' },
                { label: '공식 안내에 게시된 이메일', value: 'k2i7m@naver.com' },
            ] },
            { type: 'links', title: '제안과 참고 자료', items: [
                { label: '협력·협찬 제안하기', href: '/about/partners/apply' },
                { label: '공식 파트너십 안내', href: contents(200512) },
                { label: '후원회 가입 안내', href: '/about/donation', description: '개인·법인 후원회 가입을 검토할 때 확인해 주세요.' },
                { label: '대관 안내', href: '/rental', description: '공간 대관을 신청하려는 경우 대관공고와 절차를 확인해 주세요.' },
            ] },
        ],
        sources: [{ label: '공식 파트너십 분야·문의', url: contents(200512) }],
    },
    {
        path: '/about/partners/apply', title: '협력·협찬 제안',
        summary: '기관 소개와 협력 목적, 대상과 일정을 정리해 제안해 주세요.',
        sections: [
            { type: 'prose', title: '함께할 내용을 알려주세요', paragraphs: [
                '기업·기관·단체가 제안하는 협력의 목적과 실행 방식을 적어 주세요. 예술단, 공간, 콘텐츠, 문화공헌 중 관심 분야를 함께 작성하면 제안의 방향을 이해하는 데 도움이 됩니다.',
                '이 신청은 제안 내용을 전달하기 위한 접수입니다. 접수 후 구체적인 사업 조건을 검토하고 협의하게 되며, 공연·공간 사용이나 협찬 권리가 확정되는 것은 아닙니다.',
            ] },
            { type: 'table', title: '제안서에 담으면 좋은 내용', columns: ['항목', '작성 안내'], rows: [
                ['제안 주체', '기업·기관명, 사업 분야, 담당자와 회신 연락처'],
                ['목적과 대상', '협력하려는 이유, 관심 공연·예술단·공간 또는 참여 대상'],
                ['실행 내용', '운영 방식, 콘텐츠 구성, 각 기관이 맡을 역할'],
                ['일정과 자원', '희망 기간, 지원 가능한 현금·현물·인력 등 자원'],
                ['기대 효과', '관객·시민·예술가에게 제공할 경험과 제안 기관의 목표'],
            ] },
            { type: 'faq', title: '접수 전 확인', items: [
                { question: '공간을 빌리려는 경우에도 여기에 접수하나요?', answer: '공간 대관을 목적으로 하는 신청은 대관안내에서 모집 공고와 신청 절차를 확인해 주세요. 파트너십 제안만으로 공연장 사용 일정이 확보되지는 않습니다.' },
                { question: '구체적인 예산이나 일정이 정해지지 않았습니다.', answer: '현재 검토 중인 범위와 협의가 필요한 내용을 본문에 적어 주세요. 확인되지 않은 금액이나 일정을 확정해 작성할 필요는 없습니다.' },
            ] },
            { type: 'links', title: '분야 확인과 문의', items: [
                { label: '공식 파트너십 안내', href: contents(200512) },
                { label: '파트너십 전화 02-399-1722', href: 'tel:02-399-1722' }, { label: '대관 절차', href: '/rental/process' },
            ] },
        ],
        form: { kind: 'partnership', title: '협력·협찬 제안', description: '기관 소개, 협력 목적, 희망 분야와 일정을 작성해 주세요.' },
        sources: [{ label: '공식 파트너십 분야·문의', url: contents(200512) }],
    },
];
