import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import CornerPin from '@coreroot/shaders/CornerPin/index'
import {cornerPinSample, cornerSideOf} from '@coreroot/gpu/kit/warpMaps'

/**
 * CornerPin port gate (Phase D2-C). Projective homography (Heckbert) + convexify + front-clip,
 * compileTime edges. Resolve+snapshot both paths; CPU golden the homography at identity + a warped
 * convex quad (front should gate coverage).
 */
function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) { return buffer })}
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

const CP = CornerPin as GpuShaderDefinition

describe('CornerPin (a) analytic UV fold over a generator', () => {
    it('folds cornerPinSample into the generator sample coordinate (inline, no RTT)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'cp', def: CP, parentId: 'root', props: {edges: 'stretch'}, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'cp', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/cornerPinSample/)
        expect(finalWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('cornerpin-uvremap')
    })
})

describe('CornerPin (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the projected coord, front-clips, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'cp', def: CP, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'cp', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/cornerPinSample/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('cornerpin-fragment')
    })
})

describe('CornerPin (c) CPU golden — homography', () => {
    // ORIGINAL pinnedSample math transcribed by hand. Corners here are the TRANSFORMED props
    // (transformPosition stores (x, 1-y)); the body recovers y with (1 - c.y).
    const safeDiv = (n: number, dv: number) => n / (Math.abs(dv) < 1e-8 ? 1e-8 : dv)
    const sideOf = (p: number[], a: number[], b: number[]) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    const step = (e: number, x: number) => (x >= e ? 1 : 0)
    const insideTri = (p: number[], a: number[], b: number[], c: number[]) => {
        const d1 = sideOf(p, a, b), d2 = sideOf(p, b, c), d3 = sideOf(p, c, a)
        return step(0, d1) * step(0, d2) * step(0, d3) + step(d1, 0) * step(d2, 0) * step(d3, 0)
    }
    const projectToDiagonal = (p: number[], a: number[], b: number[], refSide: number) => {
        const ab = [b[0] - a[0], b[1] - a[1]]
        const t = Math.min(Math.max((( p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / Math.max(ab[0] * ab[0] + ab[1] * ab[1], 1e-8), 0), 1)
        const foot = [a[0] + ab[0] * t, a[1] + ab[1] * t]
        const len = Math.max(Math.hypot(ab[0], ab[1]), 1e-8)
        const perp = [-ab[1] / len, ab[0] / len]
        const nudge = Math.sign(refSide) * -1 * 0.004
        return [foot[0] + perp[0] * nudge, foot[1] + perp[1] * nudge]
    }
    const convexify = (p: number[], a: number[], b: number[], o: number[]) => {
        const inside = insideTri(p, a, b, o) > 0.5
        return inside ? projectToDiagonal(p, a, b, sideOf(o, a, b)) : p
    }
    const mix2 = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    const golden = (coord: number[], amount: number, c: number[][]): {su: number; sv: number; front: number} => {
        const r0 = mix2([0, 0], [c[0][0], 1 - c[0][1]], amount)
        const r1 = mix2([1, 0], [c[1][0], 1 - c[1][1]], amount)
        const r2 = mix2([1, 1], [c[2][0], 1 - c[2][1]], amount)
        const r3 = mix2([0, 1], [c[3][0], 1 - c[3][1]], amount)
        const q0 = convexify(r0, r1, r3, r2)
        const q1 = convexify(r1, r0, r2, r3)
        const q2 = convexify(r2, r1, r3, r0)
        const q3 = convexify(r3, r0, r2, r1)
        const dx1 = q1[0] - q2[0], dx2 = q3[0] - q2[0], dx3 = q0[0] - q1[0] + q2[0] - q3[0]
        const dy1 = q1[1] - q2[1], dy2 = q3[1] - q2[1], dy3 = q0[1] - q1[1] + q2[1] - q3[1]
        const denA = dx1 * dy2 - dx2 * dy1
        const a13 = safeDiv(dx3 * dy2 - dx2 * dy3, denA)
        const a23 = safeDiv(dx1 * dy3 - dx3 * dy1, denA)
        const a11 = q1[0] - q0[0] + a13 * q1[0], a21 = q3[0] - q0[0] + a23 * q3[0], a31 = q0[0]
        const a12 = q1[1] - q0[1] + a13 * q1[1], a22 = q3[1] - q0[1] + a23 * q3[1], a32 = q0[1]
        const c00 = a22 - a32 * a23, c10 = -(a21 - a31 * a23), c20 = a21 * a32 - a31 * a22
        const c01 = -(a12 - a32 * a13), c11 = a11 - a31 * a13, c21 = -(a11 * a32 - a31 * a12)
        const c02 = a12 * a23 - a22 * a13, c12 = -(a11 * a23 - a21 * a13), c22 = a11 * a22 - a21 * a12
        const px = coord[0], py = coord[1]
        const den = c02 * px + c12 * py + c22
        const su = safeDiv(c00 * px + c10 * py + c20, den)
        const sv = safeDiv(c01 * px + c11 * py + c21, den)
        const det = a11 * c00 + a21 * c01 + a31 * c02
        return {su, sv, front: step(0, den * det)}
    }

    // Corners are the TRANSFORMED props: identity = topLeft(0,1) topRight(1,1) bottomRight(1,0) bottomLeft(0,0).
    const identityCorners = [[0, 1], [1, 1], [1, 0], [0, 0]]
    // A warped-but-convex quad (transformed props).
    const warpCorners = [[0.1, 0.85], [0.95, 0.9], [0.9, 0.05], [0.05, 0.15]]

    const cases: {coord: number[]; amount: number; corners: number[][]}[] = [
        {coord: [0.5, 0.5], amount: 1, corners: identityCorners},
        {coord: [0.25, 0.75], amount: 1, corners: identityCorners},
        {coord: [0.4, 0.6], amount: 1, corners: warpCorners},
        {coord: [0.7, 0.3], amount: 0.5, corners: warpCorners},
    ]

    it('cornerPinSample reproduces the original projection + front gate', () => {
        for (const cse of cases) {
            const [c0, c1, c2, c3] = cse.corners
            const out = cornerPinSample(
                d.vec2f(cse.coord[0], cse.coord[1]), cse.amount,
                d.vec2f(c0[0], c0[1]), d.vec2f(c1[0], c1[1]), d.vec2f(c2[0], c2[1]), d.vec2f(c3[0], c3[1]),
            ) as {x: number; y: number; z: number}
            const ex = golden(cse.coord, cse.amount, cse.corners)
            expect(out.x).toBeCloseTo(ex.su, 4)
            expect(out.y).toBeCloseTo(ex.sv, 4)
            expect(out.z).toBe(ex.front)
        }
    })

    it('identity quad maps a coord to itself (front = 1)', () => {
        const out = cornerPinSample(d.vec2f(0.3, 0.8), 1, d.vec2f(0, 1), d.vec2f(1, 1), d.vec2f(1, 0), d.vec2f(0, 0)) as {x: number; y: number; z: number}
        expect(out.x).toBeCloseTo(0.3, 4)
        expect(out.y).toBeCloseTo(0.8, 4)
        expect(out.z).toBe(1)
    })

    it('cornerSideOf is a pure signed-area term', () => {
        const s = cornerSideOf(d.vec2f(0, 0), d.vec2f(1, 0), d.vec2f(0, 1)) as number
        expect(s).toBeCloseTo(sideOf([0, 0], [1, 0], [0, 1]), 6)
    })
})
