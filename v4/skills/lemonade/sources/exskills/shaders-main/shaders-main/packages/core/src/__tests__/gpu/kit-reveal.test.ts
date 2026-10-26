import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import * as reveal from '@coreroot/gpu/kit/reveal'

/**
 * Golden-value + resolve gates for kit/reveal — the wipe/transition family's shared machinery
 * (extracted from the 11 pointwise wipes in the Transitions category). Every fn here is pure float
 * math with no hash and no texture, so they are CPU-executable as DualFns under vitest and get
 * golden-value assertions on top of the WGSL resolve gate (C8).
 */

const DEG = Math.PI / 180
const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)
}
/** The reference implementation of the reveal tail, as it read in all 11 shaders before extraction. */
const refReveal = (coord: number, progress: number, feather: number, invert: number) => {
    const c = invert > 0 ? 1 - coord : coord
    const f = Math.max(feather, 0.0001)
    const front = progress * (1 + 2 * f) - f
    return smoothstep(front - f, front + f, c)
}

describe('reveal — revealMask (the shared wipe tail)', () => {
    it('progress 0 is fully visible and progress 1 fully wiped, at any feather', () => {
        for (const f of [0, 0.1, 0.5, 1]) {
            for (const coord of [0, 0.25, 0.5, 0.75, 1]) {
                expect(reveal.revealMask(coord, 0, f, -1)).toBeCloseTo(1, 5)
                expect(reveal.revealMask(coord, 1, f, -1)).toBeCloseTo(0, 5)
            }
        }
    })
    it('matches the pre-extraction reference across the parameter space', () => {
        for (const coord of [0, 0.3, 0.62, 1]) {
            for (const progress of [0.1, 0.5, 0.87]) {
                for (const feather of [0, 0.15, 0.6]) {
                    for (const invert of [-1, 1]) {
                        expect(reveal.revealMask(coord, progress, feather, invert))
                            .toBeCloseTo(refReveal(coord, progress, feather, invert), 5)
                    }
                }
            }
        }
    })
    it('invert flips the coordinate, not the progress (the feather stays on one side of the front)', () => {
        expect(reveal.revealMask(0.3, 0.5, 0.1, 1)).toBeCloseTo(reveal.revealMask(0.7, 0.5, 0.1, -1), 6)
    })
})

describe('reveal — applyReveal', () => {
    it('scales alpha only, RGB preserved (straight-alpha convention)', () => {
        const out = [...reveal.applyReveal(d.vec4f(0.8, 0.6, 0.4, 0.9), 0.5)]
        expect(out[0]).toBeCloseTo(0.8, 6)
        expect(out[1]).toBeCloseTo(0.6, 6)
        expect(out[2]).toBeCloseTo(0.4, 6)
        expect(out[3]).toBeCloseTo(0.45, 6)
    })
})

describe('reveal — directionalCoord', () => {
    it('angle 0 runs 0→1 across the frame regardless of aspect', () => {
        for (const aspect of [1, 2, 0.5]) {
            expect(reveal.directionalCoord(d.vec2f(0, 0.5), aspect, 0)).toBeCloseTo(0, 5)
            expect(reveal.directionalCoord(d.vec2f(0.5, 0.5), aspect, 0)).toBeCloseTo(0.5, 5)
            expect(reveal.directionalCoord(d.vec2f(1, 0.5), aspect, 0)).toBeCloseTo(1, 5)
        }
    })
    it('angle 90 runs along y; the center is always 0.5', () => {
        expect(reveal.directionalCoord(d.vec2f(0.5, 0), 1.6, 90)).toBeCloseTo(0, 5)
        expect(reveal.directionalCoord(d.vec2f(0.5, 1), 1.6, 90)).toBeCloseTo(1, 5)
        expect(reveal.directionalCoord(d.vec2f(0.5, 0.5), 1.6, 45)).toBeCloseTo(0.5, 5)
    })
    it('reaches both extremes exactly at a diagonal (normalized by its own half-extent)', () => {
        const aspect = 2
        const a = 45 * DEG
        const dir = [Math.cos(a), Math.sin(a)]
        const ext = 0.5 * (aspect * Math.abs(dir[0]) + Math.abs(dir[1]))
        const ref = (ux: number, uy: number) =>
            ((ux - 0.5) * aspect * dir[0] + (uy - 0.5) * dir[1]) / (2 * ext) + 0.5
        expect(reveal.directionalCoord(d.vec2f(0, 0), aspect, 45)).toBeCloseTo(ref(0, 0), 5)
        expect(reveal.directionalCoord(d.vec2f(1, 1), aspect, 45)).toBeCloseTo(ref(1, 1), 5)
        expect(reveal.directionalCoord(d.vec2f(0, 0), aspect, 45)).toBeCloseTo(0, 5)
        expect(reveal.directionalCoord(d.vec2f(1, 1), aspect, 45)).toBeCloseTo(1, 5)
    })
})

