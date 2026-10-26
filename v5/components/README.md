# v5 reusable components

## VioletQuickMenu

히어로를 보고 있는 동안 화면 아래에 노랑·초록이 흐르는 작은 원이 나타납니다. 원을 열면 여섯 개의 바로가기를 돌려 고를 수 있습니다. 메인 페이지는 이 컴포넌트를 사용하며, 열려 있는 동안 히어로의 자동 재생을 일시 정지합니다. 기존 `VioletQuickMenu` 이름은 호출부 호환을 위해 유지하며 보라색·털 렌더러는 사용하지 않습니다.

- Public export: `VioletQuickMenu` from `v5/components/index.ts`
- Implementation: `VioletQuickMenu.tsx`
- Scoped presentation: `VioletQuickMenu.module.css`
- Decorative canvas: `QuickMenuFluid.tsx`
- Authored wave contours and damped input: `../src/lib/quick-menu-fluid.ts`
- Material tokens: `QUICK_MENU_MATERIAL` in `../src/data/design-tokens.ts`
- Reference: [사용자의 Figma 시안](https://www.figma.com/design/EufUvqqxgphtoLRX6bcdV6/Untitled?node-id=1-6)
- Full guide: [디자인 근거, 재사용 API, 접근성 및 검증 절차](../docs/components/violet-quick-menu.md)
- Live example: [디자인 가이드의 컴포넌트 갤러리](../app/design-rules/page.tsx) — `/v5/design-rules/#motion/quick-menu`
- Verification: [기존 여섯 항목 구현의 25개 동작 검증 기록 및 PC·모바일 화면](../../docs/v5-violet-quick-menu/README.md)
- Execution and verification: [날짜별 검사 결과, 최종 커밋·병합 이력과 배포 확인](../docs/violet-quick-menu-verification.md)
- Current motion/anchors verification (2026-10-20): [통합 52개 검사와 화면·동영상](../docs/evidence/violet-motion-anchors/README.md), [메인 앵커 목록](../docs/home-anchors.md).
- Initial fur/fade verification (2026-10-20): [이전 필수 5개 검사 결과](../docs/evidence/violet-fur-fade/smoke-results.json), [이전 PC](../docs/evidence/violet-fur-fade/desktop.webp), [이전 모바일](../docs/evidence/violet-fur-fade/mobile390.webp).

```tsx
"use client";

import { useState } from "react";
import { VioletQuickMenu } from "../components";

export default function Hero() {
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    // Pause this host's carousel timer while quickMenuOpen is true.
    return <>
        <section id="featured-season" aria-label="주요 프로그램">
            {/* Existing hero content */}
        </section>
        <VioletQuickMenu
            heroId="featured-season"
            onOpenChange={setQuickMenuOpen}
        />
    </>;
}
```

### Props

| Prop | Default | Purpose |
| --- | --- | --- |
| `placement` | `"hero"` | `"hero"`는 히어로와 연결한 화면 하단 배치, `"inline"`은 문서 흐름 안의 독립 예시 배치입니다. |
| `heroId` | `"featured-season"` | `placement="hero"`에서 표시 범위를 결정할 기존 히어로 요소의 ID. 히어로 상단을 지나 스크롤하면 메뉴와 장식이 함께 흐려지고, 돌아오면 다시 나타납니다. |
| `items` | `SEJONG_QUICK_MENU_ITEMS` | `id`, `label`, `href`, `icon`을 가진 여섯 항목의 readonly tuple. Next.js 경로에는 `/v5`를 직접 붙이지 않습니다. |
| `onOpenChange` | 없음 | 메뉴가 열리거나 닫힐 때 호출합니다. 부모의 자동 재생 등을 제어할 때 사용합니다. |

기본 `hero` 배치에서는 `heroId`에 대응하는 요소가 있어야 합니다. `inline` 배치는 히어로 없이 자신의 화면 표시 여부를 관찰하며, 화면 밖에서도 문서상의 공간을 유지하고 반복 장식을 멈춥니다. 같은 페이지의 `#anchor` 항목은 실제 섹션 ID를 가리켜야 합니다. 홈의 기본 빠른 예매 항목은 `#quick-booking` 섹션으로 이동하고 그 제목으로 키보드 포커스를 옮깁니다.

홈 이외의 갤러리에서는 빠른 예매를 `/#quick-booking`으로 바꿔 홈 예매 영역에 연결합니다. 나머지 다섯 항목과 메뉴 조작은 그대로 재사용합니다.

```tsx
import {
    VioletQuickMenu,
    SEJONG_QUICK_MENU_ITEMS,
    type VioletQuickMenuItems,
} from "../components";

const [quickBooking, ...otherItems] = SEJONG_QUICK_MENU_ITEMS;
const galleryItems: VioletQuickMenuItems = [
    { ...quickBooking, href: "/#quick-booking" },
    ...otherItems,
];

<VioletQuickMenu placement="inline" items={galleryItems} />
```

### Registered destinations

| Menu | `href` |
| --- | --- |
| 빠른 예매 | `#quick-booking` |
| 공연·전시 | `/programs` |
| 오시는 길 | `/visit/directions` |
| 단체 관람 | `/visit/group` |
| 대관 안내 | `/rental` |
| 나의 예매 | `/account` |

### Interaction contract

- **Mouse:** 원 위에 잠깐 머물면 펼쳐집니다. 원판이나 메뉴 글자를 잡아 양방향으로 돌릴 수 있습니다. 손을 놓으면 관성을 짧게 반영해 60도 간격으로 정렬합니다. 드래그 직후 발생하는 클릭은 이동으로 처리하지 않습니다.
- **Touch:** 원을 탭해서 열고, 원판 안에서 회전합니다. 원 밖에서는 일반 페이지 스크롤을 유지합니다. 각 메뉴 또는 중앙의 선택 항목을 탭하면 이동합니다.
- **Keyboard:** 버튼에서 Enter/Space로 열 수 있습니다. Tab으로 실제 링크를 이동하고, 방향키·Home·End로 메뉴를 고를 수 있습니다. Escape로 닫으면 버튼으로 포커스가 돌아옵니다. 비모달 탐색이므로 포커스를 가두지 않습니다.
- **Scroll:** 히어로가 헤더 뒤로 올라가기 시작하면 120–180px 구간에서 장식과 메뉴가 함께 페이드아웃하고, 역방향에서 페이드인합니다. 180ms 전환으로 입력을 부드럽게 연결하며 완전히 숨겨지면 `inert`로 포커스와 포인터 입력을 차단합니다. `inline` 갤러리에는 스크롤 페이드를 적용하지 않습니다.
- **Motion:** 촘촘한 속털과 명암을 두 개의 고정된 캐시 비트맵으로 보존하고, 그 위의 짧은 털 뭉치만 뿌리를 고정한 채 천천히 움직입니다. 포인터와 터치 회전은 가까운 털 끝에 작은 힘을 전달하고, 감쇠하는 스프링이 서서히 원래 흐름으로 돌아옵니다. 펼친 원은 최대 504개, 터치·저사양 기기는 336개, 닫힌 원은 112개의 움직이는 섬유를 사용합니다. 프레임마다 이미지 두 장과 색별로 묶은 10회의 채우기로 그리며 최대 24fps, 터치·저사양 기기는 최대 20fps와 낮은 DPR을 적용합니다. 화면 밖·숨겨진 탭에서는 반복 그리기를 중단합니다. `prefers-reduced-motion: reduce`일 때 자동 모션·관성·페이드 시간 지연을 끕니다. 사용자가 직접 원을 돌리거나 메뉴를 누르는 기능은 유지합니다.
- **Responsive:** 펼친 원의 크기는 PC에서 최대 370px, 모바일에서 최대 332px이며, 작은 화면의 너비·높이와 safe area에 맞춰 줄어듭니다. 320px 너비 및 모바일 가로 화면도 검증 대상입니다.
- **Appearance:** `--violet-*` 값은 CSS 모듈의 컴포넌트 범위에서만 사용합니다. 기존 전역 브랜드 색상과 서체를 변경하지 않습니다. 외부 애니메이션 라이브러리, WebGL, 원격 이미지 요청이 필요하지 않습니다.

### Development and verification

Repository root:

```bash
npm --prefix v5 ci
npm --prefix v5 run dev -- --hostname 127.0.0.1 --port 3000
```

The home page is `http://127.0.0.1:3000/v5/`; the [live component gallery](http://127.0.0.1:3000/v5/design-rules/#violet-quick-menu) demonstrates the inline placement. Install the browser once, then run the home and gallery checks while the dev server is running:

```bash
npm --prefix v5 exec -- playwright install chromium
SEJONG_TEST_URL=http://127.0.0.1:3000/v5/ npm --prefix v5 run test:orb
SEJONG_TEST_URL=http://127.0.0.1:3000/v5/ npm --prefix v5 run test:orb:gallery
npm --prefix v5 run test:orb:motion
```

To use an existing Chromium executable, set `CHROMIUM_PATH` to its absolute path. If Playwright is installed in a separate tooling directory, point `NODE_PATH` to its `node_modules`. `SEJONG_VIOLET_REPORT_DIR` can place the JSON report and screenshots outside the repository; the default is the ignored `v5/.lemonade/violet-quick-menu/` directory. The home script checks actual mouse/touch navigation, drag wraparound, no accidental navigation, keyboard focus, viewport bounds, reduced motion and browser errors. The gallery script checks the inline integration and writes `gallery-results.json` with `gallery-*.png` captures. These commands are reproduction steps; consult the results from the corresponding run for verification status.

```bash
cd v5
node node_modules/typescript/bin/tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Stop the dev server before building, because both commands write to `.next`. The existing `postbuild` copies the static export into the tracked `v5/` hosting directory. Commit that generated output together with the source after reviewing the diff. Test legacy versions separately; their copied `home-v4.cjs` script targets the older app and is not this component's test.

## HomeAnchorNavigation

메인에서 사용하는 내부 탐색 컴포넌트입니다. `resolveAnchor(id)` 콜백으로 슬라이드·공연·공지·일정을 먼저 펼친 뒤 해당 ID의 제목이나 조작에 포커스를 두고, 실제 sticky 헤더 높이와 16px 여백을 적용합니다. 초기 `#URL`, `hashchange`, 뒤로/앞으로 가기와 복원된 페이지를 처리하며 일반 캐러셀 렌더링에서는 다시 실행하지 않습니다.

- Implementation: `HomeAnchorNavigation.tsx`, integrated by `v5/app/page.tsx`.
- Stable fragments and footer logo: [전체 목록과 접근성 동작](../docs/home-anchors.md).
- Verification: `SEJONG_TEST_URL=http://127.0.0.1:8765/v5/ npm --prefix v5 run test:home:anchors`.
