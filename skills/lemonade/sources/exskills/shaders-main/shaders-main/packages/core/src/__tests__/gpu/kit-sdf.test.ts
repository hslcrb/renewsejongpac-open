import {describe, it, expect, vi, afterEach} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import * as sdf from '@coreroot/gpu/kit/sdf'

/**
 * kit/sdf golden + resolve gates. The analytic SDF primitives are DualFns (run as plain JS on
 * CPU under vitest), so each is checked against the ORIGINAL v1 formula: circle/ellipse/cross by
 * independently hand-computed exact values, the rest by JS transcriptions of the v1 SDFs. Then a
 * resolve gate confirms every primitive + the shared shape helpers transpile to WGSL (snapshot).
 * Finally loadSdfFromUrl's compact/legacy decode is unit-tested.
 */

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) Golden — exact hand-computed values (sign: negative inside, 0 on boundary, positive out)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf (a) circleSdf golden', () => {
    const f = (dx: number, dy: number, r: number) => sdf.circleSdf(dx, dy, r) as unknown as number
    it('boundary / inside / outside', () => {
        expect(f(0.3, 0.4, 0.5)).toBeCloseTo(0, 6) // sqrt(0.25)=0.5 → 0
        expect(f(0, 0, 0.5)).toBeCloseTo(-0.5, 6) // center → -radius
        expect(f(0.6, 0.8, 0.5)).toBeCloseTo(0.5, 6) // len 1 → 0.5
    })
})

describe('kit/sdf (b) ellipseSdf golden', () => {
    const f = (dx: number, dy: number, rx: number, ry: number) => sdf.ellipseSdf(dx, dy, rx, ry) as unknown as number
    it('boundary on each axis / center / outside', () => {
        expect(f(0.35, 0, 0.35, 0.2)).toBeCloseTo(0, 6) // on the +x boundary
        expect(f(0, 0.2, 0.35, 0.2)).toBeCloseTo(0, 6) // on the +y boundary
        expect(f(0, 0, 0.35, 0.2)).toBeCloseTo(-0.2, 6) // center → -min(rx,ry)
        expect(f(0.7, 0, 0.35, 0.2)).toBeCloseTo(0.2, 6) // (2-1)*0.2
    })
})

