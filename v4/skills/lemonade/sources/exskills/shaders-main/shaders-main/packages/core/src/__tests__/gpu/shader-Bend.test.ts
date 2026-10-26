import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Bend from '@coreroot/shaders/Bend/index'
import {bendRemap} from '@coreroot/gpu/kit/warpMaps'

/**
 * Bend gate — an analytic curved-sheet distortion (parabola z = b·s² along the bend axis, viewed
 * in perspective; the shader inverts the projection per pixel). GPU-free: mocked store root, real
 * composer WGSL, resolve+snapshot both paths (analytic uvRemap fold + RTT fragment). Plus CPU
 * goldens: the exported `bendRemap` DualFn vs the projection math computed by hand.
 */
function mockRoot() {
    const buffer = {
        patch: vi.fn(),
        write: vi.fn(),
        destroy: vi.fn(),
        $usage: vi.fn(function (this: unknown) {
            return buffer
        }),
    }
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
    for (const [name, u] of Object.entries(map)) {
        inits.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
    }
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
        handlesById[s.id] = store.defineNode(s.id, [...propFields, {name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]) as never
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

const B = Bend as GpuShaderDefinition

describe('Bend (a) analytic UV fold over a generator', () => {
    it('folds Bend.uvRemap into the generator sample coordinate (inline, no RTT)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bn', def: B, parentId: 'root', props: {edges: 'stretch'}, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'bn', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/bendRemap/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass-uvremap')
    })
})

describe('Bend (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the bent coordinate, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bn', def: B, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'bn', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/bendRemap/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('final-pass-fragment')
    })
})

describe('Bend (c) compile-time edge modes', () => {
    const resolveWithEdges = (edgesMode: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bn', def: B, parentId: 'root', props: {edges: edgesMode}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'bn', metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }
    it('mirror/wrap/transparent select the matching WGSL; stretch uses neither', () => {
        expect(resolveWithEdges('mirror')).toMatch(/edgeMirrorUV/)
        expect(resolveWithEdges('wrap')).toMatch(/edgeWrapUV/)
        expect(resolveWithEdges('transparent')).toMatch(/edgeTransparentMask/)
        const stretch = resolveWithEdges('stretch')
        expect(stretch).not.toMatch(/edgeMirrorUV/)
        expect(stretch).not.toMatch(/edgeWrapUV/)
    })
})

describe('Bend (d) CPU golden — inverse-projection math', () => {
    const D = 2.0
    const B_MAX = 1.2
    // Forward model: sheet point s (normalized, ±1 at frame edges) at height z = b·u²
    // (u = (|s|−f)/(1−f), 0 inside the flat region) projects to s' = s·D/(D − z), t' = t·D/(D − z).
    const forwardS = (s: number, b: number, f = 0): number => {
        const u = Math.max((Math.abs(s) - f) / (1 - f), 0)
        return (s * D) / (D - b * u * u)
    }

    const remap = (strength: number, falloff: number, angle: number, uv: [number, number], aspect: number): {x: number; y: number} =>
        bendRemap(strength, falloff, angle, d.vec2f(uv[0], uv[1]), aspect) as {x: number; y: number}

    it('strength 0 is an exact identity', () => {
        for (const uv of [[0.1, 0.9], [0.5, 0.5], [0.83, 0.21]] as [number, number][]) {
            for (const aspect of [1, 16 / 9]) {
                const out = remap(0, 0.4, 137, uv, aspect)
                expect(out.x).toBeCloseTo(uv[0], 5)
                expect(out.y).toBeCloseTo(uv[1], 5)
            }
        }
    })

    it('the axis midline is a fixed line (s\' = 0 → s = 0) at any strength', () => {
        const out = remap(1, 0, 0, [0.5, 0.87], 1.5)
        expect(out.x).toBeCloseTo(0.5, 5)
    })

    it('inverts the forward projection: remap(project(s)) recovers s (angle 0)', () => {
        const strength = 0.8
        const b = strength * B_MAX
        for (const s of [0.2, -0.55, 0.9]) {
            const sScreen = forwardS(s, b)
            // angle 0, aspect 1 → sHalf = 0.5; screen uv.x = 0.5 + s'·0.5.
            const out = remap(strength, 0, 0, [0.5 + sScreen * 0.5, 0.5], 1)
            expect(out.x).toBeCloseTo(0.5 + s * 0.5, 4)
        }
    })

    it('falloff keeps the flat middle an exact identity and still inverts the bend band', () => {
        const falloff = 0.5 // → f = 0.45
        const f = 0.45
        const b = 1 * B_MAX
        // Inside the flat region: identity even at full strength.
        const flat = remap(1, falloff, 0, [0.5 + 0.3 * 0.5, 0.71], 1)
        expect(flat.x).toBeCloseTo(0.5 + 0.3 * 0.5, 5)
        expect(flat.y).toBeCloseTo(0.71, 5)
        // In the bend band: round-trip recovers the sheet coordinate.
        for (const s of [0.6, -0.85, 0.98]) {
            const sScreen = forwardS(s, b, f)
            const out = remap(1, falloff, 0, [0.5 + sScreen * 0.5, 0.5], 1)
            expect(out.x).toBeCloseTo(0.5 + s * 0.5, 4)
        }
    })

    it('perpendicular coordinate scales by the sheet height at the solved s', () => {
        const strength = 1
        const b = strength * B_MAX
        // Pick sheet s = 0.7, t = 0.3 and project both; the remap must recover them.
        const s = 0.7
        const t = 0.3
        const k = D / (D - b * s * s)
        const out = remap(strength, 0, 0, [0.5 + s * k * 0.5, 0.5 + t * k], 1)
        expect(out.x).toBeCloseTo(0.5 + s * 0.5, 4)
        expect(out.y).toBeCloseTo(0.5 + t, 4)
    })

    it('bend-away pixels past the sheet silhouette map far out of bounds (edge handling takes them)', () => {
        // strength −1 at the frame edge: disc = D² − 4·B_MAX·D < 0 → no sheet under this pixel.
        const out = remap(-1, 0, 0, [1.0, 0.5], 1)
        expect(Math.abs(out.x - 0.5)).toBeGreaterThan(1.5)
    })

    it('respects the bend axis angle (90° bends top/bottom; both axes pull inward at the bent end)', () => {
        const out = remap(0.8, 0, 90, [0.31, 1.0], 1)
        expect(out.y).toBeLessThan(1.0) // edge content magnified → source pulled inward along the axis
        expect(out.y).toBeGreaterThan(0.5)
        expect(out.x).toBeGreaterThan(0.31) // perpendicular swell pulls x toward center too
        expect(out.x).toBeLessThan(0.5)
    })
})
