# 메인 화면 스타일 정리 검수

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
