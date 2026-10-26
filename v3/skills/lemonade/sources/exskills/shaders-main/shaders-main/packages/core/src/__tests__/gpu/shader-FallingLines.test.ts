import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import FallingLines from '@coreroot/shaders/FallingLines/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * FallingLines port gate (D2-D) — an animated generator. Per-column hash streaks (`colHash`,
 * sin-fract → GPU-only) drifting by the `_animTime` accumulator, with fwidth AA (fragment-only) and
 * an elliptical rounded cap; the body returns `vec2(finalMask, balancedT)` and the builder mixes
 * trail→lead in the compile-time colorSpace (`mixColorsVariants[mode]`). fwidth + hash → GPU-only
 * (resolve + smoke, no CPU golden).
 */
const FL = FallingLines as GpuShaderDefinition

const build = (props: Record<string, unknown> = {}) =>
    buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'fl', def: FL, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])

describe('FallingLines (a) animated generator path', () => {
    it('rasterises streaks and mixes trail→lead — no RTT, reads _animTime', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/fallingLinesField/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatch(/fwidth/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (colorSpace: string) => collectStructuralHashInputs(build({colorSpace}).registry).join('\n')
        expect(hashWith('linear')).not.toBe(hashWith('oklch'))
    })
})
