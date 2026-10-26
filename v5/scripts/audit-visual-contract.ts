import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { DESIGN_TOKEN_VALUES, TEXT_VARIANTS, TEXT_SIZES } from "../src/data/design-tokens.ts";
import { authoredFiles, colorLiterals, floorFontShorthand, migrateTsx } from "./visual-contract.ts";
import type { VisualIssue } from "./visual-contract.ts";

// [텍스트가 있는 네이티브 렌더러의 명시적 연결 검사 / Verify explicit text bindings on native renderers]
export function auditTextBindings(source: string, fileName: string): VisualIssue[] {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const issues: VisualIssue[] = [];
    const add = (node: ts.Node, code: string, message: string) => issues.push({
        code, source: fileName, line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, message,
    });
    const hasAttribute = (attributes: ts.JsxAttributes, name: string) => attributes.properties.some((property) =>
        ts.isJsxAttribute(property) && property.name.getText(file) === name);
    const literalText = (expression: ts.Expression): boolean => {
        if (ts.isJsxElement(expression) || ts.isJsxSelfClosingElement(expression) || ts.isJsxFragment(expression)) return false;
        if (expression.kind === ts.SyntaxKind.NullKeyword || expression.kind === ts.SyntaxKind.FalseKeyword || expression.kind === ts.SyntaxKind.TrueKeyword) return false;
        if (ts.isConditionalExpression(expression)) return literalText(expression.whenTrue) || literalText(expression.whenFalse);
        if (ts.isBinaryExpression(expression) && (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || expression.operatorToken.kind === ts.SyntaxKind.BarBarToken)) return literalText(expression.right);
        if (ts.isCallExpression(expression) && expression.arguments.some((argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument))) return false;
        return true;
    };
    const visit = (node: ts.Node) => {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            const opening = ts.isJsxElement(node) ? node.openingElement : node;
            const tag = opening.tagName.getText(file);
            const attributes = opening.attributes;
            const literalVariant = attributes.properties.find((property) => ts.isJsxAttribute(property) && property.name.getText(file) === "data-text");
            if (literalVariant && ts.isJsxAttribute(literalVariant) && literalVariant.initializer && ts.isStringLiteral(literalVariant.initializer)
                && !(literalVariant.initializer.text in TEXT_VARIANTS)) add(literalVariant, "text-variant", `Unknown data-text variant: ${literalVariant.initializer.text}`);
            const literalSize = attributes.properties.find((property) => ts.isJsxAttribute(property) && property.name.getText(file) === "data-text-size");
            if (literalSize && ts.isJsxAttribute(literalSize) && literalSize.initializer && ts.isStringLiteral(literalSize.initializer)
                && !(literalSize.initializer.text in TEXT_SIZES)) add(literalSize, "text-size", `Unknown data-text-size: ${literalSize.initializer.text}`);
            const hidden = attributes.properties.some((property) => ts.isJsxAttribute(property)
                && property.name.getText(file) === "aria-hidden" && property.initializer?.getText(file) === '"true"');
            const hasText = ts.isJsxElement(node) && node.children.some((child) => ts.isJsxText(child) ? Boolean(child.text.trim())
                : ts.isJsxExpression(child) && child.expression ? literalText(child.expression) : false);
            const helper = attributes.properties.some((property) => ts.isJsxSpreadAttribute(property)
                && ts.isCallExpression(property.expression) && /(?:^|\.)textAttributes$/.test(property.expression.expression.getText(file)));
            if (/^[a-z]/.test(tag) && !["script", "style", "svg", "defs", "title"].includes(tag) && hasText && !hidden
                && !hasAttribute(attributes, "data-text") && !helper) add(opening, "text-unbound", `<${tag}> renders text without SystemText or data-text.`);
        }
        ts.forEachChild(node, visit);
    };
    visit(file);
    return issues;
}

// [경계가 바깥으로 다시 나가지 않게 검사 / Prevent returning to exterior or ink-colored strokes]
export function auditStrokeDeclaration(property: string, value: string): string | null {
    if (property === "outline-offset") {
        const resolved = value.replace(/var\((--[\w-]+)(?:,[^)]+)?\)/g, (reference, token: string) => DESIGN_TOKEN_VALUES[token as keyof typeof DESIGN_TOKEN_VALUES] || reference);
        if (/^\s*\+?[\d.]+(?:px|rem|em)?(?:\s*!important)?\s*$/.test(resolved) && parseFloat(resolved) > 0) return "Focus outlines must use a non-positive inner offset.";
    }
    if ((property.startsWith("border") && !property.includes("radius") || /^(?:outline|outline-color)$/.test(property))
        && /var\(--(?:color-black|text-primary|ink)\)/.test(value)) return "UI strokes must use the gentle stroke tokens, not the text ink.";
    return null;
}

// [색상과 가독성 하한의 회귀 차단 / Block regressions in colors and readability floor]
export function auditVisualContract(root: string): VisualIssue[] {
    const issues: VisualIssue[] = [];
    for (const file of authoredFiles(root)) {
        const name = relative(root, file).replace(/\\/g, "/");
        if (name === "styles/tokens.css") continue;
        const source = readFileSync(file, "utf8");
        if (file.endsWith(".tsx")) {
            issues.push(...auditTextBindings(source, name));
            if (migrateTsx(source, file, {}) !== source) issues.push({ code: "color-literal", source: name, line: 1, message: "Inline colors must reference central color tokens." });
            continue;
        }
        const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, (comment) => " ".repeat(comment.length));
        for (const match of withoutComments.matchAll(/([\w-]+)\s*:\s*([^;{}]+)(?=[;}])/g)) {
            const [, property, value] = match;
            const line = source.slice(0, match.index).split("\n").length;
            const strokeIssue = auditStrokeDeclaration(property, value);
            if (strokeIssue) issues.push({ code: "stroke-contract", source: name, line, message: strokeIssue });
            if (colorLiterals(value).length) issues.push({ code: "color-literal", source: name, line, message: `${property} contains an authored color literal.` });
            if (property === "font-size" && !value.includes("var(--text-min)") && !/^(?:inherit|initial|unset|revert(?:-layer)?)(?:\s*!important)?\s*$/.test(value)) {
                issues.push({ code: "text-floor", source: name, line, message: "font-size must use the shared --text-min floor." });
            }
            if (property === "font" && floorFontShorthand(value) !== value) issues.push({ code: "text-floor", source: name, line, message: "Font shorthand must retain the shared --text-min floor." });
        }
    }
    for (const [variant, definition] of Object.entries(TEXT_VARIANTS)) {
        if (definition.minimum < 16) issues.push({ code: "text-floor", source: "src/data/design-tokens.ts", line: 1, message: `${variant} falls below 16px.` });
    }
    for (const [token, value] of Object.entries(DESIGN_TOKEN_VALUES)) {
        for (const reference of value.matchAll(/var\((--[\w-]+)\)/g)) {
            if (!(reference[1] in DESIGN_TOKEN_VALUES)) issues.push({ code: "color-reference", source: "src/data/design-tokens.ts", line: 1, message: `${token} references missing ${reference[1]}.` });
        }
    }
    return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const issues = auditVisualContract(resolve(fileURLToPath(new URL("..", import.meta.url))));
    for (const issue of issues) console.error(`${issue.source}:${issue.line} [${issue.code}] ${issue.message}`);
    console.log(`Visual contract: ${issues.length} issue(s).`);
    if (issues.length) process.exitCode = 1;
}
