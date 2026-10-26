import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Swirl from '@coreroot/shaders/Swirl/index'
import {gradientPaints} from '@coreroot/gpu/kit'

const {flowLayers, unitThreshold, shimmerPulse} = gradientPaints

// The pattern + threshold + shimmer parts composed back into the original fused field
// (CPU-executable): returns {x: blendFactor, y: shimmer}.
const swirlField = (uv: unknown, detail: number, blend: number, t: number): {x: number; y: number} => {
    const pattern = flowLayers(uv as never, detail, t) as unknown as number
    return {
        x: unitThreshold(pattern, (blend - 50) * 0.006, 0.3, 0.7) as unknown as number,
        y: shimmerPulse(pattern, t, 2.5, 8, 0.015) as unknown as number,
    }
}
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Swirl port gate (D1-G). Resolve+snapshot the generator; assert the animatedTime read, the
 * multi-stop path, and compile-time colorSpace; CPU-golden `swirlField` (pure trig, no hash) vs the
 * v1 fragmentNode transcription.
 */
const S = Swirl as GpuShaderDefinition
const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
    return t * t * (3 - 2 * t)
}

const resolveFinal = (props?: Record<string, unknown>, animTime?: number): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 's', def: S, parentId: 'root', props, metadata: {renderOrder: 0}, animTime},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('Swirl (a) default two-color generator', () => {
    it('emits the flow/threshold/shimmer pipeline + the animated-time read + mixColors, no multi-stop by default', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/flowLayers/)
        expect(wgsl).toMatch(/unitThreshold/)
        expect(wgsl).toMatch(/shimmerPulse/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('Swirl (b) multi-stop path', () => {
    it('emits the working-space stop accumulation when >1 stops are active', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#00ff00', position: 0.5},
            {color: '#0000ff', position: 1},
        ]
        const wgsl = resolveFinal({stops})
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/flowLayers/)
    })
})

describe('Swirl (c) compile-time colorSpace', () => {
    it('oklch back-converts + is part of the structural hash', () => {
        expect(resolveFinal({colorSpace: 'oklch'})).toMatch(/oklchToOklab/)
        const hash = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 's', def: S, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hash({colorSpace: 'linear'})).not.toBe(hash({colorSpace: 'oklch'}))
    })
})

describe('Swirl (d) CPU golden — swirlField', () => {
    const golden = (uv: [number, number], detail: number, blend: number, t: number): [number, number] => {
        const freq1 = detail
        const d1x = uv[0] + (Math.sin(uv[1] * (freq1 * 1.7) + t * 0.8) * 0.12 + Math.cos(uv[0] * (freq1 * 0.9) - t * 0.5) * 0.05)
        const d1y = uv[1] + (Math.cos(uv[0] * (freq1 * 1.3) - t * 0.6) * 0.12 + Math.sin(uv[1] * (freq1 * 1.1) + t * 0.7) * 0.05)
        const pattern1 = Math.sin(d1x * (freq1 * 2.1) + d1y * (freq1 * 1.8) + t * 0.4)
        const freq2 = detail * 2.1
        const d2x = d1x + (Math.cos(d1y * (freq2 * 2.7) - t * 0.45) * 0.07 + Math.sin(d1x * (freq2 * 1.9) + t * 0.6) * 0.04)
        const d2y = d1y + (Math.sin(d1x * (freq2 * 2.3) + t * 0.65) * 0.07 + Math.cos(d1y * (freq2 * 1.6) - t * 0.4) * 0.04)
        const pattern2 = Math.cos(d2x * (freq2 * 1.4) - d2y * (freq2 * 1.9) + t * 0.35)
        const freq3 = detail * 3.7
        const d3x = d2x + (Math.sin(d2y * (freq3 * 1.8) + t * 0.85) * 0.04 + Math.cos(d2x * (freq3 * 1.3) - t * 0.55) * 0.025 + Math.sin((d2x + d2y) * (freq3 * 0.7) + t * 0.9) * 0.02)
        const d3y = d2y + (Math.cos(d2x * (freq3 * 1.6) - t * 0.75) * 0.04 + Math.sin(d2y * (freq3 * 1.1) + t * 0.5) * 0.025 + Math.cos((d2x + d2y) * (freq3 * 0.8) - t * 0.95) * 0.02)
        const pattern3 = Math.sin(d3x * (freq3 * 1.1) + d3y * (freq3 * 1.5) - t * 0.55)
        const combinedPattern = pattern1 * 0.45 + pattern2 * 0.35 + pattern3 * 0.2
        const blendBias = (blend - 50) * 0.006
        const normalizedPattern = combinedPattern * 0.5 + 0.5 + blendBias
        return [smoothstep(0.3, 0.7, normalizedPattern), Math.sin(t * 2.5 + combinedPattern * 8) * 0.015 + 1]
    }
    it('reproduces the v1 blend factor + shimmer', () => {
        const cases: {uv: [number, number]; detail: number; blend: number; t: number}[] = [
            {uv: [0.3, 0.7], detail: 1, blend: 50, t: 0.4},
            {uv: [0.8, 0.2], detail: 2.5, blend: 20, t: 1.7},
            {uv: [0.55, 0.45], detail: 0.5, blend: 80, t: 3.2},
        ]
        for (const c of cases) {
            const out = swirlField(d.vec2f(c.uv[0], c.uv[1]), c.detail, c.blend, c.t) as unknown as {x: number; y: number}
            const [bf, sh] = golden(c.uv, c.detail, c.blend, c.t)
            expect(out.x).toBeCloseTo(bf, 5)
            expect(out.y).toBeCloseTo(sh, 5)
        }
    })
})
