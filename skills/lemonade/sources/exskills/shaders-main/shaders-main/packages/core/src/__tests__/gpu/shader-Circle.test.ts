import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Circle from '@coreroot/shaders/Circle/index'

/**
 * Circle port gate (Phase D1-B — the batch that validates kit/sdf). GPU-free: the uniform store's
 * root is mocked, the composer builds the real raw-WGSL fragment, and we `tgpu.resolve` it to WGSL
 * and snapshot it. The primitive math is CPU-goldened in kit-sdf.test.ts; the
 * transcription of the ORIGINAL v1 fragmentNode (aspect-correct → circleSdf → stroke/softness mask).
 * Circle is a generator (no RTT child) reached via ctx.uv; colorSpace is compile-time.
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

const C = Circle as GpuShaderDefinition

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) Default generator — the smoke path
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Circle (a) default generator', () => {
    it('emits the circle shape + mixColors (linear), no RTT pass', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'c', def: C, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/circleSdf/)
        expect(finalWgsl).toMatch(/strokeMaskFromSdf/)
        expect(finalWgsl).toMatch(/circleSdf/)
        expect(finalWgsl).toMatch(/strokeMaskFromSdf/)
        expect(finalWgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) Compile-time colorSpace — selects the mixColors variant + is part of the recompile hash
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Circle (b) compile-time colorSpace', () => {
    const resolveWith = (props: Record<string, unknown>): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'c', def: C, parentId: 'root', props, metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }
    it('oklch back-converts via the OKLab/OKLCh conversion fns; linear does not', () => {
        expect(resolveWith({colorSpace: 'oklch'})).toMatch(/oklchToOklab/)
        expect(resolveWith({colorSpace: 'linear'})).not.toMatch(/oklchToOklab/)
    })
    it('colorSpace is part of the structural (recompile) hash', () => {
        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'c', def: C, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklch'}))
        expect(hashWith({colorSpace: 'oklab'})).toMatch(/colorSpace=2/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
