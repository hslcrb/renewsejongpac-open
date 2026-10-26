import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Pixelate from '@coreroot/shaders/Pixelate/index'
import {pixelateSample} from '@coreroot/gpu/kit/motionBlur'

/**
 * Pixelate port gate (Phase D2-C). RTT quantize filter (no uvRemap in v1 — the gap/roundness
 * alpha cut forces the fragment path). Resolve+snapshot the fragment path; CPU golden the packed
 * sample-UV + mask body.
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

const genBody = tgpu.fn([d.f32, d.vec2f], d.vec4f)((seed, uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, seed, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {seed: {default: 0.5}} as never,
    fragment: ({uniforms, ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uniforms.seed, ctx.uv]),
}
const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(genBody, 'genBody', []),
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

describe('Pixelate — RTT quantize filter', () => {
    it('converts the child to a texture, samples the quantised coord, unpremultiplies, masks alpha', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'px', def: Pixelate as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'px', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/pixelateSample/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('pixelate-fragment')
    })
})

describe('Pixelate — CPU golden (packed sample-UV + cell mask)', () => {
    // ORIGINAL v1 math transcribed by hand.
    const golden = (uv: [number, number], aspect: number, scale: number, gap: number, roundness: number) => {
        const isWide = aspect > 1
        const pcx = Math.max(isWide ? scale : scale * aspect, 1)
        const pcy = Math.max(isWide ? scale / aspect : scale, 1)
        const sx = Math.floor(uv[0] * pcx) / pcx
        const sy = Math.floor(uv[1] * pcy) / pcy
        const lx = (uv[0] * pcx - Math.floor(uv[0] * pcx)) - 0.5
        const ly = (uv[1] * pcy - Math.floor(uv[1] * pcy)) - 0.5
        const halfSize = 0.5 - gap * 0.5
        const r = roundness * halfSize
        const qx = Math.max(Math.abs(lx) - halfSize + r, 0)
        const qy = Math.max(Math.abs(ly) - halfSize + r, 0)
        const sdf = Math.hypot(qx, qy) - r
        return {sx, sy, mask: sdf <= 0 ? 1 : 0}
    }

    const cases: {uv: [number, number]; aspect: number; scale: number; gap: number; roundness: number}[] = [
        {uv: [0.5, 0.5], aspect: 800 / 600, scale: 50, gap: 0, roundness: 0},
        {uv: [0.13, 0.87], aspect: 16 / 9, scale: 20, gap: 0.4, roundness: 0.5},
        {uv: [0.9, 0.1], aspect: 0.5, scale: 8, gap: 0.9, roundness: 1},
    ]

    it('pixelateSample reproduces the original quantisation + mask', () => {
        for (const c of cases) {
            const out = pixelateSample(d.vec2f(c.uv[0], c.uv[1]), c.aspect, c.scale, c.gap, c.roundness) as {x: number; y: number; z: number}
            const ex = golden(c.uv, c.aspect, c.scale, c.gap, c.roundness)
            expect(out.x).toBeCloseTo(ex.sx, 5)
            expect(out.y).toBeCloseTo(ex.sy, 5)
            expect(out.z).toBe(ex.mask)
        }
    })
})
