import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import * as cellular from '@coreroot/gpu/kit/cellular'

/**
 * kit/cellular gate — the Worley/Voronoi fold and its reductions.
 *
 * The reductions are pure float, so they get real CPU goldens. The FOLD is hash-driven: JS `Math.sin`
 * and a GPU's `sin` disagree at the hash's argument magnitudes, so its CPU results are not the GPU's
 * and are only asserted on structural INVARIANTS (d1 ≤ d2, the pair is inside the reachable range,
 * jitter 0 collapses to a lattice). The exact values are pinned by the shader snapshots instead.
 */

describe('cellular — reductions (CPU goldens)', () => {
    it('cellReduceSelectable: mode 0…4 over a squared-Euclidean pair', () => {
        // metric 0 → the pair is SQUARED, so the reduction takes the sqrt: d1 = 0.25 → 0.5, d2 = 1 → 1.
        const reduce = (mode: number) => cellular.cellReduceSelectable(0.25, 1.0, 0, mode) as number
        expect(reduce(0)).toBeCloseTo(0.5, 6)   // F1
        expect(reduce(1)).toBeCloseTo(1.0, 6)   // F2
        expect(reduce(2)).toBeCloseTo(0.5, 6)   // F2 − F1
        expect(reduce(3)).toBeCloseTo(1.5, 6)   // F1 + F2
        expect(reduce(4)).toBeCloseTo(0.5, 6)   // F1 × F2
    })

    it('cellReduceSelectable: metric 1/2 skip the sqrt (the distances are already linear)', () => {
        expect(cellular.cellReduceSelectable(0.25, 1.0, 1, 0) as number).toBeCloseTo(0.25, 6)
        expect(cellular.cellReduceSelectable(0.25, 1.0, 2, 0) as number).toBeCloseTo(0.25, 6)
    })

    it('cellRatio is 0 at a feature point, 1 at an equidistant boundary, and scale-invariant', () => {
        expect(cellular.cellRatio(0, 1, 1) as number).toBeCloseTo(0, 6)
        expect(cellular.cellRatio(1, 1, 1) as number).toBeCloseTo(1, 6)
        // Doubling both distances (a coarser cell grid) does not change the ratio — the whole point.
        expect(cellular.cellRatio(0.3, 0.7, 1) as number)
            .toBeCloseTo(cellular.cellRatio(0.6, 1.4, 1) as number, 6)
    })

    it('cellRatio power shapes how far the far color reaches into the cell', () => {
        const mid = cellular.cellRatio(0.25, 0.75, 1) as number
        const sharp = cellular.cellRatio(0.25, 0.75, 4) as number
        expect(sharp).toBeLessThan(mid) // a higher power keeps more of the interior near 0
    })

    it('cellEdgeMask is 0 on a boundary and rises into the interior', () => {
        expect(cellular.cellEdgeMask(1, 1, 0.1) as number).toBeCloseTo(0, 6)
        expect(cellular.cellEdgeMask(0.1, 0.9, 0.1) as number).toBeCloseTo(1, 6)
        // Softness widens the line: the same point is darker (closer to the line) at higher softness.
        const tight = cellular.cellEdgeMask(0.45, 0.55, 0.05) as number
        const soft = cellular.cellEdgeMask(0.45, 0.55, 0.4) as number
        expect(soft).toBeLessThan(tight)
    })

    it('the mode/metric enums match the numbers the reductions branch on', () => {
        expect(cellular.CELL_MODES).toEqual({f1: 0, f2: 1, f2MinusF1: 2, f1PlusF2: 3, f1TimesF2: 4})
        expect(cellular.CELL_METRICS).toEqual({euclidean: 0, manhattan: 1, chebyshev: 2})
    })
})

describe('cellular — nearest2Cells fold', () => {
    const lenFold = cellular.nearest2Cells({distance: 'length', jitter: 'none', name: 'testLen'})
    const selFold = cellular.nearest2Cells({distance: 'selectableSquared', jitter: 'mix', name: 'testSel'})

    it('memoizes per option key and hands back distinct fns per config', () => {
        expect(cellular.nearest2Cells({distance: 'length', jitter: 'none', name: 'testLen'})).toBe(lenFold)
        expect(selFold).not.toBe(lenFold)
    })

    it('keeps the pair sorted (d1 ≤ d2) across the cell', () => {
        for (const [x, y] of [[0.1, 0.1], [0.5, 0.5], [0.9, 0.2], [3.3, 7.7]]) {
            const out = lenFold(d.vec2f(x, y), 0, 0) as d.v2f
            expect(out.x).toBeLessThanOrEqual(out.y)
            expect(out.x).toBeGreaterThanOrEqual(0)
            // A 3×3 search always finds a point within ~2 cells, well under the 10 sentinel.
            expect(out.y).toBeLessThan(10)
        }
    })

    it('the squared form returns squared distances (smaller than the linear form for sub-unit gaps)', () => {
        const lin = lenFold(d.vec2f(0.5, 0.5), 0, 0) as d.v2f
        const sq = selFold(d.vec2f(0.5, 0.5), 0, 0, 1, 0) as d.v2f
        expect(sq.x).toBeLessThan(lin.x + 1e-6)
    })

    it('jitter 0 collapses the feature points onto the cell centres', () => {
        // Every cell's point is exactly (0.5, 0.5), so the nearest distance from the centre is 0.
        const out = selFold(d.vec2f(4.5, 9.5), 0, 0, 0, 0) as d.v2f
        expect(out.x).toBeCloseTo(0, 6)
        // …and the second-nearest is one whole cell away (squared → 1).
        expect(out.y).toBeCloseTo(1, 6)
    })
})

describe('resolve gate — cellular emits valid WGSL', () => {
    // Both fold configurations in ONE entry: the C3 collision test.
    const lenFold = cellular.nearest2Cells({distance: 'length', jitter: 'none', name: 'gateLen'})
    const selFold = cellular.nearest2Cells({distance: 'selectableSquared', jitter: 'mix', name: 'gateSel'})

    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const a = lenFold(input.uv.mul(6.0), 0.0, 0.0)
            const b = selFold(input.uv.mul(6.0), 0.0, 0.0, 1.0, 0.0)
            const ratio = cellular.cellRatio(a.x, a.y, 2.0)
            const edge = cellular.cellEdgeMask(a.x, a.y, 0.05)
            const reduced = cellular.cellReduceSelectable(b.x, b.y, 0.0, 2.0)
            return d.vec4f(ratio, edge, reduced, 1.0)
        })
        .$name('cellularProbe')

    it('emits both fold configurations under distinct names, sharing one hash', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        expect(wgsl).toContain('fn gateLenLen')
        expect(wgsl).toContain('fn gateSelSelJit')
        expect(wgsl).toContain('fn cellHash2')
        // One shared hash, not one per fold.
        expect(wgsl.match(/fn cellHash2/g)).toHaveLength(1)
        // TypeGPU 0.12 namespaces shared kit-facade helpers by their module (cellular_, …).
        expect(wgsl).toContain('fn cellular_cellRatio')
        expect(wgsl).toContain('fn cellular_cellEdgeMask')
        expect(wgsl).toContain('fn cellular_cellReduceSelectable')
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
