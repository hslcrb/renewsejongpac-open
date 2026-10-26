import {describe, it, expect} from 'vitest'
import {tgpu, d, noiseStylize} from '@coreroot/gpu/kit'

/**
 * kit/noiseStylize.ts gate (D1-E) — the relief filter's pure GPU math (Stone/Wool consume the
 * Expr-level `applyNoiseReliefExpr`, exercised by shader-Stone/Wool.test.ts). Two layers, mirroring
 * kit-noiseFi.test.ts:
 *   1. RESOLVE GATE — every tgpu.fn transpiles to WGSL (incl. `reliefDisplacedUV`, which calls the
 *      hash-based perlin12d → GPU-only, no CPU golden).
 *   2. CPU GOLDEN — the pure-float members (`reliefPos`, `reliefBrightness`) vs the v1 formula.
 */

// ── (1) Resolve gate ──────────────────────────────────────────────────────────────────────────
describe('kit noiseStylize — resolve gate (all fns transpile to WGSL)', () => {
    const fns: Record<string, unknown> = {
        reliefPos: tgpu.fn([d.vec2f, d.f32, d.f32, d.f32], d.vec2f)((uv, a, s, seed) => {
            'use gpu'
            return noiseStylize.reliefPos(uv, a, s, seed)
        }),
        reliefDisplacedUV: tgpu.fn([d.vec2f, d.vec2f, d.f32], d.vec2f)((uv, p, dist) => {
            'use gpu'
            return noiseStylize.reliefDisplacedUV(uv, p, dist)
        }),
        reliefBrightness: tgpu.fn([d.f32, d.f32, d.f32], d.f32)((h, c, i) => {
            'use gpu'
            return noiseStylize.reliefBrightness(h, c, i)
        }),
    }
    for (const [name, fn] of Object.entries(fns)) {
        it(`${name} resolves`, () => {
            expect(tgpu.resolve([fn], {names: 'strict'}).length).toBeGreaterThan(0)
        })
    }
})

// ── (2a) reliefPos golden — aspect-correct + scale*4 + seed ─────────────────────────────────────
describe('kit noiseStylize — reliefPos golden', () => {
    // v1: aspectUV = (uv.x*aspect, uv.y); freq = scale*4 (default freqMul); pos = aspectUV*freq + seed.
    const golden = (ux: number, uy: number, aspect: number, scale: number, seed: number): [number, number] => {
        const freq = scale * 4
        return [ux * aspect * freq + seed, uy * freq + seed]
    }
    const cases: [number, number, number, number, number][] = [
        [0.5, 0.5, 800 / 600, 1, 0],
        [0.2, 0.8, 1, 4, 3],
        [0.9, 0.1, 16 / 9, 0.5, 10],
    ]
    it('matches the aspect-correct scaled sample position', () => {
        for (const [ux, uy, aspect, scale, seed] of cases) {
            const out = noiseStylize.reliefPos(d.vec2f(ux, uy), aspect, scale, seed) as {x: number; y: number}
            const [ex, ey] = golden(ux, uy, aspect, scale, seed)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})

// ── (2b) reliefBrightness golden — the contrast-remap + intensity modulation ────────────────────
describe('kit noiseStylize — reliefBrightness golden', () => {
    // v1: hAdj = (h-0.5)*(contrast+1)+0.5; brightness = clamp(1 + (hAdj-0.5)*(intensity*1.1), 0, 1.6).
    const golden = (h: number, contrast: number, intensity: number) => {
        const hAdj = (h - 0.5) * (contrast + 1) + 0.5
        return Math.min(Math.max(1 + (hAdj - 0.5) * (intensity * 1.1), 0), 1.6)
    }
    const cases: [number, number, number][] = [
        [0.5, 0, 0.5],
        [0.9, 1, 1],
        [0.1, -0.5, 0.5],
        [1.0, 2, 1],
    ]
    it('matches the v1 height→brightness mapping (incl. the [0,1.6] clamp)', () => {
        for (const [h, c, i] of cases) {
            const out = noiseStylize.reliefBrightness(h, c, i) as number
            expect(out).toBeCloseTo(golden(h, c, i), 5)
        }
    })

    it('is exactly 1 when intensity is 0 (no relief shading)', () => {
        expect(noiseStylize.reliefBrightness(0.9, 1.5, 0) as number).toBeCloseTo(1, 6)
    })
})
