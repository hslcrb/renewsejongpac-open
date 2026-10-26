import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Godrays from '@coreroot/shaders/Godrays/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Godrays resolve gate — added with the lightfields extraction (this generator previously had NO
 * test, so its `seamlessAngularField` adoption had nothing to diff against).
 *
 * Godrays keeps its OWN sin-fract value noise rather than adopting `kit/noise`: swapping hash
 * families is a pixel change (D-6) and was not approved here. The gate asserts that too, so a future
 * "cleanup" cannot quietly change the look.
 */
const G = Godrays as GpuShaderDefinition

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'g', def: G, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('Godrays (a) default generator', () => {
    it('emits the frame -> ray stack -> coverage composite + the seam-free angular field + the animated-time read, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'g', def: G, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)

        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/godraysFrame/)
        expect(wgsl).toMatch(/godraysRayStack/)
        expect(wgsl).toMatch(/coverageOver/)
        expect(wgsl).toMatch(/godraysRaysShape/)
        expect(wgsl).toMatch(/_animTime/)
        // The promoted kit primitive: both atan2 branches plus the cross-fade weight.
        // TypeGPU 0.12 namespaces shared kit-facade helpers by their module (lightfields_, geom_, …).
        expect(wgsl).toMatch(/fn lightfields_seamlessAngularField/)
        // The guarded aspect divide.
        expect(wgsl).toMatch(/fn geom_aspectOf/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('keeps its own sin-fract value noise (NOT kit/noise — hash unification is a pixel change, D-6)', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/godraysHash/)
        expect(wgsl).toMatch(/godraysValueNoise/)
        expect(wgsl).not.toMatch(/mxNoiseFloat/)
        expect(wgsl).not.toMatch(/perlin13/)
    })

    it('both ray layers stay unconditional (a branch across the seam would be visible)', () => {
        const wgsl = resolveFinal()
        // Four shape evaluations: two godraysRayLayer calls × two radii inside the layer body,
        // none of them behind an `if`. (The layer part is called, so the shape count is per-body.)
        expect(wgsl.match(/godraysRayLayer\(/g)!.length).toBeGreaterThanOrEqual(3) // 1 def + 2 calls
        expect(wgsl.match(/godraysRaysShape\(/g)!.length).toBeGreaterThanOrEqual(3) // 1 def + 2 in-layer calls
        expect(wgsl).not.toMatch(/if\s*\(.*godraysRay/)
    })
})
