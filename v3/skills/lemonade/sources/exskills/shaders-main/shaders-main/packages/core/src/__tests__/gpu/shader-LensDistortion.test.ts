import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import LensDistortion from '@coreroot/shaders/LensDistortion/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * LensDistortion gate — a Paper Shaders port: an RTT FILTER (requiresRTT/requiresChild, no uvRemap)
 * whose runtime `count` uniform (2–50 color layers) drives a raw-WGSL loop sampling the child RTT
 * once per layer via textureSampleLevel (LOD 0 — derivative-free, legal in any control flow; the
 * fwidth/dpdx edge-AA + grain footprints are computed BEFORE the loop). The layers accumulate
 * over-white with per-layer hue weights, the alpha is reconstructed from the ground level, and the
 * premultiplied result is unpremultiplied on the way out (RTT stores premultiplied alpha).
 */
const LD = LensDistortion as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('LensDistortion — runtime layer loop over the child RTT', () => {
    const resolve = (props: Record<string, unknown> = {}): {final: string; rtt: string; rttCount: number} => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'lens', def: LD, parentId: 'root', props, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'lens', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        return {
            final: tgpu.resolve([ir.finalPass.entry], {names: 'strict'}),
            rtt: tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'}),
            rttCount: ir.rttPasses.length,
        }
    }

    it('RTTs the child and samples it in a runtime loop with explicit-LOD taps', () => {
        const {final, rtt, rttCount} = resolve()
        expect(rttCount).toBe(1)
        // Runtime loop bounded by the count uniform.
        expect(final).toMatch(/for\s*\(var/)
        // textureSampleLevel (not textureSample) — per-tap samples inside loop control flow.
        expect(final).toMatch(/textureSampleLevel\(rtt_/)
        // Derivative work stays outside the loop.
        expect(final).toMatch(/fwidth/)
        // Premultiplied accumulation → straight alpha out.
        expect(final).toMatch(/unpremultiplyAlpha/)
        expect(rtt).toMatch(/genBody/)
        expect(final).toMatchSnapshot('final-pass')
    })

    it('all effect props are runtime uniforms (no compile-time recompile boundaries)', () => {
        // Same structural WGSL regardless of prop values — everything routes through uniforms.
        const a = resolve()
        const b = resolve({center: {x: 0.2, y: 0.7}, spread: 0.1, bias: -1, count: 7, lensBulge: 0.9, lensCircle: 1, noise: 1, grainMixer: 0.5, grainOverlay: 0.5})
        expect(a.final).toEqual(b.final)
    })
})
