# 공통 텍스트·표면·컬러와 회원 DB

사용자의 최신 지시에 따라 `main`에서 작업한다. 모든 제품 글자의 데스크톱 최소 크기는 16px다. 글자를 줄이는 대신 너비·줄바꿈·내용에 따른 높이로 배치한다.

## 명시적인 글자 속성

`SystemText`는 실제 HTML 의미와 표시 위계를 분리한다. 예를 들어 `<SystemText as="h1" variant="title">`은 제목의 의미와 공통 크기를 함께 사용한다. 네이티브 레이블·링크·기존 렌더러는 `textAttributes('caption')` 또는 동일한 `data-text="caption"` 속성으로 연결하며 불필요한 래퍼를 추가하지 않는다. 기본 버튼·필드·탭·알림도 실제 렌더러에서 속성을 전달한다.

`design-tokens.ts`의 `TEXT_VARIANTS`가 역할별 크기·굵기·행간의 원본이다. 기존 반응형 위계를 유지하는 CSS도 `max(var(--text-min), 기존 크기)`로 하한을 지킨다. 토큰과 `typography.css`를 함께 생성하고, 네이티브 정적·동적 텍스트의 연결 누락과 작은 font 선언은 빌드 전 검사에서 막는다.

## 공통 표면과 중앙 컬러

`SystemSurface`는 네이티브 `as`, `variant`, `padding`, `radius`를 받는다. 예매 단계·완료 패널, 로그인·가입·복구 양식, 홈 달력 영역과 개인 공간의 프로필 영역에서 같은 구현을 조합한다. 페이지 CSS는 배치만 담당하고 표면의 색·곡률·경계는 베리언트와 토큰이 담당한다.

베리언트는 `panel`, `subtle`, `inset`, `banner`, `elevated`다. 일반 패널 경계는 `--surface-border`, 낮은 대비 경계는 `--surface-border-subtle`을 사용한다. 초점은 읽을 수 있는 강도를 유지한다.

2026년 10월 23일부터 공통 컨트롤과 표면의 경계는 `--stroke-width: 1px`의 inset 선을 사용한다. 외곽 크기와 레이아웃에 선 두께를 더하지 않는다. 남아 있는 네이티브 구획선도 border-box 안에 두고, 초점은 3px 선에 -3px offset을 적용한다. 기본 컨트롤은 12px, flow는 14px, 패널은 20px, compact는 16px, 대화상자는 28px 곡률을 사용한다. 원형 아이콘·좌석 형태·캡슐 알림과 유리의 부드러운 그림자는 각 역할을 유지한다.

`SystemControlGroup`은 간격을 제외한 100%를 열 수로 나눠 링크 너비를 배분한다. 기본은 작은 화면 2열, 768px부터 3열, 1024px부터 6열이며 실제 항목 수로 열 수를 제한한다. 마지막 줄은 남는 폭을 채우고 글자 크기를 줄이지 않는다. 카탈로그 탐색과 디자인 가이드가 같은 구현을 사용한다. 사용 위치는 `as`, `columns`, `maxColumns`로 정하고 페이지 CSS에 링크별 픽셀 폭을 작성하지 않는다.

기본 종이색은 `--color-white: #FFFEFA`, 어스 블랙은 `--color-black: #211F1C`다. 기존 노랑·하늘·황토는 보존했다. 직접 작성한 CSS·인라인 SVG의 색은 중앙 원본에 등록한 `var(--color-…)`로 연결한다. 세부 삽화의 색도 원본에 기록하며 실행 중 생성하지 않는다. 외부 공연 이미지의 픽셀은 컬러 토큰의 적용 대상이 아니다.

`LiquidGlass`의 `black`은 어스 블랙 계열 재질·흐림·가장자리 굴절·반사를 공유하는 공식 베리언트다. `알림소형모달`은 이 표면을 사용하고 기존 비차단 상태 알림, 포커스 유지, 캡슐 모양, 자동 퇴장과 모션 감소 동작을 유지한다.

`white`는 알림소형모달의 `black`과 같은 불투명도 0.82·굴절 70·흐림 18px·두께 24px를 공유하는 밝은 알림 베리언트다. `SystemNotice`의 default·flow 레이아웃과 status·error 상태는 이 컴포넌트를 조합하며, 배경은 흰색 토큰의 유리·본문은 오프블랙·경계는 옅은 안쪽 선을 사용한다. 오류 안내의 역할·ref·초점과 자식 조작을 유지한다.

`tests/system-notice-glass-browser.ts`로 네 예시의 실제 굴절 지도, 320·390·768·1024·1440px, 고대비 대체 표면, 회원 폼의 오류·성공 안내, 기존 black 알림을 검증했다. 성공 안내의 OTP 요청은 HTTP fixture로 처리한다. [6개 브라우저 검사 결과](notice-white-glass/browser-results.json) · [네 예시 화면](notice-white-glass/notices.png) · [흰 재질의 실제 배경 굴절](notice-white-glass/material.png) · [회원 안내 화면](notice-white-glass/recovery.png).

## 모션 종료

홈 ‘관람 예약’은 `SystemText`의 정적 h2다. `BookingInvitation`의 글자별 스크롤 모션은 퇴역했으며 구현·실행 예제·전용 CSS를 제거했다. 가이드에는 `Deprecated` 이력만 남기고 이전 소스는 Git 이력에서 확인한다. 히어로·메뉴·알림의 다른 모션은 유지한다.

