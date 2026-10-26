import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {buildTruncatedWeights} from '@coreroot/gpu/kit/blur'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Blur from '@coreroot/shaders/Blur/index'
import {intensityToRadius, INTENSITY_TO_RADIUS, buildFillBlurMapGraph, type BlurMapChannel} from '@coreroot/gpu/kit/blur'

/**
 * Blur port gate (Phase D3 — the FIRST compute shader + GATE-B spike). GPU-free: the uniform
 * store's root is mocked, and here the mock ALSO answers the compute allocations
 * (createTexture / createBuffer / createUniform / createGuardedComputePipeline) so the compute
 * hook runs inside `composeNodeTree`, exercising the whole compute↔RTT↔fragment wiring the spike
 * lands: `convertToTexture(childNode)` → child RTT (blur input + sharp layer),
 * `registerComputeTexture(outputTexture)` → a `kind:'compute'` sampleable buffer, `bindInputs`
 * (late input binding), and the fragment that composites blurred RGB + sharp alpha then
 * unpremultiplies. Plus: the `fillBlurMap` kernel resolves (D3 rules), and a CPU golden on the
 * intensity→radius factor + the static weight flow.
 */

// ── mock root: real bindGroupLayouts, mocked device resources (enough for store + compute build) ─
function mockRoot() {
    const buffer = {
        patch: vi.fn(),
        write: vi.fn(),
        destroy: vi.fn(),
        $usage: vi.fn(function (this: unknown) {
            return buffer
        }),
    }
    const texture = {
        $usage: vi.fn(function (this: unknown) {
            return texture
        }),
        destroy: vi.fn(),
        write: vi.fn(),
    }
    const uniform = {buffer: {}, write: vi.fn(), patch: vi.fn()}
    const guarded = {
        with: vi.fn(function (this: unknown) {
            return guarded
        }),
        dispatchThreads: vi.fn(),
    }
    return {
        createBuffer: vi.fn(() => buffer),
        createBindGroup: vi.fn(() => ({})),
        createTexture: vi.fn(() => texture),
        createUniform: vi.fn(() => uniform),
        createGuardedComputePipeline: vi.fn(() => guarded),
        device: {},
    } as never
}

// A minimal generator: the content Blur blurs (RTT'd once as the child).
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

interface NodeSpec {
    id: string
    def: GpuShaderDefinition
    parentId: string | null
    props?: Record<string, unknown>
    metadata?: Partial<NodeMetadata>
    /** d3kit: a custom id a map driver's `source` can resolve to (via registry.resolveCustomId). */
    customId?: string
}

