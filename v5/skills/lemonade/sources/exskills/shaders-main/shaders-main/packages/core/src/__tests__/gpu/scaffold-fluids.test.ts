import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {
    buildStableFluidsKernels, buildFluidOutputKernel, neighbourIndex,
    type StableFluidsKernels,
} from '@coreroot/gpu/scaffolds/fluids'
import {gaussianBrushSq, gaussianBrushShiftedSq, gaussianBrushFnSq} from '@coreroot/gpu/scaffolds/simShared'
import {createPointerVelocityTracker, createIdleGate, decayFadeSeconds, pathStampRibbon} from '@coreroot/gpu/kit/host/pointer'
import type {ComputeStep} from '@coreroot/gpu/porters'

import * as Fog from '@coreroot/shaders/Fog/index'
import * as Smoke from '@coreroot/shaders/Smoke/index'
import * as SmokeFlow from '@coreroot/shaders/SmokeFlow/index'
import * as InkFlow from '@coreroot/shaders/InkFlow/index'
import * as ParticleFlow from '@coreroot/shaders/ParticleFlow/index'
import * as SmokeFill from '@coreroot/shaders/SmokeFill/index'

/**
 * Phase 9.1 gate — the Stable-Fluids solver extracted from six shaders.
 *
 * The per-shader test files only assert that a couple of kernels resolve, so before this file the
 * solver's WGSL had no snapshot anywhere. These snapshots ARE the regression gate for any future
 * change to `scaffolds/fluids.ts`: every consumer's whole kernel set is resolved here.
 */

const N = 8 // small grid: the WGSL is identical in shape, and the array bounds stay readable

function tinyLayout() {
    const Params = d.struct({dt: d.f32, curlStrength: d.f32, velFade: d.f32, dyeFade: d.f32, colorDecay: d.f32})
    return tgpu.bindGroupLayout({
        velA: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
        velB: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
        dyeA: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
        dyeB: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
        pressure: {storage: d.arrayOf(d.f32, N * N), access: 'mutable'},
        divergence: {storage: d.arrayOf(d.f32, N * N), access: 'mutable'},
        params: {uniform: Params},
    })
}

function resolveAll(kernels: StableFluidsKernels): string {
    const fns = Object.values(kernels).filter(Boolean)
    return fns.map((fn) => tgpu.resolve([fn as never], {names: 'strict'})).join('\n')
}

