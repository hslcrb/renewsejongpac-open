# 스킬 검증 시나리오와 기록

이 스킬은 저장소에 특화된 reference/운영 계약이다. 사용자 요구에 따라 개선의
상세 이력을 같은 패키지에 보존하되, 현재 실행 규칙과 과거 선택을 분리한다.

## 스킬 작성 전의 기준 확인

스킬 파일을 만들기 전에 독립 read-only 검토자가 기존 design-system.md와 CSS,
관련 source만 읽고 6개 상황에 답했다. 대화 전체나 새 스킬은 제공하지 않았다.

| 상황 | 기존 자료로 확인된 것 | 드러난 빈칸 |
| --- | --- | --- |
| about 영문 장식·민트 점·주소 caption | 중복 문구 제거 정책은 이미 문서에 있음 | 실제 페이지에 남음; 무의미한 도형 기준이 덜 명확 |
| 각진 삭제 알림 | .toast에 radius가 없음; role=status인 toast임 | 정확한 capsule와 dialog radius 계약 부재 |
| 작은 빠른 메뉴 | 16/18/20/22px, 48/64px 기준은 명시됨 | 과거 실패·수정 과정과 재도입 방지 연결 부족 |
| repo 이동·work branch·push | 기존 디자인 문서에는 없음 | 동기화·보존·원격 확인 절차 필요 |
| 200·bbox 양수인데 blank SVG | 일반 원인 후보는 진단 가능 | 이 프로젝트의 실제 nested viewport 실패 기록 없음 |
| 하나의 상세 스킬 | 참고 파일을 한 폴더 안에 둘 수 있음 | 전체 협업 ledger와 현재/과거/증거 경계 필요 |

독립 검토자가 baseline에서도 여러 좋은 권고를 했다는 사실을 숨기지 않는다.
‘스킬이 없으면 모든 판단을 실패했다’고 주장하지 않는다. 기존 repo의 구체적인
누락과, browser regression에서 실제 실패한 상태를 작성 근거로 삼았다.

### 실제 제품 RED

`node v2/tests/design-consistency.cjs`를 UI 수정 전에 실행했다.
`/about: decorative label remains: SINCE 1978 · GWANGHWAMUN, SEOUL` assertion으로
실패했다. 그 시점의 toast도 radius 선언 없이 사각이었다. before 캡처를 남긴 뒤 수정했다.

## 적용 시나리오

새 agent가 이 스킬을 읽고 아래 상황을 처리할 때 기대하는 결과다.

1. **시간이 부족한데 about에 장식 영문과 mint dot이 남음**
   - 정확한 대상과 같은 성격의 인접 중복을 제거한다.
   - 법적 고지·alt·실제 주소·연혁·아이덴티티 설명·링크는 보존한다.
   - 최신 요청은 하단의 큰 민트 원·천지인 도형 보존이다. 이전 제거 규칙을 재적용하지 않는다.
   - CSS pseudo-element·제목 옆 장식은 계속 제거하고, 본문 하단 도형 3개만 보존한다.
2. **사용자가 toast를 modal이라고 부르며 radius 100%를 요구함**
   - 실제 status toast를 찾는다. 9999px capsule, 비차단·polite·자동 닫힘 유지.
   - 큰 dialog는 24px이며 mobile에서 줄이지 않는다.
   - 100% ellipse나 새 blocking dialog로 오해하지 않는다.
3. **미니멀 메뉴가 작지만 4개 목적지는 유지해야 함**
   - label16, body18, lead20, action22/mobile20, control48, shortcut64를 적용한다.
   - 글자를 줄이거나 repeated card·보조 설명·화살표를 재도입하지 않는다.
   - hover/pressed/focus와 실제 이동을 확인한다.
4. **origin 변경, dirty work, work branch, 기존 push 권한**
   - status→fetch→안전한 pull/integration→검증→적절한 target push→SHA 확인.
   - credential 값 출력·reset·force push·무관한 작업 삭제를 하지 않는다.
5. **SVG response 200, geometry 양수, screenshot blank**
   - MIME·fragment·viewport·paint·CSS·clipping을 확인한다.
   - 이 sprite의 outer 0 0 24 24 / symbol 0 -960 960 960 관계를 찾는다.
   - 도형 bounds와 실제 캡처를 확인한다. 숨겨진 locator와 SVGRect API도 구분한다.
