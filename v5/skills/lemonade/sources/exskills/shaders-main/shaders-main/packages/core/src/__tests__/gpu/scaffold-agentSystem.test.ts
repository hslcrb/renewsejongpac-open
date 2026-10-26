import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import type {GpuFragmentParams} from '@coreroot/gpu/contract'
import {
    createAgentSystem, resolveDeviceTier, resolveRenderRes, clampAgentCount, makeCpuValueGetter,
    readAgentFrame, worldSplatWindow, texelSplatWindow, energyCoverageAlpha,
    integrateSemiImplicitEuler, FIXED_POINT_GAINS, SIZE_REF_RES, R2_ALPHA, R3_ALPHA,
} from '@coreroot/gpu/scaffolds/agentSystem'

/**
 * `scaffolds/agentSystem` gate — the particle/agent simulation harness (Phase 9.2).
 *
 * Two halves, tested differently. The GPU helpers (`worldSplatWindow`, `texelSplatWindow`,
 * `energyCoverageAlpha`, `integrateSemiImplicitEuler`) are `tgpu.fn`s: resolved to WGSL and
 * snapshotted, and the pure-float pair additionally executed on the CPU as DualFns for golden
 * values (C8). The harness itself is CPU plumbing — buffers, bind groups, pipelines and the frame
 * program — so it is driven against a mock root and asserted on the calls it makes.
 */

// ─── Mock root ───────────────────────────────────────────────────────────────

function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {return buffer})}
    const texture = {$usage: vi.fn(function (this: unknown) {return texture}), destroy: vi.fn(), write: vi.fn()}
    const uniform = {buffer: {uniformBuffer: true}, write: vi.fn(), patch: vi.fn()}
    /** One shared log so DISPATCH order is observable (pipeline creation order differs). */
    const dispatchLog: number[][] = []
    /** Records every `.with()` so the extra-bind-group chaining is observable. */
    const makeGuarded = () => {
        const g = {
            withArgs: [] as unknown[],
            with: vi.fn(function (this: typeof g, bg: unknown) {this.withArgs.push(bg); return this}),
            dispatchThreads: vi.fn((...threads: number[]) => {dispatchLog.push(threads)}),
        }
        return g
    }
    const guardedList: ReturnType<typeof makeGuarded>[] = []
    return {
        createBuffer: vi.fn(() => buffer),
        createBindGroup: vi.fn((_layout: unknown, entries: unknown) => ({entries})),
        createTexture: vi.fn(() => texture),
        createUniform: vi.fn(() => uniform),
        createGuardedComputePipeline: vi.fn(() => {
            const g = makeGuarded()
            guardedList.push(g)
            return g
        }),
        guardedList,
        dispatchLog,
        uniform,
        texture,
        device: {},
    }
}

type MockRoot = ReturnType<typeof mockRoot>

function mockParams(root: MockRoot | null) {
    const cleanups: (() => void)[] = []
    const registered: unknown[] = []
    return {
        params: {
            gpu: root ? {device: root.device, root} : undefined,
            registerComputeTexture: (t: unknown) => {registered.push(t); return {key: 'compute_0', sample: vi.fn()}},
            onCleanup: (cb: () => void) => cleanups.push(cb),
        } as unknown as GpuFragmentParams,
        cleanups,
        registered,
    }
}

// A layout in the shape the real consumers declare: agent state, two atomic accumulators, the
// per-frame uniform, and the write-only output texture.
const TestParams = d.struct({dt: d.f32, count: d.f32})
const testLayout = tgpu.bindGroupLayout({
    swarm: {storage: d.arrayOf(d.vec4f, 64), access: 'mutable'},
    accumE: {storage: d.arrayOf(d.atomic(d.u32), 16), access: 'mutable'},
    accumS: {storage: d.arrayOf(d.atomic(d.u32), 16), access: 'mutable'},
    params: {uniform: TestParams},
    outTex: {storageTexture: d.textureStorage2d('rgba16float', 'write-only')},
})
const initKernel = tgpu.fn([d.u32])((i) => {'use gpu'; testLayout.$.swarm[i] = d.vec4f(d.f32(i), 0, 0, 0)}).$name('testInit')
const stepKernel = tgpu.fn([d.u32])((i) => {'use gpu'; testLayout.$.swarm[i] = d.vec4f(0, 0, 0, 0)}).$name('testStep')
const resolveKernel = tgpu.fn([d.u32, d.u32])((x, y) => {
    'use gpu'
    std_textureStoreShim(x, y)
}).$name('testResolve')
// Kept trivial on purpose — the harness test is about plumbing, not kernel bodies.
function std_textureStoreShim(_x: number, _y: number) {}

