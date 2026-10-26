import {describe, it, expect, vi} from 'vitest'
import {createTextureManager} from '@coreroot/gpu/textures'

/**
 * B3 textures tests. No GPU under vitest, so the root/device layer is mocked with vi.fns. We
 * assert lifecycle + the WebGPU idioms: lazy cached samplers, media/data/render texture
 * creation options, sRGB view, RTT resize (destroy+recreate), external-texture re-import +
 * bind-group rebuild, and live texture-count tracking.
 */

function mockRoot() {
    const createSampler = vi.fn((props: Record<string, unknown>) => ({resourceType: 'sampler', props}))
    const importExternalTexture = vi.fn((desc: {source: unknown}) => ({external: desc.source}))
    const createBindGroup = vi.fn((_layout: unknown, entries: unknown) => ({resourceType: 'bind-group', entries}))

    const created: MockTexture[] = []
    const createTexture = vi.fn((props: Record<string, unknown>) => {
        const rawView = {format: undefined as unknown}
        const raw = {createView: vi.fn((desc?: {format?: string}) => ({...rawView, format: desc?.format}))}
        const tex: MockTexture = {
            props,
            usages: [],
            write: vi.fn(),
            generateMipmaps: vi.fn(),
            destroy: vi.fn(),
            $usage: vi.fn((...u: string[]) => {
                tex.usages.push(...u)
                return tex
            }),
            _raw: raw,
        }
        created.push(tex)
        return tex
    })

    const unwrap = vi.fn((tex: MockTexture) => tex._raw)
    const device = {importExternalTexture} as unknown as GPUDevice
    const root = {createSampler, createTexture, createBindGroup, unwrap, device} as never
    return {root, createSampler, createTexture, createBindGroup, importExternalTexture, unwrap, device, created}
}

interface MockTexture {
    props: Record<string, unknown>
    usages: string[]
    write: ReturnType<typeof vi.fn>
    generateMipmaps: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
    $usage: ReturnType<typeof vi.fn>
    _raw: {createView: ReturnType<typeof vi.fn>}
}

describe('textures — shared samplers', () => {
    it('creates each sampler once, lazily, and caches it', () => {
        const {root, createSampler} = mockRoot()
        const mgr = createTextureManager(root)
        expect(createSampler).not.toHaveBeenCalled()

        const lc1 = mgr.samplers.linearClamp
        const lc2 = mgr.samplers.linearClamp
        expect(lc1).toBe(lc2)
        expect(createSampler).toHaveBeenCalledTimes(1)

        mgr.samplers.nearestClamp
        mgr.samplers.linearRepeat
        mgr.samplers.nearestRepeat
        expect(createSampler).toHaveBeenCalledTimes(4)

        // Correct filter/address props per sampler.
        const calls = createSampler.mock.calls.map((c) => c[0])
        expect(calls[0]).toMatchObject({magFilter: 'linear', addressModeU: 'clamp-to-edge'})
        expect(calls[1]).toMatchObject({magFilter: 'nearest', addressModeU: 'clamp-to-edge'})
        expect(calls[2]).toMatchObject({magFilter: 'linear', addressModeU: 'repeat'})
        expect(calls[3]).toMatchObject({magFilter: 'nearest', addressModeU: 'repeat'})
    })
})

describe('textures — media textures', () => {
    it('creates rgba8unorm sampled+render textures and re-uploads via write', () => {
        const {root, createTexture, created} = mockRoot()
        const mgr = createTextureManager(root)
        const tex = mgr.createMediaTexture({width: 640, height: 480})

        expect(createTexture).toHaveBeenCalledWith({size: [640, 480], format: 'rgba8unorm'})
        expect(created[0].usages).toEqual(['sampled', 'render'])
        expect(mgr.textureCount).toBe(1)

        const canvas = {} as HTMLCanvasElement
        tex.write(canvas)
        expect(created[0].write).toHaveBeenCalledWith(canvas)
    })

    it('adds an sRGB viewFormat and exposes a raw sRGB view when srgb: true', () => {
        const {root, createTexture, created} = mockRoot()
        const mgr = createTextureManager(root)
        const tex = mgr.createMediaTexture({width: 2, height: 2, srgb: true})

        expect(createTexture).toHaveBeenCalledWith({
            size: [2, 2],
            format: 'rgba8unorm',
            viewFormats: ['rgba8unorm-srgb'],
        })
        const view = tex.createSrgbView()
        expect(created[0]._raw.createView).toHaveBeenCalledWith({format: 'rgba8unorm-srgb'})
        expect(view).toMatchObject({format: 'rgba8unorm-srgb'})
    })

    it('returns undefined from createSrgbView without srgb', () => {
        const {root} = mockRoot()
        const mgr = createTextureManager(root)
        const tex = mgr.createMediaTexture({width: 2, height: 2})
        expect(tex.createSrgbView()).toBeUndefined()
    })
})

