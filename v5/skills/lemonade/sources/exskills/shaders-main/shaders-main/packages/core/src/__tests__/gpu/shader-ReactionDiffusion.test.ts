import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import {updateFieldValue, type FieldHandle} from '@coreroot/gpu/uniformStore'
import ReactionDiffusion, {reactionKernel, reactionKernelChild, seedKernel, outputKernel} from '@coreroot/shaders/ReactionDiffusion/index'
import {buildComputeRegistry, childTree, RootContainer, composeNodeTree, withGpu, FRAME, type NodeSpec} from './helpers/computeRegistry'

/**
 * ReactionDiffusion port gate — a Gray-Scott sim ping-ponging two vec2f state BUFFERS, with an
 * optional child whose luminance biases feed/kill per cell.
 *
 * The two reaction variants are emitted from ONE kernel factory (their bind-group layouts differ by
 * a texture entry, which a WebGPU pipeline layout cannot make optional), so the gate checks that
 * both still resolve under their own names and that only the child variant carries the drive fn.
 */

const RD = ReactionDiffusion as GpuShaderDefinition
const generatorTree = (): NodeSpec[] => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'rd', def: RD, parentId: 'root', metadata: {renderOrder: 0}},
]
const childedTree = () => childTree(RD, 'rd')

describe('ReactionDiffusion (a) generator (childless) path', () => {
    it('registers the field texture, samples it, and dispatches seed + reactions + output', () => {
        const {registry, root} = buildComputeRegistry(generatorTree())
        const ir = composeNodeTree(registry, withGpu(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.textures.some((t) => t.kind === 'compute')).toBe(true)
        const step = ir.computeSteps[0]
        // Child-independent → binds immediately, no bindInputs.
        expect(step.bindInputs).toBeUndefined()
        // First frame: seed + `speed` reaction iterations (default 6) + the output copy.
        expect(step.getComputeNodes(FRAME)?.length).toBe(8)
        // Subsequent frames drop the seed.
        expect(step.getComputeNodes(FRAME)?.length).toBe(7)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/sampleUV/) // cover + aspect + feature-size fit (a bound local)
        expect(finalWgsl).toMatch(/lightDir/) // the relief shading path
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('re-seeds (and resets the ping-pong orientation) when the preset changes', () => {
        const {registry, root} = buildComputeRegistry(generatorTree())
        const step = composeNodeTree(registry, withGpu(root)).computeSteps[0]
        expect(step.getComputeNodes(FRAME)?.length).toBe(8) // seeded
        expect(step.getComputeNodes(FRAME)?.length).toBe(7)
        // The hook re-reads `preset` off the LIVE uniform handle every frame, so switching regimes
        // mid-run must push the seed dispatch back in front of the reactions (8 again, then 7).
        updateFieldValue(registry.getNode('rd')!.handles.preset as FieldHandle, 'mitosis')
        expect(step.getComputeNodes(FRAME)?.length).toBe(8)
        expect(step.getComputeNodes(FRAME)?.length).toBe(7)
    })
})

describe('ReactionDiffusion (b) child-modulated path', () => {
    it('binds the child RTT late and waits for it before dispatching anything', () => {
        const {registry, root} = buildComputeRegistry(childedTree())
        const step = composeNodeTree(registry, withGpu(root)).computeSteps[0]
        expect(step.bindInputs).toBeDefined()
        expect(step.getComputeNodes(FRAME)).toBeNull()
        step.bindInputs!((key: string) => ({texture: {key}}))
        expect(step.getComputeNodes(FRAME)?.length).toBe(8)
    })
})

describe('ReactionDiffusion (c) kernels resolve (one factory, two variants)', () => {
    it('the generator variant carries no drive map; the child variant does', () => {
        const gen = tgpu.resolve([reactionKernel], {names: 'strict'})
        expect(gen).toMatch(/reactionDiffusionReact\b/)
        expect(gen).toMatch(/reactionDiffusionNbr\b/)
        expect(gen).not.toMatch(/DriveMap/)
        expect(gen).toMatchSnapshot('reactionKernel')

        const child = tgpu.resolve([reactionKernelChild], {names: 'strict'})
        expect(child).toMatch(/reactionDiffusionReactDrive/)
        expect(child).toMatch(/reactionDiffusionNbrDrive/)
        expect(child).toMatch(/reactionDiffusionDriveMap/)
        expect(child).toMatchSnapshot('reactionKernelChild')
    })

    it('seed + output kernels resolve', () => {
        expect(tgpu.resolve([seedKernel], {names: 'strict'})).toMatch(/reactionDiffusionSeed/)
        const out = tgpu.resolve([outputKernel], {names: 'strict'})
        expect(out).toMatch(/reactionDiffusionOutput/)
        expect(out).toMatch(/textureStore/)
    })
})

// The color-ramp position (smoothstep band narrowed by contrast around threshold) is
// declaration-site algebra now — its math is pinned by the final-pass snapshot above.
