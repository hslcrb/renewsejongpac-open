import {describe, it, expect, vi} from 'vitest'
import {tgpu, d, std, edges, blend} from '@coreroot/gpu/kit'
import {createUniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call, vec4, mixExpr, ZERO} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import {uvRemapShader, selectMap, lerpToIdentity} from '@coreroot/gpu/scaffolds/uvRemapShader'
import {transformEdges, transformPosition} from '@coreroot/utilities/transformations'

/**
 * `uvRemapShader` scaffold gate (Phase 3).
 *
 * This is the test that makes the phase's Gate A claim CHECKABLE rather than asserted (PRIMITIVES.md
 * C8): for each shape the scaffold supports, a HAND-WRITTEN definition and a scaffolded one are
 * composed side by side and their resolved WGSL compared for equality. The per-shader snapshot tests
 * prove the 17 migrations individually; this proves the scaffold itself, including the option
 * combinations no single shader exercises, and it keeps proving it if the scaffold is ever edited.
 *
 * Both GPU paths are covered per case:
 *   (a) analytic UV fold — default metadata, the composer folds `uvRemap` into a combined UV.
 *   (b) RTT filter       — opacity < 1 forces the fallback, so `fragment` runs.
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

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
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

function buildRegistry(specs: NodeSpec[]): RegistryView {
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
    return {
        rootId: specs.find((s) => s.parentId === null)!.id,
        getNode: (id) => nodes.get(id),
        getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: () => null,
        store,
    }
}

/**
 * Resolve one distortion over a generator. `opacity: 0.5` is the analytic-fallback trigger that
 * forces the `fragment` path; without it the composer takes the `uvRemap` fold. Both are named
 * `'D'` so the two definitions under comparison produce identical uniform accessor paths.
 */
