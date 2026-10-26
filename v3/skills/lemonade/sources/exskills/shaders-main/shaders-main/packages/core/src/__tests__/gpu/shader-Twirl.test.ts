import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Twirl from '@coreroot/shaders/Twirl/index'
import {twirlUV} from '@coreroot/gpu/kit/warpMaps'

/**
 * Twirl port gate (Phase C2 — the reference port). GPU-free: the uniform store's root is mocked
 * (composer.test.ts pattern), the composer builds the real raw-WGSL fragment entries, and we
 * `tgpu.resolve` each pass to a WGSL string and snapshot it (§8.1 layer 2). Plus a CPU golden
 * value: the ported `twirlUV` fn (a DualFn → runs as plain JS off-GPU) is checked against the
 * ORIGINAL TSL formula, computed by hand, at a couple of (uv, intensity) points (§8.1 layer 3).
 *
 * Two composition shapes exercise BOTH of Twirl's GPU-code paths:
 *   (a) analytic UV fold  — Twirl over a generator with default metadata → the composer folds
 *       Twirl.uvRemap into a combined UV and samples the RTT'd content once (the smoke path).
 *   (b) RTT filter        — Twirl with opacity < 1 (an analytic fallback trigger) → the composer
 *       calls Twirl.fragment with the composed child, which convertToTexture + samples + edges +
 *       unpremultiplies.
 */

// ── mock root (real bindGroupLayout, mocked buffer/bindGroup — enough for resolve) ────────────
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

// A minimal generator: the content beneath Twirl (the RTT'd "photo"). Not acceptsUVContext, so
// Twirl uses the composite-terminus branch of the analytic path — exactly the smoke spec shape.
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

/** Build FieldInits from a definition + props via the REAL bridge (three-free, vitest-safe). */
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

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) Analytic UV fold — the smoke path (Twirl > Generator, default metadata)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Twirl (a) analytic UV fold over composed content', () => {
    it('RTTs the content and folds Twirl.uvRemap into the sample coordinate', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'tw', def: Twirl as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'tw', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        // The content beneath is RTT'd once (composite terminus); the final pass samples it.
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        // Twirl's twist fn is present; edges default (stretch) → edgeClampUV; content sampled.
        expect(finalWgsl).toMatch(/twirlUV/)
        expect(finalWgsl).toMatch(/edgeClampUV/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        // The RTT pass renders the generator content (no twist inside).
        expect(rttWgsl).toMatch(/genBody/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
        expect(rttWgsl).toMatchSnapshot('rtt-pass')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) RTT filter — Twirl.fragment (forced by an analytic fallback trigger: opacity < 1)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Twirl (b) RTT filter path (fragment)', () => {
    it('converts the child to a texture, samples the twist, unpremultiplies', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'tw', def: Twirl as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'tw', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/twirlUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (c) Compile-time edge branching — propValues.edges drives which WGSL is emitted
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Twirl (c) compile-time edge modes', () => {
    const resolveWithEdges = (edges: string): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'tw', def: Twirl as GpuShaderDefinition, parentId: 'root', props: {edges}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'tw', metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('mirror emits edgeMirrorUV, wrap emits edgeWrapUV, transparent emits edgeTransparentMask', () => {
        expect(resolveWithEdges('mirror')).toMatch(/edgeMirrorUV/)
        expect(resolveWithEdges('wrap')).toMatch(/edgeWrapUV/)
        expect(resolveWithEdges('transparent')).toMatch(/edgeTransparentMask/)
        // stretch (default) uses neither mirror nor wrap.
        const stretch = resolveWithEdges('stretch')
        expect(stretch).not.toMatch(/edgeMirrorUV/)
        expect(stretch).not.toMatch(/edgeWrapUV/)
    })

    it('the edge mode is part of the structural (recompile) hash', () => {
        const build = (edges: string) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'tw', def: Twirl as GpuShaderDefinition, parentId: 'root', props: {edges}, metadata: {renderOrder: 0}},
                {id: 'gen', def: Generator, parentId: 'tw', metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('stretch')).not.toBe(build('mirror'))
        expect(build('stretch')).toMatch(/edges=0/)
        expect(build('mirror')).toMatch(/edges=2/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (d) CPU golden — the ported twirlUV vs the ORIGINAL TSL formula, computed by hand
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('Twirl (d) CPU golden — math equivalence with the original formula', () => {
    // The ORIGINAL twist, transcribed verbatim from the v1 fragmentNode / uvRemap:
    //   centerPos = (center.x, 1 - center.y)          // center is the transformed prop value
    //   delta     = uv - centerPos
    //   acd       = (delta.x * aspect, delta.y)
    //   angle     = intensity * length(acd)
    //   rotated   = rot(acd, angle)
    //   twisted   = (rotated.x / aspect + centerPos.x, rotated.y + centerPos.y)
    const golden = (center: [number, number], intensity: number, uv: [number, number], aspect: number): [number, number] => {
        const cx = center[0]
        const cy = 1 - center[1]
        const dx = uv[0] - cx
        const dy = uv[1] - cy
        const acx = dx * aspect
        const acy = dy
        const angle = intensity * Math.hypot(acx, acy)
        const cosA = Math.cos(angle)
        const sinA = Math.sin(angle)
        const rx = cosA * acx - sinA * acy
        const ry = sinA * acx + cosA * acy
        return [rx / aspect + cx, ry + cy]
    }

    const cases: {center: [number, number]; intensity: number; uv: [number, number]; aspect: number}[] = [
        {center: [0.5, 0.5], intensity: 1.0, uv: [0.8, 0.2], aspect: 800 / 600},
        {center: [0.5, 0.5], intensity: 3.0, uv: [0.1, 0.9], aspect: 1.0},
        {center: [0.25, 0.75], intensity: -2.0, uv: [0.6, 0.4], aspect: 16 / 9},
    ]

    it('twirlUV reproduces the original displacement at sampled points', () => {
        for (const c of cases) {
            const out = twirlUV(d.vec2f(c.center[0], c.center[1]), c.intensity, d.vec2f(c.uv[0], c.uv[1]), c.aspect) as {
                x: number
                y: number
            }
            const [ex, ey] = golden(c.center, c.intensity, c.uv, c.aspect)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })

    it('is identity at the center point (zero displacement)', () => {
        // At uv == centerPos, delta is 0, so angle is 0 and the point maps to itself.
        const center: [number, number] = [0.3, 0.7]
        const centerPos: [number, number] = [0.3, 1 - 0.7]
        const out = twirlUV(d.vec2f(center[0], center[1]), 5.0, d.vec2f(centerPos[0], centerPos[1]), 1.5) as {
            x: number
            y: number
        }
        expect(out.x).toBeCloseTo(centerPos[0], 6)
        expect(out.y).toBeCloseTo(centerPos[1], 6)
    })
})
