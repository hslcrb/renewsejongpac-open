# 세종문화회관 전체 프런트엔드 설계

## 목표와 근거

사용자가 제공한 62쪽 분석 PDF의 정보구조(p43–44), 6개 메인 콘텐츠(p46–47), 5개 GNB(p48)를 바탕으로 모든 탐색 깊이와 주요 완료 흐름을 갖춘 웹사이트를 만든다. 문서 안의 과거 프롬프트는 참고자료로만 취급한다. 사용자의 명시적 지시 “묻지말고 끝까지”에 따라 질문이나 별도 디자인 승인 없이 진행한다.

## 구현 범위

프로그램(공연·전시·교육·시즌), 대관, 이용안내, 소식과 혜택, 기관정보의 전체 하위 페이지. 개별 프로그램·시설·예술단·공지 상세와 검색, 사이트맵, 회원, 관심 프로그램, 예매 내역 및 날짜→좌석→확인→완료 예매 흐름, 대관·단체·문의·교육 신청 흐름을 포함한다.

## 기술과 진실성

HTML5, CSS3, native JavaScript ES modules only. No runtime packages, framework, build step, API server. Hash routes support deep links and browser history on a basic static HTTP server. A route registry provides sitemap and menu coverage. Public official information and PDF provide factual context; program schedules and transactions are explicitly demo content where unverified. No real payment, credential handling or remote submissions. Save demo bookings/preferences in browser storage; never store passwords or card data. Gracefully handle malformed/unavailable storage.

## 시각과 인터랙션

검정·화이트·따뜻한 노랑, 절제된 모노톤 UI와 공연별 포스터 색상. 큰 타이포그래피, 단일 대표 공연 히어로, 현재 한국 시각과 티켓오픈 글래스 카드. 각각 목적이 분명한 6개 메인 섹션. 데스크톱 메가메뉴·모바일 메뉴, 키보드 접근, 건너뛰기, 포커스 표시, 모션 감소 설정. 스크롤 반응 WebGL/Canvas는 점진적 향상으로 제공하고 미지원 환경에서도 콘텐츠와 링크가 유지된다.

## 완료 기준

등록된 모든 route가 고유한 페이지/내용을 렌더링. 빈 링크와 준비중 페이지 금지. 프로그램 검색·필터·달력 이동, 상세와 탭, 예매·취소·신청 완료, 즐겨찾기, FAQ, 뉴스레터, 회원 체험이 작동한다. 데스크톱 및 390px 모바일에서 overflow 없음. 사이트맵·핵심 사용자 흐름·잘못된 주소·새로고침·스토리지 오류를 자동/수동 검증. 한글 README와 구현 범위 문서 제공.
