import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Chalkboard from '@coreroot/shaders/Chalkboard/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Chalkboard port gate (Phase W6-B) — an RTT stylization FILTER (requiresRTT/requiresChild, no
 * uvRemap, no computeNode). It RTTs the child, samples the 8 Sobel taps + centre, luminance-reduces,
 * and composes edge strokes + cross-hatch + chalk-dust grain. RTT stores premultiplied alpha →
 * unpremultiply each tap (Twirl trap #2). Value-noise hash → GPU-only (resolve+snapshot, no golden).
 */
const CB = Chalkboard as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Chalkboard (a) RTT stylization filter path', () => {
    it('RTTs the child, samples Sobel taps, unpremultiplies, composes the chalk drawing', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'cb', def: CB, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'cb', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/chalkboardCompose/)
        expect(finalWgsl).toMatch(/chalkOffsetUV/)
        expect(finalWgsl).toMatch(/chalkLuma/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})
