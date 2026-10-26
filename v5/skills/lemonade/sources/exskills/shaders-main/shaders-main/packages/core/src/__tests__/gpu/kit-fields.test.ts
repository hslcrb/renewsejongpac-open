import {describe, it, expect} from 'vitest'
import {tgpu, d, std} from '@coreroot/gpu/kit'
import * as fields from '@coreroot/gpu/kit/fields'

/**
 * kit/fields gate — the noise domain framings and the two higher-order builders.
 *
 * Three layers (C8): (1) CPU golden values, since the framings are pure float DualFns; (2) a resolve
 * gate proving the builders emit valid WGSL and that the field function they capture is actually
 * called; (3) the COLLISION test C3 demands — two differently-configured instances of each builder
 * composed into ONE tree must not share a WGSL identifier.
 */

describe('fields — domain framings (CPU goldens)', () => {
    it('aspectScaledDomain scales x by the aspect, then both axes by exp(scale), then offsets', () => {
        const out = fields.aspectScaledDomain(d.vec2f(0.5, 0.25), d.vec2f(200, 100), 0, 0) as d.v2f
        // aspect 2 → x 1.0, y 0.25; exp(0) = 1; seed 0.
        expect(out.x).toBeCloseTo(1.0, 5)
        expect(out.y).toBeCloseTo(0.25, 5)

        const scaled = fields.aspectScaledDomain(d.vec2f(0.5, 0.5), d.vec2f(100, 100), 1, 3) as d.v2f
        expect(scaled.x).toBeCloseTo(0.5 * Math.E + 3, 4)
        expect(scaled.y).toBeCloseTo(0.5 * Math.E + 3, 4)
    })

    it('aspectScaledDomain guards the aspect divide (a zero-height viewport is finite, not NaN)', () => {
        const out = fields.aspectScaledDomain(d.vec2f(0.5, 0.5), d.vec2f(800, 0), 0, 0) as d.v2f
        expect(Number.isFinite(out.x)).toBe(true)
        expect(Number.isNaN(out.x)).toBe(false)
    })

    it('pixelGridDomain floors the device-pixel position into grain-sized cells', () => {
        // uv 0.5 of a 800px axis = pixel 400; grain 8 → cell 50.
        const out = fields.pixelGridDomain(d.vec2f(0.5, 0.5), d.vec2f(800, 400), 8, 0) as d.v2f
        expect(out.x).toBeCloseTo(50, 5)
        expect(out.y).toBeCloseTo(25, 5)
        // Piecewise-constant within a cell: two nearby uvs in the same cell agree.
        const a = fields.pixelGridDomain(d.vec2f(0.5000, 0.5), d.vec2f(800, 400), 8, 0) as d.v2f
        const b = fields.pixelGridDomain(d.vec2f(0.5002, 0.5), d.vec2f(800, 400), 8, 0) as d.v2f
        expect(a.x).toBe(b.x)
    })

    it('timeAxisDomain lifts a 2D position into 3D on the time axis', () => {
        const out = fields.timeAxisDomain(d.vec2f(1, 2), 10, 0.3) as d.v3f
        expect(out.x).toBeCloseTo(1)
        expect(out.y).toBeCloseTo(2)
        expect(out.z).toBeCloseTo(3)
    })
})

// A trivial field function standing in for a noise fn — pure, so the whole composition stays
// CPU-executable and the emitted WGSL stays readable.
const probeField2 = tgpu.fn([d.vec2f], d.f32)((p) => {
    'use gpu'
    return std.sin(p.x) * std.cos(p.y)
})

const probeFieldParametric = tgpu.fn([d.vec2f, d.f32, d.f32, d.f32, d.f32, d.f32], d.f32)(
    (p, animT, seedOff, a, b, c) => {
        'use gpu'
        return std.sin(p.x + animT) + seedOff * 0.01 + a + b + c
    })

const probeField3 = tgpu.fn([d.vec3f], d.f32)((p) => {
    'use gpu'
    return std.sin(p.x) * std.cos(p.y) * p.z
})

