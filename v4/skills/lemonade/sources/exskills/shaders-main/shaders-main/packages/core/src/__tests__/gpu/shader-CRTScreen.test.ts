import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import CRTScreen from '@coreroot/shaders/CRTScreen/index'
import {crtSampleUV} from '@coreroot/gpu/kit/motionBlur'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * CRTScreen port gate (D2-D) — an RTT FILTER (requiresRTT/requiresChild). Samples the child at
 * three chromatic-aberration UVs, then composes brightness/contrast + scanlines + phosphor +
 * vignette and unpremultiplies. crtCompose is deterministic but long → verified by resolve +
 * smoke; crtSampleUV (the sample offset) carries the CPU golden.
 */
const CRT = CRTScreen as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('CRTScreen (a) RTT filter path', () => {
    it('RTTs the child, samples chromatic offsets, composes CRT, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'crt', def: CRT, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'crt', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/crtSampleUV/)
        // The CRT stack, part by part: split combine → adjust → scanlines → phosphor → vignette.
        expect(finalWgsl).toMatch(/rgbSplitCombine/)
        expect(finalWgsl).toMatch(/adjustShade/)
        expect(finalWgsl).toMatch(/scanlineShade/)
        expect(finalWgsl).toMatch(/phosphorShade/)
        expect(finalWgsl).toMatch(/vignetteShade/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('CRTScreen (b) CPU golden — chromatic sample UV', () => {
    it('uv.x + colorShift*0.002*dir, uv.y unchanged', () => {
        const cases = [
            {uv: [0.5, 0.5] as const, colorShift: 1, dir: 1},
            {uv: [0.3, 0.7] as const, colorShift: 5, dir: -1},
        ]
        for (const {uv, colorShift, dir} of cases) {
            const ex = uv[0] + colorShift * 0.002 * dir
            const out = crtSampleUV(d.vec2f(uv[0], uv[1]), colorShift, dir) as unknown as {x: number; y: number}
            expect(out.x).toBeCloseTo(ex, 6)
            expect(out.y).toBeCloseTo(uv[1], 6)
        }
    })
})
