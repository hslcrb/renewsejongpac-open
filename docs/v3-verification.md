# v3 상호 참고 버전 검증 기록

## 대상과 기록의 시점

이 문서는 WIP 복구 후 다시 실행한 검사와, 이전 실행에서 보존한 증거를 구분한다.
Node·v3 브라우저·가독성·카드·HTML/CSS 검사는 재개 후 재실행해 통과했다.
기존 v2 브라우저 회귀는 이전 실행 결과로 구분한다. 이 검증은 운영 배포 완료를 뜻하지 않는다.

- 주 저장소 기준: `3abeb221b3e701bdd090173e2b376055933b608e`.
- 사용자 제공 참고 저장소: <https://github.com/hslcrb/renewsejongpac-philosophized>,
  확인 기준 `bbac18b66c547a2fe7c65414190ef99a8ca9d86a`.
- 실행 대상: 저장소 루트 HTTP 서버의 `v3/index.html`.
- 복사 출발점: 원본 추적 파일 10,181개, 복사 직후 누락 0개.
  원래 선택 화면은 `v3/version-selection.html`에 보존했다. 이 수치는 수정한 v3 파일이
  최종적으로 원본과 모두 같다는 뜻은 아니다.

작업 중 `e1a88fd`에 WIP를 보존한 뒤 `8d143b1`의 일반 복원 커밋으로 시작 상태를
되돌렸다. 재개 시에는 보존된 WIP를 `codex/v3-mutual-reference` 작업 브랜치에 복구했다.
이 과정에서 `git reset`을 사용하지 않았다. 재개 기준 main은 `3abeb22`이며,
최종 커밋·통합·푸시 결과는 이 문서에서 선행 주장하지 않는다.

## 검사 결과

| 검사 | 실행 시점과 확인 결과 |
| --- | --- |
| Node 전체 | **복구 후 재실행:** `node --test tests/*.test.mjs v2/tests/*.test.mjs` 16/16 통과, 종료 코드 0 |
| v3 브라우저 통합 | **복구 후 재실행:** `node tests/v3-browser.cjs` 14/14개 검사 그룹 통과, 종료 코드 0. 등록 경로 132개를 1440·390px에서 순회한 264개 조합 모두 통과 |
| v3 가독성 | **복구 후 재실행:** v3 URL을 지정한 `v2/tests/readability.cjs` 통과, 종료 코드 0. 320·390·768·1024·1440px의 글자·조작·상태·목적지·배너 검사 |
| v3 공통 카드·캐러셀 | **복구 후 재실행:** v3 URL을 지정한 `v2/tests/cards-carousel.cjs` 통과, 종료 코드 0. cover·무패딩, 카드 전체 상태, 하트, 드래그·우클릭, 시간·모션 감소 검사 |
| 기존 v2 회귀 | **이전 실행:** 원래 v2 대상 readability·cards-carousel·design-consistency 통과 |
| HTML | **복구 후 재실행:** HTML-validate 11.16.2의 standard+a11y 설정으로 루트 선택 화면, v3 홈·멤버십·카르멘 상세의 렌더된 HTML 검사. 각 화면 오류 0·경고 0, 종료 코드 0 |
| CSS | **복구 후 재실행:** CSS-tree 3.1.0 구문 분석과 Chromium `CSS.supports` 확인. 루트 `assets/entry.css` 172개, `v3/styles/refinements.css` 90개 선언의 구문 오류·미지원 일반 속성값 0, 종료 코드 0 |
| 폰트 | **복구 후 재실행:** v3의 로컬 Pretendard WOFF2 로드 확인. `@font-face` descriptor는 일반 CSS 속성과 분리하여 확인 |

v3 통합 검사는 세 버전 진입 링크, 132개 경로·15개 프로그램, 중간 폭 홈 배치,
분류별 결과 수, 관심 저장과 버전 간 저장소 분리, 검색·메뉴 Escape 및 초점 복귀,
모션 감소, 예매 완료·저장·취소, 멤버십 이동과 중성색 UI를 포함했다.
저장된 보고서의 브라우저·콘솔 오류, 실패한 로컬 요청, HTTP 오류는 모두 0건이다.
모든 경로의 모든 입력·완료 흐름을 각각 실행했다는 뜻은 아니다.

CSS 검사 초기에는 오래된 lexer의 수학 함수 판정과 `@font-face` descriptor를 일반
속성으로 분류한 검사 코드 때문에 잘못된 실패가 발생했다. 구문 분석과 브라우저의
속성 지원 확인을 분리하고 descriptor 분류를 바로잡아 다시 확인했다.
CSS-tree 4.0.1은 설치할 수 없어 사용하지 않았다. 위 결과의 실제 버전은 3.1.0이며,
지원 확인은 사용한 Chromium의 범위다.

