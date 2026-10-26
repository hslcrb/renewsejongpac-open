import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import BrightnessContrast from '@coreroot/shaders/BrightnessContrast/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {brightnessContrast} = colorOps

/**
 * BrightnessContrast port gate (D2-A) — inline color filter (see Invert for the recipe). v1's inline
 * `contrast: value + 1` transform is folded into the body (the bridge drops unregistered inline
 * transforms), so the CPU golden below reproduces `(rgb - 0.5) * (contrastRaw + 1) + 0.5 + brightness`.
 */
const BC = BrightnessContrast as GpuShaderDefinition

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
        {id: 'bc', def: BC, parentId: 'root', metadata: {renderOrder: 0}, props},
        {id: 'gen', def: Generator, parentId: 'bc', metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    expect(ir.rttPasses.length).toBe(0)
    return tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
}

describe('BrightnessContrast (a) inline color-filter path (NO RTT)', () => {
    it('brightness=0 + raw contrast=0 (both defaults): identity bypass, nothing emitted', () => {
        const wgsl = wgslFor()
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/brightnessContrast/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
    it('operates on the composed child inline — no RTT, no unpremultiply', () => {
        const wgsl = wgslFor({brightness: 0.25})
        expect(wgsl).toMatch(/brightnessContrast/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass-brightness025')
    })
})

describe('BrightnessContrast (b) CPU golden', () => {
    it('applies (rgb-0.5)*(contrastRaw+1)+0.5 + brightness, preserves alpha', () => {
        // brightness, contrastRaw defaults (0,0) must leave color unchanged: (c-0.5)*1+0.5 = c.
        const cases: {c: [number, number, number, number]; brightness: number; contrast: number}[] = [
            {c: [0.2, 0.4, 0.6, 0.8], brightness: 0, contrast: 0},
            {c: [0.2, 0.4, 0.6, 0.8], brightness: 0.1, contrast: 0.5},
            {c: [0.8, 0.5, 0.3, 0.5], brightness: -0.2, contrast: -0.4},
        ]
        for (const {c: [r, g, b, a], brightness, contrast: contrastRaw} of cases) {
            const contrast = contrastRaw + 1
            const f = (v: number) => (v - 0.5) * contrast + 0.5 + brightness
            const out = brightnessContrast(d.vec4f(r, g, b, a), brightness, contrastRaw) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(f(r), 5)
            expect(out.y).toBeCloseTo(f(g), 5)
            expect(out.z).toBeCloseTo(f(b), 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
