import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {
    bandMask,
    discCoverage,
    footprint1,
    footprint2,
    lineMaskFromField,
    quilezCheckerFilter,
    quilezLineFilterAxis,
    quilezStepFilter,
} from '@coreroot/gpu/kit/aa'

/**
 * kit/aa gate (Phase 6). The analytical filters and the smoothstep mask tails are pure — they take
 * the pixel footprint as an argument — so they get CPU golden values. {@link footprint1} and
 * {@link footprint2} call `dpdx`/`dpdy`, which only exist in a fragment stage, so they are covered by
 * the resolve gate at the bottom instead.
 *
 * The interesting assertions here are the CONVERGENCE ones: an analytical filter's whole reason for
 * existing is that it degrades to the pattern's mean grey as the footprint grows, rather than
 * aliasing. A plain smoothstep cannot do that, so those tests are the ones that would catch someone
 * replacing a filter with a "simpler" ramp.
 */

describe('aa — Quilez step filter (duty-cycle parameterisation)', () => {
    const filt = (p: number, w: number, threshold: number) => quilezStepFilter(p, w, threshold) as unknown as number

    it('is crisp at a tiny footprint — 0 below the threshold, 1 above', () => {
        expect(filt(0.2, 1e-4, 0.5)).toBeCloseTo(0, 3)
        expect(filt(0.8, 1e-4, 0.5)).toBeCloseTo(1, 3)
    })

    it('converges to the pattern mean (1 - threshold) as the footprint covers many periods', () => {
        // This is the property no smoothstep has: at 200 periods per pixel the answer is the duty
        // cycle, so a receding stripe pattern fades to flat grey rather than into moiré.
        expect(filt(0.37, 200, 0.5)).toBeCloseTo(0.5, 2)
        expect(filt(0.37, 200, 0.25)).toBeCloseTo(0.75, 2)
        expect(filt(0.37, 200, 0.9)).toBeCloseTo(0.1, 2)
    })

    it('averages a half-period footprint to roughly the covered fraction', () => {
        // Footprint [0.25, 0.75] against a threshold of 0.5: exactly half of it is above.
        expect(filt(0.5, 0.5, 0.5)).toBeCloseTo(0.5, 5)
    })

    it('stays in [0, 1] and is periodic', () => {
        for (const p of [-3.7, -0.2, 0, 0.5, 1, 4.25]) {
            const v = filt(p, 0.1, 0.5)
            expect(v).toBeGreaterThanOrEqual(0)
            expect(v).toBeLessThanOrEqual(1)
        }
        expect(filt(0.3, 0.1, 0.4)).toBeCloseTo(filt(7.3, 0.1, 0.4), 4)
    })

    it('matches the hand-computed antiderivative integral', () => {
        const golden = (p: number, w: number, t: number): number => {
            const fract = (x: number) => x - Math.floor(x)
            const F = (x: number) => Math.floor(x) * (1 - t) + Math.max(fract(x) - t, 0)
            return Math.min(Math.max((F(p + w * 0.5) - F(p - w * 0.5)) / w, 0), 1)
        }
        for (const c of [
            {p: 0.5, w: 0.05, t: 0.5},
            {p: 3.2, w: 0.1, t: 0.2},
            {p: 1.9, w: 0.5, t: 0.75},
        ]) {
            expect(filt(c.p, c.w, c.t)).toBeCloseTo(golden(c.p, c.w, c.t), 5)
        }
    })
})

