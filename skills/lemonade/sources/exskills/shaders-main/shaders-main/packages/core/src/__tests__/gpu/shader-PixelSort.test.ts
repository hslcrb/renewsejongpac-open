import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import PixelSort, {makePixelSortKernels} from '@coreroot/shaders/PixelSort/index'
import {makeAspectBrushWeight} from '@coreroot/gpu/scaffolds/gridKernels'

/**
 * PixelSort port gate (W6-D) — an odd-even transposition sort over persistent ping-pong state buffers
 * (attributeArray → createStateBuffer). GPU-free: a mock root answers compute allocations so the
 * compute↔RTT↔fragment wiring runs. The fragment samples the state texture (sorted source coord) +
 * the child at that coord. Kernels resolve to WGSL; `brushWeight` is pure → CPU-goldened.
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
    {id: 'ps', def: PixelSort as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'ps', metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('PixelSort (a) compute → RTT input → state-lookup fragment', () => {
    it('RTTs the child, registers a state texture, samples state (nearest) + the child at the sorted UV', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // Default axis = vertical: the sorted coordinate lands in the UV's y slot.
        expect(finalWgsl).toMatch(/vec2f\(uv\.x, /)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('getComputeNodes returns luma + swap(s) + output; bindInputs resolves the child RTT', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        // Before bindInputs, luma isn't ready → null.
        expect(ir.computeSteps[0].getComputeNodes(FRAME)).toBeNull()
        let requestedKey: string | null = null
        ir.computeSteps[0].bindInputs?.((key) => {
            requestedKey = key
            return {texture: {}}
        })
        expect(requestedKey).toBe('rtt_0')
        // default strength 0.1 → passes = 1 + round(0.4) = 1 → luma + 1 swap + output = 3 steps.
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(3)
    })

    it('horizontal axis switches the fragment UV assembly', () => {
        const specs = tree()
        specs[1].props = {axis: 'horizontal'}
        const {registry, root} = buildRegistry(specs)
        const ir = composeNodeTree(registry, composeOpts(root))
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/, uv\.y\)/) // sorted coordinate in the UV's x slot
    })
})

describe('PixelSort (b) fragment fallback when compute is unavailable', () => {
    it('passthrough (unpremultiplied) with no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('PixelSort (c) kernels resolve (D3 rules)', () => {
    it('luma / swap / output kernels resolve with textureLoad / storage buffers / textureStore', () => {
        const set = makePixelSortKernels(true, -1)
        const luma = tgpu.resolve([set.key], {names: 'strict'})
        expect(luma).toMatch(/textureLoad/)
        expect(luma).toMatch(/pixelSortLuma/)
        const swap = tgpu.resolve([set.swap0], {names: 'strict'})
        expect(swap).toMatch(/pixelSortSwap/)
        expect(swap).toMatch(/aspectBrushWeight/)
        const output = tgpu.resolve([set.output], {names: 'strict'})
        expect(output).toMatch(/textureStore/)
        expect(output).toMatch(/pixelSortOutput/)
        expect(swap).toMatchSnapshot('swapKernel')
    })
})

describe('PixelSort (d) CPU golden — brush weight (kit aspectBrushWeight)', () => {
    it('1 at the cursor centre, 0 beyond the radius', () => {
        const brushWeight = makeAspectBrushWeight(512)
        // cell (256,256)/512 = (0.5,0.5) = mouse → dist 0 → weight 1 (0 < inner).
        const atCenter = brushWeight(256, 256, 0.5, 0.5, 0.2, 0.5, 1) as unknown as number
        expect(atCenter).toBeCloseTo(1, 6)
        // cell (0,0) → dist 0.5√2 ≫ radius → 0.
        const far = brushWeight(0, 0, 0.5, 0.5, 0.2, 0.5, 1) as unknown as number
        expect(far).toBeCloseTo(0, 6)
    })
})
