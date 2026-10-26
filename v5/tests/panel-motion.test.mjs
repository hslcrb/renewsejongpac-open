import assert from "node:assert/strict";
import { test } from "node:test";
import { stepPanelSpring, samplePanelVertex } from "../src/lib/panel-motion.ts";

// [버튼에서 펼쳐지고 다시 돌아가는 탄성 / Elastic travel from and back to the trigger]
test("the opening spring overshoots gently and settles at its target", () => {
    const spring = { position: 0, velocity: 0 };
    let peak = 0;
    for (let i = 0; i < 180; i++) {
        stepPanelSpring(spring, 1, 1 / 120);
        peak = Math.max(peak, spring.position);
    }
    assert.ok(peak > 1.005 && peak < 1.12, String(peak));
    assert.ok(Math.abs(spring.position - 1) < 0.001);
    assert.ok(Math.abs(spring.velocity) < 0.01);
});

test("reversing midway preserves position and velocity instead of restarting", () => {
    const spring = { position: 0, velocity: 0 };
    for (let i = 0; i < 12; i++) stepPanelSpring(spring, 1, 1 / 120);
    const before = { ...spring };
    stepPanelSpring(spring, 0, 1 / 120);
    assert.ok(Math.abs(spring.position - before.position) < 0.06);
    for (let i = 0; i < 180; i++) stepPanelSpring(spring, 0, 1 / 120);
    assert.ok(Math.abs(spring.position) < 0.001);
});

test("mesh endpoints coincide with the real trigger and the dragged panel", () => {
    const origin = { x: 1420, y: 40, width: 48, height: 48 };
    const target = { x: 120, y: 170, width: 1180, height: 736 };
    for (const [u, v] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [0.5, 0.5],
    ]) {
        assert.deepEqual(samplePanelVertex(u, v, 0, 0, origin, target), {
            x: origin.x + u * 48,
            y: origin.y + v * 48,
        });
        assert.deepEqual(samplePanelVertex(u, v, 1, 0, origin, target), {
            x: target.x + u * target.width,
            y: target.y + v * target.height,
        });
        const middle = samplePanelVertex(u, v, 0.5, 2, origin, target);
        assert.ok(Number.isFinite(middle.x) && Number.isFinite(middle.y));
    }
});

test("the drawer slides from the left wall and stays attached during elastic overshoot", () => {
    const origin = { x: -360, y: 0, width: 360, height: 844 };
    const target = { x: 0, y: 0, width: 360, height: 844 };
    for (const p of [0, 0.25, 0.5, 0.75, 1, 1.04]) {
        const left = samplePanelVertex(0, 0.5, p, 2, origin, target, undefined, "drawer");
        const right = samplePanelVertex(1, 0.5, p, 2, origin, target, undefined, "drawer");
        assert.ok(left.x <= 0, String(left.x));
        assert.ok(right.x > left.x);
        if (p === 1) assert.deepEqual(right, { x: 360, y: 422 });
    }
    // Shadow-padding vertices straddle u=0; their interpolated wall must have no gap.
    const a = samplePanelVertex(-0.015625, 0.5, 1.04, 2, origin, target, undefined, "drawer");
    const b = samplePanelVertex(0.01875, 0.5, 1.04, 2, origin, target, undefined, "drawer");
    assert.ok(Math.abs(a.x + (b.x - a.x) * (0.015625 / 0.034375)) < 0.001);
});
