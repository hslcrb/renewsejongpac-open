import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Stone from '@coreroot/shaders/Stone/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Stone port gate (D1-E) — an RTT relief FILTER over the shared kit `applyNoiseReliefExpr` with the
 * marbled `stone12` height field. Mirrors Twirl's fragment RTT path: RTT the child, sample at the
 * perlin12d-distorted UV, unpremultiply (RTT premultiplied — Twirl trap #2), modulate straight rgb by
 * the contrast-remapped height brightness. GPU-free resolve + snapshot; the relief math's pure-float
 * parts are golden-tested in kit-noiseStylize.test.ts (stone12/perlin12d are hash-based → GPU-only).
 */
const STONE = Stone as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Stone (a) RTT relief filter path', () => {
    it('RTTs the child, distorts + samples, unpremultiplies, modulates by the stone height', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'stone', def: STONE, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'stone', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/reliefPos/)
        expect(finalWgsl).toMatch(/reliefDisplacedUV/)
        expect(finalWgsl).toMatch(/stone12/)
        expect(finalWgsl).toMatch(/reliefBrightness/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})
