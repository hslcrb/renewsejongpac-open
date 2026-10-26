# 이 채팅의 요청과 점진적 개선 기록

이 파일은 이 스킬을 만들기까지의 공개된 대화·작업·관찰 결과를 보존한다.
사용자의 지적을 재사용 가능한 기준으로 연결한다. 당시 통과한 검사는 해당 시점의
결과이며 앞으로 자동 보장되지 않는다. 모델의 비공개 사고 과정을 재구성한 문서가 아니다.

## 1. 시작: 클라우드 환경 설정

**요청**: `Build-with-Rhee/renewsejongpac`, `main`을 대상으로
`cloud-environment-onboarding:setup` 스킬을 사용해 환경을 설정하라는 한국어 요청.

**수행과 발견**:

- 환경이 `starting`이었으므로 준비 완료를 기다렸다. 준비 전 빈 폴더를 저장소 누락으로 판단하지 않았다.
- `/workspace/renewsejongpac`의 README, Git 상태, 구조와 테스트를 확인했다.
- `find ... -name AGENTS.md`에서 별도 AGENTS 지시는 발견하지 못했다.
  다음 작업에서는 다시 실제 파일을 확인해야 한다.
- 이 앱은 루트 HTML, 보존된 구버전, 분리된 v2의 정적 사이트였다.
  프로젝트 루트에는 앱용 package manifest/lockfile, 빌드 단계가 필요하지 않았다.
- vendored skill 참고 소스에 많은 package.json이 있었지만 앱 설치 대상으로 삼지 않았다.
- Python 3.12.14와 Node v24.19.0이 제공되었다. 이 값은 당시 관찰이며 고정 버전 요구가 아니다.
- Python HTTP 서버를 루트에서 실행했다. ES module 때문에 file:// 실행은 피했다.
- 첫 필수 Node 검사 13개 통과. 루트/legacy/v2 HTML, 각 app.js,
  entry.css, tokens.css, Pretendard WOFF2의 200 응답·본문·MIME을 확인했다.
- 제공된 Playwright 모듈과 `/usr/bin/chromium`이 있었다.
  Playwright bundled browser는 없었지만 시스템 Chromium을 재사용했다.
- 구버전의 기존 browser.cjs로 132개 경로, 필터·관심·검색·예매 진입·완료·취소·
  모바일 메뉴·404를 확인했다. 오류·넘침·깨진 이미지·링크가 없었다.
- 설치할 앱 패키지·DB·새 인증정보가 없어 install_script는 만들지 않았다.
- 환경 draft에는 서버 재시작, working directory, 준비 확인, 테스트와 기존 격리 체크아웃
  사용을 담은 **start_skill만 저장**했다. `status: saved`, `requires_publish: true`였다.
- 저장소 파일 변경은 없었다. 환경 설정 저장과 환경 게시·새 작업 복원을 구분해 안내했다.

**배운 점**: 설치 성공/포트 열림만으로 준비 완료를 선언하지 않는다. 실제 기능 요청이나
기존 테스트를 실행한다. 재시작 지침을 저장하지 않은 상주 프로세스는 재사용 환경 설정이 아니다.

## 2. 첫 디자인 지적: Material Rounded, 먼저 fetch/pull, 아이콘만

사용자가 빠른 서비스 4개와 배너 하단 조작부의 스크린샷을 제시했다.
처음에는 ‘인간 디자이너가 한 것처럼 발전’, ‘Material 디자인 시스템’, ‘Rounded SVG 전체 다운로드’를
말했고 마지막으로 **‘그전에 먼저 항상 git fetch pull’, ‘아이콘들만 다 교체’**로 범위를 명확히 했다.

**수행**:

- 상태 확인 → fetch → `pull --ff-only`. `d5b2ab7`에서 `c9f2b47`까지 반영했다.
  이 upstream 변경에는 불필요한 hover 효과 제거 등이 포함되어 있었고 그대로 보존했다.
