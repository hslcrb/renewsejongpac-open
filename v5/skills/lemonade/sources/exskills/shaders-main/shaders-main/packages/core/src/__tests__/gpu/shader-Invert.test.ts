import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Invert from '@coreroot/shaders/Invert/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {invert} = colorOps

/**
 * Invert port gate (D2-A) — the FIRST color-filter port; establishes the NON-RTT inline recipe the
 * rest of the D2 color batch copies. A pointwise `requiresChild` (NOT `requiresRTT`) filter operates
 * on the composed child color Expr directly (`call(body, [childNode])`), so there is NO RTT
 * boundary and NO `unpremultiplyAlpha` (those belong to Twirl/Stone/Paper). GPU-free resolve +
 * snapshot + a CPU golden on the exported body fn.
 */
const INVERT = Invert as GpuShaderDefinition

// A minimal opaque generator to sit beneath the filter (the composed content it transforms).
const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Invert (a) inline color-filter path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT boundary, no unpremultiply', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'inv', def: INVERT, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'inv', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/invert/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Invert (b) CPU golden', () => {
    it('inverts rgb (1 - c), preserves alpha', () => {
        const cases: [number, number, number, number][] = [
            [0.2, 0.4, 0.6, 0.8],
            [0, 0, 0, 1],
            [1, 1, 1, 0.5],
        ]
        for (const [r, g, b, a] of cases) {
            const out = invert(d.vec4f(r, g, b, a)) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(1 - r, 5)
            expect(out.y).toBeCloseTo(1 - g, 5)
            expect(out.z).toBeCloseTo(1 - b, 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
