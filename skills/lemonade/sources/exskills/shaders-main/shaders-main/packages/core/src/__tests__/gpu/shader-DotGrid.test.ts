import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {expr} from '@coreroot/gpu/composer'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import DotGrid from '@coreroot/shaders/DotGrid/index'
import {cellCentreUV} from '@coreroot/gpu/kit/cells'

/**
 * DotGrid port gate (Phase D1-F). Two paths matter:
 *   (a) plain generator — the final pass calls `dotGridAlpha`, reads the `_animTime` field, no RTT.
 *   (b) MAP-DRIVEN — the FIRST exercise of the `mapSampleUVs` hook + the composer's map-driver
 *       wiring (d1f). A sibling source is RTT'd and the final pass samples it at the cell-CENTER
 *       UV `cells.cellCentreUV(...)` returned by `mapSampleUVs` — NOT the fragment `uv`. This
 *       asserts the whole map-driver + mapSampleUVs path at the WGSL level; the smoke proves it
 *       end-to-end on real GPU with a LinearGradient source.
 * Plus a CPU golden for the pure cell-centre UV math (no derivatives).
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

// A trivial opaque generator used as a map SOURCE (no colorStops/array fields → keeps the harness
// simple; the smoke uses a real LinearGradient source). Renders a solid color.
const SolidSource: GpuShaderDefinition = {
    name: 'SolidSource',
    props: {} as never,
    fragment: (): Expr => expr('vec4f(0.5, 0.5, 0.5, 1.0)'),
}

interface NodeSpec {
    id: string
    def: GpuShaderDefinition
    parentId: string | null
    props?: Record<string, unknown>
    metadata?: Partial<NodeMetadata>
    customId?: string
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

// Synthetic `_map_<prop>_*` fields the composer emits for a map-driven prop — the renderer wires
// these in production (gpu/index.ts buildFieldInits); the harness mirrors them so resolve succeeds.
function mapSyntheticFields(metadata?: Partial<NodeMetadata>): FieldInit[] {
    const out: FieldInit[] = []
    const maps = metadata?.maps
    if (!maps) return out
    for (const [prop, driver] of Object.entries(maps)) {
        if ((driver as {type?: string}).type !== 'map') continue
        for (const f of ['inputMin', 'inputMax', 'outputMin', 'outputMax', 'curve']) {
            out.push({name: `_map_${prop}_${f}`, schema: d.f32, initial: 0})
        }
    }
    return out
}

function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore} {
    const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const props = {...defaultsFor(s.def), ...(s.props ?? {})}
        const propFields = bridgeFieldInits(s.def, props, s.id)
        const synthetic: FieldInit[] = [
            {name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1},
            ...(s.def.animatedTime ? [{name: '_animTime', schema: d.f32, initial: 0}] : []),
            ...mapSyntheticFields(s.metadata),
        ]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.finalize()

    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    const customIdToId = new Map<string, string>()
    for (const s of specs) {
        if (s.customId) customIdToId.set(s.customId, s.id)
        nodes.set(s.id, {
            id: s.id,
            customId: s.customId,
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
        resolveCustomId: (cid) => customIdToId.get(cid) ?? null,
        store,
    }
    return {registry, store}
}

const DG = DotGrid as GpuShaderDefinition

describe('DotGrid (a) plain generator', () => {
    it('final pass calls dotGridAlpha + reads _animTime, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'dg', def: DG, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/dotGridAlpha/)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(finalWgsl).toMatch(/fwidth/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('DotGrid (b) map-driven — mapSampleUVs + map-driver wiring (d1f)', () => {
    it('RTTs the source and samples it at the cell-centre UV (cells.cellCentreUV), not the fragment uv', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {
                id: 'dg',
                def: DG,
                parentId: 'root',
                metadata: {
                    renderOrder: 1,
                    maps: {
                        dotSize: {
                            type: 'map',
                            source: 'grad',
                            channel: 'luminance',
                            inputMin: 0,
                            inputMax: 1,
                            outputMin: 0.05,
                            outputMax: 0.95,
                            curve: 0,
                        },
                    } as never,
                },
            },
            {id: 'src', def: SolidSource, parentId: 'root', customId: 'grad', metadata: {renderOrder: 0, visible: false}},
        ])
        const ir = composeNodeTree(registry)
        // The source is RTT'd (map driver registers a boundary).
        expect(ir.rttPasses.length).toBeGreaterThanOrEqual(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry, ...ir.rttPasses.map((p) => p.fragment.entry)], {names: 'strict'})
        // The cell-centre UV fn is emitted and the source sample uses it (proves mapSampleUVs wired).
        expect(finalWgsl).toMatch(/cellCentreUV/)
        // The map remap windows are read.
        expect(finalWgsl).toMatch(/_map_dotSize_outputMin/)
        expect(finalWgsl).toMatchSnapshot('map-driven-final-pass')
    })
})

describe('DotGrid (c) CPU golden — cells.cellCentreUV (the lattice DotGrid maps through)', () => {
    // Verbatim transcription of the v1 mapSampleUVs math.
    const golden = (uv: [number, number], vp: [number, number], density: number): [number, number] => {
        const aspect = vp[0] / vp[1]
        const cx = uv[0] * aspect
        const cy = 1 - uv[1]
        const ccx = (Math.floor(cx * density) + 0.5) / density
        const ccy = (Math.floor(cy * density) + 0.5) / density
        return [ccx / aspect, 1 - ccy]
    }
    it('snaps to the cell centre and inverts back to screen-UV space', () => {
        const cases: {uv: [number, number]; vp: [number, number]; density: number}[] = [
            {uv: [0.5, 0.5], vp: [800, 600], density: 30},
            {uv: [0.2, 0.8], vp: [1280, 720], density: 15},
            {uv: [0.9, 0.1], vp: [600, 600], density: 8},
        ]
        for (const c of cases) {
            const out = cellCentreUV(d.vec2f(c.uv[0], c.uv[1]), d.vec2f(c.vp[0], c.vp[1]), c.density)
            const [ex, ey] = golden(c.uv, c.vp, c.density)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})

describe('DotGrid (d) map config is part of the structural hash', () => {
    it('changing the map source recomposes', () => {
        const base: NodeSpec[] = [
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'dg', def: DG, parentId: 'root', metadata: {renderOrder: 0}},
        ]
        const withMap: NodeSpec[] = [
            {id: 'root', def: RootContainer, parentId: null},
            {
                id: 'dg',
                def: DG,
                parentId: 'root',
                metadata: {
                    renderOrder: 0,
                    maps: {dotSize: {type: 'map', source: 'grad', channel: 'luminance', inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1, curve: 0}} as never,
                },
            },
            {id: 'src', def: SolidSource, parentId: 'root', customId: 'grad', metadata: {visible: false}},
        ]
        const hashOf = (specs: NodeSpec[]) => collectStructuralHashInputs(buildRegistry(specs).registry).join('\n')
        expect(hashOf(base)).not.toBe(hashOf(withMap))
    })
})
