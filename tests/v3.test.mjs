import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

// [버전 진입과 독립 실행 / Version entry and independent runtime]
// 새 버전의 실제 진입·경로·저장소 동작을 검증합니다.
// Exercise the new entry, route renderers and isolated visitor storage.
test("version selection exposes v3 as a normal HTML link", async () => {
    const entry = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(entry, /href="v3\/index\.html"/);
});

test("v3 preserves all published routes and local artwork", async () => {
    const { PAGES: original } = await import("../v2/src/data/catalog.js");
    const { PAGES, PROGRAMS, VENUES } = await import("../v3/src/data/catalog.js");
    const { renderHome } = await import("../v3/src/features/home.js");
    const { renderPrograms } = await import("../v3/src/features/programs.js");
    const { renderPages } = await import("../v3/src/features/pages.js");
    const { renderFlows } = await import("../v3/src/features/flows.js");
    const { renderUtilities } = await import("../v3/src/features/utilities.js");
    const { renderGoods } = await import("../v3/src/features/goods.js");
    const paths = new Set(PAGES.map(page => page.path));
    for (const page of original) assert.ok(paths.has(page.path), page.path);
    for (const page of PAGES) {
        const html = page.path === "/" ? renderHome() : [renderGoods, renderFlows, renderPrograms, renderPages, renderUtilities]
            .map(render => render(page.path, new URLSearchParams()))
            .find(result => result != null);
        assert.ok(html?.length > 150, page.path);
        assert.ok(!html.includes("undefined"), page.path);
    }
    const document = new URL("../v3/index.html", import.meta.url);
    for (const item of [...PROGRAMS, ...VENUES]) await access(new URL(item.image, document));
});

test("v3 visitor changes preserve legacy and v2 storage", async () => {
    const { readStore, writeStore } = await import("../v3/src/lib/core.js");
    const values = new Map([
        ["sejong:comparison", JSON.stringify("legacy")],
        ["sejong-v2:comparison", JSON.stringify("v2")]
    ]);
    const previous = globalThis.localStorage;
    globalThis.localStorage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value)
    };
    try {
        assert.equal(readStore("comparison", "empty"), "empty");
        writeStore("comparison", "v3");
        assert.equal(readStore("comparison", "empty"), "v3");
        assert.equal(values.get("sejong:comparison"), JSON.stringify("legacy"));
        assert.equal(values.get("sejong-v2:comparison"), JSON.stringify("v2"));
        assert.equal(values.get("sejong-v3:comparison"), JSON.stringify("v3"));
    } finally {
        if (previous === undefined) delete globalThis.localStorage;
        else globalThis.localStorage = previous;
    }
});
