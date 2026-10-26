import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, expr, vec4, call} from '@coreroot/gpu/composer'
import {structuralHash} from '@coreroot/gpu/pipelineCache'
import type {
    GpuShaderDefinition,
    RegistryView,
    RegistryNode,
    GpuFragmentParams,
    Expr,
} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'

/**
 * B5a composer tests. GPU-free: the uniform store's root is mocked (as in uniformStore.test.ts),
 * the composer builds real bind-group layouts + raw-WGSL fragment entries, and we `tgpu.resolve`
 * each pass's entry to a WGSL string and snapshot it (§8.1 layer 2). Five synthetic registries
 * exercise the load-bearing composition semantics:
 *   (a) single generator, (b) two generators + multiply blend + opacity,
 *   (c) generator + RTT filter (requiresChild), (d) generator + mask reference,
 *   (e) a map driver override.
 */

// ── mock root (real bindGroupLayout, mocked buffer/bindGroup — enough for resolve) ────────
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

// ── synthetic shader bodies (tgpu.fns referenced by the fragment builders) ────────────────
const genBody = tgpu.fn([d.f32, d.vec2f], d.vec4f)((speed, uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, speed, 1.0)
})
const filterBody = tgpu.fn([d.vec4f, d.f32], d.vec4f)((child, amount) => {
    'use gpu'
    return d.vec4f(child.rgb.mul(amount), child.a)
})

// ── shader definitions ────────────────────────────────────────────────────────────────────
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {speed: {default: 1}} as never,
    fragment: ({uniforms, ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uniforms.speed, ctx.uv]),
}

const Filter: GpuShaderDefinition = {
    name: 'Filter',
    requiresRTT: true,
    requiresChild: true,
    props: {amount: {default: 0.5}} as never,
    fragment: ({uniforms, childNode, ctx, convertToTexture}: GpuFragmentParams): Expr => {
        // A realistic RTT filter: resample the composed child at (a transform of) the UV.
        const tex = convertToTexture(childNode ?? vec4(0, 0, 0, 0))
        return call(filterBody, 'filterBody', [tex.sample(ctx.uv), uniforms.amount])
    },
}

const MaskShape: GpuShaderDefinition = {
    name: 'MaskShape',
    props: {radius: {default: 0.3}} as never,
    fragment: ({uniforms, ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uniforms.radius, ctx.uv]),
}

// ── registry builder ──────────────────────────────────────────────────────────────────────
interface NodeSpec {
    id: string
    def: GpuShaderDefinition
    parentId: string | null
    metadata?: Partial<NodeMetadata>
    /** Extra synthetic store fields this node needs (e.g. _opacity, _map_*). */
    fields?: {name: string; initial: unknown}[]
    customId?: string
}

function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore} {
    const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const propFields = Object.entries(s.def.props).map(([name, cfg]) => ({
            name,
            initial: (cfg as {default: unknown}).default,
        }))
        const synthetic = [{name: '_opacity', initial: s.metadata?.opacity ?? 1}, ...(s.fields ?? [])]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.finalize()

    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    const customIdToId = new Map<string, string>()
    for (const s of specs) {
        const node: RegistryNode = {
            id: s.id,
            customId: s.customId,
            componentName: s.def.name,
            parentId: s.parentId,
            definition: s.def,
            metadata: {blendMode: 'normal', opacity: undefined, renderOrder: 0, ...s.metadata} as NodeMetadata,
            handles: handlesById[s.id],
        }
        nodes.set(s.id, node)
        if (s.customId) customIdToId.set(s.customId, s.id)
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
        resolveCustomId: (cid) => customIdToId.get(cid) ?? null,
        store,
    }
    return {registry, store}
}

// A minimal root container definition (holds children, passes composed through).
const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? expr('vec4f(0.0, 0.0, 0.0, 0.0)'),
}

function resolveFinal(registry: RegistryView, opts = {}): string {
    const ir = composeNodeTree(registry, opts)
    return tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
}

describe('composer (a) single generator', () => {
    it('emits a final pass that calls the generator body + tonemap/OETF tail', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'g1', def: Generator, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const wgsl = resolveFinal(registry)
        expect(wgsl).toMatch(/@fragment/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).toMatch(/uniforms\.n_g1\.speed/)
        expect(wgsl).toMatch(/linearToSrgb/)
        expect(wgsl).toMatchSnapshot()
    })
})

