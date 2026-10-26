import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import SunBurst from '@coreroot/shaders/SunBurst/index'
import {lightfields} from '@coreroot/gpu/kit'


/**
 * SunBurst port gate (Phase W6-B). Animated two-color-by-alpha generator. GPU-free resolve+snapshot
 * of the final pass (reads `_animTime`). CPU golden: the composed pure parts transcribed by
 * hand from the v1 fragmentNode.
 */

function mockRoot() {
    const buffer = {
        patch: vi.fn(), write: vi.fn(), destroy: vi.fn(),
        $usage: vi.fn(function (this: unknown) { return buffer }),
    }
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}

const RootContainer: GpuShaderDefinition = {
    name: 'Root', props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? (undefined as never),
}

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
        rootId: root.id, getNode: (id) => nodes.get(id), getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: () => null, store,
    }
    return {registry, store}
}

const SB = SunBurst as GpuShaderDefinition

describe('SunBurst (a) animated generator composes the light parts + reads _animTime', () => {
    it('final pass composes radialFrame -> softRayLobes x featherMask, reads _animTime, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'sb', def: SB, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/fn radialFrame/)
        expect(finalWgsl).toMatch(/softRayLobes/)
        expect(finalWgsl).toMatch(/featherMask/)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('SunBurst (b) CPU golden — the composed parts', () => {
    const golden = (
        uv: [number, number], vp: [number, number], center: [number, number],
        rayCount: number, softness: number, radius: number, feather: number, animTime: number,
    ): number => {
        const smoothstep = (e0: number, e1: number, x: number) => {
            const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
            return t * t * (3 - 2 * t)
        }
        const aspect = vp[0] / vp[1]
        const cx = center[0]
        const cy = 1 - center[1]
        const dx = uv[0] * aspect - cx * aspect
        const dy = uv[1] - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        const t = Math.sin(angle * rayCount - animTime) * 0.5 + 0.5
        const sharpness = (1 / (softness + 0.05)) * 0.3
        const rayMask = Math.pow(t, sharpness)
        const falloffStart = radius * (1 - feather)
        const outerMask = 1 - smoothstep(falloffStart, radius, dist)
        return rayMask * outerMask
    }

    it('reproduces the ray + radial-falloff coverage', () => {
        // The golden passes the STORED center (transformPosition = (x, 1-y)); the body does `1-center.y`.
        const cases: {uv: [number, number]; vp: [number, number]; c: [number, number]; rc: number; s: number; r: number; f: number; t: number}[] = [
            {uv: [0.7, 0.3], vp: [800, 600], c: [0.5, 0.5], rc: 12, s: 0.3, r: 0.8, f: 0.5, t: 0},
            {uv: [0.2, 0.8], vp: [1920, 1080], c: [0.5, 0.5], rc: 24, s: 0.1, r: 0.6, f: 0.2, t: 1.5},
            {uv: [0.55, 0.45], vp: [1, 1], c: [0.4, 0.6], rc: 8, s: 0.5, r: 1.0, f: 0.8, t: 0.7},
        ]
        for (const c of cases) {
            // The same pipeline the noun composes: frame -> soft ray lobes x feather mask.
            const frame = lightfields.radialBurstFrame(
                d.vec2f(c.uv[0], c.uv[1]), d.vec2f(c.vp[0], c.vp[1]), d.vec2f(c.c[0], c.c[1]),
            ) as unknown as {x: number; y: number}
            const rays = lightfields.softRayLobes(frame.y, c.rc, -c.t, c.s) as unknown as number
            const feather = lightfields.radialFeatherMask(frame.x, c.r, c.f) as unknown as number
            expect(rays * feather).toBeCloseTo(golden(c.uv, c.vp, c.c, c.rc, c.s, c.r, c.f, c.t), 5)
        }
    })
})
