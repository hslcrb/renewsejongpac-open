import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Voronoi from '@coreroot/shaders/Voronoi/index'

/**
 * Voronoi port gate (Phase W6-B). Animated cellular generator with a 3×3 neighbour loop, a worley
 * hash, and multi-stop OR two-color output. Hash-driven → GPU-only (resolve+snapshot, no CPU golden).
 * Asserts both color paths + reads `_animTime` + colorSpace structural-hash.
 */

function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) { return buffer })}
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}
const RootContainer: GpuShaderDefinition = {name: 'Root', props: {} as never, fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? (undefined as never)}
interface NodeSpec {id: string; def: GpuShaderDefinition; parentId: string | null; props?: Record<string, unknown>; metadata?: Partial<NodeMetadata>}
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
        if (s.def.animatedTime) synthetic.push({name: '_animTime', schema: d.f32, initial: 0})
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.finalize()
    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) nodes.set(s.id, {id: s.id, componentName: s.def.name, parentId: s.parentId, definition: s.def, metadata: {blendMode: 'normal', opacity: undefined, renderOrder: 0, ...s.metadata} as NodeMetadata, handles: handlesById[s.id]})
    for (const s of specs) if (s.parentId) { const arr = childrenByParent.get(s.parentId) ?? []; arr.push(nodes.get(s.id)!); childrenByParent.set(s.parentId, arr) }
    const root = specs.find((s) => s.parentId === null)!
    const registry: RegistryView = {rootId: root.id, getNode: (id) => nodes.get(id), getChildren: (parentId) => childrenByParent.get(parentId) ?? [], resolveCustomId: () => null, store}
    return {registry, store}
}

const VO = Voronoi as GpuShaderDefinition

describe('Voronoi (a) two-color path emits the voronoi cell composition + mixColors', () => {
    it('final pass calls voronoiNearest2 + cellFill (with the worley hash), reads _animTime, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'vo', def: VO, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/cellFill/)
        expect(finalWgsl).toMatch(/cellHash2/) // the shared legacy sin-fract cell hash (was a local `voronoiHash`)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(finalWgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass-two-color')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'vo', def: VO, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklab'}))
    })
})

describe('Voronoi (b) multi-stop path emits the runtime stops loop', () => {
    it('final pass runs gradientStopsInSpace when >1 active stops', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#00ff00', position: 0.5},
            {color: '#0000ff', position: 1},
        ]
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'vo', def: VO, parentId: 'root', props: {stops}, metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/gradientStopsInSpace/)
        expect(finalWgsl).toMatchSnapshot('final-pass-multi-stop')
    })
})
