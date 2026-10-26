# 최신 추가 계약: 카드·위계·하단 도형 복구

이 파일은 이전 회차의 하단 도형 제거 정책을 **명시적으로 대체**한다. 다른 과거 결정과
당시 캡처는 협업 이력으로 보존한다. 이 스킬은 여전히 하나이며 이 문서는 참고 자료다.

## 사용자가 추가한 상세 기준

1. 모든 사이트의 글자 위계를 재검토한다. 예시 `.visit-link-list strong`은 20px/650,
   display block이다. 기본 CSS를 통해 적당히 키우며 모든 글자를 무작정 확대하지 않는다.
2. 포스터 내부 패딩을 없애고 이미지가 가로·세로 모두를 채우도록 비율 유지 확대한다.
   `contain`이나 한 축만 채우는 방식은 안 된다. `object-fit: cover`로 필요한 가장자리를 자른다.
3. 하트는 평소 숨기고 카드 영역 hover에서 fade in한다. 올라오는 transform은 없다.
   이미지 아래 글까지 카드 영역이다. 키보드 focus와 hover 없는 터치에서도 접근 가능해야 한다.
4. 히어로는 2.7초마다 왼쪽으로 넘어간다. 마우스/터치로 양방향 직접 드래그한다.
   내부 텍스트·이미지·링크 native drag는 막고 우클릭은 보존한다.
5. 순간 검은 깜빡임 대신 서서히 명암·본문이 전환된다. 자동·수동·drag·루프 모두 동일하다.
6. `DEMO INFORMATION`의 색 띠 사각 박스를 제거한다. 체험임을 알려야 하는 정보는
   평문으로 남기고 한국어 제목을 쓴다. 고지 내용 자체를 숨기는 해결은 안 된다.
7. 소개 하단의 큰 민트 원·천지인 기하학 패널은 **지금은 제거하지 않는다**.
   이미 지워졌다면 그 부분만 git restore로 복구한다. reset은 절대 금지다.
8. 카드-배너도 카드의 아종이다. 내부 선택·native drag 차단과 전체 링크 정책을 공유한다.
   사용자 예시의 cyan 시즌 배너를 별도 예외로 두지 않는다.
9. 자주 쓰는 구조를 카드-히어로·카드-포스터·카드-배너 컴포넌트로 관리한다.
10. `PLAN YOUR VISIT`와 같은 불필요한 영문 장식은 한 화면만이 아니라 전수 조사한다.
11. 이 모든 과정·실패·수정 기준을 기존 단일 스킬에 다시 기록한다.

## 코드와 역할

| 파일 | 책임 |
| --- | --- |
| `v2/styles/defaults.css` | 16px 메타, 18px 본문, 20px 항목/카드 제목, 650 굵기 토큰 |
| `v2/src/components/cards.js` | 세 카드의 마크업, 전체 목적지, 독립 관심 버튼, 공통 native drag 차단 |
| `v2/styles/cards.css` | cover/무패딩, 전체 hover/focus, opacity-only heart, hero shade/copy, banner |
| `v2/src/components/carousel.js` | 2700ms 재생, 800ms 좌우 이동, pointer drag, 상태·cleanup |
| `v2/src/components/notices.js` | 필수 안내의 escaping·semantic note 마크업 |
| `v2/styles/notices.css` | 평문 안내와 정보 항목 글자 위계 |

포스터는 article 안에 이미지부터 장소까지 하나의 링크를 두고, 관심 버튼은 그 링크의
형제로 배치한다. 링크 안에 button을 중첩하지 않는다. 동적 목록 교체에도 root의 위임된
이벤트가 적용된다. 전체 카드의 user-select none과 draggable false만으로 끝내지 않고
native dragstart도 차단한다. contextmenu에 preventDefault를 붙이지 않는다.

데스크톱 하트는 opacity 0 → 1, 180ms이며 transform none이다. focus-within에서 보이고
coarse pointer/hover none에서는 기본 보인다. ‘숨김’ 때문에 스크린리더·키보드·터치의
관심 기능을 잃지 않는다. 브라우저 테스트도 먼저 카드에 hover한 뒤 실제 버튼을 클릭한다.

## 캐러셀 구현과 검토 근거

- 주요 프로그램 3개를 [-2,-1,0,1,2] 다섯 DOM 슬롯으로 순환한다.
- 왼쪽 이동은 next, 오른쪽 이동은 previous다. 전환을 시작할 때 2700ms 카운트를 재시작해
  전환 종료 후 2700ms를 추가로 기다리는 방식과 구분한다.
- 기본 이동은 800ms이며 명암과 copy는 650ms opacity 전환이다. ::before shade를 계속
  유지하고 opacity를 보간한다. 활성 이미지 DOM을 재사용하여 검은 overlay 재삽입을 피한다.
- pointer가 가로 6px를 넘었을 때만 capture한다. 세로 이동은 pan-y 스크롤을 유지한다.
  거리/속도 기준으로 방향을 결정하고 짧은 이동은 제자리로 돌아온다. drag 직후 click은 막는다.
