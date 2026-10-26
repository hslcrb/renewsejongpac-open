// [제품 UI 수에 포함하지 않는 가이드의 내부 도구 / Private guide tooling, excluded from product UI counts]
// 정확한 소스·export와 가이드 전용 도달 경로를 감사합니다. / Audit exact sources, exports and guide-only reachability.
export const DOCUMENTATION_TOOLS = [
    { id: "component-catalog", source: "app/design-rules/_documentation/ComponentCatalog.tsx", exportName: "default", purpose: "제품 등록부 조회와 실제 컴포넌트 예시 렌더링" },
    { id: "glass-demo", source: "app/design-rules/_documentation/LiquidGlassDemo.tsx", exportName: "default", purpose: "등록 유리 베리언트 비교와 문서용 재질 실험" },
] as const;
