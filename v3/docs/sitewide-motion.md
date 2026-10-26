# v3 전역 모션 감사와 구현 계획

작성 기준: 2026-10-16 · 불변 기준 커밋 `b966fba` · 수정 범위 `v3/`

이 문서는 홈의 특정 구간뿐 아니라 모든 페이지와 공통 컴포넌트의 모션을 검토한 기록이다. 아래의 **기준 상태 검증**과 **구현 목표**는 구분한다. 구현 목표는 완료 주장이나 최종 테스트 결과가 아니다. 이후 통합 검증 결과는 실제 실행 증거와 함께 별도로 기록한다.

## 읽은 Lemonade 자료와 적용 판단

스킬 진입점은 [`lemonade/SKILL.md`](../../skills/lemonade/SKILL.md)이다. 프로젝트의 설치 경로 `/home/rheehose/.codex/skills/lemonade`에서도 동일한 자료를 읽었다. 기존의 CSS·JavaScript·Web Animations API를 유지하며 새 모션 라이브러리를 추가하지 않는다.

| 읽은 자료 | 이번 작업에 적용한 내용 |
| --- | --- |
| `references/motion-and-native.md` | 실제 웹 DOM·라우터·입력 장치를 기준으로 설계한다. 원본 자료의 대기·별도 스킬 호출 규칙보다 현재 사용자의 전체 구현 요청과 Lemonade의 공통 원칙을 우선한다. |
| `references/motion.md` | 움직임의 목적, 상태 전환, 계층과 타이밍을 먼저 정하고 장식 효과를 추가한다. |
| `sources/exskills/animateskills-main/skills-main/skills/find-animation-opportunities/SKILL.source.md` | 빈도·목적·속도·기능의 네 기준으로 후보를 걸러낸다. 모션을 넣지 않는 부분도 명시적인 설계 결정으로 남긴다. |
| `sources/exskills/animateskills-main/skills-main/skills/improve-animations/SKILL.source.md`와 `AUDIT.md` | 목적, 곡선과 시간, 출발점, 중단·반전, 성능, 접근성, 일관성, 누락된 피드백을 각각 확인한다. 코드 근거와 실제 브라우저 동작을 함께 기록한다. |
| `sources/exskills/animateskills-main/skills-main/skills/animate/SKILL.source.md`와 `RECIPES.md` | 공유 모션 함수에서 완료·취소·재입력과 정리 수명을 처리한다. 내용과 기능의 최종 상태는 애니메이션 완료를 기다리지 않는다. |
| `sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/micro-interaction/SKILL.source.md` | 버튼, 탭, 펼침 패널, 저장·삭제 피드백을 실제 변경 영역에 한정한다. |
| `sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/page-transition-animation/SKILL.source.md` | 실제 페이지 이동과 같은 페이지의 검색 조건 갱신을 구분한다. 필터 입력 포커스와 읽던 위치를 유지한다. |
| `sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/accessible-animation/SKILL.source.md` | 모션 감소 설정을 CSS와 JavaScript 모두에서 적용하고 실행 중 변경도 처리한다. 키보드로 접근한 대상은 즉시 안정된 위치에 보여 준다. |
| `sources/exskills/animateskills-main/skills-main/skills/animation-performance/SKILL.source.md` | 기본 속성은 `transform`과 `opacity`다. 레이아웃 비용, 관찰자·RAF 정리와 동시 실행 수를 확인한다. 데스크톱 샘플만으로 실제 휴대전화의 프레임 성능을 보장하지 않는다. |

원본 자료에 있는 강한 일반화는 그대로 규칙으로 옮기지 않는다. 순수 페이드는 결함이 아니고, 키보드 입력 자체가 모든 모션의 금지 사유도 아니다. 모션 감소에서는 즉시 최종 상태로 전환해도 된다. 네이티브 `details`의 짧은 높이 전환은 내용의 흐름과 포커스를 보존하기 위한 의도적인 예외다. 표와 글자를 확대·축소해 높이 변화처럼 보이게 하지 않는다.

## 기준 상태 검증