describe('composer (b) two generators + multiply blend + opacity', () => {
    it('folds siblings with the multiply blend fn and per-node opacity', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'g1', def: Generator, parentId: 'root', metadata: {renderOrder: 0}},
            {
                id: 'g2',
                def: Generator,
                parentId: 'root',
                metadata: {renderOrder: 1, blendMode: 'multiply', opacity: 0.5},
            },
        ])
        const wgsl = resolveFinal(registry)
        expect(wgsl).toMatch(/blend_multiply/)
        expect(wgsl).toMatch(/n_g2\._opacity/)
        expect(wgsl).toMatchSnapshot()
    })
})

describe('composer (c) generator + RTT filter', () => {
    it('creates an RTT boundary for the consumed child and samples it', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'g1', def: Generator, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'f1', def: Filter, parentId: 'root', metadata: {renderOrder: 1}},
        ])
        const ir = composeNodeTree(registry)
        // One RTT boundary (the filter consumes the generator via a passthrough blend).
        expect(ir.rttPasses.length).toBe(1)
        expect(ir.textures).toEqual([{key: 'rtt_0', kind: 'rtt'}])
        const rttWgsl = tgpu.resolve([ir.rttPasses[0].fragment.entry], {names: 'strict'})
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(rttWgsl).toMatch(/blend_normal/)
        expect(finalWgsl).toMatch(/filterBody/)
        // Resolved WGSL: the linker rewrote `tex.$.rtt_0` → the binding name `rtt_0`.
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        // The pre-resolution glue body uses the `.$.` accessor form (§B5 / brief).
        expect(ir.finalPass.body).toMatch(/tex\.\$\.rtt_0/)
        expect(ir.finalPass.body).toMatch(/uni\.\$\.uniforms\.n_f1\.amount/)
        expect(rttWgsl).toMatchSnapshot('rtt-pass')
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('composer (d) generator + mask reference', () => {
    it('composes the mask source and applies the mask fn', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'm1', def: MaskShape, parentId: 'root', customId: 'maskLayer', metadata: {renderOrder: 0}},
            {
                id: 'g1',
                def: Generator,
                parentId: 'root',
                metadata: {renderOrder: 1, mask: {source: 'maskLayer', type: 'luminance'}},
            },
        ])
        const wgsl = resolveFinal(registry)
        expect(wgsl).toMatch(/mask_luminance/)
        expect(wgsl).toMatchSnapshot()
    })
})

describe('composer (e) map driver override', () => {
    it('emits a local props copy with a sampled + remapped field overwrite', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'src', def: Generator, parentId: 'root', customId: 'source', metadata: {renderOrder: 0}},
            {
                id: 'g1',
                def: Generator,
                parentId: 'root',
                metadata: {
                    renderOrder: 1,
                    maps: {speed: {type: 'map', source: 'source', channel: 'luminance', inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1}},
                },
                fields: [
                    {name: '_map_speed_inputMin', initial: 0},
                    {name: '_map_speed_inputMax', initial: 1},
                    {name: '_map_speed_outputMin', initial: 0},
                    {name: '_map_speed_outputMax', initial: 1},
                    {name: '_map_speed_curve', initial: 0},
                ],
            },
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // Driver override: a local copy `var p_n_g1_N = uniforms.n_g1;` then `p_....speed = ...`.
        expect(finalWgsl).toMatch(/var p_n_g1/)
        expect(finalWgsl).toMatch(/\.speed = mix\(/)
        expect(finalWgsl).toMatch(/_map_speed_outputMin/)
        // The map source was RTT'd and sampled for the driving channel.
        expect(ir.rttPasses.length).toBeGreaterThanOrEqual(1)
        expect(finalWgsl).toMatchSnapshot()
    })
})

