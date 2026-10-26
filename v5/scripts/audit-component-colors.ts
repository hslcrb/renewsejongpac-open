import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DESIGN_TOKEN_VALUES } from "../src/data/design-tokens.ts";

type ReferenceKind = "active" | "illustration" | "legacy";
type ColorReference = { source: string; line: number; column: number; kind: ReferenceKind };
const root = fileURLToPath(new URL("..", import.meta.url));
const target = resolve(root, "docs/component-color-usage.json");
const slash = (value: string) => value.replace(/\\/g, "/");
const roots = ["app", "components", "styles", "src", "js", "v2"];
const preserved = new Set([
    "src/app.ts", "src/app-runner.ts", "src/lib/discovery.ts",
    ...["cards", "carousel", "motion", "ui"].map(name => `src/components/${name}.ts`),
    ...["design-rules", "flows", "goods", "home", "home-booking", "journeys", "pages", "programs", "search", "story", "utilities"].map(name => `src/features/${name}.ts`),
]);
const illustrationSources = new Set(["components/AccountMiniRoom.tsx"]);

// [실제 DOM 사용을 단정하지 않는 소스 참조 조사 / Source references without a claim of runtime DOM usage]
function files(directory: string): string[] {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? files(path) : /\.(?:tsx?|jsx?|css|svg|glsl)$/.test(entry.name) ? [path] : [];
    });
}

function classification(source: string): ReferenceKind {
    if (preserved.has(source) || source.startsWith("styles/compat/") || source.startsWith("js/") || source.startsWith("v2/") || source === "assets/entry.js") return "legacy";
    if (illustrationSources.has(source)) return "illustration";
    return "active";
}

const definitions = Object.entries(DESIGN_TOKEN_VALUES).filter(([token]) => token.startsWith("--color-detail-")).sort(([first], [second]) => first.localeCompare(second, "en"));
const references = new Map(definitions.map(([token]) => [token, [] as ColorReference[]]));
const unknownReferences: (ColorReference & { token: string })[] = [];
const sources = [...new Set([
    ...roots.flatMap(name => files(resolve(root, name))),
    ...(existsSync(resolve(root, "assets/entry.js")) ? [resolve(root, "assets/entry.js")] : []),
])].sort();
for (const file of sources) {
    const source = slash(relative(root, file));
    if (["src/data/design-tokens.ts", "styles/tokens.css"].includes(source)) continue;
    const text = readFileSync(file, "utf8");
    // CSS var()와 코드의 토큰 문자열을 기록합니다. / Record CSS var() and code token strings.
    for (const match of text.matchAll(/(?:var\(\s*|["'])(--color-detail-[\w-]+)(?=\s*[,)'"\s])/g)) {
        const token = match[1];
        const offset = match.index! + match[0].lastIndexOf(token);
        const prefix = text.slice(0, offset);
        const reference: ColorReference = { source, line: prefix.split("\n").length, column: offset - prefix.lastIndexOf("\n"), kind: classification(source) };
        const known = references.get(token);
        if (known) known.push(reference);
        else unknownReferences.push({ token, ...reference });
    }
}

// [여러 소스 범주에서 쓰는 토큰은 범주를 모두 보존 / Preserve every source category for a shared token]
const kinds: readonly ReferenceKind[] = ["active", "illustration", "legacy"];
const tokens = definitions.map(([token, value]) => {
    const refs = references.get(token)!;
    return { token, value, categories: kinds.filter(kind => refs.some(reference => reference.kind === kind)), sourceReferenceCount: refs.length, refs };
});
const inventory = {
    schemaVersion: 1,
    methodology: "Source-reference inventory only. CSS references, code token strings and preserved sources are scanned; comments and dormant selectors may be included. This is not evidence that a token is currently painted in the DOM, reachable, or safe to delete. Definitions in design-tokens.ts and generated tokens.css are excluded from reference counts.",
    scope: { root: "v5", folders: roots, frozenEntry: "assets/entry.js", preservedSources: [...preserved].sort(), illustrationSources: [...illustrationSources].sort() },
    classification: {
        active: "Current app, component and stylesheet source references outside the explicit illustration and legacy files; not a runtime reachability claim.",
        illustration: "References inside the authored AccountMiniRoom drawing implementation.",
        legacy: "The 18 preserved v4 TypeScript sources, styles/compat, js, v2, and the frozen assets/entry.js.",
    },
    summary: {
        detailTokens: tokens.length,
        sourceReferences: tokens.reduce((count, token) => count + token.sourceReferenceCount, 0),
        withoutSourceReferences: tokens.filter(token => !token.refs.length).length,
        tokensByCategory: Object.fromEntries(kinds.map(kind => [kind, tokens.filter(token => token.categories.includes(kind)).length])),
        referencesByCategory: Object.fromEntries(kinds.map(kind => [kind, tokens.reduce((count, token) => count + token.refs.filter(reference => reference.kind === kind).length, 0)])),
    },
    tokens,
    unknownReferences,
};
const expected = `${JSON.stringify(inventory, null, 4)}\n`;
if (process.argv.slice(2).some(argument => !["--check", "--write"].includes(argument))) throw new Error("Usage: node scripts/audit-component-colors.ts [--check | --write]");
if (process.argv.includes("--check")) {
    if (!existsSync(target) || readFileSync(target, "utf8").replace(/\r\n/g, "\n") !== expected) {
        console.error("Color source-reference inventory is stale. Run node scripts/audit-component-colors.ts --write.");
        process.exitCode = 1;
    }
} else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, expected, "utf8");
}
if (unknownReferences.length) process.exitCode = 1;
console.log(`Color source references: ${inventory.summary.detailTokens} detail tokens, ${inventory.summary.sourceReferences} references; ${inventory.summary.withoutSourceReferences} definitions without references in the scanned scope. ${unknownReferences.length} unknown tokens.`);
