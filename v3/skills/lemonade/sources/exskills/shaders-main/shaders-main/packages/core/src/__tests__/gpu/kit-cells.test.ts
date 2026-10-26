import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {
    cellCentreUV,
    cellCentreUVRotated,
    cellHash,
    hexTiling,
    rowSpeedHash,
    rowSpeedMultiplier,
    squareTiling,
    triLattice,
    variationFactor,
} from '@coreroot/gpu/kit/cells'
import {DEG_TO_RAD, SQRT3} from '@coreroot/gpu/kit/constants'

/**
 * kit/cells gate (Phase 6). Two layers, per C8: CPU golden values for the pure fns, then a resolve
 * gate with a WGSL snapshot.
 *
 * The hash goldens are HARD-CODED expected values rather than a re-derivation of the formula. That is
 * deliberate: D-6 freezes these two hashes byte-identical because every shipped preset's cell
 * randomness was authored against them, and a test that recomputes the formula would happily follow
 * the formula if someone "improved" it. These numbers are the actual contract.
 */

describe('cells — square tiling', () => {
    it('splits a scaled UV into cell index and in-cell coordinate', () => {
        const t = squareTiling(d.vec2f(3.25, 7.75)) as unknown as {cell: {x: number; y: number}; local: {x: number; y: number}}
        expect(t.cell.x).toBeCloseTo(3)
        expect(t.cell.y).toBeCloseTo(7)
        expect(t.local.x).toBeCloseTo(0.25)
        expect(t.local.y).toBeCloseTo(0.75)
    })

    it('stays consistent for negative coordinates (floor pairs with fract)', () => {
        // A rotation or an upstream distortion's uvContext pushes the coordinate negative; cell and
        // local must still reconstruct the input.
        const t = squareTiling(d.vec2f(-0.25, -3.5)) as unknown as {cell: {x: number; y: number}; local: {x: number; y: number}}
        expect(t.cell.x).toBeCloseTo(-1)
        expect(t.local.x).toBeCloseTo(0.75)
        expect(t.cell.x + t.local.x).toBeCloseTo(-0.25)
        expect(t.cell.y + t.local.y).toBeCloseTo(-3.5)
    })
})

describe('cells — hex tiling', () => {
    const hex = (p: [number, number], s: [number, number]) =>
        hexTiling(d.vec2f(p[0], p[1]), d.vec2f(s[0], s[1])) as unknown as {
            gv: {x: number; y: number}
            id: {x: number; y: number}
        }

    it('returns the local offset from the nearest hex centre, and that centre', () => {
        const h = hex([0, 0], [SQRT3, 1])
        // gv + id must always reconstruct the sample point.
        expect(h.gv.x + h.id.x).toBeCloseTo(0)
        expect(h.gv.y + h.id.y).toBeCloseTo(0)
    })

    it('never lands further than the hex circumradius from a centre', () => {
        // The two-offset-grids fold is only correct if the winning candidate is always inside the
        // hexagon — for a period of (√3, 1) that means |gv| <= 0.5-ish.
        for (const p of [[0.3, 0.4], [1.7, 2.9], [-2.2, -0.7], [5.5, -3.1]] as [number, number][]) {
            const h = hex(p, [SQRT3, 1])
            expect(Math.hypot(h.gv.x, h.gv.y)).toBeLessThanOrEqual(0.58)
        }
    })

    it('the transposed period is a genuinely different (flat-top) lattice', () => {
        // HexGrid passes (√3, 1); IsometricCubes passes (1, √3). Same code, different orientation —
        // if these agreed, the orientation parameter would be doing nothing.
        const pointy = hex([1.1, 0.6], [SQRT3, 1])
        const flat = hex([1.1, 0.6], [1, SQRT3])
        expect([pointy.gv.x, pointy.gv.y]).not.toEqual([flat.gv.x, flat.gv.y])
    })

    it('is periodic — shifting by the lattice period lands on the same local offset', () => {
        const a = hex([0.37, 0.21], [SQRT3, 1])
        const b = hex([0.37 + SQRT3, 0.21 + 1], [SQRT3, 1])
        expect(b.gv.x).toBeCloseTo(a.gv.x, 4)
        expect(b.gv.y).toBeCloseTo(a.gv.y, 4)
    })
})

