import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import LinearWipe from '@coreroot/shaders/LinearWipe/index'
import * as reveal from '@coreroot/gpu/kit/reveal'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * LinearWipe gate — pointwise alpha-mask transition (Vignette recipe, NO RTT). Multiplies the
 * straight-alpha child by a directional reveal mask; alpha scaled, RGB preserved.
 */
const LW = LinearWipe as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('LinearWipe (a) pointwise alpha-mask path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT, no unpremultiply', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'w', def: LW, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'w', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/directionalCoord/)
        expect(wgsl).toMatch(/revealMask/)
        expect(wgsl).toMatch(/applyReveal/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
    })
})

describe('LinearWipe (b) CPU golden', () => {
    const smoothstep = (e0: number, e1: number, x: number) => {
        const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
        return t * t * (3 - 2 * t)
    }
    it('progress 0 keeps the child fully visible; progress 1 wipes it to alpha 0', () => {
        const color = d.vec4f(0.8, 0.6, 0.4, 0.9)
        const run = (progress: number) =>
            reveal.applyReveal(color, reveal.revealMask(
                reveal.directionalCoord(d.vec2f(0.5, 0.5), 1, 0), progress, 0.1, -1,
            )) as unknown as {w: number}
        expect(run(0).w).toBeCloseTo(0.9, 4)
        expect(run(1).w).toBeCloseTo(0, 4)
    })
    it('at mid progress the reveal follows the aspect-corrected directional smoothstep', () => {
        const aspect = 2
        const progress = 0.5
        const feather = 0.1
        const uv = [0.3, 0.7] as const
        // angle 0 ⇒ dir (1,0); grad = (uv.x-0.5)*aspect; ext = 0.5*aspect; t = grad/(2ext)+0.5 = uv.x.
        const t = uv[0]
        const f = Math.max(feather, 0.0001)
        const front = progress * (1 + 2 * f) - f
        const expected = smoothstep(front - f, front + f, t)
        const out = reveal.applyReveal(d.vec4f(0.8, 0.6, 0.4, 1.0), reveal.revealMask(
            reveal.directionalCoord(d.vec2f(uv[0], uv[1]), aspect, 0), progress, feather, -1,
        )) as unknown as {w: number}
        expect(out.w).toBeCloseTo(expected, 4)
    })
})
