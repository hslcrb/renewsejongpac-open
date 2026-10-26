import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Checkerboard from '@coreroot/shaders/Checkerboard/index'
import {aspectCorrectedUVFlipY} from '@coreroot/gpu/kit/geom'
import {quilezCheckerFilter} from '@coreroot/gpu/kit/aa'

/**
 * Checkerboard port gate (Phase D1-A). GPU-free resolve+snapshot of the final pass (which includes
 * the fragment-only dpdx/dpdy footprint calc). CPU goldens: the pure cell coordinate (`geom.aspectCorrectedUVFlipY` × cells)
 * and the Quilez analytical filter `aa.quilezCheckerFilter` at explicit footprints (no derivatives) —
 * both transcribed by hand from the v1 fragmentNode.
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

const CB = Checkerboard as GpuShaderDefinition

describe('Checkerboard (a) generator emits the Quilez filter + mixColors', () => {
    it('final pass calls checkerBlend (with dpdx/dpdy) + mixColors, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'cb', def: CB, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/checkerBlend/)
        expect(finalWgsl).toMatch(/quilezCheckerFilter/)
        expect(finalWgsl).toMatch(/dpdx/)
        expect(finalWgsl).toMatch(/dpdy/)
        expect(finalWgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'cb', def: CB, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklab'}))
        expect(hashWith({colorSpace: 'oklab'})).toMatch(/colorSpace=2/)
    })
})

describe('Checkerboard (b) CPU golden — the cell coordinate (geom.aspectCorrectedUVFlipY × cells)', () => {
    const golden = (uv: [number, number], vp: [number, number], cells: number): [number, number] => [
        uv[0] * (vp[0] / vp[1]) * cells,
        (1 - uv[1]) * cells,
    ]
    it('reproduces the aspect-corrected, Y-flipped cell coordinate', () => {
        const cases: {uv: [number, number]; vp: [number, number]; cells: number}[] = [
            {uv: [0.5, 0.5], vp: [800, 600], cells: 8},
            {uv: [0.25, 0.75], vp: [1600, 900], cells: 12},
            {uv: [0, 1], vp: [600, 600], cells: 5},
        ]
        for (const c of cases) {
            const framed = aspectCorrectedUVFlipY(d.vec2f(c.uv[0], c.uv[1]), d.vec2f(c.vp[0], c.vp[1])) as unknown as {x: number; y: number}
            const out = {x: framed.x * c.cells, y: framed.y * c.cells}
            const [ex, ey] = golden(c.uv, c.vp, c.cells)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})

describe('Checkerboard (c) CPU golden — aa.quilezCheckerFilter', () => {
    // Verbatim transcription of the v1 filter.
    const golden = (p: [number, number], w: [number, number]): number => {
        const fract = (x: number) => x - Math.floor(x)
        const ahx = w[0] * 0.5
        const ahy = w[1] * 0.5
        const msX = Math.abs(fract((p[0] - ahx) * 0.5) - 0.5)
        const msY = Math.abs(fract((p[1] - ahy) * 0.5) - 0.5)
        const psX = Math.abs(fract((p[0] + ahx) * 0.5) - 0.5)
        const psY = Math.abs(fract((p[1] + ahy) * 0.5) - 0.5)
        const iX = ((msX - psX) * 2) / w[0]
        const iY = ((msY - psY) * 2) / w[1]
        return Math.min(Math.max(0.5 - iX * iY * 0.5, 0), 1)
    }

    it('matches the hand-computed filter at small + large footprints', () => {
        const cases: {p: [number, number]; w: [number, number]}[] = [
            {p: [0.5, 0.5], w: [0.1, 0.1]},
            {p: [1.2, 2.7], w: [0.05, 0.05]},
            {p: [3.3, 1.1], w: [4, 4]}, // large footprint → averages toward 0.5
        ]
        for (const c of cases) {
            const out = quilezCheckerFilter(d.vec2f(c.p[0], c.p[1]), d.vec2f(c.w[0], c.w[1])) as unknown as number
            expect(out).toBeCloseTo(golden(c.p, c.w), 5)
        }
    })

    it('large footprint averages toward mid-gray (0.5)', () => {
        const out = quilezCheckerFilter(d.vec2f(3.3, 1.1), d.vec2f(4, 4)) as unknown as number
        expect(out).toBeCloseTo(0.5, 2)
    })
})
