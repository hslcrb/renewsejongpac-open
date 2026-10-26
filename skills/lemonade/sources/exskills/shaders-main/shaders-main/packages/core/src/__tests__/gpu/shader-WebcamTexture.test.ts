import {describe, it, expect, vi, beforeAll, afterAll} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import WebcamTexture from '@coreroot/shaders/WebcamTexture/index'
import {applyMirror} from '@coreroot/gpu/kit/media'

/**
 * WebcamTexture port gate (Phase D4-A). Same external-texture path as VideoTexture (getUserMedia
 * instead of a URL) — GPU-free resolve/snapshot asserts the external idioms, plus the mirror flip
 * (a runtime select, exported DualFn) and the natural-size ('none') mode Webcam keeps that Image/
 * Video retire. getUserMedia is deferred behind setTimeout(0) so composing never touches the camera.
 */

beforeAll(() => vi.useFakeTimers())
afterAll(() => vi.useRealTimers())

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
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? ({_emit: () => 'vec4f(0.0)'} as Expr),
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

function resolveFinal(props?: Record<string, unknown>): {wgsl: string; ir: ReturnType<typeof composeNodeTree>} {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'cam', def: WebcamTexture as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    return {wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'}), ir}
}

describe('WebcamTexture (a) external-texture sampling + mirror', () => {
    it('declares texture_external, samples clamp-to-edge, mirrors, decodes sRGB', () => {
        const {wgsl, ir} = resolveFinal()
        expect(ir.externalTextures.length).toBe(1)
        expect(ir.externalTextures[0].key).toBe('video_0')
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatch(/texture_external/)
        expect(wgsl).toMatch(/textureSampleBaseClampToEdge/)
        expect(wgsl).not.toMatch(/\btextureSample\(/)
        expect(wgsl).toMatch(/applyMirror/)
        expect(wgsl).toMatch(/srgbToLinear/)
        expect(wgsl).toMatchSnapshot('final-pass-cover')
    })
})

describe('WebcamTexture (b) compile-time object-fit modes (incl. natural-size)', () => {
    it('emits only the selected fit fn, including scaleNone for none', () => {
        expect(resolveFinal({objectFit: 'cover'}).wgsl).toMatch(/scaleCover/)
        expect(resolveFinal({objectFit: 'contain'}).wgsl).toMatch(/scaleContain/)
        expect(resolveFinal({objectFit: 'fill'}).wgsl).toMatch(/scaleFill/)
        expect(resolveFinal({objectFit: 'scale-down'}).wgsl).toMatch(/scaleScaleDown/)
        const none = resolveFinal({objectFit: 'none'}).wgsl
        expect(none).toMatch(/scaleNone/)
        expect(none).not.toMatch(/scaleCover/)
    })

    it('objectFit is part of the structural (recompile) hash', () => {
        const build = (objectFit: string) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'cam', def: WebcamTexture as GpuShaderDefinition, parentId: 'root', props: {objectFit}, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('cover')).not.toBe(build('none'))
    })
})

describe('WebcamTexture (c) CPU golden — mirror flip', () => {
    it('flips U when mirror > 0, passes through otherwise', () => {
        const on = applyMirror(d.vec2f(0.25, 0.6), d.f32(1)) as d.v2f
        expect(on.x).toBeCloseTo(0.75, 6)
        expect(on.y).toBeCloseTo(0.6, 6)
        const off = applyMirror(d.vec2f(0.25, 0.6), d.f32(-1)) as d.v2f
        expect(off.x).toBeCloseTo(0.25, 6)
        expect(off.y).toBeCloseTo(0.6, 6)
    })
})
