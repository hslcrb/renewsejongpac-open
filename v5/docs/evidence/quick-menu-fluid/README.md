# 원형 퀵메뉴 재질 변경 / Radial menu material update

2026-10-23. 기존 털 렌더러를 제거하고 브랜드 노랑과 전용 초록·민트를 조합한 유동 재질로 교체했다. 컴포넌트 등록과 가이드가 같은 구현을 사용한다.

Removed the fur renderer and introduced an authored yellow and green fluid surface. The product and design guide use the same implementation and material tokens.

| 검증 / Verification | 결과 / Result |
| --- | --- |
| 등록·제품 연결 / Registered and connected | 50 / 50, 가이드 전용·미사용 0 / No guide-only or unused implementations |
| 전체 단위 검사 / Full unit suite | 149 통과, 선택 실행 1개 건너뜀 / 149 passed, 1 opt-in test skipped |
| 정적 빌드 브라우저 / Browser against static build | 메뉴 25, 가이드 11, 유동·스크롤·모션 감소 5개 통과 / 41 passed |
| 정적 참조 / Static references | HTML 160개, 참조 9,678개, 오류 0 / No failures |
| 타입·시각 계약 / Type and visual contracts | 통과 / Passed |

개발 서버의 CDP 회전 직후 첫 탭 검사에서는 반복 실패해 추가 수정을 중단했다. 기존 포커스 동작을 유지한 채 변경 전·후 정적 빌드를 비교했으며, 양쪽 모두 같은 시나리오를 통과했다. 개발 서버 현상의 원인은 확정하지 않았다.

A first-tap check after CDP rotation repeatedly failed on the development server. Further speculative fixes were stopped and the original focus behavior was retained. Both the previous and new static builds passed the same scenario; the development-only cause remains undetermined.

- [검사별 결과 / Check results](verification.json)
- [변경 전 / Before](before-open.png)
- [변경 후 / After](after-open.png)
- [390px 모바일 / Mobile at 390px](mobile390.png)

구현 원본과 사용법 / Implementation and usage: [컴포넌트 문서 / Component guide](../../components/violet-quick-menu.md).
