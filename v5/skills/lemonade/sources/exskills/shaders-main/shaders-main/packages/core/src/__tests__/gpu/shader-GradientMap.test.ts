import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import GradientMap from '@coreroot/shaders/GradientMap/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {gradientMapT, gradientMapCustomPhase} = colorOps

/**
 * GradientMap port gate (D2-A) — inline color filter (see Invert for the recipe), the batch's most
 * complex. compileTime `palette` (cpu-only string) branches the whole fragment: cosine palettes
 * (procedural, no mixColors) vs custom (3-stop cyclic ramp in the compile-time colorSpace). ctx.time
 * drives the scroll phase (global clock — v1 used three's `time`). strength blends the mapped result
 * back over the original child.
 */
const GM = GradientMap as GpuShaderDefinition

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
        {id: 'gm', def: GM, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'gm', metadata: {renderOrder: 0}},
    ])

describe('GradientMap (a) cosine palette path', () => {
    it('rainbow: cosine palette + strength compose, no mixColors, no RTT', () => {
        const ir = composeNodeTree(build({palette: 'rainbow'}).registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/gradientMapT/)
        expect(wgsl).toMatch(/gradientMapCosine/)
        expect(wgsl).toMatch(/gradientMapCompose/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('cosine-final-pass')
    })
})

describe('GradientMap (b) custom colors path', () => {
    it('custom: 3-stop cyclic mixColors + select in the compile-time colorSpace', () => {
        const ir = composeNodeTree(build({palette: 'custom'}).registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/gradientMapCustomPhase/)
        expect(wgsl).toMatch(/gradientMapSelect/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatch(/gradientMapCompose/)
        expect(wgsl).not.toMatch(/gradientMapCosine/)
        expect(wgsl).toMatchSnapshot('custom-final-pass')
    })

    it('palette and colorSpace are part of the structural hash', () => {
        const hashWith = (props: Record<string, unknown>) => collectStructuralHashInputs(build(props).registry).join('\n')
        expect(hashWith({palette: 'rainbow'})).not.toBe(hashWith({palette: 'ocean'}))
        expect(hashWith({palette: 'custom', colorSpace: 'oklch'})).not.toBe(hashWith({palette: 'custom', colorSpace: 'hsl'}))
    })
})

describe('GradientMap (c) CPU goldens — levels/contrast + custom phase', () => {
    const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)
    const fract = (x: number) => x - Math.floor(x)
    it('gradientMapT: luminance levels remap + contrast around 0.5', () => {
        const cases: {c: [number, number, number]; black: number; white: number; contrast: number}[] = [
            {c: [0.2, 0.4, 0.6], black: 0, white: 1, contrast: 1},
            {c: [0.9, 0.9, 0.9], black: 0.2, white: 0.8, contrast: 2},
        ]
        for (const {c: [r, g, b], black, white, contrast} of cases) {
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
            const range = Math.max(white - black, 0.0001)
            let t = clamp01((luma - black) / range)
            t = clamp01((t - 0.5) * contrast + 0.5)
            const out = gradientMapT(d.vec4f(r, g, b, 1), black, white, contrast) as unknown as number
            expect(out).toBeCloseTo(t, 5)
        }
    })
    it('gradientMapCustomPhase: (fract(t3), floor(t3)) for t3 = fract(t+phase)*3', () => {
        const cases: [number, number][] = [
            [0.1, 0], [0.7, 0.4], [0.9, 0.5],
        ]
        for (const [t, phase] of cases) {
            const t3 = fract(t + phase) * 3
            const out = gradientMapCustomPhase(d.f32(t), d.f32(phase)) as unknown as {x: number; y: number}
            expect(out.x).toBeCloseTo(fract(t3), 5)
            expect(out.y).toBeCloseTo(Math.floor(t3), 5)
        }
    })
})
