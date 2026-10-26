import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { PAGES, NAV, PROGRAMS, VENUES } from "../src/data/catalog.js";
import { PAGES as ORIGINAL_PAGES } from "../../v3/src/data/catalog.js";

// [기존 경로 보존과 새 기능 등록 / Preserved routes and completed services]
// 132개 원본을 보존하되 새 기능의 경로 추가를 허용하는 현재 계약입니다.
// Preserve every original route while allowing the new service destinations.
test("v4 retains every v3 route and registers all completed service destinations", () => {
    const routes = new Set(PAGES.map(page => page.path));
    for (const page of ORIGINAL_PAGES) assert(routes.has(page.path), page.path);
    for (const route of [
        "/news/notices/recruit/apply", "/news/goods/art-postcards", "/news/goods/canvas-bag",
        "/news/goods/viewing-journal", "/news/goods/cart", "/news/goods/orders",
        "/visit/plan", "/rental/compare",
    ]) assert(routes.has(route), route);
});
test("every published route is unique and every navigation destination is registered", () => {
  const paths = PAGES.map((p) => p.path);
  assert.equal(new Set(paths).size, paths.length, "duplicate page path");
  for (const nav of NAV)
    for (const [, path] of nav.items) assert.ok(paths.includes(path), path);
});
test("every program and venue visual is present locally", async () => {
  for (const p of [...PROGRAMS, ...VENUES])
    await access(new URL("../" + p.image, import.meta.url));
});
test("all program dates form valid ordered intervals", () => {
  for (const p of PROGRAMS) {
    assert.match(p.start, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.end >= p.start, p.id);
    assert.ok(p.price >= 0);
  }
});
test("each registered information, program and utility route produces content", async () => {
  const { renderPrograms } = await import("../src/features/programs.js");
  const { renderPages } = await import("../src/features/pages.js");
  const { renderFlows } = await import("../src/features/flows.js");
  const { renderUtilities } = await import("../src/features/utilities.js");
  const { renderGoods } = await import("../src/features/goods.js");
  const { renderStory } = await import("../src/features/story.js");
  const { renderJourneys } = await import("../src/features/journeys.js");
  for (const p of PAGES.filter((p) => p.path !== "/")) {
    const html = [renderJourneys, renderStory, renderGoods, renderFlows, renderPrograms, renderPages, renderUtilities]
      .map((f) => f(p.path, new URLSearchParams()))
      .find((x) => x != null);
    assert.ok(html?.length > 150, p.path + " is empty");
    assert.ok(!html.includes("페이지를 불러오지 못했습니다"), p.path);
    assert.ok(!html.includes("undefined"), p.path + " contains an undefined value");
  }
});
