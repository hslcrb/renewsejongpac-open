import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// [스크롤 디자인 계약 / System-wide native scrollbar contract]
const component = readFileSync(new URL("../components/GlobalScrollbar.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const registry = readFileSync(new URL("../src/data/component-registry.ts", import.meta.url), "utf8");

test("native scrollbars use a transparent track and a thin neutral thumb", () => {
    assert.match(component, /scrollbar-width:\s*thin\s*;/);
    assert.match(component, /scrollbar-color:\s*var\(--color-gray-300\)\s+transparent\s*;/);
    assert.match(component, /::-webkit-scrollbar\s*\{\s*width:\s*7px;/);
    assert.match(component, /::-webkit-scrollbar-track/);
    assert.match(component, /::-webkit-scrollbar-corner/);
    assert.match(component, /background:\s*none\s*;/);
    assert.match(component, /background-color:\s*var\(--color-gray-300\)/);
    assert.match(component, /@media\s*\(forced-colors:\s*active\)/);
    assert.doesNotMatch(component, /overflow:\s*(?:hidden|clip)\b/);
});

test("a single reusable global component reaches the root document and registry", () => {
    assert.match(layout, /import GlobalScrollbar from "\.\.\/components\/GlobalScrollbar";/);
    assert.match(layout, /<head>[\s\S]*?<GlobalScrollbar\s*\/>[\s\S]*?<\/head>/);
    assert.match(component, /data-component-id="global-scrollbar"/);
    assert.match(registry, /id:\s*"global-scrollbar"[^\n]*source:\s*"components\/GlobalScrollbar\.tsx"/);
});
