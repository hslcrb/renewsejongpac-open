# 개발 운영, Git, 설치, 아이콘과 실패 해결법

## 1. 저장소 지도

| 위치 | 역할 |
| --- | --- |
| `README.md` | 실행·검증·버전 설명 |
| `assets/entry.*`, `index.html` | 버전 선택 |
| `legacy.html`, `js/`, `css/` | 구버전 |
| `v2/index.html`, `v2/src/` | 신버전 |
| `v2/styles/tokens.css` | 브랜드·폰트·레이아웃 token |
| `v2/styles/defaults.css` | 읽기·조작·상태·모달 radius 기본값 |
| `v2/styles/compat/` | v2 상세·신청 화면의 호환 스타일; legacy CSS 자체는 아님 |
| `assets/ui-feedback.css` | 구·신버전 공통 capsule toast |
| `assets/icons/` | 전체 Rounded SVG와 작은 runtime sprite |
| `scripts/vendor-material-icons.py` | 검증된 고정 archive로 icon 재생성 |
| `v2/docs/design-system.md` | 현재 제품 디자인 계약 |
| `v2/docs/verification.md` | 현재·이전 검증의 구분 |
| `tests/`, `v2/tests/` | 기존 Node/브라우저 검사 |
| `skills/lemonade/sources/` | 외부 참고 자료; 앱 dependency 아님 |

공통 이미지 경로는 root assets를 사용한다. `/v2/`만 docroot로 serve하면 공유 이미지·아이콘이
깨진다. 저장소 루트를 serve한다. favicon과 포스터·지도는 UI icon sprite와 구분한다.

## 2. Git부터 시작

1. 실제 checkout, AGENTS 지시, status와 현재 branch를 확인한다.
2. remote URL은 credential 값을 출력하지 않도록 sanitize해 확인한다.
3. 사용자가 새 URL을 지정했다면 그 URL에서 read-only fetch로 확인하고 origin을 갱신한다.
   이 조건은 이전 origin의 pull보다 먼저 처리한다.
4. 올바른 목적지에서 `git fetch origin` 후 `git pull --ff-only origin main`을 실행한다.
5. pull이 충돌·분기로 막히면 원인을 확인하고 기존 변경과 local commit을 보존해 통합한다.
   파일 삭제, reset, force, 무조건 stash로 작업을 감추지 않는다.
6. 작업·검증·diff 검토 후 관련 파일만 stage한다. secret, cache, unrelated user file을 넣지 않는다.
7. 명시적으로 허용된 대상에 일반 push한다. `work`라는 이름 자체가 원격 target은 아니다.
8. push 결과와 remote main의 SHA를 확인한다. dirty state가 남았다면 원인을 구분해 보고한다.

이 대화에서 사용한 통합은 `git push origin HEAD:main`이다. 이는 당시 base가 main이고
사용자가 push를 요청했기 때문이다. 미래의 다른 사용자·repo·branch로 일반화해 자동 push하지 않는다.
원격이 이동했다면 fetch/integrate/재검증하며 force push로 해결하지 않는다.

업무 중 status를 여러 번 읽는 것은 안전하다. fetch/pull을 명령 없이 반복하는 것이 목표가 아니다.
작업 시작 시 최신 상태를 갖추고, 외부 변경이 확인될 때 다시 통합하는 것이 목표다.

## 3. 실행 환경

```bash
cd /workspace/renewsejongpac
python3 -m http.server 8000 --bind 127.0.0.1
```

Python·Node·Playwright·시스템 Chromium의 실제 제공 상태를 확인한다.
이 대화에서 시스템 browser는 `/usr/bin/chromium`, Playwright module은 제공 runtime에서
resolve되었다. `chromium.executablePath()`의 bundled browser가 없다고 전체 browser가
없다고 판정하지 않는다. CHROMIUM_PATH override를 지원한다.

앱에 package manager install/build는 필요 없다. 문서나 manifest가 바뀌면 실제 요구를 다시 읽는다.
초기 설치가 필요 없는 앱에 boilerplate install_script를 만들지 않는다.
필요한 경우 캐시·도구를 `/tmp` 또는 허용된 외부 helper 경로에 둔다.

포트가 열려 있다는 사실만 보지 말고 다음을 요청한다.

