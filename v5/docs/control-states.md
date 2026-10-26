# 공통 버튼 상태와 제품 연결 정비

2026-10-23. 기준 커밋 `6faa347b`에서 선택된 필터에 마우스를 올리면 대비가 1.06:1로 떨어지는 현상을 재현했다. 선택 상태의 흰 전경 위에, 더 높은 우선순위의 기본 hover 배경만 적용되는 것이 원인이었다.

[SystemPrimitives](../components/SystemPrimitives.tsx)와 [공통 스타일](../styles/system-primitives.css)에서 상태를 함께 처리한다. 페이지마다 mouseenter·mouseleave 상태를 따로 만들지 않고 네이티브 hover·active·focus와 실제 `aria-pressed`를 사용한다.

| 상태 | 규칙 |
| --- | --- |
| 기본 | 등록된 색상 베리언트의 배경·전경 |
| hover | 현재 선택 상태에 속하는 배경·전경 조합 |
| 선택 | 중립색은 밝고 어두운 면을 반전하고, 브랜드색은 채움·선택 아이콘을 보존 |
| 누름 | 현재 조합을 유지한 누름 피드백 |
| 초점 | 현재 표면에 맞는 토큰과 안쪽 초점선 |
| 비활성 | 선택·hover와 무관하게 비활성 토큰이 우선 |

토글의 배경과 글자색은 함께 바뀐다. 서로 반대 방향으로 보간돼 중간 회색끼리 겹치는 프레임을 만들지 않는다. stroke는 기존의 옅은 inset 규격을 유지한다.

circle은 접근 가능한 이름을 가진 아이콘 조작에 사용한다. 기본 48×48px, flow 50×50px이며, 가이드의 긴 문구를 원 안에 억지로 넣던 예제를 고쳤다. `SystemIconButtonProps`는 이름 속성을 필수로 요구한다. 아이콘 버튼의 pressed 예제도 등록해 현재 실물 예제는 154개다.

실제 제품에서는 다음 연결을 정비했다.

- 헤더·검색·맨 위로 이동·회원 이메일 버튼의 개별 SVG를 등록된 `Icon`으로 교체했다. 회원 버튼의 열린 SVG 경로에는 stroke 없이 fill만 있어 화살표가 보이지 않았었다.
- 미니룸 조명과 플로팅 메뉴 이동 아이콘을 `currentColor`를 따르는 동일한 `Icon`으로 교체했다. 밝은 면·어두운 면 모두 아이콘과 레이블이 같은 전경을 사용한다.
- 어두운 헤더는 `inverse-quiet` 베리언트를 선택한다. 헤더와 메뉴가 버튼 팔레트를 별도로 덮어쓰는 CSS를 제거했다.
- 제품의 Material 아이콘 SVG 또는 rounded 아이콘 이미지를 직접 사용하는 우회를 감사 검사에 추가했다. 미니룸 등 직접 그린 SVG 삽화는 허용하며, 회귀 fixture로 둘을 구분한다.

등록된 구현 50개 중 제품 연결은 47개, 가이드 전용은 3개, 미사용은 0개다. 이 수에는 내부·구조 구현도 포함된다. 가이드 전용은 `ComponentCatalog`·`LiquidGlassDemo`라는 문서 도구와 사용자가 제품 연결을 해제한 Deprecated `BookingInvitation`이다. 제품 UI를 가이드에만 두고 별도로 복제한 것으로 집계하지 않는다. [전체 소스 연결표](component-connections.md)를 함께 확인할 수 있다.

검증 결과:

- 전체 단위 검사 135개 중 134개 통과, 선택적 검사 1개 생략, 실패 0개. 아이콘 우회 검사는 수정 전 실패와 수정 후 통과를 확인했다.
- 실제 정적 파일의 버튼 상태 검사 8개 통과. 8개 색상 베리언트, 링크·버튼·아이콘·필터, 선택+hover, 선택+비활성, 마우스 누름·해제, 키보드, 390px 터치를 검사했다. 활성 대상의 글자 대비는 4.5:1 이상이다.
- 디자인 시스템의 실물 예제 154개와 320·390·768·1024·1440px의 제품/가이드 규격 비교 통과. 가입·복구·검색 모달·초점 복귀·예매 미검증 상태도 통과했다.
- 기존 날짜 미리보기 회귀 13개 통과. TypeScript·컬러·컴포넌트·시각 계약 검사 통과.
- 정적 빌드 완료. HTML 160개에서 로컬 참조 9,293개 누락 0개. out과 루트 미러 8,362개 파일의 바이트 일치.

[수정 전](control-states/before.png) · [선택+hover 수정 후](control-states/after.png) · [원형 예제](control-states/circle.png) · [미니룸](control-states/mini-room.png) · [어두운 헤더](control-states/header.png)

[버튼 상태 검사](control-states/browser-results.json) · [제품/가이드 검사](control-states/component-system.json) · [산출물 검사](control-states/artifacts.json) · [단위 검사 로그](control-states/unit-tests.log)

```powershell
node tests/control-states-browser.ts http://127.0.0.1:4173/v5/
node tests/component-contract-browser.ts http://127.0.0.1:4173/v5/
node tests/component-system-browser.ts http://127.0.0.1:4173/v5/
npm.cmd run check:system
```