- 레이아웃·문구를 재설계하지 않고 아이콘 교체 범위를 우선했다.
- 구·신버전의 core.js에 같은 수제 path 목록이 중복되어 있었다.
  공통 `assets/icons/material-symbols.js`로 옮기고 기존 alias와 size API를 유지했다.
- 공식 Google 개별 SVG 경로는 확인할 수 있었지만 GitHub contents API는 proxy 403이었다.
  인증 토큰을 새로 요구하거나 네트워크 정책을 무분별하게 넓히지 않았다.
- npm의 `@material-symbols/svg-400` 0.48.0을 사용했다.
  이것은 Google 디자인의 커뮤니티 최적화 배포라는 점을 문서화했다.
- Rounded 3,929종의 fill 0/1, 총 7,858개 SVG를 저장했다.
  다른 weight와 Sharp/Outlined 및 모든 optical size를 받은 것처럼 말하지 않았다.
- SHA-512 고정값, 재생성 Python 스크립트, catalog.json과 Apache 2.0 라이선스를 보존했다.
- 화면에 필요한 25개만 sprite로 만들었다. 생성 당시 sprite는 11,852바이트였다.
- 선택 전·후 favorite 심볼을 분리하고 CSS로 outline/fill을 전환했다.
- 재생/일시정지의 `Ⅱ`/`▷`, 버전 선택의 ↗, 맨 위로의 ↑, 대관 달력 이전/다음,
  사이트맵의 프로그램 화살표도 Material SVG로 바꿨다.
- 지도·시설 개략도·물품 그림·포스터·브랜드 이미지·문장 속 화살표는 UI 아이콘과 구분해 보존했다.

**완료 당시 검증**: Node 13개, 기존 legacy 132개 경로·사용 흐름,
양 버전 SVG 렌더링과 favorite/play/pause 상태, 모바일 너비, 전체 SVG XML 파싱과 목록 일치.

## 3. 아이콘 작업에서 실제로 놓친 것과 해결

### npm 캐시 경로

기본 npm이 `/home/agent/.npm/_cacache` 생성 ENOENT로 실패했다.
앱 의존성 문제로 오진하지 않고 `npm --cache /tmp/sejong-npm-cache ...`로 수정했다.
TLS·서명·무결성 검사를 끄지 않았다.

### 도구 출력 폭발

`npm pack ... --json`은 패키지 전체 파일 목록을 출력해 출력이 잘렸다.
광범위 rg 검색과 diff 출력도 일부 잘렸다. 다음 작업에는 pack 출력을 파일에 쓰고
버전·integrity·크기·카운트만 요약한다. 잘린 결과를 전체 검사라고 보지 않는다.

### 보이지 않는 SVG

sprite 다운로드는 200이었고 getBBox의 폭·높이도 양수였지만 캡처에서는 아이콘이 비어 있었다.
외부 symbol의 `viewBox="0 -960 960 960"`와 바깥 SVG의 같은 viewBox가 겹치면서
표시 viewport 바깥으로 도형이 놓였다. 바깥 SVG를 `0 0 24 24`로 맞추고
도형이 그 viewport 안에 들어오는지와 실제 캡처를 다시 확인했다.
**양수 bbox와 포트/200 응답은 시각 성공의 증거가 아니었다.**

### 검사 도구 오류

- `.material-icon.first().waitFor()`가 숨겨진 메뉴의 첫 아이콘을 기다려 timeout이 났다.
  제품이 멈췄다고 판단하지 않고 visible 대상과 의미 있는 selector로 고쳤다.
- 초기에는 bbox의 폭·높이만 검사했다. 이후 x/y와 오른쪽·아래 경계도 확인했다.
- 한 번의 viewport 변경 직후 너비 검사에서 넘침이 나타나 baseline과 비교했다.
  안정된 현재/원래 화면 모두 390px이었고, 임시 레이아웃 상태와 제품 결함을 구분했다.
