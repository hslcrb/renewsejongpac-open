import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import VenetianBlinds from '@coreroot/shaders/VenetianBlinds/index'
import * as reveal from '@coreroot/gpu/kit/reveal'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * VenetianBlinds gate — pointwise alpha-mask blinds (NO RTT). The directional coordinate is tiled
 * into strips via fract; each strip closes an identical soft band as progress grows.
 */
const VB = VenetianBlinds as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('VenetianBlinds (a) pointwise alpha-mask path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'w', def: VB, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'w', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/tilePhase/)
        expect(wgsl).toMatch(/directionalCoord/)
        expect(wgsl).toMatch(/revealMask/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
})

describe('VenetianBlinds (b) CPU golden', () => {
    it('progress 0 keeps every strip fully visible; progress 1 wipes all to alpha 0', () => {
        const color = d.vec4f(0.8, 0.6, 0.4, 0.9)
        const run = (progress: number) =>
            reveal.applyReveal(color, reveal.revealMask(
                reveal.tilePhase(reveal.directionalCoord(d.vec2f(0.37, 0.62), 1.5, 0), 12), progress, 0.15, -1,
            )) as unknown as {w: number}
        expect(run(0).w).toBeCloseTo(0.9, 4)
        expect(run(1).w).toBeCloseTo(0, 4)
    })
})
