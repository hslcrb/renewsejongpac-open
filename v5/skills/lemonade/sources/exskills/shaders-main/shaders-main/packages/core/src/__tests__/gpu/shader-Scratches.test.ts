import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Scratches from '@coreroot/shaders/Scratches/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Scratches port gate (D1-E) — animated hairline-scratch generator over kit `scratches12`. Uses the
 * A/B-only color block (no stops / colorSpace / tone controls), so the shared `toneAndColor` path
 * clamps the raw scratch value directly (noiseToneKColor with contrast/balance 0). `scratches12`
 * calls `std.fwidth` internally, so it is FRAGMENT-ONLY — the resolve gate confirms it emits, and
 * the smoke validates it on a real fragment. GPU-free resolve/snapshot + the animatedTime driver.
 */
const SC = Scratches as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'sc', def: SC, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('Scratches (a) A/B two-color generator', () => {
    it('emits the scratches12 field composition + animated-time + tone/mixColors (no multi-stop / colorSpace)', () => {
        const wgsl = resolveFinal()
        expect(wgsl).toMatch(/scratches12/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/noiseToneKColor/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })

    it('emits the fragment-only derivative builtin from scratches12', () => {
        // scratches12 uses std.fwidth (fragment-only). The resolve gate proves it emits; the smoke
        // proves it works on a real fragment.
        expect(resolveFinal()).toMatch(/fwidth/)
    })
})

describe('Scratches (b) animatedTime driver', () => {
    it('registers + advances `_animTime` at the node speed', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('sc', SC.fragment, 'root', meta(), {speed: u(1)} as never, SC)
        expect(r.__testing.buildFieldInits('sc')!.some((f) => f.name === '_animTime')).toBe(true)
        for (let i = 0; i < 30; i++) r.__testing.stepAnimatedTime(1 / 60)
        expect(r.__testing.getAnimatedTimeValue('sc')!).toBeCloseTo(0.5, 5)
    })
})
