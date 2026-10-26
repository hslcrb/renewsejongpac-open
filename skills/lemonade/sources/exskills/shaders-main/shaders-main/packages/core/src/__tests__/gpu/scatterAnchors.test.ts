import {describe, it, expect} from 'vitest'
import {hash11Cpu, hash22Cpu, spiralScatterCpu, packScatterAnchors, SCATTER_MAX} from '@coreroot/utilities/scatterAnchors'

/**
 * CPU mirror of `spiralScatter` (the hoisted mesh-gradient constellation) — pins the f32-emulated
 * hashes and the packing layout `scatterFieldAnchored` reads. The GPU hashes are raw-WGSL bitcasts
 * with no CPU DualFn, so these goldens are the contract that keeps the two sides aligned: any
 * edit to `fields.ts` spiralScatter must reproduce here.
 */

describe('scatterAnchors — f32-emulated hashes', () => {
    it('hash11 / hash22 land in [0, 1] and are deterministic', () => {
        for (const x of [0.77, 1.618, 3.9, 42.1, 1e3]) {
            const h = hash11Cpu(x)
            expect(h).toBeGreaterThanOrEqual(0)
            expect(h).toBeLessThanOrEqual(1)
            expect(hash11Cpu(x)).toBe(h)
            const [a, b] = hash22Cpu(x, x * 0.37 + 2.236)
            expect(a).toBeGreaterThanOrEqual(0)
            expect(a).toBeLessThanOrEqual(1)
            expect(b).toBeGreaterThanOrEqual(0)
            expect(b).toBeLessThanOrEqual(1)
        }
    })

    it('hash11 golden — a bitcast hash, so nearby inputs must not correlate', () => {
        const a = hash11Cpu(0.917)
        const b = hash11Cpu(0.9171)
        expect(Math.abs(a - b)).toBeGreaterThan(0.01)
    })
})

describe('scatterAnchors — spiralScatterCpu', () => {
    it('places anchors in aspect-corrected UV space and scales x by the aspect', () => {
        for (let i = 0; i < SCATTER_MAX; i++) {
            const [x1, y1] = spiralScatterCpu(i, 8, 0, 0.5, 1, 0)
            const [x2, y2] = spiralScatterCpu(i, 8, 0, 0.5, 2, 0)
            // Same y; x doubles with the aspect (x is (0.5 + n) · aspect).
            expect(y2).toBeCloseTo(y1, 6)
            expect(x2).toBeCloseTo(x1 * 2, 5)
            // Spread radius 0.62 + jitter 0.13 + drift 0.16 keeps points near the frame.
            expect(x1).toBeGreaterThan(-0.5)
            expect(x1).toBeLessThan(1.5)
            expect(y1).toBeGreaterThan(-0.5)
            expect(y1).toBeLessThan(1.5)
        }
    })

    it('drift 0 is time-invariant; drift > 0 moves the anchor over time', () => {
        const still0 = spiralScatterCpu(3, 5, 7, 0, 1, 0)
        const still1 = spiralScatterCpu(3, 5, 7, 0, 1, 12.5)
        expect(still1[0]).toBe(still0[0])
        expect(still1[1]).toBe(still0[1])
        const move0 = spiralScatterCpu(3, 5, 7, 1, 1, 0)
        const move1 = spiralScatterCpu(3, 5, 7, 1, 1, 12.5)
        expect(move1[0] !== move0[0] || move1[1] !== move0[1]).toBe(true)
    })

    it('seed rotates the whole constellation (every anchor moves)', () => {
        for (let i = 0; i < SCATTER_MAX; i++) {
            const a = spiralScatterCpu(i, 8, 0, 0, 1, 0)
            const b = spiralScatterCpu(i, 8, 1, 0, 1, 0)
            expect(a[0] !== b[0] || a[1] !== b[1]).toBe(true)
        }
    })
})

describe('scatterAnchors — packScatterAnchors layout', () => {
    it('packs 8 anchors as 16 floats, anchor i at [2i, 2i+1] (element i>>1, xy even / zw odd)', () => {
        const packed = packScatterAnchors(6, 3, 0.4, 1.5, 2)
        expect(packed).toHaveLength(SCATTER_MAX * 2)
        for (let i = 0; i < SCATTER_MAX; i++) {
            const [x, y] = spiralScatterCpu(i, 6, 3, 0.4, 1.5, 2)
            expect(packed[i * 2]).toBe(x)
            expect(packed[i * 2 + 1]).toBe(y)
        }
        // vec4 element 1 = anchors 2 (xy) and 3 (zw)
        const [x2] = spiralScatterCpu(2, 6, 3, 0.4, 1.5, 2)
        const [x3] = spiralScatterCpu(3, 6, 3, 0.4, 1.5, 2)
        expect(packed[4]).toBe(x2)
        expect(packed[6]).toBe(x3)
    })
})
