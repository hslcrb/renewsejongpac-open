import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ParticleFlow, {
    particleFlowForceKernel,
    particleFlowVorticityKernel,
    particleFlowJacobiKernel,
    particleFlowCopyVelKernel,
    particleFlowInitKernel,
    particleFlowIntegrateKernel,
    particleFlowSplatKernel,
    particleFlowResolveKernel,
    makeParticleFlowSplatKernel,
    makeParticleFlowResolveKernel,
} from '@coreroot/shaders/ParticleFlow/index'

/**
 * ParticleFlow gate — "dust in the wind": InkFlow's dye-less Stable-Fluids velocity solver (cursor
 * force splats → curl → vorticity+ambient → divergence → 10× jacobi → gradSub → advect+copy, the
 * copy publishing the field to a velocity texture) drives Boids-style particles that bilinear-sample
 * the field, ease toward it with inertia, integrate with a weak home-spring (no wrap), and render as oriented SDF
 * shapes via additive fixed-point atomic splats colored rest→excited by local speed and blended into
 * a persistent trail canvas → rgba16f texture sampled full-canvas. Two bind-group layouts (fluid +
 * particle) bridged by the velocity texture; every kernel binds exactly one. GPU-free: a mock root
 * answers allocations; kernels are resolved standalone.
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
    {id: 'pf', def: ParticleFlow as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}
const STROKE = {pointer: {x: 0.6, y: 0.55}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('ParticleFlow (a) fluid + particle compute → resolved texture', () => {
    it('registers the flow (compute) texture and samples it in the fragment (GENERATOR)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(0) // generator — no child
        expect(ir.textures.map((t) => t.kind)).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('the first driven frame runs init + force ribbon + fluid solve + particle passes', () => {
        const {registry, root} = buildRegistry(tree({ambient: 0}))
        const ir = composeNodeTree(registry, composeOpts(root))
        const step = ir.computeSteps[0]
        // A cursor stroke wakes it: init (one-shot) + a force stamp thunk+dispatch pair, then the
        // solve chain (curl, vorticity, divergence, jacobi ×N, gradSub, advect, copyVel) and the
        // three particle passes (integrate, splat, resolve — the resolve self-clears, no clear pass).
        const nodes = step.getComputeNodes(STROKE)
        expect(nodes).not.toBeNull()
        expect((nodes as unknown[]).length).toBeGreaterThanOrEqual(1 + 2 + 12 + 3)
    })

    it('idle-freezes when nothing drives the field (ambient 0, no cursor) after warmup', () => {
        const {registry, root} = buildRegistry(tree({ambient: 0}))
        const ir = composeNodeTree(registry, composeOpts(root))
        const step = ir.computeSteps[0]
        // Warmup frames run (init + a settled render) then it freezes — the last texture persists.
        let sawNull = false
        for (let i = 0; i < 12; i++) {
            if (step.getComputeNodes(FRAME) === null) { sawNull = true; break }
        }
        expect(sawNull).toBe(true)
    })

    it('ambient > 0 keeps the sim running every frame (never idle-freezes)', () => {
        const {registry, root} = buildRegistry(tree({ambient: 0.3}))
        const ir = composeNodeTree(registry, composeOpts(root))
        const step = ir.computeSteps[0]
        for (let i = 0; i < 20; i++) expect(step.getComputeNodes(FRAME)).not.toBeNull()
    })

    it('count is runtime — any slider value composes and runs the same program (no recompile)', () => {
        const {registry, root} = buildRegistry(tree({count: 12000, ambient: 0.3}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.computeSteps[0].getComputeNodes(FRAME)).not.toBeNull()
    })

    it('every shape variant composes', () => {
        for (const shape of ['arrow', 'streak', 'dot', 'square', 'glow']) {
            const {registry, root} = buildRegistry(tree({shape}))
            const ir = composeNodeTree(registry, composeOpts(root))
            expect(ir.computeSteps.length).toBe(1)
        }
    })

    it('a couple of color spaces compose', () => {
        for (const colorSpace of ['linear', 'oklab', 'hsl']) {
            const {registry, root} = buildRegistry(tree({colorSpace}))
            const ir = composeNodeTree(registry, composeOpts(root))
            expect(ir.computeSteps.length).toBe(1)
        }
    })
})

describe('ParticleFlow (b) fragment fallback when compute is unavailable', () => {
    it('transparent output, no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('ParticleFlow (c) kernels resolve (D3 rules)', () => {
    it('fluid solve kernels resolve to WGSL', () => {
        expect(tgpu.resolve([particleFlowForceKernel], {names: 'strict'})).toMatch(/particleFlowForce/)
        expect(tgpu.resolve([particleFlowVorticityKernel], {names: 'strict'})).toMatch(/particleFlowVorticity/)
        expect(tgpu.resolve([particleFlowJacobiKernel], {names: 'strict'})).toMatch(/particleFlowJacobi/)
        // copyVel publishes the field to the velocity texture.
        expect(tgpu.resolve([particleFlowCopyVelKernel], {names: 'strict'})).toMatch(/textureStore/)
    })

    it('the init kernel resolves, and the resolve kernel carries the folded-in accumulator clear', () => {
        expect(tgpu.resolve([particleFlowInitKernel], {names: 'strict'})).toMatch(/particleFlowInit/)
        expect(tgpu.resolve([particleFlowResolveKernel], {names: 'strict'})).toMatch(/atomicStore/)
    })

    it('the integrate kernel bilinear-samples the velocity texture and resolves', () => {
        const wgsl = tgpu.resolve([particleFlowIntegrateKernel], {names: 'strict'})
        expect(wgsl).toMatch(/particleFlowIntegrate/)
        expect(wgsl).toMatch(/textureLoad/)
        expect(wgsl).toMatchSnapshot('integrateKernel')
    })

    it('every shape variant of the render splat resolves and accumulates atomically', () => {
        for (const shape of ['arrow', 'streak', 'dot', 'square', 'glow']) {
            const splat = tgpu.resolve([makeParticleFlowSplatKernel(shape)], {names: 'strict'})
            expect(splat).toMatch(/particleFlowSplat/)
            expect(splat).toMatch(/atomicAdd/)
        }
        expect(tgpu.resolve([particleFlowSplatKernel], {names: 'strict'})).toMatchSnapshot('splatKernel')
    })

    it('the resolve kernel color-mixes rest→excited, blends the trail canvas, writes the texture', () => {
        for (const mode of [0, 1, 2, 3, 4, 5]) {
            for (const trailsOn of [false, true]) {
                const resolve = tgpu.resolve([makeParticleFlowResolveKernel(mode, trailsOn)], {names: 'strict'})
                expect(resolve).toMatch(/particleFlowResolve/)
                expect(resolve).toMatch(/atomicLoad/)
                expect(resolve).toMatch(/textureStore/)
            }
        }
        // trails 0 (the default) bakes out the trail-canvas READ but keeps the write.
        const off = tgpu.resolve([makeParticleFlowResolveKernel(2, false)], {names: 'strict'})
        const on = tgpu.resolve([makeParticleFlowResolveKernel(2, true)], {names: 'strict'})
        expect(on.length).toBeGreaterThan(off.length)
        expect(tgpu.resolve([particleFlowResolveKernel], {names: 'strict'})).toMatchSnapshot('resolveKernel')
    })

    it('each kernel binds exactly one bind-group layout (dispatch attaches a single bind group)', () => {
        const kernels = [
            particleFlowForceKernel, particleFlowVorticityKernel, particleFlowJacobiKernel,
            particleFlowCopyVelKernel, particleFlowInitKernel,
            particleFlowIntegrateKernel, particleFlowSplatKernel, particleFlowResolveKernel,
        ]
        for (const kernel of kernels) {
            const wgsl = tgpu.resolve([kernel], {names: 'strict'})
            const groups = new Set([...wgsl.matchAll(/@group\((\d+)\)/g)].map((m) => m[1]))
            expect(groups.size).toBe(1)
        }
    })
})
