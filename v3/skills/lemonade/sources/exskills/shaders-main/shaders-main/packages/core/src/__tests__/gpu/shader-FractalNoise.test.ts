import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import FractalNoise from '@coreroot/shaders/FractalNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * FractalNoise port gate (D1-C) — multi-octave fBm over the kit MaterialX `mxNoiseFloat2`. Uses
 * the gradient value DIRECTLY (no tone inversion, unlike the other three), so `noiseToneKColor`
 * must NOT appear. `octaves` is compile-time (structural hash), `angle`/`colorSpace` transform-backed.
 */
const FN = FractalNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'fn', def: FN, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('FractalNoise (a) default two-color generator', () => {
    it('emits the fractalSum composition (mxNoiseFloat2) + animated-time, colors WITHOUT tone inversion', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/fractalSum/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/mixColors/)
        // FractalNoise colors the raw normalized value — the toneAndColor path is NOT used.
        expect(wgsl).not.toMatch(/noiseToneKColor/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('FractalNoise (b) multi-stop + compile-time colorSpace', () => {
    it('multi-stop emits the accumulation; oklab colorSpace back-converts', () => {
        const stops = [
            {color: '#000000', position: 0},
            {color: '#ffffff', position: 1},
            {color: '#3366ff', position: 0.6},
        ]
        const wgsl = resolveFinal({stops, colorSpace: 'oklab'})
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/oklabToRgb/)
    })

    it('octaves + colorSpace are part of the structural (recompile) hash', () => {
        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'fn', def: FN, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({octaves: 2})).not.toBe(hashWith({octaves: 6}))
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklab'}))
    })
})

describe('FractalNoise (c) animatedTime driver', () => {
    it('advances `_animTime` at the (fractional) node speed over 30 frames', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('fn', FN.fragment, 'root', meta(), {speed: u(0.15)} as never, FN)
        for (let i = 0; i < 30; i++) r.__testing.stepAnimatedTime(1 / 60)
        expect(r.__testing.getAnimatedTimeValue('fn')!).toBeCloseTo(0.075, 5) // 0.15 * 0.5
    })
})
