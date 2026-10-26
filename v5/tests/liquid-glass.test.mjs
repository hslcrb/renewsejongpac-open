import assert from "node:assert/strict";
import { test } from "node:test";
import { GLASS_DEFAULTS, resolveGlassOptions, createGlassMap } from "../src/lib/liquid-glass.ts";

test("white notices and black notification capsules share one optical material", () => {
    assert.deepEqual(resolveGlassOptions({}, "white"), resolveGlassOptions({}, "black"));
});

// [공통 유리 표면의 안전한 설정 / Safe settings for a reusable glass surface]
test("the shared surface is denser and more refractive than the previous menu", () => {
    assert.ok(GLASS_DEFAULTS.opacity > 0.68);
    assert.ok(GLASS_DEFAULTS.refraction > 26);
    assert.ok(GLASS_DEFAULTS.thickness > 18);
    assert.deepEqual(resolveGlassOptions({}), GLASS_DEFAULTS);
});

test("the drawer variant provides a denser and stronger lens with independently bounded overrides", () => {
    const drawer = resolveGlassOptions({}, "drawer");
    assert.ok(drawer.opacity > GLASS_DEFAULTS.opacity && drawer.opacity < 1);
    assert.ok(drawer.refraction > GLASS_DEFAULTS.refraction);
    assert.ok(drawer.blur > GLASS_DEFAULTS.blur);
    assert.ok(drawer.thickness > GLASS_DEFAULTS.thickness);
    assert.deepEqual(resolveGlassOptions({ opacity: 0.88, refraction: NaN }, "drawer"), { ...drawer, opacity: 0.88 });
    assert.deepEqual(resolveGlassOptions({}), GLASS_DEFAULTS);
});

test("component overrides stay finite and within useful rendering bounds", () => {
    assert.deepEqual(
        resolveGlassOptions({ opacity: 0.9, refraction: 80, blur: 12, thickness: 24 }),
        {
            opacity: 0.9,
            refraction: 80,
            blur: 12,
            thickness: 24,
        },
    );
    const bounded = resolveGlassOptions({
        opacity: -3,
        refraction: 999,
        blur: NaN,
        thickness: Infinity,
    });
    assert.equal(bounded.opacity, 0);
    assert.equal(bounded.refraction, 120);
    assert.equal(bounded.blur, GLASS_DEFAULTS.blur);
    assert.equal(bounded.thickness, GLASS_DEFAULTS.thickness);
});

test("the optical map separates a neutral frosted center from a refracting rim", () => {
    const map = createGlassMap(240, 160, 24, 32);
    const pixel = (x, y) => [...map.slice((y * 240 + x) * 4, (y * 240 + x) * 4 + 4)];
    assert.deepEqual(pixel(120, 80), [128, 128, 0, 255]);
    const left = pixel(4, 80),
        right = pixel(236, 80);
    assert.ok(left[0] < 128 && right[0] > 128);
    assert.equal(left[1], 128);
    assert.ok(left[2] > 200);
    assert.equal(left[2], right[2]);
    assert.equal(left[0] + right[0], 256);
    assert.ok(pixel(24, 80)[2] > 0);
    assert.equal(pixel(40, 80)[2], 0);
});
