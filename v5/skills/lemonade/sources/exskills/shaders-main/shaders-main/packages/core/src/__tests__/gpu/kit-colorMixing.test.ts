import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import * as cm from '@coreroot/gpu/kit/colorMixing'

/**
 * Golden-value + round-trip + resolve gates for kit/colorMixing (the highest-precision-
 * sensitivity kit module). TGSL fns execute on CPU as plain JS (DualFn) at f32 precision, so
 * assertions use tolerances. References are derived from the original colorMixing.ts formulas.
 */

const near = (actual: d.v3f | d.v4f, expected: number[], eps: number) => {
    const a = [...actual]
    expect(a.length).toBe(expected.length)
    for (let i = 0; i < expected.length; i++) {
        expect(Math.abs(a[i] - expected[i])).toBeLessThan(eps)
    }
}

// Sample colors in P3-linear (the space transformColor produces)
const GRAY = () => d.vec3f(0.5, 0.5, 0.5)
const WARM = () => d.vec3f(0.7, 0.3, 0.15)
const COOL = () => d.vec3f(0.12, 0.4, 0.75)
const WHITE = () => d.vec3f(1, 1, 1)
const BLACK = () => d.vec3f(0, 0, 0)

describe('colorMixing — P3 ↔ sRGB round-trip', () => {
    it('sRGBToP3(p3ToSRGB(c)) ≈ c', () => {
        for (const c of [GRAY(), WARM(), COOL(), WHITE()]) {
            near(cm.sRGBToP3(cm.p3ToSRGB(c)), [...c], 1e-4)
        }
    })
    it('p3ToSRGB(white) stays white (rows sum ~1)', () => {
        near(cm.p3ToSRGB(WHITE()), [1, 1, 1], 1e-3)
    })
})

describe('colorMixing — OKLab / OKLCh', () => {
    it('rgbToOklab(white) ≈ (1, 0, 0)', () => {
        near(cm.rgbToOklab(WHITE()), [1, 0, 0], 1e-4)
    })
    it('rgbToOklab(black) ≈ (0, 0, 0)', () => {
        near(cm.rgbToOklab(BLACK()), [0, 0, 0], 1e-6)
    })
    it('oklabToRgb(rgbToOklab(c)) ≈ c', () => {
        for (const c of [GRAY(), WARM(), COOL()]) {
            near(cm.oklabToRgb(cm.rgbToOklab(c)), [...c], 1e-4)
        }
    })
    it('oklchToOklab(oklabToOklch(lab)) ≈ lab', () => {
        const lab = cm.rgbToOklab(WARM())
        near(cm.oklchToOklab(cm.oklabToOklch(lab)), [...lab], 1e-4)
    })
})

describe('colorMixing — HSL / HSV / Lab / LCh round-trips', () => {
    it('hslToRgb(rgbToHsl(c)) ≈ c', () => {
        for (const c of [GRAY(), WARM(), COOL()]) {
            near(cm.hslToRgb(cm.rgbToHsl(c)), [...c], 1e-4)
        }
    })
    it('hsvToRgb(rgbToHsv(c)) ≈ c', () => {
        for (const c of [GRAY(), WARM(), COOL()]) {
            near(cm.hsvToRgb(cm.rgbToHsv(c)), [...c], 1e-4)
        }
    })
    it('labToRgb(rgbToLab(c)) ≈ c', () => {
        for (const c of [GRAY(), WARM(), COOL()]) {
            near(cm.labToRgb(cm.rgbToLab(c)), [...c], 1e-4)
        }
    })
    it('lchToLab(labToLch(lab)) ≈ lab', () => {
        const lab = cm.rgbToLab(COOL())
        near(cm.lchToLab(cm.labToLch(lab)), [...lab], 1e-3)
    })
})

describe('colorMixing — mixColors alpha-weighted blending', () => {
    const A = () => d.vec4f(0.2, 0.4, 0.6, 1.0)
    const B = () => d.vec4f(0.8, 0.6, 0.4, 0.5)

    it('linear mix at t=0.5 matches hand-computed weighted average', () => {
        // weightA = 1·0.5 = 0.5, weightB = 0.5·0.5 = 0.25, total = 0.75
        // rgb = (A·0.5 + B·0.25)/0.75, alpha = 0.75
        near(cm.mixColors(A(), B(), 0.5, 0), [0.4, 0.4666667, 0.5333333, 0.75], 1e-5)
    })
    it('linear mix at t=0 returns colorA, at t=1 returns colorB', () => {
        near(cm.mixColors(A(), B(), 0, 0), [0.2, 0.4, 0.6, 1.0], 1e-5)
        near(cm.mixColors(A(), B(), 1, 0), [0.8, 0.6, 0.4, 0.5], 1e-5)
    })
    it('mixing a color with itself is identity in every space (t=0.35)', () => {
        const c = d.vec4f(0.55, 0.3, 0.7, 1.0)
        for (const mode of [0, 1, 2, 3, 4, 5]) {
            near(cm.mixColors(c, c, 0.35, mode), [0.55, 0.3, 0.7, 1.0], 2e-3)
        }
    })
    it('both endpoints transparent → safeWeight guard keeps output finite (alpha 0)', () => {
        const ta = d.vec4f(0.5, 0.5, 0.5, 0)
        const tb = d.vec4f(0.2, 0.2, 0.2, 0)
        const out = [...cm.mixColors(ta, tb, 0.5, 0)]
        expect(out.every((v) => Number.isFinite(v))).toBe(true)
        expect(out[3]).toBeCloseTo(0, 6)
    })
})

describe('colorMixing — CPU mirror agrees with GPU forward conversion', () => {
    it('convertP3ToMixSpaceCPU ≈ convertP3ToMixSpace for OKLCh/OKLAB/HSL/HSV/LCH', () => {
        const c = COOL()
        for (const mode of [1, 2, 3, 4, 5]) {
            const cpu = cm.convertP3ToMixSpaceCPU(c.x, c.y, c.z, mode)
            const gpu = cm.convertP3ToMixSpace(c, mode)
            near(gpu, cpu, 1e-3)
        }
    })
})

describe('colorMixing — resolve gate', () => {
    it('all conversions + a mix variant resolve to WGSL (snapshot)', () => {
        const wgsl = tgpu.resolve(
            [
                cm.p3ToSRGB, cm.sRGBToP3,
                cm.rgbToOklab, cm.oklabToRgb, cm.oklabToOklch, cm.oklchToOklab,
                cm.selectRGBBySector, cm.rgbToHsl, cm.hslToRgb, cm.rgbToHsv, cm.hsvToRgb,
                cm.rgbToLab, cm.labToRgb, cm.labToLch, cm.lchToLab,
                cm.mixColorsLinear, cm.mixColorsOklch,
            ],
            {names: 'strict'},
        )
        expect(typeof wgsl).toBe('string')
        expect(wgsl).toMatch(/fn/)
        expect(wgsl).toMatchSnapshot()
    })
})
