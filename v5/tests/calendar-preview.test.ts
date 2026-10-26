import assert from "node:assert/strict";
import test from "node:test";
import { positionCalendarPreview } from "../src/lib/calendar-preview.ts";

test("preview follows the cursor with a gap", () => {
    assert.deepEqual(positionCalendarPreview({ x: 200, y: 250 }, { width: 340, height: 280 }, { width: 1440, height: 900 }), { x: 218, y: 268 });
});

test("preview flips above and left at viewport edges", () => {
    assert.deepEqual(positionCalendarPreview({ x: 1380, y: 850 }, { width: 340, height: 280 }, { width: 1440, height: 900 }), { x: 1022, y: 552 });
});

test("preview remains inside a narrow viewport", () => {
    const point = positionCalendarPreview({ x: 160, y: 300 }, { width: 296, height: 320 }, { width: 320, height: 640 });
    assert.deepEqual(point, { x: 12, y: 308 });
    assert.ok(point.x + 296 <= 308);
    assert.ok(point.y + 320 <= 628);
});

test("keyboard anchor at the top edge is clamped below the viewport margin", () => {
    assert.deepEqual(positionCalendarPreview({ x: 0, y: 0 }, { width: 340, height: 280 }, { width: 1440, height: 900 }), { x: 18, y: 18 });
});
