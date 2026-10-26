import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { PAGES, NAV, PROGRAMS, VENUES } from "../js/data.js";
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
  const { renderPrograms } = await import("../js/programs.js");
  const { renderPages } = await import("../js/pages.js");
  const { renderFlows } = await import("../js/flows.js");
  const { renderUtilities } = await import("../js/utilities.js");
  for (const p of PAGES.filter((p) => p.path !== "/")) {
    const html = [renderFlows, renderPrograms, renderPages, renderUtilities]
      .map((f) => f(p.path, new URLSearchParams()))
      .find((x) => x != null);
    assert.ok(html?.length > 150, p.path + " is empty");
    assert.ok(!html.includes("페이지를 불러오지 못했습니다"), p.path);
  }
});
