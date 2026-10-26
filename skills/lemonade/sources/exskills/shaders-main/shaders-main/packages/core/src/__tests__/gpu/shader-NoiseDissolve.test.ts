import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import NoiseDissolve from '@coreroot/shaders/NoiseDissolve/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * NoiseDissolve gate — pointwise alpha-mask fbm dissolve (NO RTT). All props are runtime
 * uniforms, so different prop values must resolve to identical WGSL.
 */
const ND = NoiseDissolve as GpuShaderDefinition

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
        {id: 'w', def: ND, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'w', metadata: {renderOrder: 0}},
    ])

describe('NoiseDissolve (a) pointwise alpha-mask path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/fbmCoverageCoord/)
        expect(wgsl).toMatch(/revealMask/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
})

describe('NoiseDissolve (b) fully runtime-uniform — no structural recompiles', () => {
    it('different prop values resolve to identical WGSL', () => {
        const a = tgpu.resolve([composeNodeTree(build({progress: 0.2, scale: 1, seed: 0, invert: false}).registry).finalPass.entry], {names: 'strict'})
        const b = tgpu.resolve([composeNodeTree(build({progress: 0.9, scale: 12, seed: 42, invert: true}).registry).finalPass.entry], {names: 'strict'})
        expect(a).toBe(b)
    })
})
