import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import BlueNoise from '@coreroot/shaders/BlueNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/** BlueNoise port gate (D1-C) — a STATIC per-pixel generator (no animatedTime). */
const BN = BlueNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'bn', def: BN, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('BlueNoise (a) default generator', () => {
    it('emits the blue12 pixel-grid composition + tone/mixColors, and NO animated-time read (static)', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/blue12/)
        expect(wgsl).toMatch(/noiseToneKColor/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/_animTime/) // BlueNoise declares no animatedTime
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('BlueNoise (b) multi-stop path', () => {
    it('emits the working-space stop accumulation with >1 stops', () => {
        const stops = [
            {color: '#000000', position: 0},
            {color: '#ffffff', position: 1},
            {color: '#ff0000', position: 0.5},
        ]
        expect(resolveFinal({stops})).toMatch(/gradientStopsInSpace/)
    })
})

describe('BlueNoise (c) declares no animated time', () => {
    it('registers NO synthetic `_animTime` field', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('bn', BN.fragment, 'root', meta(), {grain: u(1)} as never, BN)
        const inits = r.__testing.buildFieldInits('bn')!
        expect(inits.some((f) => f.name === '_animTime')).toBe(false)
        expect(r.__testing.getAnimatedTimeValue('bn')).toBeNull()
    })
})