- `/`: 두 버전 링크.
- `/legacy.html`, `/v2/index.html`: 올바른 app module 참조.
- `/js/app.js`, `/v2/src/app.js`: 200, JavaScript MIME, 비어 있지 않은 모듈.
- CSS, WOFF2, icon sprite: 올바른 MIME과 body.
- 실제 home/menu/search/favorite 또는 기존 functional test.

다른 프로세스가 사용 중인 포트를 정체 확인 없이 종료하지 않는다.
서버가 사라진 task에서는 다시 시작한다. snapshot은 살아 있는 process를 보존한다고 가정하지 않는다.

## 4. 클라우드 onboarding 한정 규칙

이 절은 개발 변경을 금지하는 규칙이 아니라 **환경 설정만 하는 작업**에 대한 범위다.
사용자가 코드 변경을 요청한 개발 작업에는 해당 변경 권한을 따른다.

- 환경이 starting이면 wait tool로 준비를 확인한다.
- 설정·network를 바꾸기 전에 onboarding contract를 읽는다.
- 실제 runtime status와 editable draft의 내용은 구분한다.
- 트래킹된 source/test/manifest/lockfile은 환경 설정 때문에 변경하지 않는다.
- 재현에 필요한 install_script와 process 재시작용 start_skill을 필요한 만큼만 저장한다.
- script와 startup 지침을 실제 working directory에서 실행해 검증한다.
- draft save는 실행·runtime 반영·게시가 아니다. UI의 review/save/publish와 구분한다.
- 권한·secret은 필요한 작업에서 실제로 없거나 사용할 수 없는지 확인한 뒤 요청한다.
- 환경 변수는 이름·존재만 본다. 값을 dump하거나 credential 파일을 읽어 출력하지 않는다.
- GitHub는 HTTPS Git proxy 인증을 사용할 수 있다. GH_TOKEN이 없어도
  `git ls-remote origin HEAD` 같은 실제 read가 될 수 있다.
- domain allowlist는 기존 custom entry를 보존한 additive 변경만 한다.
  읽을 수 없는 기존 allowlist를 모르는 목록으로 대체하지 않는다.
- localhost preview 링크는 onboarding UI에서 사용자용 링크로 안내하지 않는다.
- 이 대화에서는 start_skill을 저장했으며 추가 secret·network·install 변경은 필요하지 않았다.

## 5. Rounded SVG 전체 보관과 최소 runtime

현재 고정 배포:

```text
@material-symbols/svg-400@0.48.0
https://registry.npmjs.org/@material-symbols/svg-400/-/svg-400-0.48.0.tgz
sha512-W20MjbiDbLJQ5yi4CPz2y6lCZ9bk3pJ1d5Ra+uErvtj/guVrCNfcYyMZn3KqHpDyyKVfBGkuGHVcdi5h+5+EqA==
```

Google Material Symbols 원작을 marella/material-symbols가 최적화해 배포한다.
Rounded, weight 400, grade 0, optical size 48, fill 0/1의 전체 이름 목록이다.
Google 공식 배포 서버에서 모든 축의 SVG를 직접 받았다고 설명하지 않는다.

`vendor-material-icons.py`는 TLS를 유지해 archive를 받고 SHA-512를 검증한 뒤
Rounded SVG만 추출한다. XML을 parse하고 license와 catalog를 저장한다.
허용된 flat path만 추출하며 외부 archive 경로를 무조건 extractall하지 않는다.

`catalog.json`의 7,858 파일, 3,929 이름 쌍이 기준이다.
runtime sprite의 25개 symbol만 browser에 전달한다. catalog나 7,858 파일을
매 페이지 로드·동적 import하지 않는다. library completeness와 runtime payload는 다른 문제다.

### API와 상태

기존 `icon(name, size)` alias를 바꾸면 많은 화면에 영향을 준다.
arrow/diagonal/calendar/ticket/pin/wheelchair 등 기존 이름을 유지한다.
currentColor, width/height, aria-hidden, focusable=false를 보존한다.
favorite는 기본과 fill 심볼 두 use를 선택 상태 CSS로 전환한다.
동작 state가 바뀔 때 아이콘만 바꾸고 aria-pressed 또는 저장 상태를 놓치지 않는다.

JS 없는 버전 선택 링크의 화살표와 top 버튼은 외부 sprite를 직접 참조한다.
module에서 sprite URL을 만들 때는 import.meta.url 기반 상대 URL을 사용해
루트·v2·하위 배포 경로를 구분한다.

### 아이콘이 빈칸인 경우

