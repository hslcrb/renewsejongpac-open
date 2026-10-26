import {describe, it, expect} from 'vitest'
import {tgpu, d, std} from '@coreroot/gpu/kit'
import * as lightfields from '@coreroot/gpu/kit/lightfields'

/**
 * kit/lightfields gate — the falloffs, angular lobes, chromatic bands and beam frames shared by the
 * light generators. Every fn here is pure float with no hash and no texture, so all of them get CPU
 * golden values on top of the resolve gate (C8).
 */

const TAU = Math.PI * 2

describe('lightfields — falloffs', () => {
    it('radialGaussianFalloff is 1 at the centre and decays monotonically', () => {
        expect(lightfields.radialGaussianFalloff(0, 10) as number).toBeCloseTo(1, 6)
        const a = lightfields.radialGaussianFalloff(0.2, 10) as number
        const b = lightfields.radialGaussianFalloff(0.4, 10) as number
        expect(a).toBeGreaterThan(b)
        expect(b).toBeGreaterThan(0)
        expect(lightfields.radialGaussianFalloff(0.3, 10) as number).toBeCloseTo(Math.exp(-0.09 * 10), 6)
    })

    it('radialGaussianFalloff: higher sharpness is TIGHTER', () => {
        const wide = lightfields.radialGaussianFalloff(0.3, 2) as number
        const tight = lightfields.radialGaussianFalloff(0.3, 50) as number
        expect(tight).toBeLessThan(wide)
    })

    it('anisotropicGaussianSpot stretches along whichever axis was normalized by a larger radius', () => {
        // Equal normalized offsets → equal falloff (the anisotropy lives in the caller's divide).
        expect(lightfields.anisotropicGaussianSpot(0.5, 0, 1.9) as number)
            .toBeCloseTo(lightfields.anisotropicGaussianSpot(0, 0.5, 1.9) as number, 6)
        expect(lightfields.anisotropicGaussianSpot(0, 0, 1.9) as number).toBeCloseTo(1, 6)
        expect(lightfields.anisotropicGaussianSpot(0.5, 0.5, 1.9) as number)
            .toBeCloseTo(Math.exp(0.5 * (-1.9)), 6)
    })

    it('radialGaussianGlow places a glow at a point in aspect-corrected space', () => {
        // On the light: 1. The x offset is scaled by aspect, y is not.
        expect(lightfields.radialGaussianGlow(d.vec2f(0.3, 0.7), 2, 0.3, 0.7, 0.01) as number).toBeCloseTo(1, 6)
        const dxOnly = lightfields.radialGaussianGlow(d.vec2f(0.4, 0.7), 2, 0.3, 0.7, 0.01) as number
        const dyOnly = lightfields.radialGaussianGlow(d.vec2f(0.3, 0.8), 2, 0.3, 0.7, 0.01) as number
        // At aspect 2 a horizontal offset counts double, so it falls off faster.
        expect(dxOnly).toBeLessThan(dyOnly)
    })
})

