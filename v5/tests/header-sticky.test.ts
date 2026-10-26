import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// [헤더 회귀 방지 / A sticky header must never disappear above the viewport]
test("site header stays aligned with the top of the viewport", () => {
    const css = readFileSync(new URL("../styles/components.css", import.meta.url), "utf8");
    const rule = css.match(/\.renewal-header\s*\{([^}]+)\}/)?.[1];
    assert.ok(rule, "the shared header style must exist");
    assert.match(rule, /position:\s*sticky\s*;/);
    assert.match(rule, /(?:^|\n)\s*top:\s*0(?:px)?\s*;/);
    assert.doesNotMatch(rule, /top:\s*-\d/, "negative sticky offsets clip the masthead on scroll");
});
