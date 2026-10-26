import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Line, {transformLineStyle, transformLineCap} from '@coreroot/shaders/Line/index'
import {lineMask} from '@coreroot/gpu/kit/shapePaints'
import {transformPosition} from '@coreroot/utilities/transformations'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Line gate. Static single-color shape generator (segment SDF with per-end square/rounded caps +
 * endpoint-aligned dash/dot patterns). GPU-free resolve+snapshot of the final pass, plus CPU
 * behavioral checks of the pure `lineMask` body — the endpoint-alignment rescale and the per-side
 * cap select are the math worth pinning.
 */

const LN = Line as GpuShaderDefinition

describe('Line (a) generator emits lineMask, no RTT', () => {
    it('final pass calls lineMask', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'ln', def: LN, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/lineMask/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('maps style and cap names to runtime mode numbers', () => {
        expect(transformLineStyle('solid')).toBe(0)
        expect(transformLineStyle('dashed')).toBe(1)
        expect(transformLineStyle('dotted')).toBe(2)
        expect(transformLineStyle('bogus')).toBe(0)
        expect(transformLineCap('square')).toBe(0)
        expect(transformLineCap('rounded')).toBe(1)
        expect(transformLineCap('bogus')).toBe(1)
    })
})

describe('Line (b) CPU behavioral — lineMask coverage', () => {
    // Horizontal segment A(0.25, 0.5) → B(0.75, 0.5) on a square viewport: stored y equals
    // authored y (1 - 0.5 = 0.5), aspect = 1, len = 0.5. Distances are in canvas-height units.
    const VP = d.vec2f(1000, 1000)
    const A = d.vec2f(0.25, 0.5)
    const B = d.vec2f(0.75, 0.5)
    const THICK = 0.02 // halfT = 0.01, comfortably above the built-in 1px feather (0.001)
    const ROUND = 1
    const SQUARE = 0
    const mask = (
        uv: [number, number], style: number,
        {dash = 0.05, gap = 0.025, capStart = ROUND, capEnd = ROUND} = {},
    ): number =>
        lineMask(d.vec2f(uv[0], uv[1]), VP, A, B, THICK, style, dash, gap, capStart, capEnd) as unknown as number

    it('solid rounded: covers the segment core and endpoint-centered round caps', () => {
        expect(mask([0.5, 0.5], 0)).toBeCloseTo(1, 5)     // segment center
        expect(mask([0.5, 0.55], 0)).toBeCloseTo(0, 5)    // 0.05 perpendicular — well outside halfT
        expect(mask([0.755, 0.5], 0)).toBeCloseTo(1, 5)   // round cap: 0.005 past B, within halfT
        expect(mask([0.78, 0.5], 0)).toBeCloseTo(0, 5)    // 0.03 past B — outside the cap
    })

    it('solid square: ends flat exactly at the endpoints', () => {
        const caps = {capStart: SQUARE, capEnd: SQUARE}
        expect(mask([0.745, 0.5], 0, caps)).toBeCloseTo(1, 5)  // 0.005 inside B
        expect(mask([0.755, 0.5], 0, caps)).toBeCloseTo(0, 5)  // 0.005 past B — no projection
        expect(mask([0.255, 0.5], 0, caps)).toBeCloseTo(1, 5)  // 0.005 inside A
        expect(mask([0.245, 0.5], 0, caps)).toBeCloseTo(0, 5)  // 0.005 past A
    })

    it('mixed caps: capStart shapes the A side, capEnd the B side', () => {
        const caps = {capStart: SQUARE, capEnd: ROUND}
        expect(mask([0.245, 0.5], 0, caps)).toBeCloseTo(0, 5)  // past A: square, cut flat
        expect(mask([0.755, 0.5], 0, caps)).toBeCloseTo(1, 5)  // past B: rounded, projects
    })

    it('dashed: dash=0.06 gap=0.04 rescales to 5 dashes landing exactly on A and B', () => {
        // n = round((0.5+0.04)/0.1) = 5; scale = 0.5/(5*0.06+4*0.04) = 0.5/0.46; dashL ≈ 0.06522,
        // period ≈ 0.10870. First dash spans [0, dashL], last spans [len-dashL, len].
        const opts = {dash: 0.06, gap: 0.04}
        expect(mask([0.26, 0.5], 1, opts)).toBeCloseTo(1, 5)   // t=0.01, inside first dash
        expect(mask([0.74, 0.5], 1, opts)).toBeCloseTo(1, 5)   // t=0.49, inside last dash
        expect(mask([0.2, 0.5], 1, opts)).toBeCloseTo(0, 5)    // beyond A — pattern doesn't leak
        // First gap center: t = (dashL + period)/2 ≈ 0.08696
        const dashL = 0.06 * (0.5 / 0.46)
        const period = 0.1 * (0.5 / 0.46)
        expect(mask([0.25 + (dashL + period) / 2, 0.5], 1, opts)).toBeCloseTo(0, 5)
    })

    it('dashed: cap style shapes dash ends (corner of the first dash)', () => {
        // Point near the first dash's leading corner (t=0.002, perp=0.008): outside the inscribed
        // round cap (√(0.008²+0.008²) > halfT) but inside the square dash footprint.
        const pt: [number, number] = [0.252, 0.508]
        expect(mask(pt, 1, {dash: 0.06, gap: 0.04, capStart: ROUND, capEnd: ROUND})).toBeCloseTo(0, 5)
        expect(mask(pt, 1, {dash: 0.06, gap: 0.04, capStart: SQUARE, capEnd: SQUARE})).toBeCloseTo(1, 5)
    })

    it('dotted: gap=0.08 rescales to dots at every 0.1 including both endpoints', () => {
        // rawPeriod = thickness + gap = 0.1; n = round(0.5/0.1) = 5 → dots at t = 0, 0.1, …, 0.5.
        const opts = {gap: 0.08}
        expect(mask([0.25, 0.5], 2, opts)).toBeCloseTo(1, 5)   // dot centered on A
        expect(mask([0.75, 0.5], 2, opts)).toBeCloseTo(1, 5)   // dot centered on B
        expect(mask([0.35, 0.5], 2, opts)).toBeCloseTo(1, 5)   // interior dot at t=0.1
        expect(mask([0.30, 0.5], 2, opts)).toBeCloseTo(0, 5)   // midway between dots
        expect(mask([0.35, 0.53], 2, opts)).toBeCloseTo(0, 5)  // 0.03 perpendicular off a dot
    })

    it('dotted: square caps square off the dots (corner coverage)', () => {
        // Corner of the dot at t=0.1: (t=0.108, perp=0.008) is outside the round dot's radius
        // (√(0.008²+0.008²) > halfT) but inside the thickness×thickness square dot.
        const pt: [number, number] = [0.358, 0.508]
        expect(mask(pt, 2, {gap: 0.08, capStart: ROUND, capEnd: ROUND})).toBeCloseTo(0, 5)
        expect(mask(pt, 2, {gap: 0.08, capStart: SQUARE, capEnd: SQUARE})).toBeCloseTo(1, 5)
    })

    it('distinct endpoint ys: recovers authored y from transformPosition storage', () => {
        // Authored A(0.5, 0.2) → B(0.5, 0.8). transformPosition stores (x, 1 − y), so the shader
        // receives A=(0.5, 0.8), B=(0.5, 0.2) and must flip back before comparing against uv.y
        // (which grows downward, matching authored y).
        const sA = transformPosition({x: 0.5, y: 0.2})
        const sB = transformPosition({x: 0.5, y: 0.8})
        const at = (uv: [number, number]): number =>
            lineMask(d.vec2f(uv[0], uv[1]), VP, d.vec2f(sA.x, sA.y), d.vec2f(sB.x, sB.y), THICK, 0, 0.05, 0.025, ROUND, ROUND) as unknown as number
        expect(at([0.5, 0.5])).toBeCloseTo(1, 5)   // segment midpoint
        expect(at([0.5, 0.2])).toBeCloseTo(1, 5)   // authored A
        expect(at([0.5, 0.8])).toBeCloseTo(1, 5)   // authored B
        expect(at([0.5, 0.15])).toBeCloseTo(0, 5)  // 0.05 above authored A — outside the cap
        expect(at([0.52, 0.5])).toBeCloseTo(0, 5)  // 0.02 perpendicular — outside halfT
    })

    it('degenerate: coincident endpoints render a round point instead of dividing by zero', () => {
        const at = (uv: [number, number], style: number): number =>
            lineMask(d.vec2f(uv[0], uv[1]), VP, A, A, THICK, style, 0.05, 0.025, ROUND, ROUND) as unknown as number
        expect(at([0.25, 0.5], 0)).toBeCloseTo(1, 5)
        expect(at([0.3, 0.5], 0)).toBeCloseTo(0, 5)
        expect(at([0.25, 0.5], 2)).toBeCloseTo(1, 5)  // dotted degenerates to a single dot
        expect(at([0.3, 0.5], 2)).toBeCloseTo(0, 5)
    })
})