describe('lightfields — angular lobes', () => {
    it('angularSineLobes peaks once per lobe and has `count` lobes over a turn', () => {
        // count 4, no phase: peaks where sin(4θ) = 1 → θ = π/8.
        expect(lightfields.angularSineLobes(Math.PI / 8, 4, 0, 1) as number).toBeCloseTo(1, 5)
        // Trough a quarter-period later.
        expect(lightfields.angularSineLobes(Math.PI / 8 + Math.PI / 4, 4, 0, 1) as number).toBeCloseTo(0, 5)
        // Periodic in 2π/count.
        expect(lightfields.angularSineLobes(0.3, 4, 0, 1) as number)
            .toBeCloseTo(lightfields.angularSineLobes(0.3 + TAU / 4, 4, 0, 1) as number, 5)
    })

    it('angularSineLobes sharpness narrows the bright part without moving the peak', () => {
        const peak = Math.PI / 8
        expect(lightfields.angularSineLobes(peak, 4, 0, 8) as number).toBeCloseTo(1, 5)
        const wide = lightfields.angularSineLobes(peak - 0.2, 4, 0, 0.3) as number
        const narrow = lightfields.angularSineLobes(peak - 0.2, 4, 0, 8) as number
        expect(narrow).toBeLessThan(wide)
    })

    it('angularSineLobes phase rotates the pattern', () => {
        const base = lightfields.angularSineLobes(0.3, 4, 0, 1) as number
        const shifted = lightfields.angularSineLobes(0.3 - 0.5 / 4, 4, 0.5, 1) as number
        expect(shifted).toBeCloseTo(base, 5)
    })

    it('angularCosineSpikes gives 2·halfCount spikes with nulls between them', () => {
        // halfCount 3 (6 blades): peaks where cos(3θ) = ±1 → θ = 0, π/3, 2π/3…
        expect(lightfields.angularCosineSpikes(0, 3, 3.5) as number).toBeCloseTo(1, 5)
        expect(lightfields.angularCosineSpikes(Math.PI / 3, 3, 3.5) as number).toBeCloseTo(1, 5)
        // Null halfway between.
        expect(lightfields.angularCosineSpikes(Math.PI / 6, 3, 3.5) as number).toBeCloseTo(0, 5)
        // A higher power thins the spike.
        const thin = lightfields.angularCosineSpikes(0.2, 3, 8) as number
        const fat = lightfields.angularCosineSpikes(0.2, 3, 2) as number
        expect(thin).toBeLessThan(fat)
    })

    it('seamlessAngularField gives both atan2 branches plus a blend that is 0/1 away from the seam', () => {
        // Well onto +x: blend saturates at 1, so the caller uses the raw angle there.
        const right = lightfields.seamlessAngularField(d.vec2f(0.5, 0.1)) as d.v3f
        expect(right.z).toBeCloseTo(1, 6)
        expect(right.x).toBeCloseTo(Math.atan2(0.1, 0.5), 5)
        // Well onto −x (where the seam is): blend is 0, so the caller uses the WRAPPED angle.
        const left = lightfields.seamlessAngularField(d.vec2f(-0.5, 0.1)) as d.v3f
        expect(left.z).toBeCloseTo(0, 6)
        const raw = Math.atan2(0.1, -0.5)
        expect(left.y).toBeCloseTo(raw - TAU * Math.floor(raw / TAU), 5)
        // The wrapped angle is continuous ACROSS the seam — that is the whole point.
        const below = lightfields.seamlessAngularField(d.vec2f(-0.5, -0.001)) as d.v3f
        const above = lightfields.seamlessAngularField(d.vec2f(-0.5, 0.001)) as d.v3f
        expect(Math.abs(below.y - above.y)).toBeLessThan(0.01)
        // …while the raw angle jumps by a full turn there.
        expect(Math.abs(below.x - above.x)).toBeGreaterThan(6)
    })
})

describe('lightfields — chromatic ring band', () => {
    it('each channel peaks on its own radius, red outermost', () => {
        const width = 0.05
        const onGreen = lightfields.chromaticRingBand(0.5, 0.5, 0.1, width) as d.v3f
        expect(onGreen.y).toBeCloseTo(1, 6)
        expect(onGreen.x).toBeCloseTo(0, 6)
        expect(onGreen.z).toBeCloseTo(0, 6)

        const onRed = lightfields.chromaticRingBand(0.6, 0.5, 0.1, width) as d.v3f
        expect(onRed.x).toBeCloseTo(1, 6) // red sits at centre + spread
        const onBlue = lightfields.chromaticRingBand(0.4, 0.5, 0.1, width) as d.v3f
        expect(onBlue.z).toBeCloseTo(1, 6) // blue at centre − spread
    })

    it('zero spread collapses the three bands onto one (no fringe)', () => {
        const c = lightfields.chromaticRingBand(0.52, 0.5, 0, 0.05) as d.v3f
        expect(c.x).toBeCloseTo(c.y, 6)
        expect(c.y).toBeCloseTo(c.z, 6)
    })
})

