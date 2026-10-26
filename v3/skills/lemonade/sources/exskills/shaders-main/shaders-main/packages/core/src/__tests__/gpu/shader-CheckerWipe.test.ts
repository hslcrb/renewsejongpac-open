import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import CheckerWipe from '@coreroot/shaders/CheckerWipe/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * CheckerWipe gate — pointwise alpha-mask checkerboard (NO RTT). All props are runtime
 * uniforms, so different prop values must resolve to identical WGSL.
 */
const CW = CheckerWipe as GpuShaderDefinition

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
        {id: 'w', def: CW, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'w', metadata: {renderOrder: 0}},
    ])

describe('CheckerWipe (a) pointwise alpha-mask path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/cellCheckerCoord/)
        expect(wgsl).toMatch(/revealMask/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
})

describe('CheckerWipe (b) fully runtime-uniform — no structural recompiles', () => {
    it('different prop values resolve to identical WGSL', () => {
        const a = tgpu.resolve([composeNodeTree(build({progress: 0.2, blockSize: 0.05, invert: false}).registry).finalPass.entry], {names: 'strict'})
        const b = tgpu.resolve([composeNodeTree(build({progress: 0.9, blockSize: 0.3, invert: true}).registry).finalPass.entry], {names: 'strict'})
        expect(a).toBe(b)
    })
})
