# 전역 스크롤바와 고정 헤더

> 2026-10-26 | v5 / UI 공통

## 증상과 원인

- 상단 내비게이션이 스크롤 시 윗부분이 잘리던 이유는 `styles/components.css`의 `.renewal-header { position: sticky; top: -30px; }` 때문입니다.
- `top: 0`으로 변경하여 헤더 상단을 뷰포트 시작 지점에 고정했습니다. 데스크톱·모바일 모두 같은 규칙을 적용합니다.
- 이 변경은 헤더의 높이·메뉴 링크·검색/전체메뉴 포커스 동작을 바꾸지 않습니다.

## GlobalScrollbar (등록 컴포넌트)

- 위치: `components/GlobalScrollbar.tsx`
- 적용: `app/layout.tsx`의 모든 경로에 `<GlobalScrollbar />`을 단 한 번 렌더링합니다.
- 등록: `src/data/component-registry.ts`의 `global-scrollbar`, 그리고 자동 생성 사용처 `src/data/component-usage.ts`.
- 종류: 비시각적 전역 네이티브 스타일 컴포넌트 (`<style data-component-id="global-scrollbar">`).
- 적용 대상: 페이지 최상위 스크롤, 내부 `overflow:auto` 영역, 팝업·모달, 디자인 가이드의 독립 스크롤 패널.

### 디자인 계약

| 항목 | 규격 |
| --- | --- |
| 기본 스크롤 | 브라우저 네이티브 유지; 가짜 스크롤 레이어·이벤트 가로채기 없음 |
| WebKit/Blink 너비·높이 | 7px |
| Firefox 등 표준 지원 엔진 | `scrollbar-width: thin` |
| 트랙/모서리 | `background: none`, 표준 API에서는 `transparent` |
| 스크롤 엄지 | `--color-gray-300` |
| 엄지 hover/active | `--color-gray-600` |
| 모양 | 양방향 모두 둥근 마감 |
| 고대비 강제 색상 | `scrollbar-color: auto`로 시스템 접근성 존중 |

CSS의 `:where(html, body, *)` 규칙은 모든 스크롤 가능한 요소를 대상으로 하지만, 오버플로 처리 자체는 수정하지 않습니다. macOS·모바일의 오버레이 스크롤바 표시 시점은 운영체제 설정에 따릅니다. 웹킷 의사요소 스타일과 표준 속성은 각각 지원하는 브라우저에서 적용됩니다.

## 확인 절차

```bash
cd v5
npm ci
npm run test:scroll
npm run build
cd ..
python3 -m http.server 4173
# 다른 터미널에서
cd v5
npx playwright install chromium
npm run test:scroll:browser
```

브라우저 검사는 390px(모바일)과 1440px(데스크톱)에서 스크롤 전후 헤더의 `getBoundingClientRect().top` 및 `position: sticky; top: 0`을 확인합니다. 최상위·내부 스크롤 영역의 스크롤바 폭과 전역 스타일 컴포넌트 1회 적용도 확인합니다.

## Git 작업 순서

1. `chatgpt-extrahigh/20261026-navigation-scrollbar-base` — `main`에서 분기하여 헤더 수정·회귀 검사 커밋.
2. `chatgpt-extrahigh/20261026-navigation-scrollbar-global` — 위 부모 브랜치에서 분기하여 스크롤바 공통 컴포넌트·등록·검사·문서와 정적 산출물 커밋.
3. 리뷰 시 자식 브랜치에서 `main`으로 PR을 열고, 기존 이력을 유지하는 merge commit으로 통합합니다. 기본 브랜치에서 직접 작업하거나 강제 푸시하지 않습니다.

> `v5/out/`과 `v5/_next/`, 미러링된 `v5/` 경로는 `npm run build`로 동기화해야 합니다. 소스 코드만 변경된 상태에서 과거의 정적 빌드 결과를 최신으로 간주하지 않습니다.