describe('fluids scaffold (a) kernel sets resolve per configuration', () => {
    it('clamped + densityAge: every pass resolves with the consumer name prefix', () => {
        const kernels = buildStableFluidsKernels(tinyLayout(), {
            n: N, namePrefix: 'gateA', boundary: 'clamped', dye: 'densityAge',
            dyeDissipation: true, ageAdvance: true,
        })
        const wgsl = resolveAll(kernels)
        for (const pass of ['Curl', 'Vorticity', 'Divergence', 'Jacobi', 'GradSubtract', 'AdvectVel', 'CopyVel', 'AdvectDens', 'CopyDens']) {
            expect(wgsl).toContain(`gateA${pass}`)
        }
        expect(wgsl).toContain('fn nidx')
        expect(wgsl).toMatchSnapshot('clamped-densityAge')
    })

    it('toroidal wraps instead of clamping, and the velocity cap only appears when asked for', () => {
        const capped = buildStableFluidsKernels(tinyLayout(), {
            n: N, namePrefix: 'gateT', boundary: 'toroidal', dye: 'densityAge', velocityCap: 4.8,
        })
        const wgsl = resolveAll(capped)
        expect(wgsl).toContain('fn nw')
        expect(wgsl).not.toContain('fn nidx')
        expect(wgsl).toContain('4.8')
        // No dissipation configured → nothing READS dyeFade (the struct still declares it).
        expect(wgsl).not.toMatch(/\(\*p\)\.dyeFade/)
        expect(wgsl).toMatchSnapshot('toroidal-capped')

        const uncapped = resolveAll(buildStableFluidsKernels(tinyLayout(), {
            n: N, namePrefix: 'gateU', boundary: 'toroidal', dye: 'densityAge',
        }))
        expect(uncapped).not.toContain('4.8')
    })

    it('dye: none omits the dye passes; publishVelocityTexture folds a store into the copy pass', () => {
        const Params = d.struct({dt: d.f32, curlStrength: d.f32, velFade: d.f32})
        const layout = tgpu.bindGroupLayout({
            velA: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
            velB: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
            pressure: {storage: d.arrayOf(d.f32, N * N), access: 'mutable'},
            divergence: {storage: d.arrayOf(d.f32, N * N), access: 'mutable'},
            params: {uniform: Params},
            velOutTex: {storageTexture: d.textureStorage2d('rgba16float', 'write-only')},
        })
        const kernels = buildStableFluidsKernels(layout, {
            n: N, namePrefix: 'gateV', boundary: 'clamped', dye: 'none', publishVelocityTexture: true,
        })
        expect(kernels.advectDye).toBeUndefined()
        expect(kernels.copyDye).toBeUndefined()
        expect(tgpu.resolve([kernels.copyVel as never], {names: 'strict'})).toContain('textureStore')
    })

    it('rgb dye advects three channels; the output kernel writes opaque alpha', () => {
        const layout = tinyLayout()
        const kernels = buildStableFluidsKernels(layout, {
            n: N, namePrefix: 'gateRgb', boundary: 'clamped', dye: 'rgb', dyeDissipation: true,
        })
        const advect = tgpu.resolve([kernels.advectDye as never], {names: 'strict'})
        expect(advect).toContain('gateRgbAdvectDye')
        expect(advect).toMatch(/\.z/) // the blue channel — densityAge never touches it

        const outLayout = tgpu.bindGroupLayout({
            dyeA: {storage: d.arrayOf(d.vec4f, N * N), access: 'readonly'},
            outTex: {storageTexture: d.textureStorage2d('rgba16float', 'write-only')},
        })
        const rgbOut = tgpu.resolve([buildFluidOutputKernel(outLayout, {n: N, namePrefix: 'gateRgb', dye: 'rgb'})], {names: 'strict'})
        expect(rgbOut).toMatch(/textureStore\(outTex, vec2u\(cx, cy\), vec4f\(.*1f\)\)/)
        const densOut = tgpu.resolve([buildFluidOutputKernel(outLayout, {n: N, namePrefix: 'gateDens', dye: 'densityAge'})], {names: 'strict'})
        expect(densOut).toMatch(/0f, 0f\)\)/)
    })

    it('solidMask turns mask cells into walls in the divergence pass', () => {
        const Params = d.struct({dt: d.f32, curlStrength: d.f32, velFade: d.f32, dyeFade: d.f32, colorDecay: d.f32})
        const layout = tgpu.bindGroupLayout({
            velA: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
            velB: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
            dyeA: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
            dyeB: {storage: d.arrayOf(d.vec4f, N * N), access: 'mutable'},
            pressure: {storage: d.arrayOf(d.f32, N * N), access: 'mutable'},
            divergence: {storage: d.arrayOf(d.f32, N * N), access: 'mutable'},
            maskBuf: {storage: d.arrayOf(d.vec4f, N * N), access: 'readonly'},
            params: {uniform: Params},
        })
        const kernels = buildStableFluidsKernels(layout, {
            n: N, namePrefix: 'gateMask', boundary: 'clamped', dye: 'densityAge',
            dyeDissipation: true, ageAdvance: true, solidMask: true,
        })
        const div = tgpu.resolve([kernels.divergence], {names: 'strict'})
        expect(div).toContain('maskBuf')
        expect(tgpu.resolve([kernels.advectVel], {names: 'strict'})).toContain('maskBuf')
        expect(div).toMatchSnapshot('masked-divergence')
    })

    it('rejects the option combinations that have no kernel branch', () => {
        // densityAge only implements dissipation+age together or neither; one without the other used
        // to fall through to the "neither" branch and silently drop the requested behaviour.
        expect(() => buildStableFluidsKernels(tinyLayout(), {
            n: N, namePrefix: 'badXor', boundary: 'clamped', dye: 'densityAge', dyeDissipation: true,
        })).toThrow(/dyeDissipation and ageAdvance/)
        expect(() => buildStableFluidsKernels(tinyLayout(), {
            n: N, namePrefix: 'badXor', boundary: 'clamped', dye: 'densityAge', ageAdvance: true,
        })).toThrow(/dyeDissipation and ageAdvance/)
        // solidMask's divergence pass assumes clamped edges, so a toroidal field with interior walls
        // would sample wrapped neighbours against hard-coded edge walls.
        expect(() => buildStableFluidsKernels(tinyLayout(), {
            n: N, namePrefix: 'badMask', boundary: 'toroidal', dye: 'densityAge',
            dyeDissipation: true, ageAdvance: true, solidMask: true,
        })).toThrow(/solidMask requires boundary 'clamped'/)
    })

    it('C3: two configurations in one tree do not collide, and one config shares its neighbour fn', () => {
        const a = buildStableFluidsKernels(tinyLayout(), {n: N, namePrefix: 'twinA', boundary: 'clamped', dye: 'densityAge'})
        const b = buildStableFluidsKernels(tinyLayout(), {n: N, namePrefix: 'twinB', boundary: 'toroidal', dye: 'densityAge'})
        const both = tgpu.resolve([a.jacobi, b.jacobi], {names: 'strict'})
        expect(both).toContain('twinAJacobi')
        expect(both).toContain('twinBJacobi')
        // Memoized per (n, boundary): the whole set shares ONE nidx, so it is declared once.
        const set = tgpu.resolve([a.curl, a.jacobi, a.gradSubtract], {names: 'strict'})
        expect(set.match(/fn nidx/g)).toHaveLength(1)
        expect(neighbourIndex(N, 'clamped')).toBe(neighbourIndex(N, 'clamped'))
        expect(neighbourIndex(N, 'clamped')).not.toBe(neighbourIndex(N, 'toroidal'))
    })
})