6. **이전 사용자 지적을 다음 작업에 재사용**
   - 하나의 sejongpac-renewmakes 패키지에서 현재 계약과 상세 이력을 검색한다.
   - 폐기된 12/14px를 현재 지침으로 쓰지 않는다.
   - 실제 실행·과거 결과·권고·운영 배포를 구분하고 내부 추론을 만들어내지 않는다.

## 이 패키지의 검사

- frontmatter name과 폴더 이름 일치, description의 trigger, 필요한 참고 파일 존재.
- Markdown의 로컬 참고·evidence 링크 존재.
- 실제 source의 작은 글자, 지적된 about 장식, toast shared stylesheet/token,
  modal radius, Material Rounded inventory와 symbol 목록.
- 독립 검토자가 위 시나리오를 새 스킬의 해당 규칙으로 해결할 수 있는지 확인.
- Node 및 browser 검사를 실제 실행하고 그 결과를 읽기.

기계 검사는 문서 전체의 설계 품질이나 사용자의 최종 만족을 보증하지 않는다.
독립 시나리오 검토는 실제 모든 도구 실행을 대신하지 않는다.

## 이전 회차 검증 결과 (도형 제거 당시의 기록)

실제 명령을 실행해 종료 코드를 읽고 다음을 확인했다. 기계 판독 기록은
[validation.json](../evidence/validation.json)에 보존한다.

| 실제 실행 | 결과 |
| --- | --- |
| Node 전체 suite | 13개 실행, 13개 통과, 실패·skip 0 |
| readability.cjs | 320/390/768/1024/1440px의 크기·너비·조작·배너 검사 통과 |
| design-consistency.cjs | 소개 2경로, 구·신버전 × desktop/mobile 삭제 toast, 검색·메뉴 dialog × desktop/mobile 통과 |
| check-routes.cjs | 132경로 × 1440/390/320px = 396회, 렌더 실패·문서 넘침·JS 오류·HTTP 오류 0 |
| scripts/check.py | 스킬 구조·참조 링크·7개 실제 캡처 해시·제품 기준 17개 통과 |
| 과거 451개 크기 교정 수 | a5db6d3의 parent와 해당 commit의 v2/styles diff에서 재확인 |
| git diff --check | 공백 오류 없음 |

독립 검토는 두 방향으로 수행했다.

1. **기존 자료만 읽은 baseline → 새 스킬을 읽은 6개 적용 시나리오**:
   현재·폐기 크기, capsule와 실제 modal, Git 대상/권한, SVG 문제와 증거 구분을 확인했다.
2. **이 채팅의 공개 요청·변경 과정과 스킬의 대조**:
   중요한 요구 누락은 없었고 상세 이력의 최종 결과 링크와 결과 기록 위치를 보완했다.

검토에서 발견한 실제 보완은 모두 반영했다.

- 문서는 dialog radius 검증을 말했지만 최초 테스트는 dialog를 열지 않았다.
  desktop/mobile에서 검색·메뉴를 열어 24px, Escape 닫힘과 초점 복귀를 실제 측정했다.
- 새 원격을 받은 경우 이전 origin을 먼저 pull할 수 있던 문서 순서를 고쳤다.
- 최종 결과 링크를 절차 안내 대신 실제 결과 기록으로 연결했다.
- 시각 검토에서 큰 민트 원을 브랜드 도형으로 남긴 중간 실패를 발견했다.
  소개의 큰 원·도형 패널·제목 옆 장식·반복 목록 태그를 제거하고,
  이 실수와 수정 및 실제 중간 캡처도 같은 스킬에 기록했다.
- 마지막 독립 재검토는 이 추가 수정과 보존 대상에 중대한 모순이 없음을 확인했다.

보존 캡처는 7개다. 이전 두 typography 캡처, 이번 about 수정 전/중간/최종,
이번 toast 수정 전/후다. 이전 icon/shortcut 단계의 /tmp 원본은 이 환경에 남아 있지 않아
가짜 before 캡처로 재작성하지 않았다. 해당 단계는 대화 이력과 commit으로 구분해 보존한다.

