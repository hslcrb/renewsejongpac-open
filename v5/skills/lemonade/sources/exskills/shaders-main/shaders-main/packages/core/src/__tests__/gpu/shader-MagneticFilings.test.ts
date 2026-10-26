import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import MagneticFilings, {
    filingsInitKernel,
    filingsSplatKernel,
    filingsResolveKernel,
    filingsUpdateKernel,
    makeFilingsSplatKernel,
    makeFilingsResolveKernel,
} from '@coreroot/shaders/MagneticFilings/index'

/**
 * MagneticFilings gate — iron filings on paper: per-filing (offset/θ/ω) storage, each filing reads only
 * its own slot (no neighbour scan), derives home + rest angle from its index on a jittered grid, samples
 * the cursor's magnetic field (dipole / radial), and integrates a nematic sin(2Δ) alignment torque + a
 * weak rest torque + a gentle position spring. Filings render as oriented SDF shapes by additive
 * fixed-point atomic splats; the resolve mixes rest→excited colors (angular-activity driven) in the baked
 * color space → rgba16f texture sampled full-canvas in the fragment. GPU-free: a mock root answers
 * allocations; kernels are resolved standalone.
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
    {id: 'mf', def: MagneticFilings as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('MagneticFilings (a) compute simulation → resolved texture', () => {
    it('registers the filings (compute) texture and samples it in the fragment (GENERATOR)', () => {
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
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(4) // init + 3
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(3) // update, splat, resolve (which also clears the accumulators)
    })

    it('count is runtime — any slider value composes and runs the same program (no recompile)', () => {
        const {registry, root} = buildRegistry(tree({count: 700}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(4)
    })

    it('every filing shape variant composes', () => {
        for (const shape of ['arrow', 'streak', 'dot', 'square', 'glow']) {
            const {registry, root} = buildRegistry(tree({shape}))
            const ir = composeNodeTree(registry, composeOpts(root))
            expect(ir.computeSteps.length).toBe(1)
        }
    })

    it('both field types and every rest orientation compose (runtime uniforms — no recompile)', () => {
        for (const fieldType of ['dipole', 'radial']) {
            for (const restOrientation of ['random', 'horizontal', 'vertical']) {
                const {registry, root} = buildRegistry(tree({fieldType, restOrientation}))
                const ir = composeNodeTree(registry, composeOpts(root))
                expect(ir.computeSteps.length).toBe(1)
                expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(4)
            }
        }
    })
})

describe('MagneticFilings (b) fragment fallback when compute is unavailable', () => {
    it('transparent output, no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('MagneticFilings (c) kernels resolve (D3 rules)', () => {
    it('the init kernel resolves with storage buffers', () => {
        const init = tgpu.resolve([filingsInitKernel], {names: 'strict'})
        expect(init).toMatch(/filingsInit/)
    })

    it('every shape variant of the render splat resolves and accumulates atomically', () => {
        for (const shape of ['arrow', 'streak', 'dot', 'square', 'glow']) {
            const splat = tgpu.resolve([makeFilingsSplatKernel(shape)], {names: 'strict'})
            expect(splat).toMatch(/filingsSplat/)
            expect(splat).toMatch(/atomicAdd/)
        }
        expect(tgpu.resolve([filingsSplatKernel], {names: 'strict'})).toMatchSnapshot('splatKernel')
    })

    it('the resolve kernel color-mixes rest→excited and writes the texture', () => {
        for (const mode of [0, 1, 2, 3, 4, 5]) {
            const resolve = tgpu.resolve([makeFilingsResolveKernel(mode)], {names: 'strict'})
            expect(resolve).toMatch(/filingsResolve/)
            expect(resolve).toMatch(/atomicLoad/)
            expect(resolve).toMatch(/atomicStore/) // the folded-in accumulator clear
            expect(resolve).toMatch(/textureStore/)
        }
        expect(tgpu.resolve([filingsResolveKernel], {names: 'strict'})).toMatchSnapshot('resolveKernel')
    })

    it('the update integrator resolves with the nematic torque (atan2 + sin) and a runtime-count break', () => {
        const update = tgpu.resolve([filingsUpdateKernel], {names: 'strict'})
        expect(update).toMatch(/filingsUpdate/)
        expect(update).toMatch(/atan2/)
        expect(update).toMatch(/sin/)
        expect(update).toMatchSnapshot('updateKernel')
    })

    it('each kernel binds exactly one bind-group layout (dispatch attaches a single bind group)', () => {
        for (const kernel of [filingsInitKernel, filingsUpdateKernel, filingsSplatKernel, filingsResolveKernel]) {
            const wgsl = tgpu.resolve([kernel], {names: 'strict'})
            const groups = new Set([...wgsl.matchAll(/@group\((\d+)\)/g)].map((m) => m[1]))
            expect(groups.size).toBe(1)
        }
    })
})
