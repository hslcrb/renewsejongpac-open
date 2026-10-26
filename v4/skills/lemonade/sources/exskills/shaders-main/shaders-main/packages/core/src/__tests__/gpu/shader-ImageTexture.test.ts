import {describe, it, expect, vi, beforeAll, afterAll} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs, type ComposeOptions} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ImageTexture from '@coreroot/shaders/ImageTexture/index'

/**
 * ImageTexture port gate (Phase D4-A — the FIRST media (createMediaTexture) shader). GPU-free: the
 * uniform store's root is mocked, the composer builds the real raw-WGSL fragment, and we resolve the
 * final pass to WGSL and assert/snapshot it — the interesting shape is a REGULAR sampled media
 * texture (`textureSample(media_0, …)`, `textureDimensions(media_0)` for aspect-fit) plus the sRGB
 * decode. `createMediaTexture` is injected via ComposeOptions (the renderer supplies the real one);
 * the fetch/decode lifecycle is deferred behind setTimeout(0) so composing never touches the network.
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

// Mock createMediaTexture: the composer only needs `.texture` (a stable opaque object → the getter)
// and the lifecycle no-ops. It is never resolved into WGSL (bound as `media_0` at draw).
function mockMediaTexture(width: number, height: number) {
    return {texture: {__mediaTex: Symbol('media')}, width, height, write: vi.fn(), unwrap: vi.fn(() => ({})), destroy: vi.fn()}
}
const composeOptions: ComposeOptions = {
    createMediaTexture: (opts) => mockMediaTexture(opts.width, opts.height) as never,
    gpu: {device: {queue: {}} as never, root: {} as never},
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
        {id: 'img', def: ImageTexture as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry, composeOptions)
    return {wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'}), ir}
}

describe('ImageTexture (a) media-texture sampling', () => {
    it('registers a media texture, samples it with textureSample, decodes sRGB', () => {
        const {wgsl, ir} = resolveFinal()
        // Exactly one media texture binding (no external, no RTT — leaf generator).
        const mediaTex = ir.textures.filter((t) => t.kind === 'media')
        expect(mediaTex.length).toBe(1)
        expect(mediaTex[0].key).toBe('media_0')
        expect(ir.externalTextures.length).toBe(0)
        expect(ir.rttPasses.length).toBe(0)
        // Regular sampled-texture builtin (NOT the external clamp-to-edge one).
        expect(wgsl).toMatch(/textureSample\(/)
        expect(wgsl).not.toMatch(/textureSampleBaseClampToEdge/)
        // sRGB decode is present (kit srgbToLinear, via alphaCutLinear) — v1 got this from three's
        // SRGBColorSpace; a media texture sampled without a hardware sRGB view must decode in-shader.
        expect(wgsl).toMatch(/srgbToLinear/)
        expect(wgsl).toMatchSnapshot('final-pass-fill')
    })

    it('reads the image size on the GPU via textureDimensions for aspect-aware modes', () => {
        // fill needs no dimensions; cover derives the image aspect from the live texture size.
        expect(resolveFinal().wgsl).not.toMatch(/textureDimensions/)
        expect(resolveFinal({objectFit: 'cover'}).wgsl).toMatch(/textureDimensions\(media_0\)/)
    })
})

describe('ImageTexture (b) compile-time object-fit modes', () => {
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
                {id: 'img', def: ImageTexture as GpuShaderDefinition, parentId: 'root', props: {objectFit}, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry, composeOptions).join('\n')
        }
        expect(build('fill')).not.toBe(build('cover'))
    })
})
