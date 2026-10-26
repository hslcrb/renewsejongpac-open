import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Ascii from '@coreroot/shaders/Ascii/index'
import {asciiGrid, asciiAtlasUV, asciiCompose} from '@coreroot/gpu/kit/stylizePaints'

/**
 * Ascii port gate (W7-C) — an RTT stylization filter: sample the child's per-cell brightness, map it
 * through a gamma curve to a glyph index, sample the glyph MEDIA atlas (nearestClamp), tint by the
 * cell color. GPU-free: mock root + injected createMediaTexture. The 3 pure bodies are CPU-goldened.
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
const mockMediaTexture = () => ({texture: {}, width: 2048, height: 2048, write: vi.fn(), unwrap: vi.fn(), destroy: vi.fn()})
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
        const extra: FieldInit[] = []
        for (const [name, cfg] of Object.entries((s.def.extraFields ?? {}))) extra.push({name, schema: (cfg as {schema: unknown}).schema as never, initial: (cfg as {initial: unknown}).initial as never})
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: 1}]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...extra, ...synthetic]) as never
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
const tree = () => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'as', def: Ascii as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'as', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('Ascii (a) glyph-atlas stylization filter', () => {
    it('samples child brightness + glyph media atlas, composes tinted glyph', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.rttPasses.length).toBe(1)
        expect(ir.textures.map((t) => t.kind)).toContain('media')
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/asciiGrid/)
        expect(wgsl).toMatch(/asciiAtlasUV/)
        expect(wgsl).toMatch(/asciiCompose/)
        expect(wgsl).toMatch(/textureSample\(rtt_0/)   // child cell sample
        expect(wgsl).toMatch(/textureSample\(media_0/) // glyph atlas (nearestClamp)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Ascii (b) CPU goldens — grid / atlasUV / compose', () => {
    it('asciiGrid: cell centre + local UV + out-of-bounds mask', () => {
        const g = asciiGrid(d.vec2f(0.5, 0.5), d.vec2f(800, 600), 30, 1.0) as unknown as {
            cellCenter: {x: number; y: number}; cellUV: {x: number; y: number}; isOutside: number
        }
        expect(g.cellCenter.x).toBeCloseTo(24.5 / 48, 4)
        expect(g.cellCenter.y).toBeCloseTo(18.5 / 36, 4)
        expect(g.cellUV.x).toBeCloseTo(0, 5)
        expect(g.cellUV.y).toBeCloseTo(0, 5)
        expect(g.isOutside).toBeCloseTo(0, 5)
    })
    it('asciiAtlasUV: bright → first glyph, dark → last (inverted brightness)', () => {
        const bright = asciiAtlasUV(d.vec3f(1, 1, 1), 1, 9, 3, 1, d.vec2f(0.5, 0.5)) as unknown as {x: number; y: number}
        expect(bright.x).toBeCloseTo(1 / 6, 4) // charIndex 0 → col 0, +0.5 cell
        expect(bright.y).toBeCloseTo(1 / 6, 4)
        const dark = asciiAtlasUV(d.vec3f(0, 0, 0), 1, 9, 3, 1, d.vec2f(0.5, 0.5)) as unknown as {x: number; y: number}
        expect(dark.x).toBeCloseTo((2 + 0.5) / 3, 4) // charIndex 8 → col 2
        expect(dark.y).toBeCloseTo((2 + 0.5) / 3, 4) // row 2
    })
    it('asciiCompose: glyph tints by cell color; background/out-of-bounds → transparent', () => {
        const glyph = asciiCompose(d.vec3f(1, 1, 1), d.vec4f(0.5, 0.5, 0.5, 1), 0, 0, 1) as unknown as {x: number; w: number}
        expect(glyph.x).toBeCloseTo(0.5, 5)
        expect(glyph.w).toBeCloseTo(1, 5)
        const bg = asciiCompose(d.vec3f(0, 0, 0), d.vec4f(0.5, 0.5, 0.5, 1), 0, 0, 1) as unknown as {w: number}
        expect(bg.w).toBeCloseTo(0, 5) // charBrightness < 0.1 → background → transparent
    })
})
