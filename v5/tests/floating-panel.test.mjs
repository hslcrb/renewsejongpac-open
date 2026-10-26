import assert from "node:assert/strict";
import { test } from "node:test";
import {
    constrainPanel,
    initialPanelPosition,
    glassDisplacement,
} from "../src/lib/floating-panel.ts";

// [화면 밖으로 사라지지 않는 메뉴 / A floating menu that stays reachable]
test("floating panel accepts every in-bounds position and clamps all four edges", () => {
    const frame = { width: 1440, height: 900, panelWidth: 1000, panelHeight: 640, inset: 12 };
    assert.deepEqual(constrainPanel({ x: 120, y: 170 }, frame), { x: 120, y: 170 });
    assert.deepEqual(constrainPanel({ x: -500, y: -500 }, frame), { x: 12, y: 12 });
    assert.deepEqual(constrainPanel({ x: 3000, y: 3000 }, frame), { x: 428, y: 248 });
    assert.deepEqual(initialPanelPosition(frame), { x: 220, y: 108 });
});

test("small and resized viewports keep the menu controls in reach", () => {
    const frame = { width: 320, height: 568, panelWidth: 296, panelHeight: 544, inset: 12 };
    assert.deepEqual(initialPanelPosition(frame), { x: 12, y: 12 });
    assert.deepEqual(constrainPanel({ x: 800, y: 700 }, frame), { x: 12, y: 12 });
    assert.deepEqual(constrainPanel({ x: -40, y: -30 }, { ...frame, panelHeight: 650 }), {
        x: 12,
        y: 12,
    });
});

test("the glass lens refracts the rim and leaves its reading area undistorted", () => {
    const center = glassDisplacement(500, 300, 1000, 600, 24, 16);
    const left = glassDisplacement(4, 300, 1000, 600, 24, 16);
    const right = glassDisplacement(996, 300, 1000, 600, 24, 16);
    assert.deepEqual(center, { x: 0, y: 0 });
    assert.ok(left.x < 0 && right.x > 0);
    assert.equal(left.x, -right.x);
    assert.equal(left.y, 0);
    assert.ok(Math.abs(left.x) <= 1);
    const corner = glassDisplacement(12, 12, 1000, 600, 24, 16);
    assert.ok(corner.x < 0 && corner.y < 0);
});
