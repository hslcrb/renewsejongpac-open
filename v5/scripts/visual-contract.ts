import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { DESIGN_TOKEN_VALUES } from "../src/data/design-tokens.ts";

export type ColorLiteral = { start: number; end: number; value: string };
export type VisualIssue = { code: string; source: string; line: number; message: string };
export type ColorValues = Record<`--${string}`, string>;

// [동결 산출물을 제외한 작성 소스 / Authored sources excluding frozen artifacts]
export function authoredFiles(root: string): string[] {
    const below = (directory: string): string[] => existsSync(directory)
        ? readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
            const target = resolve(directory, entry.name);
            return entry.isDirectory() ? below(target) : [target];
        }) : [];
    return ["app", "components", "styles"].flatMap((directory) => below(resolve(root, directory)))
        .filter((file) => /\.(?:tsx|css)$/.test(file)).sort();
}

// [괄호와 URL을 보존하는 색상 추출 / Extract color literals while preserving parentheses and URLs]
export function colorLiterals(value: string): ColorLiteral[] {
    const results: ColorLiteral[] = [];
    const pattern = /url\(|#[\da-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|(?<![\w-])(?:white|black|transparent)\b/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value))) {
        let end = pattern.lastIndex;
        if (match[0].endsWith("(")) {
            let depth = 1;
            while (end < value.length && depth) {
                if (value[end] === "(") depth++;
                if (value[end] === ")") depth--;
                end++;
            }
            pattern.lastIndex = end;
        }
        if (/^url\(/i.test(match[0])) continue;
        results.push({ start: match.index, end, value: value.slice(match.index, end) });
    }
    return results;
}

export function normalizedColor(value: string): string {
    value = value.trim();
    if (/^(?:black|#000(?:000)?)$/i.test(value)) return DESIGN_TOKEN_VALUES["--color-black"];
    if (/^(?:white|#fff(?:fff)?)$/i.test(value)) return DESIGN_TOKEN_VALUES["--color-white"];
    if (/^transparent$/i.test(value)) return DESIGN_TOKEN_VALUES["--color-transparent"];
    if (/^#[\da-f]{3,4}$/i.test(value)) value = "#" + [...value.slice(1)].map((digit) => digit + digit).join("");
    if (value.startsWith("#")) return value.toUpperCase();
    const channels = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*(.+))?\s*\)$/i.exec(value);
    if (channels) {
        let rgb = channels.slice(1, 4).map(Number);
        if (rgb.every((channel) => channel === 0)) rgb = [33, 31, 28];
        else if (rgb.every((channel) => channel === 255)) rgb = [255, 254, 250];
        let alpha = channels[4]?.trim();
        if (alpha && /^[\d.]+$/.test(alpha)) alpha = `${Number((Number(alpha) * 100).toFixed(4))}%`;
        if (!alpha && rgb.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
            return "#" + rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase();
        }
        return `rgb(${rgb.join(" ")}${alpha ? ` / ${alpha}` : ""})`;
    }
    return value.replace(/\s+/g, " ");
}

function hash(value: string): string {
    let result = 2166136261;
    for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
    return (result >>> 0).toString(36);
}

export function colorReference(value: string, additions: ColorValues): string {
    const normalized = normalizedColor(value);
    const localAlpha = /^rgb\((\d+ \d+ \d+) \/ (.+)\)$/.exec(normalized);
    if (localAlpha && localAlpha[2].includes("var(")) {
        const base = colorReference(`rgb(${localAlpha[1]})`, additions);
        return `color-mix(in srgb, ${base} calc(${localAlpha[2]} * 100%), var(--color-transparent))`;
    }
    const known = Object.entries({ ...DESIGN_TOKEN_VALUES, ...additions }).find(([token, color]) =>
        token.startsWith("--color-") && !color.includes("var(") && normalizedColor(color) === normalized);
    if (known) return `var(${known[0]})`;
    const name = /^#[\dA-F]{6,8}$/.test(normalized) ? normalized.slice(1).toLowerCase() : hash(normalized);
    const token = `--color-detail-${name}` as const;
    additions[token] = normalized;
    return `var(${token})`;
}

export function migrateColors(value: string, additions: ColorValues): string {
    for (const literal of colorLiterals(value).reverse()) {
        value = value.slice(0, literal.start) + colorReference(literal.value, additions) + value.slice(literal.end);
    }
    return value;
}

export function floorFontSize(value: string): string {
    if (/^(?:inherit|initial|unset|revert(?:-layer)?)$/i.test(value.trim()) || value.includes("var(--text-min)")) return value;
    return `max(var(--text-min), ${value.trim()})`;
}

export function floorFontShorthand(value: string): string {
    if (/^(?:inherit|initial|unset|revert(?:-layer)?)\s*$/.test(value)) return value;
    const match = /(?:\d*\.?\d+)(?:px|rem|em|%|vw|vh)\b|(?:clamp|min|max|calc)\(|var\(--text-/.exec(value);
    if (!match) return value;
    let end = match.index + match[0].length;
    if (match[0].includes("(")) {
        let depth = 1;
        while (end < value.length && depth) {
            if (value[end] === "(") depth++;
            if (value[end] === ")") depth--;
            end++;
        }
    }
    const size = value.slice(match.index, end);
    return value.slice(0, match.index) + floorFontSize(size) + value.slice(end);
}

// [기존 반응형 위계를 보존하는 이행 / Preserve existing responsive hierarchy during migration]
// 기존 계층은 그대로 두고 크기 하한과 색상 참조를 연결합니다. / Bind the size floor and color references.
export function migrateCss(source: string, additions: ColorValues): string {
    return source.replace(/([\w-]+)(\s*:\s*)([^;{}]+)(?=[;}])/g, (match, property: string, colon: string, rawValue: string) => {
        let value = migrateColors(rawValue, additions);
        if (property.toLowerCase() === "font-size") {
            const important = /\s*!important\s*$/.test(value);
            value = floorFontSize(value.replace(/\s*!important\s*$/, "")) + (important ? " !important" : "");
        }
        if (property.toLowerCase() === "font") value = floorFontShorthand(value);
        return `${property}${colon}${value}`;
    });
}

const colorProperties = /^(?:color|background(?:Color|Image)?|border(?:Color|Top|Right|Bottom|Left)?|border(?:Top|Right|Bottom|Left)Color|outline(?:Color)?|boxShadow|textShadow|fill|stroke|stopColor|floodColor|lightingColor|caretColor|accentColor|--[\w-]+)$/;

// [JSX 삽화와 인라인 스타일의 색상 연결 / Bind JSX illustration and inline style colors]
export function migrateTsx(source: string, fileName: string, additions: ColorValues): string {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const changes: { start: number; end: number; text: string }[] = [];
    const visit = (node: ts.Node) => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            const parent = node.parent;
            const property = ts.isJsxAttribute(parent) ? parent.name.getText(file)
                : ts.isPropertyAssignment(parent) && parent.initializer === node ? parent.name.getText(file).replace(/^["']|["']$/g, "") : "";
            if (colorProperties.test(property) && colorLiterals(node.text).length) {
                changes.push({ start: node.getStart(file), end: node.end, text: JSON.stringify(migrateColors(node.text, additions)) });
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(file);
    for (const change of changes.sort((first, second) => second.start - first.start)) {
        source = source.slice(0, change.start) + change.text + source.slice(change.end);
    }
    return source;
}
