import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPONENT_REGISTRY } from "../src/data/component-registry.ts";
import { COMPONENT_COUNTS, COMPONENT_USAGE } from "../src/data/component-usage.ts";
import { DOCUMENTATION_TOOLS } from "../app/design-rules/_documentation/tools.ts";

// [등록부와 생성된 실제 사용처를 연결하는 감사 보고서 / Audit report connecting the registry and generated usage]
const root = fileURLToPath(new URL("..", import.meta.url));
const target = resolve(root, "docs/component-connections.md");
const kinds = { ui: "재사용 UI", structure: "구조·페이지 연결", internal: "내부 지원", demo: "문서 도구" };
const cell = (value: string) => value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const code = (value: string) => `\`${cell(value)}\``;
const usageFor = (id: string) => COMPONENT_USAGE[id as keyof typeof COMPONENT_USAGE];

if (COMPONENT_COUNTS.total !== COMPONENT_REGISTRY.length || COMPONENT_REGISTRY.some(record => !usageFor(record.id))) {
    throw new Error("Component usage is stale. Run node scripts/audit-component-system.ts --write first.");
}
if (COMPONENT_COUNTS.product !== COMPONENT_COUNTS.total || COMPONENT_COUNTS.documentationOnly || COMPONENT_COUNTS.unused)
    throw new Error("Every registered product implementation must have a real product use.");
const totalExamples = COMPONENT_REGISTRY.reduce((count, record) => count + (record.examples?.length || 0), 0);

const rows = COMPONENT_REGISTRY.map(record => {
    const usage = usageFor(record.id);
    const product = usage.productUses.length
        ? [...usage.productUses.slice(0, 3).map(code), ...(usage.productUses.length > 3 ? [`외 ${usage.productUses.length - 3}곳`] : [])].join("<br>")
        : usage.status === "guide-only" ? "제품 연결 없음 · 가이드 전용" : "도달 사용처 없음";
    const parent = record.parent ? COMPONENT_REGISTRY.find(parent => parent.id === record.parent) : undefined;
    const relationship = [
        ...(parent ? [`${record.kind === "internal" ? "소유 구현" : "상위"}: ${parent.name} (${code(parent.id)})`] : []),
        ...(record.layoutOwner ? [`레이아웃: ${code(record.layoutOwner)}`] : []),
    ].join("<br>") || "—";
    const contract = [
        ...Object.entries(record.axes || {}).map(([axis, values]) => `${code(axis)}: ${values.map(code).join(", ")}`),
        ...(record.states?.length ? [`상태: ${record.states.map(code).join(", ")}`] : []),
        ...(record.lifecycle === "deprecated" ? ["Deprecated · 제품 연결 금지"] : []),
    ].join("<br>") || "공개 열거 축·상태 없음";
    const guide = [
        code(`/v5/design-rules/#${record.guide}`),
        `가이드 그래프의 호출자 ${usage.guideUses.length}곳`,
        ...(record.examples?.length ? [`실물 예시 ${record.examples.length}개`, code(`/v5/design-rules/#components/registry/${record.examples[0].id}`)] : []),
        ...(record.previewRoute ? [`전체 화면: ${code(record.previewRoute)}`] : []),
    ].join("<br>");
    return `| ${record.name}<br>${code(record.id)} | ${code(record.source)}<br>export ${code(record.exportName)} | ${kinds[record.kind]}<br>${code(record.kind)} | ${product} | ${guide} | ${relationship} | ${contract} |`;
});

