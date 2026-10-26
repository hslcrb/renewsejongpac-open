import {describe, it, expect} from 'vitest'
import {tgpu, d, colorMixing} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Beam from '@coreroot/shaders/Beam/index'
import {gradientPaints} from '@coreroot/gpu/kit'

const {beamField} = gradientPaints
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Beam port gate (D2-D) — a generator + the PRECONVERTED-COLORS RECIPE. `beamField` (segment
 * projection → glow alpha + color factor) is pure math → CPU-goldened. The color mix is a
 * compile-time colorSpace branch: linear stays on the plain per-pixel `mixColorsVariants[0]`; a
 * non-linear space converts the two endpoints CPU-side (dirty-keyed) into the convA/convB vec3
 * extraFields and mixes in-space on the GPU via `mixPreconvertedVariants[mode]`.
 */
const BEAM = Beam as GpuShaderDefinition

const build = (props: Record<string, unknown> = {}) =>
    buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'beam', def: BEAM, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])

describe('Beam (a) linear color path (no preconversion)', () => {
    it('mixes endpoints per-pixel via mixColors — no preconverted reads', () => {
        const ir = composeNodeTree(build({colorSpace: 'linear'}).registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/beamField/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/mixPreconverted/)
        expect(wgsl).toMatchSnapshot('final-pass-linear')
    })
})

describe('Beam (b) preconverted color path (non-linear space)', () => {
    it('reads the convA/convB extraFields and mixes in-space via mixPreconverted', () => {
        const wgsl = tgpu.resolve([composeNodeTree(build({colorSpace: 'oklch'}).registry).finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/beamField/)
        expect(wgsl).toMatch(/mixPreconverted/)
        expect(wgsl).toMatch(/convA/)
        expect(wgsl).toMatch(/convB/)
        expect(wgsl).toMatchSnapshot('final-pass-oklch')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (colorSpace: string) => collectStructuralHashInputs(build({colorSpace}).registry).join('\n')
        expect(hashWith('linear')).not.toBe(hashWith('oklch'))
    })
})

describe('Beam (c) CPU golden — beamField (colorT, alpha)', () => {
    const smoothstep = (e0: number, e1: number, x: number) => {
        const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
        return t * t * (3 - 2 * t)
    }
    it('segment projection → glow alpha + color factor', () => {
        // stored positions (x, 1 - authoredY); aspect 1; a point off the beam axis.
        const uv: [number, number] = [0.5, 0.56]
        const vp: [number, number] = [100, 100]
        const start: [number, number] = [0.2, 0.5]
        const end: [number, number] = [0.8, 0.5]
        const sT = 0.2, eT = 0.2, sS = 0.5, eS = 0.5
        const aspect = vp[0] / vp[1]
        const acStart = [start[0] * aspect, 1 - start[1]]
        const acEnd = [end[0] * aspect, 1 - end[1]]
        const acUV = [uv[0] * aspect, uv[1]]
        const lineVec = [acEnd[0] - acStart[0], acEnd[1] - acStart[1]]
        const toPoint = [acUV[0] - acStart[0], acUV[1] - acStart[1]]
        const dot = toPoint[0] * lineVec[0] + toPoint[1] * lineVec[1]
        const lenSq = lineVec[0] * lineVec[0] + lineVec[1] * lineVec[1]
        const t = Math.min(Math.max(dot / Math.max(lenSq, 0.0001), 0), 1)
        const closest = [acStart[0] + lineVec[0] * t, acStart[1] + lineVec[1] * t]
        const dv = [acUV[0] - closest[0], acUV[1] - closest[1]]
        const dist = Math.sqrt(dv[0] * dv[0] + dv[1] * dv[1])
        const thickness = sT * 0.25 + (eT * 0.25 - sT * 0.25) * t
        const softness = sS + (eS - sS) * t
        const normDist = dist / Math.max(thickness, 0.0001)
        const alphaBase = 1 - smoothstep(1, 1 + softness, normDist)
        const alpha = Math.pow(alphaBase, 1 + softness * 1.5)
        const colorT = smoothstep(1 - softness, 1 + softness, normDist)

        const out = beamField(
            d.vec2f(uv[0], uv[1]), d.vec2f(vp[0], vp[1]),
            d.vec2f(start[0], start[1]), d.vec2f(end[0], end[1]), sT, eT, sS, eS,
        ) as unknown as {x: number; y: number}
        expect(out.x).toBeCloseTo(colorT, 5)
        expect(out.y).toBeCloseTo(alpha, 5)
    })
})

describe('Beam (d) preconverted-colors recipe identity', () => {
    it('preconvert(A),preconvert(B) mixed in-space == direct mixColors, for every non-linear space', () => {
        // The whole point of the recipe: converting the endpoints once and mixing in-space is
        // mathematically identical to converting per pixel. Both run as CPU DualFns here.
        const A = d.vec4f(0.8, 0.1, 0.2, 1.0)
        const B = d.vec4f(0.1, 0.3, 0.9, 0.6)
        const t = 0.35
        for (const mode of [1, 2, 3, 4, 5]) {
            const ca = colorMixing.convertP3ToMixSpaceCPU(A.x, A.y, A.z, mode)
            const cb = colorMixing.convertP3ToMixSpaceCPU(B.x, B.y, B.z, mode)
            const preVariant = colorMixing.mixPreconvertedVariants[mode as keyof typeof colorMixing.mixPreconvertedVariants]
            const directVariant = colorMixing.mixColorsVariants[mode as keyof typeof colorMixing.mixColorsVariants]
            const pre = preVariant(d.vec3f(ca[0], ca[1], ca[2]), d.vec3f(cb[0], cb[1], cb[2]), A.w, B.w, t) as unknown as {x: number; y: number; z: number}
            const direct = directVariant(A, B, t) as unknown as {x: number; y: number; z: number}
            expect(pre.x).toBeCloseTo(direct.x, 4)
            expect(pre.y).toBeCloseTo(direct.y, 4)
            expect(pre.z).toBeCloseTo(direct.z, 4)
        }
    })
})
