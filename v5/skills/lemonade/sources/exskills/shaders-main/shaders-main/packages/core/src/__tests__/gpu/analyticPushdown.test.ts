/**
 * Analytic UV PUSH-DOWN gate. GPU-free: mocked store root, real composer WGSL.
 *
 * A UV remap commutes with pointwise compositing, so a distortion over N pointwise children can
 * evaluate each child AT the remapped coordinate instead of rasterising the composed children into
 * an RTT and re-sampling that. These tests pin the two things that matter: WHICH trees take the
 * push-down (rttPasses === 0) and that the emitted fold stays linear in tree size — the fold is
 * hoisted into one local, and each generator body appears once per node, not once per read.
 *
 * The counterpart is what must NOT take it: anything non-pointwise in screen space (a mask source,
 * a Group box that resamples its content) has to keep falling back to the RTT path.
 */
import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Bulge from '@coreroot/shaders/Bulge/index'
import GroupDef from '@coreroot/shaders/Group/index'
import Twirl from '@coreroot/shaders/Twirl/index'

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
// A generator with a CLIP box (Text-like: propBindings decl, no resample)
const ClipGenerator: GpuShaderDefinition = {
    ...Generator,
    name: 'ClipGenerator',
    boundingBoxDeclaration: {aspectRatio: null},
}
// A generator with a RESIZE-FIT box (ImageTexture-like)
const FitGenerator: GpuShaderDefinition = {
    ...Generator,
    name: 'FitGenerator',
    boundingBoxDeclaration: {aspectRatio: null, supportsResizeFit: true},
}
const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(genBody, 'genBody', []),
}
// An RTT filter — never analytically foldable, so a distortion over one lands on the chain path's
// composite terminus.
const RttFilter: GpuShaderDefinition = {
    name: 'RttFilter',
    requiresRTT: true,
    requiresChild: true,
    props: {} as never,
    fragment: ({childNode, ctx, convertToTexture}: GpuFragmentParams): Expr =>
        convertToTexture(childNode ?? call(genBody, 'genBody', [])).sample(ctx.uv),
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

const UV = (value: number) => ({value, unit: 'uv' as const})
const IDENTITY_BOX = {x: UV(0), y: UV(0), width: UV(1), height: UV(1), origin: 'center' as const, rotation: 0}
const REAL_BOX = {x: UV(0.3), y: UV(0.3), width: UV(0.37), height: UV(0.33), origin: 'top-left' as const, rotation: 0}

function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore} {
    const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const props = {...defaultsFor(s.def), ...(s.props ?? {})}
        const propFields = bridgeFieldInits(s.def, props, s.id)
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        const bb = s.metadata?.boundingBox as {width?: {value: number}} | undefined
        // Mirror the renderer: only a NON-identity box allocates _bbox_* fields.
        if (bb && s.def.boundingBoxDeclaration && bb !== (IDENTITY_BOX as never)) {
            for (const k of ['centerX', 'centerY', 'halfWidth', 'halfHeight', 'cornerRadius', 'rotation', 'aspectRatio']) {
                synthetic.push({name: `_bbox_${k}`, schema: d.f32, initial: 0.5})
            }
        }
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
    return {
        registry: {
            rootId: root.id,
            getNode: (id) => nodes.get(id),
            getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
            resolveCustomId: () => null,
            store,
        },
        store,
    }
}

const B = Bulge as GpuShaderDefinition
const G = GroupDef as GpuShaderDefinition
const T = Twirl as GpuShaderDefinition

/** Count CALL sites of a resolved fn (the `fn name(` definition line does not count). */
const calls = (wgsl: string, name: string): number =>
    (wgsl.match(new RegExp(`(?<!fn )\\b${name}\\(`, 'g')) ?? []).length