## 활성 제품 등록부

활성 등록 47개와 실제 제품 연결 47개가 일치하며 가이드 전용과 미사용 제품 구현은 모두 0개다. 페이지에서 도달할 수 없는 등록은 빌드 전 소스 감사에서 실패한다. 집계는 화면용 상수가 아니라 실제 import·렌더 그래프에서 생성한다.

목록 렌더러 `ComponentCatalog`와 재질 실험 도구 `LiquidGlassDemo`는 `app/design-rules/_documentation/`에 둔다. 이들은 제품 UI 수에서 제외하지만 정확한 파일·export·가이드 도달 여부를 별도로 검사한다. 미등록 도구와 제품 경로에서의 사용도 실패하며, 가이드 예시는 기존 제품 컴포넌트를 그대로 렌더링한다. 자세한 소스 연결은 [생성 감사 보고서](component-connections.md)에 있다.

2026-10-23 검증: 단위 검사 140개 통과·선택 검사 1개 건너뜀, TypeScript·정적 빌드 통과. 155개 실제 예시와 회원·검색·예매 회귀 검사를 통과했고, 320·390·768·1024·1440px에서 47 / 47 / 0 / 0 집계와 16px 하한을 확인했다. 정적 HTML 160개와 파일 참조 9,293개 검사에서 누락은 0건이다. [집계·너비 측정](registry-alignment/browser-results.json) · [전체 제품 회귀 결과](registry-alignment/system-browser.json) · [데스크톱 집계](registry-alignment/counts-1440.png) · [모바일 집계](registry-alignment/counts-320.png).

## Supabase 저장

회원 데이터는 인증한 사용자의 `sejong_profiles`, `sejong_spaces`, `sejong_favorites`, `sejong_notes`, `sejong_bookings` 다섯 테이블을 사용한다. 모든 테이블에 RLS를 적용하며 `auth.uid() = user_id`인 행만 읽고 변경한다. UPDATE는 USING과 WITH CHECK로 소유자 변경까지 막고, 익명 역할에는 테이블 접근을 주지 않는다. 서버용 비밀 키를 브라우저에 보내지 않는다.

이름·이메일을 적은 로컬 프로필은 인증으로 인정하지 않는다. Google 또는 이메일 링크로 실제 계정 소유를 확인한다. PKCE 인증 세션 보관은 SDK가 담당하지만 이름·연락처·공간·하트·노트·예매 기록의 원본은 DB다. 인증 제공자의 메타데이터는 초기 표시에만 사용하며 회원정보 저장 때 덮어쓰지 않는다. 저장 응답을 확인한 뒤 화면을 갱신하며 오류를 임시 저장 성공으로 바꾸지 않는다. 계정이 바뀐 뒤 도착한 응답과 이전 계정의 대기 작업은 새 계정 화면에 적용하지 않는다. 예매 재시도 키는 계정·회차·좌석·금액별로 보존하고 실제 DB 응답의 내용을 표시한다. 이메일 자동화 검사는 제공자 요청을 모의 처리해 실제 메일을 보내지 않는다.

설치 SQL은 [운영 이력과 버전을 맞춘 마이그레이션](../supabase/migrations/20261021075737_v5_member_data.sql), 실제 DB 소유권 검증은 [롤백하는 검증 SQL](../supabase/tests/member-ownership.sql)에 있다. CLI로 만든 준비 파일은 운영 적용 뒤 실제 마이그레이션 버전으로 이름을 맞췄다. 운영 프로젝트 `cowalyqaoqoclrfmxszp`에 2026년 10월 21일 적용했고, 실제 DB에서 회원 CRUD·다른 회원 접근 차단·소유자 변경 차단을 통과했다. 테스트 사용자와 기록은 롤백했으며, REST API 다섯 경로의 익명 접근도 401로 거부됨을 확인했다. [실제 DB 검증 기록](member-db-live-verification.json)과 모의 SDK 통합 검사는 구분한다.

## 검사

- `npm.cmd run check:system`: 생성 토큰·사용 연결·네이티브 컨트롤·색상 변수·텍스트 속성·최소 크기 선언을 확인한다.
- `node tests/visual-contract-browser.ts <URL>`: 전체 등록 경로의 실제 글자 크기와 연결, 넓이·팝업·표면을 검사한다.
- `node tests/member-db-browser.ts <URL>`: 실제 SDK와 모의 Auth/PostgREST로 로그인 링크·회원 CRUD·저장 실패·계정 변경을 검사한다.
- `node tests/system-surfaces-browser.ts`: 공통 표면과 검정 유리 알림의 굴절·캡슐·타이머·포커스를 검사한다.
- `node tests/inner-stroke-browser.ts <URL>`: 다섯 화면 너비에서 비율 배치·안쪽 경계·곡률·상태별 크기·글자 확대와 가이드/제품의 같은 베리언트를 비교한다.

등록된 구현은 47개, 제품 연결 44개, 가이드 전용 3개, 미사용 0개다. 가이드 전용에는 Deprecated 모션이 포함된다.

안쪽 경계·곡률·반응형 비율의 2026년 10월 23일 정적 빌드와 브라우저 측정은 [최종 검증 기록](inner-stroke-verification.json)에 보존한다.