- inactive slide는 inert/aria-hidden이며 수동 조작만 live region으로 알린다.
- hover·실제 카드 focus·화면 밖·문서 숨김·drag에서 재생을 멈춘다. reduced motion이면
  자동 재생 정지로 시작하고 수동 전환은 즉시 한다. 경로 이동 시 RAF·timer·observer·listener를 정리한다.
- 일반 클릭, 우클릭, 좌우 drag, 반복 루프, 모바일 스크롤을 구분해서 확인한다.

## 정밀 git restore 절차와 실제 수행

단순히 `git restore --source=과거커밋 -- 파일전체`를 하면 같은 파일의 이전 영문·주소 캡션과
다른 변경까지 되살릴 수 있다. 이번에는 다음 절차를 실제 사용했다.

1. 시작 상태와 fetch/pull 결과를 확인했다. 작업 대상 파일은 그 시점에 clean이었다.
2. `a5db6d34fee7b54ff6235351c3b6dadd2dd90b4f`에서 하단 diagram section과 해당 CSS 블록만 읽었다.
3. 현재 파일을 기준으로 그 블록만 합성했다. 과거 블록의 `HEAVEN · EARTH · HUMAN`은 제외하고,
   현재 heading id/aria 연결·영문 제거·주소 캡션 제거·plain navigation을 유지했다.
4. 임시 `GIT_INDEX_FILE`에 HEAD를 read-tree하고 선택 블록 patch만 cached apply했다.
5. 그 임시 index가 담은 파일이 의도한 전체 내용과 정확히 일치하는지 비교했다.
6. **임시 index 환경에서만** `git restore --worktree -- v2/src/features/pages.js v2/styles/information.css`를 실행했다.
7. 실제 작업 파일이 기대 내용과 일치하고 실제 staging index가 바뀌지 않았음을 확인했다.
8. 새 typography·영문 전수 정리는 복구 뒤에 이어서 적용했다. 따라서 증거의 after hash는
   ‘복구 직후’ 값이며 최종 파일의 해시라고 오인하지 않는다.

[실제 복구 기록](../evidence/identity-restore.json)은 source·각 파일 전후 hash·보존 대상을 담는다.
reset·파일 전체 되감기·다른 사용자 변경 폐기는 사용하지 않았다. 향후 dirty 상태에서는
현재 변경을 포함한 합성 결과와 diff를 먼저 보존하고 이 절차의 clean 전제를 그대로 복사하지 않는다.

## 장식 전수 조사의 분류

초기 조사에서 132개 등록 경로 중 129개에 eyebrow가 있었고 165개 서로 다른 label을 수집했다.
공통 pageHeader, section heading, info-card tag, overview intro, search header와 페이지별
하드코딩 문구를 조사했다. 중복 영문 머리말은 DOM에서 없앴다. CSS display none으로 숨기지 않았다.

영문을 일괄 삭제하는 정규식이 아니다. 실제 프로그램명, English 안내, 주소, 연혁, 권리 고지,
날짜·장르·공지 분류는 유지한다. 시즌 title에 이미 있는 이름 위의 중복 영문 eyebrow는 제거한다.
추가 모바일 전수 조사에서는 390/320px의 단계 안내·연혁·매거진 제목 축소 규칙도 찾아
같은 항목 역할을 20px로 조정했다. 큰 데스크톱 제목은 유지했다.
남은 eyebrow와 고지 computed style은 `scripts/check-decoration.cjs`가 경로별로 기록한다.
검사에서 경로를 제외하거나 체험 고지를 지워 통과시키지 않는다.

## 실제 실패에서 얻은 보완점

- 새 카드 검사 baseline은 공통 `.card--poster`가 없어서 실패했다. 이후 실제 component를 도입했다.
- 첫 자동 재생 검사는 page load 동안 Playwright clock도 흐르면서 2500ms 구간의 시작점이
  어긋났다. 시간을 install한 뒤 pauseAt하고 navigation하여 시작 조건을 고정했다.
  제품의 2700ms를 늘리거나 assertion을 느슨하게 하지 않았다.
- 이전 about 검사·정적 검사·스킬 정책이 ‘큰 도형 없음’을 요구했다. 최신 사용자 지시가
  이를 뒤집었으므로 코드뿐 아니라 검사·문서도 보존 정책으로 함께 바꿨다.
- 이전 캡처·검증 기록은 당시 결과로 남긴다. 새 결과는 별도 evidence와 최신 회차에 기록한다.

독립 검토에서 상세의 padding/contain 잔존을 찾아 **상세도 공통 posterMedia로 통일**했다.
상세 아래 기관 영문 반복 캡션도 제거했다. 목록 카드만 수정하고 같은 패턴을 상세에 남기지 않는다.
기본 검증 문서에도 새 카드·장식 검사를 추가해 메인 스킬과 실행 목록을 일치시켰다.
