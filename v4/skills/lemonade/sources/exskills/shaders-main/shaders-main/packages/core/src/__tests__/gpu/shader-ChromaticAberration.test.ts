import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import ChromaticAberration from '@coreroot/shaders/ChromaticAberration/index'
import {chromaticOffsetUV} from '@coreroot/std/effects/lens'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * ChromaticAberration port gate (D2-D) — an RTT FILTER (requiresRTT/requiresChild, no uvRemap →
 * always the fragment path). It RTTs the child, samples it at three per-channel offset UVs,
 * recombines R/G/B (alpha from the centred green sample), and unpremultiplies (the RTT stores
 * premultiplied alpha — Twirl trap #2). GPU-free: the composer builds the raw-WGSL entries; we
 * resolve + snapshot. `chromaticOffsetUV` is pure trig → CPU-goldened.
 */
const CA = ChromaticAberration as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('ChromaticAberration (a) RTT multi-offset filter path', () => {
    it('RTTs the child, samples 3 offset UVs, recombines channels, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'ca', def: CA, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'ca', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/chromaticOffsetUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('ChromaticAberration (b) CPU golden — per-channel offset UV', () => {
    it('uv + (cos/aspect, sin) * strength*0.1 * channelOffset', () => {
        const cases = [
            {uv: [0.5, 0.5] as const, angle: 0, strength: 0.2, aspect: 1.6, ch: -1},
            {uv: [0.3, 0.7] as const, angle: 90, strength: 0.5, aspect: 1.0, ch: 1},
            {uv: [0.5, 0.5] as const, angle: 45, strength: 1.0, aspect: 2.0, ch: 0},
        ]
        for (const {uv, angle, strength, aspect, ch} of cases) {
            const angleRad = angle * (Math.PI / 180)
            const scaled = strength * 0.1
            const ex = uv[0] + (Math.cos(angleRad) / aspect) * scaled * ch
            const ey = uv[1] + Math.sin(angleRad) * scaled * ch
            const out = chromaticOffsetUV(d.vec2f(uv[0], uv[1]), angle, strength, aspect, ch) as unknown as {x: number; y: number}
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})
