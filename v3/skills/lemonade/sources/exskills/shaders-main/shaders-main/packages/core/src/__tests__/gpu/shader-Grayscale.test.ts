import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Grayscale from '@coreroot/shaders/Grayscale/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {grayscale} = colorOps

/** Grayscale port gate (D2-A) — inline color filter (see Invert for the recipe). Rec.709 luminance. */
const GRAYSCALE = Grayscale as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Grayscale (a) inline color-filter path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT, no unpremultiply', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'g', def: GRAYSCALE, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'g', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/grayscale/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Grayscale (b) CPU golden', () => {
    it('Rec.709 luminance across rgb, preserves alpha', () => {
        const cases: [number, number, number, number][] = [
            [0.2, 0.4, 0.6, 0.8],
            [1, 0, 0, 1],
            [0.5, 0.5, 0.5, 0.3],
        ]
        for (const [r, g, b, a] of cases) {
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            const out = grayscale(d.vec4f(r, g, b, a)) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(lum, 5)
            expect(out.y).toBeCloseTo(lum, 5)
            expect(out.z).toBeCloseTo(lum, 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