// [숫자와 연결을 수동 복제하지 않는 결정적 문서 / Deterministic documentation without manually copied counts]
const report = `# 컴포넌트 연결 감사

이 문서는 \`scripts/report-component-connections.ts\`가 실제 \`COMPONENT_REGISTRY\`와 생성된 \`COMPONENT_USAGE\`를 import해 만듭니다. UI·토큰·등록부를 수정하지 않습니다.

활성 제품 등록 구현 **${COMPONENT_COUNTS.total}개**와 실제 제품 연결 **${COMPONENT_COUNTS.product}개**가 일치합니다. 가이드 전용 ${COMPONENT_COUNTS.documentationOnly}개, 미사용 ${COMPONENT_COUNTS.unused}개입니다. 공식 축·상태의 실물 예시는 ${totalExamples}개입니다. 제품 등록부에 연결이 없는 항목이 추가되면 빌드 전 감사가 실패합니다.

제품 사용처는 페이지와 상속 레이아웃에서 도달 가능한 import·렌더 그래프의 즉시 호출자를 최대 3곳 요약합니다. 조건부 분기까지 포함하는 소스 연결 자료이며 모든 경로에서 항상 DOM에 그려진다는 뜻이 아닙니다. 전체 호출자 목록은 \`src/data/component-usage.ts\`에 있습니다.

가이드 위치는 등록된 섹션과 실물 예시 앵커입니다. 구조 컴포넌트는 실제 전체 화면의 미리보기를 사용할 수 있습니다. 내부 지원은 부모 관계와 기존 DOM의 part/owner 표식을 사용하며 등록 수를 맞추기 위한 래퍼를 추가하지 않습니다. 관계의 ‘—’는 등록부에 명시된 부모 관계가 없다는 뜻입니다. 축·상태가 없는 구현에 임의의 베리언트를 만들어 넣지 않습니다.

| 이름·ID | 소스·내보내기 | 종류 | 제품 사용처 요약 | 가이드 위치·예시 | 부모·레이아웃 관계 | 공식 축·상태 |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## 가이드 내부 도구와 퇴역 이력

아래 도구는 제품 컴포넌트가 아니라 이 문서를 작성·조회하는 가이드 내부 구현입니다. 제품 수에서 제외하지만 정확한 소스·export, 가이드 도달 여부, 미등록 도구, 제품으로의 유출을 검사합니다. 새 제품 컴포넌트를 이 목록에 넣어 누락을 숨길 수 없도록 경로를 가이드 내부 디렉터리로 제한합니다.

| 도구 | 소스·내보내기 | 용도 |
| --- | --- | --- |
${DOCUMENTATION_TOOLS.map(tool => `| ${code(tool.id)} | ${code(tool.source)}<br>${code(tool.exportName)} | ${tool.purpose} |`).join("\n")}

BookingInvitation은 Deprecated 이력만 남기고 구현·실행 예제·전용 CSS를 제거했습니다. 이전 소스는 Git 이력으로 보존됩니다. 홈의 ‘관람 예약’은 기존 정적 제목을 유지합니다.

## 재생성 및 검증

\`\`\`powershell
node scripts/audit-component-system.ts --write
node scripts/report-component-connections.ts --write
node scripts/report-component-connections.ts --check
\`\`\`

등록부의 canonical ID와 UI 루트의 \`data-component-id\`를 함께 검사합니다. 내부 지원의 \`data-component-part\`와 \`data-component-owner\`는 별개로 검사합니다. Deprecated 구현과 문서 전용 도구의 제품 그래프 연결, 잘못된 열거값·상태·예시 앵커 및 제품 복사 코드의 임의 유리 재질 조정은 감사 대상입니다. 실물 DOM·조작 검증은 별도의 \`tests/component-contract-browser.ts\`와 \`tests/component-system-browser.ts\`가 담당합니다.
`;

const args = process.argv.slice(2);
if (args.some(argument => !["--check", "--write"].includes(argument)) || args.includes("--check") && args.includes("--write")) throw new Error("Usage: node scripts/report-component-connections.ts [--check | --write]");
if (args.includes("--check")) {
    if (!existsSync(target) || readFileSync(target, "utf8").replace(/\r\n/g, "\n") !== report) {
        console.error("Component connection report is stale. Run node scripts/report-component-connections.ts --write.");
        process.exitCode = 1;
    }
} else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, report, "utf8");
}
console.log(`Component connections: ${COMPONENT_REGISTRY.length} registered implementations; ${totalExamples} live contract examples.`);
