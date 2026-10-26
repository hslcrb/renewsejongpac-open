import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import * as tm from '@coreroot/gpu/kit/tonemap'

/**
 * Golden-value + resolve gates for kit/tonemap. References are f64 transcriptions of the source
 * formulas (three ToneMappingFunctions.js / ColorSpaceFunctions.js, renderer.ts hable/unreal),
 * exposure baked at 1.0. ACES uses the famous canonical matrix ROWS as an authoritative
 * independent check on the kit's column-major d.mat3x3f construction.
 */

type Vec3 = [number, number, number]
const near = (actual: d.v3f, expected: Vec3, eps: number) => {
    const a = [...actual]
    for (let i = 0; i < 3; i++) expect(Math.abs(a[i] - expected[i])).toBeLessThan(eps)
}
const perComp = (c: Vec3, f: (x: number) => number): Vec3 => [f(c[0]), f(c[1]), f(c[2])]
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)
const dot3 = (r: Vec3, v: Vec3) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]
const matRows = (rows: [Vec3, Vec3, Vec3], v: Vec3): Vec3 => [dot3(rows[0], v), dot3(rows[1], v), dot3(rows[2], v)]
const matCols = (cols: [Vec3, Vec3, Vec3], v: Vec3): Vec3 => [
    cols[0][0] * v[0] + cols[1][0] * v[1] + cols[2][0] * v[2],
    cols[0][1] * v[0] + cols[1][1] * v[1] + cols[2][1] * v[2],
    cols[0][2] * v[0] + cols[1][2] * v[1] + cols[2][2] * v[2],
]

const SAMPLES: Vec3[] = [[0, 0, 0], [0.18, 0.18, 0.18], [0.5, 0.3, 0.7], [1, 1, 1]]

describe('tonemap — linear (NoToneMapping passthrough)', () => {
    it('returns color unchanged (no clamp)', () => {
        near(tm.linear(d.vec3f(0.2, 1.5, -0.1)), [0.2, 1.5, -0.1], 1e-6)
    })
})

describe('tonemap — reinhard', () => {
    const ref = (c: Vec3) => perComp(c, (x) => clamp01(x / (x + 1)))
    it('matches x/(x+1) clamped', () => {
        for (const c of SAMPLES) near(tm.reinhard(d.vec3f(...c)), ref(c), 1e-6)
    })
})

describe('tonemap — cineon', () => {
    const ref = (c: Vec3) => perComp(c, (x) => {
        const v = Math.max(x - 0.004, 0)
        const a = v * (6.2 * v + 0.5)
        const b = v * (6.2 * v + 1.7) + 0.06
        return Math.pow(a / b, 2.2)
    })
    it('matches optimized Hejl–Burgess-Dawson', () => {
        for (const c of SAMPLES) near(tm.cineon(d.vec3f(...c)), ref(c), 1e-5)
    })
})

describe('tonemap — aces (canonical matrix rows, authoritative)', () => {
    const IN: [Vec3, Vec3, Vec3] = [[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]]
    const OUT: [Vec3, Vec3, Vec3] = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]]
    const rrt = (v: Vec3): Vec3 => perComp(v, (x) => {
        const a = x * (x + 0.0245786) - 0.000090537
        const b = x * ((x + 0.4329510) * 0.983729) + 0.238081
        return a / b
    })
    const ref = (c: Vec3): Vec3 => {
        let v = perComp(c, (x) => x / 0.6)
        v = matRows(IN, v)
        v = rrt(v)
        v = matRows(OUT, v)
        return perComp(v, clamp01)
    }
    it('matches canonical ACES pipeline', () => {
        for (const c of SAMPLES) near(tm.aces(d.vec3f(...c)), ref(c), 1e-4)
    })
})

