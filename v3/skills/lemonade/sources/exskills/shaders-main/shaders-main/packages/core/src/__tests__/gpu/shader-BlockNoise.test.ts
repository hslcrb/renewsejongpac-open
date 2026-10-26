import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import BlockNoise from '@coreroot/shaders/BlockNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/** BlockNoise port gate (D1-C) — animated 3D value-noise generator. GPU-free resolve + snapshot. */
const BN = BlockNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'bn', def: BN, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('BlockNoise (a) default generator', () => {
    it('emits the value13 field composition + the animated-time read + the tone/mixColors path', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/value13/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/noiseToneKColor/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('BlockNoise (b) multi-stop path', () => {
    it('emits the working-space stop accumulation with >1 stops', () => {
        const stops = [
            {color: '#111111', position: 0},
            {color: '#eeeeee', position: 0.4},
            {color: '#ff8800', position: 1},
        ]
        expect(resolveFinal({stops})).toMatch(/gradientStopsInSpace/)
    })
})

describe('BlockNoise (c) animatedTime driver', () => {
    it('advances `_animTime` at node speed over 30 frames', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('bn', BN.fragment, 'root', meta(), {speed: u(2)} as never, BN)
        for (let i = 0; i < 30; i++) r.__testing.stepAnimatedTime(1 / 60)
        expect(r.__testing.getAnimatedTimeValue('bn')!).toBeCloseTo(1.0, 5) // 2 * 0.5
    })
})
