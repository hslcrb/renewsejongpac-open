import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import SineWave from '@coreroot/shaders/SineWave/index'
import {sineWaveMask} from '@coreroot/gpu/kit/shapePaints'

/**
 * SineWave port gate (Phase W6-B). Animated single-color generator. GPU-free resolve+snapshot of the
 * final pass (reads the node's `_animTime` field via the `animatedTime()` porter helper). CPU golden:
 * the pure `sineWaveMask` body transcribed by hand from the v1 fragmentNode.
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
        if (s.def.animatedTime) synthetic.push({name: '_animTime', schema: d.f32, initial: 0})
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

const SW = SineWave as GpuShaderDefinition

describe('SineWave (a) animated generator emits sineWaveMask + reads _animTime', () => {
    it('final pass calls sineWaveMask, reads _animTime, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'sw', def: SW, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/sineWaveMask/)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('is registered with an animatedTime speed prop', () => {
        expect(SW.animatedTime).toEqual({speed: 'speed'})
    })
})

describe('SineWave (b) CPU golden — sineWaveMask', () => {
    // Verbatim transcription of the v1 fragmentNode.
    const golden = (
        uv: [number, number],
        vp: [number, number],
        angle: number,
        position: [number, number],
        frequency: number,
        amplitude: number,
        thickness: number,
        softness: number,
        animTime: number,
    ): number => {
        const smoothstep = (e0: number, e1: number, x: number) => {
            const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
            return t * t * (3 - 2 * t)
        }
        const aspect = vp[0] / vp[1]
        const centeredX = uv[0] * aspect - position[0] * aspect
        const centeredY = uv[1] - (1 - position[1])
        const angleRad = angle * (Math.PI / 180)
        const rotatedX = centeredX * Math.cos(angleRad) - centeredY * Math.sin(angleRad)
        const rotatedY = centeredX * Math.sin(angleRad) + centeredY * Math.cos(angleRad)
        const waveInput = rotatedX * frequency * (Math.PI * 2) + animTime
        const sineWave = Math.sin(waveInput) * amplitude
        const dist = Math.abs(rotatedY - sineWave)
        const halfT = thickness * 0.5
        const halfS = softness * 0.5
        return 1 - smoothstep(halfT - halfS, halfT + halfS, dist)
    }

    it('reproduces the aspect-corrected, rotated, soft-banded wave coverage', () => {
        // NOTE: the bridge stores transformPosition as (x, 1-y); this body receives that stored value
        // and does `1 - position.y` to recover the authored y. The golden passes the STORED position.
        const cases: {
            uv: [number, number]; vp: [number, number]; angle: number; pos: [number, number]
            freq: number; amp: number; thick: number; soft: number; t: number
        }[] = [
            {uv: [0.5, 0.5], vp: [800, 600], angle: 0, pos: [0.5, 0.5], freq: 1, amp: 0.15, thick: 0.2, soft: 0.4, t: 0},
            {uv: [0.25, 0.6], vp: [1920, 1080], angle: 30, pos: [0.5, 0.5], freq: 3, amp: 0.2, thick: 0.1, soft: 0.2, t: 1.2},
            {uv: [0.9, 0.1], vp: [1, 1], angle: 90, pos: [0.3, 0.7], freq: 2, amp: 0.25, thick: 0.3, soft: 0.1, t: 2.5},
        ]
        for (const c of cases) {
            const out = sineWaveMask(
                d.vec2f(c.uv[0], c.uv[1]),
                d.vec2f(c.vp[0], c.vp[1]),
                c.angle,
                d.vec2f(c.pos[0], c.pos[1]),
                c.freq,
                c.amp,
                c.thick,
                c.soft,
                c.t,
            ) as unknown as number
            expect(out).toBeCloseTo(golden(c.uv, c.vp, c.angle, c.pos, c.freq, c.amp, c.thick, c.soft, c.t), 5)
        }
    })
})
