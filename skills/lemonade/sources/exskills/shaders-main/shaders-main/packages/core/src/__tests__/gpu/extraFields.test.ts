import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import {composeNodeTree} from '@coreroot/gpu/composer'
import {createUniformStore, FieldHandle} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {vec4} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * d1g `extraFields` contract gate — the CPU-derived-uniform path (v1's ad-hoc `uniform()` +
 * onBeforeRender write, which v2 shaders can't do). Blob is the first consumer (normalized
 * light direction). GPU-free: the renderer shell + composer resolve run without a device; the
 * per-frame write is exercised at the store handle (the exact target of setExtraField) and via
 * the composer's onBeforeRender → setExtraField routing.
 */
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

// A synthetic shader that DECLARES extraFields, READS them in its builder (so they appear in the
// emitted WGSL), and WRITES one in an onBeforeRender callback (the real usage pattern).
const ExtraShader: GpuShaderDefinition = {
    name: 'ExtraShader',
    extraFields: {
        specGain: {schema: d.f32, initial: 0},
        lightDir: {schema: d.vec3f, initial: [0, 0, 1]},
    },
    props: {} as never,
    fragment: (params: GpuFragmentParams): Expr => {
        params.onBeforeRender(() => params.setExtraField('specGain', 0.7))
        // Reference both extra fields so they land in the WGSL: vec4(lightDir, specGain).
        return vec4(params.uniforms.lightDir, params.uniforms.specGain)
    },
}

function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {
        return buffer
    })}
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// (1) Registration — extraFields land in the node's struct via buildFieldInits
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('extraFields — field registration (buildFieldInits)', () => {
    it('registers each declared extra field with its schema', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('e', ExtraShader.fragment, 'root', meta(), {}, ExtraShader)

        const inits = r.__testing.buildFieldInits('e')!
        const gain = inits.find((f) => f.name === 'specGain')
        const dir = inits.find((f) => f.name === 'lightDir')
        expect((gain?.schema as {type?: string})?.type).toBe('f32')
        expect((dir?.schema as {type?: string})?.type).toBe('vec3f')
        expect(dir?.initial).toEqual([0, 0, 1])
    })

    it('registers nothing extra for a shader without extraFields', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('n', RootContainer.fragment, 'root', meta(), {}, RootContainer)
        const inits = r.__testing.buildFieldInits('n')!
        expect(inits.some((f) => f.name === 'specGain' || f.name === 'lightDir')).toBe(false)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (2) Builder read — the composer exposes each extra field as a `uniforms.<name>` accessor
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('extraFields — builder read (composer accessor)', () => {
    it('emits the extra-field struct members the builder reads via uniforms.<name>', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'e', def: ExtraShader, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const wgsl = tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/specGain/)
        expect(wgsl).toMatch(/lightDir/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (3) Per-frame write — onBeforeRender → setExtraField routes to the node's live handle
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('extraFields — per-frame write', () => {
    it('setExtraField routes through the composer writeExtraField callback for the right node', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'e', def: ExtraShader, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const writeExtraField = vi.fn()
        const ir = composeNodeTree(registry, {writeExtraField})
        // The shader registered an onBeforeRender that writes specGain=0.7; run it (frame step).
        for (const cb of ir.onBeforeRender) (cb as () => void)()
        expect(writeExtraField).toHaveBeenCalledWith('e', 'specGain', 0.7)
    })

    it('the store handle backing an extra field accepts a scalar or a vec write (the write target)', () => {
        const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
        const handles = store.defineNode('e', [
            {name: 'specGain', schema: d.f32, initial: 0},
            {name: 'lightDir', schema: d.vec3f, initial: [0, 0, 1]},
        ]) as Record<string, FieldHandle>
        store.finalize()

        // Exactly what writeExtraFieldValue does: FieldHandle.value = number | number[].
        handles.specGain.value = 0.7
        expect(handles.specGain.value as number).toBeCloseTo(0.7, 6)
        handles.lightDir.value = [0.1, 0.2, 0.9]
        const v = handles.lightDir.value as {x: number; y: number; z: number}
        expect([v.x, v.y, v.z]).toEqual([0.1, 0.2, 0.9])
    })
})
