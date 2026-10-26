import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import SimplexNoise from '@coreroot/shaders/SimplexNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * SimplexNoise port gate (D1-E) — animated MaterialX (`mxNoiseFloat3`) generator. Unlike the shared
 * `toneAndColor` textures, its tone controls act on the RAW [-1,1] noise (contrast scales, balance
 * offsets) and the body returns the finished inverted gradient parameter, so `noiseToneKColor` must
 * NOT appear; only the shared multi-stop / two-color dispatch is used. GPU-free resolve/snapshot +
 * the animatedTime CPU driver.
 */
const SN = SimplexNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'sn', def: SN, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('SimplexNoise (a) default two-color generator', () => {
    it('emits the mxNoiseFloat3 field composition + animated-time + mixColors, WITHOUT the shared tone invert', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/mxNoiseFloat3/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/mixColors/)
        // SimplexNoise applies its own tone in the body → the shared noiseToneKColor is NOT used.
        expect(wgsl).not.toMatch(/noiseToneKColor/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('SimplexNoise (b) multi-stop + compile-time colorSpace', () => {
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
                {id: 'sn', def: SN, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklch'}))
    })
})

describe('SimplexNoise (c) animatedTime driver', () => {
    it('registers + advances `_animTime` at the node speed', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('sn', SN.fragment, 'root', meta(), {speed: u(1)} as never, SN)
        expect(r.__testing.buildFieldInits('sn')!.some((f) => f.name === '_animTime')).toBe(true)
        for (let i = 0; i < 30; i++) r.__testing.stepAnimatedTime(1 / 60)
        expect(r.__testing.getAnimatedTimeValue('sn')!).toBeCloseTo(0.5, 5)
    })
})
