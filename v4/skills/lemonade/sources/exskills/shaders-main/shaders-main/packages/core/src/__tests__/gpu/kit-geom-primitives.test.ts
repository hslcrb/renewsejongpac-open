import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {
    aspectCenteredDelta,
    aspectCentrePosition,
    aspectCorrectedUV,
    aspectCorrectedUVFlipY,
    aspectOf,
    canvasCentredDelta,
    directionalProjection,
    flooredMod1,
    flooredMod2,
    fromPolar,
    rotate2,
    rotateAboutCanvasCentre,
    safeDiv,
    toPolar,
    unflipPosition,
} from '@coreroot/gpu/kit/geom'
import {DEG_TO_RAD, GOLDEN, HALF_PI, PI, RAD_TO_DEG, SQRT3, TAU, TWO_PI} from '@coreroot/gpu/kit/constants'

/**
 * kit/geom + kit/constants gate. Same two layers as kit-geom.test.ts (which covers the older
 * coords/edges/uvTransform trio): CPU golden values, then a resolve gate with a WGSL snapshot.
 */

describe('constants', () => {
    it('are the true values, not truncations', () => {
        expect(DEG_TO_RAD).toBe(Math.PI / 180)
        expect(RAD_TO_DEG).toBe(180 / Math.PI)
        expect(PI).toBe(Math.PI)
        expect(TAU).toBe(Math.PI * 2)
        expect(TWO_PI).toBe(TAU)
        expect(HALF_PI).toBe(Math.PI / 2)
        expect(SQRT3).toBe(Math.sqrt(3))
        // Golden angle = π(3 − √5).
        expect(GOLDEN).toBeCloseTo(Math.PI * (3 - Math.sqrt(5)), 12)
    })

    it('DEG_TO_RAD is more precise than the truncated copies it replaces', () => {
        // BarShift inlines 0.0174533 and ConcentricSpin 0.01745; adopting the real constant is a
        // (small) pixel change at large angles, which is why it is on the Gate C review list.
        expect(DEG_TO_RAD).not.toBe(0.0174533)
        expect(DEG_TO_RAD).not.toBe(0.01745)
        expect(Math.abs(DEG_TO_RAD - 0.01745)).toBeLessThan(1e-5)
    })
})

describe('geom — CPU golden values', () => {
    it('aspectOf = w / h, guarded against a zero-height viewport', () => {
        expect(aspectOf(d.vec2f(1600, 900))).toBeCloseTo(1600 / 900)
        // The guard is the point: unguarded this frame renders NaN everywhere.
        expect(Number.isFinite(aspectOf(d.vec2f(1600, 0)))).toBe(true)
    })

    it('flooredMod1 stays in [0, m) for negative inputs (unlike WGSL %)', () => {
        expect(flooredMod1(7.5, 3)).toBeCloseTo(1.5)
        expect(flooredMod1(-0.5, 3)).toBeCloseTo(2.5)
        expect(flooredMod1(3, 3)).toBeCloseTo(0)
    })

    it('flooredMod2 applies it per component', () => {
        const r = flooredMod2(d.vec2f(7.5, -0.5), d.vec2f(3, 3))
        expect(r.x).toBeCloseTo(1.5)
        expect(r.y).toBeCloseTo(2.5)
    })

    it('safeDiv is transparent for ordinary denominators', () => {
        expect(safeDiv(1, 4)).toBeCloseTo(0.25)
        expect(safeDiv(1, -4)).toBeCloseTo(-0.25)
    })

    it('safeDiv preserves the sign of a near-zero denominator', () => {
        // Clamping to max(den, eps) would flip this quotient positive — a discontinuity through
        // zero rather than a large value.
        expect(safeDiv(1, -1e-9)).toBeLessThan(0)
        expect(safeDiv(1, 1e-9)).toBeGreaterThan(0)
        expect(safeDiv(1, 0)).toBeCloseTo(1 / 1e-5, 0)
        expect(Number.isFinite(safeDiv(1, 0))).toBe(true)
    })

    it('rotate2 rotates about the origin', () => {
        // 90°: (1,0) → (0,1).
        const q = rotate2(d.vec2f(1, 0), Math.cos(HALF_PI), Math.sin(HALF_PI))
        expect(q.x).toBeCloseTo(0)
        expect(q.y).toBeCloseTo(1)
        // Rotating by an angle then its negation is the identity.
        const a = 37 * DEG_TO_RAD
        const fwd = rotate2(d.vec2f(0.3, -0.7), Math.cos(a), Math.sin(a))
        const back = rotate2(fwd, Math.cos(-a), Math.sin(-a))
        expect(back.x).toBeCloseTo(0.3, 5)
        expect(back.y).toBeCloseTo(-0.7, 5)
    })
})

