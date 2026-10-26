import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ChannelBlur from '@coreroot/shaders/ChannelBlur/index'
import {channelBlurCompose, channelIntensityToRadius, CHANNEL_INTENSITY_TO_RADIUS} from '@coreroot/gpu/kit/blur'

/**
 * ChannelBlur port gate (Phase D3-A). GPU-free: a mock root answers the compute allocations so the
 * compute↔RTT↔fragment wiring runs inside `composeNodeTree` — `convertToTexture(childNode)` →
 * child RTT, a single fixed Gaussian at the MAX per-channel radius, `registerComputeTexture` →
 * a sampleable buffer, and the fragment's per-channel `mix(sharp, blurred, channelRadius/maxRadius)`
 * → unpremultiply. Plus a CPU golden on the compose body's per-channel mix math.
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
const tree = () => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'cb', def: ChannelBlur as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'cb', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('ChannelBlur (a) compute → RTT input → fragment composite', () => {
    it('RTTs the child, registers a compute-output texture, and per-channel mixes sharp↔blurred', () => {
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
        expect(finalWgsl).toMatch(/channelBlurCompose/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('getComputeNodes returns the two Gaussian passes (fixed blur, no fill kernel)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes({})?.length).toBe(2)
    })

    it('bindInputs resolves the child RTT key and binds the H-pass input', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        let requestedKey: string | null = null
        ir.computeSteps[0].bindInputs?.((key) => {
            requestedKey = key
            return {texture: {}}
        })
        expect(requestedKey).toBe('rtt_0')
    })
})

describe('ChannelBlur (b) fragment fallback when compute is unavailable', () => {
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

describe('ChannelBlur (c) CPU golden — per-channel radius + compose mix', () => {
    it('channelIntensityToRadius is the verbatim v1 factor (× 0.1)', () => {
        expect(CHANNEL_INTENSITY_TO_RADIUS).toBe(0.1)
        expect(channelIntensityToRadius(0)).toBe(0)
        expect(channelIntensityToRadius(50)).toBeCloseTo(5, 10)
        expect(channelIntensityToRadius(100)).toBeCloseTo(10, 10)
    })

    it('compose mixes each channel by channelRadius / maxRadius; alpha from sharp', () => {
        const sharp = d.vec4f(0.2, 0.4, 0.6, 1.0)
        const blurred = d.vec4f(0.8, 0.8, 0.8, 0.5)
        // red=0, green=50, blue=100 → radii (0, 5, 10) → maxRadius=10 → mix factors (0, 0.5, 1.0)
        const out = channelBlurCompose(sharp, blurred, 0, 50, 100)
        expect(out.x).toBeCloseTo(0.2, 6) // red untouched (rMix=0)
        expect(out.y).toBeCloseTo(0.6, 6) // mix(0.4, 0.8, 0.5)
        expect(out.z).toBeCloseTo(0.8, 6) // blurred (bMix=1)
        expect(out.w).toBeCloseTo(1.0, 6) // alpha from sharp
    })

    it('all channels zero → maxRadius clamps to 0.01, every channel stays sharp', () => {
        const sharp = d.vec4f(0.3, 0.5, 0.7, 0.9)
        const blurred = d.vec4f(1.0, 1.0, 1.0, 1.0)
        const out = channelBlurCompose(sharp, blurred, 0, 0, 0)
        expect(out.x).toBeCloseTo(0.3, 6)
        expect(out.y).toBeCloseTo(0.5, 6)
        expect(out.z).toBeCloseTo(0.7, 6)
        expect(out.w).toBeCloseTo(0.9, 6)
    })
})
