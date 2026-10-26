import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Perspective from '@coreroot/shaders/Perspective/index'
import {perspectiveUV} from '@coreroot/gpu/kit/warpMaps'

/**
 * Perspective port gate (Phase D2-C). Analytic uvRemap distortion, compileTime edges + max()
 * divide guards. Resolve+snapshot both paths; assert edge branches; CPU golden the projection.
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

const P = Perspective as GpuShaderDefinition

describe('Perspective (a) analytic UV fold over a generator', () => {
    it('folds perspectiveUV into the generator sample coordinate (inline, no RTT)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'p', def: P, parentId: 'root', props: {edges: 'stretch'}, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'p', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/perspectiveUV/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('perspective-uvremap')
    })
})

describe('Perspective (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the projected coord, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'p', def: P, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'p', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/perspectiveUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('perspective-fragment')
    })
})

describe('Perspective (c) compile-time edge modes', () => {
    const resolveWithEdges = (edges: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'p', def: P, parentId: 'root', props: {edges}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'p', metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('mirror/wrap/transparent select the matching WGSL; is in the structural hash', () => {
        expect(resolveWithEdges('mirror')).toMatch(/edgeMirrorUV/)
        expect(resolveWithEdges('wrap')).toMatch(/edgeWrapUV/)
        expect(resolveWithEdges('transparent')).toMatch(/edgeTransparentMask/)
        const build = (edges: string) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'p', def: P, parentId: 'root', props: {edges}, metadata: {renderOrder: 0}},
                {id: 'gen', def: Generator, parentId: 'p', metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('mirror')).not.toBe(build('wrap'))
    })
})

describe('Perspective (d) CPU golden — inverse projection', () => {
    const golden = (center: [number, number], pan: number, tilt: number, fov: number, zoom: number, offset: [number, number], uv: [number, number]): [number, number] => {
        const cp: [number, number] = [center[0], 1 - center[1]]
        const x = (uv[0] - cp[0]) / zoom
        const y = (uv[1] - cp[1]) / zoom
        const dr = Math.PI / 180
        const cP = Math.cos(pan * dr), sP = Math.sin(pan * dr), cT = Math.cos(tilt * dr), sT = Math.sin(tilt * dr)
        const pf = Math.tan(fov * dr * 0.5) * 2
        const panD = Math.max(cP + sP * x * pf, 0.001)
        const apx = x / panD
        const apy = y * cP / panD
        const tiltD = Math.max(cT + sT * apy * pf, 0.001)
        const fx = apx * cT / tiltD
        const fy = apy / tiltD
        const op: [number, number] = [offset[0], 1 - offset[1]]
        return [fx + cp[0] - op[0] + 0.5, fy + cp[1] - op[1] + 0.5]
    }

    const cases = [
        {center: [0.5, 0.5] as [number, number], pan: 0, tilt: 0, fov: 60, zoom: 1, offset: [0.5, 0.5] as [number, number], uv: [0.5, 0.5] as [number, number]},
        {center: [0.5, 0.5] as [number, number], pan: 30, tilt: -20, fov: 90, zoom: 1.5, offset: [0.6, 0.4] as [number, number], uv: [0.2, 0.8] as [number, number]},
        {center: [0.3, 0.7] as [number, number], pan: -45, tilt: 15, fov: 40, zoom: 0.8, offset: [0.5, 0.5] as [number, number], uv: [0.9, 0.1] as [number, number]},
    ]

    it('perspectiveUV reproduces the original projection', () => {
        for (const c of cases) {
            const out = perspectiveUV(d.vec2f(c.center[0], c.center[1]), c.pan, c.tilt, c.fov, c.zoom, d.vec2f(c.offset[0], c.offset[1]), d.vec2f(c.uv[0], c.uv[1])) as {x: number; y: number}
            const [ex, ey] = golden(c.center, c.pan, c.tilt, c.fov, c.zoom, c.offset, c.uv)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})
