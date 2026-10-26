import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {
    buildSpectralHeightField, makeWaveEquationKernel, makeHeightFieldMarchKernel,
} from '@coreroot/gpu/scaffolds/heightField'

/**
 * Height-field surface machine (gpu/scaffolds/heightField) — kernel resolve gates (D3 rules),
 * relocated from the Surface3D shader gate when the kernels moved into the scaffold. Covers the
 * march kernel across its baked config axes (spectral family, lighting, cursor layer) and the
 * wave-equation propagation step.
 */
describe('heightField scaffold kernels resolve (D3 rules)', () => {
    it('march (fractal, lighting+cursor) + propagate resolve; sine/ridge + off-variants build', () => {
        const opts = {edgeMode: 2, marchSteps: 16, marchRefine: 6, computeW: 1600, computeH: 900}
        const raymarch = tgpu.resolve([makeHeightFieldMarchKernel({...opts, waveType: 0, octaveCount: 2, lightingEnabled: true, cursorEnabled: true})], {names: 'strict'})
        expect(raymarch).toMatch(/heightFieldMarch/)
        expect(raymarch).toMatch(/spectralHeightField/)
        expect(raymarch).toMatch(/textureStore/)
        expect(tgpu.resolve([makeWaveEquationKernel()], {names: 'strict'})).toMatch(/waveEquationStep/)
        // Sine (1) + ridge (2) heightfields + lighting-off + cursor-off variants all resolve.
        expect(tgpu.resolve([makeHeightFieldMarchKernel({...opts, waveType: 1, octaveCount: 3, edgeMode: 0, lightingEnabled: false, cursorEnabled: false})], {names: 'strict'})).toMatch(/heightFieldMarch/)
        expect(tgpu.resolve([makeHeightFieldMarchKernel({...opts, waveType: 2, octaveCount: 2, edgeMode: 1, lightingEnabled: true, cursorEnabled: false})], {names: 'strict'})).toMatch(/heightFieldMarch/)
        // The bare spectral heightfield resolves standalone (any consumer can bake one).
        expect(tgpu.resolve([buildSpectralHeightField(0, 2, false)], {names: 'strict'})).toMatch(/spectralHeightField/)
    })
})
