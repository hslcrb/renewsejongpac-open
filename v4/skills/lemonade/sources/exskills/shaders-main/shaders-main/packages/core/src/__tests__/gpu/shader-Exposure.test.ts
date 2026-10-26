import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Exposure from '@coreroot/shaders/Exposure/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {exposure} = colorOps

/** Exposure port gate (D2-A) — inline color filter (see Invert for the recipe). Unclamped scalar gain. */
const EXPOSURE = Exposure as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

function wgslFor(props?: Record<string, unknown>): string {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'ex', def: EXPOSURE, parentId: 'root', metadata: {renderOrder: 0}, props},
        {id: 'gen', def: Generator, parentId: 'ex', metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    expect(ir.rttPasses.length).toBe(0)
    return tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
}

describe('Exposure (a) inline color-filter path (NO RTT)', () => {
    it('gain=1 (the default): identity bypass — no exposure emitted', () => {
        const wgsl = wgslFor()
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/exposure/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
    it('operates on the composed child inline — no RTT, no unpremultiply', () => {
        const wgsl = wgslFor({exposure: 2})
        expect(wgsl).toMatch(/exposure/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass-exposure2')
    })
})

describe('Exposure (b) CPU golden', () => {
    it('multiplies rgb by gain (not clamped), preserves alpha', () => {
        const cases: [number, number, number, number, number][] = [
            [0.2, 0.4, 0.6, 0.8, 1],
            [0.5, 0.5, 0.5, 1, 3], // gain > 1 pushes past white (unclamped)
            [0.4, 0.2, 0.1, 0.5, 0],
        ]
        for (const [r, g, b, a, gain] of cases) {
            const out = exposure(d.vec4f(r, g, b, a), gain) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(r * gain, 5)
            expect(out.y).toBeCloseTo(g * gain, 5)
            expect(out.z).toBeCloseTo(b * gain, 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
