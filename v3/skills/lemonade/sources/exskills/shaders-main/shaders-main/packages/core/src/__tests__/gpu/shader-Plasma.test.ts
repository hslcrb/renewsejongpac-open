import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Plasma from '@coreroot/shaders/Plasma/index'
import {gradientPaints} from '@coreroot/gpu/kit'

const {plasmaTone} = gradientPaints
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Plasma port gate (D1-G). Resolve+snapshot the domain-warped generator; assert the animatedTime
 * read, the multi-stop path, and compile-time colorSpace; CPU-golden the pure tone tail `plasmaTone`
 * (the mx-noise domain warp is hash-based → GPU-only, covered by resolve + smoke).
 */
const P = Plasma as GpuShaderDefinition
const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b)

const resolveFinal = (props?: Record<string, unknown>, animTime?: number): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'p', def: P, parentId: 'root', props, metadata: {renderOrder: 0}, animTime},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('Plasma (a) default two-color generator', () => {
    it('emits the domain/warp/tone pipeline + the animated-time read + mixColors, no multi-stop by default', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/volumeDomain/)
        expect(wgsl).toMatch(/warpDomain/)
        expect(wgsl).toMatch(/toneRemap/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('Plasma (b) multi-stop path', () => {
    it('emits the working-space stop accumulation when >1 stops are active', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#0000ff', position: 1},
        ]
        const wgsl = resolveFinal({stops})
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/warpDomain/)
    })
})

describe('Plasma (c) compile-time colorSpace', () => {
    it('oklab back-converts + is part of the structural hash', () => {
        expect(resolveFinal({colorSpace: 'oklab'})).toMatch(/oklabToRgb/)
        const hash = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'p', def: P, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hash({colorSpace: 'linear'})).not.toBe(hash({colorSpace: 'oklab'}))
    })
})

describe('Plasma (d) CPU golden — plasmaTone', () => {
    const golden = (fluid: number, intensity: number, contrast: number, balance: number) => {
        const plasma = Math.pow(fluid, 5 / intensity)
        const contrasted = clamp((plasma - 0.5) * contrast + 0.5, 0, 1)
        const balanced = clamp(contrasted + (balance / 100 - 0.5), 0, 1)
        return 1 - balanced
    }
    it('reproduces the v1 pow/contrast/balance tail (inverted for stop ordering)', () => {
        const cases: [number, number, number, number][] = [
            [0.7, 1.5, 1, 50],
            [0.3, 2.5, 2, 30],
            [0.9, 0.5, 0.5, 80],
        ]
        for (const [fluid, intensity, contrast, balance] of cases) {
            const out = plasmaTone(fluid, intensity, contrast, balance) as unknown as number
            expect(out).toBeCloseTo(golden(fluid, intensity, contrast, balance), 5)
        }
    })
})
