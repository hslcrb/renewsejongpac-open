import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Duotone from '@coreroot/shaders/Duotone/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {duotoneT} = colorOps

/**
 * Duotone port gate (D2-A) — inline color filter (see Invert for the recipe). The body computes the
 * luminance blend factor (Rec.601); the two-color mix is builder-level in the compile-time
 * colorSpace (mixColorsVariants[mode]). Alpha carried from the child.
 */
const DUOTONE = Duotone as GpuShaderDefinition

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
        {id: 'duo', def: DUOTONE, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'duo', metadata: {renderOrder: 0}},
    ])

describe('Duotone (a) inline color-filter path (NO RTT)', () => {
    it('mixes two colors by luminance inline — no RTT, no unpremultiply', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/duotoneT/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (colorSpace: string) => collectStructuralHashInputs(build({colorSpace}).registry).join('\n')
        expect(hashWith('linear')).not.toBe(hashWith('oklch'))
    })
})

describe('Duotone (b) CPU golden — blend factor', () => {
    const smoothstep = (e0: number, e1: number, x: number) => {
        const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
        return t * t * (3 - 2 * t)
    }
    it('Rec.601 luminance → smoothstep(blend-0.5, blend+0.5, lum)', () => {
        const cases: {c: [number, number, number, number]; blend: number}[] = [
            {c: [0.2, 0.4, 0.6, 1], blend: 0.5},
            {c: [1, 1, 1, 1], blend: 0.2},
            {c: [0, 0, 0, 0.5], blend: 0.8},
        ]
        for (const {c: [r, g, b], blend} of cases) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b
            const expected = smoothstep(blend - 0.5, blend + 0.5, lum)
            const out = duotoneT(d.vec4f(r, g, b, 1), blend) as unknown as number
            expect(out).toBeCloseTo(expected, 5)
        }
    })
})
