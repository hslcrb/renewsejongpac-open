import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Repeater from '@coreroot/shaders/Repeater/index'
import Circle from '@coreroot/shaders/Circle/index'

/**
 * Repeater port gate (D2-E). The only `wantsBoundsParams` shader. Grid/radial/linear layouts sampling
 * the child RTT once per instance inside a runtime WGSL loop (legacy per-pixel path; byte-identical
 * OUTPUT to v1's CPU-hoisted fast path). Over a Circle child (a propBindings shape), the composer's
 * childBoundsParams wiring resolves the SHAPE path → the consumer's own `_childBounds_*` fields
 * (updateChildBounds drives them each frame). Compile-time mode/flip/hueShift branch in the builder.
 */
function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) { return buffer })}
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
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
    for (const [name, u] of Object.entries(map)) inits.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
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
        // d2e: wantsBoundsParams nodes carry _childBounds_* (the shape-child CPU-resolved bounds).
        if (s.def.wantsBoundsParams) {
            for (const k of ['centerX', 'centerY', 'halfWidth', 'halfHeight']) {
                synthetic.push({name: `_childBounds_${k}`, schema: d.f32, initial: 0.5})
            }
        }
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.finalize()

    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) {
        nodes.set(s.id, {
            id: s.id, componentName: s.def.name, parentId: s.parentId, definition: s.def,
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

const R = Repeater as GpuShaderDefinition
const C = Circle as GpuShaderDefinition

describe('Repeater (grid) over a Circle child — childBounds shape path', () => {
    const resolve = (props: Record<string, unknown> = {}): string => {
        const {registry} = buildRegistry([
            {id: 'rep', def: R, parentId: null, props},
            {id: 'circ', def: C, parentId: 'rep', metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('emits a runtime instance loop that samples the child RTT and unpremultiplies', () => {
        const wgsl = resolve()
        // Runtime loop over instances.
        expect(wgsl).toMatch(/for\s*\(var/)
        // Samples the composed child through an RTT boundary (tex.$.rtt_0 → rtt_0 post-resolve).
        // textureSampleLevel (not textureSample) — the sample sits in non-uniform loop control flow.
        expect(wgsl).toMatch(/textureSampleLevel\(rtt_/)
        // RTT data is premultiplied → the accumulator is unpremultiplied on the way out.
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('repeater-grid-over-circle')
    })

    it('reads the consumer node\'s _childBounds_* fields (Circle is a shape child, not an active bbox)', () => {
        const wgsl = resolve()
        expect(wgsl).toMatch(/_childBounds_centerX/)
        expect(wgsl).toMatch(/_childBounds_halfWidth/)
    })

    it('radial mode branches to a different layout (compile-time mode)', () => {
        const grid = resolve({mode: 'grid'})
        const radial = resolve({mode: 'radial'})
        // Grid emits the cell-pitch math; radial does not (only the active mode's WGSL is emitted).
        expect(grid).not.toEqual(radial)
    })
})
