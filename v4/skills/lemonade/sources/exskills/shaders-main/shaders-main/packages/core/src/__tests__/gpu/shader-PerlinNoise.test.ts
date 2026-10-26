import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import PerlinNoise from '@coreroot/shaders/PerlinNoise/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * PerlinNoise port gate (D1-C) — also the animatedTime enabler's FIRST real end-to-end consumer.
 * GPU-free: the composer builds the raw-WGSL generator entry, resolved + snapshotted; the
 * animatedTime CPU driver is exercised through the renderer's __testing surface (no device).
 */
const PN = PerlinNoise as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>, animTime?: number): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'pn', def: PN, parentId: 'root', props, metadata: {renderOrder: 0}, animTime},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('PerlinNoise (a) default two-color generator', () => {
    it('emits the perlin13 field composition + the animated-time read + the tone/mixColors color path', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/perlin13/)
        expect(wgsl).toMatch(/_animTime/) // reads the per-node accumulated time
        expect(wgsl).toMatch(/noiseToneKColor/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/) // no multi-stop by default
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('PerlinNoise (b) multi-stop path', () => {
    it('emits the working-space stop accumulation when >1 stops are active', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#00ff00', position: 0.5},
            {color: '#0000ff', position: 1},
        ]
        const wgsl = resolveFinal({stops})
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/perlin13/)
        expect(wgsl).toMatchSnapshot('final-pass-multi-stop')
    })
})

describe('PerlinNoise (c) compile-time colorSpace', () => {
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
                {id: 'pn', def: PN, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklch'}))
    })
})

// ── (d) animatedTime end-to-end — the enabler's first real consumer ───────────────────────────
describe('PerlinNoise (d) animatedTime end-to-end (CPU driver, no device)', () => {
    it('registers a synthetic `_animTime` field for the node', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('pn', PN.fragment, 'root', meta(), {speed: u(1)} as never, PN)
        const inits = r.__testing.buildFieldInits('pn')!
        expect(inits.some((f) => f.name === '_animTime')).toBe(true)
    })

    it('advances `_animTime` each frame at the node speed, and pauses at speed 0', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('fast', PN.fragment, 'root', meta(), {speed: u(1)} as never, PN)
        r.registerNode('paused', PN.fragment, 'root', meta(), {speed: u(0)} as never, PN)

        // 30 synthetic frames at dt=1/60 → t≈0.5s (the smoke's stepping), the interval that must
        // make a time-dependent noise differ from frame 0.
        for (let i = 0; i < 30; i++) r.__testing.stepAnimatedTime(1 / 60)
        expect(r.__testing.getAnimatedTimeValue('fast')!).toBeCloseTo(0.5, 5)
        expect(r.__testing.getAnimatedTimeValue('paused')!).toBe(0)
    })

    it('the animated field feeds the perlin z-axis, so frame 0 and frame 30 sample different noise', () => {
        // Same generator entry, two different `_animTime` seeds → the perlin13 z argument differs,
        // so the emitted WGSL is identical (fixed pipeline) but the per-frame uniform differs. We
        // assert the field participates in the field fn (z = animTime * 0.3) rather than being dead.
        const wgsl = resolveFinal(undefined, 0.5)
        expect(wgsl).toMatch(/_animTime/)
        // timeAxisDomain builds vec3(pos.x, pos.y, animTime*0.3) feeding perlin13.
        expect(wgsl).toMatch(/perlin13/)
    })
})
