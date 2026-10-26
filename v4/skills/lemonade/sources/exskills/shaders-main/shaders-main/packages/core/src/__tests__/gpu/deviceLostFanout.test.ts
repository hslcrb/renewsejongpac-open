import {describe, it, expect, vi, beforeEach} from 'vitest'

/**
 * Device-loss fan-out (plan §8.4 check d, the GPU-free half). A real non-'destroyed' device
 * loss can't be synthesized in headless Chromium without a driver-level TDR, so the behavioral
 * runner's device-loss check exercises the real-device DESTROY path (reason 'destroyed', which
 * the fan-out correctly suppresses). This test covers the complementary FIRING path: the exact
 * `root.ts` fan-out logic — attach once per device, call every registered callback on a
 * non-'destroyed' reason, suppress 'destroyed', and notify multiple renderers sharing one device.
 *
 * `root.ts` imports only `tgpu` from 'typegpu', so mocking `initFromDevice` to a passthrough root
 * isolates the fan-out wiring with no GPU. This is the same `device.lost.then` handler the live
 * renderer wires through `acquireRoot({ onDeviceLost })`.
 */

const mocks = vi.hoisted(() => ({
    // Devices handed out by the mocked `tgpu.init` (the created-own-device path). Tests
    // that exercise device-loss recovery push controllable fakes here; the fallback is a
    // device whose `lost` never resolves.
    initQueue: [] as Array<{device: unknown}>,
    /** Make the next `tgpu.init` reject, to exercise the not-cached-on-failure path. */
    initThrows: false,
}))

vi.mock('typegpu', () => ({
    default: {
        // Passthrough root — the fan-out keys on `root.device`, which must be the injected device.
        initFromDevice: ({device}: {device: GPUDevice}) => ({device}),
        init: async () => {
            if (mocks.initThrows) throw new Error('requestDevice failed')
            return mocks.initQueue.shift() ?? {device: {lost: new Promise(() => {})} as unknown as GPUDevice}
        },
    },
}))

// Imported AFTER the mock so root.ts binds to the mocked typegpu.
const {acquireRoot, __resetDefaultRoot} = await import('@coreroot/gpu/root')

interface FakeDevice {
    device: {lost: Promise<{reason: string; message: string}>}
    loseWith: (reason: string, message: string) => void
}

/** A device whose `.lost` promise we resolve on demand, to drive the fan-out deterministically. */
function makeFakeDevice(): FakeDevice {
    let resolve!: (info: {reason: string; message: string}) => void
    const lost = new Promise<{reason: string; message: string}>((res) => {
        resolve = res
    })
    return {device: {lost}, loseWith: (reason, message) => resolve({reason, message})}
}

/** Let the `.lost.then` microtask chain settle. */
const settle = () => new Promise((r) => setTimeout(r, 0))

