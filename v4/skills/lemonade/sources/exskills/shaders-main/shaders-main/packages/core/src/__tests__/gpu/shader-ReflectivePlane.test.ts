import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ReflectivePlane from '@coreroot/shaders/ReflectivePlane/index'
import {buildDepthRampFillGraph, mirrorRowUV, planarReflectionCompose} from '@coreroot/std/effects/blurs'

/**
 * ReflectivePlane port gate (W6-D) — a variable-blur compute filter (same plumbing as ProgressiveBlur/
 * TiltShift) with a REFLECTION-composite fragment. GPU-free: a mock root answers compute allocations
 * so the compute↔RTT↔fragment wiring runs; the fragment reflects across the floor, samples the blurred
 * buffer below + the sharp child above, and composites. Fill kernel resolves; compose/reflect goldened.
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
const tree = (props?: Record<string, unknown>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'rp', def: ReflectivePlane as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'rp', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('ReflectivePlane (a) compute → RTT input → reflection-composite fragment', () => {
    it('RTTs the child, registers a compute output, reflects + composites blurred/sharp, unpremultiplies', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/mirrorRowUV/)
        expect(finalWgsl).toMatch(/planarReflectionCompose/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('getComputeNodes returns the fill kernel + the two variable-blur passes (3 steps)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes({})?.length).toBe(3)
    })

    it('bindInputs resolves the child RTT key', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        let requestedKey: string | null = null
        ir.computeSteps[0].bindInputs?.((key) => {
            requestedKey = key
            return {texture: {}}
        })
        expect(requestedKey).toBe('rtt_0')
    })

    it('compile-time edges=mirror emits edgeMirrorUV on the reflected sample', () => {
        const {registry, root} = buildRegistry(tree({edges: 'mirror'}))
        const ir = composeNodeTree(registry, composeOpts(root))
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/edgeMirrorUV/)
    })
})

describe('ReflectivePlane (b) fragment fallback when compute is unavailable', () => {
    it('reflects over the sharp child RTT (no compute textures)', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/planarReflectionCompose/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('ReflectivePlane (c) fill kernel resolves (D3 rules)', () => {
    it('the blur-map fill kernel resolves with a storage textureStore', () => {
        const {layout, kernel} = buildDepthRampFillGraph(1024, 640)
        const wgsl = tgpu.resolve([layout, kernel], {names: 'strict'})
        expect(wgsl).toMatch(/depthRampFillBlurMap/)
        expect(wgsl).toMatch(/textureStore/)
        expect(wgsl).toMatchSnapshot('fillBlurMap')
    })
})

describe('ReflectivePlane (d) CPU golden — reflect + compose', () => {
    it('mirrorRowUV mirrors uv.y across the floor (2·floorY − uv.y)', () => {
        const out = mirrorRowUV(d.vec2f(0.4, 0.9), 0.7) as unknown as {x: number; y: number}
        expect(out.x).toBeCloseTo(0.4, 6)
        expect(out.y).toBeCloseTo(0.5, 6) // 2*0.7 - 0.9
    })

    it('above the floor returns the original content untouched', () => {
        const original = d.vec4f(0.1, 0.5, 0.3, 0.8)
        const refl = d.vec4f(0.8, 0.2, 0.4, 0.9)
        const out = planarReflectionCompose(original, refl, 0.3, 0.7, 0.5, 0.5) as unknown as {x: number; y: number; z: number; w: number}
        expect(out.x).toBeCloseTo(0.1, 6)
        expect(out.y).toBeCloseTo(0.5, 6)
        expect(out.z).toBeCloseTo(0.3, 6)
        expect(out.w).toBeCloseTo(0.8, 6)
    })

    it('below the floor composites the faded reflection "over" the original', () => {
        // uvY=0.75 floorY=0.6 distance=0.3 falloff=1 → visibility 0.5 (smoothstep(0,0.3,0.15)).
        const original = d.vec4f(0.1, 0.5, 0.3, 0.8)
        const refl = d.vec4f(0.8, 0.2, 0.4, 0.9)
        const out = planarReflectionCompose(original, refl, 0.75, 0.6, 0.3, 1) as unknown as {x: number; y: number; z: number; w: number}
        // effReflA = 0.9*0.5 = 0.45; oneMinusReflA = 0.55.
        expect(out.x).toBeCloseTo(0.8 * 0.5 + 0.1 * 0.55, 5) // 0.455
        expect(out.y).toBeCloseTo(0.2 * 0.5 + 0.5 * 0.55, 5) // 0.375
        expect(out.z).toBeCloseTo(0.4 * 0.5 + 0.3 * 0.55, 5) // 0.365
        expect(out.w).toBeCloseTo(0.45 + 0.8 * 0.55, 5) // 0.89
    })
})
