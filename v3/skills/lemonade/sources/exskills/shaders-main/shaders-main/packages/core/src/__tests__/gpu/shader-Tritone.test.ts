import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Tritone from '@coreroot/shaders/Tritone/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {tritoneFactors} = colorOps

/**
 * Tritone port gate (D2-A) — inline color filter (see Invert for the recipe). The body returns the
 * three luminance-driven blend factors (Rec.601); the three color mixes + the final blend are
 * builder-level in the compile-time colorSpace. Alpha carried from the child.
 */
const TRITONE = Tritone as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

const build = (props: Record<string, unknown> = {}) =>
    buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'tri', def: TRITONE, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'tri', metadata: {renderOrder: 0}},
    ])

describe('Tritone (a) inline color-filter path (NO RTT)', () => {
    it('three-tone map by luminance inline — no RTT, no unpremultiply', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/tritoneFactors/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (colorSpace: string) => collectStructuralHashInputs(build({colorSpace}).registry).join('\n')
        expect(hashWith('linear')).not.toBe(hashWith('hsl'))
    })
})

describe('Tritone (b) CPU golden — three blend factors', () => {
    const smoothstep = (e0: number, e1: number, x: number) => {
        const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
        return t * t * (3 - 2 * t)
    }
    it('Rec.601 luminance → (shadowToMid, midToHighlight, finalT)', () => {
        const cases: {c: [number, number, number]; blendMid: number}[] = [
            {c: [0.2, 0.4, 0.6], blendMid: 0.5},
            {c: [0.9, 0.9, 0.9], blendMid: 0.3},
            {c: [0.1, 0.05, 0.05], blendMid: 0.6},
        ]
        for (const {c: [r, g, b], blendMid} of cases) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b
            const out = tritoneFactors(d.vec4f(r, g, b, 1), blendMid) as unknown as {x: number; y: number; z: number}
            expect(out.x).toBeCloseTo(smoothstep(blendMid - 0.25, blendMid, lum), 5)
            expect(out.y).toBeCloseTo(smoothstep(blendMid, blendMid + 0.25, lum), 5)
            expect(out.z).toBeCloseTo(smoothstep(blendMid - 0.1, blendMid + 0.1, lum), 5)
        }
    })
})
