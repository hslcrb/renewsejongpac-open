import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Group from '@coreroot/shaders/Group/index'
import Circle from '@coreroot/shaders/Circle/index'

/**
 * Group port gate (D2-E). A Group is an image-like viewport over its composited children. With an
 * active bounding box (boxResamplesContent) the composer RTTs the composite and samples it through
 * the box→content UV map (bboxGenUVContext) + a rounded-rect clip — the tracked known-stubbed
 * boxResamplesContent path. Identity (zero RTT) until the box is non-default.
 */
function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) { return buffer })}
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}

const BBOX_FIELDS = ['centerX', 'centerY', 'halfWidth', 'halfHeight', 'cornerRadius', 'rotation', 'aspectRatio']

interface NodeSpec {
    id: string
    def: GpuShaderDefinition
    parentId: string | null
    props?: Record<string, unknown>
    metadata?: Partial<NodeMetadata>
    box?: boolean
}

function bridgeFieldInits(def: GpuShaderDefinition, props: Record<string, unknown>, id: string): FieldInit[] {
    const map = createGpuUniformsMap(def as never, props, id)
    const inits: FieldInit[] = []
    for (const [name, u] of Object.entries(map)) inits.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
    return inits
}
function defaultsFor(def: GpuShaderDefinition): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(def.props)) out[name] = (cfg as {default: unknown}).default
    return out
}

function buildRegistry(specs: NodeSpec[]): RegistryView {
    const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const props = {...defaultsFor(s.def), ...(s.props ?? {})}
        const propFields = bridgeFieldInits(s.def, props, s.id)
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: 1}]
        if (s.box) {
            // Half-canvas box centred; the resample path reads these _bbox_* fields.
            const vals: Record<string, number> = {centerX: 0.5, centerY: 0.5, halfWidth: 0.25, halfHeight: 0.25, cornerRadius: 0, rotation: 0, aspectRatio: 1}
            for (const k of BBOX_FIELDS) synthetic.push({name: `_bbox_${k}`, schema: d.f32, initial: vals[k]})
        }
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.finalize()

    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) {
        nodes.set(s.id, {
            id: s.id, componentName: s.def.name, parentId: s.parentId, definition: s.def,
            metadata: {blendMode: 'normal', opacity: undefined, renderOrder: 0, boundingBox: s.box ? {} : undefined, ...s.metadata} as NodeMetadata,
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
    return {
        rootId: root.id,
        getNode: (id) => nodes.get(id),
        getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: () => null,
        store,
    }
}

const G = Group as GpuShaderDefinition
const C = Circle as GpuShaderDefinition

describe('Group with an active bounding box — boxResamplesContent path', () => {
    const resolveGroup = (box: boolean): string => {
        const registry = buildRegistry([
            {id: 'grp', def: G, parentId: null, box},
            {id: 'a', def: C, parentId: 'grp', metadata: {renderOrder: 0}},
            {id: 'b', def: C, parentId: 'grp', props: {radius: 0.2}, metadata: {renderOrder: 1}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('resamples the composite INTO the box (box→content UV map + clip + unpremultiply)', () => {
        const wgsl = resolveGroup(true)
        // The box→content UV map (same mapping resize-fit generators use).
        expect(wgsl).toMatch(/bboxGenUVContext/)
        // Samples the RTT'd composite, then unpremultiplies (RTT data is premultiplied).
        expect(wgsl).toMatch(/textureSample\(rtt_/)
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        // Confined to the box rectangle (rounded-rect clip mask).
        expect(wgsl).toMatch(/bboxClipMask/)
        expect(wgsl).toMatchSnapshot('group-boxresamples')
    })

    it('is identity (no RTT resample) when the box is inactive', () => {
        const wgsl = resolveGroup(false)
        expect(wgsl).not.toMatch(/bboxGenUVContext/)
    })
})
