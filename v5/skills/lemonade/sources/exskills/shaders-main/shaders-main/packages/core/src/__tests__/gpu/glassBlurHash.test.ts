import {describe, it, expect} from 'vitest'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import Glass from '@coreroot/shaders/Glass/index'
import type {GpuShaderDefinition, GpuUniformsMap} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'

/**
 * FIX-N Glass frosted-blur hash-coupling gate (gpu/index.ts extraHashInputs).
 *
 * Glass's `compute` hook only creates the separable-Gaussian blur pass when `blur > 0` (a
 * JS-branch gated on getCpuValue('blur')), so the blur pass's PRESENCE is a compile-time branch.
 * The `blur` prop uses `compileTimeWhen: (p,n) => (p>0) !== (n>0)` to schedule a recompose when it
 * crosses 0 — but the structural hash did NOT reflect that boolean, so `pipelineCache.getOrBuild`
 * handed back the stale (no-blur) composition and the slider did nothing live. It only "worked"
 * after an UNRELATED compile-time change (e.g. switching the shape) forced a real rebuild.
 *
 * GPU-free: the renderer is forced ready without a device; computeStructuralHash reads the live
 * node uniforms, so `_lastCompiledValue` (updated iff the predicate fires) is the exact
 * compile-relevant projection the hash must fold in.
 */

const Root: GpuShaderDefinition = {name: 'Root', props: {} as never, fragment: (() => ({})) as never}
const G = Glass as GpuShaderDefinition
const meta = (): NodeMetadata => ({blendMode: 'normal', opacity: undefined, renderOrder: 0}) as NodeMetadata

function uniformsFor(overrides: Record<string, unknown>): GpuUniformsMap {
    const reactive: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(G.props)) reactive[name] = (cfg as {default: unknown}).default
    Object.assign(reactive, overrides)
    return createGpuUniformsMap(G as never, reactive, 'glass') as unknown as GpuUniformsMap
}

function mount(overrides: Record<string, unknown> = {}) {
    const r = shaderRendererGPU()
    r.__testing.setTestReady({width: 200, height: 200})
    r.registerNode('root', Root.fragment, null, meta(), {} as never, Root)
    r.registerNode('glass', G.fragment, 'root', meta(), uniformsFor(overrides) as never, G)
    return r
}

describe('Glass blur — frosted-blur pass presence is in the structural hash (FIX-N)', () => {
    it('toggling blur 0 → 20 changes the hash so the composition actually rebuilds', () => {
        const r = mount({blur: 0})
        const h0 = r.__testing.computeStructuralHash()
        r.updateUniformValue('glass', 'blur', 20)
        // The compileTimeWhen predicate fired (crossed 0) → a recompose was scheduled …
        expect(r.__testing.isStructuralDirty()).toBe(true)
        // … and — the actual bug — the hash MUST differ, or getOrBuild serves the stale no-blur build.
        expect(r.__testing.computeStructuralHash()).not.toBe(h0)
    })

    it('a same-side blur edit (20 → 10) keeps the hash STABLE (in-place patch, no rebuild)', () => {
        const r = mount({blur: 20})
        const h = r.__testing.computeStructuralHash()
        r.__testing.clearStructuralDirty()
        r.updateUniformValue('glass', 'blur', 10) // still > 0 → same "frosted" bucket
        expect(r.__testing.isStructuralDirty()).toBe(false)
        expect(r.__testing.computeStructuralHash()).toBe(h)
    })

    it('turning blur fully back off (0 → 20 → 0) returns to the exact clear-glass hash', () => {
        const r = mount({blur: 0})
        const clear = r.__testing.computeStructuralHash()
        r.updateUniformValue('glass', 'blur', 20)
        expect(r.__testing.computeStructuralHash()).not.toBe(clear)
        r.updateUniformValue('glass', 'blur', 0)
        expect(r.__testing.computeStructuralHash()).toBe(clear)
    })

    it('aberration crossing 0 also changes the hash (Glass second compileTimeWhen branch)', () => {
        const r = mount({aberration: 0})
        const h0 = r.__testing.computeStructuralHash()
        r.updateUniformValue('glass', 'aberration', 0.5)
        expect(r.__testing.computeStructuralHash()).not.toBe(h0)
    })
})