- 수동 편집으로 HTML `</head>` 들여쓰기를 깨뜨린 부분을 diff 검토로 찾아 고쳤다.

이 실패들은 유닛·경로 테스트가 통과해도 캡처 검토가 필요한 이유다.

## 4. 저장소 이동과 두 번째 디자인 지적

**요청**: 저장소가 `https://github.com/hslcrb/renewsejongpac`로 바뀌었다.
아이콘만 교체한 뒤에도 ‘버튼 4개가 AI스럽다’, ‘미니멀함은 유지하되 갈아엎어라’고 지적했다.

**수행**:

- 기존 미커밋 아이콘 파일을 보존하고 새 URL에서 fetch/pull했다.
  `5c26e2e`를 반영했고 origin을 새 경로로 설정했다.
- 이 시점에 upstream의 `skills/noslopui-one/SKILL.md`가 추가되어 있었다.
  한·영 기능 그룹 주석, hover-lift와 슬라이딩 밑줄 금지 규칙을 읽어 적용했다.
- 회색 아이콘 상자·설명문·개별 chevron을 제거했다.
- ‘일정·예매’와 ‘방문 안내’의 두 그룹, 4개 텍스트 링크와 작은 맨몸 아이콘으로 바꿨다.
- 실제 목적지 4개는 그대로 유지했다. semantic nav/list, focus, 키보드 이동을 확인했다.
- 당시 선택은 그룹명 **12px**, 빠른 메뉴 16px/모바일 14px, 최소 44px 높이였다.
  이것은 이후 사용자가 다시 지적한 **폐기된 크기 기준**이다.
- 화면 320/390/600/601/768/1024/1440px, 실제 링크 이동, hover 비이동,
  focus와 키보드 순서를 검사했다.
- 임시 검사에서 `getBBox().toJSON()`이 지원되지 않아 실패했다.
  SVGRect의 x/y/width/height를 직접 읽도록 바꿨다. 제품 코드 결함과 구분했다.

**핵심 교훈**: 아이콘을 통일했다고 배치의 품질이 좋아지는 것은 아니다.
반복 카드 구조와 콘텐츠 위계도 봐야 한다. 동시에 ‘작게 만들기’를 미니멀함으로 오인하면 안 된다.

## 5. 명시적인 푸시 요청

사용자가 **‘푸시까지’**라고 요청했다. 새 origin에서 다시 fetch/pull하고
테스트 13개, diff 검사를 통과한 변경을 커밋했다.

- 작업 브랜치는 `work`, 게시 대상은 기존 `main`이었다.
- `git push origin HEAD:main`으로 일반 push를 했다. force를 사용하지 않았다.
- `f47e03562da629c671c6d1d7401b79eafc5d2492`
  — `Refine quick navigation and adopt Material Symbols Rounded`.
- 로컬 HEAD와 원격 main의 전체 SHA 일치 및 깨끗한 상태를 확인했다.
- 원격이 Dependabot 경고를 출력한 사실은 이 작업에서 보안 문제를 조사·수정했다는 뜻이 아니다.
  이 대화에는 보안 감사나 해당 경고의 검증 결과가 없다.

## 6. 세 번째 지적: 너무 작다, 문서와 기본 CSS가 필요하다

**요청**:

- ‘너무 작다.’ `예술로 채우는 당신의 일상`, `일정·예매` 등의 글자도 작다.
- ‘문서화하고 디폴트 CSS 만들어서 확실하게 폰트 사이즈 등 디자인 체계를 정립하라.’
- 사진 아래 `광화문, 세종문화회관 / SEOUL · SINCE 1978`은 쓸데없는 AI 장식이다.
- 첨부 영역을 충분히 크게 하고 제대로 interactive하게 하라.

**수행과 현재 기준**:

- fetch/pull 후 `v2/styles/defaults.css`를 만들고 token/base/component/feature의
  연결을 문서화했다. v2 compat CSS에도 동일한 최소 크기를 적용했다.
