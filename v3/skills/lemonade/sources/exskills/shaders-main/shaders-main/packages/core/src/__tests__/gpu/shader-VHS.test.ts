import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import VHS from '@coreroot/shaders/VHS/index'
import {vhsChromaTapUV} from '@coreroot/gpu/kit/motionBlur'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * VHS port gate (W6-A) — RTT filter (Twirl/CRTScreen recipe). Per-scanline tape displacement + 6-tap
 * chroma smear over the premultiplied child RTT, driven by the GLOBAL clock (ctx.time · speed), then
 * unpremultiply. Hash-driven → GPU-only; vhsChromaTapUV carries the CPU golden.
 */
const VHSDEF = VHS as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('VHS (a) RTT filter path', () => {
    it('RTTs the child, samples luma + chroma taps, composes, unpremultiplies; reads global clock', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'vhs', def: VHSDEF, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'vhs', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/vhsSampleUVs/)
        expect(finalWgsl).toMatch(/vhsChromaTapUV/)
        expect(finalWgsl).toMatch(/yiqRecombine/)
        expect(finalWgsl).toMatch(/beatShade/)
        expect(finalWgsl).toMatch(/vhsAcBeat/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatch(/_sys/) // global clock (ctx.time)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('VHS (b) CPU golden — chroma smear tap UV', () => {
    it('chromaUV.x shifted left by i·smearScale, y unchanged', () => {
        const cases = [
            {chromaUV: [0.5, 0.5] as const, smearScale: 0.01, i: 3},
            {chromaUV: [0.3, 0.7] as const, smearScale: -0.005, i: 5},
        ]
        for (const {chromaUV, smearScale, i} of cases) {
            const out = vhsChromaTapUV(d.vec2f(chromaUV[0], chromaUV[1]), smearScale, i) as unknown as {x: number; y: number}
            expect(out.x).toBeCloseTo(chromaUV[0] + i * -1 * smearScale, 6)
            expect(out.y).toBeCloseTo(chromaUV[1], 6)
        }
    })
})