describe('reveal — radialCornerNormCoord', () => {
    it('0 at the center and 1 at the farthest corner', () => {
        const center = d.vec2f(0.5, 0.5)
        expect(reveal.radialCornerNormCoord(d.vec2f(0.5, 0.5), 1, center)).toBeCloseTo(0, 5)
        expect(reveal.radialCornerNormCoord(d.vec2f(0, 0), 1, center)).toBeCloseTo(1, 5)
        expect(reveal.radialCornerNormCoord(d.vec2f(1, 1), 1, center)).toBeCloseTo(1, 5)
    })
    it('still reaches 1 for an off-center origin (normalized by the FARTHEST corner)', () => {
        // center (0.2, 0.2) is y-flipped to (0.2, 0.8) → the farthest uv corner is (1, 0).
        const c = d.vec2f(0.2, 0.2)
        expect(reveal.radialCornerNormCoord(d.vec2f(1, 0), 1, c)).toBeCloseTo(1, 5)
        expect(reveal.radialCornerNormCoord(d.vec2f(0.2, 0.8), 1, c)).toBeCloseTo(0, 5)
        // No corner exceeds 1.
        for (const [x, y] of [[0, 0], [0, 1], [1, 1]]) {
            expect(reveal.radialCornerNormCoord(d.vec2f(x, y), 1, c)).toBeLessThanOrEqual(1)
        }
    })
    it('is center-scaled at non-square aspects (D-1 canonical)', () => {
        const aspect = 2
        const c = d.vec2f(0.25, 0.5)
        const cx = 0.25 * aspect
        const cy = 0.5
        const dist = Math.hypot(0.75 * aspect - cx, 0.5 - cy)
        const maxDist = Math.hypot(Math.max(cx, aspect - cx), Math.max(cy, 1 - cy))
        expect(reveal.radialCornerNormCoord(d.vec2f(0.75, 0.5), aspect, c)).toBeCloseTo(dist / maxDist, 5)
    })
})

describe('reveal — angularCoord', () => {
    const C = () => d.vec2f(0.5, 0.5)
    it('mode 0 sweeps clockwise from startAngle (0 just past the start ray)', () => {
        // startDeg 0 ⇒ the +x ray. Just above it the fraction is ~0, just below it ~1.
        expect(reveal.angularCoord(d.vec2f(0.9, 0.5 + 1e-4), 1, C(), 0, 0)).toBeLessThan(0.01)
        expect(reveal.angularCoord(d.vec2f(0.9, 0.5 - 1e-4), 1, C(), 0, 0)).toBeGreaterThan(0.99)
    })
    it('mode 1 is the mirror of mode 0', () => {
        const uv = d.vec2f(0.8, 0.7)
        const cw = reveal.angularCoord(uv, 1, C(), 30, 0)
        const ccw = reveal.angularCoord(uv, 1, C(), 30, 1)
        expect(ccw).toBeCloseTo(1 - cw, 5)
    })
    it('mode 2 folds both wedges and doubles back into [0,1]', () => {
        const uv = d.vec2f(0.8, 0.7)
        const cw = reveal.angularCoord(uv, 1, C(), 30, 0)
        const both = reveal.angularCoord(uv, 1, C(), 30, 2)
        expect(both).toBeCloseTo(Math.min(cw, 1 - cw) * 2, 5)
        expect(both).toBeGreaterThanOrEqual(0)
        expect(both).toBeLessThanOrEqual(1)
    })
    it('startAngle rotates the sweep origin', () => {
        // A point on the +y ray is a quarter turn from start 0 and on the start ray at start 90.
        expect(reveal.angularCoord(d.vec2f(0.5, 0.9), 1, C(), 0, 0)).toBeCloseTo(0.25, 4)
        expect(reveal.angularCoord(d.vec2f(0.5, 0.9), 1, C(), 90, 0)).toBeCloseTo(0, 4)
    })
})

describe('reveal — cellGrid', () => {
    it('cell index + in-cell position + grid resolution for square-ish cells', () => {
        const g = reveal.cellGrid(d.vec2f(0.32, 0.6), 2, 0.1)
        // gridX = 10, gridY = max(10/2, 1) = 5.
        expect([...g.grid][0]).toBeCloseTo(10, 5)
        expect([...g.grid][1]).toBeCloseTo(5, 5)
        expect([...g.cell][0]).toBeCloseTo(3, 5)
        expect([...g.cell][1]).toBeCloseTo(3, 5)
        expect([...g.local][0]).toBeCloseTo(0.2, 4)
        expect([...g.local][1]).toBeCloseTo(0, 4)
    })
    it('never degenerates below one row on a very wide frame', () => {
        const g = reveal.cellGrid(d.vec2f(0.5, 0.5), 5, 0.5)
        // gridX = 2, gridX / aspect = 0.4 → floored to 1 row.
        expect([...g.grid][1]).toBeCloseTo(1, 5)
        expect([...g.cell][1]).toBeCloseTo(0, 5)
    })
    it('guards a zero size', () => {
        expect(Number.isFinite([...reveal.cellGrid(d.vec2f(0.5, 0.5), 1, 0).grid][0])).toBe(true)
    })
})

