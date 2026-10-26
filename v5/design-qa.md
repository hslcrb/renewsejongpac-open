# 메인 화면 스타일 정리 검수

> 최신 v3 검증은 문서 끝의 **내부 이용 흐름·사이트 인터랙션 (2026-10-16)** 절입니다. 앞부분의 구버전·이전 구현 안내는 당시 기록으로 보존합니다.

> 이 문서는 구버전 작업 기록입니다. 2026-10-15에 추가한 독립 신버전의 설계·검수는 [신버전 설계](v2/docs/design.md)와 [신버전 확인 기록](v2/docs/verification.md)을 참고하세요. 루트 `index.html`에서 두 버전을 선택할 수 있습니다.

## 기준

사용자가 제공한 와이어프레임은 영역 배치와 정보 구조를 참고하는 뼈대입니다. 최신 요청에 따라 임시 색상·카드 모양을 그대로 복제하는 기준을 폐기하고, 그림자·과도한 호버·반복 장식을 줄인 실제 기관 사이트 화면을 기준으로 확인했습니다.

- 프로그램: 왼쪽 분류 / 가운데 2열 카드 / 오른쪽 이벤트.
- 이용안내: 첫 방문 / 접근성 / 관람 예절 / 길찾기·지원의 2 × 2 구성.
- 소식: 카드 목록과 이전·다음 이동.
- 기관 소개: ESG / 기관 이야기 / 공식 영상, 정보공개·협력 링크.
- 푸터: 로고 / 연락처 / 주요 서비스 / 정책·주소.

## 변경 내용과 확인

- 카드·포스터·메뉴·툴팁의 drop shadow와 text shadow를 제거했습니다. 선택 좌석의 inset shadow는 outline으로 바꿔 선택 표시를 유지했습니다.
- 버튼 떠오르기, 이미지 확대, 화살표 이동 호버를 제거했습니다. 링크 밑줄과 색·테두리 변화로 선택 가능 여부를 표시합니다.
- 메인의 파스텔 카드·검은 분류 알약·큰 둥근 프레임을 흰 바탕·구분선·단순한 표기로 정리했습니다.
- 글래스 blur, 글로우, 장식용 WebGL canvas, 실시간 시계, 마우스 추적 점을 제거했습니다. 티켓 오픈 정보는 평면 안내로 표시합니다.
- 이용안내·소식의 생성형 3D 그림을 실제 회관 사진과 공식 건물 배치 그림으로 교체했습니다. 헤더는 공식 워드마크를 사용합니다.
- 반복 영어 장식 제목과 추상적인 안내 문구를 줄이고 이용 목적·안내 내용이 드러나는 제목과 설명으로 정리했습니다.

## 화면 근거

- URL: `http://127.0.0.1:8000`
- Browser: Playwright Chromium, headless. 화면 캡처에 사용했으며 자동 테스트 스위트는 실행하지 않았습니다.
- Viewports: 1440, 960, 390, 320 × 1000 CSS px, deviceScaleFactor 1.
- Screenshots: `C:/Users/hi/AppData/Local/Temp/sejong-flat-qa/`의 `hero-{width}.png`, `programs-{width}.png`, `visit-{width}.png`, `news-{width}.png`, `about-{width}.png`, `footer-{width}.png`, `header.png`.
- 주요 비교 크기: hero-1440 1440 × 610, programs-1440 1440 × 1041, visit-1440 1440 × 860, news-1440 1440 × 569, about-1440 1440 × 766, visit-320 320 × 1342, programs-320 320 × 1351px.
- 캡처에서 고정 헤더·맨 위로 버튼·본문 바로가기 링크만 숨겼으며 섹션을 배율 변환 없이 확인했습니다. 이번 요청은 구조를 참고한 스타일 개선이므로 원본 와이어프레임의 색·임시 이미지·정확한 세로 길이를 일치시킬 대상으로 삼지 않았습니다.
- Fonts/typography: 제목, 설명, 날짜, 이동 링크 계층을 확인했습니다. 장식용 영어 대신 실제 안내 문구를 사용합니다.
- Spacing/layout: 영역 구조를 유지하면서 패널 대신 구분선으로 묶었습니다. 320px부터 데스크톱까지 가로 넘침이 없습니다.
- Colors/tokens: 흰색·중성색과 검정 본문 중심이며 노란색은 티켓·진행 상태에 사용합니다.
- Image fidelity: 공식 사진·로고·배치 그림의 형태를 유지했습니다. 생성형 안내 그림은 메인 DOM에서 사용하지 않습니다.
- Copy/content: 프로그램 일정·장소, 이용안내 링크, 소식과 기관 안내를 실제 체험 데이터에 맞춰 표시했습니다.
- Computed styles: 주요 카드의 boxShadow는 모두 none. 안내 카드 hover의 transform·boxShadow도 none입니다. cursor-dot·hero-canvas가 DOM에 없으며 이미지가 로드됐습니다. Page errors 없음.