describe('aa — Quilez line filter (line-width parameterisation)', () => {
    const filt = (p: number, w: number, N: number) => quilezLineFilterAxis(p, w, N) as unknown as number

    it('matches the hand-computed per-axis line-coverage integral', () => {
        const golden = (px: number, wx: number, N: number): number => {
            const fract = (x: number) => x - Math.floor(x)
            const a = px + wx * 0.5
            const b = px - wx * 0.5
            return (Math.floor(a) + Math.min(fract(a) * N, 1) - Math.floor(b) - Math.min(fract(b) * N, 1)) / (N * wx)
        }
        for (const c of [
            {px: 0.5, wx: 0.05, N: 50},
            {px: 3.2, wx: 0.1, N: 20},
            {px: 1.9, wx: 0.5, N: 5},
        ]) {
            expect(filt(c.px, c.wx, c.N)).toBeCloseTo(golden(c.px, c.wx, c.N), 5)
        }
    })

    it('returns LINE coverage — near 1 inside a line, near 0 in the gap', () => {
        // N = 20 means lines occupy 1/20 of each cell, starting at the cell boundary.
        expect(filt(0.01, 1e-4, 20)).toBeCloseTo(1, 3)
        expect(filt(0.5, 1e-4, 20)).toBeCloseTo(0, 3)
    })

    it('is the exact COMPLEMENT of quilezStepFilter at threshold 1/N', () => {
        // The two parameterisations are one integral seen from opposite sides: this one measures the
        // line, the other measures everything above the duty threshold. Neither should be rewritten in
        // terms of the other (the argument that reads naturally is what makes each prop mapping
        // legible), but the relationship has to hold or one of them has a sign error.
        for (const {p, w, N} of [{p: 0.31, w: 0.02, N: 25}, {p: 2.7, w: 0.08, N: 8}]) {
            expect(filt(p, w, N)).toBeCloseTo(1 - (quilezStepFilter(p, w, 1 / N) as unknown as number), 4)
        }
    })

    it('converges to the line fraction 1/N as the footprint covers many periods', () => {
        expect(filt(0.37, 200, 10)).toBeCloseTo(0.1, 2)
        expect(filt(0.37, 200, 4)).toBeCloseTo(0.25, 2)
    })

    it('is unclamped by design — the caller\'s inclusion-exclusion combine bounds it', () => {
        expect(Number.isFinite(filt(0.5, 1000, 50))).toBe(true)
    })
})

describe('aa — Quilez checkerboard filter', () => {
    const filt = (p: [number, number], w: [number, number]) =>
        quilezCheckerFilter(d.vec2f(p[0], p[1]), d.vec2f(w[0], w[1])) as unknown as number

    it('is crisp at a tiny footprint, and the two parities disagree', () => {
        const a = filt([0.5, 0.5], [1e-4, 1e-4])
        const b = filt([1.5, 0.5], [1e-4, 1e-4])
        expect(Math.abs(a - b)).toBeCloseTo(1, 2)
    })

    it('converges to mid-grey when cells shrink below a pixel', () => {
        // 0.5 is the CORRECT answer, not a failure — it is what a checkerboard averages to, and it is
        // why a receding checkerboard plane fades to flat grey.
        expect(filt([3.3, 1.1], [4, 4])).toBeCloseTo(0.5, 1)
        expect(filt([0.7, 9.2], [64, 64])).toBeCloseTo(0.5, 2)
    })

    it('stays in [0, 1] across a sweep of footprints', () => {
        for (const w of [1e-4, 0.1, 1, 4, 32]) {
            for (const p of [[0.1, 0.1], [1.7, 3.3], [-2.2, 0.9]] as [number, number][]) {
                const v = filt(p, [w, w])
                expect(v).toBeGreaterThanOrEqual(0)
                expect(v).toBeLessThanOrEqual(1)
            }
        }
    })
})

describe('aa — line mask from a distance field', () => {
    const mask = (field: number, lineWidth: number, lo: number, hi: number) =>
        lineMaskFromField(field, lineWidth, lo, hi) as unknown as number

    it('is a FALLING ramp — 1 on the field zero set, 0 far from it', () => {
        expect(mask(0, 0.05, 0.04, 0.06)).toBeCloseTo(1)
        expect(mask(0.5, 0.05, 0.04, 0.06)).toBeCloseTo(0)
    })

    it('kills the mask entirely at lineWidth 0', () => {
        // Without the step() factor a "thickness 0" pattern still draws hairlines wherever its field
        // is exactly zero, because the band collapses onto the zero set rather than vanishing.
        expect(mask(0, 0, 0, 0.01)).toBe(0)
        expect(mask(0, 1e-5, 0, 0.01)).toBe(0)
        expect(mask(0, 1e-3, 0, 0.01)).toBeGreaterThan(0)
    })

    it('equals the inverted smoothstep it replaces', () => {
        const smoothstep = (e0: number, e1: number, x: number) => {
            const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
            return t * t * (3 - 2 * t)
        }
        for (const field of [0, 0.02, 0.05, 0.09, 0.2]) {
            expect(mask(field, 0.05, 0.03, 0.07)).toBeCloseTo(1 - smoothstep(0.03, 0.07, field), 5)
        }
    })
})

