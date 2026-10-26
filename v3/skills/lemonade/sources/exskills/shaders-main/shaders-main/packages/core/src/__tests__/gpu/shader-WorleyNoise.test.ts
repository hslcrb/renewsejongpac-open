import {describe, it, expect} from 'vitest'
import {tgpu, d, noisePaints} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import WorleyNoise from '@coreroot/shaders/WorleyNoise/index'

const {worleyTone} = noisePaints
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * WorleyNoise port gate (W7-D) — an animated cellular GENERATOR. A 3×3 neighbour loop over a drifting
 * worley hash → F1/F2 distances (Euclidean/Manhattan/Chebyshev), reduced per `mode`, over up to 4
 * gated fractal octaves (FractalNoise pattern). mode/distance/octaves/colorSpace are compileTime →
 * structural hash. Hash-driven field → GPU-only (resolve+snapshot); the pure tone tail is CPU-goldened.
 */
const WN = WorleyNoise as GpuShaderDefinition

describe('WorleyNoise (a) generator path', () => {
    it('final pass calls worleyCells (+ worleyHash + worleyTone), reads _animTime, mixColors, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'wn', def: WN, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/worleyCells/)
        expect(finalWgsl).toMatch(/cellHash2/) // the shared legacy sin-fract cell hash (was a local `worleyHash`)
        expect(finalWgsl).toMatch(/worleyTone/)
        expect(finalWgsl).toMatch(/_animTime/)
        expect(finalWgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('WorleyNoise (b) compile-time props are part of the structural hash', () => {
    const hashWith = (props: Record<string, unknown>) => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'wn', def: WN, parentId: 'root', props, metadata: {renderOrder: 0}},
        ])
        return collectStructuralHashInputs(registry).join('\n')
    }
    it('colorSpace, mode, distance, and octaves each shift the hash', () => {
        const base = hashWith({})
        expect(base).not.toBe(hashWith({colorSpace: 'oklab'}))
        expect(base).not.toBe(hashWith({mode: 'f2MinusF1'}))
        expect(base).not.toBe(hashWith({distance: 'chebyshev'}))
        expect(base).not.toBe(hashWith({octaves: 4}))
    })
})

describe('WorleyNoise (c) CPU golden — tone tail', () => {
    it('signed → contrast·shift → clamp remap matches the hand transcription', () => {
        const cases = [
            {normalized: 0.5, contrast: 1, balance: 0},
            {normalized: 0.2, contrast: 2.5, balance: -0.3},
            {normalized: 0.9, contrast: 0.25, balance: 0.6},
            {normalized: 1.6, contrast: 4, balance: 1},   // clamps to 1
        ]
        for (const {normalized, contrast, balance} of cases) {
            const signed = normalized * 2 - 1
            const adjusted = signed * contrast + balance
            const expected = Math.min(1, Math.max(0, adjusted * 0.5 + 0.5))
            const out = worleyTone(normalized, contrast, balance) as unknown as number
            expect(out).toBeCloseTo(expected, 5)
        }
    })
})