## 보완과 범위

- 캡처 중 발견한 이벤트 표기의 문자 인코딩 오류를 고치고 다시 확인했습니다. 현재 이벤트 라벨은 한글로 표시됩니다.
- 확인한 화면에 남은 P0/P1/P2 시각 문제는 없습니다. 전체 기능 회귀 검사와 외부 영상 스트리밍 재생은 이번 확인 범위에 포함하지 않았습니다.
- `node --check js/home.js`, `node --check js/components.js`, `node --check js/app.js`, `git diff --check` 통과.

final result: passed

## 추가 개선: 선택적 반응형 라운드

- 일반 버튼·패밀리 사이트 선택: `clamp(4px, 0.45vw, 8px)`.
- 포스터·사진 프레임: `clamp(6px, 0.65vw, 12px)`.
- 히어로 배너·영상 프레임: `clamp(8px, 0.9vw, 16px)`.
- 히어로·소식 이동 버튼: 정사각형 크기와 `border-radius: 50%`로 원형 처리.
- 프로그램·이용안내·소식 카드 본체의 radius는 0px로 유지됩니다. 주요 표면의 boxShadow는 none입니다.
- 동일한 이미지 토큰을 공간 소개 사진과 프로그램 상세 포스터 프레임에도 적용했습니다.

### 화면 확인 근거

- URL: `http://127.0.0.1:8000`, Chromium, deviceScaleFactor 1.
- 화면 폭: 1920, 1440, 960, 390, 320px. 모든 폭에서 문서 너비와 화면 너비가 일치하며 page error가 없습니다.
- 1440px에서 버튼 / 사진 / 배너 radius: 6.48 / 9.36 / 12.96px.
- 960px에서 4.32 / 6.24 / 8.64px, 390·320px에서 4 / 6 / 8px, 1920px에서 8 / 12 / 16px.
- 캡처: `C:/Users/hi/AppData/Local/Temp/sejong-radius-qa/`의 `hero`, `programs`, `visit`, `news`, `about`별 1440·390px 이미지.
- Typography/content: 제목·본문·링크 문구 변경 없음.
- Spacing/layout: 기존 열 배치·구분선 유지, 가로 넘침 없음.
- Colors/tokens: 기존 색상에 공용 radius 토큰만 추가했습니다.
- Image fidelity: 기존 이미지 크롭을 유지하며 프레임 가장자리만 곡선으로 잘립니다.
- 자동 테스트 스위트는 실행하지 않았습니다. 화면 캡처·computed style 확인과 `git diff --check`로 이번 CSS 변경을 확인했습니다.

추가 개선 결과: passed.

---

# 방문 안내의 추가 이미지 미리보기 검증

이 절은 이전 구현 기록이다. 현재 기준은 문서 끝의 ‘NEWBIRD 홈페이지 직접 확인’ 검증이다.

검증일: 2026-10-15. 범위는 오른쪽 안내 링크의 **왼편에 추가로 뜨는 이미지**다.
기존 큰 사진, 제목·설명·화살표와 링크 목적지는 보존한다.

## 시각 비교

