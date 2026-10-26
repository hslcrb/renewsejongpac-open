---
name: lemonade
description: Use when designing, building, redesigning or reviewing public-facing websites, Korean content portals, cultural venues, portfolios, marketing pages or a page from visual references. Also use when a frontend needs stronger composition, readable hierarchy, faithful reference interpretation or less generic design. For app screens, preserve the existing workflow and use only relevant composition guidance.
---

# lemonade / 레모네이드

레퍼런스의 생김새와 사용 목적을 함께 읽고, 실제 콘텐츠에 맞는 화면을 설계한다.
공식 표기는 **lemonade / 레모네이드**다. 결과물에는 실제 고객의 브랜드를 적용한다.

## 판단 순서

사용자의 명시적 요구 → 기존 브랜드·콘텐츠·동작 → 접근성과 실제 과업 → 관찰한 레퍼런스 → 스타일 프리셋 순으로 판단한다.
카드·아이콘·구분선·상태 라벨·색상은 용도에 따라 선택한다. 특정 장치를 없애려고 일정·가격·공연명·예매 상태를 지우지 않는다.
공통 기준은 [principles.md](references/principles.md), 이미지 해독과 섹션 선택은 [wireframe.md](references/wireframe.md)를 따른다.

## 1. 콘텐츠와 과업

대상·방문자·주요 행동·스택·실제 자산·브랜드 제약을 확인하고 빠진 사실은 가정으로 표시한다.
고유한 장소·공정·작품·이야기를 찾되 이름·연혁·고객·성과를 만들어내지 않는다.
섹션마다 **과업 / 주장 / 증거 / 필수 필드 / 항목 수 / 행동 / 상태**를 한 줄로 기록한다.
공연·상품·기사 목록의 날짜·장소·가격·분류·상태는 비교 가능한 순서로 보존한다.

## 2. 확대해서 읽기

사용자 이미지가 우선이다. 전체 위계를 본 뒤 원본 픽셀로 영역을 나누어 글자·정렬·크롭·컨트롤을 읽는다.
축소된 전체 이미지만 보고 결론 내리지 않는다. 불분명한 글자·폰트·정확한 CSS 수치·움직임은 미확인으로 둔다.
보드의 바깥 프레임·그림자·제목을 실제 사이트 구성으로 오해하지 않는다.
루트 `와이어프레임 실습.png`는 12992×4984다. 역할과 조사 좌표는 [wireframe.md](references/wireframe.md)에 있다.
패키징에 원본이 없으면 분석 기록을 읽고, 원본을 다시 보았다고 주장하지 않는다.

## 3. 레퍼런스 선택

`<skill>`은 이 스킬 폴더다. 기록된 사례를 필요한 역할로 좁힌다.

```bash
node <skill>/scripts/references.mjs --list
node <skill>/scripts/references.mjs --role quick-access
node <skill>/scripts/references.mjs --id gdweb-26873
```

관련 사례와 대조 사례의 밀도·이미지 형태·사용 목적을 비교하고 채택/기각 이유를 기록한다.
추가 증거가 필요하면 GDWEB 상세 선정작과 원 사이트에 직접 접속한다. URL·확인일·읽은 영역·관찰·추론을 남긴다.
정적 캡처와 라이브 접속 결과를 구분한다. 수상·조회 수·사진만으로 전환율·사용성·모바일 동작을 입증하지 않는다.
레퍼런스 사진을 결과물에 재사용할 권리는 별도 확인한다. 고객 자산으로 가장하지 않는다.

새 방향이 필요할 때만 기존 20개 방향 라이브러리를 후보로 활용한다.

```bash
node <skill>/scripts/draw.mjs --sector culture --brief "실제 대상과 과업" --sections list,showcase,contact,footer --options 3
node <skill>/scripts/draw.mjs --list roles
```

레퍼런스와 브랜드가 이미 방향을 정했다면 추첨을 생략한다. 기존 브랜드는 `--keep palette,type`으로 보존한다.
달력·뉴스처럼 도구에 없는 역할은 직접 설계한다. blueprint를 맞추려고 사용자의 정보 구조를 바꾸지 않는다.

## 4. 구성과 구현

Nav·hero·quick-access·short-grid·wide-grid·flat-list·panel·footer는 선택 가능한 역할이다.
8개를 모든 페이지에 순서대로 넣지 않는다. 비교하는 항목은 정렬을 반복하고 과업이 바뀌면 구성을 바꾼다.
그리드 기준선·본문 너비·주/보조 비율·타이포 단계·간격·색상 역할을 정한다. 기존 기술 스택을 유지한다.
코드로 옮길 때는 [implementation-review.md](references/implementation-review.md)를 읽는다. 이미지 고유 크기와 CSS 크롭,
실제 한글 글꼴·본문 크기, 콘텐츠와 상태의 일치, 검증 가능한 행동을 함께 설계한다.
한글은 실제 글꼴·폭·어절로 확인한다. 영어 단어 수나 두 줄 규칙 때문에 긴 공연명과 의도된 3줄 문장을 훼손하지 않는다.
포스터는 인식 가능한 비율을 지키고 사진은 얼굴·사물·텍스트 영역을 확인해 크롭한다.
사진 수·영상 의무를 두지 않는다. 실제 UI·일러스트·타이포 중심 구성이 더 맞으면 선택 이유를 남긴다.

