import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import ColorWheel from '@coreroot/shaders/ColorWheel/index'
import {gradientPaints} from '@coreroot/gpu/kit'

const {colorWheelT, colorWheelRainbow} = gradientPaints
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * ColorWheel port gate (D1-F). compileTime `mode` branches the whole fragment: rainbow (procedural
 * HSV) vs custom (3-color cycle in the compile-time colorSpace). Plus CPU goldens for the pure
 * shared `colorWheelT` + rainbow bodies.
 */
const CW = ColorWheel as GpuShaderDefinition

describe('ColorWheel (a) rainbow mode', () => {
    it('final pass calls colorWheelRainbow (no mixColors, no RTT)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'cw', def: CW, parentId: 'root', props: {mode: 'rainbow'}, metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/colorWheelRainbow/)
        expect(wgsl).toMatch(/colorWheelT/)
        expect(wgsl).not.toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('rainbow-final-pass')
    })
})

describe('ColorWheel (b) custom mode', () => {
    it('final pass calls colorWheelSelect + mixColors', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'cw', def: CW, parentId: 'root', props: {mode: 'custom'}, metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/colorWheelSelect/)
        expect(wgsl).toMatch(/colorWheelPhase/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatchSnapshot('custom-final-pass')
    })

    it('mode and colorSpace are part of the structural hash', () => {
        const hashWith = (props: Record<string, unknown>) =>
            collectStructuralHashInputs(
                buildRegistry([
                    {id: 'root', def: RootContainer, parentId: null},
                    {id: 'cw', def: CW, parentId: 'root', props, metadata: {renderOrder: 0}},
                ]).registry,
            ).join('\n')
        expect(hashWith({mode: 'rainbow'})).not.toBe(hashWith({mode: 'custom'}))
        expect(hashWith({mode: 'custom', colorSpace: 'oklch'})).not.toBe(hashWith({mode: 'custom', colorSpace: 'hsl'}))
    })
})

describe('ColorWheel (c) CPU golden — colorWheelT + rainbow', () => {
    const goldenT = (uv: [number, number], vp: [number, number], angle: number, scale: number, at: number): number => {
        const aspect = vp[0] / Math.max(vp[1], 1e-6)
        const r = angle * (Math.PI / 180)
        // Projection from the canvas centre, with the angle-0 phase of the uncentred projection
        // restored (Gate C pivot fix — see the note in ColorWheel/index.ts).
        const projected = (uv[0] * aspect - aspect * 0.5) * Math.cos(r) + (uv[1] - 0.5) * Math.sin(r) + aspect * 0.5
        const x = projected * scale * 0.2 + at
        return x - Math.floor(x)
    }
    const goldenRainbow = (t: number): [number, number, number] => {
        const clamp = (v: number) => Math.min(Math.max(v, 0), 1)
        const h6 = t * 6
        return [clamp(Math.abs(h6 - 3) - 1), clamp(2 - Math.abs(h6 - 2)), clamp(2 - Math.abs(h6 - 4))]
    }
    it('t matches the projected+animated cycle coordinate', () => {
        const cases: {uv: [number, number]; vp: [number, number]; angle: number; scale: number; at: number}[] = [
            {uv: [0.5, 0.5], vp: [800, 600], angle: 0, scale: 1, at: 0},
            {uv: [0.3, 0.7], vp: [1280, 720], angle: 45, scale: 2, at: 0.4},
        ]
        for (const c of cases) {
            const out = colorWheelT(d.vec2f(c.uv[0], c.uv[1]), d.vec2f(c.vp[0], c.vp[1]), c.angle, c.scale, c.at) as unknown as number
            expect(out).toBeCloseTo(goldenT(c.uv, c.vp, c.angle, c.scale, c.at), 5)
        }
    })
    // Gate C pivot fix: the projection now runs from the canvas centre so `angle` spins the gradient
    // in place. The centring term is exactly cancelled at angle 0 by the restored phase anchor, so
    // the default (angle 0) is bit-for-bit what it was before the fix — this pins that.
    it('is identical to the uncentred projection at angle 0, for any aspect', () => {
        for (const vp of [[800, 600], [1920, 1080], [400, 1200], [1, 1]] as [number, number][]) {
            const aspect = vp[0] / vp[1]
            for (const uv of [[0, 0], [0.5, 0.5], [0.8, 0.2], [1, 1]] as [number, number][]) {
                const out = colorWheelT(d.vec2f(uv[0], uv[1]), d.vec2f(vp[0], vp[1]), 0, 2, 0.4) as unknown as number
                const x = uv[0] * aspect * 2 * 0.2 + 0.4
                expect(out).toBeCloseTo(x - Math.floor(x), 5)
            }
        }
    })
    it('rainbow reproduces the HSV hue triangle', () => {
        for (const t of [0, 0.2, 0.5, 0.83]) {
            const out = colorWheelRainbow(t) as unknown as {x: number; y: number; z: number; w: number}
            const [r, g, b] = goldenRainbow(t)
            expect(out.x).toBeCloseTo(r, 5)
            expect(out.y).toBeCloseTo(g, 5)
            expect(out.z).toBeCloseTo(b, 5)
            expect(out.w).toBeCloseTo(1, 5)
        }
    })
})
