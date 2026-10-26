import { GLASS_MATERIALS } from "../data/design-tokens.ts";
import type { GlassMaterial, GlassMaterialVariant } from "../data/design-tokens.ts";

export type GlassOptions = { -readonly [Property in keyof GlassMaterial]: GlassMaterial[Property] };
export type GlassVariant = GlassMaterialVariant;

// [공통 유리의 재질 / Shared glass material]
export const GLASS_DEFAULTS: Readonly<GlassOptions> = GLASS_MATERIALS.surface;

// [용도에 따른 재질 베리언트 / Material variants by purpose]
export const GLASS_VARIANTS: Readonly<Record<GlassVariant, Readonly<GlassOptions>>> = GLASS_MATERIALS;

export function resolveGlassOptions(options: Partial<GlassOptions>, variant: GlassVariant = "surface"): GlassOptions {
    const defaults = GLASS_VARIANTS[variant];
    const bounded = (value: number | undefined, fallback: number, min: number, max: number) =>
        Math.max(min, Math.min(Number.isFinite(value) ? value! : fallback, max));
    return {
        opacity: bounded(options.opacity, defaults.opacity, 0, 1),
        refraction: bounded(options.refraction, defaults.refraction, 0, 120),
        blur: bounded(options.blur, defaults.blur, 0, 40),
        thickness: bounded(options.thickness, defaults.thickness, 1, 64),
    };
}

// [굴절은 가장자리에만 / Refraction at the rim, an undistorted reading area]
export function glassDisplacement(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    rim: number,
): { x: number; y: number } {
    const cx = x - width / 2;
    const cy = y - height / 2;
    const qx = Math.abs(cx) - (width / 2 - radius);
    const qy = Math.abs(cy) - (height / 2 - radius);
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    const length = Math.hypot(ox, oy);
    const depth = -(length + Math.min(Math.max(qx, qy), 0) - radius);
    if (depth < 0 || depth >= rim) return { x: 0, y: 0 };
    const strength = Math.cos(((depth / rim) * Math.PI) / 2) ** 2;
    const nx = length > 0 ? ox / length : qx > qy ? 1 : 0;
    const ny = length > 0 ? oy / length : qy >= qx ? 1 : 0;
    return { x: Math.sign(cx) * nx * strength, y: Math.sign(cy) * ny * strength };
}

// [굴절 방향과 투명한 테두리의 지도 / Displacement vectors and a clear-rim mask]
// R/G는 굴절 방향, B는 맑은 가장자리의 혼합 비율입니다.
// R/G encode displacement; B blends the clear rim with the frosted center.
export function createGlassMap(width: number, height: number, radius: number, thickness: number) {
    const map = new Uint8ClampedArray(width * height * 4);
    const rim = Math.min(thickness, width / 3, height / 3);
    const reach = Math.ceil(Math.max(radius, rim));
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            let dx = 0;
            let dy = 0;
            if (x < reach || x > width - reach || y < reach || y > height - reach) {
                const normal = glassDisplacement(x, y, width, height, radius, rim);
                dx = normal.x;
                dy = normal.y;
            }
            map[index] = Math.round(128 + dx * 127);
            map[index + 1] = Math.round(128 + dy * 127);
            map[index + 2] = Math.round(Math.hypot(dx, dy) * 255);
            map[index + 3] = 255;
        }
    }
    return map;
}