const baseConfig = () => ({
    layout: testLayout,
    params: TestParams,
    maxAgents: 64,
    output: {key: 'outTex', name: 'swarmTexture', size: [4, 4] as [number, number], format: 'rgba16float' as const},
    pipelines: {
        init: {kernel: initKernel, threads: 'max' as const},
        update: {kernel: stepKernel, threads: 'agents' as const},
        resolve: {kernel: resolveKernel, threads: 'fixed' as const, size: [4, 4] as [number, number]},
    },
    initStep: 'init',
    program: ['update', 'resolve'],
})

// ─── The harness ─────────────────────────────────────────────────────────────

describe('agentSystem (a) allocation by layout introspection', () => {
    it('allocates one state buffer per array-storage entry and binds every layout key', () => {
        const root = mockRoot()
        const {params, cleanups, registered} = mockParams(root)
        const sys = createAgentSystem(params, baseConfig())!
        expect(sys).not.toBeNull()

        // swarm + accumE + accumS — the uniform and the storage texture are not state buffers.
        expect(root.createBuffer).toHaveBeenCalledTimes(3)
        expect(root.createUniform).toHaveBeenCalledTimes(1)
        expect(root.createTexture).toHaveBeenCalledWith({size: [4, 4], format: 'rgba16float'})

        const entries = (root.createBindGroup.mock.calls[0][1] as Record<string, unknown>)
        expect(Object.keys(entries).sort()).toEqual(['accumE', 'accumS', 'outTex', 'params', 'swarm'])
        expect(entries.params).toBe(root.uniform.buffer) // the uniform's BUFFER, not the uniform
        expect(entries.outTex).toBe(root.texture)

        // The output texture is registered for the fragment and destroyed on cleanup.
        expect(registered).toEqual([root.texture])
        expect(Object.keys(sys.outputs)).toEqual(['swarmTexture'])
        cleanups.forEach((c) => c())
        expect(root.texture.destroy).toHaveBeenCalled()
    })

    it('returns null with no GPU device, so the shader can fall back', () => {
        const {params} = mockParams(null)
        expect(createAgentSystem(params, baseConfig())).toBeNull()
    })

    it('writeParams writes the whole struct (strict layout — no partial patch)', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const sys = createAgentSystem(params, baseConfig())!
        sys.writeParams({dt: 0.016, count: 12})
        expect(root.uniform.write).toHaveBeenCalledWith({dt: 0.016, count: 12})
        expect(root.uniform.patch).not.toHaveBeenCalled()
    })
})

describe('agentSystem (b) the frame program', () => {
    it('prepends the one-shot init on the first frame only', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const sys = createAgentSystem(params, baseConfig())!
        expect(sys.frame({count: 10})?.length).toBe(3) // init + update + resolve
        expect(sys.frame({count: 10})?.length).toBe(2) // steady state
        expect(sys.frame({count: 10})?.length).toBe(2)
    })

    it('re-runs the init when `reseed` changes, and not when it repeats', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const sys = createAgentSystem(params, baseConfig())!
        expect(sys.frame({count: 10, reseed: 0})?.length).toBe(3)
        expect(sys.frame({count: 10, reseed: 0})?.length).toBe(2)
        expect(sys.frame({count: 10, reseed: 7})?.length).toBe(3) // re-seeded
        expect(sys.frame({count: 10, reseed: 7})?.length).toBe(2)
    })

    it('dispatches `max` at the static bound, `agents` at the runtime count, `fixed` pre-sized', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const sys = createAgentSystem(params, baseConfig())!
        const steps = sys.frame({count: 10})!
        for (const step of steps) {
            if (typeof step === 'function') step()
            else step.dispatch()
        }
        expect(root.dispatchLog).toEqual([[64], [10], [4, 4]]) // init(max), update(count), resolve(fixed)
    })

    it('dispatches a `grid` step at the per-frame grid dimensions', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const cfg = baseConfig()
        const sys = createAgentSystem(params, {
            ...cfg,
            pipelines: {...cfg.pipelines, update: {kernel: stepKernel as never, threads: 'grid' as const}},
        })!
        const steps = sys.frame({count: 10, grid: [24, 12]})!
        steps.forEach((s) => (typeof s === 'function' ? s() : s.dispatch()))
        expect(root.dispatchLog).toContainEqual([24, 12])
    })

    it('keeps the declared program order', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const cfg = baseConfig()
        const sys = createAgentSystem(params, {
            ...cfg,
            pipelines: {
                ...cfg.pipelines,
                clear: {kernel: stepKernel, threads: 'fixed' as const, size: [16] as [number]},
            },
            program: ['clear', 'update', 'resolve'],
        })!
        const steps = sys.frame({count: 5})!
        expect(steps.length).toBe(4)
        steps.forEach((s) => (typeof s === 'function' ? s() : s.dispatch()))
        expect(root.dispatchLog).toEqual([[64], [16], [5], [4, 4]]) // init, clear, update, resolve
    })
})

