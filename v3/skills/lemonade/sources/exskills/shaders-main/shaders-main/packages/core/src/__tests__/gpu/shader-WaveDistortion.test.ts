import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import WaveDistortion from '@coreroot/shaders/WaveDistortion/index'
import {waveDistortSine, waveDistortTriangle} from '@coreroot/gpu/kit/warpMaps'

/**
 * WaveDistortion port gate (Phase D2-B). Animated (reads `_animTime`) + TWO compileTime props
 * (waveType 0..4 + edges). Resolve+snapshot both paths; assert the waveType JS-branch emits the
 * matching body per mode + is in the structural hash; CPU golden on the sine + triangle bodies.
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
    acceptsUVContext: true,
    props: {seed: {default: 0.5}} as never,
    fragment: ({uniforms, uvContext, ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uniforms.seed, uvContext ?? ctx.uv]),
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

const W = WaveDistortion as GpuShaderDefinition

describe('WaveDistortion (a) analytic UV fold over a generator', () => {
    it('folds WaveDistortion.uvRemap into the generator sample coordinate (inline, no RTT); reads _animTime', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'wd', def: W, parentId: 'root', props: {edges: 'stretch'}, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'wd', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/waveDistortSine/)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(finalWgsl).toMatch(/edgeClampUV/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass-uvremap')
    })
})

describe('WaveDistortion (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the wave-distorted coord, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'wd', def: W, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'wd', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/waveDistortSine/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('final-pass-fragment')
    })
})

describe('WaveDistortion (c) compile-time waveType branch', () => {
    const resolveWithWave = (waveType: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'wd', def: W, parentId: 'root', props: {waveType, edges: 'stretch'}, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'wd', metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('each waveType emits its own body fn and no other', () => {
        expect(resolveWithWave('sine')).toMatch(/waveDistortSine/)
        expect(resolveWithWave('triangle')).toMatch(/waveDistortTriangle/)
        expect(resolveWithWave('square')).toMatch(/waveDistortSquare/)
        expect(resolveWithWave('sawtooth')).toMatch(/waveDistortSawtooth/)
        expect(resolveWithWave('bounce')).toMatch(/waveDistortBounce/)
        expect(resolveWithWave('triangle')).not.toMatch(/waveDistortSine/)
    })

    it('waveType is part of the structural (recompile) hash', () => {
        const build = (waveType: string) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'wd', def: W, parentId: 'root', props: {waveType}, metadata: {renderOrder: 0}},
                {id: 'gen', def: Generator, parentId: 'wd', metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('sine')).not.toBe(build('square'))
    })
})

describe('WaveDistortion (c2) compile-time edge modes', () => {
    const resolveWithEdges = (edges: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'wd', def: W, parentId: 'root', props: {edges}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'wd', metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('mirror/wrap/transparent select the matching WGSL; stretch uses neither', () => {
        expect(resolveWithEdges('mirror')).toMatch(/edgeMirrorUV/)
        expect(resolveWithEdges('wrap')).toMatch(/edgeWrapUV/)
        expect(resolveWithEdges('transparent')).toMatch(/edgeTransparentMask/)
        const stretch = resolveWithEdges('stretch')
        expect(stretch).not.toMatch(/edgeMirrorUV/)
        expect(stretch).not.toMatch(/edgeWrapUV/)
    })
})

describe('WaveDistortion (d) CPU golden — math equivalence with the original formula', () => {
    // ORIGINAL wave math, transcribed from v1. `t` is createAnimatedTime × 0.5 (the ×0.5 is applied
    // by the builder before calling the body, so the body's `t` already carries it).
    const phaseOf = (uv: [number, number], aspect: number, angle: number, frequency: number, t: number): number => {
        const centered: [number, number] = [uv[0] - 0.5, uv[1] - 0.5]
        const acu: [number, number] = [centered[0] * aspect, centered[1]]
        const angleRad = (angle * Math.PI) / 180
        const cosA = Math.cos(angleRad)
        const sinA = Math.sin(angleRad)
        const rotatedY = acu[0] * sinA + acu[1] * cosA
        return (rotatedY + 0.5) * frequency * (Math.PI * 2) + t
    }
    const applyOf = (uv: [number, number], aspect: number, angle: number, strength: number, wave: number): [number, number] => {
        const angleRad = (angle * Math.PI) / 180
        const cosA = Math.cos(angleRad)
        const sinA = Math.sin(angleRad)
        const displacement = wave * strength * 0.5
        return [uv[0] + (displacement * cosA) / aspect, uv[1] + displacement * sinA]
    }
    const goldenSine = (uv: [number, number], aspect: number, angle: number, frequency: number, strength: number, t: number): [number, number] => {
        const phase = phaseOf(uv, aspect, angle, frequency, t)
        return applyOf(uv, aspect, angle, strength, Math.sin(phase))
    }
    const goldenTriangle = (uv: [number, number], aspect: number, angle: number, frequency: number, strength: number, t: number): [number, number] => {
        const phase = phaseOf(uv, aspect, angle, frequency, t)
        const np = phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2)) // fract
        const wave = Math.abs(np * 2 - 1) * 2 - 1
        return applyOf(uv, aspect, angle, strength, wave)
    }

    const cases: {uv: [number, number]; aspect: number; angle: number; frequency: number; strength: number; t: number}[] = [
        {uv: [0.8, 0.2], aspect: 800 / 600, angle: 0, frequency: 1, strength: 0.3, t: 0.25},
        {uv: [0.1, 0.9], aspect: 1.0, angle: 90, frequency: 3, strength: 0.5, t: 1.5},
        {uv: [0.6, 0.4], aspect: 16 / 9, angle: 200, frequency: 2, strength: 0.8, t: -0.7},
    ]

    it('waveDistortSine reproduces the original displacement', () => {
        for (const c of cases) {
            const out = waveDistortSine(d.vec2f(c.uv[0], c.uv[1]), c.aspect, c.angle, c.frequency, c.strength, c.t) as {x: number; y: number}
            const [ex, ey] = goldenSine(c.uv, c.aspect, c.angle, c.frequency, c.strength, c.t)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })

    it('waveDistortTriangle reproduces the original displacement', () => {
        for (const c of cases) {
            const out = waveDistortTriangle(d.vec2f(c.uv[0], c.uv[1]), c.aspect, c.angle, c.frequency, c.strength, c.t) as {x: number; y: number}
            const [ex, ey] = goldenTriangle(c.uv, c.aspect, c.angle, c.frequency, c.strength, c.t)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})
