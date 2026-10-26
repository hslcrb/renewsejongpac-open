import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import MeshGradient from '@coreroot/shaders/MeshGradient/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * MeshGradient gate — the seed-scattered IDW mesh-gradient generator with palette wrapping.
 * Resolve+snapshot the default composition; assert the anchor/field/wrap/tail body fns, the
 * animatedTime read, the DEFAULT multi-stop palette path (this shader ships a 5-stop default,
 * unlike the null-default gradient fleet), the legacy fallback when stops are cleared, the
 * compile-time colorSpace hash, that `count`/`wrapping`/`swirl` are plain runtime uniforms (no
 * recompile on change), that `variation` recomposes only across 0 (the noise read is compiled out
 * at exactly 0), and that the scatter constellation is CPU-hoisted (no per-pixel spiralScatter;
 * the `meshAnchors` extraField feeds scatterFieldAnchored).
 */
const MG = MeshGradient as GpuShaderDefinition

const resolveFinal = (props?: Record<string, unknown>, animTime?: number): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'mg', def: MG, parentId: 'root', props, metadata: {renderOrder: 0}, animTime},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

const hash = (props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'mg', def: MG, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])
    return collectStructuralHashInputs(registry).join('\n')
}

// compileTimeWhen props are fingerprinted by the RENDERER's extraHashInputs (`ctw:` buckets), not
// the composer's base hash — so their gates (and runtime props' absence of a gate) are asserted
// via computeStructuralHash on a mounted renderer (compileTimeHashCoverage.test.ts pattern).
const meta = (): NodeMetadata => ({blendMode: 'normal', opacity: undefined, renderOrder: 0}) as NodeMetadata

const mount = () => {
    const r = shaderRendererGPU()
    r.__testing.setTestReady({width: 200, height: 200})
    r.registerNode('root', RootContainer.fragment, null, meta(), {} as never, RootContainer)
    const reactive: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(MG.props)) reactive[name] = (cfg as {default: unknown}).default
    r.registerNode('mg', MG.fragment, 'root', meta(), createGpuUniformsMap(MG as never, reactive, 'mg') as never, MG)
    return r
}

describe('MeshGradient (a) default generator', () => {
    it('emits the anchor loop + warp + wrap + tail fns and the animated-time read', () => {
        const wgsl = resolveFinal()
        // The look lives in MeshGradient/index.ts — generic words emit the field machinery.
        expect(wgsl).not.toMatch(/meshField|meshWrapT|meshDither/)
        // Anchors are hoisted: the anchored field reads the `meshAnchors` extraField and the
        // per-pixel spiral derivation is gone from the fragment.
        expect(wgsl).toMatch(/scatterField\([^)]*meshAnchors/)
        expect(wgsl).not.toMatch(/spiralScatter/)
        expect(wgsl).toMatch(/warpDomain/)
        expect(wgsl).toMatch(/rampWrap/)
        expect(wgsl).toMatch(/rgbDither/)
        expect(wgsl).toMatch(/_animTime/)
        // The default palette is a 5-stop ramp → the multi-stop working-space accumulation.
        expect(wgsl).toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('MeshGradient (b) stops fallback', () => {
    it('clearing stops (null) falls back to the legacy two-color path', () => {
        const wgsl = resolveFinal({stops: null})
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/mixColors/)
    })

    it('a single-stop array also behaves as legacy', () => {
        const wgsl = resolveFinal({stops: [{color: '#ff0000', position: 0.5}]})
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatch(/mixColors/)
    })
})

describe('MeshGradient (c) compile-time colorSpace', () => {
    it('linear vs oklab changes the structural hash', () => {
        expect(hash({colorSpace: 'linear'})).not.toBe(hash({colorSpace: 'oklab'}))
    })
})

describe('MeshGradient (d) wrapping is a runtime uniform', () => {
    it('rampWrap is emitted even at wrapping 0 (exact identity, no gate)', () => {
        expect(resolveFinal({wrapping: 0})).toMatch(/rampWrap/)
    })

    it('structural hash is stable across wrapping/swirl/variation edits (no recompile while scrubbing)', () => {
        const r = mount()
        const h0 = r.__testing.computeStructuralHash()
        r.__testing.clearStructuralDirty()
        r.updateUniformValue('mg', 'wrapping', 0)
        r.updateUniformValue('mg', 'wrapping', 0.8)
        r.updateUniformValue('mg', 'swirl', 0.9)
        r.updateUniformValue('mg', 'variation', 0.9)
        expect(r.__testing.computeStructuralHash()).toBe(h0)
        expect(r.__testing.isStructuralDirty()).toBe(false)
    })
})

describe('MeshGradient (f) variation compiles out at 0', () => {
    it('variation 0 drops the variation noise read; nonzero keeps it', () => {
        const off = resolveFinal({variation: 0})
        const on = resolveFinal({variation: 0.5})
        // The noise field resolves under the warp builder's captured name (`warpField`); the
        // variation read is the one call outside the warp body, so nonzero = warp reads + 1.
        const noiseCalls = (w: string) => (w.match(/warpField\(/g) ?? []).length
        expect(noiseCalls(on)).toBeGreaterThan(noiseCalls(off))
    })

    it('renderer hash changes across the 0 boundary and holds within nonzero values', () => {
        const r = mount()
        const h0 = r.__testing.computeStructuralHash()
        r.__testing.clearStructuralDirty()
        r.updateUniformValue('mg', 'variation', 0.9)
        expect(r.__testing.computeStructuralHash()).toBe(h0)
        r.updateUniformValue('mg', 'variation', 0)
        expect(r.__testing.computeStructuralHash()).not.toBe(h0)
    })
})

describe('MeshGradient (e) count is a runtime uniform', () => {
    it('structural hash identical for count 2 vs 8; resolves at count 2', () => {
        expect(hash({count: 2})).toBe(hash({count: 8}))
        expect(resolveFinal({count: 2})).toMatch(/scatterField/)
    })

    it('renderer hash stable across a count scrub (extraHashInputs path, no recompile)', () => {
        const r = mount()
        const h0 = r.__testing.computeStructuralHash()
        r.__testing.clearStructuralDirty()
        r.updateUniformValue('mg', 'count', 2)
        r.updateUniformValue('mg', 'count', 8)
        expect(r.__testing.computeStructuralHash()).toBe(h0)
        expect(r.__testing.isStructuralDirty()).toBe(false)
    })
})
