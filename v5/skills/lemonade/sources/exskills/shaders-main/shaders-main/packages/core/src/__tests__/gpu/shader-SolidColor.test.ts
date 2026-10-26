import {describe, it, expect, vi} from 'vitest'
import {d} from '@coreroot/gpu/kit'
import {tgpu} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import {transformColorGpu} from '@coreroot/gpu/transforms'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import SolidColor from '@coreroot/shaders/SolidColor/index'

/**
 * SolidColor port gate (Phase D1-A). GPU-free: mocked store root, real composer, resolve+snapshot
 * the final pass. SolidColor has no shader-math body (it returns the color uniform directly), so
 * the "golden" checks are on the bridge: the CSS color → P3-linear rgba transform, and alpha
 * passthrough (the S6 half-transparent case).
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

const SC = SolidColor as GpuShaderDefinition

describe('SolidColor (a) generator emits the color uniform', () => {
    it('the final pass reads the node color field, no RTT passes', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'sc', def: SC, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/uniforms\.n_sc\.color/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('SolidColor (b) bridge color transform golden', () => {
    it('opaque CSS color → finite P3-linear rgba with alpha 1', () => {
        const c = transformColorGpu('#5b18ca') as unknown as {x: number; y: number; z: number; w: number}
        // Purple #5b18ca has a dominant blue channel and low green in linear P3.
        expect(c.w).toBeCloseTo(1, 6)
        expect(Number.isFinite(c.x)).toBe(true)
        expect(c.z).toBeGreaterThan(c.y) // blue > green
    })

    it('alpha passes through (the S6 half-transparent case)', () => {
        // hex8 → primitive alpha. NOTE: `rgba(r,g,b,a)` / `hsl(.../a)` CSS syntaxes yield a BOXED
        // Number for colorjs.io's `.alpha`, which `Number.isFinite` rejects → alpha 0. This is a
        // latent quirk shared BYTE-IDENTICALLY with v1's parseColorChannels (transformations.ts),
        // NOT a GPU regression, so it is deliberately not "fixed" here (fixing it would diverge from
        // v1). The color picker emits hex8, so this never bites in production; the S6 spec uses hex8.
        const c = transformColorGpu('#ff00ff80') as unknown as {w: number}
        expect(c.w).toBeCloseTo(128 / 255, 5)
    })
})
