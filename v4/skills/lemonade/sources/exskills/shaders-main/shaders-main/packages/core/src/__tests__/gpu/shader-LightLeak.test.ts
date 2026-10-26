import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import LightLeak from '@coreroot/shaders/LightLeak/index'
import {lightfields} from '@coreroot/gpu/kit'

import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * LightLeak resolve gate — added with the lightfields extraction (this filter previously had NO
 * test). LightLeak is `requiresChild`, so the harness gives it a trivial generator sibling to consume.
 */
const LL = LightLeak as GpuShaderDefinition

const Generator: GpuShaderDefinition = {
    name: 'Gen',
    props: {} as never,
    fragment: (): Expr => ({_emit: () => 'vec4f(0.5, 0.5, 0.5, 1.0)'} as unknown as Expr),
}

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'll', def: LL, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'll', metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('LightLeak (a) over a child', () => {
    it('emits the composite + the extracted beam frame and anisotropic spot, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'll', def: LL, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'll', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)

        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // The composed parts: frame -> drift -> bloom + streaks -> dithered heat -> chromatic
        // ramp taps, screened over the child by the composite body.
        expect(wgsl).toMatch(/screenGlowComposite/)
        expect(wgsl).toMatch(/chromaticHeatTaps/)
        expect(wgsl).toMatch(/heatRamp3/)
        expect(wgsl).toMatch(/leakDrift/)
        expect(wgsl).toMatch(/leakBloom/)
        expect(wgsl).toMatch(/leakStreaks/)
        expect(wgsl).toMatch(/heatDither/)
        expect(wgsl).toMatch(/fn beamFrame/)
        expect(wgsl).toMatch(/_animTime/)
        // The shared kit primitives keep their module-prefixed names where nested in parts.
        expect(wgsl).toMatch(/fn lightfields_anisotropicGaussianSpot/)
        expect(wgsl).toMatch(/fn lightfields_streakBand/)
        expect(wgsl).toMatch(/fn tone_luma601Dot/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('reuses one anisotropic spot fn for both the main bloom and its shoulder', () => {
        const wgsl = resolveFinal()
        expect(wgsl.match(/fn lightfields_anisotropicGaussianSpot/g)).toHaveLength(1)
        expect(wgsl.match(/lightfields_anisotropicGaussianSpot\(/g)!.length).toBeGreaterThanOrEqual(3)
    })

    it('samples the color ramp three times at offset heats (the chromatic fringe)', () => {
        const wgsl = resolveFinal()
        expect(wgsl.match(/heatRamp3\(/g)!.length).toBeGreaterThanOrEqual(4)
    })
})

describe('LightLeak (b) the ramp is CPU-goldenable (pure float)', () => {
    const lightLeakRamp = lightfields.heatRamp3
    const hot = d.vec3f(1, 0.95, 0.77)
    const mid = d.vec3f(1, 0.48, 0.18)
    const fringe = d.vec3f(0.65, 0.24, 0.56)

    it('runs fringe → mid → hot as heat rises, scaled by heat', () => {
        // Zero heat emits nothing (the energy scale is the heat itself).
        const dark = lightLeakRamp(0, hot, mid, fringe) as d.v3f
        expect(dark.x).toBeCloseTo(0, 6)
        // Mid heat is past the fringe→mid transition but not yet hot.
        const middle = lightLeakRamp(0.5, hot, mid, fringe) as d.v3f
        expect(middle.y / 0.5).toBeGreaterThan(fringe.y)
        // Full overexposure lands on the hot core, energy-scaled above 1.
        const core = lightLeakRamp(1.4, hot, mid, fringe) as d.v3f
        expect(core.x).toBeGreaterThan(1)
    })

    it('clamps its energy scale at 1.6 so a runaway heat cannot blow up', () => {
        const a = lightLeakRamp(1.6, hot, mid, fringe) as d.v3f
        const b = lightLeakRamp(50, hot, mid, fringe) as d.v3f
        expect(b.x).toBeCloseTo(a.x, 6)
    })
})
