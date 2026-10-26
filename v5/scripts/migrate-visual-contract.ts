import { readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EXTENDED_COLOR_VALUES, renderDesignTokensCss } from "../src/data/design-tokens.ts";
import { authoredFiles, migrateCss, migrateTsx } from "./visual-contract.ts";
import type { ColorValues } from "./visual-contract.ts";

// [가독성과 팔레트를 결정적으로 연결 / Deterministically bind readability and palette]
export function migrateVisualContract(root: string, write = false): string[] {
    const additions: ColorValues = { ...EXTENDED_COLOR_VALUES };
    const changed: string[] = [];
    for (const file of authoredFiles(root)) {
        if (file === resolve(root, "styles/tokens.css")) continue;
        const source = readFileSync(file, "utf8");
        const next = file.endsWith(".css") ? migrateCss(source, additions) : migrateTsx(source, file, additions);
        if (source === next) continue;
        changed.push(relative(root, file).replace(/\\/g, "/"));
        if (write) writeFileSync(file, next);
    }
    const tokenFile = resolve(root, "src/data/design-tokens.ts");
    const source = readFileSync(tokenFile, "utf8");
    const rows = Object.entries(additions).sort(([first], [second]) => first.localeCompare(second))
        .map(([token, value]) => `    ${JSON.stringify(token)}: ${JSON.stringify(value)},`).join("\n");
    const next = source.replace(/export const EXTENDED_COLOR_VALUES = \{[\s\S]*?\} satisfies TokenValues;/,
        `export const EXTENDED_COLOR_VALUES = {\n${rows}\n} satisfies TokenValues;`);
    if (source !== next) {
        changed.push("src/data/design-tokens.ts");
        if (write) writeFileSync(tokenFile, next);
    }
    if (write) writeFileSync(resolve(root, "styles/tokens.css"), renderDesignTokensCss(additions));
    return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const changed = migrateVisualContract(resolve(fileURLToPath(new URL("..", import.meta.url))), process.argv.includes("--write"));
    console.log(`Visual contract ${process.argv.includes("--write") ? "updated" : "would update"}: ${changed.length} authored files.`);
    if (!process.argv.includes("--write") && changed.length) process.exitCode = 1;
}