describe('cells — triangular lattice', () => {
    it('skews the equilateral lattice so unit squares hold two triangles', () => {
        const q = triLattice(d.vec2f(1, SQRT3)) as unknown as {x: number; y: number}
        // (1, √3) is a lattice vector: it maps to integer coordinates in the skewed space.
        expect(q.x).toBeCloseTo(0, 5)
        expect(q.y).toBeCloseTo(2, 5)
    })

    it('leaves the X axis alone', () => {
        const q = triLattice(d.vec2f(2.5, 0)) as unknown as {x: number; y: number}
        expect(q.x).toBeCloseTo(2.5)
        expect(q.y).toBeCloseTo(0)
    })
})

describe('cells — cell-centre sampling UVs', () => {
    it('snaps to the containing cell centre and returns a screen UV', () => {
        // Square viewport → aspect 1, so the round trip is easy to reason about: with 4 cells the
        // centres sit at 0.125, 0.375, 0.625, 0.875.
        const out = cellCentreUV(d.vec2f(0.3, 0.3), d.vec2f(600, 600), 4) as unknown as {x: number; y: number}
        expect(out.x).toBeCloseTo(0.375, 5)
        // Y is flipped going in and coming back out, so it lands on a centre too.
        expect(out.y).toBeCloseTo(0.375, 5)
    })

    it('is idempotent — a cell centre maps to itself', () => {
        const vp = d.vec2f(800, 600)
        const first = cellCentreUV(d.vec2f(0.42, 0.61), vp, 10) as unknown as {x: number; y: number}
        const second = cellCentreUV(d.vec2f(first.x, first.y), vp, 10) as unknown as {x: number; y: number}
        expect(second.x).toBeCloseTo(first.x, 5)
        expect(second.y).toBeCloseTo(first.y, 5)
    })

    it('the rotated form agrees with the plain one at zero rotation', () => {
        const vp = d.vec2f(1600, 900)
        const plain = cellCentreUV(d.vec2f(0.31, 0.72), vp, 12) as unknown as {x: number; y: number}
        const rot = cellCentreUVRotated(d.vec2f(0.31, 0.72), vp, 12, 0) as unknown as {x: number; y: number}
        expect(rot.x).toBeCloseTo(plain.x, 5)
        expect(rot.y).toBeCloseTo(plain.y, 5)
    })

    it('the rotated form reproduces the rotate → snap → un-rotate transform', () => {
        const golden = (uv: [number, number], vp: [number, number], cells: number, rotationRad: number): [number, number] => {
            const aspect = vp[0] / Math.max(vp[1], 1e-6)
            const cosR = Math.cos(rotationRad)
            const sinR = Math.sin(rotationRad)
            const centerX = aspect * 0.5
            const cx = uv[0] * aspect - centerX
            const cy = 1 - uv[1] - 0.5
            const rotX = cx * cosR - cy * sinR + centerX
            const rotY = cx * sinR + cy * cosR + 0.5
            const cellRX = (Math.floor(rotX * cells) + 0.5) / cells
            const cellRY = (Math.floor(rotY * cells) + 0.5) / cells
            const ccx = cellRX - centerX
            const ccy = cellRY - 0.5
            return [(ccx * cosR + ccy * sinR + centerX) / aspect, 1 - (ccx * -sinR + ccy * cosR + 0.5)]
        }
        const cases: {uv: [number, number]; vp: [number, number]; cells: number; deg: number}[] = [
            {uv: [0.5, 0.5], vp: [800, 600], cells: 10, deg: 0},
            {uv: [0.3, 0.7], vp: [1280, 720], cells: 12, deg: 30},
            {uv: [0.8, 0.2], vp: [600, 600], cells: 6, deg: 45},
        ]
        for (const c of cases) {
            const rad = c.deg * DEG_TO_RAD
            const out = cellCentreUVRotated(d.vec2f(c.uv[0], c.uv[1]), d.vec2f(c.vp[0], c.vp[1]), c.cells, rad) as unknown as {
                x: number
                y: number
            }
            const [ex, ey] = golden(c.uv, c.vp, c.cells, rad)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })

    it('both forms guard the aspect divide against a zero-height viewport', () => {
        for (const out of [
            cellCentreUV(d.vec2f(0.5, 0.5), d.vec2f(1600, 0), 8) as unknown as {x: number; y: number},
            cellCentreUVRotated(d.vec2f(0.5, 0.5), d.vec2f(1600, 0), 8, 0.5) as unknown as {x: number; y: number},
        ]) {
            expect(Number.isFinite(out.x)).toBe(true)
            expect(Number.isFinite(out.y)).toBe(true)
        }
    })
})

describe('cells — legacy sin-fract hashes (D-6: frozen, do not "improve")', () => {
    it('cellHash returns these exact values', () => {
        // Hard-coded on purpose — see this file's header.
        expect(cellHash(d.vec2f(0, 0)) as unknown as number).toBeCloseTo(0, 6)
        expect(cellHash(d.vec2f(3, 7)) as unknown as number).toBeCloseTo(0.41391411423683167, 6)
        expect(cellHash(d.vec2f(-2, 11)) as unknown as number).toBeCloseTo(0.8650898337364197, 6)
    })

    it('cellHash stays in [0, 1) and decorrelates neighbouring cells', () => {
        const vals: number[] = []
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const v = cellHash(d.vec2f(x, y)) as unknown as number
                expect(v).toBeGreaterThanOrEqual(0)
                expect(v).toBeLessThan(1)
                vals.push(v)
            }
        }
        // Adjacent cells must not land near each other, or the "random" fills read as a gradient.
        expect(Math.abs(vals[9] - vals[10])).toBeGreaterThan(0.01)
        // And the 64 cells must be mostly distinct, not a handful of repeated buckets.
        expect(new Set(vals.map((v) => v.toFixed(4))).size).toBeGreaterThan(50)
    })

    it('rowSpeedHash returns these exact values and stays in [0, 1)', () => {
        expect(rowSpeedHash(0) as unknown as number).toBeCloseTo(0, 6)
        expect(rowSpeedHash(1) as unknown as number).toBeCloseTo(0.325611412525177, 6)
        expect(rowSpeedHash(-3) as unknown as number).toBeCloseTo(0.2738230228424072, 6)
        for (const row of [1, 2, 5, -3, 17]) {
            const v = rowSpeedHash(row) as unknown as number
            expect(v).toBeGreaterThanOrEqual(0)
            expect(v).toBeLessThan(1)
        }
    })
})

