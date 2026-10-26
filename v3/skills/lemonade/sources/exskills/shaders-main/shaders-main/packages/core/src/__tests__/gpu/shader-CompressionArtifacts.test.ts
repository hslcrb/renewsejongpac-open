import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import CompressionArtifacts, {buildCompressionGraph, jpegBlockRgb} from '@coreroot/shaders/CompressionArtifacts/index'

/**
 * CompressionArtifacts port gate (W6-D) — a per-cell compute JPEG-block emulator. GPU-free: a mock
 * root answers compute allocations so the compute↔RTT↔fragment wiring runs. The kernel samples the
 * child RTT's 8×8 block, runs the separable DCT + quantize + inverse DCT, writes a cell texture; the
 * fragment fetches the cell color + the sharp alpha. `jpegBlockRgb` is pure → CPU-goldened.
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
const tree = () => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'ca', def: CompressionArtifacts as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'ca', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('CompressionArtifacts (a) compute → RTT input → cell-fetch fragment', () => {
    it('RTTs the child, registers a cell texture, fetches the cell color + sharp alpha', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // The cell-fetch UV is declaration-site algebra: floor(pPix/STRIDE) clamped to the grid.
        expect(finalWgsl).toMatch(/pPix/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('getComputeNodes returns a single dispatch step; bindInputs resolves the child RTT', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes({})?.length).toBe(1)
        let requestedKey: string | null = null
        ir.computeSteps[0].bindInputs?.((key) => {
            requestedKey = key
            return {texture: {}}
        })
        expect(requestedKey).toBe('rtt_0')
    })
})

describe('CompressionArtifacts (b) fragment fallback when compute is unavailable', () => {
    it('samples the child RTT sharp and unpremultiplies (no compute textures)', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('CompressionArtifacts (c) compute kernel resolves (D3 rules)', () => {
    it('the cell kernel resolves with textureLoad + jpegBlockRgb + storage textureStore', () => {
        const {layout, kernel} = buildCompressionGraph()
        const wgsl = tgpu.resolve([layout, kernel], {names: 'strict'})
        expect(wgsl).toMatch(/compressionCell/)
        expect(wgsl).toMatch(/jpegBlockRgb/)
        expect(wgsl).toMatch(/textureLoad/)
        expect(wgsl).toMatch(/textureStore/)
        expect(wgsl).toMatchSnapshot('cellKernel')
    })
})

describe('CompressionArtifacts (d) CPU golden — DCT block + cell UV', () => {
    const block = (r: number, g: number, b: number) => Array.from({length: 64}, () => d.vec3f(r, g, b))

    it('a uniform gray block reconstructs to gray (Y=0, chroma=0 → 0.5 exactly)', () => {
        const out = jpegBlockRgb(block(0.5, 0.5, 0.5) as never, 0, 0, 12) as unknown as {x: number; y: number; z: number}
        expect(out.x).toBeCloseTo(0.5, 5)
        expect(out.y).toBeCloseTo(0.5, 5)
        expect(out.z).toBeCloseTo(0.5, 5)
    })

    it('a uniform color block near-reconstructs its color at high quality (DC-preserving)', () => {
        const out = jpegBlockRgb(block(0.2, 0.6, 0.9) as never, 3, 5, 100) as unknown as {x: number; y: number; z: number}
        expect(out.x).toBeCloseTo(0.2, 1)
        expect(out.y).toBeCloseTo(0.6, 1)
        expect(out.z).toBeCloseTo(0.9, 1)
    })

    it('the output is clamped to [0,1]', () => {
        const out = jpegBlockRgb(block(2, -1, 0.5) as never, 4, 4, 1) as unknown as {x: number; y: number; z: number}
        for (const v of [out.x, out.y, out.z]) {
            expect(v).toBeGreaterThanOrEqual(0)
            expect(v).toBeLessThanOrEqual(1)
        }
    })

    // The cell-fetch UV (floor(pPix/STRIDE) → cell texel centre) is declaration-site algebra now —
    // its math is pinned by the final-pass snapshot above.
})