카탈로그 `PAGES`에는 **138개 경로**가 있다. 예매 `/booking/:programId`, 같은 경로의 자료·기사·주문 단계 쿼리, 필터 쿼리는 별도의 이용 흐름으로 함께 다룬다.

| 경로 그룹 | 경로 수 | 포함하는 화면군 |
| --- | ---: | --- |
| 홈 | 1 | 주요 프로그램, 프로그램 탐색, 소식, 방문 안내, 기관 아이덴티티 |
| 프로그램 | 30 | 네 종류 목록, 작품 상세, 시즌 목록과 상세, 예매·교육 안내, 투어, 역사 전시 |
| 대관 | 16 | 개요, 이용 기준·요금, 시설과 개별 공간, 일정, 절차·서류, 기술 장비, 신청·문의 |
| 이용안내 | 22 | 개요, 공간과 개별 공간, 교통·주차·방문 동선, 편의시설, 접근성, 관람 수칙, 고객지원·FAQ·문의·분실물, 단체관람 |
| 소식과 혜택 | 28 | 소식 개요·공지·채용 지원, 이벤트·응모 확인, 뉴스레터·아카이브·기사, 멤버십, 굿즈 목록·상세·장바구니·주문내역 |
| 기관 | 27 | 기관 개요·역사·조직·CI, 예술단과 개별 예술단, ESG, 정보공개·자료·신청, 협력·후원·아트센터 |
| 마이페이지 | 8 | 로그인·가입·계정 찾기, 대시보드, 예매·관심·신청 내역, 프로필 |
| 기타 안내 | 6 | 통합검색, 사이트맵, 개인정보·약관·이메일 안내, 영문 방문 안내 |
| 합계 | **138** | 모든 카탈로그 경로 |

실제 Chrome, 1440×1000 화면에서 localhost8091을 사용했다. 당시 병렬 작업의 영향을 피하기 위해 Playwright가 요청한 JavaScript를 `git show b966fba:<path>`의 내용으로 제공했다. 코드의 모션 호출을 추측하는 대신 `Element.prototype.animate()` 호출 대상과 시간을 기록했다.

- `/programs`, `/programs/carmen`에서 실제 페이지 이동 후 650px·1150px 스크롤까지 **WAAPI 호출이 0회**였다. 네 목록과 열네 작품 상세, 총 **18개 프로그램 경로**가 공통 `.page-title-row`를 사용하지 않아 페이지 진입 대상에서 빠졌다. 홈은 별도의 캐러셀이 있으므로 이 누락 수에 포함하지 않는다.
- `/programs/season/sejong`, `/programs/tour`, `/programs/history`, `/about/companies`, `/news/goods`, `/account/profile`, `/sitemap`, `/english`, `/policy/privacy`에서는 이 검사 구간에 `.page-title-row`의 160ms 페이드만 기록됐다.
- `/rental`, `/rental/schedule`, `/visit`, `/visit/directions`, `/about`, `/about/donation`, `/news`, `/news/membership`, `/news/newsletter`에서는 제목 160ms와 기존 아래쪽 편집 제목 320ms가 기록됐다.
- 기존 IntersectionObserver는 초기 화면 안에 있는 모든 후보를 건너뛴다. 따라서 제목 아래의 주요 소개 문구, 이미지, 목록이 첫 화면에 보이는 경우 별도의 진입 처리 없이 나타난다.
- 굿즈 완료 안내에는 이미 200ms CSS 진입이 있다. 따라서 굿즈 완료 모션 자체가 없다고 판단하지 않는다. 기본 상태에서도 모든 내용은 보여야 한다.

## 전체 화면군의 구현 목표

아래 시간은 기존 토큰과 의미를 확장하는 목표 범위다. 공유 코드가 최종 값을 정하고 테스트는 실제 동작과 취소 후 상태를 확인한다. 빈번한 입력에 불필요한 기다림을 추가하지 않는다.

