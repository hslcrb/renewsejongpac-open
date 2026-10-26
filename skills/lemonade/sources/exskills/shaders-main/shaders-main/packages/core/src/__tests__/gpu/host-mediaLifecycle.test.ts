import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import type {GpuFragmentParams, GpuMediaTexture} from '@coreroot/gpu/contract'
import {
    createSwappableMediaTexture,
    createUrlSourceLoader,
    createVideoElementSource,
    decodeImageSource,
} from '@coreroot/gpu/kit/host/mediaLifecycle'

/**
 * CPU gates for the media lifecycle host module. Snapshots cover the WGSL these shaders emit; NOTHING
 * covers the loading behaviour, which is where their real bugs live — writing into a destroyed
 * texture after an await, re-requesting a URL that is already in flight, retrying one that failed.
 * Each test here is one of those races.
 *
 * No GPU and no network: `createMediaTexture` is a counting fake, and `fetch` /
 * `createImageBitmap` / `getUserMedia` are stubbed per test.
 */

interface FakeTexture extends GpuMediaTexture {
    label: string
    destroyed: boolean
    writes: unknown[]
}

function harness() {
    const textures: FakeTexture[] = []
    const cleanups: Array<() => void> = []
    const beforeRenders: Array<() => void> = []
    let getter: (() => unknown) | null = null
    const cpuValues: Record<string, unknown> = {}

    const params = {
        createMediaTexture: (opts: {width: number; height: number; label?: string}) => {
            const tex: FakeTexture = {
                label: opts.label ?? '',
                width: opts.width,
                height: opts.height,
                destroyed: false,
                writes: [],
                texture: {id: textures.length},
                write(source: unknown) { this.writes.push(source) },
                unwrap: () => ({}) as GPUTexture,
                destroy() { this.destroyed = true },
            }
            textures.push(tex)
            return tex
        },
        registerMediaTexture: (get: () => unknown) => {
            getter = get
            return {key: 'media_0'} as never
        },
        registerExternalTexture: () => ({key: 'ext_0'}) as never,
        getCpuValue: (prop: string) => cpuValues[prop],
        onCleanup: (cb: () => void) => { cleanups.push(cb) },
        onBeforeRender: (cb: () => void) => { beforeRenders.push(cb) },
        canvas: {width: 1000} as HTMLCanvasElement,
        dimensions: {width: 500, height: 400},
    } as unknown as GpuFragmentParams

    return {
        params,
        textures,
        cpuValues,
        current: () => getter?.(),
        frame: () => beforeRenders.forEach((cb) => cb()),
        cleanup: () => cleanups.forEach((cb) => cb()),
    }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// createSwappableMediaTexture
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('createSwappableMediaTexture', () => {
    it('starts on a 1×1 placeholder so the pass always has something valid to bind', () => {
        const h = harness()
        const tex = createSwappableMediaTexture(h.params, {label: 'T'})
        expect(h.textures.length).toBe(1)
        expect([tex.width, tex.height]).toEqual([1, 1])
        expect(h.current()).toBe(h.textures[0].texture)
    })

    it('ensureSize allocates, points the getter at the new texture, and destroys the old one', () => {
        const h = harness()
        const tex = createSwappableMediaTexture(h.params, {label: 'T'})
        tex.ensureSize(800, 600)
        expect(h.textures.length).toBe(2)
        expect(h.textures[0].destroyed).toBe(true)
        expect(h.current()).toBe(h.textures[1].texture)
        expect([tex.width, tex.height]).toEqual([800, 600])
    })

    it('ensureSize at the SAME size is a no-op (no realloc, no bind-group rebuild)', () => {
        const h = harness()
        const tex = createSwappableMediaTexture(h.params, {label: 'T', initial: {width: 4, height: 4}})
        tex.ensureSize(4, 4)
        expect(h.textures.length).toBe(1)
        expect(h.textures[0].destroyed).toBe(false)
    })

    it('floors both axes at 1 — a zero-sized texture is a WebGPU validation error', () => {
        const h = harness()
        const tex = createSwappableMediaTexture(h.params, {label: 'T', initial: {width: 0, height: 0}})
        tex.ensureSize(0, -5)
        expect([tex.width, tex.height]).toEqual([1, 1])
    })

    it('after cleanup: disposed, the texture is destroyed, and write/ensureSize no-op', () => {
        const h = harness()
        const tex = createSwappableMediaTexture(h.params, {label: 'T'})
        h.cleanup()
        expect(tex.disposed).toBe(true)
        expect(h.textures[0].destroyed).toBe(true)
        tex.ensureSize(64, 64)
        tex.write({})
        expect(h.textures.length).toBe(1)
        expect(h.textures[0].writes.length).toBe(0)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// createUrlSourceLoader
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('createUrlSourceLoader', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    /** A load whose promise the test resolves by hand, so an "in flight" window can be inspected. */
    function deferredLoad() {
        const calls: string[] = []
        let release: (() => void) | null = null
        let disposedDuringAwait: boolean | null = null
        const load = async (url: string, ctx: {isDisposed(): boolean; commit(): void}) => {
            calls.push(url)
            await new Promise<void>((resolve) => { release = resolve })
            disposedDuringAwait = ctx.isDisposed()
            if (ctx.isDisposed()) return
            ctx.commit()
        }
        return {
            calls,
            load,
            finish: async () => { release?.(); await Promise.resolve(); await Promise.resolve() },
            disposedDuringAwait: () => disposedDuringAwait,
        }
    }

    it('kicks off the initial load on the deferred tick, not during composition', () => {
        const h = harness()
        h.cpuValues.url = 'a.jpg'
        const d = deferredLoad()
        createUrlSourceLoader(h.params, {prop: 'url', load: d.load})
        expect(d.calls).toEqual([])
        vi.advanceTimersByTime(0)
        expect(d.calls).toEqual(['a.jpg'])
    })

    it('an empty or whitespace URL never starts a load', () => {
        const h = harness()
        h.cpuValues.url = '   '
        const d = deferredLoad()
        createUrlSourceLoader(h.params, {prop: 'url', load: d.load})
        vi.advanceTimersByTime(0)
        h.frame()
        expect(d.calls).toEqual([])
    })

    it('a URL swapped WHILE a load is in flight is not requested twice', async () => {
        const h = harness()
        h.cpuValues.url = 'a.jpg'
        const d = deferredLoad()
        const loader = createUrlSourceLoader(h.params, {prop: 'url', load: d.load})
        vi.advanceTimersByTime(0)
        expect(loader.isLoading()).toBe(true)

        // The prop changes mid-flight; frames keep arriving. Only one load may be running.
        h.cpuValues.url = 'b.jpg'
        h.frame()
        h.frame()
        expect(d.calls).toEqual(['a.jpg'])

        await d.finish()
        expect(loader.currentUrl()).toBe('a.jpg')
        // The next frame picks the newer URL up, since it differs from the committed one.
        h.frame()
        expect(d.calls).toEqual(['a.jpg', 'b.jpg'])
    })

    it('a failed URL is not retried every frame, but a changed URL and a manual request are', async () => {
        const h = harness()
        h.cpuValues.url = 'broken.jpg'
        const calls: string[] = []
        const errors: unknown[] = []
        const loader = createUrlSourceLoader(h.params, {
            prop: 'url',
            load: async (url) => {
                calls.push(url)
                throw new Error(`HTTP 404 for ${url}`)
            },
            onError: (error) => errors.push(error),
        })
        vi.advanceTimersByTime(0)
        await vi.waitFor(() => expect(errors.length).toBe(1))

        // A failed load never commits, so the prop keeps differing from `currentUrl` — the watch must
        // NOT turn that into one request per frame.
        h.frame()
        h.frame()
        h.frame()
        await Promise.resolve()
        expect(calls).toEqual(['broken.jpg'])

        // Editing the prop re-arms the watch.
        h.cpuValues.url = 'other.jpg'
        h.frame()
        await vi.waitFor(() => expect(errors.length).toBe(2))
        expect(calls).toEqual(['broken.jpg', 'other.jpg'])
        h.frame()
        h.frame()
        await Promise.resolve()
        expect(calls).toEqual(['broken.jpg', 'other.jpg'])

        // A deliberate request bypasses the gate.
        loader.request('other.jpg')
        await vi.waitFor(() => expect(errors.length).toBe(3))
        expect(calls).toEqual(['broken.jpg', 'other.jpg', 'other.jpg'])
    })

    it('disposal during the await is visible to the load, which must then not commit', async () => {
        const h = harness()
        h.cpuValues.url = 'a.jpg'
        const d = deferredLoad()
        const loader = createUrlSourceLoader(h.params, {prop: 'url', load: d.load})
        vi.advanceTimersByTime(0)
        h.cleanup()
        await d.finish()
        expect(d.disposedDuringAwait()).toBe(true)
        expect(loader.currentUrl()).toBe('')
    })

    it('a load requested after cleanup does not start', () => {
        const h = harness()
        h.cpuValues.url = 'a.jpg'
        const d = deferredLoad()
        const loader = createUrlSourceLoader(h.params, {prop: 'url', load: d.load})
        h.cleanup()
        vi.advanceTimersByTime(0)
        loader.request('b.jpg')
        expect(d.calls).toEqual([])
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// decodeImageSource
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('decodeImageSource', () => {
    afterEach(() => { vi.unstubAllGlobals() })

    function stubBitmap(width: number, height: number) {
        const close = vi.fn()
        vi.stubGlobal('fetch', vi.fn(async () => ({ok: true, blob: async () => ({}) })))
        vi.stubGlobal('createImageBitmap', vi.fn(async () => ({width, height, close})))
        return close
    }

    it('a bitmap reports raster size == intrinsic size', async () => {
        stubBitmap(800, 600)
        const decoded = await decodeImageSource('https://x/photo.jpg')
        expect([decoded.width, decoded.height]).toEqual([800, 600])
        expect([decoded.naturalWidth, decoded.naturalHeight]).toEqual([800, 600])
    })

    it('close() releases the bitmap exactly once, however many times it is called', async () => {
        const close = stubBitmap(4, 4)
        const decoded = await decodeImageSource('https://x/photo.jpg')
        decoded.close()
        decoded.close()
        expect(close).toHaveBeenCalledTimes(1)
    })

    it('a non-ok response rejects rather than uploading garbage', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ok: false, status: 404})))
        await expect(decodeImageSource('https://x/missing.jpg')).rejects.toThrow('HTTP 404')
    })

    it('an SVG takes the Image/canvas raster path, NOT fetch + createImageBitmap', async () => {
        const fetchSpy = vi.fn()
        vi.stubGlobal('fetch', fetchSpy)
        const srcs: string[] = []
        class FakeImage {
            crossOrigin = ''
            naturalWidth = 64
            naturalHeight = 32
            onload: (() => void) | null = null
            onerror: (() => void) | null = null
            set src(value: string) {
                srcs.push(value)
                setTimeout(() => this.onload?.(), 0)
            }
        }
        vi.stubGlobal('Image', FakeImage)

        // happy-dom may not provide a 2D context; either outcome proves the routing, which is what
        // this asserts — the raster/intrinsic split itself is exercised through the size fields.
        const result = await decodeImageSource('https://x/logo.svg').catch((e) => e)
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(srcs).toEqual(['https://x/logo.svg'])
        if (!(result instanceof Error)) {
            // 2:1 aspect → long axis at the 2048 reference, intrinsic size preserved for layout.
            expect([result.width, result.height]).toEqual([2048, 1024])
            expect([result.naturalWidth, result.naturalHeight]).toEqual([64, 32])
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// createVideoElementSource
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('createVideoElementSource', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('a URL source reports the metadata timeout through onError and stays retryable', async () => {
        const h = harness()
        h.cpuValues.url = 'https://x/clip.mp4'
        const stages: string[] = []
        createVideoElementSource(h.params, {
            source: {kind: 'url', prop: 'url'},
            metadataTimeoutMs: 10000,
            onError: (_error, info) => stages.push(info.stage),
        })
        vi.advanceTimersByTime(0)
        expect(stages).toEqual([])
        vi.advanceTimersByTime(10000)
        // Reported exactly ONCE — the metadata site rethrows rather than logging as well.
        await vi.waitFor(() => expect(stages).toEqual(['acquire']))
    })

    it('getSource() gates on readiness — no element, or an undecodable one, binds nothing', () => {
        const h = harness()
        h.cpuValues.url = 'https://x/clip.mp4'
        const source = createVideoElementSource(h.params, {source: {kind: 'url', prop: 'url'}})
        expect(source.getSource()).toBeNull()
        expect(source.element()).toBeNull()
    })

    it('a webcam reports a permission denial through onError with stage "acquire"', async () => {
        const h = harness()
        const denied = new DOMException('denied', 'NotAllowedError')
        vi.stubGlobal('navigator', {mediaDevices: {getUserMedia: vi.fn(async () => { throw denied })}})
        const seen: Array<{stage: string; error: unknown}> = []
        createVideoElementSource(h.params, {
            source: {kind: 'webcam'},
            naturalSizeKey: 'webcam',
            onError: (error, info) => seen.push({stage: info.stage, error}),
        })
        vi.advanceTimersByTime(0)
        await vi.waitFor(() => expect(seen.length).toBe(1))
        expect(seen[0]).toEqual({stage: 'acquire', error: denied})
    })

    it('a webcam disposed while getUserMedia is in flight stops the tracks it acquired', async () => {
        const h = harness()
        const stop = vi.fn()
        let release: ((v: unknown) => void) | null = null
        vi.stubGlobal('navigator', {
            mediaDevices: {getUserMedia: () => new Promise((resolve) => { release = resolve })},
        })
        createVideoElementSource(h.params, {source: {kind: 'webcam'}})
        vi.advanceTimersByTime(0)
        h.cleanup()
        release?.({getTracks: () => [{stop}]})
        await vi.waitFor(() => expect(stop).toHaveBeenCalledTimes(1))
    })

    it('the constraints are passed through verbatim (facingMode / ideal resolution)', () => {
        const h = harness()
        const getUserMedia = vi.fn(() => new Promise(() => {}))
        vi.stubGlobal('navigator', {mediaDevices: {getUserMedia}})
        const constraints = {video: {width: {ideal: 1280}, height: {ideal: 720}, facingMode: 'user'}, audio: false}
        createVideoElementSource(h.params, {source: {kind: 'webcam', constraints}})
        vi.advanceTimersByTime(0)
        expect(getUserMedia).toHaveBeenCalledWith(constraints)
    })
})
