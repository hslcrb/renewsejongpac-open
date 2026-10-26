import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Aurora from '@coreroot/shaders/Aurora/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Aurora gate — the look lives in Aurora/index.ts as std Expr algebra (no aurora* kernels).
 * Resolve+snapshot the layered-curtain generator; assert the animatedTime read, the chained
 * mixColors ladder (A→B→C), the compile-time 4-curtain emission, and both compile-time props
 * (colorSpace + curtainCount) in the recompile hash. mx noise is hash-based → GPU-only
 * (resolve + smoke); the WGSL snapshot carries the full curtain math.
 */
const A = Aurora as GpuShaderDefinition

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'a', def: A, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}
const hash = (props: Record<string, unknown>) => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'a', def: A, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return collectStructuralHashInputs(registry).join('\n')
}

describe('Aurora (a) default generator', () => {
    it('emits the std-composed look (inline curtain algebra) + the animated-time read + mixColors', () => {
        const wgsl = resolveFinal()
        // The look lives in Aurora/index.ts — no aurora*/curtain* kernels remain.
        expect(wgsl).not.toMatch(/auroraField|auroraCurtain|curtainArc/)
        // Signature constants: the hashed-phase schedule and the mx-noise word, ×4 curtains.
        expect(wgsl).toMatch(/4758\.5/)
        expect(wgsl).toMatch(/mxNoiseFloat3/)
        expect(wgsl.match(/mxNoiseFloat3\(/g)!.length).toBeGreaterThanOrEqual(5) // 1 def + 4 curtains
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
    it('curtainCount is compile-time: one curtain emits one noise read', () => {
        const wgsl = resolveFinal({curtainCount: 1})
        expect(wgsl.match(/mxNoiseFloat3\(/g)!.length).toBe(2) // 1 def + 1 curtain
    })
})

describe('Aurora (b) compile-time props (colorSpace + curtainCount)', () => {
    it('oklab back-converts and both compile-time props are in the recompile hash', () => {
        expect(resolveFinal({colorSpace: 'oklab'})).toMatch(/oklabToRgb/)
        expect(hash({colorSpace: 'linear'})).not.toBe(hash({colorSpace: 'oklab'}))
        expect(hash({curtainCount: 4})).not.toBe(hash({curtainCount: 1}))
    })
})
