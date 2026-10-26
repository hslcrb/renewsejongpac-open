import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Fog, {initKernel, forceKernel, jacobiKernel, outputKernel} from '@coreroot/shaders/Fog/index'

/** Fog port gate (W7-B) — toroidal Stable-Fluids with fBm-noise init + run-once warm-up. */

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
const tree = () => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'fog', def: Fog as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016}

describe('Fog (a) toroidal fluid compute → color-variation fragment', () => {
    it('registers a compute texture (no RTT); first frame runs init + warm-up; colors by variation', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(0)
        expect(ir.textures.map((t) => t.kind)).toContain('compute')
        // First frame: init thunk + initPass + 50×(thunk + 15 solve steps) + per-frame thunk + 16 solve + output.
        const first = ir.computeSteps[0].getComputeNodes(FRAME) ?? []
        expect(first.length).toBeGreaterThan(50) // the warm-up expands the program
        expect(first.some((n) => typeof n === 'function')).toBe(true) // time-advancing thunks
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/mixColors/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
    it('subsequent frames skip the warm-up (much shorter program)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        const first = (ir.computeSteps[0].getComputeNodes(FRAME) ?? []).length
        const second = (ir.computeSteps[0].getComputeNodes(FRAME) ?? []).length
        expect(second).toBeLessThan(first)
        // per-frame: 1 thunk + force/curl/vorticity/divergence (4) + 10 jacobi + gradSub/advectVel/copyVel/advectDens/copyDens/colorRestore (6) + output.
        expect(second).toBe(1 + 4 + 10 + 6 + 1)
    })
})

describe('Fog (b) kernels resolve + fragment fallback', () => {
    it('init / force / jacobi / output resolve; no-compute → transparent', () => {
        expect(tgpu.resolve([initKernel], {names: 'strict'})).toMatch(/fogInit/)
        expect(tgpu.resolve([forceKernel], {names: 'strict'})).toMatch(/fogForce/)
        expect(tgpu.resolve([jacobiKernel], {names: 'strict'})).toMatch(/fogJacobi/)
        expect(tgpu.resolve([outputKernel], {names: 'strict'})).toMatch(/textureStore/)
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(tgpu.resolve([ir.finalPass.entry], {names: 'strict'})).not.toMatch(/compute_0/)
    })
})
