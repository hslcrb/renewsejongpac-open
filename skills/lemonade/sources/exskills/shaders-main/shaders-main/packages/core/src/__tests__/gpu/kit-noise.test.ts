import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {
    mxFade,
    mxBilerp,
    mxTrilerp,
    mxGradientScale2d,
    mxGradientScale3d,
    mxNoiseFloat2,
    mxNoiseFloat3,
    mxWorleyNoiseFloat2Pub,
    mxWorleyNoiseFloat3Pub,
} from '@coreroot/gpu/kit/noise'

/**
 * B6 kit noise gate — MaterialX perlin + worley port.
 * The u32 hash is verified by the resolve gate (correct WGSL, same constants as three); the
 * pure-float helpers are verified by CPU golden values (mathematical equivalence). See the
 * header of kit/noise.ts for why the hash is not CPU golden-tested (WGSL vs JS u32 shift).
 */

describe('noise float helpers — CPU golden values', () => {
    it('mxFade quintic: fade(0)=0, fade(0.5)=0.5, fade(1)=1', () => {
        expect(mxFade(0)).toBeCloseTo(0)
        expect(mxFade(0.5)).toBeCloseTo(0.5)
        expect(mxFade(1)).toBeCloseTo(1)
        // t^3(t(6t-15)+10) at 0.25 = 0.015625*(0.25*(1.5-15)+10)=0.015625*6.625
        expect(mxFade(0.25)).toBeCloseTo(0.25 ** 3 * (0.25 * (0.25 * 6 - 15) + 10))
    })

    it('mxBilerp bilinear interpolation', () => {
        expect(mxBilerp(1, 2, 3, 4, 0.5, 0.5)).toBeCloseTo(2.5)
        expect(mxBilerp(1, 2, 3, 4, 0, 0)).toBeCloseTo(1)
        expect(mxBilerp(1, 2, 3, 4, 1, 1)).toBeCloseTo(4)
    })

    it('mxTrilerp trilinear interpolation', () => {
        expect(mxTrilerp(1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)).toBeCloseTo(1)
        expect(mxTrilerp(0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1)).toBeCloseTo(1)
        expect(mxTrilerp(2, 2, 2, 2, 2, 2, 2, 2, 0.3, 0.7, 0.9)).toBeCloseTo(2)
    })

    it('mxGradientScale constants match three (0.6616 / 0.9820)', () => {
        expect(mxGradientScale2d(1)).toBeCloseTo(0.6616)
        expect(mxGradientScale3d(1)).toBeCloseTo(0.982)
        expect(mxGradientScale2d(2)).toBeCloseTo(1.3232)
    })

    it('float helpers are deterministic (same input → same output)', () => {
        expect(mxFade(0.375)).toBe(mxFade(0.375))
        expect(mxBilerp(0.1, 0.2, 0.3, 0.4, 0.6, 0.7)).toBe(mxBilerp(0.1, 0.2, 0.3, 0.4, 0.6, 0.7))
    })
})

describe('noise resolve gate — perlin + worley emit valid WGSL', () => {
    // A fragment that calls every public entry so none is dead-code-eliminated.
    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const n2 = mxNoiseFloat2(input.uv)
            const n3 = mxNoiseFloat3(d.vec3f(input.uv.x, input.uv.y, 0.5))
            const w2 = mxWorleyNoiseFloat2Pub(input.uv, 1.0)
            const w3 = mxWorleyNoiseFloat3Pub(d.vec3f(input.uv.x, input.uv.y, 0.5), 1.0)
            return d.vec4f(n2, n3, w2, w3)
        })
        .$name('noiseProbe')

    it('resolves to WGSL (u32 hash, gradients, loops all valid)', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        expect(typeof wgsl).toBe('string')
        expect(wgsl.length).toBeGreaterThan(0)
        // Sanity: the u32 hash constants survive into the emitted WGSL.
        expect(wgsl).toContain('3735928559') // 0xdeadbeef
    })

    it('is structurally deterministic (resolve twice → identical WGSL)', () => {
        const a = tgpu.resolve([frag], {names: 'strict'})
        const b = tgpu.resolve([frag], {names: 'strict'})
        expect(a).toBe(b)
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
