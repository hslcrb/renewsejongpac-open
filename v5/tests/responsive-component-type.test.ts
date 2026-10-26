import assert from "node:assert/strict";
import { test } from "node:test";
import { DESIGN_TOKEN_VALUES, TEXT_SIZES, renderDesignTokensCss, renderTypographyCss } from "../src/data/design-tokens.ts";

// [관찰한 제품 크기와 공식 축의 연결 / Bind observed product sizes to official axes]
test("hero layouts and the quick-menu label have explicit responsive size tokens", () => {
    const sizes = TEXT_SIZES as Readonly<Record<string, string>>;
    const tokens = DESIGN_TOKEN_VALUES as Readonly<Record<string, string>>;
    assert.equal(sizes["hero-with-companion"], "var(--text-hero-with-companion)");
    assert.equal(sizes["hero-standalone"], "var(--text-hero-standalone)");
    assert.equal(sizes["quick-action"], "var(--text-quick-action)");
    assert.equal(tokens["--text-hero-with-companion"], "clamp(2.5rem, 3.7vw, 3.5rem)");
    assert.equal(tokens["--text-hero-standalone"], "clamp(2.625rem, 4.3vw, 4.125rem)");
    assert.equal(tokens["--text-quick-action"], "1rem");
    const css = renderDesignTokensCss();
    assert.ok(css.includes("--text-hero-standalone: 2.875rem;"));
    assert.ok(css.includes("--text-hero-standalone: clamp(2.125rem, 8.5vw, 2.75rem);"));
    assert.ok(css.includes("--text-hero-with-companion: clamp(1.875rem, 7vw, 2.5rem);"));
    assert.ok(!renderTypographyCss().includes("1.375rem"), "the actual quick-menu label stays at its observed 16px");
});
