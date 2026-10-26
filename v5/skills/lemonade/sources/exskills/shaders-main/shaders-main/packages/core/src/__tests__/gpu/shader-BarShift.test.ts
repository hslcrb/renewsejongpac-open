import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import BarShift from '@coreroot/shaders/BarShift/index'
import {barSampleUV} from '@coreroot/gpu/kit/warpMaps'

/**
 * BarShift port gate (Phase D2-B). Animated (reads `_animTime`) + per-bar sin-fract hash. The hash
 * diverges from f64 at f32 precision on the GPU, so we CPU-golden the DETERMINISTIC `barSampleUV`
 * (which takes the per-bar offset as an argument) and rely on resolve + smoke for the full
 * hash-bearing `barShiftUV`.
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

const B = BarShift as GpuShaderDefinition

describe('BarShift (a) analytic UV fold over a generator', () => {
    it('folds BarShift.uvRemap into the generator sample coordinate (inline, no RTT); reads _animTime', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bs', def: B, parentId: 'root', props: {edges: 'stretch'}, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'bs', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/barShiftUV/)
        expect(finalWgsl).toMatch(/barSampleUV/)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(finalWgsl).toMatch(/edgeClampUV/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass-uvremap')
    })
})

describe('BarShift (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the per-bar shift, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bs', def: B, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'bs', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/barShiftUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('final-pass-fragment')
    })
})

describe('BarShift (c) compile-time edge modes', () => {
    const resolveWithEdges = (edges: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bs', def: B, parentId: 'root', props: {edges}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'bs', metadata: {renderOrder: 0}},
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
                {id: 'bs', def: B, parentId: 'root', props: {edges}, metadata: {renderOrder: 0}},
                {id: 'gen', def: Generator, parentId: 'bs', metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('stretch')).not.toBe(build('mirror'))
        expect(build('stretch')).toMatch(/edges=0/)
        expect(build('mirror')).toMatch(/edges=2/)
    })
})

describe('BarShift (d) CPU golden — deterministic barSampleUV vs the original bar geometry', () => {
    // ORIGINAL bar geometry (offset supplied), transcribed from v1's Fn body. angle is the already-
    // transformed (transformAngle) degrees value; the body multiplies by the truncated 0.0174533.
    const golden = (uv: [number, number], aspect: number, angle: number, offset: number): [number, number] => {
        const angleRad = angle * 0.0174533
        const cosA = Math.cos(angleRad)
        const sinA = Math.sin(angleRad)
        const au = uv[0] * aspect
        const av = uv[1]
        const cu = au - aspect * 0.5
        const cv = av - 0.5
        const projectedU = cu * cosA + cv * sinA
        const projectedV = cu * sinA * -1 + cv * cosA
        const distPV = projectedV + offset
        const dcu = projectedU * cosA - distPV * sinA
        const dcv = projectedU * sinA + distPV * cosA
        return [dcu / aspect + 0.5, dcv + 0.5]
    }

    const cases: {uv: [number, number]; aspect: number; angle: number; offset: number}[] = [
        {uv: [0.8, 0.2], aspect: 800 / 600, angle: 0, offset: 0.12},
        {uv: [0.1, 0.9], aspect: 1.0, angle: 90, offset: -0.08},
        {uv: [0.6, 0.4], aspect: 16 / 9, angle: 30, offset: 0.05},
    ]

    it('barSampleUV reproduces the original bar geometry at sampled points', () => {
        for (const c of cases) {
            const out = barSampleUV(d.vec2f(c.uv[0], c.uv[1]), c.aspect, c.angle, c.offset) as {x: number; y: number}
            const [ex, ey] = golden(c.uv, c.aspect, c.angle, c.offset)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })

    it('a zero offset with angle 0 is identity (no bar shift)', () => {
        const out = barSampleUV(d.vec2f(0.37, 0.62), 1.0, 0, 0) as {x: number; y: number}
        expect(out.x).toBeCloseTo(0.37, 5)
        expect(out.y).toBeCloseTo(0.62, 5)
    })
})