- 본문 18px, 보조 정보 최소 16px, lead 20px, 빠른 메뉴 22px/모바일 20px.
- body/label/action/heading weight 400/500/600/720, 행간 1.7/1.5.
- 일반 조작 기본 48px, 빠른 메뉴 높이 64px. 3px/4px focus.
- 448개의 작은 font-size 선언을 먼저 치환했다. 이 숫자가 최종 전체 교정 수는 아니었다.
- 최종 소스 검사에서 6px 1곳과 7px 2곳이 추가로 발견되어 수정했다.
  전체 451개의 16px 미만 선언을 최소 크기 토큰으로 옮긴 과정이다.
- `<small>`, media query와 `!important`도 빠뜨리지 않고 검사했다.
- 배너 문구를 모바일에서 숨기는 대신 별도 줄에 유지했다.
- 메뉴의 텍스트뿐 아니라 클릭 가능한 영역과 아이콘도 키웠다.
- default는 흰 바탕, hover는 옅은 배경+정적 밑줄, pressed는 다른 배경으로 구분했다.
- 배너에 `01 / 03`을 추가해 실제 이동과 갱신했다.
  재생 토글의 aria-pressed, 수동 이동 aria-live, 모션 감소 상태를 확인했다.
- 큰 사진의 중복 캡션, 홈의 ‘취향이 모이는 곳’·‘새롭게 전하는 이야기’·
  ‘첫 방문도, 익숙한 발걸음도’, 중복 영문 identity 머리말을 제거했다.
- 빠른 메뉴 grid는 글자 설정 확대 시에도 배치할 수 있도록 rem 기반 minmax/auto-fit을 사용했다.

**실제로 잡은 오류**:

- CSS의 `:hover`가 뒤에 있어 같은 specificity의 `:active`를 덮었다.
  실제 마우스 누름 검사가 timeout으로 이를 잡았다.
  hover selector를 `:hover:not(:active)`로 바꾸고 pressed 색을 확인했다.
- 13px 기준이 남아 있던 이전 verification 문서와 현재 기준을 구분해 기록했다.
- 일부 patch의 잘못된 context 때문에 apply가 거절되었다.
  거절된 patch를 적용됐다고 가정하지 않고 정확한 블록을 읽고 다시 적용했다.

**검증**:

- `node --test tests/*.test.mjs v2/tests/*.test.mjs`: 13개 통과.
- 신규 `v2/tests/readability.cjs`: 5개 너비의 computed size·클릭 높이·너비·
  hover/pressed/focus·4개 목적지·배너 순서·재생·모션 감소 통과.
- 132개 경로 × 1440/390/320px에서 렌더 실패와 문서 가로 넘침 없음.
- 390px 달력·상세·길찾기·접근성·예매·로그인을 추가로 확인했다.
  길찾기 표의 내부 스크롤과 전체 문서 넘침을 구분했다.
- 모든 v2 CSS의 literal font-size가 16px 미만이 아닌지 검사했다.

**커밋**: `a5db6d34fee7b54ff6235351c3b6dadd2dd90b4f`
— `Establish readable typography defaults and improve home controls`.
main push와 원격 SHA 일치를 확인했다. 운영 배포 완료를 주장하지 않았다.

## 7. 이번 요청: 한 스킬에 전체 과정, 소개 페이지와 알림까지

**요청**:

- 이 채팅의 작업·얻은 노하우·놓친 것·사용자 요구로 점차 개선한 과정을 상세히 스킬화.
- 이름과 폴더는 **`skills/sejongpac-renewmakes`**, 하나의 스킬.
- 먼저 `/v2/index.html#/about`의 `SINCE 1978 · GWANGHWAMUN, SEOUL`,
  민트 원, `A PLACE FOR EVERYONE`, 사진 주소 캡션을 제거.
