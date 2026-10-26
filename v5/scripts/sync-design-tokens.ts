import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignTokensCss, renderTypographyCss } from "../src/data/design-tokens.ts";

// [문서와 실제 CSS 사이의 드리프트 검사 / Check for drift between documentation and production CSS]
export function syncDesignTokens({
    check = false,
    target = new URL("../styles/tokens.css", import.meta.url),
}: { check?: boolean; target?: URL | string } = {}): boolean {
    const expected = renderDesignTokensCss();
    // Windows의 Git 체크아웃 개행을 허용합니다. / Allow Git checkout line endings on Windows.
    const current = existsSync(target) ? readFileSync(target, "utf8").replace(/\r\n/g, "\n") : undefined;
    if (current === expected) return true;
    if (check) return false;
    writeFileSync(target, expected, "utf8");
    return true;
}

// [텍스트 메타데이터와 역할 CSS 동기화 / Synchronize text metadata and role CSS]
export function syncTypography({
    check = false,
    target = new URL("../styles/typography.css", import.meta.url),
}: { check?: boolean; target?: URL | string } = {}): boolean {
    const expected = renderTypographyCss();
    const current = existsSync(target) ? readFileSync(target, "utf8").replace(/\r\n/g, "\n") : undefined;
    if (current === expected) return true;
    if (check) return false;
    writeFileSync(target, expected, "utf8");
    return true;
}

// [직접 실행 시에만 생성하거나 검사 / Generate or check only when executed directly]
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const check = process.argv.includes("--check");
    if (!syncDesignTokens({ check }) || !syncTypography({ check })) {
        console.error("Design tokens or typography are stale. Run node scripts/sync-design-tokens.ts.");
        process.exitCode = 1;
    }
}
