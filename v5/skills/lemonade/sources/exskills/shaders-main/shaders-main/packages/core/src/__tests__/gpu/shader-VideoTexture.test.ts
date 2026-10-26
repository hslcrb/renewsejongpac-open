import {describe, it, expect, vi, beforeAll, afterAll} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import VideoTexture from '@coreroot/shaders/VideoTexture/index'

/**
 * VideoTexture port gate (Phase D4 — the first media shader + the external-texture path). GPU-free:
 * the uniform store's root is mocked, the composer builds the real raw-WGSL fragment entry, and we
 * `tgpu.resolve` the final pass to WGSL and assert/snapshot it — here the interesting shape is the
 * EXTERNAL texture (`texture_external`, `textureSampleBaseClampToEdge`, GPU `textureDimensions` for
 * the video's frame size). The object-fit `uvScale` math is shared `kit/media` code now, so its CPU
 * goldens against the ORIGINAL v1 fit formulas live in `kit-media.test.ts`.
 *
 * The fragment builder defers all DOM work (`document.createElement('video')`, playback) behind a
 * `setTimeout(0)` + `onBeforeRender`, so composing never touches the DOM. Fake timers keep the
 * deferred load from firing during/after the suite.
 */

beforeAll(() => vi.useFakeTimers())
afterAll(() => vi.useRealTimers())

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
        {id: 'vid', def: VideoTexture as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    return {wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'}), ir}
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) External-texture WGSL — texture_external + clamp-to-edge sample + GPU dimensions
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('VideoTexture (a) external-texture sampling', () => {
    it('declares a texture_external, samples with textureSampleBaseClampToEdge, reads dimensions on GPU', () => {
        const {wgsl, ir} = resolveFinal()
        // Registered exactly one external (video) texture binding.
        expect(ir.externalTextures.length).toBe(1)
        expect(ir.externalTextures[0].key).toBe('video_0')
        // No RTT boundary — VideoTexture is a leaf generator sampled directly in the final pass.
        expect(ir.rttPasses.length).toBe(0)
        // External-texture WGSL idioms.
        expect(wgsl).toMatch(/texture_external/)
        expect(wgsl).toMatch(/textureSampleBaseClampToEdge/)
        // Never the regular sampled-texture builtin on the external texture.
        expect(wgsl).not.toMatch(/\btextureSample\(/)
        expect(wgsl).toMatchSnapshot('final-pass-fill')
    })

    it('reads the video frame size on the GPU via textureDimensions (aspect-aware fit modes)', () => {
        // fill needs no dimensions (default) — cover derives videoAspect from the live frame size.
        expect(resolveFinal().wgsl).not.toMatch(/textureDimensions/)
        expect(resolveFinal({objectFit: 'cover'}).wgsl).toMatch(/textureDimensions\(video_0\)/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) Compile-time object-fit branching — only the selected mode's math is emitted
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('VideoTexture (b) compile-time object-fit modes', () => {
    it('emits only the selected fit fn per objectFit value', () => {
        expect(resolveFinal({objectFit: 'cover'}).wgsl).toMatch(/scaleCover/)
        const contain = resolveFinal({objectFit: 'contain'}).wgsl
        expect(contain).toMatch(/scaleContain/)
        expect(contain).not.toMatch(/scaleCover/)
        expect(resolveFinal({objectFit: 'fill'}).wgsl).toMatch(/scaleFill/)
        const scaleDown = resolveFinal({objectFit: 'scale-down'}).wgsl
        expect(scaleDown).toMatch(/scaleScaleDown/)
        expect(scaleDown).not.toMatch(/scaleContain\b/)
    })

    it('objectFit is part of the structural (recompile) hash', () => {
        const build = (objectFit: string) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'vid', def: VideoTexture as GpuShaderDefinition, parentId: 'root', props: {objectFit}, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(build('fill')).not.toBe(build('cover'))
        // objectFit carries an inline string→number transform, now applied by the bridge, so the
        // structural hash keys on the mapped number (cover→0, fill→2) — still distinct per mode.
        expect(build('fill')).toMatch(/objectFit=2/)
        expect(build('cover')).toMatch(/objectFit=0/)
    })
})