- 참고: 사용자가 첨부한 ‘실패 없는 UI 배색을 위한 핵심 가이드’ 활성 화면.
  같은 상태를 [원본 페이지](https://newbird.co.kr/inside/)에서도 확인했다.
- 원본 캡처: `.lemonade/visit-extra-preview/source.png`, 1905×892px, density 1.
- 구현 캡처: `.lemonade/visit-extra-preview/1440.png`, 1440×1000 CSS px 화면의 영역 캡처, density 1.
- 전체 비교: `.lemonade/visit-extra-preview/comparison.jpg`.
- 이미지와 활성 행의 확대 비교: `.lemonade/visit-extra-preview/detail.jpg`.
- 비교 이미지는 각 영역을 최대 1000px 너비로 정규화했다. 캡처와 비교 자료는 로컬 검증 산출물이다.

기존 구현에서 빠졌던 추가 미리보기를 별도 이미지 요소로 추가했다. 활성 행의 왼쪽에
4:3 이미지와 그림자가 나타나고, 큰 사진도 동시에 남는다. 해당 항목을 벗어나면 사라진다.
원본의 기사 이미지·노란 배경·목록 서체는 이번 변경 범위가 아니다.

## 확인 결과

- 글자: 기존 Pretendard·제목 20px/650·본문 크기와 줄바꿈 보존.
- 배치: 추가 이미지는 absolute 배치로 행 왼쪽에 표시. 큰 이미지와 행 크기에 변화 없음.
- 색상: 기존 화면 색상 유지. 미리보기의 흰 바탕·그림자·6px 모서리 확인.
- 이미지: 기존 시설 사진·안내 삽화 사용, 4:3 비율 유지, 삽화는 contain 처리.
- 내용: 제목·설명·목적지 보존. 추가 이미지는 장식용이며 포커스와 클릭을 가로막지 않음.
- 320·390·768·1024·1440·1905px에서 넘침과 이미지 대응 확인.
- hover·키보드 표시와 닫힘, 포인터/키보드 동시 사용 시 미리보기 하나만 표시되는 동작 확인.
- 좁은 화면과 터치에서는 추가 겹침을 숨기고 기존 이미지와 한 번 누르는 링크 유지.
- 기존 방문 안내 검사·가독성 검사·Node 16개 통과. 브라우저 런타임 오류 0, CSS 구문 검사 통과.

추가 수정이 필요한 P0/P1/P2 항목 없음.

final result: passed

---

## 우측 공통 미리보기 — 이전 검증 (2026-10-15)

큰 기본 사진을 유지하고, 텍스트 오른쪽에 공통 미리보기 영역 하나를 둔다.
항목별 개별 팝업을 제거했으며 hover·키보드 포커스가 바뀌면 같은 프레임 안에서만
240ms opacity 전환을 수행한다. 스크롤 시 sticky 위치는 섹션 내부로 제한된다.

- 화면: `.lemonade/shared-right-preview/1440.png`, `.lemonade/shared-right-preview/1905.png`.
- 글자·색상·문구: 기존 제목 20px/650·설명·화살표·색상·목적지 유지.
- 배치: 왼쪽 기본 사진, 가운데 안내 텍스트, 그 오른쪽의 공통 프레임. 프레임은 4:3이며
  overflow hidden으로 내부 이미지 전환을 제한한다. 항목 이동 시 같은 DOM과 크기를 유지한다.
- 이미지: 기존 시설 사진·안내 삽화 유지. 본문 사진과 공통 미리보기 대응 확인.
- 320·390·768·1024·1440·1905px에서 가로 넘침 없음. 넓은 화면에서는 오른쪽 위치와
  섹션 내부 스크롤 고정을 확인했고, 좁은 화면과 터치에서는 기존 큰 사진·링크를 유지한다.
- 방문 안내·가독성 검사 및 Node 16개 통과. 240ms 전환과 CSS 구문 검사 통과.
- 이전 ‘항목 왼편의 별도 이미지’ 구현은 이번 변경으로 대체되었다.

final result: passed

---

## NEWBIRD 홈페이지 직접 확인 — 최신 검증 (2026-10-15)

[원본 홈페이지](https://newbird.co.kr/)에서 ‘실패 없는 UI 배색을 위한 핵심 가이드’를
포함한 INSIDE 목록을 실제로 hover하고 스크롤해 확인했다. 미리보기는 처음부터 보이며,
항목을 벗어나도 마지막 이미지가 남는다. 하나의 4:3 프레임이 목록 범위 안에서 화면 세로
중앙에 머문다. 이 동작을 적용하되 사용자가 앞서 지정한 텍스트 오른쪽 배치를 유지했다.

- 원본: `.lemonade/newbird-home-reference/hover-guide.png`, `hover-information.png`,
  `pointer-out.png`, `scroll-160.png`와 각 JSON 측정 기록. 1905×892px에서 프레임 크기는
  454.984×341.234px이며, 160px 스크롤 전후 top은 275.375px로 동일했다.
- 구현: `.lemonade/newbird-home-preview/1440.png`, `1905.png`.
- 배치: 기존 큰 사진을 유지하고, 안내 목록 오른쪽의 공통 프레임 하나만 사용한다.
  hover로 이미지를 바꿔도 같은 DOM·위치·크기를 유지하며 프레임 안에서 240ms 교차 전환한다.
  모서리 5px와 원본의 그림자 값을 적용했다.
- 글자·색상·내용: 기존 제목 20px/650, 설명·화살표·링크 목적지·시설 사진과 삽화를 유지한다.
  NEWBIRD 기사 이미지와 노란 배경은 가져오지 않았다.
- 801·1024·1440·1905px에서 목록 중간의 스크롤 전후 60px 이동을 확인했다.
  프레임 top은 각각 380.578·361.25·325.672·326.297px로 고정됐으며 화면 세로 중앙과 일치했다.
  목록 끝에서는 sticky 부모 범위 안으로 제한된다. 가로 넘침과 런타임 오류는 없었다.
- 초기 표시, hover·키보드 전환, 빠른 전환, 포인터 이탈 뒤 마지막 이미지 유지,
  좁은 화면·터치·모션 감소·홈 재진입 검사를 통과했다.
- `v3/tests/visit-preview.cjs`, `v2/tests/readability.cjs`의 v3 대상 검사,
  Node 회귀 검사 16개, JavaScript 구문 검사와 `git diff --check` 통과.

이전 구현의 포인터 이탈 시 숨김과 임의의 sticky 상단 위치를 이번 변경으로 대체했다.

final result: passed

---

## 내부 이용 흐름·사이트 인터랙션 — 최신 검증 (2026-10-16)

현재 기준은 이 절과 [구현 계약](docs/interaction-plan.md)이다. 앞선 2026-10-15 기록은 당시 구현과
검증을 보존한 이력이며, 원본과 같은 강한 그림자 값은 이번 사용자 요청으로 대체했다.
범위는 `v3/index.html`이 실제로 불러오는 `src/`와 연결 스타일·자료·검사다.
다른 버전과 복사된 `v3/js/`, `v3/v2/`는 현재 앱의 기능으로 집계하지 않았다.

### 그림자와 새 이용 흐름

- 방문 안내 우측 미리보기의 computed shadow는 `rgba(17, 20, 38, 0.1) 0px 8px 24px 0px`이다.
  이전 40%·50px·100px에서 강도·거리·번짐을 줄였다. 공통 프레임 하나, 목록 내부의 세로 중앙 sticky,
  포인터 이탈 후 마지막 이미지 유지, 네 링크의 이미지 대응은 보존했다.
  [실측](.lemonade/site-interactions/visual-metrics.json)과 [화면](.lemonade/site-interactions/visit-shadow-1440.png)에 남겼다.
- 길찾기: 외부 지도 검색으로 이동하던 주 동작을 출발 역·주차장/목적 공간 선택으로 구현했다.
  선택한 값과 같은 개략도 강조선·이동 순서·목적지 설명을 표시하고 URL 재진입에서 복구한다.
  표시선은 실제 거리·소요 시간·실시간 경로를 뜻하지 않는다.
- 자료실: 기존 프로그램·공간·예술단 데이터와 이용 안내로 만든 8종 자료를 검색·분류·열람한다.
  표와 같은 데이터가 UTF-8 CSV로 실제 다운로드되며 출처와 자료 성격도 파일에 포함된다.
  ‘프로그램 기준 요금’, ‘예술단 소개 목록’, ‘이용 준비 점검 자료’처럼 내용에 맞는 이름을 사용한다.
  공식 예산·재무·인사·감사 결과를 만들어 표시하지 않는다. 없는 문서는 안내와 자료 목록으로 연결한다.
- 이벤트: 현재 브라우저의 저장 응모를 행사·접수번호로 조회한다. 초기 빈 상태, 검색 결과 없음,
  필터 초기화와 실제 신청내역에서 철회한 상태를 반영한다. 가짜 당첨자·발표 결과는 생성하지 않는다.
- 채용: 공고의 내부 지원 버튼에서 입력 검증 → 검토 → 수정 → 로컬 저장 → 신청내역·철회로 이어진다.
  기존 신청 틀을 사용해 중복 제출 방지와 입력값 보존을 함께 유지한다.
- 굿즈: 세 상품의 상세·수량, 장바구니 수정·삭제, 금액 확인·주문 저장, 주문내역·취소를 구현했다.
  저장소 오류·잘못된 저장값·다른 탭의 장바구니 변경을 처리한다. 결제·배송 개인정보를 수집하지 않는다.
  이전의 정적인 굿즈 소개 분기는 제거하고 `features/goods.js`를 실제 경로의 단일 구현으로 사용한다.

기존 132개 등록 경로를 보존하고 채용 1개, 굿즈 상세 3개, 장바구니·주문내역 2개를 추가해
현재 등록 경로는 **138개**다. 추가 런타임 의존성·빌드·백엔드·외부 결제/지도 연동은 없다.
실제 결제·기관 접수·계정 인증·당첨 발표는 이루어지지 않는 로컬 체험 범위를 화면에서 설명한다.

### 원본 목록 재확인과 미리보기 이미지 경계 수정

추가 reference 확인에서는 [NEWBIRD 홈페이지](https://newbird.co.kr/)의 해당 INSIDE 목록에서
텍스트 hover, 포인터를 움직이지 않은 휠 스크롤, 포인터 이탈, 목록 위·아래 경계를 직접 비교했다.
원본은 공유 프레임 하나를 화면 세로 중앙에 유지하고 마지막 이미지를 남긴다. 정지한 포인터 아래로
다음 텍스트가 들어와도 표시 이미지가 바뀐다. 원본 이미지 교체 자체는 전환 시간 0s이며,
v3의 **240ms 교차 전환은 사용자가 요청한 부드러움에 따른 구현**이다. 원본의 전환 시간을 복제했다고 주장하지 않는다.
우측 배치와 은은한 그림자도 사용자의 지정 사항을 유지한다.

비교 과정에서 기존 구현의 이미지 크롭 결함을 발견했다. 1440px 화면의 프레임은
320.875 × 240.656px였으나 grid 내부 이미지가 320.875px 높이로 잡혀 정사각형 삽화 아래 약 80px가
잘렸다. 프레임 크기만 검사하던 기존 검증으로는 발견하지 못했던 문제다.
이미지를 `position: absolute; inset: 0; width: 100%; height: 100%`로 프레임에 고정하고,
삽화의 `object-fit: contain`을 유지해 전체 삽화가 그 안에 들어가도록 수정했다.

- 수정 전 비교: [원본 현재 상태](.lemonade/live-preview-audit/reference-current.png),
  [원본 스크롤](.lemonade/live-preview-audit/reference-scroll.png),
  [기존 구현 스크롤](.lemonade/live-preview-audit/local-scroll.png),
  [동작 측정](.lemonade/live-preview-audit/measurements.json).
- 수정 후: [1440px](.lemonade/live-preview-audit/local-final-1440.png),
  [1905px](.lemonade/live-preview-audit/local-final-1905.png),
  [최종 크기 측정](.lemonade/live-preview-audit/local-final-measurements.json).
- 801·1024·1440·1905px에서 프레임과 이미지의 경계 일치, 동일한 우측 프레임 재사용,
  삽화 contain, 페이지 가로 넘침 없음, 30px 스크롤 전후 세로 중앙 위치를 독립 확인했다.
  1440px에서 이미지와 프레임 높이는 모두 240.656px다.
- 방문 미리보기 회귀 검사에 정지 포인터의 휠 스크롤, 세로 중앙과 부모 범위,
  240ms opacity, 프레임과 이미지 경계 일치를 추가했고 재실행 결과는
  [최신 visit-preview.log](.lemonade/site-interactions/visit-preview.log)에 통과로 남겼다.
- 원본과 v3의 목록 높이 차이는 기사 목록과 방문 안내 콘텐츠의 분량 차이다.
  부모 범위 끝에 도달하는 스크롤 거리를 억지로 같게 만들지 않았다.

### 모션 절차와 최종 동작

lemonade의 모션 기회 탐색 → 기존 상태 점검 → 구현 → 접근성·성능 확인 절차를 적용했다.
동작별 목적·빈도·속성·시간·중단·퇴장·모션 감소 계약은 계획 문서에 남겼다.
`noslopui-one`의 한영 기능군 주석과 hover-lift 금지, `sejongpac-renewmakes`의 가독성·카드·아이콘 계약을 함께 사용했다.

| 영역 | 최종 동작과 보존 조건 |
| --- | --- |
| 메뉴·검색 모달 | 네이티브 dialog의 진입 220ms·퇴장 150ms, 반복 열기/닫기 중단, Escape와 초점 복귀, 닫힘 완료까지 모달 의미 유지 |
| FAQ·신청내역 펼침 | 열린/닫힌 높이를 실측해 180ms 전환 후 자연 높이 복구. 닫히는 내용은 inert 처리하고 재입력·크기 변경·네이티브 상태 변경을 반영 |
| 분류·탭·공유·검색·길찾기·응모 조회 | 변경된 내용의 160ms opacity 피드백. 선택·입력 상태는 즉시 반영하고 앞선 모션을 교체 |
| 예매·신청 흐름 | 단계 전환 200ms opacity/8px, 완료 220ms. 같은 페이지의 검색 조건 갱신은 읽던 위치와 입력 포커스 보존 |
| 관심·버튼·토스트 | 위치를 고정한 색·테두리·아이콘 명도 피드백, 캡슐 토스트 진입/퇴장 180ms, 포스터 하트의 아래쪽 위치·180ms opacity 계약 유지 |
| 읽기 안내 | 화면 밖 일부 안내 제목·편집 영역의 한 번만 나타나는 320ms/12px 진입. 기본 CSS는 항상 보이며 키보드 포커스가 들어오면 즉시 노출 |
| 맨 위로 | 800px 기준으로 표시, 진입 opacity·퇴장 140ms. 숨김/퇴장 중 Tab 접근 제외 |
| 달력·좌석·입력값·표·정책 | 고빈도 조작과 정확한 읽기 위치를 유지하며 장식용 이동을 적용하지 않음 |

모션 감소 설정은 최초 로딩과 실행 중 변경 모두 반영한다. 경로 이동 시 listener·observer·animation을 정리한다.
기존 히어로의 2700/800/650ms와 방문 미리보기 240ms는 유지한다.
펼침 영역의 높이 전환은 실제 공개 범위를 설명하기 위한 예외이며, 그 효과를 좌석·표·입력값으로 확장하지 않았다.

### 실행 증거와 검사 범위

아래는 이번 구현 과정에서 담당자들이 실행한 검사 출력과 보존된 로그를 정리한 결과다.
문서 작성만을 위해 모든 검사를 다시 실행했다고 주장하지 않는다.
대상 서버는 `http://127.0.0.1:8091/v3/index.html`, 브라우저는 로컬 Google Chrome과 Playwright다.
서버 재현 명령과 8000번 포트를 사용하는 검사 환경변수는 [README](README.md)에 있다.
로그의 UTC 날짜 `2026-10-15T15:…Z`는 한국 시간 2026-10-16 검사에 해당한다.

| 검사 | 결과와 실제 범위 | 근거 |
| --- | --- | --- |
| 현재 v3 Node | 9/9 통과. 원본 경로 보존·새 경로 등록·중복·실제 렌더러·자료/유틸리티 계약 | [v3-node-tests.log](.lemonade/site-interactions/v3-node-tests.log) |
| 전체 v3 브라우저 | 138개 경로 × 1440/390/320px = 414개 조합, 16/16 그룹. 런타임·콘솔·실패 요청·HTTP 오류 0 | [browser-results.json](.lemonade/site-interactions/browser-results.json), [실행 로그](.lemonade/site-interactions/site-browser.log) |
| 새 내부 안내 | 출발/도착 변경·키보드·재진입·잘못된 값, 자료 8종·검색·초기화·CSV 내용, 이벤트 빈/필터/철회, 채용 연결, 5개 폭·모션 감소 | [experiences.log](.lemonade/site-interactions/experiences.log) |
| 굿즈 | 발견→상세→수량→장바구니→검토→저장→새로고침→취소, 잘못된/차단된 저장소·다른 탭 변경·5개 폭·모션 감소 | [goods.log](.lemonade/site-interactions/goods.log) |
| 공통 모션 | 네이티브 모달·중단/재열기·Escape/Tab·펼침·빠른 입력·실행 중 모션 감소·조건 갱신·관심·맨 위로·경로 정리 | [motion.log](.lemonade/site-interactions/motion.log) |
| 방문 미리보기 | 우측 공통 프레임·4개 이미지·정지 포인터 스크롤·세로 중앙/부모 경계·이미지 크롭 방지·240ms·hover/Tab/Enter·빠른 전환·5개 폭·모션 감소·홈 재진입·터치 | [visit-preview.log](.lemonade/site-interactions/visit-preview.log) |
| 신청 | 채용을 포함한 13개 신청 흐름의 필수값·작성·검토·수정·완료·내역 확인 통과 | `v3/tests/applications.cjs` 실행 출력. 별도 applications.log는 보존하지 않음 |
| 예매·입장 | 대관 사전입력·쿼리 변경·잘못된 값, 교육 가드, 할인·좌석·금액·접수내역, 이벤트·문의 입력, 전시 인원·수정·취소 | [transactions.log](.lemonade/site-interactions/transactions.log), [admission.log](.lemonade/site-interactions/admission.log) |
| 가독성·카드 | 320/390/768/1024/1440px 글자·조작 크기·폭, 링크/키보드, 카드 매체·하트·제목·양방향 드래그·우클릭·자동재생 | [readability.log](.lemonade/site-interactions/readability.log), [cards-carousel.log](.lemonade/site-interactions/cards-carousel.log) |

전체 경로 검사는 렌더링·자원·레이아웃 검사이고 모든 경로의 모든 업무 조합을 뜻하지 않는다.
새 기능과 주요 기존 거래는 별도 흐름 검사로 보완했다. 320px에서 새 서비스의 200% 글자 확대도
전체 브라우저 검사에 포함한다. 실제 기기·스크린리더·기관 서버/결제/실시간 지도는 검증한 범위가 아니다.

### 합산 회귀 검사에 남은 실패

`node --test tests/*.test.mjs v2/tests/*.test.mjs v3/tests/*.test.mjs`는 **24개 중 23개 통과, 1개 실패**다.
[합산 로그](.lemonade/site-interactions/node-tests.log)의 실패는 루트 `tests/v3.test.mjs:13`이 v3 경로 배열을
과거 132개와 완전히 동일해야 한다고 요구하는 항목이다. 실제 차이는 새로 구현한 경로 6개다.
이번 작업의 v3 전용 수정 범위를 지켜 루트 테스트를 수정하지 않았다.

현재 [v3 경로 검사](tests/routes.test.mjs)는 기존 132개가 모두 존재하는지, 새 경로 6개와 굿즈 렌더러가
등록되어 내용을 생성하는지 확인한다. 이는 기존 경로를 삭제하거나 실패를 숨기는 예외가 아니라
추가 기능을 포함한 현재 요구를 검사하는 계약이다. 다만 **루트까지 합친 검사 전체가 통과한 것은 아니다.**

### Lemonade 자동 점검과 시각 검토

- reference 프로필 lint: **0 FAIL / 199 WARN**, 33개 파일.
  [원본 결과](.lemonade/site-interactions/lemonade-lint.json)는 번호·분류 라벨·구분선·기존 카드·그림자 등의
  패턴 검토 요청이다. 회차/단계/분류/상태에 쓰인 표기는 실제 기능에 필요하므로 일괄 삭제하지 않았다.
- 브라우저 inspect: **0 FAIL / 6 WARN**, 1440·768·390px.
  [측정 결과](.lemonade/site-interactions/lemonade-inspect/report.json)와 [설명](.lemonade/site-interactions/lemonade-inspect.log)을 남겼다.
  경고는 공연 분류 머리말, 캐러셀 순서, 구분선, 글자 크기 단계, 영상 없음, 초기 화면에서 관측한 모션 수다.
- 실제 공연명·분류·슬라이드 위치·읽기 구분선과 기존 브랜드 위계를 유지했다. 영상이나 모션의 개수는 목표로 삼지 않았다.
  상태 변화 중심의 모션은 별도 브라우저 검사에서 직접 조작해 검증했다.
- 최신 미리보기 그림자는 사용자 요구에 맞춘 10% 값이며 원본 reference의 강한 그림자로 되돌리지 않았다.
- 자동 점검의 FAIL 0이 HTML/CSS/WCAG 전체 적합성이나 모든 시각 문제의 부재를 보증하지 않는다.

검토 화면:
[홈 데스크톱](.lemonade/site-interactions/desktop.png), [홈 모바일](.lemonade/site-interactions/mobile.png),
[메뉴 열린 상태](.lemonade/site-interactions/menu-open-1440.png), [메뉴 전환 중간](.lemonade/site-interactions/menu-midpoint-1440.png),
[이동 안내 데스크톱](.lemonade/experiences/arrival-1440.png), [이동 안내 모바일](.lemonade/experiences/arrival-390.png),
[자료 표 모바일](.lemonade/experiences/documents-390.png), [응모 상태 모바일](.lemonade/experiences/events-390.png).
모바일의 넓은 자료 표는 설명이 붙은 키보드 접근 가능한 영역 안에서 가로로 이동하고 페이지 전체는 넘치지 않는다.
화면 캡처와 보고서는 로컬 `.lemonade/` 산출물이므로 Git에 포함되지 않는다.

현재 v3 전용 기능·브라우저 검사는 통과했다. 합산 회귀의 기존 루트 검사 1개 실패와
실제 기관 서비스에 연결하지 않은 체험 범위는 위에 명시한 상태로 남는다.

## 2026-10-16 · 전체 사이트 모션 확장

사용자의 전체 사이트 모션 요청에 따라 Lemonade의 모션 발견·설계·개선·접근성·성능 자료를 상세히 읽고,
138개 등록 경로와 예매·신청·검색·주문 흐름을 검토했다. 전체 목록과 기준 상태, 적용 판단은
[전역 모션 감사와 구현 기록](docs/sitewide-motion.md)에 남겼다. 변경 파일은 `v3/` 안으로 제한했다.

### 실제 반영한 동작

| 대상 | 구현 |
| --- | --- |
| 페이지·스크롤 진입 | 누락됐던 프로그램 목록·상세 18개 경로를 포함한다. 제목 260ms/8px, 편집 문구 320ms/12px, 미디어 430ms의 짧은 가장자리 노출, 목록 opacity 220ms. 그룹 지연은 최대 105ms이며 화면 밖 내용은 보일 때 한 번만 실행한다. |
| 필터·삭제 후 목록 | 같은 항목의 이전·이후 위치를 측정해 220ms로 연결한다. 포커스된 항목은 위치를 고정하고 이동 거리가 큰 항목은 명도만 전환한다. 제거한 카드의 관찰도 즉시 해제한다. |
| 탭·달력·공유 | 포인터 탭·월 이동은 방향에 따른 200ms 전환, 키보드는 안정된 위치에서 응답한다. 공유는 160ms 열기·120ms 닫기, 현재 프레임에서 반전, 닫는 동안 접근 제외와 초점 복귀를 처리한다. |
| 길찾기·조회 | 지도와 안내문은 즉시 갱신하고 선택 경로의 SVG 선만 240ms로 그린다. 끝점·자료 건수·빈 결과·구독 결과는 국소 피드백을 사용한다. |
| 예매·신청·계정·굿즈 | 기존 단계 200ms·완료 220ms를 유지한다. 검증 오류·저장·취소 안내 180ms, 정확한 금액을 즉시 확정한 뒤 160ms 명도 전환, 삭제 후 다음 항목으로 초점 이동을 적용한다. |
| 접근·수명 | 키보드/포인터가 등장 중인 대상에 접근하면 즉시 정리한다. 펼침 도중 Tab 진입 시 높이 확정과 화면 내 초점을 보장한다. 최초·실행 중 모션 감소, 숨겨진 탭, 경로 이탈과 부분 목록 교체를 처리한다. |

카드 hover-lift, 스크롤 가로채기, 반복 장식은 추가하지 않았다. 표·정책 본문·좌석·입력값은 읽기와
조작 위치를 유지한다. 기존 히어로 2700/800/650ms, 포스터 오른쪽 아래 하트 180ms,
우측 공통 방문 미리보기 240ms·10% 그림자 계약을 보존했다. 새로운 라이브러리나 빌드 과정은 없다.

같은 경로의 필터는 포커스와 스크롤을 보존한다. 투어 소개에서 `?detail=1`의 실제 상세 화면으로
이동할 때는 새 화면으로 구분해 처음부터 읽도록 수정했다. 필수 비공식 사이트 알림을 닫은 뒤
진입 모션을 시작하므로 알림 뒤에서 애니메이션이 끝나지 않는다.

### 이번 실행 증거

대상은 `http://127.0.0.1:8091/v3/index.html`, 로컬 Chrome·Playwright다. 아래 검사는 이번 변경에서
직접 실행했다. 전용 모션 테스트는 실제 WAAPI를 확인하며 중간 캡처도 실제 애니메이션을 정지해 얻었다.

| 검사 | 결과·범위 | 근거 |
| --- | --- | --- |
| 전체 경로·반응형 | 138경로 × 1440/390/320px = **414개 조합**, 16개 그룹 통과. 콘솔·런타임·로컬 요청·HTTP 오류 0 | [보고서](.lemonade/sitewide-motion/browser-results.json), [로그](.lemonade/sitewide-motion/site-browser.log) |
| 전역 모션 | 138경로·14개 검사 통과. 두 화면 폭의 미디어·목록, 화면 밖 실행·반복 방지, 모션 감소, 빠른 이탈·부분 갱신 정리, 필터 포커스·스크롤, 관찰자 없는 환경 | [테스트](tests/sitewide-motion.cjs), [실행 결과](.lemonade/sitewide-motion/results.json) |
| 탐색 모션 | 분류·탭·공유 반전/Escape/inert, 지도 SVG240ms, 자료·이벤트·뉴스레터, 투어 새 상세 진입, 모바일·모션 감소 통과 | [테스트](tests/discovery-motion.cjs), 담당 실행 도구 출력, [.lemonade/discovery-motion](.lemonade/discovery-motion/) 캡처 |
| 거래 모션 | 오류·금액·저장·목록 실제 모션, 프로필/복구 초점, 삭제·취소·철회, 같은 검색어 재제출, 빠른 Tab 진입·모션 감소 | [테스트](tests/transaction-motion.cjs), 담당 실행 도구 출력, [.lemonade/transaction-motion](.lemonade/transaction-motion/) 캡처 |
| 기존 공통 모션 | 모달·펼침·재입력·키보드·모션 감소·경로 정리 통과 | [로그](.lemonade/sitewide-motion/motion.log) |
| 기존 이용 흐름 | 상품·예매·입장·내부 안내 회귀 통과. 13개 신청 폼의 필수 입력·수정·완료·저장·모바일 통과 | 담당 실행 도구 출력, [13개 신청 로그](.lemonade/sitewide-motion/applications.log) |
| 보존 계약 | 우측 공통 미리보기, 카드·하트·캐러셀, 320/390/768/1024/1440px 가독성 통과 | [미리보기](.lemonade/sitewide-motion/visit-preview.log), [카드](.lemonade/sitewide-motion/cards-carousel.log), [가독성](.lemonade/sitewide-motion/readability.log) |
| 정적 검사 | 현재 v3 Node 9/9, 실행 JS 구문과 현재 CSS 18개 파싱, `git diff --check` 통과 | [Node 로그](.lemonade/sitewide-motion/node-tests.log), 실행 도구 출력 |
| Lemonade | reference lint 0 FAIL/199 WARN, inspect 0 FAIL/6 WARN | [lint](.lemonade/sitewide-motion/lemonade-lint.json), [inspect](.lemonade/sitewide-motion/lemonade-inspect/report.json) |

Lemonade 경고는 앞선 검사와 동일한 실제 분류/순서 표기, 구분선, 글자 위계, 영상 부재와
자동 검사 중 관측한 모션 수다. 이번 전용 테스트가 조작·진입·중간 상태를 별도로 검증한다.
효과 개수나 영상 추가를 통과 목표로 삼지 않았다. 전체 경로 검사 뒤 독립 리뷰에서 발견한
부분 갱신 관찰 해제·펼침 도중 Tab·투어 상세 이동은 해당 회귀 검사와 공통 모션 검사로 다시 확인했다.

데스크톱과 모바일 크기의 실제 모션 중간 화면을 직접 검토했다.
[공연 상세 중간](.lemonade/sitewide-motion/program-1440-midpoint.png),
[모바일 상세 중간](.lemonade/sitewide-motion/program-390-midpoint.png),
[모바일 굿즈 목록](.lemonade/sitewide-motion/goods-390-midpoint.png),
[공유 패널](.lemonade/discovery-motion/share-open-1440.png),
[경로선 중간](.lemonade/discovery-motion/arrival-route-mid.png),
[수량 반영](.lemonade/transaction-motion/quantity-normal.png).
최종 모션 감소 상태에서 미디어 잘림·변위·잔여 애니메이션이 없음을 확인했다.

프레임 간격과 long task는 해당 headless Chrome의 짧은 샘플이며 실제 휴대전화 성능을 보증하지 않는다.
캡처와 로그는 로컬 `.lemonade/` 산출물로 Git에 포함하지 않는다. 이전에 기록한 **루트 테스트의
132경로 고정 기대값 실패 1개**는 이번 v3 전용 모션 작업에서 수정하거나 재실행하지 않았다.
따라서 위 통과 결과는 현재 v3 검사와 명시된 회귀 범위에 대한 결과다.
