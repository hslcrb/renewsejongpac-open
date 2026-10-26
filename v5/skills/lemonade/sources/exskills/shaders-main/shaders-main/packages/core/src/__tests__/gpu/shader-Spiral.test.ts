import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Spiral from '@coreroot/shaders/Spiral/index'
import {gradientPaints} from '@coreroot/gpu/kit'

const {spiralOffset} = gradientPaints
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Spiral port gate (D1-G). Resolve+snapshot the generator; assert the animatedTime read + fwidth AA
 * mask + compile-time colorSpace; CPU-golden `spiralOffset` (the pure radial/angle math) vs the v1
 * fragmentNode transcription (std.atan2 == v1's two-arg atan; fract, not std.mod, wraps the angle).
 */
const S = Spiral as GpuShaderDefinition
const TWO_PI = 6.283185307

const resolveFinal = (props?: Record<string, unknown>, animTime?: number): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 's', def: S, parentId: 'root', props, metadata: {renderOrder: 0}, animTime},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('Spiral (a) default generator', () => {
    it('emits spiralMask (fwidth AA) + the animated-time read + mixColors', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/spiralMask/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/fwidth/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('Spiral (b) compile-time colorSpace', () => {
    it('oklab back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveFinal({colorSpace: 'oklab'})).toMatch(/oklabToRgb/)
        expect(resolveFinal({colorSpace: 'linear'})).not.toMatch(/oklabToRgb/)
        const hash = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 's', def: S, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hash({colorSpace: 'linear'})).not.toBe(hash({colorSpace: 'oklab'}))
    })
})

describe('Spiral (c) CPU golden — spiralOffset', () => {
    const golden = (center: [number, number], scale: number, at: number, uv: [number, number], vp: [number, number]) => {
        const aspect = vp[0] / vp[1]
        const dx = uv[0] * aspect - center[0] * aspect
        const dy = uv[1] - (1 - center[1])
        const l = Math.hypot(dx, dy)
        const angle = Math.atan2(dy, dx) - at
        return l * scale + angle / TWO_PI
    }
    it('reproduces the v1 spiral offset (radius·scale + angle/2π − animTime)', () => {
        const cases: {center: [number, number]; scale: number; at: number; uv: [number, number]; vp: [number, number]}[] = [
            {center: [0.5, 0.5], scale: 1, at: 0, uv: [0.7, 0.6], vp: [800, 600]},
            {center: [0.4, 0.55], scale: 2.5, at: 1.3, uv: [0.3, 0.7], vp: [1, 1]},
            {center: [0.5, 0.5], scale: 0.5, at: -0.8, uv: [0.9, 0.2], vp: [16, 9]},
        ]
        for (const c of cases) {
            const out = spiralOffset(d.vec2f(c.center[0], c.center[1]), c.scale, c.at, d.vec2f(c.uv[0], c.uv[1]), d.vec2f(c.vp[0], c.vp[1])) as unknown as number
            expect(out).toBeCloseTo(golden(c.center, c.scale, c.at, c.uv, c.vp), 5)
        }
    })
})
