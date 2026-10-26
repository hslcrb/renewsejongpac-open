---
name: sejongpac-renewmakes
description: Use when developing, redesigning, reviewing, documenting, or setting up renewsejongpac, especially when UI looks generic, text is too small, decorative captions persist, feedback corners look square, Material Rounded icons fail, or prior Sejong design decisions must be recovered.
---

# sejongpac-renewmakes

세종문화회관 리뉴얼의 실제 사용자 피드백과 구현·검증 경험을 다음 작업에 적용하는
**하나의 저장소 스킬**이다. 미니멀함은 읽기 쉬운 크기, 충분한 조작 면적, 목적 있는
콘텐츠와 상태 피드백으로 만든다. 글자를 작게 하거나 장식을 덧붙여 해결하지 않는다.

사용자가 명시한 폴더·스킬 이름은 `sejongpac-renewmakes`이다. 이름을 바꾸거나
여러 개의 독립 스킬로 분해하지 않는다. 아래 참고 파일도 이 스킬의 구성 요소다.

## 반드시 읽을 자료

1. 이 파일과 [사용자 요구·개선 과정 전체 기록](references/collaboration-history.md).
2. UI를 바꿀 때 [디자인 계약과 검토 기준](references/design-contract.md).
3. 설치·아이콘·Git·디버깅 작업에는 [개발 운영과 실패 해결법](references/engineering-runbook.md).
4. 완료 전 [검증 절차와 증거 기준](references/verification.md).
5. **현재 추가 요구와 구현 절차는 [카드·위계·복구 최신 계약](references/cards-and-restoration.md).**
6. 스킬 자체를 갱신할 때 [스킬 적용 시나리오와 검증 기록](references/skill-tests.md).

과거 시행착오는 상세 이력에, 현재 적용할 규칙은 이 파일과 디자인 계약에 둔다.
‘처음에는 이렇게 했다’는 기록을 최신 지침으로 오인하지 않는다.

## 저장소와 작업 시작

- 현재 원격은 `https://github.com/hslcrb/renewsejongpac.git`이다.
  `Build-with-Rhee/renewsejongpac`은 이전 경로다. 실제 remote와 사용자 최신 지시를 확인한다.
- 사용자는 **작업 전에 항상 git fetch/pull부터** 하라고 요구했다.
  먼저 상태와 최신 목적지를 확인한다. 새 원격 경로를 지정했다면 그 경로를 먼저 검증·설정한다.
  이후 `git fetch origin`, `git pull --ff-only origin main`을 수행한다. 이전 origin을 먼저 pull하지 않는다.
  변경이 겹치거나 분기되면 작업을 보존해 통합한다. reset·force push로 덮어쓰지 않는다.
- `/workspace/renewsejongpac`은 이 대화의 체크아웃 경로다. 다른 환경에서는 실제 경로를 찾는다.
- 클라우드 작업은 이미 격리되어 있다. 명시적 요청 없이 worktree를 만들지 않는다.
- 기존 변경과 무관한 파일을 보존한다. ‘아이콘만’ 같은 최신 범위 제한을 우선한다.
- 사용자에게 현재 이해한 범위와 구체적인 변경 방향을 짧게 알리고 작업한다.
  이미 명확한 일상적 구현 선택을 재승인받기 위해 멈추지 않는다.

## 개발 기본값

루트 정적 HTTP 서버 하나로 세 화면을 제공한다.

| 경로 | 역할 |
| --- | --- |
| `index.html` | 버전 선택 |
| `legacy.html` | 보존된 구버전 |
| `v2/index.html` | 신버전 |

HTML/CSS/네이티브 JavaScript ES module이다. 앱에는 패키지 설치·빌드·DB·인증키가
필요하지 않다. `file://`로 열지 말고 루트에서 `python3 -m http.server 8000 --bind 127.0.0.1`을
실행한다. `skills/lemonade/sources/`의 다른 프로젝트는 참고 자료이며 앱 의존성이 아니다.

