import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import DisplacementMap from '@coreroot/shaders/DisplacementMap/index'

/**
 * DisplacementMap port gate. The FIRST layer-prop consumer: `source` is a compileTime 'layer'-typed
 * prop holding another layer's custom id; the fragment resolves it via `getLayerTexture('source')`
 * to a shared RTT and displaces the child by the source's channels (red/green two-axis, or
 * luminance along an angle — both alpha-weighted, 0.5-neutral). Cover: the no-source passthrough,
 * the source-driven paths per channelMode, edge modes, and that the source id + channelMode are
 * structural-hash inputs (switching layers recomposes).
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
    customId?: string
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
            id: s.id, componentName: s.def.name, parentId: s.parentId, customId: s.customId, definition: s.def,
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
    const customIds = new Map<string, string>()
    for (const s of specs) if (s.customId) customIds.set(s.customId, s.id)
    const registry: RegistryView = {
        rootId: root.id,
        getNode: (id) => nodes.get(id),
        getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: (cid) => customIds.get(cid) ?? null,
        store,
    }
    return {registry, store}
}

const DM = DisplacementMap as GpuShaderDefinition

/** Standard tree: a source generator layer (customId 'src') + DisplacementMap > Generator. */
function sourcedRegistry(dmProps: Record<string, unknown>) {
    return buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'src', def: Generator, parentId: 'root', customId: 'src', metadata: {renderOrder: 0}},
        {id: 'dm', def: DM, parentId: 'root', props: {source: 'src', ...dmProps}, metadata: {renderOrder: 1}},
        {id: 'gen', def: Generator, parentId: 'dm', metadata: {renderOrder: 0}},
    ])
}

describe('DisplacementMap (a) no source selected → sharp passthrough', () => {
    it('samples the child RTT undisplaced and unpremultiplies (no displace body emitted)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'dm', def: DM, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'dm', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_/)
        expect(finalWgsl).not.toMatch(/dmDisplace/)
        expect(finalWgsl).toMatchSnapshot('displacementmap-passthrough')
    })

    it('an unresolvable source id degrades to the same passthrough', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'dm', def: DM, parentId: 'root', props: {source: 'nope'}, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'dm', metadata: {renderOrder: 0}},
        ])
        const finalWgsl = tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
        expect(finalWgsl).not.toMatch(/dmDisplace/)
    })
})

describe('DisplacementMap (b) source layer drives the displacement', () => {
    it('registers TWO RTT boundaries (child + source) and emits the red/green applier', () => {
        const {registry} = sourcedRegistry({})
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(2)
        expect(ir.textures.filter((t) => t.kind === 'rtt').length).toBe(2)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/dmDisplaceRG/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatchSnapshot('displacementmap-sourced')
    })

    it('the source RTT is SHARED when the source layer is also rendered on canvas (one boundary)', () => {
        const {registry} = sourcedRegistry({})
        const ir = composeNodeTree(registry)
        // src renders as a sibling layer AND feeds the displacement — still exactly 2 RTTs
        // (child + source), not 3.
        expect(ir.rttPasses.length).toBe(2)
    })
})

describe('DisplacementMap (c) compile-time channelMode branch', () => {
    const resolveWithChannel = (channelMode: string): string => {
        const {registry} = sourcedRegistry({channelMode, edges: 'stretch'})
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('twoAxis and directional select their matching applier', () => {
        expect(resolveWithChannel('twoAxis')).toMatch(/dmDisplaceRG/)
        expect(resolveWithChannel('directional')).toMatch(/dmDisplaceLuminance/)
        expect(resolveWithChannel('twoAxis')).not.toMatch(/dmDisplaceLuminance/)
        expect(resolveWithChannel('directional')).not.toMatch(/dmDisplaceRG/)
    })
})

describe('DisplacementMap (d) compile-time edge modes (default mirror)', () => {
    const resolveWithEdges = (edges: string): string => {
        const {registry} = sourcedRegistry({edges})
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('default mirror emits edgeMirrorUV; wrap/transparent select their own; edges is hashed', () => {
        expect(resolveWithEdges('mirror')).toMatch(/edgeMirrorUV/)
        expect(resolveWithEdges('wrap')).toMatch(/edgeWrapUV/)
        expect(resolveWithEdges('transparent')).toMatch(/edgeTransparentMask/)
        const build = (edges: string) => collectStructuralHashInputs(sourcedRegistry({edges}).registry).join('\n')
        expect(build('mirror')).not.toBe(build('wrap'))
    })
})

describe('DisplacementMap (e) the source id is a structural (recompile) hash input', () => {
    it('empty vs selected vs a different layer all hash differently', () => {
        const build = (source: string) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'srcA', def: Generator, parentId: 'root', customId: 'a', metadata: {renderOrder: 0}},
                {id: 'srcB', def: Generator, parentId: 'root', customId: 'b', metadata: {renderOrder: 1}},
                {id: 'dm', def: DM, parentId: 'root', props: {source}, metadata: {renderOrder: 2}},
                {id: 'gen', def: Generator, parentId: 'dm', metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('')).not.toBe(build('a'))
        expect(build('a')).not.toBe(build('b'))
    })
})
