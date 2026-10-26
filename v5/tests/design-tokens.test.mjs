import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { designTokensCss } from "../src/data/design-system.ts";
import { GLASS_DEFAULTS, GLASS_VARIANTS, resolveGlassOptions } from "../src/lib/liquid-glass.ts";

const tokenSource = new URL("../src/data/design-tokens.ts", import.meta.url);
const stylesheet = new URL("../styles/tokens.css", import.meta.url);

// [토큰 원본과 실제 스타일의 일치 / Canonical tokens and deployed stylesheet parity]
test("one typed token source preserves the effective geometry and existing compatibility aliases", async () => {
    assert.ok(existsSync(tokenSource), "the shared typed token source must exist");
    const { DESIGN_TOKEN_VALUES: tokens } = await import(tokenSource.href);
    assert.equal(tokens["--radius"], "0.875rem");
    assert.equal(tokens["--radius-media"], "1rem");
    assert.equal(tokens["--radius-banner"], "1.25rem");
    assert.equal(tokens["--radius-dialog"], "28px");
    assert.equal(tokens["--section-gap"], "clamp(5rem, 7vw, 7rem)");
    assert.equal(tokens["--control-size"], "3rem");
    assert.equal(tokens["--radius-control"], "12px");
    assert.equal(tokens["--radius-flow"], "14px");
    assert.equal(tokens["--surface-radius-panel"], "1.25rem");
    assert.equal(tokens["--surface-radius-compact"], "1rem");
    assert.equal(tokens["--stroke-width"], "1px");
    assert.equal(tokens["--focus-offset"], "-3px");
    assert.equal(tokens["--control-flow-button-size"], "50px");
    assert.equal(tokens["--control-flow-field-size"], "54px");
    assert.equal(tokens["--paper"], "var(--surface-default)");
    assert.equal(tokens["--semantic-error-border"], "var(--border-strong)");
    assert.equal(tokens["--state-hover"], "var(--color-state-hover)");
    assert.equal(tokens["--color-state-hover"], "#F0F2F4");
    assert.equal(tokens["--feedback-duration"], "160ms");
});

test("the downloadable CSS is the generated production file, including the existing local font face", async () => {
    const css = readFileSync(stylesheet, "utf8").replace(/\r\n/g, "\n");
    assert.equal(designTokensCss(), css, "documentation and production CSS cannot diverge");
    const { renderDesignTokensCss } = await import(tokenSource.href);
    assert.equal(renderDesignTokensCss(), css);
    assert.match(css, /@font-face\s*\{/);
    assert.match(css, /font-display: swap;/);
    assert.match(css, /\/v5\/assets\/fonts\/woff2\/WantedSansVariable\.woff2/);
    assert.match(css, /BlinkMacSystemFont/);
    assert.equal(renderDesignTokensCss(), renderDesignTokensCss(), "generation is deterministic");
    for (const file of ["defaults", "refinements"]) {
        assert.doesNotMatch(readFileSync(new URL(`../styles/${file}.css`, import.meta.url), "utf8"), /:root\s*\{/);
    }
});

test("CSS materials and optical defaults come from the same immutable surface, drawer and hero definitions", async () => {
    assert.ok(existsSync(tokenSource), "the shared typed material source must exist");
    const { GLASS_MATERIALS, DESIGN_TOKEN_VALUES: tokens } = await import(tokenSource.href);
    assert.equal(GLASS_DEFAULTS, GLASS_MATERIALS.surface);
    assert.equal(GLASS_VARIANTS, GLASS_MATERIALS);
    assert.deepEqual(resolveGlassOptions({}, "hero"), { opacity: 0.84, refraction: 72, blur: 20, thickness: 28 });
    for (const [variant, material] of Object.entries(GLASS_MATERIALS)) {
        assert.ok(Object.isFrozen(material));
        const prefix = variant === "surface" ? "--glass" : `--glass-${variant}`;
        for (const property of ["opacity", "refraction", "blur", "thickness"]) {
            const unit = property === "blur" || property === "thickness" ? "px" : "";
            assert.equal(tokens[`${prefix}-${property}`], `${material[property]}${unit}`);
        }
    }
    assert.ok(Object.isFrozen(GLASS_MATERIALS));
    assert.deepEqual(resolveGlassOptions({ refraction: NaN, blur: -10 }, "hero"), { ...GLASS_MATERIALS.hero, blur: 0 });
});

test("the generation check accepts the current stylesheet without writing it", () => {
    const script = new URL("../scripts/sync-design-tokens.ts", import.meta.url);
    assert.ok(existsSync(script), "the deterministic generation check must exist");
    const before = readFileSync(stylesheet, "utf8");
    const result = spawnSync(process.execPath, [fileURLToPath(script), "--check"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(readFileSync(stylesheet, "utf8"), before);
});

test("a stale or missing generated file fails check without writes and normal generation repairs it", async () => {
    const { syncDesignTokens } = await import("../scripts/sync-design-tokens.ts");
    const directory = mkdtempSync(join(tmpdir(), "sejong-design-tokens-"));
    const target = join(directory, "tokens.css");
    try {
        assert.equal(syncDesignTokens({ check: true, target }), false);
        assert.equal(existsSync(target), false, "check cannot create a missing file");
        writeFileSync(target, ":root { --radius-control: 12px; }\n", "utf8");
        const stale = readFileSync(target, "utf8");
        assert.equal(syncDesignTokens({ check: true, target }), false);
        assert.equal(readFileSync(target, "utf8"), stale, "check cannot repair a stale file");
        assert.equal(syncDesignTokens({ target }), true);
        assert.equal(readFileSync(target, "utf8"), designTokensCss());
        assert.equal(syncDesignTokens({ check: true, target }), true);
        const checkout = designTokensCss().replace(/\n/g, "\r\n");
        writeFileSync(target, checkout, "utf8");
        assert.equal(syncDesignTokens({ check: true, target }), true, "Windows checkout line endings do not indicate token drift");
        assert.equal(readFileSync(target, "utf8"), checkout, "check preserves checkout line endings");
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