| 관찰 | 다음 확인 |
| --- | --- |
| HTTP 200 | SVG MIME인지, HTML fallback이 아닌지, body와 fragment ID가 맞는지 |
| getBBox > 0 | x/y·extent가 바깥 viewport 안에 있는지 |
| 로컬 SVG 직접 열면 보임 | symbol/use 중첩 viewport, width/height, URL·same-origin |
| 경로 정상인데 보이지 않음 | fill/stroke/currentColor, opacity, ancestor display, clipping/transform |
| 첫 locator timeout | 실제 visible icon인지 숨겨진 메뉴의 node인지 |
| 일부 선택 상태만 실패 | outline/fill CSS와 실제 aria/저장 상태 |

이 프로젝트의 외부 symbol은 `viewBox="0 -960 960 960"`이고 바깥 svg는
`viewBox="0 0 24 24"`이다. 같은 음수 viewBox를 바깥에 중복하면 의도하지 않은
viewport 배치로 실제 그림이 잘릴 수 있다. 다른 SVG 구조에 이 숫자를 무조건 복사하지 않는다.

최종 확인은 실제 screenshot과 viewport 내 도형이다. SVGRect에는 환경에 따라
`.toJSON()`이 없으므로 x/y/width/height를 직접 읽는다.

## 6. 실제 실패에 따른 진단 원칙

| 문제 | 실패했던 해석/방법 | 해결한 방법 |
| --- | --- | --- |
| npm cache ENOENT | 앱 package 문제로 취급 | 허용된 `/tmp` cache 지정 |
| GitHub API 403 | 바로 token 요청 | 필요한 실제 Git/asset 경로를 별도로 시험 |
| huge npm pack JSON | 전체 파일 목록을 채팅에 출력 | 결과를 파일에 보관하고 metadata만 요약 |
| blank icons | 200와 bbox만 보고 통과 | screenshot, viewport bounds, viewBox 확인 |
| hidden icon timeout | 페이지가 고장났다고 추측 | 의미 있고 visible한 selector로 검사 수정 |
| pressed 색 없음 | hover 색만으로 상태 검증 | 실제 mouse down으로 cascade 오류 발견 |
| 6/7px 잔존 | 8~15px regex만 검사 | 모든 numeric font-size <16을 수치로 검사 |
| stale docs | 과거 13px 검사를 현재 기준처럼 유지 | 현재 기준과 과거 기록을 분리 |
| 적용 실패 patch | 일부가 적용됐다고 추측 | 실제 파일과 diff를 다시 읽고 수정 |
| server 응답 없음 | 이전 server가 살아 있다고 가정 | local request 후 필요한 경우 재시작 |
| 홈만 장식 제거 | 공통 문구 정책이 적용됐다고 판단 | 다른 route·pseudo-element·state까지 확대 검토 |

검사 실패는 제품 결함, 환경 결함, 검사 도구 결함을 구분한다. 잘못된 검사를 고칠 때
정상적인 제품 실패 신호까지 없애지 않는다. 같은 명령을 원인 변화 없이 반복하지 않는다.

## 7. 도구 운용과 출력

- 검색은 rg와 좁은 파일 범위부터 사용한다. 거대한 vendor/skill reference까지 검색해 잘린 출력을 피한다.
- 독립 read/check는 가능한 도구에서 병렬화한다. Git 변경·edit·install·push는 의존 순서대로 처리한다.
- 실행 tool이 session ID를 반환하면 해당 session을 기다려 실제 exit status를 확인한다.
- orchestrator JavaScript 환경과 shell의 Node/Python 환경은 다르다. filesystem/network 작업은
  제공된 execution tool에서 수행한다. 비동기 tool promise를 await해 수명이 끝나며 버려지지 않게 한다.
- 긴 로그는 파일로 보관하고 실패 원인·카운트·중요한 결론을 읽는다. 잘린 출력을 전체 증거라 부르지 않는다.
- 멀티라인 shell 문자열은 실행 가능한 코드다. 비밀값·command substitution이 노출되지 않도록
  구조화된 인자나 안전한 파일 쓰기를 사용한다.
- 권한·게시·메시지 발송은 작업의 실제 허용 범위를 따른다. README 수정이 외부 메시지 발송 허가가 아니다.
- 이 스킬이 요구하는 검증·동료 검토는 읽기 중심으로 수행하며 임의의 다른 agent가 같은 파일을 동시에 수정하지 않게 한다.
