import test from "node:test";
import assert from "node:assert/strict";
import { stepFluid, drawFluid } from "../src/lib/quick-menu-fluid.ts";
import type { FluidState, FluidPaint, QuickMenuInteraction } from "../src/lib/quick-menu-fluid.ts";
import { QUICK_MENU_MATERIAL } from "../src/data/design-tokens.ts";

const resting = (): QuickMenuInteraction => ({ x: 0, y: 0, spin: 0, active: false, energy: 0, velocityX: 0, velocityY: 0, lastInput: 0 });
const state = (): FluidState => ({ x: 0, y: 0, spin: 0, phase: 0 });

// [입력의 상한과 잔향 / Bounded input and release]
test("fluid follows the pointer smoothly and settles after release", () => {
    const surface = state();
    const input = { ...resting(), x: 1, y: -1, spin: 1, active: true };
    for (let frame = 0; frame < 60; frame++) stepFluid(surface, input, 1 / 60, frame * 1000 / 60);
    assert.ok(surface.x > 0.1 && surface.x <= QUICK_MENU_MATERIAL.motion.maxInput);
    assert.ok(surface.y < -0.1 && surface.y >= -QUICK_MENU_MATERIAL.motion.maxInput);
    const released = { ...input, active: false, lastInput: 1000 };
    for (let frame = 1; frame <= 240; frame++) stepFluid(surface, released, 1 / 60, 1000 + frame * 1000 / 60);
    assert.ok(Math.abs(surface.x) < 0.001 && Math.abs(surface.y) < 0.001 && Math.abs(surface.spin) < 0.001);
});

test("signed rotation changes flow direction without a discontinuity or a large frame jump", () => {
    const clockwise = state();
    const counterclockwise = state();
    for (let frame = 0; frame < 60; frame++) {
        stepFluid(clockwise, { ...resting(), spin: 1, active: true }, 1 / 60, 1000);
        stepFluid(counterclockwise, { ...resting(), spin: -1, active: true }, 1 / 60, 1000);
    }
    assert.ok(clockwise.phase > counterclockwise.phase + 0.8);
    const delayed = state();
    const bounded = state();
    stepFluid(delayed, resting(), 10, 10000);
    stepFluid(bounded, resting(), 0.05, 10000);
    assert.deepEqual(delayed, bounded);
});

test("painting uses six authored curves and no per-frame gradient or texture allocation", () => {
    const paths: number[][] = [];
    const calls: string[] = [];
    const mock = new Proxy({}, {
        get: (_target, name) => (...args: number[]) => { calls.push(String(name)); if (name === "bezierCurveTo") paths.push(args); },
        set: () => true,
    }) as CanvasRenderingContext2D;
    drawFluid(mock, {} as FluidPaint, state());
    assert.equal(paths.length, 6);
    assert.equal(calls.filter(call => call === "fill").length, 3);
    assert.equal(calls.filter(call => call === "clip").length, 2);
    assert.equal(calls.filter(call => /Gradient|drawImage|stroke/.test(call)).length, 0);
    assert.ok(paths.flat().every(Number.isFinite));
});
