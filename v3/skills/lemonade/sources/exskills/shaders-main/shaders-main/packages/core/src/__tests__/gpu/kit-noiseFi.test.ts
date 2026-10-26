import {describe, it, expect} from 'vitest'
import {tgpu, d, noise, noiseColor} from '@coreroot/gpu/kit'

/**
 * Kit noise coverage (D1-C) — the @lumiey Fi-hash family added to kit/noise.ts + the shared
 * noiseColor builders. Two gates:
 *   1. RESOLVE — every ported fn transpiles to valid WGSL (the ONLY correctness gate for the Fi
 *      hashes: they bit-cast floats to u32 via a raw-WGSL `bitcast<u32>` helper, so they have no
 *      CPU DualFn and are never CPU-golden-tested — the all-porter u32-hash rule §3.2/§5.1).
 *   2. CPU GOLDEN — the pure-float members (perm4, value13) and the color tone math
 *      (noiseToneKColor) run as DualFns, checked against hand / independently-transcribed refs.
 */

// ── (1) Resolve gate — wrap each fn in an entry so tgpu.resolve has a root ────────────────────
describe('kit Fi-noise — resolve gate (all fns transpile to WGSL)', () => {
    const entries = {
        hash11: tgpu.fn([d.f32], d.f32)((x) => { 'use gpu'; return noise.hash11(x) }),
        hash12: tgpu.fn([d.vec2f], d.f32)((p) => { 'use gpu'; return noise.hash12(p) }),
        hash22: tgpu.fn([d.vec2f], d.vec2f)((p) => { 'use gpu'; return noise.hash22(p) }),
        hash32: tgpu.fn([d.vec2f], d.vec3f)((p) => { 'use gpu'; return noise.hash32(p) }),
        hash13: tgpu.fn([d.vec3f], d.f32)((p) => { 'use gpu'; return noise.hash13(p) }),
        hash33: tgpu.fn([d.vec3f], d.vec3f)((p) => { 'use gpu'; return noise.hash33(p) }),
        value12: tgpu.fn([d.vec2f], d.f32)((p) => { 'use gpu'; return noise.value12(p) }),
        value13: tgpu.fn([d.vec3f], d.f32)((p) => { 'use gpu'; return noise.value13(p) }),
        perlin12: tgpu.fn([d.vec2f], d.f32)((p) => { 'use gpu'; return noise.perlin12(p) }),
        perlin12d: tgpu.fn([d.vec2f], d.vec3f)((p) => { 'use gpu'; return noise.perlin12d(p) }),
        perlin13: tgpu.fn([d.vec3f], d.f32)((p) => { 'use gpu'; return noise.perlin13(p) }),
        gabor12: tgpu.fn([d.vec2f, d.f32, d.f32], d.f32)((p, f, ph) => { 'use gpu'; return noise.gabor12(p, f, ph) }),
        curl22: tgpu.fn([d.vec2f], d.vec2f)((p) => { 'use gpu'; return noise.curl22(p) }),
        curl22z: tgpu.fn([d.vec2f, d.f32], d.vec2f)((p, z) => { 'use gpu'; return noise.curl22z(p, z) }),
        wavelet12: tgpu.fn([d.vec2f, d.f32, d.f32], d.f32)((p, ph, s) => { 'use gpu'; return noise.wavelet12(p, ph, s) }),
        blue12: tgpu.fn([d.vec2f], d.f32)((p) => { 'use gpu'; return noise.blue12(p) }),
        hilbertBlue12: tgpu.fn([d.vec2f], d.f32)((p) => { 'use gpu'; return noise.hilbertBlue12(p) }),
        scratches12: tgpu.fn([d.vec2f, d.f32, d.f32], d.f32)((u, t, th) => { 'use gpu'; return noise.scratches12(u, t, th) }),
        stone12: tgpu.fn([d.vec2f], d.f32)((p) => { 'use gpu'; return noise.stone12(p) }),
        wool12: tgpu.fn([d.vec2f], d.f32)((p) => { 'use gpu'; return noise.wool12(p) }),
        erosion12: tgpu.fn([d.vec2f], d.vec3f)((p) => { 'use gpu'; return noise.erosion12(p) }),
        paper12: tgpu.fn([d.vec2f, d.i32], d.f32)((p, o) => { 'use gpu'; return noise.paper12(p, o) }),
        perm4: tgpu.fn([d.vec4f], d.vec4f)((x) => { 'use gpu'; return noise.perm4(x) }),
    }
    for (const [name, fn] of Object.entries(entries)) {
        it(`${name} resolves`, () => {
            expect(tgpu.resolve([fn], {names: 'strict'}).length).toBeGreaterThan(0)
        })
    }
})

