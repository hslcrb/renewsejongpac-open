import test from "node:test";
import assert from "node:assert/strict";

// [미구현 경로만 확장 / Extend only the agreed unfinished routes]
test("completion allowlist cannot replace the existing working lists, home or account", async () => {
    const { COMPLETION_PATHS, isCompletionPath } = await import("../src/page-completion/manifest.ts");
    assert.equal(COMPLETION_PATHS.length, 89);
    assert.equal(new Set(COMPLETION_PATHS).size, 89);
    for (const path of ["/", "/programs", "/programs/performance", "/programs/exhibition", "/programs/education", "/programs/season", "/news", "/news/notices", "/rental/venues", "/visit/spaces", "/search", "/about/introduction", "/design-rules", "/account", "/booking/dance"])
        assert.equal(isCompletionPath(path), false, path);
    for (const path of ["/about/esg", "/rental/apply", "/news/events", "/visit/directions"])
        assert.equal(isCompletionPath(path), true, path);
});

test("all unfinished pages have source-backed purpose-specific content and no protected route", async () => {
    const { COMPLETION_PAGES, assertCompletionCoverage } = await import("../src/page-completion/content.ts");
    assertCompletionCoverage();
    assert.equal(COMPLETION_PAGES.length, 89);
    assert.ok(COMPLETION_PAGES.find(page => page.path === "/rental/compare")?.special === "venue-compare");
    assert.ok(COMPLETION_PAGES.find(page => page.path === "/news/goods/cart")?.form?.kind === "order");
    assert.ok(COMPLETION_PAGES.find(page => page.path === "/visit/directions")?.sections.some(section => section.type === "image"));
    assert.ok(COMPLETION_PAGES.find(page => page.path === "/about/esg")?.sections.length >= 3);
    assert.throws(() => assertCompletionCoverage([...COMPLETION_PAGES.slice(1), { ...COMPLETION_PAGES[0], path: "/" }]));
});
