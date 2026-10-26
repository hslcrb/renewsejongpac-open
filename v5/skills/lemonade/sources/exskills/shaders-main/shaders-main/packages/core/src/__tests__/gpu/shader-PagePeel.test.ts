import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import PagePeel from '@coreroot/shaders/PagePeel/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * PagePeel port gate (D2-D) — an RTT FILTER (requiresRTT/requiresChild). Bakes the chosen corner
 * (compileTime cpu-only STRING, no transform — GradientMap-`palette` trap) into literal geometry
 * args, computes the peel geometry once, samples the child at the curl UV + the flat (screen) UV,
 * composites (lit curl over flat over cast shadow via select), and unpremultiplies.
 */
const PP = PagePeel as GpuShaderDefinition

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
        {id: 'pp', def: PP, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'pp', metadata: {renderOrder: 0}},
    ])

describe('PagePeel (a) RTT filter path', () => {
    it('RTTs the child, computes peel geometry, samples curl+flat, composites, unpremultiplies', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/pagePeelGeom/)
        expect(finalWgsl).toMatch(/pagePeelCompose/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('PagePeel (b) corner is a compile-time structural input', () => {
    it('different corners emit different WGSL (baked geometry) and different hashes', () => {
        const brWgsl = tgpu.resolve([composeNodeTree(build({corner: 'bottom-right'}).registry).finalPass.entry], {names: 'strict'})
        const tlWgsl = tgpu.resolve([composeNodeTree(build({corner: 'top-left'}).registry).finalPass.entry], {names: 'strict'})
        expect(brWgsl).not.toBe(tlWgsl)
        const hashBR = collectStructuralHashInputs(build({corner: 'bottom-right'}).registry).join('\n')
        const hashTL = collectStructuralHashInputs(build({corner: 'top-left'}).registry).join('\n')
        expect(hashBR).not.toBe(hashTL)
    })
})
