import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Saturation from '@coreroot/shaders/Saturation/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {saturate} = colorOps

/**
 * Saturation port gate (W6-A) — inline color filter (see Invert for the recipe). Rec.709 luminance
 * mix. intensity=1 is a compile-time IDENTITY BYPASS (returns the child untouched, HueShift pattern).
 */
const SATURATION = Saturation as GpuShaderDefinition

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
        {id: 's', def: SATURATION, parentId: 'root', metadata: {renderOrder: 0}, props},
        {id: 'gen', def: Generator, parentId: 's', metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    expect(ir.rttPasses.length).toBe(0)
    return tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
}

describe('Saturation (a) inline path + identity bypass', () => {
    it('intensity=1 (default): identity bypass — no saturate emitted', () => {
        const wgsl = wgslFor()
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/saturate/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
    it('intensity≠1: emits saturate, still no RTT/unpremultiply', () => {
        const wgsl = wgslFor({intensity: 2})
        expect(wgsl).toMatch(/saturate/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).toMatchSnapshot('final-pass-intensity2')
    })
})

describe('Saturation (b) CPU golden', () => {
    it('lerps between Rec.709 gray and original by intensity, preserves alpha', () => {
        const cases: [number, number, number, number, number][] = [
            [0.2, 0.4, 0.6, 0.8, 0],
            [0.9, 0.1, 0.3, 1, 2],
            [0.5, 0.5, 0.5, 0.3, 1.5],
        ]
        for (const [r, g, b, a, intensity] of cases) {
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            const out = saturate(d.vec4f(r, g, b, a), intensity) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(lum + (r - lum) * intensity, 5)
            expect(out.y).toBeCloseTo(lum + (g - lum) * intensity, 5)
            expect(out.z).toBeCloseTo(lum + (b - lum) * intensity, 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