- ‘관심 프로그램에서 삭제했어요’ 알림의 사각 모서리를 완전히 둥근 캡슐로.
- 거의 각져 보이는 낮은 radius도 허용하지 말고 일관성을 검토할 것.
- 이 지적 자체도 스킬에 포함할 것.

**구현**:

- fetch/pull로 시작했다. baseline browser test는 실제 about 장식 문자열 때문에 실패했다.
- 실제 코드는 비차단 toast였고 기존 .toast에는 border-radius 선언이 없었다.
  사용자 표현 ‘모달’을 그대로 새 blocking modal로 구현하지 않았다.
- about와 about/introduction의 중복 영문 머리말, 민트 pseudo-element,
  photo figcaption을 제거했다. 같은 성격의 HEAVEN/EARTH/HUMAN 및 책임 머리말도 정리했다.
- pageHeader에 showEyebrow 옵션을 추가해 해당 페이지의 중복 category도 숨겼다.
- 처음에는 사진 alt, 한국어 기관 설명, 실제 연혁, 주소가 필요한 footer와 함께
  설명이 붙은 천·지·인 도형도 보존하려 했다. 실제 캡처를 다시 보니 큰 민트 원·도형
  패널이 그대로 남아 있었다. 사용자 지적을 작은 9px 점으로만 해석했던 추가 실수다.
- 큰 원·도형 패널과 제목 옆의 작은 브랜드 장식도 소개 페이지에서 제거했다.
  천지인 설명·CI 안내 링크를 흰 바탕의 단정한 본문으로 남겼다.
  OPEN/WITH/GIVE와 불필요한 목록 번호도 정리했다.
- 이 수정 과정 자체를 최신 교훈으로 기록했다. 명시적 제거 요구를 ‘브랜드 의미’라는
  임의의 예외로 피하지 않는다. 다른 페이지의 실제 로고·CI 자료는 별도로 구분한다.
- `assets/ui-feedback.css`를 두 버전에서 공유해 `--radius-pill: 9999px`를 적용했다.
  role/status, polite, 기존 3.5초 자동 닫힘, 관심 상태를 유지했다.
- 실제 navigation dialog는 `--radius-dialog: 1.5rem`(24px)로 데스크톱·모바일을 통일했다.
- `v2/tests/design-consistency.cjs`로 실제 추가→삭제, 알림 내용·모서리·크기·
  비차단·자동 닫힘과 about 제거/보존 대상을 검증한다.
- 이 스킬은 한 개의 SKILL.md와 상세 참고 자료, 검사 도구, 보존한 시각 증거로 구성했다.

검사 절차는 [검증 안내](verification.md), 이 단계의 실제 결과는
[스킬 검증 기록](skill-tests.md)을 확인한다. 보존 캡처는 아래 목록에 있다.
현재 commit SHA를 스킬 안에 추측해서 쓰지 않는다. 실제 Git log가 최종 근거다.

## 8. 협업 방식에 대한 누적 교훈

1. **사용자의 마지막 범위 제한**을 우선한다. 첫 작업에서 ‘개발하라’ 뒤의 ‘아이콘만’이 중요했다.
2. **재지적은 실제 실패 신호**다. 아이콘만 통일한 화면, 더 작게 만든 미니멀 메뉴는 충분하지 않았다.
3. **반복 지적을 규칙으로 승격**한다. 픽셀 수정 → 토큰·공유 CSS → 문서 → 렌더링 검사.
4. **공통 지침만 쓰고 끝내지 않는다.** 홈에서 제거한 장식이 about에 그대로 남은 것이 이번 실패다.
5. **일관성은 페이지뿐 아니라 상태**를 포함한다. favorite outline/fill, hover/pressed,
   play/pause, toast radius, mobile dialog radius까지 비교한다.