function bridgeFieldInits(def: GpuShaderDefinition, props: Record<string, unknown>, id: string): FieldInit[] {
    const map = createGpuUniformsMap(def as never, props, id)
    const inits: FieldInit[] = []
    for (const [name, u] of Object.entries(map)) {
        inits.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
    }
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
    store.defineSystem() // the group-0 anchor references _sys.time; production always defines it
    store.finalize()

    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) {
        nodes.set(s.id, {
            id: s.id,
            componentName: s.def.name,
            parentId: s.parentId,
            customId: s.customId,
            definition: s.def,
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
    const customIds = new Map<string, string>()
    for (const s of specs) if (s.customId) customIds.set(s.customId, s.id)
    const registry: RegistryView = {
        rootId: rootNode.id,
        getNode: (id) => nodes.get(id),
        getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: (cid) => customIds.get(cid) ?? null,
        store,
    }
    return {registry, store, root}
}

const composeOpts = (root: unknown) => ({
    flipY: false,
    dimensions: {width: 800, height: 600},
    gpu: {device: (root as {device: unknown}).device, root} as never,
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) The compute↔RTT↔fragment wiring — Blur > Generator
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Blur (a) compute → RTT input → fragment composite', () => {
    it('RTTs the child, registers a compute-output texture, and composites blurred RGB + sharp alpha', () => {
        const {registry, root} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'blur', def: Blur as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'blur', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry, composeOpts(root))

        // One compute node, one RTT boundary (the child), and one compute-output texture binding.
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')

        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // Blurred color sampled from the compute-output texture, sharp from the child RTT.
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        // The RTT pass renders the child generator.
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        expect(rttWgsl).toMatch(/genBody/)

        expect(finalWgsl).toMatchSnapshot('final-pass')
        expect(rttWgsl).toMatchSnapshot('rtt-pass')
    })

    it('bindInputs resolves the child RTT key and binds the H-pass input', () => {
        const {registry, root} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'blur', def: Blur as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'blur', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry, composeOpts(root))
        const spec = ir.computeSteps[0]

        let requestedKey: string | null = null
        const bindGroupCallsBefore = (root as unknown as {createBindGroup: {mock: {calls: unknown[]}}}).createBindGroup.mock.calls.length
        spec.bindInputs?.((key) => {
            requestedKey = key
            return {texture: {}}
        })
        const bindGroupCallsAfter = (root as unknown as {createBindGroup: {mock: {calls: unknown[]}}}).createBindGroup.mock.calls.length
        // It asks for the child RTT boundary key and (re)builds the H bind group.
        expect(requestedKey).toBe('rtt_0')
        expect(bindGroupCallsAfter).toBeGreaterThan(bindGroupCallsBefore)
    })

    it('getComputeNodes returns the two Gaussian passes each frame', () => {
        const {registry, root} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'blur', def: Blur as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'blur', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry, composeOpts(root))
        const steps = ir.computeSteps[0].getComputeNodes({})
        expect(steps?.length).toBe(2)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) Fragment fallback — no device (GPU-free): sharp passthrough, unpremultiplied
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Blur (b) fragment fallback when compute is unavailable', () => {
    it('samples the child RTT sharp and unpremultiplies (no compute textures)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'blur', def: Blur as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'blur', metadata: {renderOrder: 0}},
        ])
        // No gpu in options → compute hook returns null → fragment falls back.
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (c) fillBlurMap kernel — GPU-free resolve (banked map-driven D3 port)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Blur (c) fillBlurMap kernel resolves (D3 rules)', () => {
    const channels: BlurMapChannel[] = ['luminance', 'luminanceInverted', 'alpha', 'alphaInverted']
    it('each channel resolves to WGSL with a storage textureStore + sampled textureLoad', () => {
        for (const channel of channels) {
            const {layout, kernel} = buildFillBlurMapGraph(1024, 640, channel)
            const wgsl = tgpu.resolve([layout, kernel], {names: 'strict'})
            expect(wgsl).toMatch(/fillBlurMap/)
            expect(wgsl).toMatch(/textureStore/)
            expect(wgsl).toMatch(/textureLoad/)
            expect(wgsl).toMatchSnapshot(`fillBlurMap-${channel}`)
        }
    })

    it('luminance and alpha channels emit different WGSL (comptime channel branch)', () => {
        const lum = tgpu.resolve([buildFillBlurMapGraph(1024, 640, 'luminance').kernel], {names: 'strict'})
        const alpha = tgpu.resolve([buildFillBlurMapGraph(1024, 640, 'alpha').kernel], {names: 'strict'})
        expect(lum).not.toBe(alpha)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (e) Map-driven intensity → variable blur — the d3kit compute-map interplay
// ═══════════════════════════════════════════════════════════════════════════════════════
// intensity bound to a map: getMapInfo('intensity') hands the compute hook the map-SOURCE RTT
// + channel + remap window, so the hook fills a per-pixel radius map from the source and runs
// the VARIABLE Gaussian (3 compute steps: fill + H + V) instead of the fixed one (2: H + V).
describe('Blur (e) map-driven intensity → variable blur (compute-map interplay)', () => {
    const mapMeta = {
        renderOrder: 1,
        maps: {
            intensity: {type: 'map', source: 'src', channel: 'luminance', inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 100, curve: 0},
        },
    } as unknown as Partial<NodeMetadata>

    function mapDrivenIr() {
        const {registry, root} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            // Map source sibling (customId 'src') — rendered to its own RTT, sampled by the fill kernel.
            {id: 'src', def: Generator, parentId: 'root', customId: 'src', metadata: {renderOrder: 0}},
            // Blur (intensity ← map on 'src') over its own generator child.
            {id: 'blur', def: Blur as GpuShaderDefinition, parentId: 'root', metadata: mapMeta},
            {id: 'gen', def: Generator, parentId: 'blur', metadata: {renderOrder: 0}},
        ])
        return {ir: composeNodeTree(registry, composeOpts(root)), root}
    }

    it('registers TWO RTT boundaries (child + map source) and one compute node', () => {
        const {ir} = mapDrivenIr()
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(2) // child RTT + map-source RTT both render
        const rttCount = ir.textures.filter((t) => t.kind === 'rtt').length
        expect(rttCount).toBe(2)
        expect(ir.textures.some((t) => t.kind === 'compute')).toBe(true)
    })

    it('getComputeNodes returns THREE steps (fill-map + H + V) — the variable path', () => {
        const {ir} = mapDrivenIr()
        const steps = ir.computeSteps[0].getComputeNodes({})
        expect(steps?.length).toBe(3) // static intensity would be 2 (H + V only)
    })

    it('bindInputs binds BOTH the child RTT input and the map-source RTT', () => {
        const {ir, root} = mapDrivenIr()
        const requested: string[] = []
        const before = (root as unknown as {createBindGroup: {mock: {calls: unknown[]}}}).createBindGroup.mock.calls.length
        ir.computeSteps[0].bindInputs?.((key) => {
            requested.push(key)
            return {texture: {}}
        })
        const after = (root as unknown as {createBindGroup: {mock: {calls: unknown[]}}}).createBindGroup.mock.calls.length
        // Two distinct RTT keys resolved (variable-blur H input + fill-kernel source), each builds a bind group.
        expect(new Set(requested).size).toBe(2)
        expect(after).toBeGreaterThan(before)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (d) CPU golden — intensity→radius factor + the static weight flow (kit buildTruncatedWeights)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Blur (d) CPU golden — intensity → radius → weights', () => {
    it('intensityToRadius is the verbatim v1 factor (× 0.36)', () => {
        expect(INTENSITY_TO_RADIUS).toBe(0.36)
        expect(intensityToRadius(50)).toBeCloseTo(18, 10) // v1 default
        expect(intensityToRadius(100)).toBeCloseTo(36, 10)
        expect(intensityToRadius(0)).toBe(0)
        expect(intensityToRadius(200)).toBeCloseTo(72, 10)
    })

    it('radius → sigmaH → truncated weights reproduces the v1 static path', () => {
        // Default intensity 50 → radius 18 → sigmaH = radius × 0.5 = 9 (kit updateWeights).
        const radius = intensityToRadius(50)
        const sigmaH = Math.max(radius * 0.5, 0.001)
        expect(sigmaH).toBeCloseTo(9, 10)
        const {weights, activeHalf} = buildTruncatedWeights(24, sigmaH)
        // ceil(3σ)=27 clamped to the 24 half-kernel; normalized, symmetric within the window.
        expect(activeHalf).toBe(24)
        expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9)
        for (let i = 1; i <= 24; i++) expect(weights[24 + i]).toBeCloseTo(weights[24 - i], 12)
    })
})
