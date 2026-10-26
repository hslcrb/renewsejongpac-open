import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Bulge from '@coreroot/shaders/Bulge/index'
import {bulgeUV} from '@coreroot/gpu/kit/warpMaps'

/**
 * Bulge port gate (Phase D1). GPU-free: mocked store root, real composer WGSL, resolve+snapshot
 * both GPU-code paths (analytic uvRemap fold + RTT fragment). Plus a CPU golden: the exported
 * `bulgeUV` (DualFn) vs the ORIGINAL magnify/pinch formula, and the fixed point (center → center).
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
    // Consume the composed uvContext (the folded distortion coordinate), falling back to ctx.uv
    // standalone — exactly how the real LinearGradient generator behaves.
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
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.finalize()

    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) {
        nodes.set(s.id, {
            id: s.id,
            componentName: s.def.name,
            parentId: s.parentId,
            definition: s.def,
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

const B = Bulge as GpuShaderDefinition

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) Analytic UV fold over a generator (the smoke path: Bulge > LinearGradient-like generator)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Bulge (a) analytic UV fold over a generator', () => {
    it('folds Bulge.uvRemap into the generator sample coordinate', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bg', def: B, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'bg', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        // Generator accepts uvContext + no children → analytic fold, no RTT.
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/bulgeUV/)
        expect(finalWgsl).toMatch(/edgeClampUV/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass-uvremap')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) RTT filter — Bulge.fragment (forced by opacity < 1)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Bulge (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the bulge, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bg', def: B, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'bg', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/bulgeUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('final-pass-fragment')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (c) Compile-time edge branching
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Bulge (c) compile-time edge modes', () => {
    const resolveWithEdges = (edges: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bg', def: B, parentId: 'root', props: {edges}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'bg', metadata: {renderOrder: 0}},
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

    it('the edge mode is part of the structural (recompile) hash', () => {
        const build = (edges: string) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'bg', def: B, parentId: 'root', props: {edges}, metadata: {renderOrder: 0}},
                {id: 'gen', def: Generator, parentId: 'bg', metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('stretch')).not.toBe(build('mirror'))
        expect(build('stretch')).toMatch(/edges=0/)
        expect(build('mirror')).toMatch(/edges=2/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (d) CPU golden — bulgeUV vs the ORIGINAL formula, computed by hand
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Bulge (d) CPU golden — math equivalence with the original formula', () => {
    const smoothstep = (e0: number, e1: number, x: number): number => {
        const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
        return t * t * (3 - 2 * t)
    }
    // ORIGINAL bulge, transcribed from the v1 fragmentNode / uvRemap. center is TRANSFORMED.
    const golden = (center: [number, number], strength: number, radius: number, falloff: number, uv: [number, number], aspect: number): [number, number] => {
        const acu: [number, number] = [uv[0] * aspect, uv[1]]
        const cp: [number, number] = [center[0] * aspect, 1 - center[1]]
        const delta: [number, number] = [acu[0] - cp[0], acu[1] - cp[1]]
        const distance = Math.hypot(delta[0], delta[1])
        const effectRadius = radius * 0.5
        const innerRadius = effectRadius * Math.max(1 - falloff - 0.001, 0)
        const smoothFalloff = 1 - smoothstep(innerRadius, effectRadius, distance)
        const normalizedDist = distance / effectRadius
        const distSq = normalizedDist * normalizedDist
        const quadraticFalloff = Math.max(0, 1 - distSq)
        const falloffTotal = smoothFalloff * quadraticFalloff
        const negStrength = -strength
        const displacementAmount = negStrength * falloffTotal
        const scaleFactor = 1 + displacementAmount
        const bulgedDelta: [number, number] = [delta[0] * scaleFactor, delta[1] * scaleFactor]
        const bulgedUV: [number, number] = [cp[0] + bulgedDelta[0], cp[1] + bulgedDelta[1]]
        return [bulgedUV[0] / aspect, bulgedUV[1]]
    }

    const cases: {center: [number, number]; strength: number; radius: number; falloff: number; uv: [number, number]; aspect: number}[] = [
        {center: [0.5, 0.5], strength: 1, radius: 1, falloff: 0.5, uv: [0.7, 0.6], aspect: 800 / 600},
        {center: [0.5, 0.5], strength: -0.8, radius: 2, falloff: 0.2, uv: [0.2, 0.9], aspect: 1},
        {center: [0.25, 0.75], strength: 0.5, radius: 0.8, falloff: 0.9, uv: [0.6, 0.4], aspect: 16 / 9},
    ]

    it('bulgeUV reproduces the original displacement at sampled points', () => {
        for (const c of cases) {
            const out = bulgeUV(
                d.vec2f(c.center[0], c.center[1]),
                c.strength,
                c.radius,
                c.falloff,
                d.vec2f(c.uv[0], c.uv[1]),
                c.aspect,
            ) as {x: number; y: number}
            const [ex, ey] = golden(c.center, c.strength, c.radius, c.falloff, c.uv, c.aspect)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })

    it('is identity at the center point (zero displacement)', () => {
        // At uv == centerPos (in UV space), delta is 0, so the point maps to itself.
        const center: [number, number] = [0.3, 0.7]
        const aspect = 1.5
        // centerPos = (center.x*aspect, 1 - center.y); the UV that lands on it is
        // (centerPos.x / aspect, centerPos.y) = (center.x, 1 - center.y).
        const uv: [number, number] = [center[0], 1 - center[1]]
        const out = bulgeUV(d.vec2f(center[0], center[1]), 1, 1, 0.5, d.vec2f(uv[0], uv[1]), aspect) as {x: number; y: number}
        expect(out.x).toBeCloseTo(uv[0], 6)
        expect(out.y).toBeCloseTo(uv[1], 6)
    })
})
