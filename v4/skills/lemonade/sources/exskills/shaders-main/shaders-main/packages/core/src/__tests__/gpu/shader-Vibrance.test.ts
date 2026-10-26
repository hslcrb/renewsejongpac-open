import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Vibrance from '@coreroot/shaders/Vibrance/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {vibrance} = colorOps

/** Vibrance port gate (W6-A) — inline color filter. three.js vibrance: selective saturation. */
const VIBRANCE = Vibrance as GpuShaderDefinition

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
        {id: 'v', def: VIBRANCE, parentId: 'root', metadata: {renderOrder: 0}, props},
        {id: 'gen', def: Generator, parentId: 'v', metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    expect(ir.rttPasses.length).toBe(0)
    return tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
}

describe('Vibrance (a) inline color-filter path (NO RTT)', () => {
    it('intensity=0 (the default): identity bypass — no vibrance emitted', () => {
        const wgsl = wgslFor()
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/vibrance/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
    it('operates on the composed child inline — no RTT, no unpremultiply', () => {
        const wgsl = wgslFor({intensity: 1})
        expect(wgsl).toMatch(/vibrance/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass-intensity1')
    })
})

describe('Vibrance (b) CPU golden', () => {
    const mix = (a: number, b: number, t: number) => a + (b - a) * t
    it('mixes toward the max channel by (max-avg)·adj·-3, preserves alpha', () => {
        const cases: [number, number, number, number, number][] = [
            [0.2, 0.4, 0.9, 0.8, 1],
            [0.5, 0.5, 0.5, 1, 1.5], // gray → amt=0 → unchanged
            [0.8, 0.2, 0.3, 0.6, -1],
        ]
        for (const [r, g, b, a, adj] of cases) {
            const average = (r + g + b) / 3
            const mx = Math.max(r, Math.max(g, b))
            const amt = (mx - average) * adj * -3
            const out = vibrance(d.vec4f(r, g, b, a), adj) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(mix(r, mx, amt), 5)
            expect(out.y).toBeCloseTo(mix(g, mx, amt), 5)
            expect(out.z).toBeCloseTo(mix(b, mx, amt), 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
