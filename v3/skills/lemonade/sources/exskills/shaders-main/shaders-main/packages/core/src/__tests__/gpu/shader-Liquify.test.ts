import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Liquify from '@coreroot/shaders/Liquify/index'
import {springLatticeKernel, springLatticeOutputKernel} from '@coreroot/std/effects/pointerFields'
import {liquifyOffsetUV} from '@coreroot/gpu/kit/warpMaps'

/**
 * Liquify port gate (W7-B) — a spring-mass cloth sim (attributeArray → createStateBuffer) driving a
 * displacement texture, consumed by BOTH the fragment (RTT sample at the displaced UV) AND the
 * analytic `uvRemap` fold (bend the composed UV by the same displacement — §4.5 compute+uvRemap).
 * The compute is child-INDEPENDENT (no bindInputs); shared offset-UV body keeps the two paths in sync.
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

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {'use gpu'; return d.vec4f(uv.x, uv.y, 0.5, 1.0)})
const Generator: GpuShaderDefinition = {
    name: 'Generator', acceptsUVContext: true, props: {} as never,
    fragment: ({ctx, uvContext}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uvContext ?? ctx.uv]),
}
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
// Nested: Liquify wraps a single UV-context generator → analytic uvRemap fold eligible by default.
const nestedTree = (liqProps?: Record<string, unknown>, liqMeta?: Partial<NodeMetadata>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'liq', def: Liquify as GpuShaderDefinition, parentId: 'root', props: liqProps, metadata: {renderOrder: 0, ...liqMeta}},
    {id: 'gen', def: Generator, parentId: 'liq', metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('Liquify (a) analytic uvRemap fold (compute displacement bends the generator UV)', () => {
    it('default → folds; runs the compute, offsets UV by the sampled displacement', () => {
        const {registry, root} = buildRegistry(nestedTree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.computeSteps[0].bindInputs).toBeUndefined()
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(3) // spring A→B, B→A, output
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/liquifyOffsetUV/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/) // displacement, sampled in uvRemap
        expect(finalWgsl).toMatchSnapshot('uvRemap-fold')
    })
})

describe('Liquify (b) fragment RTT path (fallback trigger)', () => {
    it('opacity < 1 forces the fragment: RTT the child, sample displaced + edge-handle + unpremultiply', () => {
        const {registry, root} = buildRegistry(nestedTree(undefined, {opacity: 0.5}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.rttPasses.length).toBeGreaterThanOrEqual(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/liquifyOffsetUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
    })
})

describe('Liquify (c) kernels resolve (D3 rules)', () => {
    it('spring / output kernels resolve with storage buffers + textureStore', () => {
        expect(tgpu.resolve([springLatticeKernel], {names: 'strict'})).toMatch(/springLatticeStep/)
        const out = tgpu.resolve([springLatticeOutputKernel], {names: 'strict'})
        expect(out).toMatch(/textureStore/)
        expect(out).toMatch(/springLatticeOutput/)
    })
})

describe('Liquify (d) CPU golden — offset UV', () => {
    it('zero displacement → identity; positive displacement subtracts the clamped, scaled offset', () => {
        const id = liquifyOffsetUV(d.vec2f(0.5, 0.5), d.vec2f(0, 0), 10) as unknown as {x: number; y: number}
        expect(id.x).toBeCloseTo(0.5, 6)
        // disp.x=0.1, intensity=10 → scaled 0.1 (≤ maxDisp 0.15) → uv.x - 0.1 = 0.4.
        const off = liquifyOffsetUV(d.vec2f(0.5, 0.5), d.vec2f(0.1, 0), 10) as unknown as {x: number}
        expect(off.x).toBeCloseTo(0.4, 5)
        // disp.x=1 → scaled 1.0 clamps to 0.15 → uv.x - 0.15 = 0.35.
        const clamp = liquifyOffsetUV(d.vec2f(0.5, 0.5), d.vec2f(1, 0), 10) as unknown as {x: number}
        expect(clamp.x).toBeCloseTo(0.35, 5)
    })
})
