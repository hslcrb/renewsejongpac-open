import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import RadialWipe from '@coreroot/shaders/RadialWipe/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * RadialWipe gate — pointwise alpha-mask clock sweep (NO RTT). `direction` is a compileTime
 * cpu-only string baked to a mode literal, so different directions emit different WGSL + hashes.
 */
const RW = RadialWipe as GpuShaderDefinition

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
        {id: 'w', def: RW, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'w', metadata: {renderOrder: 0}},
    ])

describe('RadialWipe (a) pointwise alpha-mask path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/angularCoord/)
        expect(wgsl).toMatch(/revealMask/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
})

describe('RadialWipe (b) direction is a compile-time structural input', () => {
    it('cw / ccw / both bake different mode literals → different WGSL + hashes', () => {
        const cw = tgpu.resolve([composeNodeTree(build({direction: 'cw'}).registry).finalPass.entry], {names: 'strict'})
        const both = tgpu.resolve([composeNodeTree(build({direction: 'both'}).registry).finalPass.entry], {names: 'strict'})
        expect(cw).not.toBe(both)
        const hashCw = collectStructuralHashInputs(build({direction: 'cw'}).registry).join('\n')
        const hashBoth = collectStructuralHashInputs(build({direction: 'both'}).registry).join('\n')
        expect(hashCw).not.toBe(hashBoth)
    })
})
