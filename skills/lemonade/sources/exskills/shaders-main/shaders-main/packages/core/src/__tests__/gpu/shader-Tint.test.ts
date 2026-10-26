import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Tint from '@coreroot/shaders/Tint/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {tintPlain, tintPreserveLuma} = colorOps

/**
 * Tint port gate (W6-A) — inline color filter. `preserveLuminosity` is a compile-time branch: only
 * the chosen body (tintPreserveLuma / tintPlain) emits, and the flag is in the structural hash.
 */
const TINT = Tint as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

function irFor(props?: Record<string, unknown>) {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 't', def: TINT, parentId: 'root', metadata: {renderOrder: 0}, props},
        {id: 'gen', def: Generator, parentId: 't', metadata: {renderOrder: 0}},
    ])
    return composeNodeTree(registry)
}

describe('Tint (a) compile-time preserveLuminosity branch', () => {
    it('default (preserve=true): emits tintPreserveLuma, no RTT/unpremultiply', () => {
        const ir = irFor()
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/tintPreserveLuma/)
        expect(wgsl).not.toMatch(/tintPlain/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).toMatchSnapshot('final-pass-preserve')
    })
    it('preserve=false: emits tintPlain instead', () => {
        const ir = irFor({preserveLuminosity: false})
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/tintPlain/)
        expect(wgsl).not.toMatch(/tintPreserveLuma/)
    })
    it('preserveLuminosity is in the structural hash', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 't', def: TINT, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 't', metadata: {renderOrder: 0}},
        ])
        const inputs = collectStructuralHashInputs(registry)
        expect(JSON.stringify(inputs)).toMatch(/preserveLuminosity/)
    })
})

describe('Tint (b) CPU golden', () => {
    const mix = (a: number, b: number, t: number) => a + (b - a) * t
    it('plain: mix child rgb toward tint rgb, alpha preserved', () => {
        const [r, g, b, a] = [0.2, 0.5, 0.8, 0.7]
        const [tr, tg, tb] = [1.0, 0.3, 0.0]
        const amount = 0.4
        const out = tintPlain(d.vec4f(r, g, b, a), d.vec4f(tr, tg, tb, 1), amount) as unknown as {x: number; y: number; z: number; w: number}
        expect(out.x).toBeCloseTo(mix(r, tr, amount), 5)
        expect(out.y).toBeCloseTo(mix(g, tg, amount), 5)
        expect(out.z).toBeCloseTo(mix(b, tb, amount), 5)
        expect(out.w).toBeCloseTo(a, 5)
    })
    it('preserve: rescale tinted to the original luminance', () => {
        const [r, g, b, a] = [0.2, 0.5, 0.8, 0.7]
        const [tr, tg, tb] = [1.0, 0.3, 0.0]
        const amount = 0.4
        const lw = [0.299, 0.587, 0.114]
        const tinted = [mix(r, tr, amount), mix(g, tg, amount), mix(b, tb, amount)]
        const origLum = lw[0] * r + lw[1] * g + lw[2] * b
        const tintedLum = lw[0] * tinted[0] + lw[1] * tinted[1] + lw[2] * tinted[2]
        const k = origLum / Math.max(tintedLum, 0.0001)
        const out = tintPreserveLuma(d.vec4f(r, g, b, a), d.vec4f(tr, tg, tb, 1), amount) as unknown as {x: number; y: number; z: number; w: number}
        expect(out.x).toBeCloseTo(tinted[0] * k, 5)
        expect(out.y).toBeCloseTo(tinted[1] * k, 5)
        expect(out.z).toBeCloseTo(tinted[2] * k, 5)
        expect(out.w).toBeCloseTo(a, 5)
    })
})