describe('reveal — modifiers', () => {
    it('foldAboutCenter: 0 on the center line, 1 at both ends', () => {
        expect(reveal.foldAboutCenter(0.5)).toBeCloseTo(0, 6)
        expect(reveal.foldAboutCenter(0)).toBeCloseTo(1, 6)
        expect(reveal.foldAboutCenter(1)).toBeCloseTo(1, 6)
        expect(reveal.foldAboutCenter(0.25)).toBeCloseTo(0.5, 6)
    })
    it('tilePhase: per-tile phase in [0,1), identical in every tile', () => {
        expect(reveal.tilePhase(0.1, 5)).toBeCloseTo(0.5, 5)
        expect(reveal.tilePhase(0.3, 5)).toBeCloseTo(0.5, 5)
        expect(reveal.tilePhase(0.2, 5)).toBeCloseTo(0, 5)
    })
})

describe('reveal — coverage modifiers over the families', () => {
    it('bandMidpointCoord: each band shares its midpoint coverage, in [0,1]', () => {
        // 4 bands → midpoints 0.125, 0.375, 0.625, 0.875.
        expect(reveal.bandMidpointCoord(0.1, 4)).toBeCloseTo(0.125, 5)
        expect(reveal.bandMidpointCoord(0.24, 4)).toBeCloseTo(0.125, 5)
        expect(reveal.bandMidpointCoord(0.6, 4)).toBeCloseTo(0.625, 5)
        expect(reveal.bandMidpointCoord(0.99, 4)).toBeCloseTo(0.875, 5)
        // Count floored at one band.
        expect(reveal.bandMidpointCoord(0.7, 0)).toBeCloseTo(0.5, 5)
    })
    // bandShuffleCoord and cellShuffleCoord hash through raw-WGSL fns (hash11/hash12), which
    // cannot execute on the CPU — they are covered by the resolve gate below instead.
    it('cellDiamondCoord: 0 at the cell center, 1 at the cell corners', () => {
        // size 0.1, aspect 1 → 10×10 grid; uv (0.05, 0.05) is a cell center, (0.1, 0.1) a corner.
        expect(reveal.cellDiamondCoord(d.vec2f(0.05, 0.05), 1, 0.1)).toBeCloseTo(0, 4)
        expect(reveal.cellDiamondCoord(d.vec2f(0.1 - 1e-6, 0.1 - 1e-6), 1, 0.1)).toBeCloseTo(1, 3)
    })
    it('cellCheckerCoord: parity staggers the halves — odd cells lag even cells by 0.5', () => {
        // 10×10 grid: cell (0,0) is even parity with diag 0; cell (1,0) odd parity, diag 0.05.
        expect(reveal.cellCheckerCoord(d.vec2f(0.05, 0.05), 1, 0.1)).toBeCloseTo(0, 4)
        expect(reveal.cellCheckerCoord(d.vec2f(0.15, 0.05), 1, 0.1)).toBeCloseTo(0.5 + 0.025, 4)
    })
    it('fbmCoverageCoord: in [0,1], stable for a fixed seed, moves with the seed', () => {
        const at = (seed: number) => reveal.fbmCoverageCoord(d.vec2f(0.3, 0.7), 1.5, 3, seed)
        expect(at(0)).toBeCloseTo(at(0), 6)
        expect(at(0)).not.toBeCloseTo(at(42), 3)
        for (const seed of [0, 7, 42]) {
            expect(at(seed)).toBeGreaterThanOrEqual(0)
            expect(at(seed)).toBeLessThanOrEqual(1)
        }
    })
})

describe('reveal — resolve gate', () => {
    it('every reveal primitive resolves to WGSL (snapshot)', () => {
        const wgsl = tgpu.resolve(
            [
                reveal.revealMask, reveal.applyReveal,
                reveal.directionalCoord, reveal.radialCornerNormCoord, reveal.angularCoord,
                reveal.cellGrid, reveal.foldAboutCenter, reveal.tilePhase,
                reveal.bandMidpointCoord, reveal.bandShuffleCoord,
                reveal.cellDiamondCoord, reveal.cellCheckerCoord, reveal.cellShuffleCoord,
                reveal.fbmCoverageCoord,
            ],
            {names: 'strict'},
        )
        // Kit fns are not `$name`d (the house pattern — consumers supply the name via the
        // composer's `call(fn, hint, …)`), so assert on the emitted bodies rather than fn names.
        expect(wgsl).toMatch(/struct CellGrid/)
        expect(wgsl).toMatch(/smoothstep\(/)
        expect(wgsl).toMatch(/atan2\(/)
        // The DEG_TO_RAD / TWO_PI folds must appear as numeric literals, never as a `Math.` ref.
        expect(wgsl).not.toMatch(/Math\./)
        expect(wgsl).toMatchSnapshot()
    })
})