describe('tonemap — agx (Filament, column-consistent pipeline)', () => {
    const SRGB_TO_REC2020: [Vec3, Vec3, Vec3] = [[0.6274, 0.0691, 0.0164], [0.3293, 0.9195, 0.0880], [0.0433, 0.0113, 0.8956]]
    const REC2020_TO_SRGB: [Vec3, Vec3, Vec3] = [[1.6605, -0.1246, -0.0182], [-0.5876, 1.1329, -0.1006], [-0.0728, -0.0083, 1.1187]]
    const INSET: [Vec3, Vec3, Vec3] = [
        [0.856627153315983, 0.137318972929847, 0.11189821299995],
        [0.0951212405381588, 0.761241990602591, 0.0767994186031903],
        [0.0482516061458583, 0.101439036467562, 0.811302368396859],
    ]
    const OUTSET: [Vec3, Vec3, Vec3] = [
        [1.1271005818144368, -0.1413297634984383, -0.14132976349843826],
        [-0.11060664309660323, 1.157823702216272, -0.11060664309660294],
        [-0.016493938717834573, -0.016493938717834257, 1.2519364065950405],
    ]
    const MIN_EV = -12.47393
    const MAX_EV = 4.026069
    const contrast = (x: Vec3): Vec3 => perComp(x, (v) => {
        const x2 = v * v
        const x4 = x2 * x2
        return 15.5 * x4 * x2 - 40.14 * x4 * v + 31.96 * x4 - 6.868 * x2 * v + 0.4298 * x2 + 0.1191 * v - 0.00232
    })
    const ref = (c: Vec3): Vec3 => {
        let v = matCols(SRGB_TO_REC2020, c)
        v = matCols(INSET, v)
        v = perComp(v, (x) => Math.max(x, 1e-10))
        v = perComp(v, (x) => Math.log2(x))
        v = perComp(v, (x) => (x - MIN_EV) / (MAX_EV - MIN_EV))
        v = perComp(v, clamp01)
        v = contrast(v)
        v = matCols(OUTSET, v)
        v = perComp(v, (x) => Math.pow(Math.max(x, 0), 2.2))
        v = matCols(REC2020_TO_SRGB, v)
        return perComp(v, clamp01)
    }
    it('matches AgX pipeline', () => {
        for (const c of [[0.18, 0.18, 0.18], [0.5, 0.3, 0.7], [1, 1, 1]] as Vec3[]) {
            near(tm.agx(d.vec3f(...c)), ref(c), 1e-4)
        }
    })
    it('maps black to ~0 and stays in [0,1]', () => {
        const out = [...tm.agx(d.vec3f(0, 0, 0))]
        for (const v of out) expect(v).toBeGreaterThanOrEqual(-1e-6)
        for (const v of out) expect(v).toBeLessThanOrEqual(1 + 1e-6)
    })
})

describe('tonemap — neutral (Khronos PBR)', () => {
    const ref = (c: Vec3): Vec3 => {
        const SC = 0.8 - 0.04
        const DE = 0.15
        const x = Math.min(c[0], Math.min(c[1], c[2]))
        const offset = x < 0.08 ? x - 6.25 * x * x : 0.04
        let col: Vec3 = [c[0] - offset, c[1] - offset, c[2] - offset]
        const peak = Math.max(col[0], Math.max(col[1], col[2]))
        if (peak < SC) return col
        const dd = 1 - SC
        const newPeak = 1 - (dd * dd) / (peak + dd - SC)
        col = [col[0] * (newPeak / peak), col[1] * (newPeak / peak), col[2] * (newPeak / peak)]
        const g = 1 - 1 / (DE * (peak - newPeak) + 1)
        return [col[0] + (newPeak - col[0]) * g, col[1] + (newPeak - col[1]) * g, col[2] + (newPeak - col[2]) * g]
    }
    it('matches (low no-compression, x<0.08 branch, and high compression)', () => {
        for (const c of [[0.3, 0.5, 0.7], [0.05, 0.06, 0.07], [0.5, 0.8, 1.2]] as Vec3[]) {
            near(tm.neutral(d.vec3f(...c)), ref(c), 1e-5)
        }
    })
})

describe('tonemap — hable / unreal', () => {
    const hableRef = (c: Vec3) => perComp(c, (v) => {
        const x = v * 16
        const num = x * (x * 0.15 + 0.05) + 0.004
        const den = x * (x * 0.15 + 0.5) + 0.06
        return num / den - 0.02 / 0.3
    })
    const unrealRef = (c: Vec3) => perComp(c, (v) => (v / (v + 0.155)) * 1.019)
    it('hable matches Uncharted2 curve', () => {
        for (const c of SAMPLES) near(tm.hable(d.vec3f(...c)), hableRef(c), 1e-5)
    })
    it('unreal matches x/(x+0.155)·1.019', () => {
        for (const c of SAMPLES) near(tm.unreal(d.vec3f(...c)), unrealRef(c), 1e-6)
    })
})

describe('tonemap — linearToSrgb (sRGB OETF)', () => {
    const ref = (c: Vec3) => perComp(c, (x) => (x <= 0.0031308 ? x * 12.92 : Math.pow(x, 0.41666) * 1.055 - 0.055))
    it('matches sRGBTransferOETF (both branches)', () => {
        for (const c of [[0.0, 0.001, 0.5], [0.0031308, 0.2, 1.0]] as Vec3[]) {
            near(tm.linearToSrgb(d.vec3f(...c)), ref(c), 1e-5)
        }
    })
})

describe('tonemap — tonemapFns record + resolve gate', () => {
    it('exposes all 8 modes', () => {
        expect(Object.keys(tm.tonemapFns).sort()).toEqual(
            ['aces', 'agx', 'cineon', 'hable', 'linear', 'neutral', 'reinhard', 'unreal'],
        )
    })
    it('all curves + OETF resolve to WGSL (snapshot)', () => {
        const wgsl = tgpu.resolve(
            [tm.linear, tm.reinhard, tm.cineon, tm.aces, tm.agx, tm.neutral, tm.hable, tm.unreal, tm.linearToSrgb],
            {names: 'strict'},
        )
        expect(wgsl).toMatch(/fn/)
        expect(wgsl).toMatchSnapshot()
    })
})