describe('lightfields — segment and beam frames', () => {
    it('pointToSegment clamps t to the segment and returns the perpendicular distance', () => {
        const a = d.vec2f(0, 0)
        const b = d.vec2f(1, 0)
        const mid = lightfields.pointToSegment(d.vec2f(0.5, 0.25), a, b) as d.v2f
        expect(mid.x).toBeCloseTo(0.5, 6)
        expect(mid.y).toBeCloseTo(0.25, 6)
        // Past the end: t clamps to 1 and the distance is measured to the endpoint.
        const past = lightfields.pointToSegment(d.vec2f(2, 0), a, b) as d.v2f
        expect(past.x).toBeCloseTo(1, 6)
        expect(past.y).toBeCloseTo(1, 6)
        // Before the start: t clamps to 0.
        const before = lightfields.pointToSegment(d.vec2f(-0.5, 0), a, b) as d.v2f
        expect(before.x).toBeCloseTo(0, 6)
        expect(before.y).toBeCloseTo(0.5, 6)
    })

    it('pointToSegment survives a degenerate (zero-length) segment', () => {
        const out = lightfields.pointToSegment(d.vec2f(0.3, 0.4), d.vec2f(0.5, 0.5), d.vec2f(0.5, 0.5)) as d.v2f
        expect(Number.isFinite(out.x)).toBe(true)
        expect(Number.isFinite(out.y)).toBe(true)
    })

    it('taperedSegmentGlow interpolates thickness along the beam', () => {
        // Thick at the start, thin at the end: a fixed distance is inside at t=0 and outside at t=1.
        // Softness stays non-zero — at exactly 0 the shoulder's smoothstep edges coincide, which is
        // degenerate (WGSL leaves edge0 == edge1 undefined), and the beam props never reach it.
        const near = lightfields.taperedSegmentGlow(0.15, 0, 0.2, 0.05, 0.5, 0.5) as d.v2f
        const far = lightfields.taperedSegmentGlow(0.15, 1, 0.2, 0.05, 0.5, 0.5) as d.v2f
        expect(near.y).toBeCloseTo(1, 6)
        expect(far.y).toBeCloseTo(0, 6)
        // colorT runs inside (0) → outside (1) over the transition zone.
        expect((lightfields.taperedSegmentGlow(0, 0, 0.2, 0.2, 0.5, 0.5) as d.v2f).x).toBeCloseTo(0, 6)
        expect((lightfields.taperedSegmentGlow(0.4, 0, 0.2, 0.2, 0.5, 0.5) as d.v2f).x).toBeCloseTo(1, 6)
    })

    it('beamLocalFrame points u from the anchor toward the canvas centre', () => {
        // Anchor at the left edge (transformPosition stores 1−y, so y 0.5 stays 0.5); aspect 1.
        // The beam then runs +x, so a point to the right of the anchor has positive u and zero v.
        const frame = lightfields.beamLocalFrame(d.vec2f(0.3, 0.5), 1, d.vec2f(0.0, 0.5)) as d.v2f
        expect(frame.x).toBeCloseTo(0.3, 5)
        expect(frame.y).toBeCloseTo(0, 5)
        // A point offset perpendicular to the beam lands in v.
        const lateral = lightfields.beamLocalFrame(d.vec2f(0.3, 0.7), 1, d.vec2f(0.0, 0.5)) as d.v2f
        expect(lateral.x).toBeCloseTo(0.3, 5)
        expect(Math.abs(lateral.y)).toBeCloseTo(0.2, 5)
    })

    it('beamLocalFrame falls back to +x when the anchor sits at the centre (no spin)', () => {
        const frame = lightfields.beamLocalFrame(d.vec2f(0.7, 0.5), 1, d.vec2f(0.5, 0.5)) as d.v2f
        expect(frame.x).toBeCloseTo(0.2, 5)
        expect(frame.y).toBeCloseTo(0, 5)
    })
})

describe('resolve gate — lightfields emit valid WGSL', () => {
    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const delta = input.uv.sub(d.vec2f(0.5, 0.5))
            const dist = std.length(delta)
            const ang = lightfields.seamlessAngularField(delta)
            const rays = lightfields.angularSineLobes(ang.x, 12.0, 0.0, 2.0)
            const spikes = lightfields.angularCosineSpikes(ang.y, 3.0, 3.5)
            const glare = lightfields.radialGaussianFalloff(dist, 20.0)
            const spot = lightfields.anisotropicGaussianSpot(delta.x, delta.y, 1.9)
            const glow = lightfields.radialGaussianGlow(input.uv, 1.5, 0.3, 0.3, 0.02)
            const ring = lightfields.chromaticRingBand(dist, 0.4, 0.05, 0.02)
            const proj = lightfields.pointToSegment(input.uv, d.vec2f(0.2, 0.5), d.vec2f(0.8, 0.5))
            const beam = lightfields.taperedSegmentGlow(proj.y, proj.x, 0.1, 0.05, 0.5, 0.5)
            const frame = lightfields.beamLocalFrame(input.uv, 1.5, d.vec2f(0.95, 0.4))
            return d.vec4f(
                rays * spikes + ring.x,
                glare + spot + glow,
                beam.x * beam.y,
                frame.x + frame.y + ang.z,
            )
        })
        .$name('lightfieldsProbe')

    it('names every fn', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        // TypeGPU 0.12 namespaces shared kit-facade helpers by their module (lightfields_, …).
        for (const name of [
            'seamlessAngularField', 'angularSineLobes', 'angularCosineSpikes', 'radialGaussianFalloff',
            'anisotropicGaussianSpot', 'radialGaussianGlow', 'chromaticRingBand', 'pointToSegment',
            'taperedSegmentGlow', 'beamLocalFrame',
        ]) expect(wgsl).toContain(`fn lightfields_${name}`)
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
