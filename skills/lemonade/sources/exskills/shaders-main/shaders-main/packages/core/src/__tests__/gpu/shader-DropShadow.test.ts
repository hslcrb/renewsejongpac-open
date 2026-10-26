import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import DropShadow from '@coreroot/shaders/DropShadow/index'
import {dropShadowComposite} from '@coreroot/gpu/kit/motionBlur'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * DropShadow port gate (W6-C — the CUTOUT filter). An RTT filter: it RTTs the child, runs a two-pass
 * separable Gaussian blur of the alpha silhouette INLINE (an intermediate `convertToTexture` of the
 * horizontal pass → a 2nd RTT), then composites the shadow behind (normal) or replacing (cutout) the
 * child, in premultiplied space, unpremultiplied once. Two RTT passes prove the intermediate-Expr
 * convertToTexture chain. `cutout` is compile-time (recomposes on toggle).
 */
const DS = DropShadow as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

const withChild = (props: Record<string, unknown> = {}) =>
    buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'ds', def: DS, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'ds', metadata: {renderOrder: 0}},
    ]).registry

describe('DropShadow (a) two-pass inline blur + composite', () => {
    it('produces TWO RTT passes (child + horizontal blur) and unpremultiplies the composite', () => {
        const ir = composeNodeTree(withChild())
        // child RTT + the intermediate horizontal-blur RTT = 2 boundaries.
        expect(ir.rttPasses.length).toBe(2)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // The final pass composites (vertical blur taps + composite + unpremultiply)…
        expect(finalWgsl).toMatch(/dropShadowTapUV/)
        expect(finalWgsl).toMatch(/dropShadowComposite/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        // …and the shadow-offset UV (dropShadowUV) is emitted in the horizontal-blur RTT pass.
        const allWgsl = tgpu.resolve([ir.finalPass.entry, ...ir.rttPasses.map((p) => p.fragment.entry)], {names: 'strict'})
        expect(allWgsl).toMatch(/dropShadowUV/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('DropShadow (b) cutout is a compile-time structural-hash input', () => {
    const hashWith = (props: Record<string, unknown>) => collectStructuralHashInputs(withChild(props)).join('\n')
    it('toggling cutout changes the structural hash (recompose)', () => {
        expect(hashWith({cutout: true})).not.toBe(hashWith({cutout: false}))
    })
})

describe('DropShadow (c) CPU golden — the composite (normal vs cutout)', () => {
    // straight child (0.2,0.4,0.6,a), black shadow color (0,0,0,1), shadowAlpha 0.5.
    const shadowColor: [number, number, number, number] = [0, 0, 0, 1]
    const shadowAlpha = 0.5
    it('normal mode: original OVER premultiplied shadow', () => {
        const oc: [number, number, number, number] = [0.2, 0.4, 0.6, 1.0]
        const out = dropShadowComposite(d.vec4f(...oc), d.vec4f(...shadowColor), shadowAlpha, 0) as unknown as {x: number; y: number; z: number; w: number}
        // origA=1 → oneMinusOrigA=0 → shadow contributes nothing; result = original, a=max(1,1)=1.
        expect(out.x).toBeCloseTo(0.2, 5)
        expect(out.w).toBeCloseTo(1, 5)
    })
    it('cutout mode: shadow only, silhouette punched out', () => {
        const oc: [number, number, number, number] = [0.9, 0.9, 0.9, 0.0] // transparent pixel outside the silhouette
        const out = dropShadowComposite(d.vec4f(...oc), d.vec4f(...shadowColor), shadowAlpha, 1) as unknown as {x: number; y: number; z: number; w: number}
        // shadowA = 1*0.5 = 0.5; cutoutA = clamp(0.5 - 0, 0,1) = 0.5.
        expect(out.w).toBeCloseTo(0.5, 5)
    })
})
