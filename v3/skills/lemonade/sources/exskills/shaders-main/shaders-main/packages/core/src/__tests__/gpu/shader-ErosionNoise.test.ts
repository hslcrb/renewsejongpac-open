import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ErosionNoise from '@coreroot/shaders/ErosionNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * ErosionNoise port gate (D1-E) — STATIC generator over kit `erosion12` (2D Perlin-with-derivatives
 * + gully lattice; no tractable in-place evolution, so NO animatedTime). Shared `toneAndColor`
 * color path. GPU-free resolve/snapshot; asserts the `_animTime` field is NOT registered.
 */
const EN = ErosionNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'en', def: EN, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('ErosionNoise (a) default two-color generator (static)', () => {
    it('emits the erosion12 field composition + tone/mixColors, and NO animated-time read', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/erosion12/)
        expect(wgsl).toMatch(/noiseToneKColor/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/_animTime/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('ErosionNoise (b) multi-stop + compile-time colorSpace', () => {
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
                {id: 'en', def: EN, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklab'}))
    })
})

describe('ErosionNoise (c) static — no `_animTime` field', () => {
    it('does not register a synthetic animated-time field for the node', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('en', EN.fragment, 'root', meta(), {} as never, EN)
        expect(r.__testing.buildFieldInits('en')!.some((f) => f.name === '_animTime')).toBe(false)
    })
})