| 화면·컴포넌트 | 기준 상태와 개선 목적 | 적용 대상·계획 | 움직이지 않을 부분 |
| --- | --- | --- | --- |
| 공통 페이지 진입 | 18개 프로그램 경로의 진입 누락을 해소하고 실제 화면 이동을 알린다. | `.page-title-row`, `.program-page-heading`, `.program-detail-summary`에 짧은 진입. 필터 쿼리에는 페이지 전체 진입을 반복하지 않는다. | 검색 입력, 가격, CTA의 상호작용 가능 시점 |
| 홈 | 기존 주요 모션을 보존하고 아래 편집 영역의 읽기 순서를 연결한다. | 기존 헤더·섹션 진입과 프로그램 결과 전환을 유지한다. 첫 화면 미디어·짧은 그룹 진입은 서로 겹치지 않는 대상에만 적용한다. | 히어로 2700ms 주기·800ms 이동·650ms 명암, 포스터 하트 180ms, 우측 공통 방문 미리보기 240ms |
| 프로그램 탐색·상세·시즌 | 목록·상세의 진입 누락과 결과·탭·공유 패널의 관계를 보완한다. | 제목, 포스터 미디어, 시즌 소개, 첫 화면의 작은 프로그램 그룹에 짧은 진입. 탭은 선택 내용만 전환하고 공유 패널은 열림·닫힘을 연결한다. | 필터 입력, 달력의 날짜, 표의 가격·시간, 작품 내용의 긴 본문 |
| 대관·방문·기관·소식 개요 | 주요 소개 문구와 이미지가 페이지 제목과 무관하게 나타나는 틈을 보완한다. | `.overview-intro-copy`, `.institution-story-heading`, `.news-editorial-copy`와 관련 미디어, 편집 제목의 1회 진입. 시작점·끝점이 보이는 상태에서 짧게 전환한다. | 주소·연락처·객석 수·조직도·장비와 요금표 |
| 안내·시설·예술단·멤버십·기사 | 소개 문구, 미디어, 조작 가능한 그룹의 계층을 드러낸다. | `.program-feature__copy`, 시즌·멤버십·예술단·후원 소개, 관련 사진·일러스트와 링크 그룹에 역할별 진입. 화면 밖 항목은 즉시 모두 실행하지 않는다. | 읽는 중인 문단, 법적 안내, 정적 CI 도형, 연혁 수치 |
| 검색·FAQ·자료·이벤트 조회 | 입력에 대한 새 결과를 확인시킨다. | 같은 경로에서는 결과 영역만 160–220ms. 직접 갱신과 라우터 갱신이 중복 실행되지 않게 한다. 빈 결과에도 동일한 상태 의미를 제공한다. | 입력 필드와 입력값, 읽던 스크롤 위치, 문서 표의 행별 내용 |
| 방문 동선 | 사용자가 선택한 동선과 단계가 바뀌었음을 알린다. | 결과의 설명·텍스트는 즉시 표시하고 선택 SVG 경로선만 240ms, 도착점은 180ms로 표시한다. | 전체 결과 패널, 지도 전체의 회전·확대, 위치를 계속 움직이는 효과 |
| 신청·예매 | 기존 단계 전환을 보존하고 오류·완료를 구분한다. | 실제 단계가 바뀔 때만 기존 8px 수직 이동·200ms 전환을 유지한다. 오류·상태는 국소 180ms, 성공은 220ms. 검증 메시지는 즉시 표시하고 적절한 입력으로 포커스를 옮긴다. | 좌석·인원·할인 반복 선택 때의 전체 폼, 금액의 숫자 카운트업 |
| 계정·저장 내역 | 프로필 저장, 계정 조회, 취소 확인과 삭제 후 목록 위치 변화의 맥락을 보존한다. | 상태 메시지, 확인 패널, 변경된 내역에 국소 피드백. 남은 목록 항목의 위치 전환은 필요한 경우에만 짧게 연결한다. | 입력 중인 프로필, 포커스된 삭제 인접 버튼, 이미 읽고 있는 전체 페이지 |
| 굿즈 | 수량·추가·삭제·검토·완료·취소의 의미를 분리한다. | 실제 갱신된 상태·금액·내역에 국소 피드백, 삭제 후 잔여 목록의 연속성, 검토 단계와 완료 안내. 기존 완료 CSS와 공유 진입이 중첩되지 않게 한다. | 네이티브 수량 선택 동작, 금액의 확정 시점, 주문 확인 내용의 가독성 |
| 검색·메뉴·공유·펼침·토스트·맨 위 | 기존 공통 모션을 유지하고 중단·반전·정리를 확인한다. | 네이티브 dialog의 모달·포커스 기능 유지, 재입력 시 현재 값에서 반전, details 닫힘 내용의 접근 차단, 동일 토스트 갱신. | 포커스 링, 필수 상태 알림과 실제 동작의 실행 시점 |
| 정책·사이트맵·영문 안내 | 다른 경로와 동일한 화면 이동 피드백을 제공하되 읽기를 방해하지 않는다. | 페이지 제목과 작은 탐색 그룹에 한정한 진입. 정책 본문은 정적 상태로 제공한다. | 정책 문단, 사이트맵 전체 링크의 장시간 순차 지연, 영문 주소·전화번호 |