describe('cells — derived multipliers', () => {
    it('rowSpeedMultiplier is 1 at zero variance and spans [-1, 3] at full variance', () => {
        expect(rowSpeedMultiplier(0.9, 0) as unknown as number).toBeCloseTo(1)
        expect(rowSpeedMultiplier(0.5, 1) as unknown as number).toBeCloseTo(1)
        // Some rows reverse at full variance — that is what makes the drift read as irregular.
        expect(rowSpeedMultiplier(0, 1) as unknown as number).toBeCloseTo(-1)
        expect(rowSpeedMultiplier(1, 1) as unknown as number).toBeCloseTo(3)
    })

    it('variationFactor is exactly 1 at zero variation', () => {
        for (const rand of [0, 0.25, 0.5, 1]) {
            expect(variationFactor(rand, 0) as unknown as number).toBe(1)
        }
    })

    it('variationFactor spans [0, 2] and never goes negative', () => {
        expect(variationFactor(1, 1) as unknown as number).toBeCloseTo(2)
        expect(variationFactor(0, 1) as unknown as number).toBeCloseTo(0)
        // A negative multiplier would flip the sign of the RGB it scales, producing colors outside
        // the authored palette — the floor is the point of the fn.
        expect(variationFactor(0, 5) as unknown as number).toBe(0)
    })
})

describe('resolve gate — cells fns emit valid WGSL', () => {
    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const tile = squareTiling(input.uv.mul(8.0))
            const hex = hexTiling(input.uv.mul(6.0), d.vec2f(SQRT3, 1.0))
            const tri = triLattice(input.uv.mul(5.0))
            const centre = cellCentreUV(input.uv, d.vec2f(1600.0, 900.0), 10.0)
            const centreRot = cellCentreUVRotated(input.uv, d.vec2f(1600.0, 900.0), 10.0, 0.5)
            const rand = cellHash(tile.cell)
            const varied = variationFactor(rand, 0.5)
            const speed = rowSpeedMultiplier(rowSpeedHash(tile.cell.y), 0.3)
            return d.vec4f(
                tile.local.x + hex.gv.x + tri.y,
                centre.x + centreRot.y,
                varied * speed,
                rand,
            )
        })
        .$name('cellsProbe')

    it('resolves and names every fn', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        for (const name of [
            'squareTiling',
            'hexTiling',
            'triLattice',
            'cellCentreUV',
            'cellCentreUVRotated',
            'cellHash',
            'rowSpeedHash',
            'rowSpeedMultiplier',
            'variationFactor',
            'struct CellTile',
            'struct HexCell',
        ]) {
            expect(wgsl).toContain(name)
        }
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