describe('analytic push-down', () => {
    it("the reported tree — Group[identity bbox] > Bulge > 4 leaves — needs NO RTT", () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'group', def: G, parentId: 'root', metadata: {renderOrder: 0, boundingBox: IDENTITY_BOX as never}},
            {id: 'bulge', def: B, parentId: 'group', metadata: {renderOrder: 0}},
            {id: 't1', def: Generator, parentId: 'bulge', metadata: {renderOrder: 0}},
            {id: 't2', def: ClipGenerator, parentId: 'bulge', metadata: {renderOrder: 1, boundingBox: REAL_BOX as never}},
            {id: 't3', def: Generator, parentId: 'bulge', metadata: {renderOrder: 2}},
            {id: 'img', def: FitGenerator, parentId: 'bulge', metadata: {renderOrder: 3, boundingBox: REAL_BOX as never}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // One hoisted fold, four generator evaluations at it, clip + box mapping in folded space.
        expect(calls(wgsl, 'bulgeUV')).toBe(1)
        expect(calls(wgsl, 'genBody')).toBe(4)
        expect(wgsl).toMatch(/bboxClipMask/)
        expect(wgsl).toMatch(/bboxGenUVContext/)
        expect(wgsl).not.toMatch(/textureSample/)
    })

    it('per-child opacity and blend mode stay eligible', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bulge', def: B, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'a', def: Generator, parentId: 'bulge', metadata: {renderOrder: 0}},
            {id: 'b', def: Generator, parentId: 'bulge', metadata: {renderOrder: 1, opacity: 0.5, blendMode: 'screen'}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/blend_screen/)
    })

    it('a nested distortion chain folds through to the leaves', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bulge', def: B, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'twirl', def: T, parentId: 'bulge', metadata: {renderOrder: 0}},
            {id: 'a', def: Generator, parentId: 'twirl', metadata: {renderOrder: 0}},
            {id: 'b', def: Generator, parentId: 'twirl', metadata: {renderOrder: 1}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(calls(wgsl, 'bulgeUV')).toBe(1)
        expect(calls(wgsl, 'twirlUV')).toBe(1)
        expect(calls(wgsl, 'genBody')).toBe(2)
    })

    it('an ineligible child (masked) still falls back to the RTT path', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bulge', def: B, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'a', def: Generator, parentId: 'bulge', metadata: {renderOrder: 0}},
            {id: 'b', def: Generator, parentId: 'bulge', metadata: {renderOrder: 1, mask: {source: 'nope', type: 'alpha'} as never}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
    })

    it('a Group child (resampling box) is ineligible → RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bulge', def: B, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'a', def: Generator, parentId: 'bulge', metadata: {renderOrder: 0}},
            {id: 'g', def: G, parentId: 'bulge', metadata: {renderOrder: 1, boundingBox: REAL_BOX as never}},
            {id: 'ga', def: Generator, parentId: 'g', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBeGreaterThan(0)
    })

    it('an intermediate distortion carrying a box falls back rather than dropping the clip', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'bulge', def: B, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'twirl', def: T, parentId: 'bulge', metadata: {renderOrder: 0, boundingBox: REAL_BOX as never}},
            {id: 'a', def: Generator, parentId: 'twirl', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBeGreaterThan(0)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// The nested chain's composite terminus must still honour its child's opacity / blend
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('nested chain — composite terminus', () => {
    // A distortion over a single child that CANNOT fold analytically (here a nested filter) takes
    // the chain path's composite terminus, which calls composeNode directly and so bypasses the
    // sibling loop that would normally apply the child's opacity and blend mode. Without applying
    // them at the RTT boundary the child's opacity slider does nothing at all.
    const chainWithFilterChild = (opacity: number) =>
        composeNodeTree(
            buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'bulge', def: B, parentId: 'root', metadata: {renderOrder: 0}},
                {id: 'flt', def: RttFilter, parentId: 'bulge', metadata: {renderOrder: 0, opacity}},
                {id: 'a', def: Generator, parentId: 'flt', metadata: {renderOrder: 0}},
            ]).registry,
        )

    it("reads the terminus child's _opacity", () => {
        const ir = chainWithFilterChild(0.5)
        // The terminus is RTT'd and sampled at the folded coordinate…
        expect(ir.rttPasses.length).toBeGreaterThan(0)
        const all = [...ir.rttPasses.map((p) => p.fragment.entry), ir.finalPass.entry]
        const wgsl = all.map((e) => tgpu.resolve([e], {names: 'strict'})).join('\n')
        // …and its own opacity is baked into that RTT input.
        expect(wgsl).toMatch(/n_flt\._opacity/)
    })

    it("applies the terminus child's blend mode", () => {
        const ir = composeNodeTree(
            buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'bulge', def: B, parentId: 'root', metadata: {renderOrder: 0}},
                {id: 'flt', def: RttFilter, parentId: 'bulge', metadata: {renderOrder: 0, blendMode: 'multiply'}},
                {id: 'a', def: Generator, parentId: 'flt', metadata: {renderOrder: 0}},
            ]).registry,
        )
        const all = [...ir.rttPasses.map((p) => p.fragment.entry), ir.finalPass.entry]
        const wgsl = all.map((e) => tgpu.resolve([e], {names: 'strict'})).join('\n')
        expect(wgsl).toMatch(/blend_multiply/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// Identity bounding boxes emit nothing
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('identity bounding box', () => {
    const groupWithBox = (boundingBox: unknown) =>
        composeNodeTree(
            buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'grp', def: G, parentId: 'root', metadata: {renderOrder: 0, boundingBox: boundingBox as never}},
                {id: 'a', def: Generator, parentId: 'grp', metadata: {renderOrder: 0}},
            ]).registry,
        )

    it("a full-frame box (e.g. {origin:'center'}) costs no RTT resample", () => {
        expect(groupWithBox(IDENTITY_BOX).rttPasses.length).toBe(0)
    })

    it('a real box still resamples through the box', () => {
        expect(groupWithBox(REAL_BOX).rttPasses.length).toBe(1)
    })
})