공유 진입·정리·모션 감소·상태 API는 `src/components/motion.js`, 공통 상태 스타일은 `styles/motion.css`, 라우트 경계는 `src/app.js`에서 관리한다. 기능별 변경은 `features/programs.js`, `features/flows.js`, `features/pages.js`, `features/goods.js`가 실제 상태 변경 지점에서 공유 API를 호출하는 방식으로 연결한다. 이 감사 문서를 작성하는 작업은 해당 소스 파일을 수정하지 않는다.

## 적용하지 않는 효과와 통합 조건

- 호버로 카드가 위로 뜨는 효과, 이동하는 밑줄, 스크롤 가로채기, 패럴랙스, 반복 장식 모션은 추가하지 않는다.
- 이미지와 그룹의 부모·자식을 동시에 움직여 같은 내용의 투명도·변위를 중첩하지 않는다. 긴 목록에 항목 수만큼 지연을 쌓지 않는다.
- 화면 밖 대상은 보일 때만 실행하고 한 번 완료한 진입을 다시 스크롤했다고 반복하지 않는다. 첫 상태와 모션 감소 상태 모두 콘텐츠가 기본적으로 보인다.
- 키보드 포커스가 들어온 편집 영역은 즉시 최종 상태가 된다. 조작 결과의 짧은 피드백은 포커스 이동과 역할이 다르므로 구분한다.
- 모션 감소를 실행 중 변경하면 변위·확대·자동 재생을 정리하고 최종 상태를 확정한다. 같은 설정에서 오류·선택·완료 의미와 모든 버튼은 유지한다.
- 페이지 이탈·숨겨진 탭·연속 입력 시 애니메이션, 관찰자, 예약 프레임을 정리한다. 높이 측정은 네이티브 펼침처럼 필요한 경우에 한정하고 레이아웃 읽기·쓰기를 반복 프레임에 흩어 놓지 않는다.
- 필수 비공식 사이트 알림은 유지한다. 알림 전후의 실제 모션 시작·완료를 브라우저에서 확인한다.

## 통합 검증 계획

전용 테스트는 `tests/sitewide-motion.cjs`다. 기존의 `tests/motion.cjs`와 기능별 테스트를 대체하지 않는다. 캡처와 측정 데이터는 `.lemonade/sitewide-motion/`에 저장한다.

1. 실제 카탈로그 138개 경로와 화면군을 읽고 누락된 프로그램 제목 진입을 확인한다. 새 기능 경로를 임의로 추가하지 않는다.
2. 데스크톱과 모바일에서 페이지·편집·미디어·그룹 진입의 실제 WAAPI 대상과 시간을 확인한다. 초기·중간·완료 상태의 그림과 정보를 검토한다.
3. 중간 상태는 실제 생성된 애니메이션을 일시정지해 캡처한다. CSS를 임의의 시각 상태로 바꾼 그림을 모션 증거로 사용하지 않는다.
4. 화면 밖 진입의 지연 실행, 한 번만 실행되는 조건, 실행 전·중 키보드 포커스, 실행 중 모션 감소 전환, 빠른 라우트 이탈 뒤의 정리를 검사한다.
5. 필터는 페이지 전체 진입을 반복하지 않고 입력 포커스·스크롤을 보존하는지 확인한다. 정책 본문·숫자·좌석 등의 정적 결정을 검사한다.
6. 데스크톱과 모바일 크기에서 long task·프레임 간격의 짧은 샘플을 기록한다. 이는 해당 Chrome 실행 환경의 관찰값이며 실제 휴대전화·GPU·120Hz 화면의 성능 보증이 아니다.

