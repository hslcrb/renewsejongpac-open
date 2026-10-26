import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Ripples from '@coreroot/shaders/Ripples/index'
import {ripplesMask} from '@coreroot/gpu/kit/patternPaints'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Ripples port gate (W7-D) — an animated two-color GENERATOR (not a distortion; distinct from
 * CursorRipples). Concentric `sin`-wave rings from a (double-flipped, aspect-corrected) center,
 * banded by thickness/softness, mixed background→ripple in LINEAR space (no colorSpace prop). Reads
 * `_animTime`. `ripplesMask` is pure trig → CPU-goldenable (softness > 0 to avoid the degenerate
 * `smoothstep(t, t, x)` step v1 emits at the default softness=0).
 */
const RP = Ripples as GpuShaderDefinition

describe('Ripples (a) generator path', () => {
    it('final pass calls ripplesMask, reads _animTime, mixes in linear space, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'rp', def: RP, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/ripplesMask/)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(finalWgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('Ripples (b) CPU golden — ripple mask', () => {
    it('matches the sin/distance/inverted-smoothstep chain transcribed by hand', () => {
        const smoothstep = (e0: number, e1: number, x: number) => {
            const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
            return t * t * (3 - 2 * t)
        }
        const cases = [
            {center: [0.5, 0.5] as const, frequency: 20, softness: 0.5, thickness: 0.5, phase: 0, animTime: 1.3, uv: [0.7, 0.6] as const, vp: [1600, 900] as const},
            {center: [0.3, 0.4] as const, frequency: 40, softness: 1.2, thickness: 0.8, phase: 1.5, animTime: 4.2, uv: [0.2, 0.9] as const, vp: [1000, 1000] as const},
            {center: [0.5, 0.5] as const, frequency: 12, softness: 0.9, thickness: 0.2, phase: 3.1, animTime: 0.0, uv: [0.55, 0.45] as const, vp: [1200, 800] as const},
        ]
        for (const {center, frequency, softness, thickness, phase, animTime, uv, vp} of cases) {
            const aspect = vp[0] / vp[1]
            const dx = uv[0] * aspect - center[0] * aspect
            const dy = uv[1] - (1 - center[1])
            const dist = Math.hypot(dx, dy)
            const waveInput = dist * frequency - animTime + phase
            const baseWave = Math.sin(waveInput)
            const tt = thickness * 2 - 1
            const expected = 1 - smoothstep(tt - softness, tt + softness, baseWave)
            const out = ripplesMask(
                d.vec2f(center[0], center[1]), frequency, softness, thickness, phase, animTime,
                d.vec2f(uv[0], uv[1]), d.vec2f(vp[0], vp[1]),
            ) as unknown as number
            expect(out).toBeCloseTo(expected, 5)
        }
    })
})
