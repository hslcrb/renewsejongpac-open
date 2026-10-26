import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { DESIGN_COLORS, DESIGN_TOKEN_VALUES, GLASS_MATERIALS, TEXT_VARIANTS, renderTypographyCss } from "../src/data/design-tokens.ts";
import { auditStrokeDeclaration, auditTextBindings } from "../scripts/audit-visual-contract.ts";
import { colorLiterals, floorFontShorthand, migrateColors, migrateCss, migrateTsx, normalizedColor } from "../scripts/visual-contract.ts";
import type { ColorValues } from "../scripts/visual-contract.ts";

// [중립색과 읽기 위계의 실제 계약 / Actual contract for neutral colors and reading hierarchy]
test("UI edges reject exterior focus and ink-colored strokes while preserving fills", () => {
    assert.ok(auditStrokeDeclaration("outline-offset", "4px"));
    assert.ok(auditStrokeDeclaration("outline-offset", "0.25rem !important"));
    assert.ok(auditStrokeDeclaration("border", "1px solid var(--ink)"));
    assert.ok(auditStrokeDeclaration("border-top", "2px solid var(--text-primary)"));
    assert.equal(auditStrokeDeclaration("outline-offset", "var(--focus-offset)"), null);
    assert.equal(auditStrokeDeclaration("outline-offset", "-3px"), null);
    assert.equal(auditStrokeDeclaration("outline-offset", "0"), null);
    assert.equal(auditStrokeDeclaration("border", "1px solid var(--border-default)"), null);
    assert.equal(auditStrokeDeclaration("outline", "3px solid var(--border-focus)"), null);
    assert.equal(auditStrokeDeclaration("background", "var(--color-black)"), null);
});

test("shared roles preserve hierarchy with a 16px floor", () => {
    assert.ok(Object.values(TEXT_VARIANTS).every((variant) => variant.minimum >= 16));
    assert.ok(TEXT_VARIANTS.title.minimum > TEXT_VARIANTS.body.minimum);
    assert.equal(DESIGN_TOKEN_VALUES["--text-min"], "1rem");
    assert.equal(readFileSync(new URL("../styles/typography.css", import.meta.url), "utf8").replace(/\r\n/g, "\n"), renderTypographyCss());
    assert.ok(!renderTypographyCss().includes("!important"));
    assert.ok(!renderTypographyCss().includes('[data-text="body"] {\n    font-size: 1rem'));
});

test("neutral endpoints are tinted while brand colors remain unchanged", () => {
    assert.equal(DESIGN_COLORS.find((color) => color.token === "color-black")?.hex, "#211F1C");
    assert.equal(DESIGN_COLORS.find((color) => color.token === "color-white")?.hex, "#FFFEFA");
    assert.equal(DESIGN_COLORS.find((color) => color.token === "color-sky")?.hex, "#54C8E8");
    assert.equal(DESIGN_COLORS.find((color) => color.token === "color-yellow")?.hex, "#F7D549");
    assert.equal(DESIGN_COLORS.find((color) => color.token === "color-ochre")?.hex, "#C36D15");
    assert.equal(GLASS_MATERIALS.black.blur, 18);
});

// [반응형 선언과 삽화 색상 보존 / Preserve responsive declarations and illustration colors]
test("CSS migration keeps responsive hierarchy and binds all literal colors", () => {
    const additions: ColorValues = {};
    const original = `.title { font-size: clamp(32px, 4vw, 64px); color: #000; background: rgba(255, 255, 255, .8); }\n@media(max-width:600px) { .meta { font-size: 12px !important; border-color: #A77F53; } }`;
    const next = migrateCss(original, additions);
    assert.ok(next.includes("font-size: max(var(--text-min), clamp(32px, 4vw, 64px))"));
    assert.ok(next.includes("font-size: max(var(--text-min), 12px) !important"));
    assert.ok(next.includes("color: var(--color-black)"));
    const registeredColors = { ...DESIGN_TOKEN_VALUES, ...additions };
    assert.ok(Object.values(registeredColors).includes("#A77F53"));
    assert.ok(Object.values(registeredColors).includes("rgb(255 254 250 / 80%)"));
    assert.deepEqual(colorLiterals(next), []);
    assert.equal(migrateCss(next, additions), next);
    assert.deepEqual(colorLiterals("var(--color-black) var(--color-white) url(#fff)"), []);
    assert.equal(floorFontShorthand("600 12px/1.5 var(--font)"), "600 max(var(--text-min), 12px)/1.5 var(--font)");
    assert.equal(floorFontShorthand("var(--weight-action) var(--text-body)/var(--leading-label) var(--font)"), "var(--weight-action) max(var(--text-min), var(--text-body))/var(--leading-label) var(--font)");
});

test("JSX migration preserves artwork and ignores content, URLs and class names", () => {
    const additions: ColorValues = {};
    const source = 'const x = <><path fill="#A77F53" /><div className="white" style={{ background: "#fff" }}>#000</div><img src="/white.svg" /></>';
    const next = migrateTsx(source, "example.tsx", additions);
    assert.ok(next.includes('fill="var(--color-detail-a77f53)"'));
    assert.ok(next.includes('background: "var(--color-white)"'));
    assert.ok(next.includes('className="white"'));
    assert.ok(next.includes(">#000</div>"));
    assert.ok(next.includes('src="/white.svg"'));
    assert.equal(normalizedColor("rgb(0 0 0 / var(--opacity))"), "rgb(33 31 28 / var(--opacity))");
    assert.equal(migrateColors("rgb(0 0 0 / var(--opacity))", additions), "color-mix(in srgb, var(--color-black) calc(var(--opacity) * 100%), var(--color-transparent))");
});

// [작성 소스에 연결이 누락되면 실패 / Fail when authored text loses its shared binding]
test("text audit validates explicit variants for static and dynamic native text", () => {
    assert.equal(auditTextBindings('<p>안내</p>', "Example.tsx")[0]?.code, "text-unbound");
    assert.equal(auditTextBindings('<span>{label}</span>', "Example.tsx")[0]?.code, "text-unbound");
    assert.deepEqual(auditTextBindings('<><SystemText as="h2" variant="heading">제목</SystemText><p data-text="body">안내</p><button {...textAttributes("label")}>{label}</button></>', "Example.tsx"), []);
    assert.equal(auditTextBindings('<p data-text="tiny">안내</p>', "Example.tsx")[0]?.code, "text-variant");
    assert.deepEqual(auditTextBindings('<span aria-hidden="true">arrow_forward</span>', "Example.tsx"), []);
});

// [네이티브 요소도 같은 역할과 크기 / Native elements share role and size contracts]
test("native typography applies real shared styles and validates the independent size axis", () => {
    const css = renderTypographyCss();
    assert.ok(css.includes('[data-text="heading"]'), "native role selector exists");
    assert.ok(!css.includes('.system-text[data-text="heading"]'), "native roles are not component-class restricted");
    assert.ok(css.includes('[data-text-size="control"]'));
    assert.ok(css.includes('[data-text-size="hero-with-companion"]'));
    assert.ok(css.includes('[data-text-size="hero-standalone"]'));
    assert.ok(css.includes('[data-text-size="quick-action"]'));
    assert.equal(auditTextBindings('<input data-text="body" data-text-size="tiny" />', "Example.tsx")[0]?.code, "text-size");
});
