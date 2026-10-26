import {describe, it, expect} from 'vitest'
import {tgpu, d, std} from '@coreroot/gpu/kit'
import {
    MAX_COLOR_STOPS,
    colorStopsTransform,
    sortStops,
    resolveStops,
    packStops,
    packConvertedStops,
    mixColorStops,
    colorStopsPropConfig,
    type ColorStop,
    type ToRGBA,
} from '@coreroot/gpu/kit/colorStops'

/**
 * B6 kit colorStops gate. CPU golden values for the sort/pack/resolve logic; resolve gate for
 * the GPU unroll helpers; and a CPU golden value for the `mixColorStops` unroll itself (the
 * chained tgpu.fns run as plain JS off-GPU).
 */

// Deterministic mock parser (real one is transformations.ts / B2): treat "r,g,b,a" strings.
const mockRGBA: ToRGBA = (css) => {
    const parts = css.split(',').map(Number)
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1]
}

describe('colorStops — CPU sort / resolve / pack', () => {
    it('MAX_COLOR_STOPS is 8', () => {
        expect(MAX_COLOR_STOPS).toBe(8)
    })

    it('colorStopsTransform is identity', () => {
        const v = [{color: '#fff', position: 0}]
        expect(colorStopsTransform(v)).toBe(v)
    })

    it('sortStops is stable by position', () => {
        const stops: ColorStop[] = [
            {color: 'a', position: 0.5},
            {color: 'b', position: 0.0},
            {color: 'c', position: 0.5},
        ]
        expect(sortStops(stops).map((s) => s.color)).toEqual(['b', 'a', 'c'])
    })

    it('resolveStops: explicit sorted, else legacy colorA/colorB pair', () => {
        expect(resolveStops({stops: [{color: 'x', position: 1}, {color: 'y', position: 0}]}).map((s) => s.color)).toEqual(['y', 'x'])
        const legacy = resolveStops({colorA: '#111', colorB: '#222'})
        expect(legacy).toEqual([{color: '#111', position: 0}, {color: '#222', position: 1}])
        // null/empty → legacy defaults
        expect(resolveStops({stops: null}).length).toBe(2)
    })

    it('packStops packs sorted rgba + positions into fixed-MAX arrays', () => {
        const {colors, positions, stopCount} = packStops(
            [{color: '0,0,1,1', position: 1}, {color: '1,0,0,1', position: 0}],
            mockRGBA,
        )
        expect(stopCount).toBe(2)
        expect(colors.length).toBe(MAX_COLOR_STOPS * 4)
        expect(positions.length).toBe(MAX_COLOR_STOPS)
        // sorted: red@0 then blue@1
        expect(colors.slice(0, 4)).toEqual([1, 0, 0, 1])
        expect(colors.slice(4, 8)).toEqual([0, 0, 1, 1])
        expect(positions.slice(0, 2)).toEqual([0, 1])
    })

    it('packStops: inactive → stopCount 0', () => {
        expect(packStops(null, mockRGBA).stopCount).toBe(0)
        expect(packStops([], mockRGBA).stopCount).toBe(0)
    })

    it('packConvertedStops mode 0 is identity on rgb', () => {
        const colors = [0.2, 0.4, 0.6, 1, 0.7, 0.8, 0.9, 1]
        const conv = packConvertedStops(colors, 2, 0)
        expect(conv.slice(0, 3)).toEqual([0.2, 0.4, 0.6])
        expect(conv.slice(3, 6)).toEqual([0.7, 0.8, 0.9])
    })

    it('colorStopsPropConfig: default null; recompiles only on effective-count change', () => {
        const cfg = colorStopsPropConfig()
        expect(cfg.default).toBe(null)
        const when = cfg.compileTimeWhen!
        // null (0) ↔ single stop (0): no recompile
        expect(when(null, [{color: 'a', position: 0}])).toBe(false)
        // null (0) ↔ two stops (2): recompile
        expect(when(null, [{color: 'a', position: 0}, {color: 'b', position: 1}])).toBe(true)
        // 2 ↔ 3: recompile
        expect(when([{color: 'a', position: 0}, {color: 'b', position: 1}], [{color: 'a', position: 0}, {color: 'b', position: 0.5}, {color: 'c', position: 1}])).toBe(true)
    })
})

describe('mixColorStops — builder', () => {
    it('returns null for <= 1 active stop (caller runs legacy two-color path)', () => {
        const acc = {convAt: () => d.vec3f(0, 0, 0), alphaAt: () => 1, positionAt: () => 0}
        expect(mixColorStops(0, 0, 0.5, acc)).toBe(null)
        expect(mixColorStops(1, 0, 0.5, acc)).toBe(null)
    })

    it('CPU golden: two-stop linear gradient midpoint', () => {
        // red@0 → blue@1, mode 0 (linear: convAt is raw P3)
        const colors = [d.vec3f(1, 0, 0), d.vec3f(0, 0, 1)]
        const positions = [0, 1]
        const acc = {convAt: (i: number) => colors[i], alphaAt: () => 1, positionAt: (i: number) => positions[i]}
        const mid = mixColorStops(2, 0, 0.5, acc)!
        expect(mid.x).toBeCloseTo(0.5)
        expect(mid.y).toBeCloseTo(0.0)
        expect(mid.z).toBeCloseTo(0.5)
        expect(mid.w).toBeCloseTo(1.0)
        const start = mixColorStops(2, 0, 0.0, acc)!
        expect(start.x).toBeCloseTo(1.0)
        expect(start.z).toBeCloseTo(0.0)
        const end = mixColorStops(2, 0, 1.0, acc)!
        expect(end.x).toBeCloseTo(0.0)
        expect(end.z).toBeCloseTo(1.0)
    })
})

describe('colorStops — resolve gate (GPU unroll helpers)', () => {
    // A 3-stop unroll done with the exported helper tgpu.fns and a varying t.
    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            // (Manual unroll mirroring mixColorStops' loop; mode 0 → conv is raw P3.)
            const t = std.clamp(input.uv.x, 0.0, 1.0)
            const seg1 = std.clamp((t - 0.0) / std.max(0.5 - 0.0, 1e-6), 0.0, 1.0)
            const seg2 = std.clamp((t - 0.5) / std.max(1.0 - 0.5, 1e-6), 0.0, 1.0)
            const wA1 = 1.0 * (1.0 - seg1)
            const wB1 = 1.0 * seg1
            const c1 = d.vec3f(1, 0, 0).mul(wA1).add(d.vec3f(0, 1, 0).mul(wB1)).div(std.max(wA1 + wB1, 0.001))
            const a1 = wA1 + wB1
            const wA2 = a1 * (1.0 - seg2)
            const wB2 = 1.0 * seg2
            const c2 = c1.mul(wA2).add(d.vec3f(0, 0, 1).mul(wB2)).div(std.max(wA2 + wB2, 0.001))
            return d.vec4f(c2, wA2 + wB2)
        })
        .$name('colorStopsUnrollProbe')

    it('resolves the per-segment unroll to WGSL', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        expect(typeof wgsl).toBe('string')
        expect(wgsl.length).toBeGreaterThan(0)
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
