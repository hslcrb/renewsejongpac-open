import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import KeyFrames from '@coreroot/shaders/KeyFrames/index'
import {buildPursuitKernel as buildTrackKernel, trackHash} from '@coreroot/gpu/kit/trackerSim'
import {buildComputeRegistry, childTree, composeNodeTree, withGpu, FRAME} from './helpers/computeRegistry'

/**
 * KeyFrames port gate — a motion TRACKER on the `createFeedbackTrailSim` scaffold. The state is a
 * ping-pong pair of tracker-ROW textures (one row per tracker, rgba32float) plus a `present` copy
 * the raw-WGSL overlay reads; an orientation-independent feature-grid texture is written by a
 * second pass each frame. The child RTT is late-bound. GPU-free throughout.
 */

const tree = (props?: Record<string, unknown>) => childTree(KeyFrames as GpuShaderDefinition, 'kf', props)

describe('KeyFrames (a) feature grid + tracker sim → overlay', () => {
    it('RTTs the child, registers the tracker-state texture, and draws over the child', () => {
        const {registry, root} = buildComputeRegistry(tree())
        const ir = composeNodeTree(registry, withGpu(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureLoad\(compute_0, vec2u\(0u, ti\)/) // per-tracker row loads
        expect(finalWgsl).toMatch(/for \(var ti = 0u/) // ONE draw body in a runtime loop
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('is child-dependent → exposes bindInputs; yields the feature + sim passes once bound', () => {
        const {registry, root} = buildComputeRegistry(tree())
        const step = composeNodeTree(registry, withGpu(root)).computeSteps[0]
        expect(step.bindInputs).toBeDefined()
        expect(step.getComputeNodes(FRAME)).toBeNull()
        step.bindInputs!((key: string) => ({texture: {key}}))
        // Feature-grid scoring pass, then the per-tracker pursuit pass.
        expect(step.getComputeNodes(FRAME)?.length).toBe(2)
    })
})

describe('KeyFrames (b) fragment fallback when compute is unavailable', () => {
    it('draws no gizmos (child passthrough) with no compute textures', () => {
        const {registry} = buildComputeRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('KeyFrames (c) detect-mode kernel variants resolve', () => {
    it('every detect mode bakes its own score fn', () => {
        for (const mode of ['bright', 'dark', 'alpha', 'red', 'green', 'blue']) {
            const wgsl = tgpu.resolve([buildTrackKernel(mode)], {names: 'strict'})
            expect(wgsl).toMatch(new RegExp(`featureScore_${mode}`))
            expect(wgsl).toMatch(/textureStore/)
        }
    })

    it('the tracker hash is CPU-executable and stays in [0, 1)', () => {
        for (const x of [1.5, 42.25, 311.7]) {
            const h = trackHash(x) as unknown as number
            expect(h).toBeGreaterThanOrEqual(0)
            expect(h).toBeLessThan(1)
        }
    })
})
