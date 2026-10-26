import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Spherize from '@coreroot/shaders/Spherize/index'
import {sphereBulge, rimLight, rimComposite} from '@coreroot/gpu/kit/warpMaps'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Spherize port gate (W6-C — a distortion with NO uvRemap: the fresnel rim adds color so it stays
 * RTT). It RTTs the child, samples at the bulged sphere UV, and adds a directional rim light masked
 * to the sphere boundary. CPU-goldens the geometry (bulge + boundary alpha) and the composite arg
 * order (regression guard for the sphereAlpha/rimLight pack — a swapped-arg bug caught in the smoke).
 */
const S = Spherize as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Spherize (a) RTT sphere distortion', () => {
    it('RTTs the child, samples the bulged UV, and adds the rim light (unpremultiplied)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 's', def: S, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 's', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/sphereBulge/)
        expect(finalWgsl).toMatch(/rimLight/)
        expect(finalWgsl).toMatch(/rimComposite/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('Spherize (b) CPU golden — geometry + shading parts', () => {
    it('at the sphere centre: identity UV, coverage=1, and zero rim light', () => {
        // center=(0.5, 0.5) transformed = (0.5, 0.5); uv=center → sphereX=sphereY=0.
        const geom = sphereBulge(
            d.vec2f(0.5, 0.5), d.vec2f(800, 600), d.vec2f(0.5, 0.5), 1.0, 1.0,
        ) as unknown as {uv: {x: number; y: number}; coverage: number; normal: {x: number; y: number; z: number}}
        expect(geom.uv.x).toBeCloseTo(0.5, 5) // transformedUV.x = center
        expect(geom.uv.y).toBeCloseTo(0.5, 5)
        expect(geom.coverage).toBeCloseTo(1, 5) // coverage = 1 inside
        // rimLight = 0 at centre (fresnel = 0 where normal ∥ view).
        const rim = rimLight(d.vec3f(geom.normal.x, geom.normal.y, geom.normal.z), d.vec2f(0.3, 0.7), 0.5, 0.5) as unknown as number
        expect(rim).toBeCloseTo(0, 5)
    })
    it('composite: coverage gates alpha, rim adds color (the fixed arg order)', () => {
        // straight opaque grey, white light, rim 0, coverage 1 → passthrough, opaque.
        const out = rimComposite(d.vec4f(0.4, 0.4, 0.4, 1.0), d.vec3f(1, 1, 1), 0.0, 1.0) as unknown as {x: number; w: number}
        expect(out.x).toBeCloseTo(0.4, 5) // no rim added
        expect(out.w).toBeCloseTo(1, 5) // coverage 1 → opaque (NOT zeroed by a swapped rim)
    })
})