## 현재 디자인 계약

| 역할 | 기준 |
| --- | --- |
| 본문 | 18px, `--text-body`, 행간 1.7 |
| 보조 정보·그룹명·날짜·고지 | **최소 16px**, `--text-sm` |
| 배너 아래 안내 | 20px, `--text-lead` |
| 카드 제목·방문 안내 항목 | 20px, `--text-card-title` / `--text-item-title`, 굵기 650 |
| 빠른 메뉴 | 데스크톱 22px / 모바일 20px, `--text-action` |
| 일반 조작 영역 | 기본 48px, `--control-size` |
| 빠른 메뉴 높이 | 최소 64px, `--shortcut-size` |
| 키보드 포커스 | 3px 외곽선, 4px 간격 |
| 짧은 상태 알림 | `--radius-pill: 9999px`의 완전한 캡슐 |
| 실제 검색·메뉴 모달 | `--radius-dialog: 1.5rem` = 24px, 모바일 유지 |

위 px 값은 브라우저 기본 16px 기준이다. 새 코드는 rem 기반 토큰을 사용한다.
`v2/styles/defaults.css`가 크기·굵기·행간·조작·상태 기준이고 `tokens.css`가 색상·폰트
등의 기준이다. 구버전은 비교용으로 보존하되, 공유 아이콘과 알림 형태는 일관되게 적용한다.

### 글자 크기

- 작은 화면에서는 줄바꿈·세로 배치·간격 조절을 사용한다. 글자를 다시 12~15px로 줄이지 않는다.
- `예술로 채우는 당신의 일상`, `일정·예매`, `방문 안내`도 실제로 읽는 정보다.
  중요 메뉴만 키우고 이 문구들을 작은 회색 글씨로 방치하지 않는다.
- CSS 선언뿐 아니라 computed font size와 스크린샷을 확인한다.
- `compat/` 및 media query, `!important`, `<small>`도 검사한다. 과거 6·7px가 남은 실패가 있었다.

### 미니멀한 메뉴와 상호작용

- 빠른 메뉴의 목적지는 공연 일정·예매 확인·오시는 길·관람 안내다.
- 현재 구조는 `일정·예매`와 `방문 안내` 두 그룹이다. 큰 글자와 클릭 가능한 여백을 유지한다.
- 동일한 회색 아이콘 박스 + 제목 + 설명 + 작은 화살표를 네 번 복제하지 않는다.
- hover는 옅은 상태 배경과 정적 밑줄, pressed는 구분되는 배경, focus는 외곽선으로 표현한다.
- hover-lift, 튀는 텍스트, 커지는 가짜 3D 그림자, 늘어나는 밑줄을 추가하지 않는다.
- 배너에는 현재 순서 / 전체 개수와 이전·다음·재생 상태를 실제 동작에 맞춰 표시한다.
  모션 감소, 키보드 이동, 화면 밖 재생 중단도 보존한다.
- 새 기능 그룹 코드에는 저장소의 `noslopui-one`에 맞춰 한·영 설명 주석을 둔다.

### 제거할 장식

다음은 이 프로젝트에서 사용자가 반복해서 거부한 구체적 예다.

- `광화문, 세종문화회관 / SEOUL · SINCE 1978` 사진 캡션.
- `SINCE 1978 · GWANGHWAMUN, SEOUL`과 옆의 장식용 민트 점·원.
- `A PLACE FOR EVERYONE` 및 같은 역할의 중복 영문 머리말.
- 사진 아래 `세종문화회관 · 서울특별시 종로구 세종대로 175`처럼 반복한 주소.
- 같은 한국어 설명 앞에 덧붙인 `HEAVEN · EARTH · HUMAN`, `OUR RESPONSIBILITY`.

