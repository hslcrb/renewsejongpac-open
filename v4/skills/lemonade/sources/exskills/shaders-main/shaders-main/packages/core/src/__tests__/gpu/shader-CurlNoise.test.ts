import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import CurlNoise from '@coreroot/shaders/CurlNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * CurlNoise port gate (D1-E) — animated divergence-free flow generator over kit `curl22z`. Same
 * shared color path as PerlinNoise (`toneAndColor` → noiseToneKColor + multi-stop/two-color).
 * GPU-free: the composer builds the raw-WGSL generator entry, resolved + snapshotted; the
 * animatedTime CPU driver is exercised through the renderer's __testing surface (no device).
 */
const CN = CurlNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>, animTime?: number): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'cn', def: CN, parentId: 'root', props, metadata: {renderOrder: 0}, animTime},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('CurlNoise (a) default two-color generator', () => {
    it('emits the curlMagnitude field composition + the animated-time read + the tone/mixColors color path', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/curlMagnitude/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/noiseToneKColor/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('CurlNoise (b) multi-stop path', () => {
    it('emits the working-space stop accumulation when >1 stops are active', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#00ff00', position: 0.5},
            {color: '#0000ff', position: 1},
        ]
        const wgsl = resolveFinal({stops})
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/curlMagnitude/)
        expect(wgsl).toMatchSnapshot('final-pass-multi-stop')
    })
})

describe('CurlNoise (c) compile-time colorSpace', () => {
    it('non-linear colorSpace back-converts + is part of the structural hash', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#0000ff', position: 1},
        ]
        const wgsl = resolveFinal({stops, colorSpace: 'oklch'})
        expect(wgsl).toMatch(/oklchToOklab/)
        expect(wgsl).toMatch(/oklabToRgb/)

        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'cn', def: CN, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklch'}))
    })
})

describe('CurlNoise (d) animatedTime driver', () => {
    it('registers + advances `_animTime`, pausing at speed 0', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('fast', CN.fragment, 'root', meta(), {speed: u(1)} as never, CN)
        r.registerNode('paused', CN.fragment, 'root', meta(), {speed: u(0)} as never, CN)
        expect(r.__testing.buildFieldInits('fast')!.some((f) => f.name === '_animTime')).toBe(true)
        for (let i = 0; i < 30; i++) r.__testing.stepAnimatedTime(1 / 60)
        expect(r.__testing.getAnimatedTimeValue('fast')!).toBeCloseTo(0.5, 5)
        expect(r.__testing.getAnimatedTimeValue('paused')!).toBe(0)
    })
})