describe('agentSystem (c) extra + late-bound bind groups', () => {
    it('chains the extra bind group onto marked pipelines only', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const cfg = baseConfig()
        const extraBindGroup = {sdfResources: true}
        createAgentSystem(params, {
            ...cfg,
            extraBindGroup,
            pipelines: {
                ...cfg.pipelines,
                update: {kernel: stepKernel, threads: 'agents' as const, extra: true},
            },
        })
        // init and resolve get the sim bind group only; update also gets the extra one.
        const withCounts = root.guardedList.map((g) => g.withArgs.length)
        expect(withCounts.filter((n) => n === 2).length).toBe(1)
        expect(root.guardedList.some((g) => g.withArgs.includes(extraBindGroup))).toBe(true)
    })

    it('defers the bind group (and every dispatch) until an external key is bound', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const sys = createAgentSystem(params, {...baseConfig(), externalKeys: ['swarm']})!
        // Nothing bindable yet: no bind group, no pipelines, and no frame.
        expect(root.createBindGroup).not.toHaveBeenCalled()
        expect(sys.frame({count: 10})).toBeNull()

        sys.bindExternal({swarm: undefined}) // input not ready — still deferred
        expect(root.createBindGroup).not.toHaveBeenCalled()
        expect(sys.frame({count: 10})).toBeNull()

        const childRtt = {childTexture: true}
        sys.bindExternal({swarm: childRtt})
        expect((root.createBindGroup.mock.calls[0][1] as Record<string, unknown>).swarm).toBe(childRtt)
        expect(sys.frame({count: 10})?.length).toBe(3)
    })
})

describe('agentSystem (d) count + device tiering', () => {
    // The tier comes from `isMobileGpuViewport()`, which reads `matchMedia('(pointer: coarse)')` and
    // the viewport size. Stub both rather than relying on happy-dom's defaults, so "tests resolve the
    // desktop tier" is a property of this test and not of the DOM shim's configuration.
    const realMatchMedia = window.matchMedia
    beforeEach(() => {
        window.matchMedia = ((query: string) => ({
            matches: false, media: query, addEventListener() {}, removeEventListener() {},
        })) as unknown as typeof window.matchMedia
        Object.defineProperty(window, 'innerWidth', {value: 1920, configurable: true, writable: true})
        Object.defineProperty(window, 'innerHeight', {value: 1080, configurable: true, writable: true})
    })
    afterEach(() => { window.matchMedia = realMatchMedia })

    it('caps the count at the device tier without touching the prop range', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        const sys = createAgentSystem(params, {...baseConfig(), countCap: {desktop: 40, mobile: 8}})!
        expect(sys.countCap).toBe(40) // tests resolve the desktop tier
        expect(sys.resolveCount(1000)).toBe(40) // above the cap
        expect(sys.resolveCount(25)).toBe(25)
        expect(sys.resolveCount(1)).toBe(16) // default floor
        expect(sys.resolveCount(1, 500)).toBe(40) // floor above the cap → cap wins
    })

    it('falls back to maxAgents when no tier is declared', () => {
        const root = mockRoot()
        const {params} = mockParams(root)
        expect(createAgentSystem(params, baseConfig())!.countCap).toBe(64)
    })

    it('device tiering, count clamping and the fixed size reference', () => {
        expect(resolveDeviceTier({desktop: 1024, mobile: 512})).toBe(1024) // SSR/tests → desktop
        expect(resolveRenderRes({desktop: 1024, mobile: 640})).toBe(1024)
        expect(clampAgentCount(3.4, 1, 10)).toBe(3)
        expect(clampAgentCount(-5, 16, 100)).toBe(16)
        expect(clampAgentCount(1e9, 16, 100)).toBe(100)
        // Sizes are authored against this, never the tiered resolution — see resolveRenderRes.
        expect(SIZE_REF_RES).toBe(1024)
    })
})