문자열을 지운 자리에 다른 영문 슬로건·도형을 넣지 않는다. 같은 유형의 잔존 요소를
인접 섹션과 공통 컴포넌트까지 점검한다. 의미 없는 `::before` 점도 실제 장식이다.
반대로 길찾기의 실제 주소, 연혁의 1978년, 출처·권리 고지, 비공식/체험 안내,
대체 텍스트, 천·지·인 설명과 실제 아이덴티티 안내 링크는 필요한 콘텐츠다.
**최신 지시로 소개 하단의 큰 민트 원·천지인 도형 패널은 보존·정밀 복구한다.**
앞서 제거했던 정책은 이 부분에 한해 폐기되었다. 제목 옆 장식·작은 민트 점·영문 머리말·
주소 캡션까지 복구하지 않는다. 과거 제거 캡처는 당시 이력이며 현재 목표 화면이 아니다.
`PLAN YOUR VISIT` 등 한국어 제목과 중복되는 영문 장식도 사이트 전체에서 제거한다.
`DEMO INFORMATION`의 띠 네모 박스는 없애되 실제 체험·이용 조건은 평문 안내로 남긴다.

### 공통 카드와 히어로

- `components/cards.js`의 카드-포스터·카드-히어로·카드-배너를 사용한다.
- 포스터 매체 영역은 padding 0, 이미지 width/height 100%, object-fit cover다.
  가로·세로를 모두 채울 때까지 비율을 유지해 확대하고, 비율이 다르면 가장자리를 크롭한다.
- 이미지 아래 제목·날짜·장소도 하나의 카드 링크/호버 영역이다. 관심 버튼은 링크 밖에 둔다.
- 하트는 평소 opacity 0 → 카드 전체 hover/focus-within에서 1, **opacity만 180ms** 전환한다.
  위로 올라오는 효과를 넣지 않는다. 터치에서는 상시 보이고 키보드 접근이 가능하다.
- 히어로는 **2700ms 시작 간격으로 왼쪽 이동**, 전환 800ms, 명암·본문 fade 650ms다.
  이전의 3초/700ms 규칙은 폐기되었다. 마우스·터치로 양방향 직접 드래그한다.
- 카드 내부의 텍스트 선택·이미지/링크 native drag는 막지만 contextmenu는 막지 않는다.
  카드-배너도 같은 정책이다. 드래그 후 링크 오작동과 세로 스크롤 방해를 검사한다.
- 전환 중 DOM 전체를 새로 그려 검은 막이 갑자기 붙지 않게 한다. 기존 active 카드를
  유지·재배치하고 고정 shade opacity를 보간한다. reduced motion과 재생 중단도 유지한다.

### 알림 모서리와 일관성

사용자가 ‘관심 프로그램에서 삭제했어요 할 때 모달’이라고 부른 것은 현재 코드의
`#toast[role="status"][aria-live="polite"]`다. 이 기능은 비차단 토스트로 유지한다.

- 양끝을 완전한 반원으로 만든다. 0px·작은 radius로 각져 보이게 만들지 않는다.
- ‘radius 100% 최대’의 형태 의도는 `9999px` 캡슐로 구현한다.
  CSS `border-radius: 100%`는 긴 타원이 될 수 있으므로 문자 그대로 복제하지 않는다.
- `assets/ui-feedback.css`를 구·신버전에서 공유한다.
- 3.5초 자동 닫힘, 실제 관심 상태, 포커스와 접근성 의미를 유지한다.
- 토스트에 배경막·포커스 트랩·확인 버튼을 추가해 모달로 바꾸지 않는다.
- 실제 큰 모달은 24px 모서리와 닫기·Escape·초점 복귀를 확인한다.
- 모든 사진·지도·표를 캡슐로 만들라는 규칙으로 확대 해석하지 않는다.

## 아이콘 계약

Google Material Symbols **Rounded**로 UI 아이콘을 통일한다. 현재 보관 범위는
`@material-symbols/svg-400@0.48.0`의 Rounded 3,929종 × 기본/채움 2종 = 7,858 SVG다.
weight 400, grade 0, optical size 48이며 모든 weight·family·optical size를 받은 것은 아니다.
커뮤니티 배포 패키지와 Google 원작을 구분해 출처와 Apache 2.0을 보존한다.

