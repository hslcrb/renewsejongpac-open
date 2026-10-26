import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Blob from '@coreroot/shaders/Blob/index'
import {buildRegistry, RootContainer} from './noiseHarness'

/**
 * Blob gate — the look lives in Blob/index.ts as std Expr algebra (no blob* kernels). Assert
 * the animatedTime+seed read, the multi-stop path, compile-time colorSpace, the extraFields read
 * (normL*) and the look's signature constants in the emitted WGSL; the WGSL snapshot carries the
 * full field math. The driveUnitDirection → setExtraField write is verified through a composer
 * writeExtraField spy + the renderer's field registration.
 */
const B = Blob as GpuShaderDefinition
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
const u = (value: unknown) => ({value})

const resolveFinal = (props?: Record<string, unknown>, animTime?: number): string => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'b', def: B, parentId: 'root', props, metadata: {renderOrder: 0}, animTime},
    ])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('Blob (a) default two-color generator', () => {
    it('emits the std-composed look (inline field algebra) + the animated-time read + mixColors + extraField reads', () => {
        const wgsl = resolveFinal()
        // The look lives in Blob/index.ts as std Expr algebra — no blob* kernels remain.
        expect(wgsl).not.toMatch(/blobField|blobEdgeMask|blobSpecular|blobColorMixFactor|blobCompose/)
        // Signature constants of the look, inline: the wobble's first frequency, the Phong
        // exponent, and the reflect() specular.
        expect(wgsl).toMatch(/3\.2/)
        expect(wgsl).toMatch(/32\.0/)
        expect(wgsl).toMatch(/reflect\(/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatch(/mixColors/)
        // The normalized light-direction extraFields are read by the specular math.
        expect(wgsl).toMatch(/normLx/)
        expect(wgsl).toMatch(/normLz/)
        expect(wgsl).not.toMatch(/gradientStopsInSpace/)
        expect(wgsl).toMatchSnapshot('final-pass-default')
    })
})

describe('Blob (b) multi-stop + compile-time colorSpace', () => {
    it('multi-stop accumulation with >1 stops; oklch back-converts; colorSpace in the hash', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#0000ff', position: 1},
        ]
        expect(resolveFinal({stops})).toMatch(/gradientStopsInSpace/)
        expect(resolveFinal({colorSpace: 'oklch'})).toMatch(/oklchToOklab/)
        const hash = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'b', def: B, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hash({colorSpace: 'linear'})).not.toBe(hash({colorSpace: 'oklch'}))
    })
})

describe('Blob (c) extraFields — light direction registration + per-frame write', () => {
    it('registers normLx/normLy/normLz f32 fields (initial 0,0,1)', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 800, height: 600})
        r.registerNode('root', RootContainer.fragment, null, meta(), {}, RootContainer)
        r.registerNode('b', B.fragment, 'root', meta(), {} as never, B)
        const inits = r.__testing.buildFieldInits('b')!
        expect(inits.find((f) => f.name === 'normLx')?.initial).toBe(0)
        expect(inits.find((f) => f.name === 'normLz')?.initial).toBe(1)
        expect((inits.find((f) => f.name === 'normLy')?.schema as {type?: string})?.type).toBe('f32')
    })

    it('onBeforeRender normalizes the highlight direction and writes it via setExtraField', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'b', def: B, parentId: 'root', props: {highlightX: 0.3, highlightY: -0.3, highlightZ: 0.4}, metadata: {renderOrder: 0}},
        ])
        const writeExtraField = vi.fn()
        const ir = composeNodeTree(registry, {writeExtraField})
        for (const cb of ir.onBeforeRender) (cb as () => void)()
        const len = Math.hypot(0.3, -0.3, 0.4)
        expect(writeExtraField).toHaveBeenCalledWith('b', 'normLx', expect.closeTo(0.3 / len, 5))
        expect(writeExtraField).toHaveBeenCalledWith('b', 'normLy', expect.closeTo(-0.3 / len, 5))
        expect(writeExtraField).toHaveBeenCalledWith('b', 'normLz', expect.closeTo(0.4 / len, 5))
    })
})