describe('aa — band mask', () => {
    const mask = (x: number, lo: number, hi: number) => bandMask(x, lo, hi) as unknown as number

    it('is 1 mid-cell and 0 at both edges', () => {
        expect(mask(0.5, 0.1, 0.15)).toBeCloseTo(1)
        expect(mask(0.05, 0.1, 0.15)).toBeCloseTo(0)
        expect(mask(0.95, 0.1, 0.15)).toBeCloseTo(0)
    })

    it('is symmetric about the cell centre', () => {
        for (const x of [0.2, 0.35, 0.48]) {
            expect(mask(x, 0.1, 0.2)).toBeCloseTo(mask(1 - x, 0.1, 0.2), 6)
        }
    })

    it('closes entirely once the gap reaches half the cell', () => {
        expect(mask(0.5, 0.5, 0.5001)).toBeLessThan(0.3)
    })
})

describe('aa — disc coverage', () => {
    const cov = (dist: number, radius: number, footprint: number) =>
        discCoverage(dist, radius, footprint) as unknown as number

    it('is 1 at the centre and 0 outside the radius', () => {
        expect(cov(0, 0.3, 0.01)).toBeCloseTo(1)
        expect(cov(0.5, 0.3, 0.01)).toBeCloseTo(0)
    })

    it('feathers INSIDE the radius, so the silhouette does not inflate as it softens', () => {
        // Coverage must reach 0 exactly AT the radius, whatever the footprint — that is what keeps a
        // softened disc the same size as a crisp one.
        for (const fp of [0.01, 0.1, 0.4]) {
            expect(cov(0.3, 0.3, fp)).toBeCloseTo(0, 6)
        }
        // The falling ramp occupies [radius - footprint/2, radius]: still fully opaque at its start,
        // already fading just past it.
        expect(cov(0.3 - 0.05, 0.3, 0.1)).toBeCloseTo(1, 6)
        expect(cov(0.3 - 0.04, 0.3, 0.1)).toBeLessThan(1)
        expect(cov(0.3 - 0.04, 0.3, 0.1)).toBeGreaterThan(0)
    })

    it('is monotonically falling in distance', () => {
        let prev = 2
        for (const dist of [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]) {
            const v = cov(dist, 0.3, 0.2)
            expect(v).toBeLessThanOrEqual(prev)
            prev = v
        }
    })
})

describe('resolve gate — aa fns emit valid WGSL (incl. the derivative-taking footprints)', () => {
    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const p = input.uv.mul(10.0)
            // The footprint fns take derivatives of a VALUE passed across the fn boundary; each quad
            // lane carries its own, so this is the same result as taking them at the call site.
            const w1 = footprint1(p.x, 0.1)
            const w2 = footprint2(p, 0.1)
            const stripe = quilezStepFilter(p.x, w1, 0.5)
            const line = quilezLineFilterAxis(p.x, w1, 20.0)
            const checker = quilezCheckerFilter(p, w2)
            const lineMask = lineMaskFromField(p.y, 0.05, 0.04, 0.06)
            const band = bandMask(p.x, 0.1, 0.2)
            const disc = discCoverage(p.y, 0.3, w1)
            return d.vec4f(stripe + line, checker + lineMask, band + disc, w2.x)
        })
        .$name('aaProbe')

    it('resolves and names every fn', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        for (const name of [
            'footprint1',
            'footprint2',
            'quilezStepFilter',
            'quilezLineFilterAxis',
            'quilezCheckerFilter',
            'lineMaskFromField',
            'bandMask',
            'discCoverage',
        ]) {
            expect(wgsl).toContain(name)
        }
    })

    it('takes derivatives inside the footprint fns, not at the call site', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        expect(wgsl).toMatch(/fn footprint1\(x: f32, softness: f32\)[^}]*dpdx\(x\)/)
        expect(wgsl).toMatch(/fn footprint2\(p: vec2f, softness: f32\)[^}]*dpdx\(p\)/)
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