describe('device-loss fan-out (root.ts wireDeviceLost)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // The default root is a PAGE-wide singleton; drop it between cases so each test gets
        // the device it queues rather than one a previous test left cached.
        __resetDefaultRoot()
    })

    it('fires onDeviceLost for a non-destroyed reason with the loss info', async () => {
        const fake = makeFakeDevice()
        const cb = vi.fn()
        await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: cb})

        fake.loseWith('unknown', 'GPU device disconnected')
        await settle()

        expect(cb).toHaveBeenCalledTimes(1)
        expect(cb).toHaveBeenCalledWith(expect.objectContaining({reason: 'unknown', message: 'GPU device disconnected'}))
    })

    it("suppresses onDeviceLost for reason 'destroyed' (intentional teardown)", async () => {
        const fake = makeFakeDevice()
        const cb = vi.fn()
        await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: cb})

        fake.loseWith('destroyed', 'device.destroy() called')
        await settle()

        expect(cb).not.toHaveBeenCalled()
    })

    it('fans out to every renderer sharing one device (each notified exactly once)', async () => {
        const fake = makeFakeDevice()
        const cbA = vi.fn()
        const cbB = vi.fn()
        // Two acquireRoot calls on the SAME device → one cached root (WeakMap) → both callbacks
        // registered against the single real device.lost handler.
        const ctxA = await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: cbA})
        const ctxB = await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: cbB})
        expect(ctxA.root).toBe(ctxB.root) // shared root per device
        expect(ctxA.createdDevice).toBe(false) // adopted, not created

        fake.loseWith('unknown', 'shared device lost')
        await settle()

        expect(cbA).toHaveBeenCalledTimes(1)
        expect(cbB).toHaveBeenCalledTimes(1)
    })

    // ── Lost-device recovery (the Galaxy Swirl / partner-shell regression) ──────────────
    //
    // createShader's device-loss rebuild re-enters acquireRoot with the caller's ORIGINAL
    // `gpu.device` handle. If that (shared) device is the thing that died, re-adopting it
    // yields a renderer whose every GPU call silently no-ops — a permanently blank canvas.
    // acquireRoot must refuse the corpse and route every sharer onto one live replacement.

    it('does not re-adopt a lost injected device — rebuilds converge on one live replacement', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {} // replacement path requires WebGPU to appear available
        const fake = makeFakeDevice()
        const cb = vi.fn()
        const ctx0 = await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: cb})

        fake.loseWith('unknown', 'GPU evicted while page hidden')
        await settle()
        expect(cb).toHaveBeenCalledTimes(1)

        // Two renderers rebuild, both passing the same dead device (the createShader flow).
        const ctxA = await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: vi.fn()})
        const ctxB = await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: vi.fn()})

        expect(ctxA.root).not.toBe(ctx0.root) // NOT the cached root over the dead device
        expect(ctxA.device).not.toBe(fake.device) // a genuinely new device
        expect(ctxA.root).toBe(ctxB.root) // sharers converge on ONE replacement
        // A shared replacement must never be destroyed by a single renderer's cleanup.
        expect(ctxA.createdDevice).toBe(false)
    })

    it('replaces a replacement that itself died (chain of losses)', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {}
        const original = makeFakeDevice()
        await acquireRoot({device: original.device as unknown as GPUDevice, onDeviceLost: vi.fn()})
        original.loseWith('unknown', 'first loss')
        await settle()

        const repl1 = makeFakeDevice()
        mocks.initQueue.push({device: repl1.device})
        const ctx1 = await acquireRoot({device: original.device as unknown as GPUDevice, onDeviceLost: vi.fn()})
        expect(ctx1.device).toBe(repl1.device)

        repl1.loseWith('unknown', 'replacement lost too')
        await settle()

        const repl2 = makeFakeDevice()
        mocks.initQueue.push({device: repl2.device})
        const ctx2 = await acquireRoot({device: original.device as unknown as GPUDevice, onDeviceLost: vi.fn()})
        expect(ctx2.device).toBe(repl2.device) // fresh replacement, not the dead one
    })

    it('concurrent rebuilds after a dead replacement converge on ONE new device', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {}
        const original = makeFakeDevice()
        await acquireRoot({device: original.device as unknown as GPUDevice, onDeviceLost: vi.fn()})
        original.loseWith('unknown', 'first loss')
        await settle()

        const repl1 = makeFakeDevice()
        mocks.initQueue.push({device: repl1.device})
        await acquireRoot({device: original.device as unknown as GPUDevice, onDeviceLost: vi.fn()})
        repl1.loseWith('unknown', 'replacement lost')
        await settle()

        // Two rebuilds race through the dead-cached-replacement path. Both must land on
        // the SAME fresh device — the loser of the race adopts the winner's replacement
        // instead of requesting a second device.
        const repl2 = makeFakeDevice()
        const repl3 = makeFakeDevice()
        mocks.initQueue.push({device: repl2.device}, {device: repl3.device})
        const [ctxA, ctxB] = await Promise.all([
            acquireRoot({device: original.device as unknown as GPUDevice, onDeviceLost: vi.fn()}),
            acquireRoot({device: original.device as unknown as GPUDevice, onDeviceLost: vi.fn()}),
        ])
        expect(ctxA.device).toBe(ctxB.device)
        expect(mocks.initQueue.length).toBe(1) // only one replacement was actually requested
        mocks.initQueue.length = 0
    })

    // ── Process-wide default device ─────────────────────────────────────────────────────
    //
    // Unless a caller injects one, every renderer on the page must land on the SAME device.
    // A device per renderer means the browser's compiled-pipeline cache is per renderer too,
    // so an SPA route change throws it away and the next route recompiles from scratch.

    it('reuses one device across sequential acquires (the SPA route-change win)', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {}
        const first = await acquireRoot({onDeviceLost: vi.fn()})
        const second = await acquireRoot({onDeviceLost: vi.fn()})
        const third = await acquireRoot({onDeviceLost: vi.fn()})

        expect(second.device).toBe(first.device)
        expect(third.device).toBe(first.device)
        expect(second.root).toBe(first.root)
        // Nobody owns it exclusively, so no single renderer's cleanup may destroy it.
        expect(first.createdDevice).toBe(false)
    })

    it('converges concurrent first-mounts on ONE device request', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {}
        const a = makeFakeDevice()
        const b = makeFakeDevice()
        mocks.initQueue.push({device: a.device}, {device: b.device})

        // Four <Shader>s mounting in the same tick, before any device exists yet.
        const ctxs = await Promise.all([
            acquireRoot({onDeviceLost: vi.fn()}),
            acquireRoot({onDeviceLost: vi.fn()}),
            acquireRoot({onDeviceLost: vi.fn()}),
            acquireRoot({onDeviceLost: vi.fn()}),
        ])

        expect(ctxs.every((c) => c.device === ctxs[0].device)).toBe(true)
        expect(mocks.initQueue.length).toBe(1) // only ONE device was actually requested
        mocks.initQueue.length = 0
    })

    it('replaces the default device once it is lost, and re-shares the replacement', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {}
        const original = makeFakeDevice()
        mocks.initQueue.push({device: original.device})
        const before = await acquireRoot({onDeviceLost: vi.fn()})
        expect(before.device).toBe(original.device)

        original.loseWith('unknown', 'GPU process crashed')
        await settle()

        const replacement = makeFakeDevice()
        mocks.initQueue.push({device: replacement.device})
        const afterA = await acquireRoot({onDeviceLost: vi.fn()})
        const afterB = await acquireRoot({onDeviceLost: vi.fn()})

        expect(afterA.device).toBe(replacement.device) // not the corpse
        expect(afterB.device).toBe(replacement.device) // and still shared
        mocks.initQueue.length = 0
    })

    it('releases a renderer\'s loss callback on unmount, so subscribers do not pile up', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {}
        const shared = makeFakeDevice()
        mocks.initQueue.push({device: shared.device})

        // Twenty mount/unmount cycles, as an SPA navigating twenty times would produce.
        const stale = vi.fn()
        for (let i = 0; i < 20; i++) {
            const ctx = await acquireRoot({onDeviceLost: stale})
            ctx.release?.()
        }
        // One live renderer remains mounted.
        const live = vi.fn()
        await acquireRoot({onDeviceLost: live})

        shared.loseWith('unknown', 'GPU process crashed')
        await settle()

        expect(live).toHaveBeenCalledTimes(1)
        expect(stale).not.toHaveBeenCalled() // every unmounted renderer stayed silent
        mocks.initQueue.length = 0
    })

    it('does not cache a FAILED acquisition — a later mount can still succeed', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {}
        mocks.initThrows = true
        await expect(acquireRoot({onDeviceLost: vi.fn()})).rejects.toThrow()

        mocks.initThrows = false
        const recovered = await acquireRoot({onDeviceLost: vi.fn()})
        expect(recovered.device).toBeTruthy()
    })

    it('loss with reason destroyed still bars the device from re-adoption', async () => {
        ;(navigator as {gpu?: unknown}).gpu = {}
        const fake = makeFakeDevice()
        const cb = vi.fn()
        await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: cb})

        fake.loseWith('destroyed', 'device.destroy() called')
        await settle()
        expect(cb).not.toHaveBeenCalled() // intentional teardown stays suppressed…

        // …but a later acquire on the destroyed device must still get a live replacement.
        const ctx = await acquireRoot({device: fake.device as unknown as GPUDevice, onDeviceLost: vi.fn()})
        expect(ctx.device).not.toBe(fake.device)
    })
})
