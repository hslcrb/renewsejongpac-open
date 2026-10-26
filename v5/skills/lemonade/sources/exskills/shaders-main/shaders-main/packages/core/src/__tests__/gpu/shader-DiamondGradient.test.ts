import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import DiamondGradient from '@coreroot/shaders/DiamondGradient/index'
import {gradientPaints} from '@coreroot/gpu/kit'

const {diamondDist, repeatRings} = gradientPaints

// The metric + repeat parts composed back into the original fused parameter (CPU-executable).
const diamondFinalT = (center: unknown, size: number, rotation: number, repeat: number, roundness: number, uv: unknown, vp: unknown): number =>
    repeatRings(diamondDist(center as never, size, rotation, roundness, uv as never, vp as never), repeat) as unknown as number

/**
 * DiamondGradient port gate (Phase D1-A). GPU-free resolve+snapshot of both color paths; CPU golden
 * of the exported `diamondFinalT` (DualFn) vs the ORIGINAL v1 L1↔L∞ distance transcribed by hand.
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

const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? (undefined as never),
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

const DG = DiamondGradient as GpuShaderDefinition

describe('DiamondGradient (a) default two-color path', () => {
    it('emits diamondFinalT + mixColors, no array loop, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'dg', def: DG, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/diamondDist/)
        expect(finalWgsl).toMatch(/repeatRings/)
        expect(finalWgsl).toMatch(/mixColors/)
        expect(finalWgsl).not.toMatch(/gradientStopsInSpace/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass-two-color')
    })
})

describe('DiamondGradient (b) multi-stop array path', () => {
    const stops = [
        {color: '#ff0000', position: 0},
        {color: '#00ff00', position: 0.5},
        {color: '#0000ff', position: 1},
    ]
    it('emits the shared working-space accumulation loop', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'dg', def: DG, parentId: 'root', props: {stops}, metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/gradientStopsInSpace/)
        expect(finalWgsl).toMatch(/mixPreconvertedInSpace/)
        expect(finalWgsl).toMatchSnapshot('final-pass-multi-stop')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'dg', def: DG, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'lch'}))
    })
})

describe('DiamondGradient (c) CPU golden — diamondFinalT', () => {
    const golden = (
        center: [number, number],
        size: number,
        rotation: number,
        repeat: number,
        roundness: number,
        uv: [number, number],
        vp: [number, number],
    ): number => {
        const aspect = vp[0] / Math.max(vp[1], 1e-6)
        const acx = uv[0] * aspect
        const acy = uv[1]
        const cpx = center[0] * aspect
        const cpy = 1 - center[1]
        const dx = acx - cpx
        const dy = acy - cpy
        const rr = (rotation * Math.PI) / 180
        const cR = Math.cos(rr)
        const sR = Math.sin(rr)
        const rdx = dx * cR + dy * sR
        const rdy = dy * cR - dx * sR
        const adx = Math.abs(rdx)
        const ady = Math.abs(rdy)
        const l1 = adx + ady
        const linf = Math.max(adx, ady)
        const dist = l1 + (linf - l1) * roundness // mix(l1, linf, roundness)
        const t = (dist / size) * repeat
        return repeat > 1.0001 ? t - Math.floor(t) : Math.min(Math.max(t, 0), 1)
    }

    const cases: {center: [number, number]; size: number; rot: number; repeat: number; round: number; uv: [number, number]; vp: [number, number]}[] = [
        {center: [0.5, 0.5], size: 0.7, rot: 0, repeat: 1, round: 0, uv: [0.8, 0.2], vp: [800, 600]},
        {center: [0.25, 0.75], size: 0.5, rot: 45, repeat: 3, round: 1, uv: [0.6, 0.4], vp: [1920, 1080]},
        {center: [0.5, 0.5], size: 1.2, rot: 200, repeat: 1, round: 0.5, uv: [0.1, 0.9], vp: [1, 1]},
    ]

    it('reproduces the original L1↔L∞ distance parameter (both repeat branches)', () => {
        for (const c of cases) {
            const out = diamondFinalT(
                d.vec2f(c.center[0], c.center[1]),
                c.size,
                c.rot,
                c.repeat,
                c.round,
                d.vec2f(c.uv[0], c.uv[1]),
                d.vec2f(c.vp[0], c.vp[1]),
            ) as unknown as number
            expect(out).toBeCloseTo(golden(c.center, c.size, c.rot, c.repeat, c.round, c.uv, c.vp), 5)
        }
    })

    it('is 0 at the center point', () => {
        const out = diamondFinalT(d.vec2f(0.5, 0.5), 0.7, 0, 1, 0, d.vec2f(0.5, 0.5), d.vec2f(800, 600)) as unknown as number
        expect(out).toBeCloseTo(0, 6)
    })
})