describe('textures — data textures', () => {
    it('creates a sampled texture with the requested float format and writes TypedArray data', () => {
        const {root, createTexture, created} = mockRoot()
        const mgr = createTextureManager(root)
        const data = new Float32Array(4 * 4 * 4)
        mgr.createDataTexture({width: 4, height: 4, format: 'rgba32float', data})

        expect(createTexture).toHaveBeenCalledWith({size: [4, 4], format: 'rgba32float'})
        expect(created[0].usages).toEqual(['sampled'])
        expect(created[0].write).toHaveBeenCalledWith(data)
    })

    it('supports the full data-texture format union', () => {
        const {root, createTexture} = mockRoot()
        const mgr = createTextureManager(root)
        for (const format of ['r32float', 'r16float', 'rg16float', 'rgba8unorm', 'rgba16float'] as const) {
            mgr.createDataTexture({width: 1, height: 1, format})
        }
        expect(createTexture).toHaveBeenCalledTimes(5)
    })
})

describe('textures — render textures (RTT)', () => {
    it('creates rgba16float render+sampled targets and resizes by destroy+recreate', () => {
        const {root, createTexture, created} = mockRoot()
        const mgr = createTextureManager(root)
        const rt = mgr.createRenderTexture({width: 100, height: 100})

        expect(createTexture).toHaveBeenCalledWith({size: [100, 100], format: 'rgba16float'})
        expect(created[0].usages).toEqual(['sampled', 'render'])
        expect(mgr.textureCount).toBe(1)

        // Same-size resize is a no-op.
        rt.resize(100, 100)
        expect(createTexture).toHaveBeenCalledTimes(1)

        // Real resize destroys the old texture and creates a new one; count stays 1.
        rt.resize(200, 150)
        expect(created[0].destroy).toHaveBeenCalledTimes(1)
        expect(createTexture).toHaveBeenCalledTimes(2)
        expect(createTexture).toHaveBeenLastCalledWith({size: [200, 150], format: 'rgba16float'})
        expect(rt.width).toBe(200)
        expect(rt.height).toBe(150)
        expect(mgr.textureCount).toBe(1)
    })
})

describe('textures — external texture binding (video/webcam)', () => {
    it('re-imports the source and rebuilds the bind group every update', () => {
        const {root, importExternalTexture, createBindGroup} = mockRoot()
        const mgr = createTextureManager(root)
        const video = {tag: 'video'} as unknown as HTMLVideoElement
        const layout = {resourceType: 'bind-group-layout'} as never
        const sampler = {resourceType: 'sampler'}

        let source: HTMLVideoElement | null = video
        const binding = mgr.createExternalTextureBinding({
            layout,
            entryKey: 'frame',
            getSource: () => source,
            staticEntries: {samp: sampler},
        })

        const bg1 = binding.update()
        expect(importExternalTexture).toHaveBeenCalledWith({source: video})
        expect(createBindGroup).toHaveBeenCalledWith(layout, {
            samp: sampler,
            frame: {external: video},
        })
        expect(binding.current).toBe(bg1)

        // A second frame re-imports (external textures expire each frame).
        binding.update()
        expect(importExternalTexture).toHaveBeenCalledTimes(2)

        // No source → no bind group.
        source = null
        expect(binding.update()).toBeNull()
        expect(binding.current).toBeNull()
    })
})

describe('textures — count tracking + destroy', () => {
    it('tracks live textures and destroys them all', () => {
        const {root, created} = mockRoot()
        const mgr = createTextureManager(root)
        const a = mgr.createMediaTexture({width: 1, height: 1})
        mgr.createDataTexture({width: 1, height: 1, format: 'r32float'})
        mgr.createRenderTexture({width: 1, height: 1})
        expect(mgr.textureCount).toBe(3)

        a.destroy()
        expect(mgr.textureCount).toBe(2)
        // Double destroy is a no-op.
        a.destroy()
        expect(mgr.textureCount).toBe(2)

        mgr.destroy()
        expect(mgr.textureCount).toBe(0)
        // Every created texture got destroyed.
        expect(created.every((t) => t.destroy.mock.calls.length >= 1)).toBe(true)
    })
})