describe('fluids scaffold (b) the six consumers', () => {
    const consumers = [
        ['Fog', Fog], ['Smoke', Smoke], ['SmokeFlow', SmokeFlow],
        ['InkFlow', InkFlow], ['ParticleFlow', ParticleFlow], ['SmokeFill', SmokeFill],
    ] as const

    it.each(consumers)('%s resolves its whole solver chain', (name, mod) => {
        const m = mod as unknown as Record<string, unknown>
        // ParticleFlow prefixes its kernel exports; everything else uses the bare names.
        const keys = Object.keys(m).filter((k) => /Kernel$/.test(k) && !/^make/.test(k))
        expect(keys.length).toBeGreaterThan(5)
        const wgsl = keys.map((k) => tgpu.resolve([m[k] as never], {names: 'strict'})).join('\n')
        expect(wgsl).toMatchSnapshot(`${name}-kernels`)
    })
})

describe('simShared (c) gaussian brush', () => {
    it('the edge-shifted form reaches exactly zero at the brush edge; the plain form does not', () => {
        // Pure-float fns are CPU-executable under vitest (C8), so these are golden values.
        expect(gaussianBrushSq(0, 4)).toBeCloseTo(1, 6)
        expect(gaussianBrushSq(4, 4)).toBeCloseTo(Math.exp(-1), 6) // the 37% step that staircases
        expect(gaussianBrushShiftedSq(0, 4)).toBeCloseTo(1, 6)
        expect(gaussianBrushShiftedSq(4, 4)).toBeCloseTo(0, 6)
        expect(gaussianBrushShiftedSq(9, 4)).toBe(0) // clamped flat beyond the radius
    })

    it('the option record selects the form (structural, C5)', () => {
        expect(gaussianBrushFnSq({edgeShift: true})).toBe(gaussianBrushShiftedSq)
        expect(gaussianBrushFnSq({edgeShift: false})).toBe(gaussianBrushSq)
    })
})

