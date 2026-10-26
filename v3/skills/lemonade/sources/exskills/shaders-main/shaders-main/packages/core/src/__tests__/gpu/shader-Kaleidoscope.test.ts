import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Kaleidoscope from '@coreroot/shaders/Kaleidoscope/index'
import {kaleidoscopeUV} from '@coreroot/gpu/kit/warpMaps'

/**
 * Kaleidoscope port gate (Phase D2-B). Resolve+snapshot both paths + CPU golden. The golden
 * DELIBERATELY includes a point whose polar angle is NEGATIVE (atan2 third quadrant), exercising
 * the FLOORED mod (`x - m*floor(x/m)`) — v1's GLSL `mod`, which differs from truncated `%` for
 * negatives. A truncated `std.mod` would tear the fold near angle 0.
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

const K = Kaleidoscope as GpuShaderDefinition

describe('Kaleidoscope (a) analytic UV fold over a generator', () => {
    it('folds Kaleidoscope.uvRemap into the generator sample coordinate (inline, no RTT)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'ka', def: K, parentId: 'root', props: {edges: 'stretch'}, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'ka', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/kaleidoscopeUV/)
        expect(finalWgsl).toMatch(/edgeClampUV/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass-uvremap')
    })
})

describe('Kaleidoscope (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the fold, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'ka', def: K, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'ka', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/kaleidoscopeUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('final-pass-fragment')
    })
})

describe('Kaleidoscope (c) compile-time edge modes', () => {
    const resolveWithEdges = (edges: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'ka', def: K, parentId: 'root', props: {edges}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'ka', metadata: {renderOrder: 0}},
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
                {id: 'ka', def: K, parentId: 'root', props: {edges}, metadata: {renderOrder: 0}},
                {id: 'gen', def: Generator, parentId: 'ka', metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('stretch')).not.toBe(build('mirror'))
        expect(build('stretch')).toMatch(/edges=0/)
        expect(build('mirror')).toMatch(/edges=2/)
    })
})

describe('Kaleidoscope (d) CPU golden — math equivalence (incl. FLOORED mod)', () => {
    // ORIGINAL fold, transcribed from the v1 fragmentNode. center is TRANSFORMED. `mod` is FLOORED.
    const golden = (center: [number, number], segments: number, angle: number, uv: [number, number], aspect: number): [number, number] => {
        const acu: [number, number] = [uv[0] * aspect, uv[1]]
        const cp: [number, number] = [center[0] * aspect, 1 - center[1]]
        const delta: [number, number] = [acu[0] - cp[0], acu[1] - cp[1]]
        const radius = Math.hypot(delta[0], delta[1])
        const currentAngle = Math.atan2(delta[1], delta[0])
        const rotatedAngle = currentAngle + (angle * Math.PI) / 180
        const segmentAngle = (Math.PI * 2) / segments
        const segTwo = segmentAngle * 2
        const wrappedAngle = rotatedAngle - segTwo * Math.floor(rotatedAngle / segTwo) // FLOORED
        const finalAngle = wrappedAngle > segmentAngle ? segTwo - wrappedAngle : wrappedAngle
        const kx = Math.cos(finalAngle) * radius
        const ky = Math.sin(finalAngle) * radius
        return [(cp[0] + kx) / aspect, cp[1] + ky]
    }

    const cases: {center: [number, number]; segments: number; angle: number; uv: [number, number]; aspect: number}[] = [
        {center: [0.5, 0.5], segments: 6, angle: 0, uv: [0.2, 0.3], aspect: 1.0}, // NEGATIVE atan2 → floored mod
        {center: [0.5, 0.5], segments: 8, angle: 30, uv: [0.8, 0.9], aspect: 800 / 600},
        {center: [0.25, 0.75], segments: 4, angle: 90, uv: [0.6, 0.1], aspect: 16 / 9},
    ]

    it('kaleidoscopeUV reproduces the original fold at sampled points', () => {
        for (const c of cases) {
            const out = kaleidoscopeUV(d.vec2f(c.center[0], c.center[1]), c.segments, c.angle, d.vec2f(c.uv[0], c.uv[1]), c.aspect) as {
                x: number
                y: number
            }
            const [ex, ey] = golden(c.center, c.segments, c.angle, c.uv, c.aspect)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})
