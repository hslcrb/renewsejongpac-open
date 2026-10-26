import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import SliceWipe from '@coreroot/shaders/SliceWipe/index'
import {sliceWipeUV} from '@coreroot/gpu/kit/warpMaps'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * SliceWipe gate — RTT distortion with analytic uvRemap fast path (Mirror/Flip recipe);
 * transparent edge coverage clips the space the sliding strips vacate.
 */
const SW = SliceWipe as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    acceptsUVContext: true,
    props: {} as never,
    fragment: ({uvContext, ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uvContext ?? ctx.uv]),
}

const build = (props: Record<string, unknown> = {}, metadata: Record<string, unknown> = {}) =>
    buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'w', def: SW, parentId: 'root', props, metadata: {renderOrder: 0, ...metadata}},
        {id: 'gen', def: Generator, parentId: 'w', metadata: {renderOrder: 0}},
    ])

describe('SliceWipe (a) analytic UV fold over a generator', () => {
    it('folds SliceWipe.uvRemap into the generator sample coordinate (inline, no RTT)', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/sliceWipeUV/)
        expect(wgsl).toMatch(/edgeTransparentMask/)
        expect(wgsl).toMatch(/genBody/)
    })
})

describe('SliceWipe (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the slide, unpremultiplies', () => {
        const ir = composeNodeTree(build({}, {opacity: 0.5}).registry)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/sliceWipeUV/)
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatch(/textureSample\(rtt_/)
    })
})

describe('SliceWipe (c) CPU golden — slide math', () => {
    it('is the identity at progress 0', () => {
        const out = sliceWipeUV(d.vec2f(0.31, 0.77), 16 / 9, 0, 8, 0) as {x: number; y: number}
        expect(out.x).toBeCloseTo(0.31, 5)
        expect(out.y).toBeCloseTo(0.77, 5)
    })

    it('pushes every lookup out of the frame at progress 1', () => {
        for (const uv of [[0.05, 0.5], [0.5, 0.05], [0.5, 0.95], [0.95, 0.5], [0.5, 0.5]] as const) {
            const out = sliceWipeUV(d.vec2f(uv[0], uv[1]), 16 / 9, 0, 8, 1) as {x: number; y: number}
            const inside = out.x >= 0 && out.x <= 1 && out.y >= 0 && out.y <= 1
            expect(inside).toBe(false)
        }
    })

    it('adjacent strips slide in opposite directions (angle 0 → vertical slide)', () => {
        // Strip 0 (t near 0) vs strip 1 — sample two points in different strips.
        const a = sliceWipeUV(d.vec2f(0.05, 0.5), 1, 0, 8, 0.1) as {x: number; y: number}
        const b = sliceWipeUV(d.vec2f(0.18, 0.5), 1, 0, 8, 0.1) as {x: number; y: number}
        expect(Math.sign(a.y - 0.5)).toBe(-Math.sign(b.y - 0.5))
    })
})
