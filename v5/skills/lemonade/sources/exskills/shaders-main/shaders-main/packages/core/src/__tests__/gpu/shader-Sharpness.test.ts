import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Sharpness from '@coreroot/shaders/Sharpness/index'
import {sharpnessTapUV, sharpnessCompose} from '@coreroot/gpu/kit/motionBlur'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Sharpness port gate (W6-A) — RTT kernel filter (Twirl/CRTScreen recipe). 5-tap unsharp mask over the
 * premultiplied child RTT, then unpremultiply. sharpness=0 is a compile-time IDENTITY BYPASS (sample +
 * unpremultiply passthrough, no kernel — the child RTT is premultiplied so it cannot return raw).
 */
const SHARPNESS = Sharpness as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

function irFor(props?: Record<string, unknown>) {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 's', def: SHARPNESS, parentId: 'root', metadata: {renderOrder: 0}, props},
        {id: 'gen', def: Generator, parentId: 's', metadata: {renderOrder: 0}},
    ])
    return composeNodeTree(registry)
}

describe('Sharpness (a) RTT filter path + identity bypass', () => {
    it('sharpness=0 (default): passthrough — RTTs, samples once, unpremultiplies, no kernel', () => {
        const ir = irFor()
        expect(ir.rttPasses.length).toBe(1)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/sharpnessCompose/)
        expect(wgsl).not.toMatch(/sharpnessTapUV/)
    })
    it('sharpness≠0: RTTs the child, runs the 5-tap kernel, unpremultiplies', () => {
        const ir = irFor({sharpness: 1})
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/sharpnessTapUV/)
        expect(finalWgsl).toMatch(/sharpnessCompose/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass-sharp1')
    })
})

describe('Sharpness (b) CPU golden', () => {
    it('tap UV = uv + (dir/viewport)', () => {
        const uv = [0.5, 0.5] as const
        const vp = [800, 600] as const
        const top = sharpnessTapUV(d.vec2f(uv[0], uv[1]), d.vec2f(vp[0], vp[1]), 0, 1) as unknown as {x: number; y: number}
        expect(top.x).toBeCloseTo(0.5, 6)
        expect(top.y).toBeCloseTo(0.5 + 1 / 600, 6)
        const left = sharpnessTapUV(d.vec2f(uv[0], uv[1]), d.vec2f(vp[0], vp[1]), -1, 0) as unknown as {x: number; y: number}
        expect(left.x).toBeCloseTo(0.5 - 1 / 800, 6)
        expect(left.y).toBeCloseTo(0.5, 6)
    })
    it('kernel: center·(1+4a) − neighbours·a, clamped, center alpha', () => {
        const amount = 0.5
        const c = [0.6, 0.5, 0.4, 0.9]
        const n = [0.2, 0.2, 0.2, 1]
        const cw = 1 + amount * 4
        const nw = -amount
        const expance = (cc: number) => Math.min(1, Math.max(0, cc * cw + 4 * (0.2 * nw)))
        const out = sharpnessCompose(
            d.vec4f(c[0], c[1], c[2], c[3]),
            d.vec4f(n[0], n[1], n[2], n[3]), d.vec4f(n[0], n[1], n[2], n[3]),
            d.vec4f(n[0], n[1], n[2], n[3]), d.vec4f(n[0], n[1], n[2], n[3]),
            amount,
        ) as unknown as {x: number; y: number; z: number; w: number}
        expect(out.x).toBeCloseTo(expance(c[0]), 5)
        expect(out.y).toBeCloseTo(expance(c[1]), 5)
        expect(out.z).toBeCloseTo(expance(c[2]), 5)
        expect(out.w).toBeCloseTo(c[3], 5)
    })
})
