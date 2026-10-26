import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Shatter from '@coreroot/shaders/Shatter/index'
import {voronoiNearest2Graph, crackGeom, crackRefractUV, crackShardCompose, cellLaneUVFor} from '@coreroot/std/effects/fracture'

const voronoiKernel = voronoiNearest2Graph(16, 1024).kernel
const cellDataUV = cellLaneUVFor(64)

/**
 * Shatter port gate (W6-D) — a Voronoi-precompute compute shader (cell IDs → static per seed) plus a
 * per-frame per-cell DATA texture (positions + physics-driven displacements) the crack/refraction
 * fragment samples by cell ID. GPU-free: a mock root + injected createDataTexture run the full
 * compose. Voronoi kernel resolves; the pure geom/refract/compose bodies are CPU-goldened.
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
const composeOpts = (root: unknown) => ({
    flipY: false,
    dimensions: {width: 800, height: 600},
    gpu: {device: (root as {device: unknown}).device, root} as never,
    createDataTexture: () => mockMediaTexture() as never,
})
const tree = () => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'sh', def: Shatter as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'sh', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('Shatter (a) Voronoi compute → data-texture crack/refraction fragment', () => {
    it('registers a Voronoi compute texture + samples the data texture and child; composites', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute') // Voronoi field
        expect(kinds).toContain('media') // per-cell data texture
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/crackGeom/)
        expect(finalWgsl).toMatch(/crackRefractUV/)
        expect(finalWgsl).toMatch(/crackShardCompose/)
        expect(finalWgsl).toMatch(/cellLaneUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/) // child
        expect(finalWgsl).toMatch(/textureSample\(compute_0/) // Voronoi
        expect(finalWgsl).toMatch(/textureSample\(media_0/) // data texture
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('Voronoi dispatches once, then stays static until the seed changes', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes({})?.length).toBe(1) // first frame dispatches
        expect(ir.computeSteps[0].getComputeNodes({})).toBeNull() // static thereafter
    })
})

describe('Shatter (b) Voronoi kernel resolves (D3 rules)', () => {
    it('the kernel reads the cell-position storage buffer + writes the storage texture', () => {
        const wgsl = tgpu.resolve([voronoiKernel], {names: 'strict'})
        expect(wgsl).toMatch(/voronoiNearest2/)
        expect(wgsl).toMatch(/textureStore/)
        expect(wgsl).toMatchSnapshot('voronoiKernel')
    })
})

describe('Shatter (c) fragment fallback when compute is unavailable', () => {
    it('passthrough (unpremultiplied) with no compute/data textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0|media_0/)
    })
})

describe('Shatter (d) CPU goldens — geom / refract / compose / cellDataUV', () => {
    it('crackGeom: crack intensity, edge normal, displaced UV', () => {
        const g = crackGeom(d.vec2f(0.5, 0.5), 0.4, 0.5, 0.6, 0.5, 0.02, 0.01, 1) as unknown as {
            crackIntensity: number; edgeNormal: {x: number; y: number}; displacedUV: {x: number; y: number}; disp: {x: number; y: number}
        }
        expect(g.crackIntensity).toBeCloseTo(1, 5) // equidistant from both cells + displaced
        expect(g.edgeNormal.x).toBeCloseTo(0, 5)
        expect(g.edgeNormal.y).toBeCloseTo(1, 5)
        expect(g.displacedUV.x).toBeCloseTo(0.48, 5)
        expect(g.displacedUV.y).toBeCloseTo(0.49, 5)
    })

    it('crackRefractUV: per-channel chromatic offset along the edge normal', () => {
        // displacedUV=(0.48,0.49), edgeNormal=(0,1), crack=1, refr=5, chroma=1, channel=+1.
        // refractionOffset=(0,0.05); chromaShift=(0,0.005); offset=(0,0.055); → (0.48, 0.545).
        const uv = crackRefractUV(d.vec2f(0.48, 0.49), d.vec2f(0, 1), 1, 5, 1, 1) as unknown as {x: number; y: number}
        expect(uv.x).toBeCloseTo(0.48, 5)
        expect(uv.y).toBeCloseTo(0.545, 5)
    })

    it('crackShardCompose: full crack blend → refracted RGB at crackIntensity 1', () => {
        const out = crackShardCompose(
            d.vec4f(0.2, 0.4, 0.6, 1), d.vec4f(0.9, 0.1, 0.1, 1), d.vec4f(0.1, 0.9, 0.1, 1), d.vec4f(0.1, 0.1, 0.9, 1),
            1, d.vec2f(0.02, 0.01), 0.1,
        ) as unknown as {x: number; y: number; z: number; w: number}
        // refractedRGB = (0.9,0.9,0.9); crack=1 → shadedRGB = refractedRGB; then × lighting factor.
        const dispLen = Math.hypot(0.02, 0.01)
        const ld = [0.3, 0.6]
        const ldLen = Math.hypot(ld[0], ld[1])
        const nd = (0.02 / (dispLen + 0.001)) * (ld[0] / ldLen) + (0.01 / (dispLen + 0.001)) * (ld[1] / ldLen)
        const lighting = 1 + (1 + nd * 0.1 - 1) * 1 // lightingIntensity = smoothstep(0,0.02,dispLen) = 1
        expect(out.x).toBeCloseTo(0.9 * lighting, 4)
        expect(out.w).toBeCloseTo(1, 5)
    })

    it('cellDataUV: cell idx × 4 + field, centred, over the 64-wide texture', () => {
        const uv = cellDataUV(3, 2) as unknown as {x: number; y: number}
        expect(uv.x).toBeCloseTo((3 * 4 + 2 + 0.5) / 64, 6)
        expect(uv.y).toBeCloseTo(0.5, 6)
    })
})
