import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Marble from '@coreroot/shaders/Marble/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Marble port gate (D1-G). Resolve+snapshot the 3-color noise-vein generator; assert the
 * animatedTime read + the two chained mixColors (A→B→C) + compile-time colorSpace. mx noise is
 * hash-based → GPU-only (resolve + smoke); no CPU golden.
 */
const M = Marble as GpuShaderDefinition

const resolveFinal = (props?: Record<string, unknown>, animTime?: number): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'm', def: M, parentId: 'root', props, metadata: {renderOrder: 0}, animTime},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('Marble (a) default 3-color generator', () => {
    it('emits the marble vein composition (turbulence + veinLadder) + the animated-time read + mixColors (chained A→B→C)', () => {
        const wgsl = resolveFinal()
        // The look lives in Marble/index.ts as std Expr algebra — no marble*/vein* kernels.
        expect(wgsl).not.toMatch(/marbleTurbulence|veinWave|veinLadder|veinDepth/)
        // Signature constants: the three decorrelated octaves (seed multipliers) + the vein sine.
        expect(wgsl).toMatch(/1\.7/)
        expect(wgsl).toMatch(/3\.1/)
        expect(wgsl.match(/mxNoiseFloat2\(/g)!.length).toBeGreaterThanOrEqual(5) // 1 def + 4 reads
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('Marble (b) compile-time colorSpace', () => {
    it('oklch back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveFinal({colorSpace: 'oklch'})).toMatch(/oklchToOklab/)
        expect(resolveFinal({colorSpace: 'linear'})).not.toMatch(/oklchToOklab/)
        const hash = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'm', def: M, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hash({colorSpace: 'linear'})).not.toBe(hash({colorSpace: 'oklch'}))
    })
})
