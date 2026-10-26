import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {
    luma601, luma601Dot, luma709, luma709Dot, pivotContrast, ridged, signedToUnit,
    toneRemap, toneGlowInverted, toneSignedInverted, toneUnitMultiplicative, toneUnitPivotInverted,
} from '@coreroot/gpu/kit/tone'
import {noiseToneKColor} from '@coreroot/gpu/kit/noiseColor'
import {luminance} from '@coreroot/gpu/kit/blend'

/**
 * kit/tone gate — the shared luminance standards and scalar remaps.
 * Two layers, matching kit-geom.test.ts: (1) CPU golden values (these are pure-float DualFns, so
 * they run as plain JS off-GPU); (2) resolve gate — a trivial fragment harness composing all five
 * transpiles to valid WGSL, with the fn names asserted present and the WGSL snapshotted.
 */

describe('tone — CPU golden values', () => {
    it('luma709 uses BT.709 weights', () => {
        expect(luma709(d.vec3f(1, 0, 0))).toBeCloseTo(0.2126)
        expect(luma709(d.vec3f(0, 1, 0))).toBeCloseTo(0.7152)
        expect(luma709(d.vec3f(0, 0, 1))).toBeCloseTo(0.0722)
        expect(luma709(d.vec3f(1, 1, 1))).toBeCloseTo(1.0)
    })

    it('luma601 uses BT.601 weights (deliberately NOT unified with 709 — D-2)', () => {
        expect(luma601(d.vec3f(1, 0, 0))).toBeCloseTo(0.299)
        expect(luma601(d.vec3f(0, 1, 0))).toBeCloseTo(0.587)
        expect(luma601(d.vec3f(0, 0, 1))).toBeCloseTo(0.114)
        expect(luma601(d.vec3f(1, 1, 1))).toBeCloseTo(1.0)
        // The two standards disagree on a saturated green — that difference is the whole reason
        // each shader adopts the helper matching its current weights rather than one of them.
        expect(luma601(d.vec3f(0, 1, 0))).not.toBeCloseTo(luma709(d.vec3f(0, 1, 0)))
    })

    it('luma709 agrees with blend.luminance, its historical alias', () => {
        const c = d.vec3f(0.3, 0.6, 0.9)
        expect(luma709(c)).toBeCloseTo(luminance(c), 10)
    })

    it('pivotContrast: identity at contrast 1, clamped to [0,1]', () => {
        expect(pivotContrast(0.3, 1, 0.5)).toBeCloseTo(0.3)
        // 2× contrast about mid-grey pushes 0.6 to 0.7 and 0.4 to 0.3.
        expect(pivotContrast(0.6, 2, 0.5)).toBeCloseTo(0.7)
        expect(pivotContrast(0.4, 2, 0.5)).toBeCloseTo(0.3)
        // Clamps rather than wrapping.
        expect(pivotContrast(0.9, 4, 0.5)).toBeCloseTo(1.0)
        expect(pivotContrast(0.1, 4, 0.5)).toBeCloseTo(0.0)
        // A pivot away from mid-grey holds that value fixed.
        expect(pivotContrast(0.8, 3, 0.8)).toBeCloseTo(0.8)
    })

    it('signedToUnit maps [-1,1] onto [0,1]', () => {
        expect(signedToUnit(-1)).toBeCloseTo(0)
        expect(signedToUnit(0)).toBeCloseTo(0.5)
        expect(signedToUnit(1)).toBeCloseTo(1)
    })

    it('ridged folds signed zero crossings into peaks', () => {
        expect(ridged(0)).toBeCloseTo(1)
        expect(ridged(0.4)).toBeCloseTo(0.6)
        expect(ridged(-0.4)).toBeCloseTo(0.6)
        expect(ridged(1)).toBeCloseTo(0)
    })
})

describe('tone — dot-spelled luma twins', () => {
    it('agree with the multiply-add spellings to full precision', () => {
        for (const c of [d.vec3f(1, 0, 0), d.vec3f(0.3, 0.6, 0.9), d.vec3f(1, 1, 1)]) {
            expect(luma709Dot(c)).toBeCloseTo(luma709(c), 10)
            expect(luma601Dot(c)).toBeCloseTo(luma601(c), 10)
        }
    })
})

