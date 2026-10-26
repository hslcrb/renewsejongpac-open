import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Glitch from '@coreroot/shaders/Glitch/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Glitch port gate (D2-D) — an RTT FILTER (requiresRTT/requiresChild). Computes the glitch
 * geometry once (temporal pulse from `ctx.time`, band/block displacement, mirror, RGB split, fill
 * bars, scanlines), samples the child at three per-channel UVs, combines and unpremultiplies. The
 * whole thing is sin-fract-hash driven → GPU-only (resolve + smoke, no CPU golden — the hash rule).
 */
const GLITCH = Glitch as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Glitch (a) RTT filter path', () => {
    it('RTTs the child, computes glitch geometry, samples 3 UVs, combines, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'glitch', def: GLITCH, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'glitch', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/glitchGeom/)
        // The decomposed stack: RGB-split sampling, color-bar fills, distortion-gated scanlines.
        expect(finalWgsl).toMatch(/glitchSplitUVs/)
        expect(finalWgsl).toMatch(/fillBarsShade/)
        expect(finalWgsl).toMatch(/distortScanShade/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        // temporal pulse reads the global clock
        expect(finalWgsl).toMatch(/_sys\.time/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})
