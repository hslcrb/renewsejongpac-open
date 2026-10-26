import test from "node:test";
import assert from "node:assert/strict";
const load = async () => import("../src/lib/core.ts");
test("filters programs by category, inclusive date and normalized search", async () => {
  const { filterPrograms } = await load();
  const rows = [
    {
      id: "a",
      title: "가을 음악회",
      category: "공연",
      genre: "클래식",
      start: "2026-10-01",
      end: "2026-10-31",
      venue: "세종대극장",
    },
    {
      id: "b",
      title: "빛의 전시",
      category: "전시",
      start: "2026-11-01",
      end: "2026-11-20",
      venue: "미술관",
    },
  ];
  assert.deepEqual(
    filterPrograms(rows, {
      category: "공연",
      date: "2026-10-31",
      search: "  음악회  ",
    }).map((x) => x.id),
    ["a"],
  );
  assert.equal(
    filterPrograms(rows, { date: "2026-11-01", category: "공연" }).length,
    0,
  );
});
test("escapes text inserted into HTML", async () => {
  const { esc } = await load();
  assert.equal(
    esc('<img onerror="x">&'),
    "&lt;img onerror=&quot;x&quot;&gt;&amp;",
  );
});
test("booking validation rejects missing date, seats and duplicate seats", async () => {
  const { validateBooking } = await load();
  const p = { start: "2026-10-01", end: "2026-10-31" };
  assert.equal(
    validateBooking({ date: "2026-11-01", time: "19:30", seats: ["A1"] }, p).ok,
    false,
  );
  assert.equal(
    validateBooking({ date: "2026-10-13", time: "19:30", seats: [] }, p).ok,
    false,
  );
  assert.equal(
    validateBooking(
      { date: "2026-10-13", time: "19:30", seats: ["A1", "A1"] },
      p,
    ).ok,
    false,
  );
  assert.equal(
    validateBooking(
      { date: "2026-10-13", time: "19:30", seats: ["A1", "A2"] },
      p,
    ).ok,
    true,
  );
});
test("storage safely handles malformed data and unavailable browser storage", async () => {
  const { readStore, writeStore } = await load();
  globalThis.localStorage = {
    getItem: () => "{broken",
    setItem: () => {
      throw new Error("unavailable");
    },
  };
  assert.deepEqual(readStore("test", []), []);
  assert.equal(writeStore("test", [1]), false);
  assert.deepEqual(readStore("test", []), [1]);
  delete globalThis.localStorage;
});
