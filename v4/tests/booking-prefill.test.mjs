import test from "node:test";
import assert from "node:assert/strict";
import { renderFlows } from "../src/features/flows.js";
import { PROGRAMS } from "../src/data/catalog.js";

// [빠른 예매에서 접수까지 / Keep the quick-booking selection]
test("quick booking preserves a valid date, time and requested party", () => {
    const program = PROGRAMS.find(item => item.category === "공연" && item.times.length > 1);
    const time = program.times.at(-1);
    const html = renderFlows(`/booking/${program.id}`, new URLSearchParams({ date: program.end, time, participants: "3", source: "home" }));
    assert.ok(html.includes(`value="${program.end}"`));
    assert.ok(html.includes(`value="${time}" checked`));
    assert.ok(html.includes("선택하신 관람인원 3명"));
});

test("education application carries the chosen session into form fields", () => {
    const program = PROGRAMS.find(item => item.category === "교육");
    const html = renderFlows("/apply/education", new URLSearchParams({ program: program.id, date: program.start, time: program.times[0], participants: "2", source: "home" }));
    assert.ok(html.includes(`value="${program.start}"`));
    assert.ok(html.includes(`value="${program.times[0]}" selected`));
    assert.match(html, /name="participants"[^>]*value="2"/);
});

test("invalid booking link does not insert an arbitrary time or party count", () => {
    const program = PROGRAMS.find(item => item.category === "전시");
    const html = renderFlows(`/booking/${program.id}`, new URLSearchParams({ date: "2026-99-99", time: "25:99", participants: "999", source: "home" }));
    assert.ok(!html.includes("25:99"));
    assert.ok(!html.includes("999명"));
    assert.ok(!html.includes('value="2026-99-99"'));
});