6. **현재 프로세스는 일시적**이다. 서버가 사라졌으면 실제 응답을 확인해 다시 실행한다.
7. **실행 증거의 경계를 지킨다.** 13개 Node 검사와 132개 browser 경로는 서로 다른 증거다.
8. **실패를 숨기지 않는다.** 검사 코드 오류는 검사 코드를 고치고, 실제 UI 오류는 제품을 고친다.
9. **불필요한 재확인을 줄인다.** 명확한 지시와 기존 권한 범위에서 작업·검증·푸시를 마친다.
10. **보존 상태를 정직하게 기록**한다. 이 환경에 남지 않은 과거 /tmp 캡처를 재생성해
    당시 원본인 것처럼 저장하지 않는다. 아래 evidence에는 실제 확보한 파일만 둔다.

## 보존한 시각 증거

- [가독성 개편 후 데스크톱](../evidence/readable-desktop.png)
- [가독성 개편 후 모바일](../evidence/readable-mobile.png)
- [이번 about 수정 전](../evidence/about-before.png)
- [작은 점만 지우고 큰 원을 놓친 중간 단계](../evidence/about-intermediate.png)
- [이번 about 최종 수정 후](../evidence/about-after.png)
- [이번 toast 수정 전](../evidence/toast-before.png)
- [이번 toast 수정 후](../evidence/toast-after.png)

이미지 파일은 특정 시점의 캡처이며 최신 UI의 자동 검증을 대신하지 않는다.

## 9. 추가 요청: 읽히는 위계, 공통 카드, 직접 드래그, 도형 보존으로 변경

이번 사용자는 6개 이미지를 첨부하고 다음을 명시했다. 요구를 이전보다 더 크게
과장하지 않고 구체적인 값·영역·효과로 옮겼다.

- 첫 CSS 이미지처럼 방문 안내 항목 제목을 **20px / 650 / display block**으로.
  기본 CSS와 사이트 전체 위계를 조정하되 크기를 무작정 올리지 말 것.
- 카드 매체 내부 패딩 없이 비율을 유지해 가로·세로 모두 채울 것.
- 하트는 평소 숨기고 **아래 글까지 포함한 카드 전체 hover에서 opacity fade만** 적용할 것.
- 히어로는 **2.7초마다 왼쪽으로** 이동하고 마우스·터치로 양방향 직접 드래그할 것.
- 카드 내부 이미지·텍스트·링크의 native drag는 금지하되 우클릭은 보존할 것.
- 색 띠 `DEMO INFORMATION` 네모 디자인과 `PLAN YOUR VISIT` 같은 영문 장식은 제거·전수 조사할 것.
- **소개 하단 큰 민트 원·기하학은 지금 삭제하지 말 것. 이미 지웠다면 그것만 git restore로 복구. reset 절대 금지.**
- 시즌 카드-배너도 카드의 변형으로 다루고 내부 native drag를 막을 것.
- 전환 때 순간적으로 검게 깜빡이지 않고 천천히 fade할 것.
- 카드-히어로·카드-포스터·카드-배너 같은 자주 쓰는 것은 공통 컴포넌트로 관리할 것.
- 이 모든 지적과 과정도 같은 스킬에 상세히 추가할 것.

### 이전 규칙의 명시적 폐기

7절의 ‘큰 원도 제거’는 당시 구현을 기록한 역사다. **현재는 이 규칙을 적용하지 않는다.**
최신 사용자 요청에 따라 하단 천지인 도형 3개를 복구·보존한다. 이 변경은 제목 옆 작은 도형,
작은 mint dot, 중복 영문 머리말, 사진 주소 caption을 다시 살리라는 지시가 아니다.
과거 about-after.png와 validation.json은 그때의 증거로 남긴다.

### 구현·검증 과정

1. 시작 시 git 상태와 원격을 확인하고 fetch/pull했다. 기존 변경 없이 최신 main과 일치했다.
2. 이전 commit에서 하단 도형 section과 CSS만 선택했다. 현재 내용을 기준으로 합성해
   임시 index에 patch를 올리고 그 index에서 실제 `git restore --worktree`를 실행했다.
   source·전후 hash·실제 index 불변을 [복구 기록](../evidence/identity-restore.json)에 남겼다.
