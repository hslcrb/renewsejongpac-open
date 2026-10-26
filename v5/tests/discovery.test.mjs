import test from "node:test";
import assert from "node:assert/strict";
import { searchContent } from "../src/lib/discovery.ts";

test("search ranks a named program and tolerates Korean spacing", () => {
    const results = searchContent("일 무");
    assert(results.some(item => item.path === "/programs/dance"));
    assert.equal(results[0].kind, "programs");
});

test("search includes venue and accessibility content and supports category filtering", () => {
    assert(searchContent("대극장").some(item => item.kind === "spaces"));
    assert(searchContent("휠체어").some(item => item.path === "/visit/accessibility"));
    assert(searchContent("세종", "programs").every(item => item.kind === "programs"));
});

test("empty, unknown and hostile query text produces safe deterministic results", () => {
    assert.deepEqual(searchContent("  "), []);
    assert.deepEqual(searchContent("없는검색어abcdef"), []);
    assert.deepEqual(searchContent("<script>alert(1)</script>"), []);
    assert.deepEqual(searchContent("일무", "missing"), []);
});

test("driving synonyms find parking and exhibition spaces do not claim seat counts", () => {
    assert(searchContent("자동차").some(item => item.path === "/visit/directions/parking"));
    const gallery = searchContent("미술관", "spaces").find(item => item.path === "/visit/spaces/gallery");
    assert(gallery);
    assert.equal(gallery.detail, "전시장 · 전시 공간");
});