describe('host/pointer (d) tracker, idle gate, ribbon', () => {
    it('tracks delta and per-second velocity from the previous position', () => {
        const t = createPointerVelocityTracker({smoothing: 1, initialX: 0.5, initialY: 0.5})
        const f = t.update({x: 0.6, y: 0.5}, 0.1)
        expect(f.prevX).toBeCloseTo(0.5)
        expect(f.dx).toBeCloseTo(0.1)
        expect(f.velX).toBeCloseTo(1)
        expect(f.smoothVelX).toBeCloseTo(1) // smoothing 1 → no lag
        expect(f.moving).toBe(true)
    })

    it('the teleport guard absorbs a jump: zero motion this frame, measured from the new spot next', () => {
        const t = createPointerVelocityTracker({teleportGuard: 0.25, initialX: 0.1, initialY: 0.1})
        const jump = t.update({x: 0.9, y: 0.9}, 0.016)
        expect(jump.teleport).toBe(true)
        expect(jump.moving).toBe(false)
        expect(jump.dx).toBe(0)
        expect(jump.velX).toBe(0)
        expect(jump.smoothVelX).toBe(0)
        expect(jump.dragDist).toBeGreaterThan(0.25) // the raw distance is still reported
        // Next frame measures from 0.9, not from the stale 0.1.
        expect(t.update({x: 0.91, y: 0.9}, 0.016).dx).toBeCloseTo(0.01)
    })

    it('a sub-minDrag twitch is not a stroke; a missing pointer holds position', () => {
        const t = createPointerVelocityTracker({minDrag: 0.0006, initialX: 0.5, initialY: 0.5})
        expect(t.update({x: 0.5001, y: 0.5}, 0.016).moving).toBe(false)
        const held = t.update(undefined, 0.016)
        expect(held.x).toBeCloseTo(0.5001)
        expect(held.dx).toBe(0)
    })

    it('a seen:false park is held in place; the first REAL sample snaps with zero delta', () => {
        const t = createPointerVelocityTracker({minDrag: 0.0006, initialX: 0.5, initialY: 0.5, teleportGuard: Number.POSITIVE_INFINITY})
        // Renderer parks the pointer (fallback 0.5 center) until the first real event.
        const parked = t.update({x: 0.5, y: 0.5, seen: false}, 0.016)
        expect(parked.moving).toBe(false)
        expect(parked.dx).toBe(0)
        // First real event lands far away — no impulse/streak across the transition, even with the
        // teleport guard disabled (CursorTrail's config).
        const first = t.update({x: 0.9, y: 0.1, seen: true}, 0.016)
        expect(first.dx).toBe(0)
        expect(first.dragDist).toBe(0)
        expect(first.moving).toBe(false)
        // Subsequent motion measures from the real position.
        expect(t.update({x: 0.92, y: 0.1, seen: true}, 0.016).dx).toBeCloseTo(0.02)
    })

    it('hosts that never set `seen` keep the legacy behaviour (first sample measures from initial)', () => {
        const t = createPointerVelocityTracker({smoothing: 1, initialX: 0.5, initialY: 0.5})
        expect(t.update({x: 0.6, y: 0.5}, 0.1).dx).toBeCloseTo(0.1)
    })

    it('the idle gate skips only after the fade window, and never before the warm-up', () => {
        const gate = createIdleGate()
        expect(gate.shouldSkip(5)).toBe(true) // nothing has ever driven it
        gate.markActive()
        gate.tickFrame(2)
        expect(gate.shouldSkip(5)).toBe(false) // inside the window: keep evolving
        gate.tickFrame(4)
        expect(gate.shouldSkip(5)).toBe(true)
        expect(gate.shouldSkip(5, true)).toBe(false) // something is driving it

        // The clock is SIMULATED time: a tab hidden for minutes steps zero frames, so on return
        // the still-visible field must keep evolving rather than freeze mid-decay.
        const parked = createIdleGate()
        parked.markActive()
        parked.tickFrame(0.016)
        expect(parked.shouldSkip(5)).toBe(false)

        const warming = createIdleGate({warmupFrames: 2})
        expect(warming.shouldSkip(5)).toBe(false)
        warming.tickFrame(0.016)
        expect(warming.shouldSkip(5)).toBe(false)
        warming.tickFrame(0.016)
        expect(warming.shouldSkip(5)).toBe(true)
    })

    it('decayFadeSeconds floors the rate so a near-zero dissipation cannot open an infinite window', () => {
        expect(decayFadeSeconds(255, 1)).toBeCloseTo(Math.log(255))
        expect(decayFadeSeconds(64, 0)).toBeCloseTo(Math.log(64) / 0.05)
    })

    it('the stamp ribbon interleaves write thunks with dispatches at cell centres', () => {
        const nodes: ComputeStep[] = []
        const pass = {dispatchThreads: () => undefined} as unknown as ComputeStep
        const written: Array<[number, number, number]> = []
        const count = pathStampRibbon(nodes, {
            fromX: 0, fromY: 0, dx: 0.4, dy: 0, dragDist: 0.4, stepSize: 0.1,
            maxSteps: 16, scale: 100,
            write: (x, y, t) => written.push([x, y, t]),
            pass,
        })
        expect(count).toBe(4)
        expect(nodes).toHaveLength(8)
        expect(nodes[1]).toBe(pass)
        expect(written).toHaveLength(0) // writes happen at dispatch time, not build time
        for (const n of nodes) if (typeof n === 'function') n()
        expect(written.map((w) => w[2])).toEqual([0.125, 0.375, 0.625, 0.875])
        expect(written[0][0]).toBeCloseTo(5) // 0.125 · 0.4 · 100
    })

    it('maxSteps caps a fast flick, and prepare runs once per stamp at build time', () => {
        const nodes: ComputeStep[] = []
        const order: number[] = []
        let seq = 0
        const count = pathStampRibbon(nodes, {
            fromX: 0, fromY: 0, dx: 1, dy: 0, dragDist: 1, stepSize: 0.001, maxSteps: 3,
            prepare: () => seq++,
            write: (_x, _y, _t, prepared) => order.push(prepared),
            pass: {dispatchThreads: () => undefined} as unknown as ComputeStep,
        })
        expect(count).toBe(3)
        expect(seq).toBe(3) // resolved during the build, in stamp order
        for (const n of nodes) if (typeof n === 'function') n()
        expect(order).toEqual([0, 1, 2])
    })
})
