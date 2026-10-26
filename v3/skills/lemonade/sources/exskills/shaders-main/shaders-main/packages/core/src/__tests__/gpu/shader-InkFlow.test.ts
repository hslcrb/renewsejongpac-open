import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import InkFlow, {splatKernel, vorticityKernel, jacobiKernel, advectDyeKernel, outputKernel} from '@coreroot/shaders/InkFlow/index'

/** InkFlow gate — RGB-dye Stable-Fluids (Pavel-Dobryakov style): splats + vorticity + auto-splats. */

function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {return buffer})}
    const texture = {$usage: vi.fn(function (this: unknown) {return texture}), destroy: vi.fn(), write: vi.fn()}
    const uniform = {buffer: {}, write: vi.fn(), patch: vi.fn()}
    const guarded = {with: vi.fn(function (this: unknown) {return guarded}), dispatchThreads: vi.fn()}
    return {
        createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({})), createTexture: vi.fn(() => texture),
        createUniform: vi.fn(() => uniform), createGuardedComputePipeline: vi.fn(() => guarded), device: {},
    } as never
}

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {'use gpu'; return d.vec4f(uv.x, uv.y, 0.5, 1.0)})
const RootContainer: GpuShaderDefinition = {name: 'Root', props: {} as never, fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(genBody, 'genBody', [])}

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
        nodes.set(s.id, {id: s.id, componentName: s.def.name, parentId: s.parentId, definition: s.def, metadata: {blendMode: 'normal', opacity: undefined, renderOrder: 0, ...s.metadata} as NodeMetadata, handles: handlesById[s.id]})
    }
    for (const s of specs) if (s.parentId) {
        const arr = childrenByParent.get(s.parentId) ?? []; arr.push(nodes.get(s.id)!); childrenByParent.set(s.parentId, arr)
    }
    const rootNode = specs.find((s) => s.parentId === null)!
    return {registry: {rootId: rootNode.id, getNode: (id) => nodes.get(id), getChildren: (p) => childrenByParent.get(p) ?? [], resolveCustomId: () => null, store}, root}
}
const composeOpts = (root: unknown) => ({flipY: false, dimensions: {width: 800, height: 600}, gpu: {device: (root as {device: unknown}).device, root} as never})
const tree = (props?: Record<string, unknown>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'fp', def: InkFlow as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('InkFlow (a) dye fluid compute → luminous composite fragment', () => {
    it('registers a compute texture (no RTT); one ordered dispatch program; composites the dye', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(0)
        expect(ir.textures.map((t) => t.kind)).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/inkDye/) // the inline luminance→coverage composite
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
    it('a stroke runs the full solve chain; an untouched sim idle-skips (null)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        const step = ir.computeSteps[0]
        // Never touched → nothing to simulate, dispatch is skipped entirely.
        expect(step.getComputeNodes({pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016})).toBeNull()
        // A cursor stroke wakes it: splat thunk+dispatch pairs, then the solve chain (curl →
        // vorticity → divergence → 10× jacobi → gradSub → 2× advect+copy → output).
        const nodes = step.getComputeNodes({pointer: {x: 0.6, y: 0.55}, deltaTime: 0.016})
        expect(nodes).not.toBeNull()
        expect((nodes as unknown[]).length).toBeGreaterThanOrEqual(17 + 2)
        // Still cursor afterwards → keeps evolving while the ink decays (no immediate skip).
        expect(step.getComputeNodes({pointer: {x: 0.6, y: 0.55}, deltaTime: 0.016})).not.toBeNull()
    })
})

describe('InkFlow (b) kernels resolve to WGSL', () => {
    it('splat / vorticity / jacobi / advect-dye / output kernels resolve', () => {
        expect(tgpu.resolve([splatKernel], {names: 'strict'})).toMatch(/inkFlowSplat/)
        expect(tgpu.resolve([vorticityKernel], {names: 'strict'})).toMatch(/inkFlowVorticity/)
        expect(tgpu.resolve([jacobiKernel], {names: 'strict'})).toMatch(/inkFlowJacobi/)
        expect(tgpu.resolve([advectDyeKernel], {names: 'strict'})).toMatch(/inkFlowAdvectDye/)
        expect(tgpu.resolve([outputKernel], {names: 'strict'})).toMatch(/textureStore/)
    })

    it('each kernel binds exactly one bind-group layout (dispatch attaches a single bind group)', () => {
        for (const kernel of [splatKernel, vorticityKernel, jacobiKernel, advectDyeKernel, outputKernel]) {
            const wgsl = tgpu.resolve([kernel], {names: 'strict'})
            const groups = new Set([...wgsl.matchAll(/@group\((\d+)\)/g)].map((m) => m[1]))
            expect(groups.size).toBe(1)
        }
    })
})

describe('InkFlow (c) fragment fallback when compute is unavailable', () => {
    it('transparent with no compute textures (GPU-free resolve)', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        expect(tgpu.resolve([ir.finalPass.entry], {names: 'strict'})).not.toMatch(/compute_0/)
    })
})
