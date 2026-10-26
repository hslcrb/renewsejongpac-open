import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Cross from '@coreroot/shaders/Cross/index'

/**
 * Cross gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → crossSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {
        return buffer
    })}
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

const CR = Cross as GpuShaderDefinition

describe('Cross (a) default generator', () => {
    it('emits the cross shape + SDF + mixColors, no RTT pass', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'cr', def: CR, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/crossSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Cross (b) compile-time colorSpace', () => {
    const resolveWith = (props: Record<string, unknown>): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'cr', def: CR, parentId: 'root', props, metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }
    it('hsl back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveWith({colorSpace: 'hsl'})).toMatch(/hslToRgb/)
        expect(resolveWith({colorSpace: 'linear'})).not.toMatch(/hslToRgb/)
        const {registry: r0} = buildRegistry([{id: 'root', def: RootContainer, parentId: null}, {id: 'cr', def: CR, parentId: 'root', props: {colorSpace: 'linear'}}])
        const {registry: r1} = buildRegistry([{id: 'root', def: RootContainer, parentId: null}, {id: 'cr', def: CR, parentId: 'root', props: {colorSpace: 'hsl'}}])
        expect(collectStructuralHashInputs(r0).join('\n')).not.toBe(collectStructuralHashInputs(r1).join('\n'))
    })
})

