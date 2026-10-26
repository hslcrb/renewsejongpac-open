import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ObjectTracker from '@coreroot/shaders/ObjectTracker/index'

/**
 * ObjectTracker port gate (W7-C) — a CV-style detection overlay: each pixel walks a spatial partition
 * (grid/quadtree/mosaic, compile-time depth), scans its leaf for content + a tight bbox (JS-unrolled
 * N×N sample loops, textureSampleLevel), and draws a box + optional label. Raw-WGSL builder (Repeater
 * pattern). GPU-free: mock root + injected create*Texture; resolve + per-variant WGSL-token checks.
 */
function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {return buffer})}
    const texture = {$usage: vi.fn(function (this: unknown) {return texture}), destroy: vi.fn(), write: vi.fn()}
    const uniform = {buffer: {}, write: vi.fn(), patch: vi.fn()}
    return {
        createBuffer: vi.fn(() => buffer),
        createBindGroup: vi.fn(() => ({})),
        createTexture: vi.fn(() => texture),
        createUniform: vi.fn(() => uniform),
        device: {},
    } as never
}
const mockMediaTexture = () => ({texture: {}, width: 1024, height: 96, write: vi.fn(), unwrap: vi.fn(), destroy: vi.fn()})
const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => { 'use gpu'; return d.vec4f(uv.x, uv.y, 0.5, 1.0) })
const Generator: GpuShaderDefinition = {name: 'Generator', props: {} as never, fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv])}
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
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: 1}]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.defineSystem()
    store.finalize()
    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) nodes.set(s.id, {id: s.id, componentName: s.def.name, parentId: s.parentId, definition: s.def, metadata: {blendMode: 'normal', opacity: undefined, renderOrder: 0, ...s.metadata} as NodeMetadata, handles: handlesById[s.id]})
    for (const s of specs) if (s.parentId) { const arr = childrenByParent.get(s.parentId) ?? []; arr.push(nodes.get(s.id)!); childrenByParent.set(s.parentId, arr) }
    const rootNode = specs.find((s) => s.parentId === null)!
    return {registry: {rootId: rootNode.id, getNode: (id) => nodes.get(id), getChildren: (parentId) => childrenByParent.get(parentId) ?? [], resolveCustomId: () => null, store}, root}
}
const composeOpts = (root: unknown) => ({flipY: false, dimensions: {width: 800, height: 600}, gpu: {device: (root as {device: unknown}).device, root} as never, createMediaTexture: () => mockMediaTexture() as never})
const tree = (props?: Record<string, unknown>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'ot', def: ObjectTracker as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'ot', metadata: {renderOrder: 0}},
] as NodeSpec[]
const resolve = (props?: Record<string, unknown>): {wgsl: string; kinds: string[]} => {
    const {registry, root} = buildRegistry(tree(props))
    const ir = composeNodeTree(registry, composeOpts(root))
    return {wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'}), kinds: ir.textures.map((t) => t.kind)}
}

describe('ObjectTracker (a) default mosaic layout, no labels', () => {
    it('walks the partition + scans the leaf + draws a box (child RTT via textureSampleLevel)', () => {
        const {wgsl, kinds} = resolve()
        expect(kinds).toContain('rtt')
        expect(kinds).not.toContain('media') // labels off → no glyph atlas
        expect(wgsl).toMatch(/textureSampleLevel\(rtt_0/) // Repeater-trap RTT sampling
        expect(wgsl).toMatch(/fwidth/)
        expect(wgsl).toMatch(/smoothstep/)
        expect(wgsl).toMatch(/43758\.5453/) // mosaic hash
        expect(wgsl).toMatchSnapshot('mosaic-default')
    })
})

describe('ObjectTracker (b) labels on → glyph media atlas', () => {
    it('dimensions labels register a media atlas + emit digit sampling', () => {
        const {wgsl, kinds} = resolve({labelMode: 'dimensions'})
        expect(kinds).toContain('media')
        expect(wgsl).toMatch(/textureSampleLevel\(media_0/) // glyph atlas
        expect(wgsl).toMatch(/textureSampleLevel\(rtt_0/)  // child
        expect(wgsl).toMatchSnapshot('dimensions-labels')
    })
})

describe('ObjectTracker (c) grid layout (depth forced to 0) + quadtree scan', () => {
    it('grid resolves with no subdivision walk', () => {
        const {wgsl} = resolve({layout: 'grid'})
        expect(wgsl).toMatch(/textureSampleLevel\(rtt_0/)
        expect(wgsl).not.toMatch(/43758\.5453/) // grid = no mosaic hash
    })
    it('quadtree scans coverage during the walk', () => {
        const {wgsl} = resolve({layout: 'quadtree'})
        expect(wgsl).toMatch(/textureSampleLevel\(rtt_0/)
        expect(wgsl).toMatch(/0\.98/) // quadtree split test: cov > 0.02 && cov < 0.98
    })
})