describe('geom — aspect-corrected framings (D-1)', () => {
    const VP: [number, number] = [1600, 900]
    const ASPECT = 1600 / 900

    it('aspectCorrectedUV stretches X into Y units and leaves Y alone', () => {
        const q = aspectCorrectedUV(d.vec2f(0.25, 0.75), d.vec2f(VP[0], VP[1])) as unknown as {x: number; y: number}
        expect(q.x).toBeCloseTo(0.25 * ASPECT)
        expect(q.y).toBeCloseTo(0.75)
    })

    it('aspectCorrectedUVFlipY differs from the unflipped form only in Y', () => {
        // The two exist as separately-named fns precisely so a migration has to state its choice;
        // this is the assertion that they are not accidentally the same function.
        const plain = aspectCorrectedUV(d.vec2f(0.25, 0.75), d.vec2f(VP[0], VP[1])) as unknown as {x: number; y: number}
        const flipped = aspectCorrectedUVFlipY(d.vec2f(0.25, 0.75), d.vec2f(VP[0], VP[1])) as unknown as {x: number; y: number}
        expect(flipped.x).toBeCloseTo(plain.x)
        expect(flipped.y).toBeCloseTo(1 - plain.y)
    })

    it('both framings guard the aspect divide against a zero-height viewport', () => {
        for (const q of [
            aspectCorrectedUV(d.vec2f(0.5, 0.5), d.vec2f(1600, 0)) as unknown as {x: number},
            aspectCorrectedUVFlipY(d.vec2f(0.5, 0.5), d.vec2f(1600, 0)) as unknown as {x: number},
        ]) {
            expect(Number.isFinite(q.x)).toBe(true)
        }
    })
})

describe('geom — centre positions and deltas (D-1 center-scaled)', () => {
    it('unflipPosition recovers the authored Y of a transformPosition value', () => {
        const q = unflipPosition(d.vec2f(0.3, 0.8)) as unknown as {x: number; y: number}
        expect(q.x).toBeCloseTo(0.3)
        expect(q.y).toBeCloseTo(0.2)
        // It is its own inverse.
        const back = unflipPosition(q as never) as unknown as {y: number}
        expect(back.y).toBeCloseTo(0.8)
    })

    it('aspectCentrePosition scales the CENTRE, which is the canonical choice', () => {
        const aspect = 16 / 9
        const q = aspectCentrePosition(d.vec2f(0.25, 0.8), aspect) as unknown as {x: number; y: number}
        expect(q.x).toBeCloseTo(0.25 * aspect)
        expect(q.y).toBeCloseTo(0.2)
    })

    it('aspectCenteredDelta is zero exactly at the centre', () => {
        // The centre prop stores (x, 1 - y), so a stored (0.25, 0.8) is the authored point (0.25, 0.2).
        const q = aspectCenteredDelta(d.vec2f(0.25, 0.2), d.vec2f(0.25, 0.8), d.vec2f(1600, 900)) as unknown as {
            x: number
            y: number
        }
        expect(q.x).toBeCloseTo(0, 6)
        expect(q.y).toBeCloseTo(0, 6)
    })

    it('aspectCenteredDelta scales the centre rather than only the UV', () => {
        // The distinction D-1 settles: with the centre left unscaled, a horizontal offset at a
        // non-square aspect would land somewhere else entirely.
        const aspect = 1600 / 900
        const q = aspectCenteredDelta(d.vec2f(0.75, 0.5), d.vec2f(0.25, 0.5), d.vec2f(1600, 900)) as unknown as {x: number}
        expect(q.x).toBeCloseTo(0.5 * aspect)
        expect(q.x).not.toBeCloseTo(0.75 * aspect - 0.25)
    })

    it('canvasCentredDelta is the fixed-centre case of aspectCenteredDelta', () => {
        const vp = d.vec2f(1600, 900)
        const aspect = aspectOf(vp) as unknown as number
        const fixed = canvasCentredDelta(d.vec2f(0.3, 0.7), aspect) as unknown as {x: number; y: number}
        const general = aspectCenteredDelta(d.vec2f(0.3, 0.7), d.vec2f(0.5, 0.5), vp) as unknown as {x: number; y: number}
        expect(fixed.x).toBeCloseTo(general.x, 6)
        expect(fixed.y).toBeCloseTo(general.y, 6)
    })

    it('aspectCenteredDelta guards the divide against a zero-height viewport', () => {
        const q = aspectCenteredDelta(d.vec2f(0.5, 0.5), d.vec2f(0.5, 0.5), d.vec2f(1600, 0)) as unknown as {x: number}
        expect(Number.isFinite(q.x)).toBe(true)
    })
})