function resolveDistortion(def: GpuShaderDefinition, props: Record<string, unknown>, forceFragment: boolean): string {
    const registry = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'd', def, parentId: 'root', props, metadata: forceFragment ? {renderOrder: 0, opacity: 0.5} : {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'd', metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

const EDGE_MODES = ['stretch', 'transparent', 'mirror', 'wrap']

/** Assert the scaffolded definition emits byte-identical WGSL to the hand-written one. */
function expectIdentical(hand: GpuShaderDefinition, scaffolded: GpuShaderDefinition, props: Record<string, unknown> = {}) {
    for (const forceFragment of [false, true]) {
        expect(resolveDistortion(scaffolded, props, forceFragment)).toBe(resolveDistortion(hand, props, forceFragment))
    }
}

// ── the shared prop block + mapping bodies the cases below reuse ──────────────────────────────

const edgesProp = {
    default: 'stretch',
    transform: transformEdges,
    compileTime: true,
    ui: {type: 'select' as const, options: EDGE_MODES.map((v) => ({label: v, value: v})), label: 'Edges', group: 'Effect'},
}
const centerProp = {default: {x: 0.5, y: 0.5}, transform: transformPosition, ui: {type: 'position' as const, label: 'Center', group: 'Position'}}

/** A plain coordinate map (the Twirl/Bulge shape). */
export const testWarpUV = tgpu.fn([d.vec2f, d.f32, d.vec2f, d.f32], d.vec2f)((center, amount, uv, aspect) => {
    'use gpu'
    const delta = uv.sub(center)
    return d.vec2f(uv.x + delta.y * amount / aspect, uv.y + delta.x * amount)
})

/** A map that also produces coverage, packed as vec3 (the CornerPin shape). */
export const testGatedUV = tgpu.fn([d.vec2f, d.f32], d.vec3f)((uv, amount) => {
    'use gpu'
    const shifted = uv.add(d.vec2f(amount, amount))
    return d.vec3f(shifted.x, shifted.y, std.step(0.0, shifted.x))
})

/** A hard 0/1 selector plus a reflected coordinate, packed as vec3 (the Mirror shape). */
export const testReflectUV = tgpu.fn([d.vec2f, d.f32], d.vec3f)((uv, angle) => {
    'use gpu'
    const reflected = d.vec2f(uv.x * std.cos(angle), 1.0 - uv.y)
    return d.vec3f(reflected.x, reflected.y, std.step(0.5, uv.x))
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (1) The base shape: plain map + `edges` prop — must equal the hand-written pair exactly
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('uvRemapShader (1) factory output equals the hand-written original', () => {
    const props = {center: centerProp, amount: {default: 0.3}, edges: edgesProp} as never

    const Hand: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        fragment: ({uniforms, childNode, ctx, propValues, convertToTexture}: GpuFragmentParams): Expr => {
            if (!childNode) {
                console.error('needs a child')
                return ZERO
            }
            const texture = convertToTexture(childNode)
            const edgeMode = (propValues.edges as number) ?? 0
            const warped = call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, ctx.uv, ctx.aspect])
            const sampled = edges.sampleRemappedExpr(texture, warped, edgeMode)
            return call(blend.unpremultiplyAlpha, 'unpremultiplyAlpha', [sampled])
        },
        uvRemap: ({uv, mask, uniforms, aspect, propValues}) => {
            const edgeMode = (propValues.edges as number) ?? 0
            const warped = call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect])
            return edges.composeEdgeRemapExpr(warped, mask, edgeMode)
        },
    }

    const Scaffolded: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        ...uvRemapShader(
            ({uniforms}) => ({
                map: (uv, aspect) => call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect]),
            }),
            {requireChildMessage: 'needs a child'},
        ),
    }

    it.each(EDGE_MODES)('emits identical WGSL on both paths — edges: %s', (mode) => {
        expectIdentical(Hand, Scaffolded, {edges: mode})
    })

    it('logs the require-child message and returns transparent black with no child', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(Scaffolded.fragment({childNode: undefined} as never)).toBe(ZERO)
        expect(spy).toHaveBeenCalledWith('needs a child')
        spy.mockRestore()
    })

    it('stays silent with no child when no message is configured', () => {
        const silent = uvRemapShader(() => ({map: (uv) => uv}))
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(silent.fragment!({childNode: undefined} as never)).toBe(ZERO)
        expect(spy).not.toHaveBeenCalled()
        spy.mockRestore()
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (2) `edges: 'none'` — the Flip shape: sample straight, pass the mask through
// ═══════════════════════════════════════════════════════════════════════════════════════
describe("uvRemapShader (2) edges: 'none'", () => {
    const props = {center: centerProp, amount: {default: 0.3}} as never

    const Hand: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        fragment: ({uniforms, childNode, ctx, convertToTexture}: GpuFragmentParams): Expr => {
            if (!childNode) return ZERO
            const texture = convertToTexture(childNode)
            const warped = call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, ctx.uv, ctx.aspect])
            return call(blend.unpremultiplyAlpha, 'unpremultiplyAlpha', [texture.sample(warped)])
        },
        uvRemap: ({uv, mask, uniforms, aspect}) => ({
            uv: call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect]),
            mask,
        }),
    }

    const Scaffolded: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        ...uvRemapShader(
            ({uniforms}) => ({
                map: (uv, aspect) => call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect]),
            }),
            {edges: 'none'},
        ),
    }

    it('emits identical WGSL on both paths, with no edge fn at all', () => {
        expectIdentical(Hand, Scaffolded)
        const wgsl = resolveDistortion(Scaffolded, {}, true)
        expect(wgsl).not.toMatch(/edgeClampUV|edgeMirrorUV|edgeWrapUV|edgeTransparentMask/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (3) A fixed edge mode + bilinear resample — the SliceWipe shape
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('uvRemapShader (3) fixed edge mode + bilinear resample', () => {
    const props = {center: centerProp, amount: {default: 0.3}} as never

    const Hand: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        fragment: ({uniforms, childNode, ctx, convertToTexture}: GpuFragmentParams): Expr => {
            if (!childNode) return ZERO
            const texture = convertToTexture(childNode)
            const warped = call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, ctx.uv, ctx.aspect])
            const sampled = edges.applyEdgeHandlingExpr(warped, (uv) => texture.sample(uv), 1)
            return call(blend.unpremultiplyAlpha, 'unpremultiplyAlpha', [sampled])
        },
        uvRemap: ({uv, mask, uniforms, aspect}) => {
            const warped = call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect])
            return edges.composeEdgeRemapExpr(warped, mask, 1)
        },
    }

    const Scaffolded: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        ...uvRemapShader(
            ({uniforms}) => ({
                map: (uv, aspect) => call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect]),
            }),
            {edges: 1, resample: 'bilinear'},
        ),
    }

    it('emits identical WGSL on both paths', () => {
        expectIdentical(Hand, Scaffolded)
    })

    it('bakes transparent regardless of any edges prop value', () => {
        expect(resolveDistortion(Scaffolded, {}, true)).toMatch(/edgeTransparentMask/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (4) Coverage from a packed map — the CornerPin shape
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('uvRemapShader (4) coverage', () => {
    const props = {amount: {default: 0.3}, edges: edgesProp} as never

    const Hand: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        fragment: ({uniforms, childNode, ctx, propValues, convertToTexture}: GpuFragmentParams): Expr => {
            if (!childNode) return ZERO
            const texture = convertToTexture(childNode)
            const edgeMode = (propValues.edges as number) ?? 0
            const packed = call(testGatedUV, 'testGatedUV', [ctx.uv, uniforms.amount])
            const front = packed.member('z')
            const edged = edges.sampleRemappedExpr(texture, packed.member('xy'), edgeMode)
            return call(blend.unpremultiplyAlpha, 'unpremultiplyAlpha', [vec4(edged.member('rgb'), edged.member('a').mul(front))])
        },
        uvRemap: ({uv, mask, uniforms, propValues}) => {
            const edgeMode = (propValues.edges as number) ?? 0
            const packed = call(testGatedUV, 'testGatedUV', [uv, uniforms.amount])
            const composed = edges.composeEdgeRemapExpr(packed.member('xy'), mask, edgeMode)
            return {uv: composed.uv, mask: composed.mask.mul(packed.member('z'))}
        },
    }

    const Scaffolded: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        ...uvRemapShader(({uniforms}) => ({
            map: (uv) => {
                const packed = call(testGatedUV, 'testGatedUV', [uv, uniforms.amount])
                return {uv: packed.member('xy'), coverage: packed.member('z')}
            },
        })),
    }

    it.each(EDGE_MODES)('emits identical WGSL on both paths — edges: %s', (mode) => {
        expectIdentical(Hand, Scaffolded, {edges: mode})
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (5) `lerpToIdentity` — the PolarCoordinates shape
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('uvRemapShader (5) lerpToIdentity', () => {
    const props = {center: centerProp, amount: {default: 0.3}, intensity: {default: 1}, edges: edgesProp} as never

    const Hand: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        fragment: ({uniforms, childNode, ctx, propValues, convertToTexture}: GpuFragmentParams): Expr => {
            if (!childNode) return ZERO
            const texture = convertToTexture(childNode)
            const edgeMode = (propValues.edges as number) ?? 0
            const warped = call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, ctx.uv, ctx.aspect])
            const blended = mixExpr(ctx.uv, warped, uniforms.intensity)
            const sampled = edges.sampleRemappedExpr(texture, blended, edgeMode)
            return call(blend.unpremultiplyAlpha, 'unpremultiplyAlpha', [sampled])
        },
        uvRemap: ({uv, mask, uniforms, aspect, propValues}) => {
            const edgeMode = (propValues.edges as number) ?? 0
            const warped = call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect])
            return edges.composeEdgeRemapExpr(mixExpr(uv, warped, uniforms.intensity), mask, edgeMode)
        },
    }

    const Scaffolded: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        ...uvRemapShader(({uniforms}) =>
            lerpToIdentity(
                {map: (uv, aspect) => call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect])},
                () => uniforms.intensity,
            ),
        ),
    }

    it.each(EDGE_MODES)('emits identical WGSL on both paths — edges: %s', (mode) => {
        expectIdentical(Hand, Scaffolded, {edges: mode})
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (6) `selectMap` — the Mirror shape. NOTE this is the one case that is deliberately NOT
//     equal to the old hand-written fragment (which sampled twice and mixed colors). What
//     the test pins is that BOTH hooks now emit the coordinate-select form.
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('uvRemapShader (6) selectMap', () => {
    const props = {angle: {default: 0.5}, edges: edgesProp} as never

    const Scaffolded: GpuShaderDefinition = {
        name: 'D',
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props,
        ...uvRemapShader(({uniforms}) => {
            const reflect = (uv: Expr): Expr => call(testReflectUV, 'testReflectUV', [uv, uniforms.angle])
            return selectMap((uv) => uv, (uv) => reflect(uv).member('xy'), (uv) => reflect(uv).member('z'))
        }),
    }

    it('takes exactly ONE sample of the child on the fragment path', () => {
        const wgsl = resolveDistortion(Scaffolded, {edges: 'mirror'}, true)
        expect(wgsl.match(/textureSample\(rtt_/g)).toHaveLength(1)
    })

    it('emits the same coordinate-select expression on both paths', () => {
        const select = /mix\(uv, \(testReflectUV\([^)]*\)\)\.xy, \(testReflectUV\([^)]*\)\)\.z\)/
        expect(resolveDistortion(Scaffolded, {edges: 'mirror'}, true)).toMatch(select)
        expect(resolveDistortion(Scaffolded, {edges: 'mirror'}, false)).toMatch(select)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (7) `uvRemapIdentityWhen` — the GridDistortion/Liquify shape
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('uvRemapShader (7) uvRemapIdentityWhen', () => {
    const hooks = uvRemapShader(
        ({uniforms}) => ({map: (uv, aspect) => call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect])}),
        {uvRemapIdentityWhen: ({computeOutputs}) => !computeOutputs?.displacement},
    )

    const ctx = (computeOutputs?: Record<string, never>) => ({
        uv: call(genBody, 'uvIn', []),
        mask: call(genBody, 'maskIn', []),
        uniforms: {},
        propValues: {},
        props: call(genBody, 'props', []),
        aspect: call(genBody, 'aspect', []),
        onBeforeRender: () => {},
        computeOutputs,
    })

    it('returns the incoming uv and mask verbatim when the condition holds', () => {
        const c = ctx()
        const out = hooks.uvRemap!(c as never)
        expect(out.uv).toBe(c.uv)
        expect(out.mask).toBe(c.mask)
    })

    it('runs the map when the condition does not hold', () => {
        const c = ctx({displacement: {} as never})
        const out = hooks.uvRemap!(c as never)
        expect(out.uv).not.toBe(c.uv)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (8) Two differently-configured instances in ONE tree must not collide (PRIMITIVES.md C3)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('uvRemapShader (8) two configurations in one tree', () => {
    const base = {center: centerProp, amount: {default: 0.3}, edges: edgesProp} as never
    const mk = (name: string, edgeOpt: Parameters<typeof uvRemapShader>[1]): GpuShaderDefinition => ({
        name,
        requiresRTT: true,
        requiresChild: true,
        boundingBoxDeclaration: {aspectRatio: null},
        props: base,
        ...uvRemapShader(
            ({uniforms}) => ({map: (uv, aspect) => call(testWarpUV, 'testWarpUV', [uniforms.center, uniforms.amount, uv, aspect])}),
            edgeOpt,
        ),
    })

    it('resolves a stretch-mode instance nested under a fixed-transparent instance', () => {
        const registry = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'outer', def: mk('Outer', {edges: 1, resample: 'bilinear'}), parentId: 'root', metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'inner', def: mk('Inner', undefined), parentId: 'outer', props: {edges: 'mirror'}, metadata: {renderOrder: 0, opacity: 0.5}},
            {id: 'gen', def: Generator, parentId: 'inner', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const wgsl = [ir.finalPass, ...ir.rttPasses.map((p) => p.fragment)].map((p) => tgpu.resolve([p.entry], {names: 'strict'})).join('\n')
        // Both configurations are present, each with its own edge handling, and the shared mapping fn
        // is declared once — no `testWarpUV_1` duplicate, no name collision.
        expect(wgsl).toMatch(/edgeTransparentMask/)
        expect(wgsl).toMatch(/edgeMirrorUV/)
        expect(wgsl).not.toMatch(/testWarpUV_\d/)
    })
})
