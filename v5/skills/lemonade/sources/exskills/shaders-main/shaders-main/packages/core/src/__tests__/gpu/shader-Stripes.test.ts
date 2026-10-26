import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Stripes from '@coreroot/shaders/Stripes/index'
import {stripeCoordP} from '@coreroot/gpu/kit/patternPaints'
import {quilezStepFilter} from '@coreroot/gpu/kit/aa'

/**
 * Stripes port gate (Phase D1-A — the FIRST animated-time shader in the batch). GPU-free
 * resolve+snapshot of the final pass (which reads the node's `_animTime` field via the
 * `animatedTime()` porter helper and takes dpdx/dpdy). CPU goldens: the pure stripe coordinate
 * `stripeCoordP` (incl. the animTime + offset) and the Quilez 1D filter `aa.quilezStepFilter` (where Stripes' `balance` is the duty threshold) at an
 * explicit footprint — both transcribed by hand from the v1 fragmentNode.
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
        // Mirror buildFieldInits: an animatedTime shader gets a synthetic `_animTime` f32 field.
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

const ST = Stripes as GpuShaderDefinition

describe('Stripes (a) generator emits the Quilez filter + animated time + mixColors', () => {
    it('final pass reads _animTime, calls stripesMask (dpdx/dpdy) + mixColors, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'st', def: ST, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/stripesMask/)
        expect(finalWgsl).toMatch(/quilezStepFilter/)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(finalWgsl).toMatch(/dpdx/)
        expect(finalWgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'st', def: ST, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'hsv'}))
    })
})

describe('Stripes (b) CPU golden — stripeCoordP', () => {
    const golden = (uv: [number, number], vp: [number, number], angle: number, density: number, animTime: number, offset: number): number => {
        const aspect = vp[0] / Math.max(vp[1], 1e-6)
        const angleRad = angle * (Math.PI / 180)
        // Projection from the canvas centre, with the angle-0 phase of the uncentred projection
        // restored (Gate C pivot fix — see the note in Stripes/index.ts).
        const rotatedCoord = (uv[0] * aspect - aspect * 0.5) * Math.cos(angleRad)
            + (uv[1] - 0.5) * Math.sin(angleRad) + aspect * 0.5
        return rotatedCoord * density + animTime + offset
    }

    it('reproduces the projected/scaled/offset coordinate (incl. animation time)', () => {
        const cases: {uv: [number, number]; vp: [number, number]; angle: number; density: number; t: number; offset: number}[] = [
            {uv: [0.5, 0.5], vp: [800, 600], angle: 45, density: 5, t: 0, offset: 0},
            {uv: [0.25, 0.75], vp: [1920, 1080], angle: -30, density: 12, t: 0.4, offset: 0.3},
            {uv: [0.8, 0.2], vp: [1, 1], angle: 90, density: 3, t: 1.5, offset: 0},
        ]
        for (const c of cases) {
            const out = stripeCoordP(
                d.vec2f(c.uv[0], c.uv[1]),
                d.vec2f(c.vp[0], c.vp[1]),
                c.angle,
                c.density,
                c.t,
                c.offset,
            ) as unknown as number
            expect(out).toBeCloseTo(golden(c.uv, c.vp, c.angle, c.density, c.t, c.offset), 5)
        }
    })

    // Gate C pivot fix: the projection now runs from the canvas centre so `angle` spins the stripes
    // in place. The centring term is exactly cancelled at angle 0 by the restored phase anchor, so
    // an unrotated preset is bit-for-bit what it was before the fix — this pins that.
    it('is identical to the uncentred projection at angle 0, for any aspect', () => {
        for (const vp of [[800, 600], [1920, 1080], [400, 1200], [1, 1]] as [number, number][]) {
            const aspect = vp[0] / vp[1]
            for (const uv of [[0, 0], [0.5, 0.5], [0.8, 0.2], [1, 1]] as [number, number][]) {
                const out = stripeCoordP(d.vec2f(uv[0], uv[1]), d.vec2f(vp[0], vp[1]), 0, 5, 0.3, 0.1) as unknown as number
                expect(out).toBeCloseTo(uv[0] * aspect * 5 + 0.3 + 0.1, 5)
            }
        }
    })
})

describe('Stripes (c) CPU golden — aa.quilezStepFilter (Quilez 1D)', () => {
    const golden = (p: number, w: number, balance: number): number => {
        const fract = (x: number) => x - Math.floor(x)
        const a = p + w * 0.5
        const b = p - w * 0.5
        const omb = 1 - balance
        const Fa = Math.floor(a) * omb + Math.max(fract(a) - balance, 0)
        const Fb = Math.floor(b) * omb + Math.max(fract(b) - balance, 0)
        return Math.min(Math.max((Fa - Fb) / w, 0), 1)
    }

    it('matches the hand-computed antiderivative average', () => {
        const cases: {p: number; w: number; balance: number}[] = [
            {p: 0.3, w: 0.02, balance: 0.5},
            {p: 2.7, w: 0.1, balance: 0.3},
            {p: 5.5, w: 4, balance: 0.5}, // large footprint → averages toward (1 - balance)
        ]
        for (const c of cases) {
            const out = quilezStepFilter(c.p, c.w, c.balance) as unknown as number
            expect(out).toBeCloseTo(golden(c.p, c.w, c.balance), 5)
        }
    })
})