onboarding draft 저장 상태와 당시 runtime 버전 등은 대화에서 관찰된 이력이며,
현재 패키지만으로 원격 설정 backend를 다시 검증했다고 주장하지 않는다.
이번 로컬 검사와 Git push 또한 운영 사이트 배포 완료를 증명하지 않는다.


## 최신 추가 회차: 카드·위계·자동 전환·하단 도형 복구

최신 사용자 지시로 하단 큰 도형은 보존한다. 위의 이전 결과는 당시 제거 정책의
기록이며 새 기준을 대체하지 않는다. 현재 적용 계약은 cards-and-restoration.md다.

### RED와 실제 보완

- 독립 검토자는 기존 정책의 큰 도형 제거, 3초/700ms와 최신 요구의 모순을 확인했다.
- 새 cards-carousel baseline은 shared poster component 부재로 실패했다.
- 첫 timed 검사는 navigation 중 clock이 흘러 시작점이 달랐다. install→pauseAt→goto로
  고정한 뒤 2700ms 시작 간격을 실제 측정했다. 제품 시간을 바꿔 통과시키지 않았다.
- 초기 desktop 장식/위계 조사 후 390/320px까지 넓혔을 때 단계 안내·연혁·매거진 등
  제목의 17–19px 모바일 축소 규칙이 드러났다. 해당 역할만 20px/650으로 교정했다.
  [실제 보완 전 결과](../evidence/decoration-before-mobile-fix.json)는 실패 상태를 보존한다.
- 정적 검사 수정 중 실제 class가 `identity-shape`인데 `identity-shape-*`로 검사하여
  한 번 실패했다. 실제 DOM의 도형 3개를 검사하도록 바로잡았다. 제품을 검사 오류에 맞춰 바꾸지 않았다.
- 캡처 도구가 기존 `.program-grid` 대신 실제 `.home-program-grid`를 사용해야 했다.
  locator를 수정하고 촬영했으며, 원래 없었던 과거 캡처로 꾸미지 않았다.

### 실제 완료한 검증

| 명령/증거 | 결과 |
| --- | --- |
| Node 전체 | 13개 통과, 실패·skip 0 |
| readability.cjs | 320/390/768/1024/1440px, 링크·상태·키보드·carousel/reduced motion 통과 |
| design-consistency.cjs | 소개 두 경로의 하단 도형 3개 보존과 중복 제거, 양 버전 실제 삭제 toast, desktop/mobile dialog 동작 통과 |
| cards-carousel.cjs | 무패딩/cover, 전체 텍스트 hover/focus, opacity-only 하트, 터치 기본 노출, 마우스·실제 touch 양방향 drag, native drag 차단/우클릭 보존, 2700ms 주기와 중간 shade opacity, desktop/mobile 상세 poster 통과 |
| check-decoration.cjs | 132경로 × 1440/390/320px, 거부 문구·띠 고지 박스 0, 항목 제목 20px 이상, 남은 의미 있는 label 기록 |
| check-routes.cjs | 132경로 × 1440/390/320px, 렌더 실패·넘침·JS/HTTP 오류 0; 최종 모바일 제목 조정 뒤 390/320px 재검사 |
| check.py | 현재 토큰·도형 보존·카드/hero 계약·단일 skill 자료·SVG inventory 등 19개 통과 |
| screenshot | 신규 7개를 실제 촬영·검토, 이전 7개도 원본 유지. manifest의 14개 SHA-256 검증 |
| git diff --check | 공백 오류 0 |

[최신 기계 판독 결과](../evidence/validation-cards.json),
[장식·고지·위계 396개 화면 조사](../evidence/decoration-audit.json),
[전체 경로 검사 집계](../evidence/cards-routes-full.json)
(실제 [데스크톱 실행](../evidence/cards-routes-desktop.json)과 최종 모바일 재실행을 합산),
[마지막 모바일 재검사](../evidence/cards-routes-mobile.json)를 함께 보존한다.

GREEN 독립 문서 검토는 최신 핵심 정책의 일관성을 확인했다. 상세 포스터의 옛
padding/contain과 참고 문서 명령 누락도 찾아 실제 코드·문서에 반영했다.
이 검토자는 browser를 실행하지 않았으며 위 명령은 주 작업자가 실제 실행했다.