describe('kit/sdf (c) crossSdf golden', () => {
    const f = (dx: number, dy: number, s: number, t: number, r: number) => sdf.crossSdf(dx, dy, s, t, r) as unknown as number
    it('center / arm tip / off the arm / rounded', () => {
        expect(f(0, 0, 0.35, 0.08, 0)).toBeCloseTo(-0.08, 6) // inside, nearest edge -thickness
        expect(f(0.35, 0, 0.35, 0.08, 0)).toBeCloseTo(0, 6) // on the horizontal arm tip
        expect(f(0, 0.5, 0.35, 0.08, 0)).toBeCloseTo(0.15, 6) // 0.5 - 0.35 vertical arm
        expect(f(0.2, 0.2, 0.35, 0.08, 0.05)).toBeCloseTo(0.07, 6) // 0.12 - rounding
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (d) Golden — heartSdf vs a JS transcription of the ORIGINAL v1 formula
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf (d) heartSdf golden', () => {
    // Transcribed verbatim from v1 utilities/sdf.ts heartSdf.
    const golden = (dx: number, dy: number, radius: number): number => {
        const S = radius / 0.75
        const px = Math.abs(dx) / S
        const py = -dy / S + 0.6
        const ax = px - 0.25
        const ay = py - 0.75
        const distA = Math.hypot(ax, ay) - Math.SQRT2 / 4
        const b1y = py - 1
        const dot1 = px * px + b1y * b1y
        const m = Math.max(px + py, 0) * 0.5
        const b2x = px - m
        const b2y = py - m
        const dot2v = b2x * b2x + b2y * b2y
        const distB = Math.sqrt(Math.min(dot1, dot2v)) * Math.sign(px - py)
        return (px + py > 1 ? distA : distB) * S
    }
    const cases: [number, number, number][] = [
        [0, 0, 0.32], // near center (branch B)
        [0.1, -0.2, 0.32], // upper region (branch A)
        [0.3, 0.1, 0.32], // right lobe region (branch A)
        [0.6, 0.6, 0.32], // well outside
    ]
    it('reproduces the original heart distance at sampled points', () => {
        for (const [dx, dy, r] of cases) {
            const out = sdf.heartSdf(dx, dy, r) as unknown as number
            expect(out).toBeCloseTo(golden(dx, dy, r), 5)
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (d2) Goldens — every other shape primitive vs a JS transcription of the v1 SDF formula
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf (d2) remaining primitive goldens', () => {
    // Off-axis sample points (avoiding atan2(0,0) and branch boundaries), covering inside/near-edge/outside.
    const pts: [number, number][] = [
        [0.05, 0.02],
        [-0.3, 0.2],
        [0.25, -0.3],
        [0.4, 0.35],
    ]
    const check = (actual: (dx: number, dy: number) => unknown, golden: (dx: number, dy: number) => number) => {
        for (const [dx, dy] of pts) expect(actual(dx, dy) as number).toBeCloseTo(golden(dx, dy), 5)
    }

    it('polygonSdf — cosine-sector regular polygon', () => {
        const golden = (dx: number, dy: number, radius: number, sides: number) => {
            const len = Math.hypot(dx, dy)
            const angle = Math.atan2(dy, dx)
            const sectorAngle = (2 * Math.PI) / sides
            const sectorIdx = Math.floor(angle / sectorAngle + 0.5)
            const canonicalAngle = angle - sectorIdx * sectorAngle
            return len * Math.cos(canonicalAngle) - radius
        }
        for (const sides of [3, 5, 6]) {
            check((dx, dy) => sdf.polygonSdf(dx, dy, 0.4, sides), (dx, dy) => golden(dx, dy, 0.4, sides))
        }
    })

    it('starSdf — exact segment-based star polygon', () => {
        const golden = (dx: number, dy: number, outerRadius: number, sides: number, innerRatio: number) => {
            const innerRadius = outerRadius * innerRatio
            const len = Math.hypot(dx, dy)
            const angle = Math.atan2(dy, dx)
            const sectorAngle = (2 * Math.PI) / sides
            const sectorIdx = Math.floor(angle / sectorAngle + 0.5)
            const bn = angle - sectorIdx * sectorAngle
            const fpx = Math.abs(len * Math.sin(bn))
            const fpy = len * Math.cos(bn)
            const an = Math.PI / sides
            const ex = innerRadius * Math.sin(an)
            const ey = innerRadius * Math.cos(an) - outerRadius
            const qx = fpx
            const qy = fpy - outerRadius
            const t = Math.min(Math.max((qx * ex + qy * ey) / (ex * ex + ey * ey), 0), 1)
            const nx = fpx - ex * t
            const ny = fpy - (outerRadius + ey * t)
            const dist = Math.hypot(nx, ny)
            const cross = ex * qy - ey * qx
            return dist * Math.sign(cross)
        }
        for (const [sides, ratio] of [[5, 0.4], [6, 0.5], [8, 0.3]] as const) {
            check((dx, dy) => sdf.starSdf(dx, dy, 0.4, sides, ratio), (dx, dy) => golden(dx, dy, 0.4, sides, ratio))
        }
    })

    it('flowerSdf — triangular radial wave', () => {
        const TWO_PI = 2 * Math.PI
        const golden = (dx: number, dy: number, outerRadius: number, sides: number, innerRatio: number) => {
            const angle = Math.atan2(dy, dx)
            const len = Math.hypot(dx, dy)
            const innerRadius = outerRadius * innerRatio
            const tAngle = (angle * sides) / TWO_PI
            const tFrac = tAngle - Math.floor(tAngle)
            const t = Math.abs(tFrac * 2 - 1)
            const boundaryR = innerRadius + (outerRadius - innerRadius) * t
            return len - boundaryR
        }
        for (const [sides, ratio] of [[5, 0.4], [8, 0.3]] as const) {
            check((dx, dy) => sdf.flowerSdf(dx, dy, 0.4, sides, ratio), (dx, dy) => golden(dx, dy, 0.4, sides, ratio))
        }
    })

    it('ringSdf — annulus around the midline radius', () => {
        const golden = (dx: number, dy: number, radius: number, thickness: number) =>
            Math.abs(Math.hypot(dx, dy) - radius) - thickness
        check((dx, dy) => sdf.ringSdf(dx, dy, 0.3, 0.07), (dx, dy) => golden(dx, dy, 0.3, 0.07))
    })

    it('roundedRectSdf — rounded box', () => {
        const golden = (dx: number, dy: number, width: number, height: number, rounding: number) => {
            const qx = Math.abs(dx) - width + rounding
            const qy = Math.abs(dy) - height + rounding
            const outer = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
            const inner = Math.min(Math.max(qx, qy), 0)
            return outer + inner - rounding
        }
        check((dx, dy) => sdf.roundedRectSdf(dx, dy, 0.35, 0.25, 0.05), (dx, dy) => golden(dx, dy, 0.35, 0.25, 0.05))
    })

    it('vesicaSdf — lens of two overlapping circles', () => {
        const golden = (dx: number, dy: number, radius: number, spread: number) => {
            const px = Math.abs(dx)
            const py = Math.abs(dy)
            const dd = radius * spread
            const b = Math.sqrt(Math.max(radius * radius - dd * dd, 0))
            const cond = (py - b) * dd > px * b
            const dist1 = Math.hypot(px, py - b)
            const dist2 = Math.hypot(px + dd, py) - radius
            return cond ? dist1 : dist2
        }
        for (const spread of [0.3, 0.5, 0.7]) {
            check((dx, dy) => sdf.vesicaSdf(dx, dy, 0.35, spread), (dx, dy) => golden(dx, dy, 0.35, spread))
        }
    })

    it('crescentSdf — iq moon (outer circle minus offset bite)', () => {
        const golden = (dx: number, dy: number, outerRadius: number, innerRatio: number, offset: number) => {
            const py = Math.abs(dy)
            const ra = outerRadius
            const rb = outerRadius * innerRatio
            const off = offset
            const a = (ra * ra - rb * rb + off * off) / Math.max(off * 2, 0.001)
            const b = Math.sqrt(Math.max(ra * ra - a * a, 0))
            const lhs = off * (dx * b - py * a)
            const rhs = off * off * Math.max(b - py, 0)
            const dist1 = Math.hypot(dx - a, py - b)
            const lenP = Math.hypot(dx, py)
            const lenInner = Math.hypot(dx - off, py)
            const dist2 = Math.max(lenP - ra, -(lenInner - rb))
            return lhs > rhs ? dist1 : dist2
        }
        for (const [ratio, off] of [[0.8, 0.2], [0.7, 0.15], [0.9, 0.25]] as const) {
            check((dx, dy) => sdf.crescentSdf(dx, dy, 0.3, ratio, off), (dx, dy) => golden(dx, dy, 0.3, ratio, off))
        }
    })

    it('trapezoidSdf — iq trapezoid (r1 = y<0 half-width, r2 = y>0, he = half-height)', () => {
        const golden = (dx: number, dy: number, r1: number, r2: number, he: number) => {
            const px = Math.abs(dx)
            const k1x = r2
            const k1y = he
            const k2x = r2 - r1
            const k2y = he * 2
            const clampWidth = dy < 0 ? r1 : r2
            const cax = px - Math.min(px, clampWidth)
            const cay = Math.abs(dy) - he
            const dotNum = (k1x - px) * k2x + (k1y - dy) * k2y
            const dotDen = Math.max(k2x * k2x + k2y * k2y, 0.0001)
            const t = Math.min(Math.max(dotNum / dotDen, 0), 1)
            const cbx = px - k1x + k2x * t
            const cby = dy - k1y + k2y * t
            const sInner = cay < 0 ? -1 : 1
            const s = cbx < 0 ? sInner : 1
            const dca = cax * cax + cay * cay
            const dcb = cbx * cbx + cby * cby
            return s * Math.sqrt(Math.min(dca, dcb))
        }
        for (const [r1, r2, he] of [[0.2, 0.35, 0.25], [0.3, 0.15, 0.3], [0.1, 0.4, 0.2]] as const) {
            check((dx, dy) => sdf.trapezoidSdf(dx, dy, r1, r2, he), (dx, dy) => golden(dx, dy, r1, r2, he))
        }
    })

    it('arcSdf — pie sector of a half-angle aperture', () => {
        const golden = (dx: number, dy: number, radius: number, halfAngle: number) => {
            const px = Math.abs(dx)
            const cx = Math.sin(halfAngle)
            const cy = Math.cos(halfAngle)
            const l = Math.hypot(px, dy) - radius
            const clamped = Math.min(Math.max(px * cx + dy * cy, 0), radius)
            const mx = px - cx * clamped
            const my = dy - cy * clamped
            const m = Math.hypot(mx, my)
            return Math.max(l, m * Math.sign(cy * px - cx * dy))
        }
        const APERTURE_TO_HALF = Math.PI / 360
        for (const aperture of [270, 180, 90]) {
            const half = aperture * APERTURE_TO_HALF
            check((dx, dy) => sdf.arcSdf(dx, dy, 0.38, half), (dx, dy) => golden(dx, dy, 0.38, half))
        }
    })

    it('teardropSdf — 2D rounded cone (dy negated so the bulb sits at the bottom)', () => {
        const golden = (dx: number, dy: number, radius: number, h: number) => {
            const mid = (h - radius) * 0.5
            const qx = Math.abs(dx)
            const qy = -dy + mid
            const hSafe = Math.max(h, 0.0001)
            const b = radius / hSafe
            const a = Math.sqrt(Math.max(1 - b * b, 0))
            const k = qx * -b + qy * a
            const cap0 = Math.hypot(qx, qy) - radius
            const cap1 = Math.hypot(qx, qy - h)
            const body = qx * a + qy * b - radius
            return k < 0 ? cap0 : k > a * h ? cap1 : body
        }
        for (const [r, h] of [[0.22, 0.4], [0.18, 0.5], [0.3, 0.35]] as const) {
            check((dx, dy) => sdf.teardropSdf(dx, dy, r, h), (dx, dy) => golden(dx, dy, r, h))
        }
    })

    it('parallelogramSdf — iq parallelogram (half-width, half-height, top-edge skew)', () => {
        const golden = (dx: number, dy: number, wi: number, he: number, sk: number) => {
            const ex = sk
            const ey = he
            const flip1 = dy < 0
            const px0 = flip1 ? -dx : dx
            const py0 = flip1 ? -dy : dy
            const wx0 = px0 - ex
            const wy = py0 - ey
            const wx = wx0 - Math.min(Math.max(wx0, -wi), wi)
            const dX = wx * wx + wy * wy
            const dY = -wy
            const s = px0 * ey - py0 * ex
            const flip2 = s < 0
            const px = flip2 ? -px0 : px0
            const py = flip2 ? -py0 : py0
            const vx0 = px - wi
            const dotve = vx0 * ex + py * ey
            const dotee = Math.max(ex * ex + ey * ey, 0.0001)
            const tt = Math.min(Math.max(dotve / dotee, -1), 1)
            const vx = vx0 - ex * tt
            const vy = py - ey * tt
            const finalX = Math.min(dX, vx * vx + vy * vy)
            const finalY = Math.min(dY, wi * he - Math.abs(s))
            return Math.sqrt(finalX) * Math.sign(-finalY)
        }
        for (const [wi, he, sk] of [[0.32, 0.22, 0.15], [0.28, 0.3, -0.2], [0.4, 0.18, 0.3]] as const) {
            check((dx, dy) => sdf.parallelogramSdf(dx, dy, wi, he, sk), (dx, dy) => golden(dx, dy, wi, he, sk))
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (e) Resolve gate — every primitive + shared shape helpers transpile to WGSL
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf (e) resolve gate', () => {
    it('all SDF primitives + shape helpers resolve to WGSL (snapshot)', () => {
        const wgsl = tgpu.resolve(
            [
                sdf.circleSdf, sdf.polygonSdf, sdf.flowerSdf, sdf.starSdf, sdf.ringSdf, sdf.crossSdf,
                sdf.roundedRectSdf, sdf.ellipseSdf, sdf.vesicaSdf, sdf.crescentSdf, sdf.trapezoidSdf,
                sdf.heartSdf, sdf.arcSdf, sdf.teardropSdf, sdf.parallelogramSdf,
                sdf.shapeLocalCoords, sdf.strokeMaskFromSdf,
            ],
            {names: 'strict'},
        )
        expect(typeof wgsl).toBe('string')
        expect(wgsl).toMatch(/fn/)
        expect(wgsl).toMatchSnapshot()
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (f) loadSdfFromUrl — compact (Uint16) + legacy (Float32) decode
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf (f) loadSdfFromUrl decode', () => {
    afterEach(() => vi.unstubAllGlobals())

    const mockFetch = (buffer: ArrayBuffer) =>
        vi.stubGlobal('fetch', vi.fn(async () => ({ok: true, arrayBuffer: async () => buffer}) as unknown as Response))

    it('decodes the compact Uint16 format [0,65535] → [-1,1]', async () => {
        const n = sdf.SVG_SDF_SIZE * sdf.SVG_SDF_SIZE
        const u16 = new Uint16Array(n)
        u16[0] = 0 //         → -1
        u16[1] = 32767.5 | 0 // ≈ 0 (integer store, exact enough for close check)
        u16[2] = 65535 //     → ~+1
        mockFetch(u16.buffer)
        const out = new Float32Array(n).fill(0.5)
        await sdf.loadSdfFromUrl('mock://field.bin', out)
        expect(out[0]).toBeCloseTo(-1, 4)
        expect(out[2]).toBeCloseTo(1, 3)
    })

    it('copies the legacy Float32 format directly', async () => {
        const n = sdf.SVG_SDF_SIZE * sdf.SVG_SDF_SIZE
        const f32 = new Float32Array(n)
        f32[0] = -0.42
        f32[5] = 0.17
        mockFetch(f32.buffer)
        const out = new Float32Array(n).fill(0.5)
        await sdf.loadSdfFromUrl('mock://legacy.bin', out)
        expect(out[0]).toBeCloseTo(-0.42, 6)
        expect(out[5]).toBeCloseTo(0.17, 6)
    })

    it('throws a clear error on an unexpected byte length (non-SDF file)', async () => {
        mockFetch(new ArrayBuffer(123))
        await expect(sdf.loadSdfFromUrl('mock://not-an-sdf.svg', new Float32Array(4))).rejects.toThrow(/unexpected size/)
    })
})
