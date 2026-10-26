import {describe, it, expect, vi} from 'vitest'
import {tgpu, d, std} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Particles, {
    particleInitKernel,
    particleClearDensityKernel,
    particleDensityKernel,
    particleSplatKernel,
    makeParticleSplatKernel,
    makeParticleUpdateKernel,
    makeParticleResolveKernel,
} from '@coreroot/shaders/Particles/index'

/**
 * Particles gate — a TRUE 3D particle simulation (per-particle position/velocity state buffers):
 * a trilinear-splatted 3D density grid drives an emergent even-fill pressure force, a baked
 * per-shape-family `evalSdf` (2D analytic extruded / SVG extruded / analytic 3D with rotation +
 * animated sub-props) drives containment, plus cursor magnet, gravity and turbulence; rendered by
 * additive fixed-point atomic splats resolved to an rgba16f texture with a speed-driven color
 * ramp. GPU-free: a mock root answers allocations; kernels are resolved standalone.
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
    {id: 'pt', def: Particles as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('Particles (a) compute simulation → resolved additive texture', () => {
    it('registers the particle (compute) texture and samples it in the fragment (GENERATOR)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(0) // generator — no child
        expect(ir.textures.map((t) => t.kind)).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('first frame prepends the one-shot init; steady state runs the 5-step frame program', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(6) // init + 5
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(5) // clearDens, dens, update, splat, resolve (resolve self-clears)
    })

    it('a 3D shape (sphere3D) builds the analytic 3D setup without throwing', () => {
        const {registry, root} = buildRegistry(tree({
            shape: JSON.stringify({type: 'sphere3D', radius: 0.3}),
            shapeType: 'sphere3D',
        }))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(6)
    })
})

describe('Particles (b) fragment fallback when compute is unavailable', () => {
    it('transparent output, no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('Particles (c) kernels resolve (D3 rules)', () => {
    it('init / density / clear kernels resolve with storage buffers + atomics', () => {
        const init = tgpu.resolve([particleInitKernel], {names: 'strict'})
        expect(init).toMatch(/particlesInit/)
        const clear = tgpu.resolve([particleClearDensityKernel], {names: 'strict'})
        expect(clear).toMatch(/atomicStore/)
        const density = tgpu.resolve([particleDensityKernel], {names: 'strict'})
        expect(density).toMatch(/atomicAdd/)
    })

    it('every shape variant of the render splat resolves and accumulates atomically', () => {
        for (const shape of ['dot', 'square', 'glow']) {
            const splat = tgpu.resolve([makeParticleSplatKernel(shape)], {names: 'strict'})
            expect(splat).toMatch(/particlesSplat/)
            expect(splat).toMatch(/atomicAdd/)
        }
        expect(tgpu.resolve([particleSplatKernel], {names: 'strict'})).toMatchSnapshot('splatKernel')
    })

    it('the resolve kernel color-ramps by average speed and writes the texture', () => {
        const resolve = tgpu.resolve([makeParticleResolveKernel(0)], {names: 'strict'})
        expect(resolve).toMatch(/particlesResolve/)
        expect(resolve).toMatch(/atomicLoad/)
        expect(resolve).toMatch(/atomicStore/) // folded-in accumulator clear for the next frame
        expect(resolve).toMatch(/awMix/) // the kit's alpha-weighted color mix
        expect(resolve).toMatch(/textureStore/)
    })

    it('the update integrator resolves against a baked evalSdf (pressure + containment + cursor)', () => {
        const sphereSdf = tgpu.fn([d.vec3f], d.f32)((p) => {
            'use gpu'
            return std.length(p) - 0.35
        })
        const update = tgpu.resolve([makeParticleUpdateKernel(sphereSdf)], {names: 'strict'})
        expect(update).toMatch(/particlesUpdate/)
        expect(update).toMatch(/atomicLoad/) // density gradient reads
        expect(update).toMatchSnapshot('updateKernel')
    })
})
