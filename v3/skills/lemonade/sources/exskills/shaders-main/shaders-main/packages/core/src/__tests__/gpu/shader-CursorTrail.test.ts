import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import CursorTrail, {cursorTrailScan} from '@coreroot/shaders/CursorTrail/index'

/**
 * CursorTrail — analytic capsule-chain redesign (replaced the 128×128 stamp/decay compute grid).
 * The cursor path is a CPU-recorded polyline packed into a MAX_POINTS×1 rgba16float data texture
 * (the Shatter pattern: createDataTexture + per-frame write in onBeforeRender); the fragment walks
 * the chain per pixel with a round-cone SDF — analytic edges, newest-covering-segment age at
 * self-crossings. No compute pass at all.
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
const mockMediaTexture = () => ({texture: {}, width: 64, height: 1, write: vi.fn(), unwrap: vi.fn(), destroy: vi.fn()})

const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(tgpu.fn([], d.vec4f)(() => {'use gpu'; return d.vec4f(0, 0, 0, 0)}), 'z', []),
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
const composeOpts = (root: unknown) => ({
    flipY: false,
    dimensions: {width: 800, height: 600},
    gpu: {device: (root as {device: unknown}).device, root} as never,
    createDataTexture: () => mockMediaTexture() as never,
})
const tree = () => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'ct', def: CursorTrail as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('CursorTrail (a) capsule-chain fragment over a CPU-written points texture', () => {
    it('no compute / no RTT — a media data texture scanned by cursorTrailScan, colored by age', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(0)
        expect(ir.rttPasses.length).toBe(0)
        const kinds = ir.textures.map((t) => t.kind)
        expect(kinds).toContain('media') // the points data texture
        expect(kinds).not.toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/cursorTrailScan/)
        expect(finalWgsl).toMatch(/mixColors/) // default stops null → two-color path
        expect(finalWgsl).toMatch(/textureLoad\(/) // chain walk is textureLoad, not sampled
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('CursorTrail (b) fragment fallback when no GPU device', () => {
    it('transparent with no data texture (GPU-free resolve)', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).not.toMatch(/media_0|cursorTrailScan/)
    })
})

describe('CursorTrail (c) scan fn resolves (D3 rules)', () => {
    it('cursorTrailScan resolves standalone with a texture param + textureLoad loop', () => {
        const wgsl = tgpu.resolve([cursorTrailScan], {names: 'strict'})
        expect(wgsl).toMatch(/cursorTrailScan/)
        expect(wgsl).toMatch(/textureLoad/)
        expect(wgsl).toMatch(/texture_2d<f32>/)
        expect(wgsl).toMatchSnapshot('cursorTrailScan')
    })
})