describe('agentSystem (e) frame + prop readers', () => {
    it('clamps dt in both directions and guards the aspect divide', () => {
        expect(readAgentFrame({deltaTime: 0.016, dimensions: {width: 800, height: 400}})).toEqual({
            dt: 0.016, aspect: 2, pointerX: 0.5, pointerY: 0.5,
        })
        expect(readAgentFrame({deltaTime: 5}).dt).toBe(0.033) // a tab-switch stall, not a 5s step
        expect(readAgentFrame({deltaTime: 0}).dt).toBe(0.001)
        expect(readAgentFrame({}).dt).toBe(0.016)
        expect(readAgentFrame({dimensions: {width: 800, height: 0}}).aspect).toBe(16 / 9)
        expect(readAgentFrame({dimensions: {width: 800, height: 0}}, 1).aspect).toBe(1)
        expect(readAgentFrame({pointer: {x: 0.25, y: 0.75}})).toMatchObject({pointerX: 0.25, pointerY: 0.75})
    })

    it('the numeric prop reader falls back when a dynamic prop resolves to a non-number', () => {
        const g = makeCpuValueGetter((key) => ({num: 3, str: 'auto', nil: undefined})[key])
        expect(g('num', 9)).toBe(3)
        expect(g('str', 9)).toBe(9)
        expect(g('nil', 9)).toBe(9)
        expect(g('missing', 9)).toBe(9)
    })
})

describe('agentSystem (f) shared constants', () => {
    it('the fixed-point gains keep hard interiors opaque through the 1−e⁻ᵏ alpha curve', () => {
        expect(FIXED_POINT_GAINS).toEqual({HARD: 637, SOFT: 255})
        // A hard interior (coverage 1) at the SOFT gain would resolve to 80% grey, not opaque.
        expect(1 - Math.exp(-1.6 * (FIXED_POINT_GAINS.SOFT / 255))).toBeCloseTo(0.798, 3)
        expect(1 - Math.exp(-1.6 * (FIXED_POINT_GAINS.HARD / 255))).toBeGreaterThan(0.98)
    })

    it('the low-discrepancy strides are the plastic-constant sequences', () => {
        expect(R2_ALPHA).toEqual([0.7548776662466927, 0.5698402909980532])
        expect(R3_ALPHA).toEqual([0.8191725133961645, 0.6710436067037893, 0.5497004779019703])
    })
})

// ─── GPU helpers ─────────────────────────────────────────────────────────────

describe('agentSystem (g) splat windows resolve to WGSL', () => {
    it('the world-space window carries the per-axis aspect divide and a guarded aspect', () => {
        const wgsl = tgpu.resolve([worldSplatWindow], {names: 'strict'})
        expect(wgsl).toMatch(/fn worldSplatWindow/)
        expect(wgsl).toMatch(/struct SplatWindow/)
        expect(wgsl).toMatch(/max\(aspect, 1e-5f\)/) // never an unguarded divide (D-1)
        expect(wgsl).toMatch(/\/ asp\)/) // the x radius is aspect-narrower than the y radius
        expect(wgsl).toMatchSnapshot('worldSplatWindow')
    })

    it('the texel-space window is isotropic and takes a per-frame target extent', () => {
        const wgsl = tgpu.resolve([texelSplatWindow], {names: 'strict'})
        expect(wgsl).toMatch(/fn texelSplatWindow/)
        expect(wgsl).not.toMatch(/aspect/) // square render texels — no aspect term survives
        expect(wgsl).toMatch(/last\.x/)
        expect(wgsl).toMatchSnapshot('texelSplatWindow')
    })
})

describe('agentSystem (h) resolve + integrate helpers', () => {
    it('the alpha curve saturates, starts at zero, and resolves to WGSL', () => {
        // Pure-float DualFn — executable on the CPU for golden values (C8).
        expect(energyCoverageAlpha(0, 1.6)).toBe(0)
        expect(energyCoverageAlpha(1, 1.6)).toBeCloseTo(1 - Math.exp(-1.6), 6)
        expect(energyCoverageAlpha(1000, 1.6)).toBeCloseTo(1, 6) // saturating, never clipping
        const wgsl = tgpu.resolve([energyCoverageAlpha], {names: 'strict'})
        expect(wgsl).toMatch(/exp\(\(\(energy \* k\) \* -1f\)\)/)
        expect(wgsl).toMatchSnapshot('energyCoverageAlpha')
    })

    it('the integrator applies drag then clamps speed, and resolves to WGSL', () => {
        const wgsl = tgpu.resolve([integrateSemiImplicitEuler], {names: 'strict'})
        expect(wgsl).toMatch(/fn integrateSemiImplicitEuler/)
        // Velocity first (semi-implicit), drag as a precomputed multiplier, then the safety clamp.
        expect(wgsl).toMatch(/\(vel(_\d+)? \+ \(force \* dt\)\) \* dragMul/)
        expect(wgsl).toMatch(/min\(spd, maxSpeed\) \/ max\(spd, 1e-5f\)/)
        expect(wgsl).toMatchSnapshot('integrateSemiImplicitEuler')
    })
})
