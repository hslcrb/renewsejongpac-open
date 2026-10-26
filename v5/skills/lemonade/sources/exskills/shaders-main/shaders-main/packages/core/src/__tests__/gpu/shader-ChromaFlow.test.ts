import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ChromaFlow from '@coreroot/shaders/ChromaFlow/index'
import {flowDirectionColor} from '@coreroot/gpu/scaffolds/gridKernels'

/**
 * ChromaFlow port gate (W7-C) — an interactive liquid generator driven by a per-frame CPU advection
 * sim written into an rgba16float flow-field data texture, sampled by a 5-tap cross in the fragment.
 * GPU-free: a mock root + injected createDataTexture run the full compose; the color body is CPU-goldened.
 */
function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {return buffer})}
    const texture = {$usage: vi.fn(function (this: unknown) {return texture}), destroy: vi.fn(), write: vi.fn()}
    const uniform = {buffer: {}, write: vi.fn(), patch: vi.fn()}
    return {
        createBuffer: vi.fn(() => buffer),
        createBindGroup: vi.fn(() => ({})),
        createTexture: vi.fn(() => texture),
        createUniform: vi.fn(() => uniform),
        device: {},
    } as never
}
const mockMediaTexture = () => ({texture: {}, width: 128, height: 128, write: vi.fn(), unwrap: vi.fn(), destroy: vi.fn()})

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
        const extra: FieldInit[] = []
        for (const [name, cfg] of Object.entries((s.def.extraFields ?? {}))) extra.push({name, schema: (cfg as {schema: unknown}).schema as never, initial: (cfg as {initial: unknown}).initial as never})
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: 1}]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...extra, ...synthetic]) as never
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
const RootContainer: GpuShaderDefinition = {
    name: 'Root', props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? ({_emit: () => 'vec4f(0.0)'} as Expr),
}
const composeOpts = (root: unknown) => ({
    flipY: false,
    dimensions: {width: 800, height: 600},
    gpu: {device: (root as {device: unknown}).device, root} as never,
    createDataTexture: () => mockMediaTexture() as never,
})
const tree = () => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'cf', def: ChromaFlow as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('ChromaFlow (a) generator samples an rgba16float flow field + composes directional color', () => {
    it('registers the data texture (media) + 5-tap cross + color body', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.textures.map((t) => t.kind)).toContain('media')
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/flowDirectionColor/)
        expect(wgsl).toMatch(/textureSample\(media_0/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('ChromaFlow (b) color body CPU golden', () => {
    it('zero flow + zero density → transparent (liquidIntensity 0)', () => {
        const z = d.vec4f(0, 0, 0, 0)
        const base = d.vec4f(0, 0.4, 1, 1)
        const out = flowDirectionColor(z, z, z, z, z, base, base, base, base, base) as unknown as {w: number}
        expect(out.w).toBeCloseTo(0, 5)
    })
    it('uniform density, no flow → base color × liquidIntensity, no directional tint', () => {
        // density .z = 0.5 everywhere → smoothedLiquid 0.5, liquidIntensity=smoothstep(0,0.1,0.5)=1;
        // flow zero → hasFlow 0 → finalColor = base; result = base × 1.
        const s = d.vec4f(0, 0, 0.5, 0)
        const base = d.vec4f(0.1, 0.2, 0.3, 1)
        const other = d.vec4f(1, 1, 1, 1)
        const out = flowDirectionColor(s, s, s, s, s, base, other, other, other, other) as unknown as {x: number; y: number; z: number; w: number}
        expect(out.x).toBeCloseTo(0.1, 5)
        expect(out.y).toBeCloseTo(0.2, 5)
        expect(out.z).toBeCloseTo(0.3, 5)
        expect(out.w).toBeCloseTo(1, 5)
    })
})
