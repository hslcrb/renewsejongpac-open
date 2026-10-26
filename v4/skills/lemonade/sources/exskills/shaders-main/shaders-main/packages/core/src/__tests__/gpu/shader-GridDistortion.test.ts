import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import GridDistortion from '@coreroot/shaders/GridDistortion/index'
import {makeSplatUpdateKernel, makeSplatOutputKernel} from '@coreroot/std/effects/pointerFields'
import {gridCellSnap, gridDistortOffsetUV} from '@coreroot/gpu/kit/warpMaps'

/**
 * GridDistortion port gate (W7-B) — a mouse-driven grid displacement sim (single vec4 state buffer,
 * baked-per-compose grid size) consumed by BOTH the fragment (grid-snapped RTT sample) and the
 * analytic uvRemap fold. Child-INDEPENDENT compute (no bindInputs). GPU-free.
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
const nestedTree = (meta?: Partial<NodeMetadata>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'gd', def: GridDistortion as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0, ...meta}},
    {id: 'gen', def: Generator, parentId: 'gd', metadata: {renderOrder: 0}},
] as NodeSpec[]

const FRAME = {pointer: {x: 0.5, y: 0.5}, deltaTime: 0.016, dimensions: {width: 800, height: 600}}

describe('GridDistortion (a) analytic uvRemap fold', () => {
    it('default → folds; runs the compute, snaps to grid + offsets UV by the displacement', () => {
        const {registry, root} = buildRegistry(nestedTree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.computeSteps[0].bindInputs).toBeUndefined()
        expect(ir.computeSteps[0].getComputeNodes(FRAME)?.length).toBe(2) // update + output
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/gridCellSnap/)
        expect(finalWgsl).toMatch(/gridDistortOffsetUV/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('uvRemap-fold')
    })
})

describe('GridDistortion (b) fragment RTT path (fallback trigger)', () => {
    it('opacity < 1 forces the fragment: grid-snap sample displaced + edge-handle + unpremultiply', () => {
        const {registry, root} = buildRegistry(nestedTree({opacity: 0.5}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.rttPasses.length).toBeGreaterThanOrEqual(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/gridCellSnap/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
    })
})

describe('GridDistortion (c) kernels resolve (D3 rules)', () => {
    it('update / output kernels (grid-size baked) resolve with storage buffers + textureStore', () => {
        expect(tgpu.resolve([makeSplatUpdateKernel(20)], {names: 'strict'})).toMatch(/pointerSplatUpdate/)
        const out = tgpu.resolve([makeSplatOutputKernel(20)], {names: 'strict'})
        expect(out).toMatch(/textureStore/)
        expect(out).toMatch(/pointerSplatOutput/)
    })
})

describe('GridDistortion (d) CPU golden — cell snap + offset', () => {
    it('snaps to cell centres (square aspect) and offsets by the clamped displacement', () => {
        // aspect 1 → cellsX = cellsY = 4. uv (0.1,0.1) is in cell 0 → centre (0.125, 0.125).
        const snap = gridCellSnap(d.vec2f(0.1, 0.1), 4, 1) as unknown as {x: number; y: number}
        expect(snap.x).toBeCloseTo(0.125, 5)
        expect(snap.y).toBeCloseTo(0.125, 5)
        const off = gridDistortOffsetUV(d.vec2f(0.5, 0.5), d.vec2f(0.05, 0)) as unknown as {x: number}
        expect(off.x).toBeCloseTo(0.45, 5)
        const clamp = gridDistortOffsetUV(d.vec2f(0.5, 0.5), d.vec2f(1, 0)) as unknown as {x: number}
        expect(clamp.x).toBeCloseTo(0.4, 5) // disp 1 clamps to 0.1 → 0.5-0.1
    })
})
