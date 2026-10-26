import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import DataMosh, {moshKernel} from '@coreroot/shaders/DataMosh/index'
import {buildComputeRegistry, childTree, composeNodeTree, withGpu, FRAME} from './helpers/computeRegistry'

/**
 * DataMosh port gate — a corrupted-codec feedback SIMULATION on the `createFeedbackTrailSim`
 * scaffold: two rgba16float ping-pong state textures + a display copy the fragment samples, with
 * the child RTT late-bound (its physical texture is allocated after composition). GPU-free: a mock
 * root answers allocations; with no device the fragment falls back to a live passthrough.
 */

const tree = (props?: Record<string, unknown>) => childTree(DataMosh as GpuShaderDefinition, 'dm', props)

describe('DataMosh (a) feedback compute → display copy → live/moshed mix', () => {
    it('RTTs the child, registers a display (compute) texture, and samples both', () => {
        const {registry, root} = buildComputeRegistry(tree())
        const ir = composeNodeTree(registry, withGpu(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample\(compute_0/) // the moshed state
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/) // the live child
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('is child-dependent → exposes bindInputs; yields 1 step per frame once bound', () => {
        const {registry, root} = buildComputeRegistry(tree())
        const step = composeNodeTree(registry, withGpu(root)).computeSteps[0]
        expect(step.bindInputs).toBeDefined()
        // Before the child RTT exists there is nothing to read, so the pass is a no-op.
        expect(step.getComputeNodes(FRAME)).toBeNull()
        step.bindInputs!((key: string) => ({texture: {key}}))
        expect(step.getComputeNodes(FRAME)?.length).toBe(1)
        expect(step.getComputeNodes(FRAME)?.length).toBe(1) // and again on the swapped orientation
    })
})

describe('DataMosh (b) fragment fallback when compute is unavailable', () => {
    it('live passthrough (unpremultiplied) with no compute textures', () => {
        const {registry} = buildComputeRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('DataMosh (c) kernel resolves (compute-simulation rules)', () => {
    it('the decoder step resolves, writing both the next state and the display copy', () => {
        const wgsl = tgpu.resolve([moshKernel], {names: 'strict'})
        expect(wgsl).toMatch(/dataMoshStep/)
        expect((wgsl.match(/textureStore/g) ?? []).length).toBe(2)
        // The child's size comes from the texture itself, never from CPU dimensions.
        expect(wgsl).toMatch(/textureDimensions/)
        expect(wgsl).toMatchSnapshot('moshKernel')
    })

    // NO CPU execution of moshHash: it now delegates to `noise.hash11` (integer bitcast via raw
    // WGSL `bitcast<u32>` — the iOS-safe hash), which is GPU-only; the moshKernel snapshot covers it.
})