describe('tone — toneRemap variant table', () => {
    it('resolves each supported option record to its variant', () => {
        expect(toneRemap({domain: 'unit', contrastMode: 'additive', invert: true})).toBe(toneUnitPivotInverted)
        expect(toneRemap({domain: 'signed', contrastMode: 'additive', invert: true})).toBe(toneSignedInverted)
        expect(toneRemap({domain: 'unit', contrastMode: 'multiplicative', invert: false})).toBe(toneUnitMultiplicative)
        expect(toneRemap({
            domain: 'unit', contrastMode: 'multiplicative', invert: true,
            glowGamma: true, balance: 'percentCentred',
        })).toBe(toneGlowInverted)
    })

    it('THROWS on an unsupported combination rather than falling back to a wrong-looking one', () => {
        expect(() => toneRemap({domain: 'signed', contrastMode: 'multiplicative', invert: false}))
            .toThrow(/no variant/)
    })

    it('the unit-pivot variant IS noiseColor.noiseToneKColor (same fn object, so no WGSL moved)', () => {
        expect(noiseToneKColor).toBe(toneUnitPivotInverted)
    })

    it('additive contrast has 0 as its identity; multiplicative has 1', () => {
        // Additive + inverted: contrast 0, balance 0 → 1 − v.
        expect(toneUnitPivotInverted(0.3, 0, 0)).toBeCloseTo(0.7, 6)
        expect(toneUnitPivotInverted(0.8, 0, 0)).toBeCloseTo(0.2, 6)
        // Multiplicative, not inverted: contrast 1, balance 0 → v.
        expect(toneUnitMultiplicative(0.3, 1, 0)).toBeCloseTo(0.3, 6)
        expect(toneUnitMultiplicative(0.8, 1, 0)).toBeCloseTo(0.8, 6)
    })

    it('the signed variant squashes [-1,1] to [0,1] and inverts', () => {
        expect(toneSignedInverted(-1, 0, 0)).toBeCloseTo(1, 6)
        expect(toneSignedInverted(0, 0, 0)).toBeCloseTo(0.5, 6)
        expect(toneSignedInverted(1, 0, 0)).toBeCloseTo(0, 6)
    })

    it('the glow variant applies pow(v, 5/glow) first and re-centres a 0–100 balance', () => {
        // glow 5 → exponent 1 (no gamma), contrast 1, balance 50 → identity then inverted.
        expect(toneGlowInverted(0.4, 5, 1, 50)).toBeCloseTo(0.6, 5)
        // A small glow raises the exponent, pulling mid-tones DOWN (so the inverted result rises).
        expect(toneGlowInverted(0.4, 1, 1, 50)).toBeGreaterThan(toneGlowInverted(0.4, 5, 1, 50))
    })

    it('every variant clamps to [0,1] rather than wrapping', () => {
        expect(toneUnitPivotInverted(0.9, 5, 0.5)).toBeCloseTo(0, 6)
        expect(toneUnitMultiplicative(0.9, 8, 0.5)).toBeCloseTo(1, 6)
        expect(toneSignedInverted(0.9, 5, 0.5)).toBeCloseTo(0, 6)
    })
})

describe('resolve gate — tone fns emit valid WGSL', () => {
    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const rgb = d.vec3f(input.uv.x, input.uv.y, 0.5)
            const l709 = luma709(rgb)
            const l601 = luma601(rgb)
            const c = pivotContrast(l709, 1.5, 0.5)
            const u = signedToUnit(l601 * 2.0 - 1.0)
            const r = ridged(u * 2.0 - 1.0)
            return d.vec4f(l709, c, u, r)
        })
        .$name('toneProbe')

    it('resolves and names every fn', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        expect(wgsl).toContain('luma709')
        expect(wgsl).toContain('luma601')
        expect(wgsl).toContain('pivotContrast')
        expect(wgsl).toContain('signedToUnit')
        expect(wgsl).toContain('ridged')
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