3. 새 browser contract의 baseline은 공통 카드 component 부재로 실패했다.
4. cards.js에서 3개 카드와 공통 posterMedia를 분리했다. 홈·목록·관심 목록·연관 프로그램은
   같은 programCard를 사용하고 상세 포스터도 공통 무패딩/cover를 사용한다.
5. 포스터는 이미지부터 날짜·장소까지 하나의 링크로, 관심 버튼은 그 밖의 독립 버튼으로 만들었다.
   하트는 전체 hover/focus opacity 180ms이며 터치에서는 기본 보인다. opacity 효과에 transform을 쓰지 않았다.
6. carousel.js에 2700ms/800ms 재생, 양방향 pointer drag, 클릭 억제, 기존 DOM 재배치 루프,
   지속되는 shade/copy opacity 650ms를 구현했다. reduced motion·키보드·재생 중단·cleanup을 보존했다.
7. 최초 clock 검사는 page load 동안 시간이 흘러 자동 전환의 시작점을 잘못 잡았다.
   navigation 전에 install + pauseAt으로 고정해 실제 2700ms를 검증했다. 제품 시간을 늘려 통과시키지 않았다.
8. 초기 132경로 eyebrow 조사에서 129경로/165개 서로 다른 label을 확인했다.
   공통 pageHeader·section·overview·카드 tag·search header와 inline/dynamic 영문,
   flow-kicker까지 조사했다. 이름·분류·날짜·English 안내는 보존했다.
9. 전수 조사에서 폼 제목 17px, 공지 제목 19px, CI 색상 이름 18px 등이 남아 있었다.
   같은 항목 제목 역할은 20px/650, 본문은 18px, 메타는 16px 토큰으로 조정했다.
   모바일 뉴스 제목도 예외 없이 항목 제목 체계를 따르게 했다.
   조사를 390/320px까지 넓히자 단계 안내·연혁·매거진 등의 모바일 축소 규칙도 드러났다.
   데스크톱의 더 큰 제목은 유지하고 해당 모바일 항목만 20px/650으로 맞췄다.
   [모바일 보완 전 실제 조사 결과](../evidence/decoration-before-mobile-fix.json)를 보존했다.
10. note 컴포넌트와 CSS를 분리했다. 체험·이용 조건은 남기고 색 띠·회색 사각 배경·과한 padding을 제거했다.
11. 독립 read-only 검토는 최신 정책의 핵심 일관성을 확인했고, 상세 포스터 padding/contain 잔존과
    참고 검증 문서의 새 명령 누락을 찾아냈다. 상세도 공통 posterMedia로 바꾸고 명령 목록을 맞췄다.
12. 실제 screenshot으로 desktop/mobile cover·텍스트·히어로·복구 도형을 확인했다.
    모바일 hero의 주요 인물이 잘리던 crop을 72% focal position으로 조정했다.

코드·정확한 입력/복구 절차는 [최신 계약](cards-and-restoration.md),
이번 실행의 결과는 [스킬 검증 최신 회차](skill-tests.md)에 남긴다.

### 이번 회차 시각 증거

- [공통 히어로 데스크톱](../evidence/cards-hero-desktop.png)
- [공통 히어로 모바일](../evidence/cards-hero-mobile.png)
- [포스터 카드 데스크톱](../evidence/cards-posters-desktop.png)
- [포스터 카드 모바일](../evidence/cards-posters-mobile.png)
- [20px/650 방문 안내 항목](../evidence/cards-visit-desktop.png)
- [영문 장식을 제거한 방문 안내 페이지](../evidence/cards-visit-page.png)
- [최신 지시대로 복구한 하단 도형](../evidence/cards-identity-restored.png)