describe('geom — canvas-centre rotation', () => {
    const ASPECT = 1600 / 900

    it('leaves the canvas centre fixed at any angle', () => {
        // The whole point of rotating about the centre rather than the origin: a `rotation` prop must
        // spin the pattern in place, not swing it off screen.
        for (const deg of [0, 37, 90, 180, 271]) {
            const a = deg * DEG_TO_RAD
            const q = rotateAboutCanvasCentre(
                d.vec2f(ASPECT * 0.5, 0.5), ASPECT, Math.cos(a), Math.sin(a),
            ) as unknown as {x: number; y: number}
            expect(q.x).toBeCloseTo(ASPECT * 0.5, 5)
            expect(q.y).toBeCloseTo(0.5, 5)
        }
    })

    it('is the identity at zero rotation', () => {
        const q = rotateAboutCanvasCentre(d.vec2f(0.3, 0.9), ASPECT, 1, 0) as unknown as {x: number; y: number}
        expect(q.x).toBeCloseTo(0.3, 6)
        expect(q.y).toBeCloseTo(0.9, 6)
    })

    it('round-trips through an angle and its negation', () => {
        const a = 41 * DEG_TO_RAD
        const fwd = rotateAboutCanvasCentre(d.vec2f(0.3, 0.9), ASPECT, Math.cos(a), Math.sin(a))
        const back = rotateAboutCanvasCentre(fwd as never, ASPECT, Math.cos(-a), Math.sin(-a)) as unknown as {
            x: number
            y: number
        }
        expect(back.x).toBeCloseTo(0.3, 5)
        expect(back.y).toBeCloseTo(0.9, 5)
    })

    it('preserves distance from the centre (it is a rotation, not a shear)', () => {
        const a = 63 * DEG_TO_RAD
        const p = d.vec2f(0.2, 0.85)
        const q = rotateAboutCanvasCentre(p, ASPECT, Math.cos(a), Math.sin(a)) as unknown as {x: number; y: number}
        const r0 = Math.hypot(0.2 - ASPECT * 0.5, 0.85 - 0.5)
        const r1 = Math.hypot(q.x - ASPECT * 0.5, q.y - 0.5)
        expect(r1).toBeCloseTo(r0, 5)
    })

    it('the transpose (negated sine) is the inverse rotation', () => {
        // Several migrated shaders spell their inverse rotation as rotate2(p, cos, -sin); this is why
        // that is correct.
        const a = 29 * DEG_TO_RAD
        const fwd = rotate2(d.vec2f(0.4, -0.6), Math.cos(a), Math.sin(a))
        const back = rotate2(fwd as never, Math.cos(a), -Math.sin(a)) as unknown as {x: number; y: number}
        expect(back.x).toBeCloseTo(0.4, 5)
        expect(back.y).toBeCloseTo(-0.6, 5)
    })
})

describe('geom — directional projection', () => {
    it('projects onto the direction given by the cos/sin pair', () => {
        // Along the axis: the full length. Perpendicular: zero.
        expect(directionalProjection(d.vec2f(1, 0), 1, 0) as unknown as number).toBeCloseTo(1)
        expect(directionalProjection(d.vec2f(0, 1), 1, 0) as unknown as number).toBeCloseTo(0)
        const a = 30 * DEG_TO_RAD
        expect(directionalProjection(d.vec2f(2, 0), Math.cos(a), Math.sin(a)) as unknown as number)
            .toBeCloseTo(2 * Math.cos(a), 5)
    })

    it('agrees with the X component of the equivalent rotation', () => {
        const a = 52 * DEG_TO_RAD
        const p = d.vec2f(0.7, -0.3)
        const proj = directionalProjection(p, Math.cos(a), Math.sin(a)) as unknown as number
        const rotX = (rotate2(p, Math.cos(a), -Math.sin(a)) as unknown as {x: number}).x
        expect(proj).toBeCloseTo(rotX, 6)
    })
})

