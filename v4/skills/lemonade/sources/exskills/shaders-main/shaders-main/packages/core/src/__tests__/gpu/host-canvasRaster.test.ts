import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import type {GpuFragmentParams} from '@coreroot/gpu/contract'
import {
    createCanvasRasterTarget,
    createFontDependentRaster,
    createRasterInvalidator,
} from '@coreroot/gpu/kit/host/canvasRaster'

/**
 * CPU gates for the canvas raster host module. The invariant worth protecting is Text's scale clamp:
 * a raster that exceeded the per-axis cap used to throw at texture creation, so the rule is DEGRADE
 * the density, never exceed the cap — and never below 2 texels per axis.
 */

function harness(canvasWidth = 1000, dims = {width: 500, height: 400}) {
    const cleanups: Array<() => void> = []
    const beforeRenders: Array<() => void> = []
    const params = {
        canvas: {width: canvasWidth} as HTMLCanvasElement,
        dimensions: dims,
        onCleanup: (cb: () => void) => { cleanups.push(cb) },
        onBeforeRender: (cb: () => void) => { beforeRenders.push(cb) },
    } as unknown as GpuFragmentParams
    return {
        params,
        frame: () => beforeRenders.forEach((cb) => cb()),
        cleanup: () => cleanups.forEach((cb) => cb()),
    }
}

describe('createCanvasRasterTarget — scale invariant', () => {
    it('device pixel ratio is derived from the host canvas vs the logical dimensions', () => {
        const target = createCanvasRasterTarget(harness(1000, {width: 500, height: 400}).params)
        expect(target.devicePixelRatio()).toBe(2)
    })

    it('supersample multiplies the ratio when there is headroom', () => {
        const target = createCanvasRasterTarget(harness().params, {supersample: 3, maxAxis: 4096})
        const {scale, texW, texH} = target.rasterSize(100, 50)
        expect(scale).toBe(6) // dpr 2 × 3
        expect([texW, texH]).toEqual([600, 300])
    })

    it('clamps so NEITHER axis exceeds maxAxis — the wider axis wins', () => {
        const target = createCanvasRasterTarget(harness().params, {supersample: 3, maxAxis: 4096})
        const {scale, texW, texH} = target.rasterSize(2000, 100)
        expect(scale).toBeCloseTo(4096 / 2000)
        expect(texW).toBe(4096)
        expect(texH).toBeLessThanOrEqual(4096)
    })

    it('never goes below 2 texels per axis, however small the box', () => {
        const target = createCanvasRasterTarget(harness().params, {supersample: 3, maxAxis: 4096})
        const {texW, texH} = target.rasterSize(0.01, 0.01)
        expect([texW, texH]).toEqual([2, 2])
    })

    it('no supersample means the plain device pixel ratio', () => {
        const target = createCanvasRasterTarget(harness().params)
        expect(target.rasterSize(100, 100).scale).toBe(2)
    })

    it('the canvas is created lazily — a shader that never rasters allocates nothing', () => {
        const target = createCanvasRasterTarget(harness().params)
        expect(target.canvas()).toBeNull()
        target.context()
        expect(target.canvas()).not.toBeNull()
    })

    it('cleanup zeroes both axes (what actually releases the backing store) and refuses new contexts', () => {
        const h = harness()
        const target = createCanvasRasterTarget(h.params)
        const el = (target.context(), target.canvas())!
        h.cleanup()
        expect([el.width, el.height]).toEqual([0, 0])
        expect(target.disposed).toBe(true)
        expect(target.context()).toBeNull()
        expect(target.resize(64, 64)).toBeNull()
    })
})

describe('createRasterInvalidator', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('runs when the key changes and not when it does not', () => {
        const h = harness()
        let key = 'a'
        const run = vi.fn()
        createRasterInvalidator(h.params, {key: () => key, minIntervalMs: 0, run})
        h.frame()
        expect(run).toHaveBeenCalledTimes(1)
        h.frame()
        expect(run).toHaveBeenCalledTimes(1)
        key = 'b'
        h.frame()
        expect(run).toHaveBeenCalledTimes(2)
    })

    it('throttles the CHECK: a key change inside the interval is picked up after it, once', () => {
        const h = harness()
        let key = 'a'
        const run = vi.fn()
        createRasterInvalidator(h.params, {key: () => key, minIntervalMs: 100, run})
        h.frame() // first check: '' → 'a'
        expect(run).toHaveBeenCalledTimes(1)
        key = 'b'
        h.frame()
        h.frame()
        expect(run).toHaveBeenCalledTimes(1)
        vi.advanceTimersByTime(101)
        h.frame()
        expect(run).toHaveBeenCalledTimes(2)
    })

    it('initialKey primes the diff so an eager raster is not immediately redone', () => {
        const h = harness()
        const run = vi.fn()
        createRasterInvalidator(h.params, {key: () => 'Inter|500', initialKey: 'Inter|500', minIntervalMs: 0, run})
        h.frame()
        expect(run).not.toHaveBeenCalled()
    })
})

describe('createFontDependentRaster', () => {
    it('loads once per font key and re-rasters when the load resolves', async () => {
        let key = 'Inter|400|false'
        const load = vi.fn(async () => {})
        const onLoaded = vi.fn()
        const font = createFontDependentRaster({key: () => key, load, onLoaded})

        font.ensure()
        font.ensure()
        await vi.waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1))
        expect(load).toHaveBeenCalledTimes(1)

        key = 'Inter|700|false'
        font.ensure()
        await vi.waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(2))
    })

    it('a rejected load keeps the fallback raster — it must not re-raster or throw', async () => {
        const onLoaded = vi.fn()
        const font = createFontDependentRaster({
            key: () => 'Missing|400|false',
            load: async () => { throw new Error('404') },
            onLoaded,
        })
        expect(() => font.ensure()).not.toThrow()
        await Promise.resolve()
        await Promise.resolve()
        expect(onLoaded).not.toHaveBeenCalled()
    })
})
