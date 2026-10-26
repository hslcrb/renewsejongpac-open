import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import GlassTiles from '@coreroot/shaders/GlassTiles/index'
import {glassTilesUV} from '@coreroot/gpu/kit/motionBlur'

/**
 * GlassTiles port gate (Phase D2-C). Analytic uvRemap distortion (no edge modes, no time).
 * Resolve+snapshot both paths; assert the uvRemap path folds inline (no RTT) and clamps the UV;
 * CPU golden the tiled-refraction body.
 */
function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) { return buffer })}
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}

const genBody = tgpu.fn([d.f32, d.vec2f], d.vec4f)((seed, uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, seed, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    acceptsUVContext: true,
    props: {seed: {default: 0.5}} as never,
    fragment: ({uniforms, uvContext, ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uniforms.seed, uvContext ?? ctx.uv]),
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
}

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

function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore} {
    const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const props = {...defaultsFor(s.def), ...(s.props ?? {})}
        const propFields = bridgeFieldInits(s.def, props, s.id)
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
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
    const root = specs.find((s) => s.parentId === null)!
    const registry: RegistryView = {
        rootId: root.id,
        getNode: (id) => nodes.get(id),
        getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: () => null,
        store,
    }
    return {registry, store}
}

const GT = GlassTiles as GpuShaderDefinition

describe('GlassTiles (a) analytic UV fold over a generator', () => {
    it('folds glassTilesUV into the generator sample coordinate (inline, no RTT), clamps the UV', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'gt', def: GT, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'gt', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/glassTilesUV/)
        expect(finalWgsl).toMatch(/edgeClampUV/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('glasstiles-uvremap')
    })
})

describe('GlassTiles (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the distorted coord, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'gt', def: GT, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'gt', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/glassTilesUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('glasstiles-fragment')
    })
})

describe('GlassTiles (c) CPU golden — tiled-refraction math', () => {
    const golden = (uv: [number, number], aspect: number, intensity: number, base: number, rotDeg: number, roundness: number): [number, number] => {
        const isWide = aspect > 1
        const tcx = isWide ? base : base * aspect
        const tcy = isWide ? base / aspect : base
        const acu: [number, number] = [uv[0] * aspect, uv[1]]
        const rr = rotDeg * (Math.PI / 180)
        const c = Math.cos(rr), s = Math.sin(rr)
        const cx = acu[0] - 0.5 * aspect, cy = acu[1] - 0.5
        const rx = cx * c - cy * s, ry = cx * s + cy * c
        const ru: [number, number] = [rx + 0.5 * aspect, ry + 0.5]
        const grid: [number, number] = [ru[0] / aspect, ru[1]]
        const cell: [number, number] = [Math.floor(grid[0] * tcx) / tcx, Math.floor(grid[1] * tcy) / tcy]
        const local: [number, number] = [grid[0] - cell[0], grid[1] - cell[1]]
        const norm: [number, number] = [local[0] / (1 / tcx), local[1] / (1 / tcy)]
        const fc: [number, number] = [norm[0] - 0.5, norm[1] - 0.5]
        const dist = fc[0] * fc[0] + fc[1] * fc[1]
        const rf = 1 - dist * (roundness * 4)
        const cr = Math.max(rf, 0)
        const sf = intensity * 0.025 * cr
        return [uv[0] + (fc[0] * sf) / aspect, uv[1] + fc[1] * sf]
    }

    const cases: {uv: [number, number]; aspect: number; intensity: number; base: number; rot: number; roundness: number}[] = [
        {uv: [0.3, 0.7], aspect: 800 / 600, intensity: 2, base: 20, rot: 0, roundness: 0},
        {uv: [0.62, 0.18], aspect: 16 / 9, intensity: 5, base: 12, rot: 45, roundness: 0.6},
        {uv: [0.9, 0.44], aspect: 0.6, intensity: 8, base: 30, rot: 210, roundness: 1},
    ]

    it('glassTilesUV reproduces the original displacement', () => {
        for (const c of cases) {
            const out = glassTilesUV(d.vec2f(c.uv[0], c.uv[1]), c.aspect, c.intensity, c.base, c.rot, c.roundness) as {x: number; y: number}
            const [ex, ey] = golden(c.uv, c.aspect, c.intensity, c.base, c.rot, c.roundness)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})