전체 복사본을 포함한 `git diff --cached --check`는 복사된 `v3/skills/`의 116개 파일에
이미 있던 공백 진단 19,541건으로 종료 코드 2를 반환했다. 해당 파일은 기준 커밋과
바이트가 같으며, 원본 자료 보존을 위해 일괄 수정하지 않았다. 새로 작성·수정한 앱·검사·문서
범위의 공백 검사는 별도로 통과했다. 따라서 전체 복사본의 공백 검사까지 통과했다고 주장하지 않는다.

## 다시 실행하는 방법

앱은 HTML/CSS/네이티브 JavaScript 정적 사이트로, 실행에 패키지 설치나 빌드가 필요 없다.
저장소 루트에서 서버를 실행한다. `file://` 대신 HTTP로 연다.

```bash
cd /workspace/renewsejongpac
python3 -m http.server 8000 --bind 127.0.0.1
```

별도 터미널에서 아래를 실행한다. 서버 종료는 서버 터미널의 `Ctrl+C`다.
Node와 Playwright·Chromium은 검증용 도구이며 앱 런타임 의존성이 아니다.

```bash
node --test tests/*.test.mjs v2/tests/*.test.mjs
node tests/v3-browser.cjs
SEJONG_TEST_URL=http://127.0.0.1:8000/v3/index.html node v2/tests/readability.cjs
SEJONG_TEST_URL=http://127.0.0.1:8000/v3/index.html node v2/tests/cards-carousel.cjs
```

기존 v2도 별도로 확인한다.

```bash
node v2/tests/readability.cjs
node v2/tests/cards-carousel.cjs
node v2/tests/design-consistency.cjs
git diff --check
```

기본 Chromium 경로는 `/usr/bin/chromium`이며 필요하면 `CHROMIUM_PATH`를 지정한다.
다른 포트에서는 `SEJONG_TEST_URL`을 실제 v3 주소로 설정한다. v2 경로를 직접 쓰는
기존 스킬 검사만 통과한 결과를 v3 검사로 대체하지 않는다.

HTML/CSS 표준 확인은 별도 검증 환경의 HTML-validate 11.16.2와 CSS-tree 3.1.0,
Chromium에서 복구 후 재실행한 결과다. HTML은 위 네 화면의 실제 렌더 DOM을 standard+a11y로
검사하고, CSS는 위 두 파일의 파싱·일반 선언 지원·폰트 descriptor를 나누어 확인한다.
당시 보조 harness와 설치 도구의 지속 보존은 보장하지 않으므로, 저장된 JSON만 읽고
표준 검사를 재실행했다고 기록하지 않는다.

## 증거 파일

- [통합 검사 요약](v3-evidence/summary.json): 실행 대상·검사 그룹·264개 경로 조합·복사 기준.
- [HTML/CSS 검사](v3-evidence/standards.json): 도구 버전·대상 화면·선언 수·발견 사항.
- [데스크톱 캡처](v3-evidence/desktop.png), [모바일 캡처](v3-evidence/mobile.png).
- 상세 통합 결과와 실행별 캡처는 Git 제외 경로 `.lemonade/v3/`에 생성한다.
  `browser-results.json`은 132개 경로별 상태를 담는다. 재실행하면 같은 경로의 결과가
  갱신되므로 보존할 이전 증거는 먼저 따로 보관한다.

저장된 JSON의 시간·대상은 해당 실행의 기록이다. 캡처는 그 시점의 화면이며,
현재 브랜치의 새 실행이나 모든 상호작용의 통과를 자동으로 증명하지 않는다.
설계와 자료 검토 범위는 [v3 설계 결정](v3-design-decisions.md)에 구분해 기록했다.

## 미확인 범위와 서비스 경계

실제 스크린리더·물리 모바일 기기·Firefox·Safari에서는 확인하지 않았다.
HTML/CSS 검사와 Chromium 자동화가 이 환경들의 동작이나 WCAG 전체 준수를 인증하지는 않는다.
실제 결제·인증·티켓 발행·기관 접수는 구현하지 않으며, 브라우저 저장소의 체험 기능을
검사했다. 외부 서비스 가용성과 운영 배포도 검증 범위에 포함하지 않았다.
커밋·푸시·클라우드 환경 게시·운영 배포 상태는 검사 통과와 구분해 실제 결과로 기록한다.