- 전체 SVG는 `assets/icons/rounded/`, 목록은 `catalog.json`에 있다.
- 실제 화면은 25개 심볼의 작은 sprite만 읽는다. 전체 목록을 런타임에 import하지 않는다.
- `python3 scripts/vendor-material-icons.py`는 고정 SHA-512를 검증한 뒤 재생성한다.
- 공통 `icon(name, size)` alias, currentColor, 크기, 장식용 접근성 의미를 유지한다.
- 관심 상태는 outline / fill 심볼을 실제 선택 상태에 맞춰 전환한다.
- 재생 문자 `Ⅱ`, `▷`, 메뉴·화살표 텍스트 아이콘도 SVG로 교체한다.
- 외부 `<symbol viewBox="0 -960 960 960">`을 쓰는 이 sprite의 바깥 SVG는
  `viewBox="0 0 24 24"`다. 200 응답과 양수 getBBox만으로 그려졌다고 판정하지 않는다.
  실제 viewport 안의 도형과 스크린샷을 확인한다.

## 검증과 완료

루트에서 다음을 실행한다. 서버가 이미 있으면 정체와 응답을 확인해 재사용한다.

```bash
node --test tests/*.test.mjs v2/tests/*.test.mjs
node v2/tests/readability.cjs
node v2/tests/design-consistency.cjs
node v2/tests/cards-carousel.cjs
node skills/sejongpac-renewmakes/scripts/check-decoration.cjs
python3 skills/sejongpac-renewmakes/scripts/check.py
git diff --check
```

추가 기준:

1. 320·390·768·1024·1440px에서 대상 화면, 실제 크기와 조작 상태를 확인한다.
2. 전역 CSS를 바꾸면 132개 등록 경로를 데스크톱과 모바일에서 검사한다.
3. 첫 테스트 실패를 읽고 제품 오류와 검사 도구 오류를 구분한다. 통과하도록 조건을 숨기지 않는다.
4. 대상 요소가 화면에 실제로 그려지는지, 삭제 알림이 실제 삭제 동작에서 나오는지 확인한다.
5. 같은 요소의 구·신버전, 데스크톱·모바일, 기본·선택·포커스·누름 상태를 비교한다.
6. 실행하지 않은 검사, 게시 상태, 원격 배포를 완료했다고 말하지 않는다.

사용자가 푸시까지 요청했고 해당 범위의 권한이 유지되는 작업은 검증 후 커밋·푸시한다.
이 환경은 `work` 브랜치이므로 실제 통합 대상을 확인하고 일반 fast-forward push로
`main`에 반영한다. 원격이 바뀌면 다시 통합하며 force push하지 않는다.
`git ls-remote origin refs/heads/main`과 로컬 HEAD의 전체 SHA를 비교하고 상태를 확인한다.
푸시 성공은 운영 사이트 배포 성공이나 클라우드 환경 게시 성공을 뜻하지 않는다.

## 계속 개선하는 방법

사용자 지적 → 실제 화면·원인 확인 → 수정 → 공통 토큰/컴포넌트에 반영 → 문서·검사에
남김 → 관련 화면과 상태 재검증의 순서를 따른다. 사용자가 다시 지적한 항목은 이전
해결이 충분하지 않았다는 증거다. 같은 축소·장식·상태 누락을 다른 페이지에서 반복하지 않는다.

스킬에는 공개된 요청, 구현 결정, 관찰 결과, 재현법과 판단 근거를 기록한다.
모델의 비공개 내부 추론이나 확인할 수 없는 기억을 만들어 ‘모든 생각’으로 기록하지 않는다.
현재 규칙, 이전에 폐기한 선택, 실제 검증 결과, 향후 권장 검사를 분리한다.