describe('composer (f) hidden mask + map sources still compose (Flowing Dots shape)', () => {
    // Mirrors the "Flowing Dots" preset: an invisible map SOURCE (ChromaFlow) drives a prop on an
    // invisible mask SOURCE (DotGrid), which masks a VISIBLE consumer (gradient). v1 semantics:
    // visible:false only gates the sibling RENDER loop — a node referenced as a mask/map source is
    // composed via composeNode REGARDLESS of visibility. This guards that the migration kept it.
    it('composes an invisible map+mask source chain referenced by a visible consumer', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            // Invisible map source (ChromaFlow analogue).
            {id: 'chroma', def: Generator, parentId: 'root', customId: 'chroma', metadata: {renderOrder: 0, visible: false}},
            // Invisible mask source (DotGrid analogue) — its `speed` prop is map-driven from `chroma`.
            {
                id: 'dots',
                def: Generator,
                parentId: 'root',
                customId: 'dots',
                metadata: {
                    renderOrder: 1,
                    visible: false,
                    maps: {speed: {type: 'map', source: 'chroma', channel: 'luminance', inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1}},
                },
                fields: [
                    {name: '_map_speed_inputMin', initial: 0},
                    {name: '_map_speed_inputMax', initial: 1},
                    {name: '_map_speed_outputMin', initial: 0},
                    {name: '_map_speed_outputMax', initial: 1},
                    {name: '_map_speed_curve', initial: 0},
                ],
            },
            // Visible consumer masked by the invisible DotGrid.
            {id: 'g1', def: Generator, parentId: 'root', metadata: {renderOrder: 2, mask: {source: 'dots', type: 'luminance'}}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // The mask is applied even though its source (`dots`) is visible:false.
        expect(finalWgsl).toMatch(/mask_luminance/)
        // `dots` pulled its own map-driven override in as a mask source (map source `chroma` composed).
        expect(finalWgsl).toMatch(/var p_n_dots/)
        expect(finalWgsl).toMatch(/\.speed = mix\(/)
        // The map source `chroma` was RTT'd and sampled despite being invisible.
        expect(ir.rttPasses.length).toBeGreaterThanOrEqual(1)
        expect(finalWgsl).toMatchSnapshot()
    })
})

describe('composer (g) float32 compute textures → unfilterable-float layout entries', () => {
    // Regression: rgba32float compute textures (the volumetric SDF field) bound into the
    // group-1 texture layout with TypeGPU's default sampleType 'float' only validate on
    // devices with the optional `float32-filterable` feature — absent on most Android GPUs,
    // where createBindGroup fails and the shader renders nothing. Float32 formats must be
    // declared 'unfilterable-float'; filterable formats (rgba16float) must stay 'float'.
    const ComputeGen: GpuShaderDefinition = {
        name: 'ComputeGen',
        props: {} as never,
        fragment: (params: GpuFragmentParams): Expr => {
            const field = params.registerComputeTexture({props: {format: 'rgba32float'}} as never)
            const state = params.registerComputeTexture({props: {format: 'rgba16float'}} as never)
            const fieldTexel = expr(`textureLoad(${resolveNow(field.accessor())}, vec2u(0u, 0u), 0)`)
            const stateTexel = state.sample(params.ctx.uv)
            return call(filterBody, 'filterBody', [fieldTexel, expr(`${resolveNow(stateTexel.member('a'))}`)])
        },
    }

    // Both accessors emit constant text (no ctx use), so a throwaway emit is safe here.
    function resolveNow(e: Expr): string {
        return e._emit({} as never)
    }

    it('marks rgba32float compute textures unfilterable-float and leaves rgba16float filterable', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'c1', def: ComputeGen, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const entries = (ir.finalPass.textureLayout as unknown as {
            entries: Record<string, {sampleType?: GPUTextureSampleType}>
        }).entries
        expect(entries.compute_0).toBeDefined()
        expect(entries.compute_0.sampleType).toBe('unfilterable-float')
        expect(entries.compute_1).toBeDefined()
        expect(entries.compute_1.sampleType).toBeUndefined()
    })
})

describe('composer — structural hash inputs', () => {
    it('collects the §2.1 trigger set in registry order', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'g1', def: Generator, parentId: 'root', metadata: {renderOrder: 0, blendMode: 'screen'}},
        ])
        const inputs = collectStructuralHashInputs(registry, {toneMapping: 'aces'})
        expect(inputs[0]).toBe('tone:aces')
        expect(inputs.some((p) => p.includes('blend:screen'))).toBe(true)
        expect(inputs.some((p) => p.includes('name:Generator'))).toBe(true)
    })

    // Re-parenting a layer INTO a filter, below that filter's existing child, leaves the pre-order
    // walk and every renderOrder untouched — the exact move a user makes by dragging a layer into a
    // Bulge in the editor. Without parentage in the hash the two trees collide, the pipeline cache
    // serves the pre-move composition, and the dragged layer keeps rendering as if it were still
    // outside the filter (until some later edit happens to change the hash).
    it('distinguishes a re-parent that preserves pre-order and renderOrder', () => {
        const outside = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'flt', def: Filter, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'txt', def: Generator, parentId: 'flt', metadata: {renderOrder: 0}},
            {id: 'img', def: Generator, parentId: 'root', metadata: {renderOrder: 1}},
        ]).registry
        const inside = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'flt', def: Filter, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'txt', def: Generator, parentId: 'flt', metadata: {renderOrder: 0}},
            {id: 'img', def: Generator, parentId: 'flt', metadata: {renderOrder: 1}},
        ]).registry

        const a = collectStructuralHashInputs(outside)
        const b = collectStructuralHashInputs(inside)
        // Same nodes, same visit sequence, same renderOrders — only the parent link differs.
        expect(a.length).toBe(b.length)
        expect(structuralHash(a)).not.toBe(structuralHash(b))
    })
})
