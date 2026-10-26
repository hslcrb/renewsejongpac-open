import {describe, it, expect, vi, beforeAll, afterAll} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, type ComposeOptions} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import HTMLInCanvas from '@coreroot/shaders/HTMLInCanvas/index'

/**
 * HTMLInCanvas port gate. CANNOT be smoked headless (the WICG copyElementImageToTexture
 * API is behind a Chrome Canary flag: chrome://flags/#canvas-draw-element) — this GPU-free resolve
 * gate + tsc + build are the automated gates; the visual pass is a manual Canary check.
 * It asserts HTMLInCanvas composes to a plain media-texture sample of ctx.uv with an
 * sRGB decode, and that the copy path is a defensive no-op when the API is absent (no throw here).
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

// A device WITHOUT copyElementImageToTexture — the non-Canary case; composing + the onBeforeRender
// copy path must not throw (defensive no-op).
const composeOptions: ComposeOptions = {
    createMediaTexture: (opts) => ({texture: {}, width: opts.width, height: opts.height, write: vi.fn(), unwrap: vi.fn(() => ({})), destroy: vi.fn()}) as never,
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
    metadata?: Partial<NodeMetadata>
}

function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore} {
    const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        handlesById[s.id] = store.defineNode(s.id, synthetic) as never
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

function resolveFinal(): {wgsl: string; ir: ReturnType<typeof composeNodeTree>} {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'dom', def: HTMLInCanvas as GpuShaderDefinition, parentId: 'root', metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry, composeOptions)
    return {wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'}), ir}
}

describe('HTMLInCanvas — media-texture sample of the captured DOM', () => {
    it('registers a media texture, samples ctx.uv, decodes sRGB, no external/RTT', () => {
        const {wgsl, ir} = resolveFinal()
        const mediaTex = ir.textures.filter((t) => t.kind === 'media')
        expect(mediaTex.length).toBe(1)
        expect(mediaTex[0].key).toBe('media_0')
        expect(ir.externalTextures.length).toBe(0)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatch(/textureSample\(media_0/)
        expect(wgsl).toMatch(/srgbToLinear/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('drains onBeforeRender/onResize without throwing when the WICG API is absent (non-Canary)', () => {
        const {ir} = resolveFinal()
        // A minimal domCanvas stub with the layoutsubtree hooks HTMLInCanvas pokes.
        const domCanvas = {
            firstElementChild: {getBoundingClientRect: () => ({width: 100, height: 80})},
            getContext: vi.fn(),
            requestPaint: vi.fn(),
            onpaint: null as unknown,
        }
        // Wire the domCanvas the way the renderer would (frame params carry it via the shader closure);
        // here we just exercise the registered callbacks to prove no throw when copy API is missing.
        expect(() => {
            for (const cb of ir.onBeforeRender) cb({domCanvas})
            for (const cb of ir.onResize) cb({domCanvas})
            for (const cb of ir.onBeforeRender) cb({domCanvas})
        }).not.toThrow()
    })
})