describe('fields — fbmGated builder', () => {
    it('memoizes per option key', () => {
        const a = fields.fbmGated(probeField2, {maxOctaves: 4, drift: 'goldenAngle', name: 'memoProbe'})
        const b = fields.fbmGated(probeField2, {maxOctaves: 4, drift: 'goldenAngle', name: 'memoProbe'})
        const c = fields.fbmGated(probeField2, {maxOctaves: 8, drift: 'goldenAngle', name: 'memoProbe'})
        expect(a).toBe(b)
        expect(a).not.toBe(c)
    })

    it('sums the gated octaves and returns (accumulated, totalWeight)', () => {
        const sum = fields.fbmGated(probeField2, {maxOctaves: 4, drift: 'goldenAngle', name: 'goldenProbe'})
        const out = sum(d.vec2f(0.3, 0.7), 2, 2, 0.5, 0, d.vec2f(0, 0), 4) as d.v2f
        // 4 active octaves at persistence 0.5 → weights 1 + 0.5 + 0.25 + 0.125.
        expect(out.y).toBeCloseTo(1.875, 5)
        // One active octave weighs exactly 1 and its accumulation is the field at the base frequency.
        const one = sum(d.vec2f(0.3, 0.7), 2, 2, 0.5, 0, d.vec2f(0, 0), 1) as d.v2f
        expect(one.y).toBeCloseTo(1, 5)
        expect(one.x).toBeCloseTo(Math.sin(0.3 * 2) * Math.cos(0.7 * 2), 4)
    })

    it('octaves at or beyond octaveCount contribute exactly zero', () => {
        const sum = fields.fbmGated(probeField2, {maxOctaves: 4, drift: 'goldenAngle', name: 'gateProbe'})
        const two = sum(d.vec2f(0.3, 0.7), 2, 2, 0.5, 0, d.vec2f(0, 0), 2) as d.v2f
        const three = sum(d.vec2f(0.3, 0.7), 2, 2, 0.5, 0, d.vec2f(0, 0), 3) as d.v2f
        expect(two.y).toBeCloseTo(1.5, 5)
        expect(three.y).toBeCloseTo(1.75, 5)
        // Raising the count only ADDS: the lower octaves' contribution is untouched.
        expect(three.x - two.x).not.toBeCloseTo(0, 6)
    })

    it('the timeSeed drift form offsets time and seed per octave', () => {
        const sum = fields.fbmGated(probeFieldParametric, {maxOctaves: 4, drift: 'timeSeed', name: 'timeSeedProbe'})
        const out = sum(d.vec2f(0, 0), 1, 2, 0.5, 0, 0, d.vec3f(0, 0, 0), 1) as d.v2f
        // One octave, animT = 0 + 0·17, seedOff = 0 + 0·31 → sin(0) + 0 = 0.
        expect(out.x).toBeCloseTo(0, 5)
        const two = sum(d.vec2f(0, 0), 1, 2, 0.5, 0, 0, d.vec3f(0, 0, 0), 2) as d.v2f
        // Second octave: sin(17) + 31·0.01, weighted 0.5.
        expect(two.x).toBeCloseTo((Math.sin(17) + 0.31) * 0.5, 4)
    })
})

