import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import PixelThrow from '@coreroot/shaders/PixelThrow/index'

/**
 * PixelThrow port gate (W7-C) — an RTT filter that drags the child along a per-frame CPU throw-field
 * (rgba16float .rg displacement) scaled by a per-pixel key; edges via applyEdgeHandlingExpr. GPU-free:
 * mock root + injected createDataTexture; the offset + key-scale bodies are CPU-goldened.
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
const mockMediaTexture = () => ({texture: {}, width: 128, height: 128, write: vi.fn(), unwrap: vi.fn(), destroy: vi.fn()})
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
    for (const s of specs) {
        nodes.set(s.id, {id: s.id, componentName: s.def.name, parentId: s.parentId, definition: s.def, metadata: {blendMode: 'normal', opacity: undefined, renderOrder: 0, ...s.metadata} as NodeMetadata, handles: handlesById[s.id]})
    }
    for (const s of specs) if (s.parentId) { const arr = childrenByParent.get(s.parentId) ?? []; arr.push(nodes.get(s.id)!); childrenByParent.set(s.parentId, arr) }
    const rootNode = specs.find((s) => s.parentId === null)!
    return {registry: {rootId: rootNode.id, getNode: (id) => nodes.get(id), getChildren: (parentId) => childrenByParent.get(parentId) ?? [], resolveCustomId: () => null, store}, root}
}
const composeOpts = (root: unknown) => ({flipY: false, dimensions: {width: 800, height: 600}, gpu: {device: (root as {device: unknown}).device, root} as never, createDataTexture: () => mockMediaTexture() as never})
const tree = (props?: Record<string, unknown>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'pt', def: PixelThrow as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'pt', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('PixelThrow (a) RTT displacement filter over a flow-field data texture', () => {
    it('samples the flow field + child, displaces by key-scaled flow, unpremultiplies', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.rttPasses.length).toBe(1)
        expect(ir.textures.map((t) => t.kind)).toContain('media')
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // The throw displacement and key scale are declaration-site algebra now (no named fns):
        // the flow vector binds to a local reused by the probe and the final displacement, and the
        // default luminance key is the dot against the luma weights.
        expect(wgsl).toMatch(/flowVec/)
        expect(wgsl).toMatch(/0\.299/) // luminance key (default throwKey)
        expect(wgsl).toMatch(/textureSample\(rtt_0/)
        expect(wgsl).toMatch(/textureSample\(media_0/)
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
    it('darkness key mode emits a different key-scale body', () => {
        const {registry, root} = buildRegistry(tree({throwKey: 'darkness'}))
        const wgsl = tgpu.resolve([composeNodeTree(registry, composeOpts(root)).finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/1 - dot|1\.0* - dot|\(1[f0-9.]* - dot/) // darkness = 1 − luminance
    })
})