describe('geom — polar conversions', () => {
    it('toPolar returns radius and an angle on [-PI, PI], zero at 3 o\'clock', () => {
        const q = toPolar(d.vec2f(1, 0)) as unknown as {x: number; y: number}
        expect(q.x).toBeCloseTo(1)
        expect(q.y).toBeCloseTo(0)
        const up = toPolar(d.vec2f(0, 2)) as unknown as {x: number; y: number}
        expect(up.x).toBeCloseTo(2)
        expect(up.y).toBeCloseTo(HALF_PI, 5)
    })

    it('fromPolar inverts toPolar', () => {
        for (const [x, y] of [[0.5, 0.5], [-1.2, 0.3], [0.1, -2.4], [-3, -3]] as [number, number][]) {
            const pol = toPolar(d.vec2f(x, y)) as unknown as {x: number; y: number}
            const back = fromPolar(pol.x, pol.y) as unknown as {x: number; y: number}
            expect(back.x).toBeCloseTo(x, 5)
            expect(back.y).toBeCloseTo(y, 5)
        }
    })

    it('the angle divided by TAU is a turn fraction in [-0.5, 0.5]', () => {
        for (const [x, y] of [[1, 0], [0, 1], [-1, 0.001], [0.3, -0.9]] as [number, number][]) {
            const turn = (toPolar(d.vec2f(x, y)) as unknown as {y: number}).y / TAU
            expect(turn).toBeGreaterThanOrEqual(-0.5)
            expect(turn).toBeLessThanOrEqual(0.5)
        }
    })
})

describe('resolve gate — geom fns emit valid WGSL', () => {
    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const aspect = aspectOf(d.vec2f(1600.0, 900.0))
            const tiled = flooredMod2(input.uv.mul(4.0), d.vec2f(1.0, 1.0))
            const m1 = flooredMod1(input.uv.x * TAU, PI)
            const spun = rotate2(tiled, 0.5, 0.8660254)
            const s = safeDiv(spun.x, spun.y)
            const framed = aspectCorrectedUV(input.uv, d.vec2f(1600.0, 900.0))
            const framedFlip = aspectCorrectedUVFlipY(input.uv, d.vec2f(1600.0, 900.0))
            const centre = aspectCentrePosition(unflipPosition(d.vec2f(0.25, 0.75)), aspect)
            const delta = aspectCenteredDelta(input.uv, d.vec2f(0.25, 0.75), d.vec2f(1600.0, 900.0))
            const canvasDelta = canvasCentredDelta(input.uv, aspect)
            const spunAboutCentre = rotateAboutCanvasCentre(framed, aspect, 0.5, 0.8660254)
            const proj = directionalProjection(framedFlip, 0.5, 0.8660254)
            const pol = toPolar(delta)
            const cart = fromPolar(pol.x, pol.y)
            return d.vec4f(
                aspect + centre.x + canvasDelta.y,
                m1 * DEG_TO_RAD + spunAboutCentre.x + proj,
                s + cart.x,
                SQRT3 * GOLDEN,
            )
        })
        .$name('geomPrimitiveProbe')

    it('resolves and names every fn', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        expect(wgsl).toContain('aspectOf')
        expect(wgsl).toContain('flooredMod1')
        expect(wgsl).toContain('flooredMod2')
        expect(wgsl).toContain('rotate2')
        expect(wgsl).toContain('safeDiv')
        for (const name of [
            'aspectCorrectedUV',
            'aspectCorrectedUVFlipY',
            'unflipPosition',
            'aspectCentrePosition',
            'aspectCenteredDelta',
            'canvasCentredDelta',
            'rotateAboutCanvasCentre',
            'directionalProjection',
            'toPolar',
            'fromPolar',
        ]) {
            expect(wgsl).toContain(name)
        }
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
