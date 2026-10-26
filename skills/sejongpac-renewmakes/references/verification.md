# 검증 절차와 증거의 범위

## 실행 전

1. 상태·remote·branch, 관련 AGENTS와 README, 현재 디자인 문서를 확인한다.
2. 사용자의 최신 범위, 기존 작업, 허용된 push 대상을 확인한다.
3. root HTTP 서버의 실제 응답을 확인한다. process만 존재한다고 충분하지 않다.
4. 제공 Node/Python/Playwright/Chromium을 확인한다. 앱용 설치가 필요하다고 추측하지 않는다.

## 기본 실행

저장소 루트에서, root HTTP 서버가 실행된 상태로:

```bash
node --test tests/*.test.mjs v2/tests/*.test.mjs
node v2/tests/readability.cjs
node v2/tests/design-consistency.cjs
node v2/tests/cards-carousel.cjs
node skills/sejongpac-renewmakes/scripts/check-decoration.cjs
python3 skills/sejongpac-renewmakes/scripts/check.py
git diff --check
```

전역 CSS·공통 component·routing 변경에는 다음도 실행한다.

```bash
node skills/sejongpac-renewmakes/scripts/check-routes.cjs
```

이 스킬을 추가한 시점의 Node 검사는 총 13개다. 미래에 테스트가 늘면 현재 runner의
실제 개수를 보고한다. 13이라는 숫자만 맞추기 위해 테스트를 건너뛰지 않는다.

환경 변수:

| 이름 | 용도 |
| --- | --- |
| `CHROMIUM_PATH` | 기본 `/usr/bin/chromium` 대신 browser 경로 |
| `SEJONG_TEST_URL` | readability의 v2 entry URL |
| `SEJONG_TEST_ORIGIN` | consistency/route-check의 origin, 기본 `http://127.0.0.1:8000` |
| `SEJONG_TEST_WIDTHS` | route-check 너비 목록, 기본 `1440,390,320` |

## 어떤 검사가 무엇을 증명하는가

| 검사 | 증명하는 범위 | 대신하지 못하는 것 |
| --- | --- | --- |
| Node 전체 | 필터·escape·예매 validation·storage·경로/자료/윤년 등 | 실제 CSS·SVG paint·touch target |
| readability | 5개 너비의 글자·영역·상태, 4개 목적지, 배너/모션 감소 | 모든 route의 모든 interaction |
| design-consistency | 두 소개 route의 제거/보존 대상, 두 버전 삭제 toast, dialog radius | 운영 배포나 다른 사용자 데이터 |
| cards-carousel | 포스터 cover/무패딩, 전체 hover/focus, 카드 입력, 양방향 drag, 2700ms 자동 전환 | 모든 경로의 업무 흐름 |
| check-decoration | 132개 경로 영문 장식 부재, 평문 고지, 잔존 정보 분류 | 미적 판단과 운영 배포 |
| static check.py | 패키지 구조·자료 링크·token·small size·아이콘 inventory 등 | 최종 화면의 미적 판단 |
| check-routes.cjs | 지정 너비 전체 등록 route의 rendering·문서 너비·오류 응답 | 전 화면의 예매 완료/입력 흐름 |
| screenshot 시각 검토 | 실제 크롭·공백·형태·누락·draw 여부 | DOM semantics, 실제 저장/취소 처리 |
| Git 원격 SHA | 의도한 remote branch에 commit이 있음 | hosting 배포 완료 |

## 브라우저에서 반드시 볼 상태

- 메뉴: default, hover, pointer down, keyboard focus, Enter 이동.
- 관심: off/on 심볼, 저장 상태, aria-pressed, 삭제 toast와 자동 닫힘.
- 배너: next/previous, 실제 current/total, play/pause icon·label·pressed,
  reduced/non-reduced motion, keyboard 이동.
- 모달: desktop/mobile radius, Escape/닫기, 초점 복귀.
- 소개: 삭제 대상 eyebrow·작은 점·제목 옆 장식·caption 부재,
  **하단 identity-shape 3개와 큰 민트 원은 복구·보존**,
  alt·한국어 설명·아이덴티티 안내 링크 보존.
- 전역 CSS: 132개 route의 desktop/mobile 폭, 주요 form/table/calendar가 읽히는지.

기존 legacy browser.cjs는 필요할 때 다음처럼 실행한다.

```bash
SEJONG_TEST_URL=http://127.0.0.1:8000/legacy.html node tests/browser.cjs
```

이 검사는 legacy용 selector를 쓰므로 v2 전체 검사를 대신한다고 부르지 않는다.
기타 accessibility/layout/applications/transactions/admission/hero suite는 변경과
관계 있을 때 실행하고 실행하지 않은 것은 unrun으로 구분한다.

## 제품 실패와 검사 실패를 나누기

- 숨겨진 첫 node를 기다려 timeout: selector의 의미를 수정한다.
- SVGRect.toJSON 없음: geometry API 사용을 수정한다.
- hover가 pressed를 덮음: 제품의 CSS cascade를 수정한다.
- 200이지만 SVG 안 보임: 실제 viewport와 screenshot을 수정 근거로 사용한다.
- 6/7px 잔존: migration regex와 실제 source를 수정한다.
- 값싼 통과 조건으로 교체하거나 assertion을 없애 문제를 감추지 않는다.

## 현재·과거 증거

이 채팅에서 과거에 관찰한 결과와 commit은 collaboration-history.md에 기록했다.
현재 스킬을 만들면서 새로 수행한 결과는 skill-tests.md에 기록한다.
과거 .lemonade 또는 /tmp 파일이 지금 없으면 존재한다고 쓰지 않는다.
이 스킬의 evidence 폴더에는 실제 남아 있거나 현재 캡처한 파일만 보존한다.

스크린샷을 현재 화면으로 다시 촬영해 옛 before 파일을 대체하지 않는다.
자동 검사 결과 파일은 이번 실행의 timestamp·target·width를 확인한다.
본문에 과거 사용자 지적 문자열이 교육 예제로 있는 것은 실제 앱에서 재도입한 것과 다르다.

## 완료·푸시 보고

변경 내용, 검증한 범위, 남은 실제 제약, commit/remote 결과를 짧게 보고한다.
오류·skipped·unrun과 성공을 섞지 않는다. 테스트 코드 생성, script 저장, draft 저장,
현재 실행, commit, push, environment publish, hosting deploy는 각각 다른 사건이다.

push 후에는 전체 SHA를 비교하고 status를 확인한다.
원격 경고가 있었다는 사실을 보안 검증·수정 결과로 바꾸지 않는다.
최신 사용자 요청이 취소·중지·범위 축소라면 그 지시를 우선한다.

최신 추가 검증은 [카드·위계·복구 계약](cards-and-restoration.md)과 skill-tests의 최신 회차를 따른다.
