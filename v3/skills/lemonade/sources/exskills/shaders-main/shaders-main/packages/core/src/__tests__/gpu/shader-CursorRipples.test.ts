import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import {waves, displace} from '@coreroot/gpu/kit'
import CursorRipples from '@coreroot/shaders/CursorRipples/index'

/**
 * CursorRipples gate — the std Phase-0 simulation tracer. A GPU wave-equation sim over two
 * ping-pong height-field state buffers + a gradient pass writing an RG displacement texture,
 * authored entirely in std nouns: `simulate.grid({history: 2, step: [op.wave, op.splat(pointer)],
 * derive: {displacement: op.gradient()}})` consumed by `displaceBy(...)`. The GPU bodies are kit
 * primitives (`waves.buildWaveFieldKernels`, `displace.chromaticDisplaceUVs`). The compute is
 * CHILD-INDEPENDENT (a pure wave field, no bindInputs). The fragment RTTs the child and samples it
 * at the chromatic-split displaced UVs. GPU-free: a mock root answers allocations.
 */
const {propagateKernel, gradientKernel} = waves.buildWaveFieldKernels(128)

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
    {id: 'cr', def: CursorRipples as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'cr', metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('CursorRipples (a) compute wave field → displacement texture → chromatic fragment', () => {
    it('RTTs the child, registers a displacement (compute) texture, samples it + the child (3 chromatic taps)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/chromaticDisplaceUVs/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/) // the displacement gradient
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/) // the child
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('getComputeNodes returns propagate + gradient (2 steps, child-independent → no bindInputs)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].bindInputs).toBeUndefined()
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(2)
    })
})

describe('CursorRipples (b) fragment fallback when compute is unavailable', () => {
    it('passthrough (unpremultiplied, 0 displacement) with no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('CursorRipples (c) compileTime edges branch', () => {
    it('mirror edges emit edgeMirrorUV; wrap emits edgeWrapUV', () => {
        const mirror = tree(); mirror[1].props = {edges: 'mirror'}
        const {registry: r1, root: root1} = buildRegistry(mirror)
        expect(tgpu.resolve([composeNodeTree(r1, composeOpts(root1)).finalPass.entry], {names: 'strict'})).toMatch(/edgeMirrorUV/)
        const wrap = tree(); wrap[1].props = {edges: 'wrap'}
        const {registry: r2, root: root2} = buildRegistry(wrap)
        expect(tgpu.resolve([composeNodeTree(r2, composeOpts(root2)).finalPass.entry], {names: 'strict'})).toMatch(/edgeWrapUV/)
    })
})

describe('CursorRipples (d) kernels resolve (D3 rules)', () => {
    it('propagate / gradient kernels resolve with storage buffers + textureStore', () => {
        const prop = tgpu.resolve([propagateKernel as never], {names: 'strict'})
        expect(prop).toMatch(/waveFieldPropagate_128/)
        const grad = tgpu.resolve([gradientKernel as never], {names: 'strict'})
        expect(grad).toMatch(/textureStore/)
        expect(grad).toMatch(/waveFieldGradient_128/)
        expect(prop).toMatchSnapshot('propagateKernel')
    })
})

describe('CursorRipples (e) CPU golden — chromatic UVs', () => {
    it('zero displacement → all three taps sample the source UV; positive split spreads r/b', () => {
        const at = displace.chromaticDisplaceUVs(d.vec2f(0.5, 0.5), d.vec2f(0, 0), 10, 1) as unknown as {rUV: {x: number; y: number}; gUV: {x: number}; bUV: {x: number}}
        expect(at.rUV.x).toBeCloseTo(0.5, 6)
        expect(at.gUV.x).toBeCloseTo(0.5, 6)
        expect(at.bUV.x).toBeCloseTo(0.5, 6)
        // disp.x = 0.1 → scaled = 0.1 (intensity 10 · 0.1) → clamped 0.1; r offset ×1.1, b ×0.9.
        const off = displace.chromaticDisplaceUVs(d.vec2f(0.5, 0.5), d.vec2f(0.1, 0), 10, 1) as unknown as {rUV: {x: number}; gUV: {x: number}; bUV: {x: number}}
        expect(off.gUV.x).toBeCloseTo(0.4, 5)
        expect(off.rUV.x).toBeCloseTo(0.5 - 0.1 * 1.1, 5)
        expect(off.bUV.x).toBeCloseTo(0.5 - 0.1 * 0.9, 5)
    })
})
