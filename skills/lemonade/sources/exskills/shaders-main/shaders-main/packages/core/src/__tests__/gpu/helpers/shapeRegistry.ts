/**
 * Shared registry/compose harness for the analytic shape-shader port gates (D1-D batch:
 * Arc/Crescent/Flower/Parallelogram/Polygon/Ring/RoundedRect/Star/Teardrop/Trapezoid/Vesica).
 *
 * Every shape test does the same three things — resolve+snapshot the generator's final pass,
 * assert compile-time `colorSpace` specialisation + its presence in the recompile hash, and
 * CPU-golden the exported `<shape>Shape` DualFn. This lifts the identical registry boilerplate
 * (the `buildRegistry` copy each of the earlier Circle/Ellipse/Cross/Heart tests inlined) into
 * one place so the per-shader tests are just the assertions.
 */
import {vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, type CompositionIR} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'

function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {
        return buffer
    })}
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}

export const RootContainer: GpuShaderDefinition = {
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
    for (const s of specs) if (s.parentId) {
        const arr = childrenByParent.get(s.parentId) ?? []
        arr.push(nodes.get(s.id)!)
        childrenByParent.set(s.parentId, arr)
    }
    const root = specs.find((s) => s.parentId === null)!
    return {
        registry: {
            rootId: root.id,
            getNode: (id) => nodes.get(id),
            getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
            resolveCustomId: () => null,
            store,
        },
        store,
    }
}

/** Compose a single shape generator under the passthrough root; returns the composed IR. */
export function composeShape(def: GpuShaderDefinition, props?: Record<string, unknown>): ComposedIR {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 's', def, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return composeNodeTree(registry)
}

/** Compose + resolve the final pass to strict-named WGSL. */
export function resolveShapeWgsl(def: GpuShaderDefinition, props?: Record<string, unknown>): string {
    return tgpu.resolve([composeShape(def, props).finalPass.entry], {names: 'strict'})
}

/** The structural-hash inputs (joined) for a shape at the given props — for recompile assertions. */
export function structuralHashInputs(def: GpuShaderDefinition, props?: Record<string, unknown>): string {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 's', def, parentId: 'root', props},
    ])
    return collectStructuralHashInputs(registry).join('\n')
}
