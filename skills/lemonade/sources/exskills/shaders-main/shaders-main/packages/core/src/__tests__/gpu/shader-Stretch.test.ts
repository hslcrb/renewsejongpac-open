import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Stretch from '@coreroot/shaders/Stretch/index'
import {stretchUV} from '@coreroot/gpu/kit/warpMaps'

/**
 * Stretch port gate (Phase D2-B). Resolve+snapshot both paths + CPU golden: the fully deterministic
 * `stretchUV` (DualFn) vs the ORIGINAL directional-stretch formula, computed by hand.
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
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        if (s.def.animatedTime) synthetic.push({name: '_animTime', schema: d.f32, initial: 0})
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

const S = Stretch as GpuShaderDefinition

describe('Stretch (a) analytic UV fold over a generator', () => {
    it('folds Stretch.uvRemap into the generator sample coordinate (inline, no RTT)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'st', def: S, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'st', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/stretchUV/)
        expect(finalWgsl).toMatch(/edgeClampUV/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass-uvremap')
    })
})

describe('Stretch (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the stretch, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'st', def: S, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'st', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/stretchUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('final-pass-fragment')
    })
})

describe('Stretch (c) compile-time edge modes', () => {
    const resolveWithEdges = (edges: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'st', def: S, parentId: 'root', props: {edges}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'st', metadata: {renderOrder: 0}},
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
                {id: 'st', def: S, parentId: 'root', props: {edges}, metadata: {renderOrder: 0}},
                {id: 'gen', def: Generator, parentId: 'st', metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('stretch')).not.toBe(build('mirror'))
        expect(build('stretch')).toMatch(/edges=0/)
        expect(build('mirror')).toMatch(/edges=2/)
    })
})

describe('Stretch (d) CPU golden — math equivalence with the original formula', () => {
    const mix = (a: number, b: number, t: number): number => a + (b - a) * t
    const clamp = (x: number, lo: number, hi: number): number => Math.min(Math.max(x, lo), hi)
    // ORIGINAL directional stretch, transcribed from v1. center is TRANSFORMED.
    const golden = (center: [number, number], strength: number, angle: number, falloff: number, uv: [number, number], aspect: number): [number, number] => {
        const acu: [number, number] = [uv[0] * aspect, uv[1]]
        const cp: [number, number] = [center[0] * aspect, 1 - center[1]]
        const delta: [number, number] = [acu[0] - cp[0], acu[1] - cp[1]]
        const angleRad = (angle * Math.PI) / 180
        const dir: [number, number] = [Math.cos(angleRad), Math.sin(angleRad)]
        const projection = delta[0] * dir[0] + delta[1] * dir[1]
        const parallel: [number, number] = [dir[0] * projection, dir[1] * projection]
        const perpendicular: [number, number] = [delta[0] - parallel[0], delta[1] - parallel[1]]
        const transitionWidth = mix(0.001, 75, falloff)
        const effectMask = clamp(projection / transitionWidth, 0, 1)
        const scaledStrength = strength * 100
        const stretchFactor = 1 + scaledStrength * effectMask
        const finalProjection = projection / stretchFactor
        const finalParallel: [number, number] = [dir[0] * finalProjection, dir[1] * finalProjection]
        const stretchedDelta: [number, number] = [finalParallel[0] + perpendicular[0], finalParallel[1] + perpendicular[1]]
        const stretchedUV: [number, number] = [cp[0] + stretchedDelta[0], cp[1] + stretchedDelta[1]]
        return [stretchedUV[0] / aspect, stretchedUV[1]]
    }

    const cases: {center: [number, number]; strength: number; angle: number; falloff: number; uv: [number, number]; aspect: number}[] = [
        {center: [0.5, 0.5], strength: 0.5, angle: 0, falloff: 0.3, uv: [0.9, 0.6], aspect: 800 / 600},
        {center: [0.5, 0.5], strength: 1, angle: 90, falloff: 0, uv: [0.2, 0.9], aspect: 1.0},
        {center: [0.25, 0.75], strength: 0.8, angle: 200, falloff: 0.9, uv: [0.6, 0.4], aspect: 16 / 9},
    ]

    it('stretchUV reproduces the original displacement at sampled points', () => {
        for (const c of cases) {
            const out = stretchUV(
                d.vec2f(c.center[0], c.center[1]),
                c.strength,
                c.angle,
                c.falloff,
                d.vec2f(c.uv[0], c.uv[1]),
                c.aspect,
            ) as {x: number; y: number}
            const [ex, ey] = golden(c.center, c.strength, c.angle, c.falloff, c.uv, c.aspect)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })

    it('is identity at the center point (zero projection)', () => {
        const center: [number, number] = [0.3, 0.7]
        const aspect = 1.5
        // The UV that lands on centerPos: (center.x, 1 - center.y).
        const uv: [number, number] = [center[0], 1 - center[1]]
        const out = stretchUV(d.vec2f(center[0], center[1]), 1, 45, 0.5, d.vec2f(uv[0], uv[1]), aspect) as {x: number; y: number}
        expect(out.x).toBeCloseTo(uv[0], 6)
        expect(out.y).toBeCloseTo(uv[1], 6)
    })
})
