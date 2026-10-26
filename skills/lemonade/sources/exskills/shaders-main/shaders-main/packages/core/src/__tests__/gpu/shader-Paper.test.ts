import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Paper from '@coreroot/shaders/Paper/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Paper port gate (D1-E) — an RTT FILTER (requiresRTT/requiresChild, no uvRemap → always the
 * fragment path). It RTTs the child, samples it at the curl-displaced UV, unpremultiplies (the RTT
 * stores premultiplied alpha — Twirl trap #2), and modulates the straight rgb by the grain
 * brightness. GPU-free: the composer builds the raw-WGSL entries; we resolve + snapshot. `paperSurface`
 * is hash-driven (curl22/paper12 → GPU-only, no CPU golden — the u32-hash rule); the smoke validates
 * it (incl. the premultiply path over half-transparent content).
 */
const PAPER = Paper as GpuShaderDefinition

// A minimal opaque generator to sit beneath the filter (the RTT'd content).
const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Paper (a) RTT filter path', () => {
    it('RTTs the child, samples at the displaced UV, unpremultiplies, modulates by grain', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'paper', def: PAPER, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'paper', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/paperSurface/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})
