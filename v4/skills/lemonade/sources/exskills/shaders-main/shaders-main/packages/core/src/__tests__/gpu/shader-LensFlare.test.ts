import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import LensFlare from '@coreroot/shaders/LensFlare/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * LensFlare resolve gate — added with the lightfields extraction (this generator previously had NO
 * test). It pins the two things most at risk from a refactor: the SEVEN unrolled ghost configs (a JS
 * unroll, deliberately not a loop — a body cannot index a JS array) and the shared per-lobe math the
 * ghosts and the halo now both call.
 */
const L = LensFlare as GpuShaderDefinition

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'lf', def: L, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('LensFlare (a) default generator', () => {
    it('emits the flare stack + the animated-time read, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'lf', def: L, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)

        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/flareFrame/)
        expect(wgsl).toMatch(/lensFlareGhost/)
        expect(wgsl).toMatch(/flareHalo/)
        expect(wgsl).toMatch(/flareStarburst/)
        expect(wgsl).toMatch(/flareStreak/)
        expect(wgsl).toMatch(/flareGlare/)
        expect(wgsl).toMatch(/flareCore/)
        expect(wgsl).toMatch(/flareComposite/)
        expect(wgsl).toMatch(/lensFlareSpectral/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('shares the per-lobe kit math across the ghosts, halo, starburst and glare', () => {
        const wgsl = resolveFinal()
        // One chromatic ring band fn, called by both the ghost element and the halo.
        // TypeGPU 0.12 namespaces shared kit-facade helpers by their module (lightfields_, …).
        expect(wgsl.match(/fn lightfields_chromaticRingBand/g)).toHaveLength(1)
        expect(wgsl).toMatch(/fn lightfields_angularCosineSpikes/)
        expect(wgsl).toMatch(/fn lightfields_radialGaussianFalloff/)
        expect(wgsl).toMatch(/fn tone_luma601Dot/)
        expect(wgsl).toMatch(/fn geom_aspectOf/)
    })

    it('keeps the seven ghost configs unrolled at the call site', () => {
        const wgsl = resolveFinal()
        // 8 occurrences: the one `fn lensFlareGhost(` declaration plus seven call sites.
        expect(wgsl.match(/lensFlareGhost\(/g)!.length).toBe(8)
    })

    it('uses the full-precision TAU (the file shipped a truncated 6.2831853 — Gate C fix)', () => {
        const wgsl = resolveFinal()
        expect(wgsl).not.toMatch(/6\.2831853f/)
    })
})
