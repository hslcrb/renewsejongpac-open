import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Glow from '@coreroot/shaders/Glow/index'
import {buildGlowPrepassGraph, buildGlowPrepassMapGraph, glowCompose} from '@coreroot/gpu/kit/blur'

/**
 * Glow port gate (Phase D3-A). GPU-free: a mock root answers the compute allocations so the
 * compute↔RTT↔fragment wiring runs inside `composeNodeTree` — a combined bright-extract + blur-map
 * fill pre-pass (`glowExtractAndFill`, reading the child RTT + writing a bright buffer AND the radius
 * map), a variable Gaussian over the bright buffer, then the fragment's `original + bloom × intensity`
 * composite. Plus size=0 bypass, the pre-pass kernel resolves (D3 rules), and a CPU golden on compose.
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
function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore; root: ReturnType<typeof mockRoot>} {
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
    return {registry, store, root}
}
const composeOpts = (root: unknown) => ({flipY: false, dimensions: {width: 800, height: 600}, gpu: {device: (root as {device: unknown}).device, root} as never})
const tree = (glowProps?: Record<string, unknown>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'gl', def: Glow as GpuShaderDefinition, parentId: 'root', props: glowProps, metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'gl', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('Glow (a) compute → RTT input → bloom composite', () => {
    it('RTTs the child, registers a compute-output texture, composites original + bloom × intensity', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))

        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')

        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatch(/glowCompose/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('getComputeNodes returns the pre-pass + the two variable-blur passes (3 steps)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes({})?.length).toBe(3)
    })

    it('bindInputs resolves the child RTT key and builds the pre-pass bind group', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        const before = (root as unknown as {createBindGroup: {mock: {calls: unknown[]}}}).createBindGroup.mock.calls.length
        let requestedKey: string | null = null
        ir.computeSteps[0].bindInputs?.((key) => {
            requestedKey = key
            return {texture: {}}
        })
        const after = (root as unknown as {createBindGroup: {mock: {calls: unknown[]}}}).createBindGroup.mock.calls.length
        expect(requestedKey).toBe('rtt_0')
        expect(after).toBeGreaterThan(before)
    })
})

describe('Glow (b) size=0 bypass + GPU-free fallback', () => {
    it('size=0 → no compute pass; the fragment falls through to child passthrough', () => {
        const {registry, root} = buildRegistry(tree({size: 0}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })

    it('no device (GPU-free) → sharp passthrough, no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('Glow (c) pre-pass kernel resolves (D3 rules)', () => {
    it('extract+fill kernel resolves with a sampled textureLoad + TWO storage textureStores', () => {
        const {layout, kernel} = buildGlowPrepassGraph(1024, 640)
        const wgsl = tgpu.resolve([layout, kernel], {names: 'strict'})
        expect(wgsl).toMatch(/glowExtractAndFill/)
        expect(wgsl).toMatch(/textureLoad/)
        // both the bright buffer and the blur map are written
        expect((wgsl.match(/textureStore/g) ?? []).length).toBeGreaterThanOrEqual(2)
        expect(wgsl).toMatchSnapshot('extractAndFill')
    })
})

describe('Glow (c2) map-driven pre-pass kernel resolves (e0 compute-map interplay)', () => {
    it('extract+fill kernel samples BOTH child + size-map source, writes bright + per-pixel radius', () => {
        const {layout, kernel} = buildGlowPrepassMapGraph(1024, 640, 'luminance')
        const wgsl = tgpu.resolve([layout, kernel], {names: 'strict'})
        expect(wgsl).toMatch(/glowExtractAndFillVariable/)
        // Reads the child RTT (bright extract) AND the size-map source.
        expect((wgsl.match(/textureLoad/g) ?? []).length).toBeGreaterThanOrEqual(2)
        // Writes both the bright buffer and the blur map.
        expect((wgsl.match(/textureStore/g) ?? []).length).toBeGreaterThanOrEqual(2)
        expect(wgsl).toMatchSnapshot('extractAndFillVariable')
    })
})

describe('Glow (c3) size map driver activates the variable pre-pass path', () => {
    function invokeCompute(withMap: boolean, size = 25) {
        const requested: string[] = []
        const params = {
            childNode: {} as never,
            gpu: {root: mockRoot()} as never,
            dimensions: {width: 256, height: 256},
            convertToTexture: () => ({key: 'child', sample: () => ({})}) as never,
            registerComputeTexture: () => ({key: 'blurred', sample: () => ({})}) as never,
            getCpuValue: (prop: string) => (prop === 'size' ? size : prop === 'threshold' ? 0.5 : 1),
            getMapInfo: (prop: string) =>
                withMap && prop === 'size'
                    ? {
                          sourceTexture: {key: 'src'},
                          channel: 'luminance',
                          window: () => ({inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 100, curve: 0}),
                      }
                    : null,
            onCleanup: () => {},
            onResize: () => {},
        } as unknown as GpuFragmentParams
        const result = Glow.compute!(params) as {getComputeNodes: () => unknown[]; bindInputs?: (r: (k: string) => unknown) => void} | null
        if (!result) return {result: null, requested}
        result.bindInputs?.((key: string) => {
            requested.push(key)
            return {texture: {}}
        })
        return {result, steps: result.getComputeNodes().length, requested}
    }

    it('a `map` driver on size binds child + map source; a map keeps the pass even when base size is 0', () => {
        const {result, steps, requested} = invokeCompute(true, 0)
        expect(result).not.toBeNull() // size=0 bypass does NOT apply to the map path
        expect(steps).toBe(3) // pre-pass + variable H + variable V
        expect(new Set(requested).size).toBe(2) // child RTT + map source both resolved
        expect(requested).toContain('src')
    })

    it('no map driver + size=0 → compute bypassed (null); the source is never requested', () => {
        const {result} = invokeCompute(false, 0)
        expect(result).toBeNull()
    })

    it('no map driver + size>0 → scalar path, the map source is never requested', () => {
        const {requested} = invokeCompute(false, 25)
        expect(requested).not.toContain('src')
    })
})

describe('Glow (d) CPU golden — bloom composite', () => {
    it('adds intensity-scaled bloom, composites glow alpha over the original', () => {
        // original α=0.5, bloom α=0.5, intensity=1 → glowAlpha=clamp(0.5,0,1)=0.5;
        // finalAlpha = 0.5 + 0.5·(1-0.5) = 0.75; finalColor = 0.2 + 0.5·1 = 0.7
        const out = glowCompose(d.vec4f(0.2, 0.2, 0.2, 0.5), d.vec4f(0.5, 0.5, 0.5, 0.5), 1)
        expect(out.x).toBeCloseTo(0.7, 6)
        expect(out.w).toBeCloseTo(0.75, 6)
    })

    it('glow alpha saturates at 1 for a bright bloom × high intensity', () => {
        // bloom α=1, intensity=2 → glowAlpha=clamp(2,0,1)=1; original α=1 → finalAlpha=1; color=0.2+1·2=2.2
        const out = glowCompose(d.vec4f(0.2, 0.2, 0.2, 1), d.vec4f(1, 1, 1, 1), 2)
        expect(out.x).toBeCloseTo(2.2, 6)
        expect(out.w).toBeCloseTo(1, 6)
    })
})
