import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {expr} from '@coreroot/gpu/composer'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Grid from '@coreroot/shaders/Grid/index'
import {gridCellCenterUV} from '@coreroot/gpu/kit/patternPaints'

/**
 * Grid port gate (Phase D1-F). Second mapSampleUVs shader — asserts the map-driver samples the
 * source at the (rotated) cell-CENTER UV `gridCellCenterUV(...)`. Plus the plain generator path
 * (Quilez dpdx/dpdy grid filter + mixColors).
 *
 * Grid's two pure sub-fns moved into the kit in Phase 6 — the lattice is `cells.cellCentreUVRotated`
 * (Grid keeps a one-line wrapper for the degrees→radians conversion, still golden-tested below) and
 * the per-axis integral is `aa.quilezLineFilterAxis`, whose goldens now live in `kit-aa.test.ts`.
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

const GR = Grid as GpuShaderDefinition

describe('Grid (a) plain generator', () => {
    it('final pass calls gridField + quilezLineFilterAxis (dpdx/dpdy) + mixColors, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'gr', def: GR, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/gridField/)
        expect(finalWgsl).toMatch(/quilezLineFilterAxis/)
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
                {id: 'gr', def: GR, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklab'}))
    })
})

describe('Grid (b) map-driven — mapSampleUVs (rotated cell centre)', () => {
    it('samples the source at gridCellCenterUV, not the fragment uv', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {
                id: 'gr',
                def: GR,
                parentId: 'root',
                metadata: {
                    renderOrder: 1,
                    maps: {
                        thickness: {
                            type: 'map',
                            source: 'grad',
                            channel: 'luminance',
                            inputMin: 0,
                            inputMax: 1,
                            outputMin: 0,
                            outputMax: 10,
                            curve: 0,
                        },
                    } as never,
                },
            },
            {id: 'src', def: SolidSource, parentId: 'root', customId: 'grad', metadata: {renderOrder: 0, visible: false}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBeGreaterThanOrEqual(1)
        const wgsl = tgpu.resolve([ir.finalPass.entry, ...ir.rttPasses.map((p) => p.fragment.entry)], {names: 'strict'})
        expect(wgsl).toMatch(/gridCellCenterUV/)
        expect(wgsl).toMatch(/_map_thickness_outputMax/)
        expect(wgsl).toMatchSnapshot('map-driven-final-pass')
    })
})

describe('Grid (c) CPU golden — gridCellCenterUV', () => {
    const golden = (uv: [number, number], vp: [number, number], cells: number, rotation: number): [number, number] => {
        const DEG = Math.PI / 180
        const aspect = vp[0] / vp[1]
        const cxu = uv[0] * aspect
        const cyu = 1 - uv[1]
        const r = rotation * DEG
        const cosR = Math.cos(r)
        const sinR = Math.sin(r)
        const centerX = aspect * 0.5
        const centerY = 0.5
        const cx = cxu - centerX
        const cy = cyu - centerY
        const rotX = cx * cosR - cy * sinR + centerX
        const rotY = cx * sinR + cy * cosR + centerY
        const cellRX = (Math.floor(rotX * cells) + 0.5) / cells
        const cellRY = (Math.floor(rotY * cells) + 0.5) / cells
        const ccx = cellRX - centerX
        const ccy = cellRY - centerY
        const unrotX = ccx * cosR + ccy * sinR + centerX
        const unrotY = ccx * -sinR + ccy * cosR + centerY
        return [unrotX / aspect, 1 - unrotY]
    }
    it('reproduces the rotated cell-centre inverse-transform (rotation 0 and 30°)', () => {
        const cases: {uv: [number, number]; vp: [number, number]; cells: number; rotation: number}[] = [
            {uv: [0.5, 0.5], vp: [800, 600], cells: 10, rotation: 0},
            {uv: [0.3, 0.7], vp: [1280, 720], cells: 12, rotation: 30},
            {uv: [0.8, 0.2], vp: [600, 600], cells: 6, rotation: 45},
        ]
        for (const c of cases) {
            const out = gridCellCenterUV(
                d.vec2f(c.uv[0], c.uv[1]),
                d.vec2f(c.vp[0], c.vp[1]),
                c.cells,
                c.rotation,
            ) as unknown as {x: number; y: number}
            const [ex, ey] = golden(c.uv, c.vp, c.cells, c.rotation)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})
