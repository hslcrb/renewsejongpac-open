import {describe, it, expect} from 'vitest'
import {tgpu, d, fields, colorMixing} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Vignette from '@coreroot/shaders/Vignette/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Vignette gate — the std Phase-0 tracer. Inline color filter (pointwise species: reads ctx.uv +
 * ctx.aspect, NOT an RTT filter), authored entirely in std nouns: `tintToward(color, {amount:
 * radialMask(...).times(intensity)})`. The GPU bodies are kit primitives — `fields.radialFalloffMask`
 * (aspect-corrected radial coverage, transformPosition center double-flip) and
 * `colorMixing.mixToward` (rgb mix toward target, alpha preserved).
 */
const VIGNETTE = Vignette as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Vignette (a) inline color-filter path (NO RTT)', () => {
    it('operates on the composed child inline via std nouns — no RTT, no unpremultiply', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'v', def: VIGNETTE, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'v', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/radialFalloffMask/)
        expect(wgsl).toMatch(/mixToward/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Vignette (b) CPU golden (kit noun bodies as DualFns)', () => {
    const smoothstep = (e0: number, e1: number, x: number) => {
        const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
        return t * t * (3 - 2 * t)
    }
    const mix = (a: number, b: number, t: number) => a + (b - a) * t
    it('radialFalloffMask: aspect-corrected radial smoothstep with the center double-flip', () => {
        // center stored (0.5, 0.5) ⇒ authored y = 1 - 0.5 = 0.5; centerPos = (0.5·aspect, 0.5).
        const aspect = 2
        const radius = 0.3
        const falloff = 0.4
        const uv = [0.9, 0.1] as const
        const center = [0.5, 0.5] as const
        const aspectUV = [uv[0] * aspect, uv[1]]
        const centerPos = [center[0] * aspect, 1 - center[1]]
        const dist = Math.hypot(aspectUV[0] - centerPos[0], aspectUV[1] - centerPos[1])
        const mask = fields.radialFalloffMask(
            d.vec2f(uv[0], uv[1]), aspect, d.vec2f(center[0], center[1]), radius, falloff,
        ) as unknown as number
        expect(mask).toBeCloseTo(smoothstep(radius, radius + falloff, dist), 4)
    })
    it('mixToward: mixes rgb toward the target by amount; alpha preserved (mask × intensity)', () => {
        const color = [0.8, 0.6, 0.4, 0.7]
        const vig = [0, 0, 0, 1]
        const mask = 0.6180339
        const intensity = 1
        const out = colorMixing.mixToward(
            d.vec4f(color[0], color[1], color[2], color[3]),
            d.vec4f(vig[0], vig[1], vig[2], vig[3]),
            mask * intensity,
        ) as unknown as {x: number; y: number; z: number; w: number}
        expect(out.x).toBeCloseTo(mix(color[0], vig[0], mask * intensity), 4)
        expect(out.y).toBeCloseTo(mix(color[1], vig[1], mask * intensity), 4)
        expect(out.z).toBeCloseTo(mix(color[2], vig[2], mask * intensity), 4)
        expect(out.w).toBeCloseTo(color[3], 5)
    })
})
