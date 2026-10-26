import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Solarize from '@coreroot/shaders/Solarize/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {solarize} = colorOps

/** Solarize port gate (W6-A) — inline color filter. Invert tones above a Rec.601 luminance threshold. */
const SOLARIZE = Solarize as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Solarize (a) inline color-filter path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT, no unpremultiply', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 's', def: SOLARIZE, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 's', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/solarize/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Solarize (b) CPU golden', () => {
    it('inverts above the luminance threshold, blends by strength, preserves alpha', () => {
        const cases: [number, number, number, number, number, number][] = [
            [0.9, 0.9, 0.9, 1, 0.5, 1], // bright → above threshold → inverted
            [0.1, 0.1, 0.1, 0.7, 0.5, 1], // dark → below threshold → unchanged
            [0.6, 0.4, 0.8, 0.4, 0.5, 0.5], // partial strength
        ]
        for (const [r, g, b, a, threshold, strength] of cases) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b
            const sol = lum > threshold ? [1 - r, 1 - g, 1 - b] : [r, g, b]
            const exp = [r + (sol[0] - r) * strength, g + (sol[1] - g) * strength, b + (sol[2] - b) * strength]
            const out = solarize(d.vec4f(r, g, b, a), threshold, strength) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(exp[0], 5)
            expect(out.y).toBeCloseTo(exp[1], 5)
            expect(out.z).toBeCloseTo(exp[2], 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