실행 예:

```sh
NODE_PATH=/tmp/sejong-validation/node_modules \
CHROMIUM_PATH=/opt/google/chrome/chrome \
SEJONG_TEST_URL=http://127.0.0.1:8091/v3/index.html \
node v3/tests/sitewide-motion.cjs
```

### 기준 상태에서 제목 진입이 없던 18개 경로

`/programs`, `/programs/performance`, `/programs/exhibition`, `/programs/education`, `/programs/autumn`, `/programs/carmen`, `/programs/dance`, `/programs/chamber-autumn`, `/programs/sumire`, `/programs/hypnosis`, `/programs/light`, `/programs/art-goods`, `/programs/academy`, `/programs/art-class`, `/programs/ballet`, `/programs/choral`, `/programs/everyone-classic`, `/programs/winter`.

## 통합 구현 기록

현재 통합본은 다음과 같이 구현됐다. 계획의 넓은 후보 목록과 실제 적용 동작을 구분하기 위한 기록이다.

| 실제 역할 | 구현 동작 |
| --- | --- |
| 페이지 제목 | `sejong-enter-heading`: 불투명도 0.4→1, 세로 8px→0, 260ms. 네 프로그램 목록과 열네 작품 상세도 포함한다. 필수 고지를 닫은 뒤 시작한다. |
| 편집 소개 | `sejong-enter-editorial`: 불투명도 0.4→1, 세로 12px→0, 320ms. 첫 화면과 아래쪽 소개 영역을 같은 수명 규칙으로 처리한다. |
| 주요 미디어 | `sejong-enter-media`: 불투명도 0.5→1과 오른쪽 10%→0 `clip-path`, 430ms. 완료 후 애니메이션 효과를 제거하므로 이미지가 잘린 상태로 남지 않는다. 소식 개요는 실제 DOM의 `.news-editorial-feature > img`를 대상으로 한다. |
| 짧은 탐색 그룹 | `sejong-enter-group`: 불투명도 0.4→1, 220ms. 항목 사이 35ms, 지연 상한 105ms. 부모와 자식의 진입을 중첩하지 않는다. |
| 단계·결과·금액 | 신청·예매의 실제 단계 변경은 세로 8px·200ms를 유지한다. 좌석·수량·할인 변경은 해당 금액에 짧은 페이드만 적용하며 값은 즉시 확정한다. 프로필·조회·뉴스레터·검증 메시지는 국소 상태 180ms로 응답한다. |
| 달력·목록 | 월 이동에만 12px·200ms 방향 전환을 적용하고 키보드 월 이동은 페이드로 처리한다. 남은 카드·내역의 위치는 필요한 경우에만 짧게 연결한다. 날짜·금액·정책 본문은 장식 목적으로 이동시키지 않는다. |
| 방문 동선 | 전체 결과 패널은 즉시 갱신한다. SVG 경로선의 `stroke-dashoffset`을 240ms로 표시하고 도착점만 180ms 상태 피드백을 준다. |
| 공유 패널·공통 모달 | 공유 패널은 열림 160ms·닫힘 120ms, 검색·메뉴 dialog는 기존 220ms·150ms를 유지한다. 닫는 중에도 포커스 복귀와 모달 의미를 보존한다. |
| 입력 우선·정리 | 포커스·포인터가 진입 대상에 닿으면 해당 진입을 끝낸다. `cancelMotion()`은 `motion:cancel`을 통해 부분 교체 전 대기 중인 관찰도 해제한다. 실행 중 모션 감소는 즉시 최종 상태를 보여 준다. |