메뉴의 닫힘/펼침/포커스, 필터의 선택/빈 상태, 달력의 날짜/일정, 예매의 가능/매진/예정 상태를 구현한다.
버튼에는 실제 목적지나 정직한 데모 상태를 연결한다. 로컬 데모를 저장·예약·결제 완료처럼 표현하지 않는다.
캐러셀은 이전/다음·현재 위치·키보드·자동 재생 중단을 확인한다. 핵심 내용을 넘겨야만 찾게 하지 않는다.
동작은 전달과 조작 피드백을 돕는 범위에서 사용하고 reduced-motion에서도 콘텐츠와 행동을 보존한다.
필요하면 `node <skill>/scripts/assets.mjs --help`로 열린 컬렉션에서 자산을 찾는다. 이미지 생성은 이용 가능한 도구가 있을 때만 한다.

## 5. 확인하고 개선

데스크톱 전체 흐름 → 중요한 영역 확대 → 390px 모바일 → 중간 너비 → 키보드/상태 순으로 확인한다.
모바일은 축소 복사본이 아니다. 제목·포스터·필수 메타데이터·행동을 보존하며 열 수와 읽는 순서를 다시 구성한다.
본문 확대에서도 겹침·잘림·가로 넘침을 확인한다. 자동 검사 통과가 시각 품질이나 실제 과업 검증을 대신하지 않는다.
휴식 상태의 전체 페이지뿐 아니라 열린 메뉴·스크롤된 예약 창·오류·성공 상태도 본다. UI를 연 채로 반응형 경계를 넘겨본다.
검사 전에 예상 항목·상태·금액·목적지를 정한다. 화면에서 다시 읽어 만든 예상값만으로 정답을 검증하지 않는다.

```bash
node <skill>/scripts/lint.mjs <project> --profile reference
node <skill>/scripts/inspect.mjs <url-or-html> --profile reference --widths 1440,768,390
```

`reference`가 기본값이다. 스타일 경고는 맥락과 증거로 검토하고 실제 깨짐과 대비 오류를 고친다.
`--allow`로 실제 깨짐을 숨기지 않는다. 이전 엄격한 스타일 실험이 필요할 때만 `--profile house`를 명시한다.
Node 및 Chrome/Edge/Chromium이 필요하다. 사용할 수 없으면 가능한 검사와 확인하지 못한 내용을 구분해 보고한다.
산출물은 프로젝트 `.lemonade/`에 저장한다. 큰 문제부터 고치고 다시 본다. 같은 수정이 두 번 실패하면 배운 점을 보고한다.
실패 보고서와 해당 캡처를 보존하고 수정 뒤 영향을 받은 화면·동작을 다시 확인한다. 자동 검사·시각 관찰·수동 조작의 범위를 구분한다.
로컬 샘플은 작업 디렉터리·실행 명령·접속 주소·종료 방법을 쉽게 찾을 수 있는 README에 남긴다.

## 6. 근거를 축적

참고한 사례·구성 선택·기능 검증·남은 제한을 짧게 보고한다.
온실의 실제 구현·수정·검증 기록은 `node <skill>/scripts/references.mjs --id local-onsil`로 찾는다.
기록된 통과 결과를 새 실행처럼 말하지 않고, 한 샘플의 색상·글꼴·카드 수를 모든 결과의 기본값으로 삼지 않는다.
실제 실패 → 반례와 비교 → 좁은 재사용 규칙 → 독립 재평가로 스킬을 개선한다.
[learning-loop.md](references/learning-loop.md)에 갱신 방법이 있다. 수행하지 않은 지속 감시·자동 갱신을 약속하지 않는다.

| 자료 | 사용할 때 |
| --- | --- |
| [principles.md](references/principles.md) · [wireframe.md](references/wireframe.md) | 공통 우선순위, 확대 해독, 섹션 역할 |
| `library/reference-cases.json` · `scripts/references.mjs` | 관찰한 보드/GDWEB 사례와 기록된 로컬 구현 검색 |
| [copy.md](references/copy.md) · [type.md](references/type.md) | 주장·증거, 글줄·폰트·본문 |
| [layout.md](references/layout.md) · [colour.md](references/colour.md) | 그리드·모바일·색상 |
| [imagery.md](references/imagery.md) · [motion.md](references/motion.md) | 자산·크롭·출처·동작 |
| [implementation-review.md](references/implementation-review.md) | 이미지·타이포·상태 구현, 실제 브라우저 검증과 전달 |
| [critique.md](references/critique.md) · [tells.md](references/tells.md) | 렌더 관찰과 스타일 의도 검토 |
| [research.md](references/research.md) | 상속된 연구의 방법과 한계 |

기존 연구 247개와 번들 181개는 구분한다. 수치·기호를 이번에 다시 측정한 결과나 기능에 우선하는 법칙으로 인용하지 않는다.