describe('fields — domainWarp1 builder (mobile tier)', () => {
    it('passes the position through at warpAmount 0 and never displaces z', () => {
        const warp = fields.domainWarp1(probeField3, {name: 'warpOne'})
        const still = warp(d.vec3f(0.2, 0.4, 0.6), 0, 0)
        expect(still.x).toBeCloseTo(0.2, 6)
        expect(still.y).toBeCloseTo(0.4, 6)
        expect(still.z).toBeCloseTo(0.6, 6)
        const moved = warp(d.vec3f(0.2, 0.4, 0.6), 1, 0.5)
        expect(moved.z).toBeCloseTo(0.6, 6)
        expect(moved.x).not.toBeCloseTo(0.2, 3)
    })

    it('is a different warp from the two-level builder (level 2 is genuinely dropped)', () => {
        const one = fields.domainWarp1(probeField3, {name: 'warpOneVsTwo'})
        const two = fields.domainWarp2(probeField3, {name: 'warpTwoVsOne'})
        const a = one(d.vec3f(0.2, 0.4, 0.6), 1, 0.5)
        const b = two(d.vec3f(0.2, 0.4, 0.6), 1, 0.5)
        expect(a.x !== b.x || a.y !== b.y).toBe(true)
    })

    it('emits exactly two field reads where the two-level warp emits four', () => {
        const probe = tgpu.fn([d.vec3f], d.f32)((p) => {
            'use gpu'
            return std.sin(p.x) * p.z
        }).$name('probeReads')
        const one = fields.domainWarp1(probe, {name: 'warpOneReads'})
        const two = fields.domainWarp2(probe, {name: 'warpTwoReads'})
        const wrap = (fn: (p: d.v3f, t: number, a: number) => d.v3f, name: string) => tgpu.fn([d.vec3f], d.vec3f)((p) => {
            'use gpu'
            return fn(p, 0.5, 0.4)
        }).$name(name)
        const w1 = tgpu.resolve([wrap(one, 'wrapOne')], {names: 'strict'})
        const w2 = tgpu.resolve([wrap(two, 'wrapTwo')], {names: 'strict'})
        // Matches include the `fn probeReads(` definition itself — subtract it to count CALLS.
        const reads = (w: string) => (w.match(/probeReads\(/g) ?? []).length - 1
        expect(reads(w1)).toBe(2)
        expect(reads(w2)).toBe(4)
        expect(w1).toContain('fn warpOneReads')
    })

    it('is memoized per (field, name, offsets), in a cache slot separate from domainWarp2', () => {
        const a = fields.domainWarp1(probeField3, {name: 'warpOneMemo'})
        const b = fields.domainWarp1(probeField3, {name: 'warpOneMemo'})
        const c = fields.domainWarp2(probeField3, {name: 'warpOneMemo'})
        expect(a).toBe(b)
        expect(a).not.toBe(c)
    })
})

describe('fields — domainWarp2 builder', () => {
    it('memoizes and returns the final sampling position (not the field value)', () => {
        const a = fields.domainWarp2(probeField3, {name: 'warpProbe'})
        const b = fields.domainWarp2(probeField3, {name: 'warpProbe'})
        expect(a).toBe(b)
        const out = a(d.vec3f(0.2, 0.4, 0.6), 0, 0) as d.v3f
        // warpAmount 0 → the displacement drops out and the position passes through unchanged.
        expect(out.x).toBeCloseTo(0.2, 6)
        expect(out.y).toBeCloseTo(0.4, 6)
        expect(out.z).toBeCloseTo(0.6, 6)
    })

    it('displaces the ORIGINAL position at both levels (z is never displaced)', () => {
        const warp = fields.domainWarp2(probeField3, {name: 'warpProbe2'})
        const out = warp(d.vec3f(0.2, 0.4, 0.6), 1, 0.5) as d.v3f
        expect(out.z).toBeCloseTo(0.6, 6) // level 2 adds (rx, ry, 0)
        expect(out.x).not.toBeCloseTo(0.2, 3)
    })
})

describe('resolve gate — the builders emit valid WGSL and call their field fn', () => {
    // TWO differently-configured instances of each builder in ONE entry: the C3 collision test.
    const goldenA = fields.fbmGated(probeField2, {maxOctaves: 4, drift: 'goldenAngle', name: 'fbmA'})
    const goldenB = fields.fbmGated(probeField2, {maxOctaves: 8, drift: 'goldenAngle', name: 'fbmB'})
    const warp = fields.domainWarp2(probeField3, {name: 'warpTwo'})

    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const pos = fields.aspectScaledDomain(input.uv, d.vec2f(800, 600), 1, 0)
            const a = goldenA(pos, 2, 2, 0.5, 0, d.vec2f(0, 0), 4)
            const b = goldenB(pos, 2, 2, 0.5, 0, d.vec2f(0, 0), 8)
            const w = warp(fields.timeAxisDomain(pos, 1, 0.3), 1, 0.4)
            const g = fields.pixelGridDomain(input.uv, d.vec2f(800, 600), 4, 0)
            return d.vec4f(a.x / a.y, b.x / b.y, w.x, g.x)
        })
        .$name('fieldsProbe')

    it('emits both fbm configurations under distinct names', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        expect(wgsl).toContain('fn fbmAGolden4')
        expect(wgsl).toContain('fn fbmBGolden8')
        expect(wgsl).toContain('fn warpTwo')
        // TypeGPU 0.12 namespaces shared kit-facade helpers by their module (fields_, …).
        expect(wgsl).toContain('fn fields_aspectScaledDomain')
        expect(wgsl).toContain('fn fields_pixelGridDomain')
        expect(wgsl).toContain('fn fields_timeAxisDomain')
        // The captured field fn is emitted under the BUILDER's local identifier, once, and called.
        expect(wgsl).toContain('octaveField(coord)')
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