홈의 분류를 바꾸는 독립 브라우저 검토에서 제거된 카드 네 개가 IntersectionObserver에 남는 문제가 발견됐다. 부분 교체 전에 관찰 대상을 해제하도록 수정했고, 같은 동작을 전용 회귀 검사에 포함했다. 소식 개요의 미디어 선택자가 존재하지 않는 내부 링크를 가리키던 문제도 실제 이미지 선택자로 수정했다.

## 전용 통합 검증 결과

2026-10-16 00:57 KST에 [`tests/sitewide-motion.cjs`](../tests/sitewide-motion.cjs)를 실행했다. **138개 실제 라우트와 14개 검사 모두 통과**, 수집된 브라우저 실행 오류는 0개였다. 정확한 실행 시각·대상·측정값은 [`results.json`](../.lemonade/sitewide-motion/results.json)에 있다. 이는 이 전용 테스트의 결과이며 다른 기능별 테스트의 실행 여부를 대신 주장하지 않는다.

- 1440×1000, 390×844에서 실제 WAAPI 제목·미디어·그룹 애니메이션을 중간 시점에 정지해 캡처했다. 완료 후 미디어의 `clip-path`는 `none`으로 복귀했다. 소식 개요 이미지에도 실제 `sejong-enter-media` 애니메이션이 존재했다.
- 화면 밖 내용의 기본 가시성, 진입의 1회 실행, 대기·실행 중 키보드 포커스, 포인터 입력 우선, 실행 중 모션 감소, IntersectionObserver가 없는 환경의 정적 대체를 확인했다.
- 반복 라우트 이동 뒤 분리된 DOM의 실행 중 애니메이션 0개, 분리된 DOM의 관찰 대상 0개, 예약된 앱 RAF 0개였다. 홈의 분류를 바꾼 직후에도 제거된 카드의 관찰이 남지 않았다.
- 같은 경로의 FAQ 검색은 입력 포커스·스크롤을 유지하고 페이지 진입을 다시 실행하지 않았다. 정책 본문에는 진입 모션을 적용하지 않았다.
- 900ms 재생 샘플에서 두 화면 크기 모두 54개 프레임 간격을 관찰했다. p95 간격은 데스크톱 16.7ms, 모바일 크기 16.8ms였으며 두 샘플의 long task는 0개였다. **크기를 바꾼 headless 데스크톱 Chrome 관찰값이며 실제 휴대전화 성능 보증이 아니다.**

대표 캡처:

- 프로그램: [데스크톱 중간 상태](../.lemonade/sitewide-motion/program-1440-midpoint.png), [데스크톱 완료](../.lemonade/sitewide-motion/program-1440-settled.png), [모바일 중간 상태](../.lemonade/sitewide-motion/program-390-midpoint.png), [모바일 완료](../.lemonade/sitewide-motion/program-390-settled.png)
- 그룹: [데스크톱 굿즈](../.lemonade/sitewide-motion/goods-1440-midpoint.png), [모바일 굿즈](../.lemonade/sitewide-motion/goods-390-midpoint.png)
- 소식 미디어: [데스크톱](../.lemonade/sitewide-motion/news-1440-midpoint.png), [모바일](../.lemonade/sitewide-motion/news-390-midpoint.png)
- 모션 감소: [데스크톱 방문 안내](../.lemonade/sitewide-motion/visit-1440-reduced.png), [모바일 방문 안내](../.lemonade/sitewide-motion/visit-390-reduced.png)

포인터 입력 검사 뒤 남은 포인터가 다음 캡처의 진입을 정상적으로 완료해 버린 테스트 장치 문제가 한 차례 있었다. 경로 캡처 전에 포인터를 빈 위치로 옮기도록 검사를 고쳤으며 제품 동작을 바꾸지 않았다. 이전 실패 보고서는 [`results-pointer-fixture-failure.json`](../.lemonade/sitewide-motion/results-pointer-fixture-failure.json)에 보존했다.
