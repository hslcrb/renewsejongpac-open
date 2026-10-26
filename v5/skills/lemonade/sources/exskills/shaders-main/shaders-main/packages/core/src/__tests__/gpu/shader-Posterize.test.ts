import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Posterize from '@coreroot/shaders/Posterize/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {posterize} = colorOps

/** Posterize port gate (W6-A) — inline color filter (see Invert for the recipe). floor(c·steps)/steps. */
const POSTERIZE = Posterize as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Posterize (a) inline color-filter path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT, no unpremultiply', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'p', def: POSTERIZE, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'p', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/posterize/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Posterize (b) CPU golden', () => {
    it('quantises each channel to `steps`, preserves alpha', () => {
        const cases: [number, number, number, number, number][] = [
            [0.2, 0.45, 0.9, 0.8, 5],
            [0.33, 0.66, 0.99, 1, 2],
            [0.1, 0.5, 0.75, 0.4, 20],
        ]
        for (const [r, g, b, a, steps] of cases) {
            const out = posterize(d.vec4f(r, g, b, a), steps) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(Math.floor(r * steps) / steps, 5)
            expect(out.y).toBeCloseTo(Math.floor(g * steps) / steps, 5)
            expect(out.z).toBeCloseTo(Math.floor(b * steps) / steps, 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
