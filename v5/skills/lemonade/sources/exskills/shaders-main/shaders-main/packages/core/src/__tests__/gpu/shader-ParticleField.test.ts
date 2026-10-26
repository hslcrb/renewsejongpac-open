import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ParticleField, {
    particleFieldSplatKernel,
    particleFieldResolveKernel,
    makeParticleFieldSimKernel,
    makeParticleFieldSplatKernel,
} from '@coreroot/shaders/ParticleField/index'

/**
 * ParticleField gate — a STYLIZE effect (requiresRTT + requiresChild) over child content. A
 * per-particle spring simulation reads the child RTT (late-bound via bindInputs, like DataMosh) to
 * set each particle's target Z from a baked depth channel, then projects + additively splats
 * depth-weighted color into four fixed-point atomic buffers, resolved to an rgba16f field the
 * fragment samples. GPU-free: a mock root answers allocations; kernels resolve standalone.
 */

function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {return buffer})}
    const texture = {$usage: vi.fn(function (this: unknown) {return texture}), destroy: vi.fn(), write: vi.fn()}
    const uniform = {buffer: {}, write: vi.fn(), patch: vi.fn()}
    const guarded = {with: vi.fn(function (this: unknown) {return guarded}), dispatchThreads: vi.fn()}
    return {
        createBuffer: vi.fn(() => buffer),
        createBindGroup: vi.fn(() => ({})),
        createTexture: vi.fn(() => texture),
        createUniform: vi.fn(() => uniform),
        createGuardedComputePipeline: vi.fn(() => guarded),
        device: {},
    } as never
}

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}
const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(genBody, 'genBody', []),
}

interface NodeSpec {id: string; def: GpuShaderDefinition; parentId: string | null; props?: Record<string, unknown>; metadata?: Partial<NodeMetadata>}

function bridgeFieldInits(def: GpuShaderDefinition, props: Record<string, unknown>, id: string): FieldInit[] {
    const map = createGpuUniformsMap(def as never, props, id)
    const inits: FieldInit[] = []
    for (const [name, u] of Object.entries(map)) inits.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
    return inits
}
function defaultsFor(def: GpuShaderDefinition): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(def.props)) out[name] = (cfg as {default: unknown}).default
    return out
}
function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; root: ReturnType<typeof mockRoot>} {
    const root = mockRoot()
    const store = createUniformStore(root, {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const props = {...defaultsFor(s.def), ...(s.props ?? {})}
        const propFields = bridgeFieldInits(s.def, props, s.id)
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.defineSystem()
    store.finalize()
    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) {
        nodes.set(s.id, {
            id: s.id, componentName: s.def.name, parentId: s.parentId, definition: s.def,
            metadata: {blendMode: 'normal', opacity: undefined, renderOrder: 0, ...s.metadata} as NodeMetadata,
            handles: handlesById[s.id],
        })
    }
    for (const s of specs) {
        if (s.parentId) {
            const arr = childrenByParent.get(s.parentId) ?? []
            arr.push(nodes.get(s.id)!)
            childrenByParent.set(s.parentId, arr)
        }
    }
    const rootNode = specs.find((s) => s.parentId === null)!
    const registry: RegistryView = {
        rootId: rootNode.id,
        getNode: (id) => nodes.get(id),
        getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: () => null,
        store,
    }
    return {registry, root}
}
const composeOpts = (root: unknown) => ({flipY: false, dimensions: {width: 800, height: 600}, gpu: {device: (root as {device: unknown}).device, root} as never})
const tree = (props?: Record<string, unknown>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'pf', def: ParticleField as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'pf', metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('ParticleField (a) compute simulation over child RTT → resolved field texture', () => {
    it('RTTs the child, registers the field (compute) texture, samples it in the fragment', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1) // the child RTT the sim reads
        const kinds = ir.textures.map((t) => t.kind)
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('the child input binds LATE (bindInputs) and the frame runs sim→splat→resolve (3 steps)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        const step = ir.computeSteps[0]
        expect(typeof step.bindInputs).toBe('function')
        // No compute nodes until the child RTT is bound (the pass manager does this post-alloc).
        expect(step.getComputeNodes(FRAME)).toBeNull()
        step.bindInputs?.(() => ({texture: {}}))
        expect(step.getComputeNodes(FRAME)?.length).toBe(3)
    })
})

describe('ParticleField (b) fragment fallback when compute is unavailable', () => {
    it('no compute textures → child passthrough (GPU-free)', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('ParticleField (c) kernels resolve (D3 rules)', () => {
    it('splat / resolve kernels resolve with atomics + textureStore', () => {
        for (const shape of ['dot', 'square', 'glow']) {
            const splat = tgpu.resolve([makeParticleFieldSplatKernel(shape)], {names: 'strict'})
            expect(splat).toMatch(/particleFieldSplat/)
            expect(splat).toMatch(/atomicAdd/)
        }
        expect(tgpu.resolve([particleFieldSplatKernel], {names: 'strict'})).toMatchSnapshot('splatKernel')
        const resolve = tgpu.resolve([particleFieldResolveKernel], {names: 'strict'})
        expect(resolve).toMatch(/particleFieldResolve/)
        expect(resolve).toMatch(/atomicLoad/)
        expect(resolve).toMatch(/atomicStore/) // resolve re-zeroes the accumulators (no clear pass)
        expect(resolve).toMatch(/textureStore/)
    })

    it('the sim kernel bakes the depth channel, samples the child, and runs the cursor physics', () => {
        const lum = tgpu.resolve([makeParticleFieldSimKernel(0)], {names: 'strict'})
        expect(lum).toMatch(/particleFieldSim/)
        expect(lum).toMatch(/textureLoad/) // bilinear child tap
        expect(lum).toMatch(/0\.29899999/) // luminance channel weights (f32-rounded)
        expect(lum).toMatch(/agentCursorMagnet/) // the shared kit force field (physical cursor)
        expect(lum).toMatchSnapshot('simKernel-luminance')
        const alpha = tgpu.resolve([makeParticleFieldSimKernel(6)], {names: 'strict'})
        expect(alpha).not.toMatch(/0\.29899999/) // alpha channel reads a component directly
    })
})

describe('ParticleField (d) compileTime baking + runtime count', () => {
    it('changing depthSource recomposes and still yields one compute step', () => {
        const {registry, root} = buildRegistry(tree({depthSource: 'saturation'}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        const step = ir.computeSteps[0]
        step.bindInputs?.(() => ({texture: {}}))
        expect(step.getComputeNodes(FRAME)?.length).toBe(3)
    })

    it('every particle shape variant composes', () => {
        for (const shape of ['dot', 'square', 'glow']) {
            const {registry, root} = buildRegistry(tree({particleShape: shape}))
            const ir = composeNodeTree(registry, composeOpts(root))
            expect(ir.computeSteps.length).toBe(1)
        }
    })

    it('count is runtime — any slider value runs the same 4-step program (no recompile)', () => {
        const {registry, root} = buildRegistry(tree({count: 3000}))
        const ir = composeNodeTree(registry, composeOpts(root))
        const step = ir.computeSteps[0]
        step.bindInputs?.(() => ({texture: {}}))
        expect(step.getComputeNodes(FRAME)?.length).toBe(3)
        expect(step.getComputeNodes({...FRAME, dimensions: {width: 1920, height: 400}})?.length).toBe(3)
    })
})
