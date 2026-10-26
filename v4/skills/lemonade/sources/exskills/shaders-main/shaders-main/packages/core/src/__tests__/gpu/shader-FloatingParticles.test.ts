import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import FloatingParticles, {
    floatingParticlesInitKernel,
    floatingParticlesUpdateKernel,
    floatingParticlesSplatKernel,
    floatingParticlesResolveKernel,
    makeFloatingParticlesSplatKernel,
} from '@coreroot/shaders/FloatingParticles/index'

/**
 * FloatingParticles v2 gate — the old procedural Voronoi field ported onto the shared agent sim
 * (kit/agents): real motes with deterministic per-index drift (uniform translation → toroidal wrap
 * preserves coverage), orbital wander + twinkle at the splat, a decaying cursor gust, runtime count,
 * and the single-tint accumulator/resolve pipeline. GPU-free: a mock root answers allocations.
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

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {'use gpu'; return d.vec4f(uv.x, uv.y, 0.5, 1.0)})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    acceptsUVContext: true,
    props: {} as never,
    fragment: ({uvContext, ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uvContext ?? ctx.uv]),
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
        handlesById[s.id] = store.defineNode(s.id, [...propFields, {name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]) as never
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
    return {
        registry: {
            rootId: rootNode.id,
            getNode: (id) => nodes.get(id),
            getChildren: (p) => childrenByParent.get(p) ?? [],
            resolveCustomId: () => null,
            store,
        },
        root,
    }
}
const composeOpts = (root: unknown) => ({flipY: false, dimensions: {width: 800, height: 600}, gpu: {device: (root as {device: unknown}).device, root} as never})
const tree = (props?: Record<string, unknown>, withChild = false) => {
    const specs: NodeSpec[] = [
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'fp', def: FloatingParticles as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    ]
    if (withChild) specs.push({id: 'gen', def: Generator, parentId: 'fp', metadata: {renderOrder: 0}})
    return specs
}

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('FloatingParticles (a) compute simulation → resolved texture', () => {
    it('registers the mote (compute) texture and samples it in the fragment (GENERATOR)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(0)
        expect(ir.textures.map((t) => t.kind)).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('first frame prepends the one-shot init; steady state runs the 3-step frame program', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(4) // init + 3
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(3) // update, splat, resolve (resolve clears)
    })

    it('count is runtime — any slider value composes and runs the same program (no recompile)', () => {
        const {registry, root} = buildRegistry(tree({count: 300}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(4)
    })

    it('a nested child composites the motes OVER it (no RTT needed)', () => {
        const {registry, root} = buildRegistry(tree(undefined, true))
        const ir = composeNodeTree(registry, composeOpts(root))
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/agentStraightAlphaOver/)
        expect(finalWgsl).toMatch(/genBody/)
    })
})

describe('FloatingParticles (b) fragment fallback when compute is unavailable', () => {
    it('transparent output (or the untouched child), no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        expect(tgpu.resolve([ir.finalPass.entry], {names: 'strict'})).not.toMatch(/compute_0/)
    })
})

describe('FloatingParticles (c) kernels resolve (D3 rules)', () => {
    it('init / update kernels resolve (drift + gust + toroidal wrap)', () => {
        expect(tgpu.resolve([floatingParticlesInitKernel], {names: 'strict'})).toMatch(/floatingParticlesInit/)
        const update = tgpu.resolve([floatingParticlesUpdateKernel], {names: 'strict'})
        expect(update).toMatch(/floatingParticlesUpdate/)
        expect(update).toMatch(/agentCursorMagnet/)
        expect(update).toMatchSnapshot('updateKernel')
    })

    it('every shape variant of the splat resolves with orbit + twinkle; resolve tints + stores', () => {
        for (const shape of ['dot', 'square', 'glow']) {
            const splat = tgpu.resolve([makeFloatingParticlesSplatKernel(shape)], {names: 'strict'})
            expect(splat).toMatch(/floatingParticlesSplat/)
            expect(splat).toMatch(/atomicAdd/)
            expect(splat).toMatch(/pointSlotOrbitalPlace/)
            // `glow` has a compile-time softness (registry soft = 1) so it bakes the fast one-half
            // profile; dot/square keep the general fn because their softness is a live slider.
            expect(splat).toMatch(shape === 'glow' ? /agentTexelWeight/ : /agentWeight\(/)
        }
        expect(tgpu.resolve([floatingParticlesSplatKernel], {names: 'strict'})).toMatchSnapshot('splatKernel')
        const resolve = tgpu.resolve([floatingParticlesResolveKernel], {names: 'strict'})
        expect(resolve).toMatch(/textureStore/)
        // The resolve owns the clear (read-then-zero, one thread per cell) — no separate clear pass.
        expect(resolve).toMatch(/atomicStore/)
    })

    it('each kernel binds exactly one bind-group layout (dispatch attaches a single bind group)', () => {
        for (const kernel of [floatingParticlesInitKernel, floatingParticlesUpdateKernel, floatingParticlesSplatKernel, floatingParticlesResolveKernel]) {
            const wgsl = tgpu.resolve([kernel], {names: 'strict'})
            const groups = new Set([...wgsl.matchAll(/@group\((\d+)\)/g)].map((m) => m[1]))
            expect(groups.size).toBe(1)
        }
    })
})
