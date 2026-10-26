import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Boids, {
    boidsInitKernel,
    boidsSplatKernel,
    boidsResolveKernel,
    boidsUpdateKernel,
    makeBoidsSplatKernel,
    makeBoidsResolveKernel,
} from '@coreroot/shaders/Boids/index'

/**
 * Boids gate — a brute-force Reynolds flocking sim on a per-agent (pos/vel) storage buffer: an
 * O(N²) neighbour scan (static MAX bound + runtime-count break) drives separation / alignment /
 * cohesion steering (plus cursor + soft edges) and an agitation envelope, agents are rendered as
 * oriented SDF shapes (arrow / streak / dot / glow, baked per variant) by additive fixed-point
 * atomic splats, and the resolve mixes rest→excited colors in the baked color space and blends into
 * a persistent trail canvas → rgba16f texture sampled full-canvas in the fragment. GPU-free: a mock
 * root answers allocations; kernels are resolved standalone.
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

const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? (undefined as never),
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
    {id: 'bd', def: Boids as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('Boids (a) compute simulation → resolved texture', () => {
    it('registers the boids (compute) texture and samples it in the fragment (GENERATOR)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(0) // generator — no child
        expect(ir.textures.map((t) => t.kind)).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('first frame prepends the one-shot init; steady state runs the 3-step frame program', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        // getComputeNodes is stateful: the first call latches `initialized`, so call order matters.
        const firstFrameNodes = ir.computeSteps[0].getComputeNodes(FRAME)
        expect(firstFrameNodes?.length).toBe(4) // init + 3
        const steadyStateNodes = ir.computeSteps[0].getComputeNodes(FRAME)
        expect(steadyStateNodes?.length).toBe(3) // update, splat, resolve (resolve self-clears)
    })

    it('count is runtime — any slider value composes and runs the same program (no recompile)', () => {
        const {registry, root} = buildRegistry(tree({count: 700}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(4)
    })

    it('every agent shape variant composes', () => {
        for (const shape of ['arrow', 'streak', 'dot', 'square', 'glow']) {
            const {registry, root} = buildRegistry(tree({agentShape: shape}))
            const ir = composeNodeTree(registry, composeOpts(root))
            expect(ir.computeSteps.length).toBe(1)
        }
    })
})

describe('Boids (b) fragment fallback when compute is unavailable', () => {
    it('transparent output, no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('Boids (c) kernels resolve (D3 rules)', () => {
    it('the init kernel resolves with storage buffers; the resolve kernel self-clears the accumulators', () => {
        const init = tgpu.resolve([boidsInitKernel], {names: 'strict'})
        expect(init).toMatch(/boidsInit/)
        const resolve = tgpu.resolve([boidsResolveKernel], {names: 'strict'})
        expect([...resolve.matchAll(/atomicStore/g)].length).toBe(2)
    })

    it('every shape variant of the render splat resolves and accumulates atomically', () => {
        for (const shape of ['arrow', 'streak', 'dot', 'square', 'glow']) {
            const splat = tgpu.resolve([makeBoidsSplatKernel(shape)], {names: 'strict'})
            expect(splat).toMatch(/boidsSplat/)
            expect(splat).toMatch(/atomicAdd/)
        }
        expect(tgpu.resolve([boidsSplatKernel], {names: 'strict'})).toMatchSnapshot('splatKernel')
    })

    it('the resolve kernel color-mixes rest→excited, blends the trail canvas, writes the texture', () => {
        for (const mode of [0, 1, 2, 3, 4, 5]) {
            const resolve = tgpu.resolve([makeBoidsResolveKernel(mode)], {names: 'strict'})
            expect(resolve).toMatch(/boidsResolve/)
            expect(resolve).toMatch(/atomicLoad/)
            expect(resolve).toMatch(/textureStore/)
        }
        expect(tgpu.resolve([boidsResolveKernel], {names: 'strict'})).toMatchSnapshot('resolveKernel')
    })

    it('the update integrator resolves with a runtime-count break in the neighbour loop', () => {
        const update = tgpu.resolve([boidsUpdateKernel], {names: 'strict'})
        expect(update).toMatch(/boidsUpdate/)
        expect(update).toMatch(/break/)
        expect(update).toMatchSnapshot('updateKernel')
    })

    it('each kernel binds exactly one bind-group layout (dispatch attaches a single bind group)', () => {
        for (const kernel of [boidsInitKernel, boidsUpdateKernel, boidsSplatKernel, boidsResolveKernel]) {
            const wgsl = tgpu.resolve([kernel], {names: 'strict'})
            const groups = new Set([...wgsl.matchAll(/@group\((\d+)\)/g)].map((m) => m[1]))
            expect(groups.size).toBe(1)
        }
    })
})