// ── (2a) perm4 golden — the Quilez permutation, hand-computed ─────────────────────────────────
describe('kit Fi-noise — perm4 golden', () => {
    it('perm4([0,1,0,1]) = [0,35,0,35]', () => {
        // xx = x*(x*34+1); return xx - floor(xx/289)*289. x=0→0; x=1→35 (35<289 → 35).
        const p = noise.perm4(d.vec4f(0, 1, 0, 1)) as unknown as {x: number; y: number; z: number; w: number}
        expect(p.x).toBeCloseTo(0, 4)
        expect(p.y).toBeCloseTo(35, 4)
        expect(p.z).toBeCloseTo(0, 4)
        expect(p.w).toBeCloseTo(35, 4)
    })
})

// ── (2b) value13 golden — independent JS transcription of the v1 formula ──────────────────────
describe('kit Fi-noise — value13 golden (vs independent JS reference)', () => {
    // Plain-JS transcription of utilities/noiseFunctions.ts value13 (no typegpu); a match validates
    // the TGSL port's math (catches wrong-op / `d`-namespace-clash transcription bugs).
    const perm = (x: number[]): number[] => x.map((v) => {
        const xx = v * (v * 34 + 1)
        return xx - Math.floor(xx / 289) * 289
    })
    const mix = (a: number, b: number, t: number) => a + (b - a) * t
    const ref = (px: number, py: number, pz: number): number => {
        const a = [Math.floor(px), Math.floor(py), Math.floor(pz)]
        const d0 = [px - a[0], py - a[1], pz - a[2]]
        const sd = d0.map((v) => v * v * (3 - v * 2))
        const b = [a[0], a[0], a[1], a[1]].map((v, i) => v + [0, 1, 0, 1][i])
        const k1 = perm([b[0], b[1], b[0], b[1]])
        const k2 = perm([k1[0] + b[2], k1[1] + b[2], k1[0] + b[3], k1[1] + b[3]]).map((v) => v + a[2])
        const k3 = perm(k2)
        const k4 = perm(k2.map((v) => v + 1))
        const o1 = k3.map((v) => (v * 0.02439024) - Math.floor(v * 0.02439024))
        const o2 = k4.map((v) => (v * 0.02439024) - Math.floor(v * 0.02439024))
        const o3 = o1.map((v, i) => mix(v, o2[i], sd[2]))
        // o4 = mix(vec2(o3.x, o3.z), vec2(o3.y, o3.w), d.x) → (mix(o3.x,o3.y), mix(o3.z,o3.w))
        const o4x = mix(o3[0], o3[1], sd[0])
        const o4y = mix(o3[2], o3[3], sd[0])
        return mix(o4x, o4y, sd[1])
    }

    const cases: [number, number, number][] = [[0.3, 0.7, 0.1], [1.2, 4.8, 2.3], [10.1, 0.05, 5.5]]
    it('value13 matches the reference (and stays in [0,1])', () => {
        for (const [x, y, z] of cases) {
            const out = noise.value13(d.vec3f(x, y, z)) as unknown as number
            expect(out).toBeCloseTo(ref(x, y, z), 3)
            expect(out).toBeGreaterThanOrEqual(0)
            expect(out).toBeLessThanOrEqual(1)
        }
    })
})

// ── (2c) noiseToneKColor golden — the color tone math (hand-computed) ────────────────────────
describe('kit noiseColor — noiseToneKColor golden', () => {
    // kColor = 1 - clamp((n-0.5)*(contrast+1) + 0.5 + balance, 0, 1)
    const golden = (n: number, c: number, b: number) => 1 - Math.min(Math.max((n - 0.5) * (c + 1) + 0.5 + b, 0), 1)
    const cases: [number, number, number][] = [
        [0.5, 0, 0], [1, 0, 0], [0, 0, 0], [0.75, 1, 0], [0.5, 0, 0.2], [0.3, 2, -0.1],
    ]
    it('matches clamp((n-0.5)(c+1)+0.5+b).oneMinus()', () => {
        for (const [n, c, b] of cases) {
            const out = noiseColor.noiseToneKColor(n, c, b) as unknown as number
            expect(out).toBeCloseTo(golden(n, c, b), 5)
        }
    })
})
