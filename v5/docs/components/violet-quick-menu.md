# 원형 퀵메뉴 / Radial quick menu

노랑과 초록이 원 안에서 흐르는 메뉴다. 화면 하단의 작은 원을 열면 여섯 항목이 나타난다. 회전·터치·키보드로 선택하고, 링크를 눌러 이동한다. 2026-10-23에 털 렌더러와 외부 보라색 빛을 제거했다. `VioletQuickMenu`라는 공개 이름과 `data-violet-*` 조작 훅은 기존 호출부와 테스트의 호환을 위해 유지한다.

## 구현과 디자인 규격 / Implementation and design contract

| 역할 / Role | 원본 / Source |
| --- | --- |
| 공개 메뉴 / Public menu | [VioletQuickMenu.tsx](../../components/VioletQuickMenu.tsx) |
| 내부 재질 / Internal material | [QuickMenuFluid.tsx](../../components/QuickMenuFluid.tsx), 등록 ID `quick-menu-fluid`, 부모 `quick-menu` |
| 직접 구성한 곡면·입력 감쇠 / Authored contours and input damping | [quick-menu-fluid.ts](../../src/lib/quick-menu-fluid.ts) |
| 색상·모션 / Color and motion | [design-tokens.ts](../../src/data/design-tokens.ts)의 `QUICK_MENU_MATERIAL` |
| 배치·상태 / Layout and states | [VioletQuickMenu.module.css](../../components/VioletQuickMenu.module.css) |
| 실제 가이드 / Live guide | `/v5/design-rules/#motion/quick-menu` |

브랜드 노랑 `--color-yellow`에 전용 레몬·초록·민트 토큰을 조합한다. 이 색상들은 일반 컨트롤의 색상 역할을 바꾸지 않는다. 텍스트는 공통 `data-text` 위계와 최소 16px를 사용한다. 경계는 옅은 안쪽 스트로크다.

기본 흐름의 주기는 14초다. 서로 다른 위상의 넓은 곡면이 색 경계를 움직인다. 포인터를 따라 최대 원 너비의 16%까지 곡면이 변형되고, 입력이 끝나면 부드럽게 가라앉는다. 회전 방향은 유동의 속도에도 반영된다. 원의 외곽과 텍스트는 재질의 흐름 때문에 흔들리지 않는다.

## 사용 / Usage

```tsx
import VioletQuickMenu from "./VioletQuickMenu";

<VioletQuickMenu
    heroId="featured-season"
    onOpenChange={setQuickMenuOpen}
/>
```

| 속성 / Prop | 기본값 / Default | 동작 / Behavior |
| --- | --- | --- |
| `placement` | `"hero"` | 화면 아래 고정. `"inline"`은 문서 안의 같은 실물 예제. |
| `heroId` | `"featured-season"` | 고정 메뉴의 표시 범위를 결정한다. |
| `items` | `SEJONG_QUICK_MENU_ITEMS` | `id`, `label`, `href`, `icon`이 있는 여섯 항목의 readonly tuple. |
| `onOpenChange` | 없음 / None | 메뉴를 사용하는 동안 상위 히어로의 자동 재생 등을 멈춘다. |

`hero` 배치에는 대응하는 히어로 요소가 필요하다. `inline` 배치는 자신의 가시성을 관찰한다. 홈 외부의 가이드에서는 빠른 예매를 `/#quick-booking`으로 연결한다. Next 링크에는 `/v5`를 직접 붙이지 않는다.

| 항목 / Destination | 경로 / Route |
| --- | --- |
| 빠른 예매 / Booking | `#quick-booking` |
| 공연·전시 / Programs | `/programs` |
| 오시는 길 / Directions | `/visit/directions` |
| 단체 관람 / Group visits | `/visit/group` |
| 대관 안내 / Venue rental | `/rental` |
| 나의 예매 / My bookings | `/account` |

## 조작과 접근성 / Interaction and accessibility

- 클릭·터치·Enter로 열고, 정밀 포인터는 잠시 머물러도 열린다.
- 방향키·Home·End로 항목을 고른다. Escape는 닫고 열기 버튼으로 초점을 돌린다.
- 드래그한 원은 60도 간격으로 정렬된다. 드래그를 놓는 동작만으로 링크를 실행하지 않는다.
- 바깥 클릭, 히어로 이탈, 탭 비활성화 때 닫는다. 표시되지 않는 메뉴는 `inert`로 입력을 차단한다.
- `prefers-reduced-motion`에서는 흐름과 관성을 멈추며 탐색은 유지한다.
- Canvas는 장식이며 `aria-hidden`이다. Canvas를 쓸 수 없어도 CSS 재질과 네이티브 링크가 남는다. 강제 색상 모드에서는 시스템 색을 사용한다.

## 렌더링과 검증 / Rendering and verification

한 프레임에는 여섯 개의 베지어 곡선만 그린다. 색 그라데이션은 시작·크기 변경 때 만들고 반복 프레임에서 재사용한다. 최대 30fps, 터치에서는 24fps이며 DPR은 각각 2와 1.5로 제한한다. 닫힌 원과 펼친 원 가운데 보이는 재질만 실행하고, 화면 밖·비활성 탭·모션 감소 설정에서는 반복 그리기가 없다. 창 크기를 바꾸면 해상도를 다시 맞춘다.

```powershell
npm.cmd run test:orb:motion
$env:SEJONG_TEST_URL='http://127.0.0.1:4173/v5/'
npm.cmd run test:orb
npm.cmd run test:orb:gallery
npm.cmd run test:orb:smoke
```

현재 검사는 입력 감쇠·회전 방향·지연 프레임 제한·그리기 예산과 실제 메뉴의 탐색·모바일·스크롤·모션 감소 동작을 다룬다. 과거 털 구현의 캡처와 검사 기록은 `docs/evidence/violet-fur-fade/` 및 `docs/evidence/violet-motion-anchors/`에 이력으로 보존한다.
