import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Watercolor from '@coreroot/shaders/Watercolor/index'
import {watercolorTapUV, watercolorCompose} from '@coreroot/gpu/kit/stylizePaints'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Watercolor port gate (W6-A) — RTT Kuwahara filter (Twirl recipe). Samples the premultiplied child
 * RTT across 4 overlapping quadrants (builder-level, stride-2 bilinear taps hoisted into `let`s),
 * picks the lowest-variance mean, unpremultiplies once, then paper grain + bleed blend. Hash-driven
 * UV/grain → GPU-only; watercolorTapUV + watercolorCompose carry the CPU goldens.
 */
const WATERCOLOR = Watercolor as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('Watercolor (a) RTT filter path', () => {
    it('RTTs the child, runs the Kuwahara accumulate + compose, unpremultiplies per tap', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'w', def: WATERCOLOR, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'w', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/watercolorUvBase/)
        expect(finalWgsl).toMatch(/watercolorTapUV/)
        expect(finalWgsl).toMatch(/watercolorGrain/)
        expect(finalWgsl).toMatch(/watercolorCompose/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('Watercolor (b) CPU goldens', () => {
    it('tap UV = uvBase + (offset/viewport)', () => {
        const uvBase = [0.4, 0.6] as const
        const vp = [1000, 500] as const
        const out = watercolorTapUV(d.vec2f(uvBase[0], uvBase[1]), d.vec2f(vp[0], vp[1]), 2, -3) as unknown as {x: number; y: number}
        expect(out.x).toBeCloseTo(0.4 + 2 / 1000, 6)
        expect(out.y).toBeCloseTo(0.6 + -3 / 500, 6)
    })

    it('compose picks the lowest-variance quadrant mean (paper=0, strength=1)', () => {
        const invN = 0.25 // n = 4
        // q0: uniform opaque grey → zero variance → wins. sum=[2,2,2,4] sq=[1,1,1] mean=0.5 var=0.
        const s0 = d.vec4f(2, 2, 2, 4)
        const sq0 = d.vec3f(1, 1, 1)
        // q1..q3: a DISTINCT mean (0.25) with positive variance, so the expected 0.5 below can only
        // come from quadrant 0 — identical means would pass whichever quadrant won.
        const s = d.vec4f(1, 1, 1, 4)
        const sqHi = d.vec3f(1.5, 1.5, 1.5) // var = 1.5·0.25 − 0.25² = 0.3125 > 0
        const originalBleed = d.vec4f(0.9, 0.1, 0.2, 0.8)
        const out = watercolorCompose(
            s0, s, s, s, sq0, sqHi, sqHi, sqHi,
            invN, originalBleed, d.vec4f(1, 1, 1, 1), 0 /*paper*/, 1 /*strength*/, 0.5 /*grain*/,
        ) as unknown as {x: number; y: number; z: number}
        // paper=0 → result unchanged; strength=1 → finalRGB = picked mean = [0.5,0.5,0.5].
        expect(out.x).toBeCloseTo(0.5, 5)
        expect(out.y).toBeCloseTo(0.5, 5)
        expect(out.z).toBeCloseTo(0.5, 5)
    })

    it('strength=0 → output is the (unpremultiplied) original bleed rgb', () => {
        const invN = 0.25
        const s = d.vec4f(2, 2, 2, 4)
        const sq = d.vec3f(1.2, 1.2, 1.2)
        const originalBleed = d.vec4f(0.1, 0.2, 0.3, 0.8)
        const out = watercolorCompose(
            s, s, s, s, sq, sq, sq, sq,
            invN, originalBleed, d.vec4f(1, 1, 1, 1), 0.5 /*paper*/, 0 /*strength*/, 0.7 /*grain*/,
        ) as unknown as {x: number; y: number; z: number}
        expect(out.x).toBeCloseTo(0.1, 5)
        expect(out.y).toBeCloseTo(0.2, 5)
        expect(out.z).toBeCloseTo(0.3, 5)
    })
})
