import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import WaveletNoise from '@coreroot/shaders/WaveletNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * WaveletNoise port gate (D1-E) — animated rotating-banded-wavelet generator over kit `wavelet12`
 * (with a `detail` per-octave frequency prop). Shared `toneAndColor` color path. GPU-free
 * resolve/snapshot + the animatedTime CPU driver through the renderer's __testing surface.
 */
const WN = WaveletNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'wn', def: WN, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('WaveletNoise (a) default two-color generator', () => {
    it('emits the wavelet12 field composition + animated-time + tone/mixColors', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/wavelet12/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/noiseToneKColor/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('WaveletNoise (b) multi-stop + compile-time colorSpace', () => {
    it('multi-stop emits the accumulation; oklch colorSpace back-converts + hashes', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#0000ff', position: 1},
        ]
        const wgsl = resolveFinal({stops, colorSpace: 'oklch'})
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/oklchToOklab/)

        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'wn', def: WN, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklch'}))
    })
})

describe('WaveletNoise (c) animatedTime driver', () => {
    it('registers + advances `_animTime` at the node speed', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('wn', WN.fragment, 'root', meta(), {speed: u(1)} as never, WN)
        expect(r.__testing.buildFieldInits('wn')!.some((f) => f.name === '_animTime')).toBe(true)
        for (let i = 0; i < 30; i++) r.__testing.stepAnimatedTime(1 / 60)
        expect(r.__testing.getAnimatedTimeValue('wn')!).toBeCloseTo(0.5, 5)
    })
})
