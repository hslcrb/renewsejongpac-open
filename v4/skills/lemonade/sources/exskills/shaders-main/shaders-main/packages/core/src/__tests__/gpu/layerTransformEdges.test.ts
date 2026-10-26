import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata, TransformConfig} from '@coreroot/types'

/**
 * Regression gate for the generic per-layer `transform.edges` mode (FIX-M). Every component
 * accepts a layer `transform` ({offset, rotation, scale, anchor, edges}); when scale < 1 (or an
 * offset/rotation is set) the layer occupies part of the plane and `edges` dictates how the rest
 * fills: stretch(0) extends the edge pixel, transparent(1) alpha-cuts, mirror(2) mirror-tiles,
 * wrap(3) repeat-tiles.
 *
 * The TypeGPU port of `applyNodeTransformation` (composer.ts) originally hard-coded the stretch
 * branch (`edgeClampUV`) with a "mirror/wrap re-sample is a Phase-D edge concern" TODO, so a
 * scaled-down layer with edges:'mirror' rendered ONE stretched copy instead of the mirror-tiled
 * field v1 shipped ("Polynesian waves" preset). This asserts the four modes each select their
 * v1 WGSL (a re-sample of the RTT texture at the reflected/tiled UV, an alpha-cut, or a straight
 * sample) and that the mode is part of the recompile hash — the same contract shader-Bulge.test
 * asserts for a shader's OWN `edges` prop, applied here to the layer transform.
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

// A minimal generator: reads the composed uvContext (or ctx.uv standalone) — the LinearGradient
// shape. Under a plain root it composes as a leaf, so the layer transform (RTT + edge handling)
// wraps its fragment result.
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
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(genBody, 'genBody', [call(genBody, 'genBody', [])]),
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

// The synthetic `_xform_*` scalar fields the renderer seeds when a layer transform is active
// (gpu/index.ts transformFieldValues). The composer's applyNodeTransform reads them by name, so
// the test store must define them or resolve would reference an absent struct member.
function xformFieldInits(t: TransformConfig): FieldInit[] {
    const vals: Record<string, number> = {
        offsetX: t.offsetX,
        offsetY: t.offsetY,
        rotation: t.rotation,
        scale: t.scale,
        anchorX: t.anchorX,
        anchorY: t.anchorY,
        aspectRatio: 800 / 600,
    }
    return Object.entries(vals).map(([k, v]) => ({name: `_xform_${k}`, schema: d.f32, initial: v}))
}

function buildRegistry(specs: NodeSpec[]): {registry: RegistryView} {
    const store: UniformStore = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const propFields = bridgeFieldInits(s.def, s.props ?? {}, s.id)
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        const tf = s.metadata?.transform
        if (tf) synthetic.push(...xformFieldInits(tf))
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
    return {registry}
}

// A scaled-down layer (scale 0.25 → occupies 1/4 of the plane) with the given edge mode. scale ≠ 1
// makes needsTransformation true, so applyNodeTransform (RTT + edge handling) fires.
const transformWith = (edges: TransformConfig['edges']): TransformConfig => ({
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    scale: 0.25,
    anchorX: 0.5,
    anchorY: 0.5,
    edges,
})

const resolveWithEdges = (edges: TransformConfig['edges']): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'gen', def: Generator, parentId: 'root', metadata: {renderOrder: 0, transform: transformWith(edges)}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('layer transform edges — applyNodeTransform respects transform.edges', () => {
    it('mirror re-samples the RTT texture at the reflected UV (mirror-tiles, not stretch)', () => {
        const wgsl = resolveWithEdges('mirror')
        expect(wgsl).toMatch(/edgeMirrorUV/)
        expect(wgsl).toMatch(/textureSample\(rtt_/)
        // The pre-fix behaviour was a bare stretch clamp — that must NOT be all that fires.
        expect(wgsl).not.toMatch(/edgeClampUV/)
    })

    it('wrap re-samples the RTT texture at the tiled UV', () => {
        const wgsl = resolveWithEdges('wrap')
        expect(wgsl).toMatch(/edgeWrapUV/)
        expect(wgsl).toMatch(/textureSample\(rtt_/)
    })

    it('transparent alpha-cuts the sample outside [0,1]', () => {
        const wgsl = resolveWithEdges('transparent')
        expect(wgsl).toMatch(/edgeTransparentMask/)
    })

    it('stretch samples straight (no mirror/wrap/transparent fn)', () => {
        const wgsl = resolveWithEdges('stretch')
        expect(wgsl).toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/edgeMirrorUV/)
        expect(wgsl).not.toMatch(/edgeWrapUV/)
        expect(wgsl).not.toMatch(/edgeTransparentMask/)
    })

    it('the four edge modes emit distinct WGSL (regression: all rendered as stretch)', () => {
        const modes = ['stretch', 'transparent', 'mirror', 'wrap'] as const
        const wgsl = modes.map(resolveWithEdges)
        const unique = new Set(wgsl)
        expect(unique.size).toBe(modes.length)
    })
})

describe('layer transform edges — recompile hash', () => {
    const hashFor = (edges: TransformConfig['edges']): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'gen', def: Generator, parentId: 'root', metadata: {renderOrder: 0, transform: transformWith(edges)}},
        ])
        return collectStructuralHashInputs(registry).join('\n')
    }

    it('an active layer transform folds its edge mode into the structural hash', () => {
        expect(hashFor('stretch')).not.toBe(hashFor('mirror'))
        expect(hashFor('mirror')).not.toBe(hashFor('wrap'))
        expect(hashFor('mirror')).toMatch(/xform:true:mirror/)
        expect(hashFor('wrap')).toMatch(/xform:true:wrap/)
    })

    it('an inactive transform (defaults) does not append an edge mode to the hash', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            // scale 1, no offset/rotation → needsTransformation false → no branch → mode irrelevant.
            {
                id: 'gen',
                def: Generator,
                parentId: 'root',
                metadata: {renderOrder: 0, transform: {offsetX: 0, offsetY: 0, rotation: 0, scale: 1, anchorX: 0.5, anchorY: 0.5, edges: 'mirror'}},
            },
        ])
        const hash = collectStructuralHashInputs(registry).join('\n')
        expect(hash).toMatch(/xform:false/)
        expect(hash).not.toMatch(/xform:false:/)
    })
})
