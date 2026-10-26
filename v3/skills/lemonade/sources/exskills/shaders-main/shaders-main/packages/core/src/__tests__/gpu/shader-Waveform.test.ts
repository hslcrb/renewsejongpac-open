import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Waveform from '@coreroot/shaders/Waveform/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Waveform gate — an animated generator with a compile-time `style` select (bars / wave /
 * line / dots) and a compile-time `align`. One simulated signal (std `waves` stack over the
 * `_animTime` accumulator) rendered through the std coverage words; the bar and dot styles
 * ride the shape SDF vocabulary (`roundedRectSdf`, `circleSdf`). No RTT in any variant.
 */
const WF = Waveform as GpuShaderDefinition

const build = (props: Record<string, unknown> = {}) =>
    buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'wf', def: WF, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])

const resolve = (props: Record<string, unknown> = {}) => {
    const ir = composeNodeTree(build(props).registry)
    expect(ir.rttPasses.length).toBe(0)
    return tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
}

describe('Waveform generator', () => {
    it('bars: rounded-rect columns over the animated signal', () => {
        const wgsl = resolve()
        expect(wgsl).toMatch(/roundedRectSdf/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).not.toMatch(/circleSdf/)
        expect(wgsl).toMatchSnapshot('bars-center')
    })

    it('dots: disc cells, bottom-anchored', () => {
        const wgsl = resolve({style: 'dots', align: 'bottom'})
        expect(wgsl).toMatch(/circleSdf/)
        expect(wgsl).not.toMatch(/roundedRectSdf/)
        expect(wgsl).toMatchSnapshot('dots-bottom')
    })

    it('line and wave: pure algebra over the signal, no shape SDFs', () => {
        for (const style of ['line', 'wave']) {
            const wgsl = resolve({style})
            expect(wgsl).not.toMatch(/roundedRectSdf|circleSdf/)
            expect(wgsl).toMatch(/_animTime/)
            expect(wgsl).toMatchSnapshot(style)
        }
    })

    it('multi-stop colors switch the palette to the stop-accumulation loop', () => {
        const threeStops = [
            {color: '#ff0000', position: 0},
            {color: '#00ff00', position: 0.5},
            {color: '#0000ff', position: 1},
        ]
        const wgsl = resolve({stops: threeStops})
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(resolve()).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('bars-3-stops')
    })

    it('style, align and colorSpace are structural', () => {
        const hashWith = (props: Record<string, unknown>) => collectStructuralHashInputs(build(props).registry).join('\n')
        expect(hashWith({style: 'bars'})).not.toBe(hashWith({style: 'wave'}))
        expect(hashWith({align: 'mirrored'})).not.toBe(hashWith({align: 'top'}))
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklch'}))
    })
})
