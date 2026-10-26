import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import GaborNoise from '@coreroot/shaders/GaborNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * GaborNoise port gate (D1-E) — animated oriented-sine-grain generator over kit `gabor12` (with a
 * `frequency` prop). Shared `toneAndColor` color path. GPU-free resolve/snapshot + the animatedTime
 * CPU driver through the renderer's __testing surface.
 */
const GN = GaborNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'gn', def: GN, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('GaborNoise (a) default two-color generator', () => {
    it('emits the gabor12 field composition + animated-time + tone/mixColors', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/gabor12/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/noiseToneKColor/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('GaborNoise (b) multi-stop + compile-time colorSpace', () => {
    it('multi-stop emits the accumulation; oklab colorSpace back-converts + hashes', () => {
        const stops = [
            {color: '#000000', position: 0},
            {color: '#ffffff', position: 1},
            {color: '#3366ff', position: 0.6},
        ]
        const wgsl = resolveFinal({stops, colorSpace: 'oklab'})
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/oklabToRgb/)

        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'gn', def: GN, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklab'}))
    })
})

describe('GaborNoise (c) animatedTime driver', () => {
    it('registers + advances `_animTime` at the node speed', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('gn', GN.fragment, 'root', meta(), {speed: u(1)} as never, GN)
        expect(r.__testing.buildFieldInits('gn')!.some((f) => f.name === '_animTime')).toBe(true)
        for (let i = 0; i < 30; i++) r.__testing.stepAnimatedTime(1 / 60)
        expect(r.__testing.getAnimatedTimeValue('gn')!).toBeCloseTo(0.5, 5)
    })
})
