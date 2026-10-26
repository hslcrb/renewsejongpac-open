---
name: noslopui-one
description: >-
  Enforces clean, slop-free UI standards: mandates bilingual (Korean/English) section comments
  for functional code groups, strictly eradicates cheap hover-lift/floating effects (such as translateY buttons,
  jumping hover text, and animated sliding underlines), while deliberately preserving and fostering
  refined, aesthetically meaningful elevations and motions.
---

# noslopui-one

조잡하고 불필요한 장식성 인터랙션(UI Slop)을 배제하고, 절제되고 신뢰도 높은 사용자 인터페이스와 유지보수성 높은 코드 구조를 확립하기 위한 스킬 가이드입니다.

---

## 1. 핵심 목표 (Core Objectives)

1. **기능 군(Group) 코드 상단 한·영 병기 주석 의무화 (Bilingual Functional Comments)**
2. **호버 시 불쑥 올라오는 모든 조잡한 모션 전면 척결 (Zero Hover-Lift Slop)**
3. **심미적·기능적 완성도를 갖춘 품격 있는 인터랙션 보존 및 권장 (Preserve & Enhance Aesthetic Motion)**

---

## 2. 규칙 1: 기능 군(Group) 단위 한·영 병기 주석

동일한 기능 군(Functional Group / Logic Block / Component / Section)에 속하는 코드 상단에는 반드시 **한국어와 영어(한·영 병기)**로 명확한 설명 주석을 작성합니다.

### 작성 표준

- **CSS / 스타일시트:**
  ```css
  /* ==========================================================================
     [프로그램 일정 캘린더 그리드 / Program Schedule Calendar Grid]
     월간 일정 탐색과 날짜별 이벤트 인디케이터 상태 관리
     Monthly schedule navigation and date event indicator state management
     ========================================================================== */
  ```
- **JavaScript / 프론트엔드 로직:**
  ```javascript
  // ==========================================================================
  // [예매 좌석 배치 및 할인율 계산기 / Booking Seat Layout & Discount Calculator]
  // 선택한 좌석 번호 유효성 검증 및 관람료 합산 처리
  // Validates selected seat numbers and computes aggregate ticket pricing
  // ==========================================================================
  ```
- **HTML / 템플릿 마크업:**
  ```html
  <!-- ==========================================================================
       [주요 기획 공연 히어로 배너 / Main Curated Performance Hero Banner]
       현재 시즌 대표작 롤링 및 상세 예매 바로가기 링크
       Rotating featured seasonal performances with direct booking action links
       ========================================================================== -->
  ```

---

## 3. 규칙 2: 조잡한 호버 상승 및 튀는 효과 전면 척결 (Anti-Slop)

마우스 호버 시 요소가 물리적으로 덜컹거리거나 붕 뜨는(lift-up / floating) 산만한 효과는 UI의 전문성을 해치는 전형적인 '슬롭(Slop)'입니다. 발견 즉시 척결합니다.

### 척결 대상 (Strictly Prohibited & Eradicated)

1. **버튼 호버 시 위로 불쑥 떠오르는 효과 (Button Lift Slop)**
   - ❌ 금지: `.button:hover { transform: translateY(-2px); }`, `top: -3px;`, `margin-top: -2px;`
   - ❌ 금지: 호버 시 버튼 아래에 두꺼운 그림자가 생기며 위로 붕 뜨는 가짜 3D 부유 효과
   - ✅ 올바른 대안: 단정한 배경색/테두리 톤 시프트, 은은한 명도 대비 변화, 정적(static) 스타일 유지
2. **텍스트 호버 시 불쑥 위로 솟아오르는 효과 (Jumping Text Slop)**
   - ❌ 금지: `a:hover { transform: translateY(-1px); }`, `span:hover { display: inline-block; transform: translateY(-2px); }`
   - ✅ 올바른 대안: `text-decoration: underline;`, `text-underline-offset: 4px;`, 글자색의 선명한 대비
3. **호버 시 밑줄이 쭈욱 가로로 늘어나거나 아래에서 위로 솟구치는 효과 (Sliding Underline Slop)**
   - ❌ 금지: `a:after { width: 0; transition: width 0.3s; } a:hover:after { width: 100%; }` 같은 산만하게 뻗어 나가는 밑줄 장식
   - ❌ 금지: 밑줄이 아래에서 위로 스르륵 밀려 올라오는 애니메이션 트랜지션
   - ✅ 올바른 대안: 깔끔하고 즉각적인 표준 `text-decoration` 밑줄 또는 정적인 보더 라인

---

## 4. 규칙 3: 미적·기능적 정당성이 있는 유의미한 올라옴 보존 및 권장

모든 상승 모션을 금지하는 것이 아닙니다. **맥락이 있고 완성도 높은 '미적인 올라옴(Aesthetic Elevation & Entrance)'은 적극 보존하고 오히려 장려**합니다.

### 보존 및 권장 대상 (Encouraged & Maintained)

- **오버레이·모달·바텀시트의 부드러운 뷰포트 진입:**
  - 화면 아래에서 자연스럽게 밀려 올라오며 안착하는 시트 및 알림 모달 (`translateY(24px) → translateY(0)`의 부드러운 이징).
- **스크롤 리빌 및 섹션 등장 애니메이션:**
  - 사용자가 스크롤하여 뷰포트에 도달했을 때 콘텐츠가 우아하게 안착하는 엔트런스 모션.
- **상태 변화를 명확히 안내하는 피드백:**
  - 토스트 메시지가 하단에서 자연스럽게 나타나 머무른 후 퇴장하는 인터랙션.
  - 선택/활성화된 탭이 위계상 명확하게 구분되는 정제된 표기.

---

## 5. 점검 체크리스트 (Audit Checklist)

코드 리뷰 또는 구현 완료 시 다음 항목을 반드시 검증합니다:

- [ ] **기능 군 주석:** 상위 모듈/그룹마다 한·영 병기 설명이 존재하는가?
- [ ] **호버 들뜸 제거:** 버튼, 카드, 텍스트 링크에 `translateY(-`, `top: -`, `margin-top: -`가 없는가?
- [ ] **밑줄 장식 제거:** 가로로 쭈욱 늘어나거나 솟구치는 슬라이딩 밑줄 애니메이션이 없는가?
- [ ] **미적 모션 보존:** 토스트, 모달, 엔트런스 등 본래 필요한 우아한 등장 모션은 온전히 보존되었는가?
