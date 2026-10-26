import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import MultiPointGradient from '@coreroot/shaders/MultiPointGradient/index'
import {gradientPaints} from '@coreroot/gpu/kit'

const {mpgFactors} = gradientPaints
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * MultiPointGradient port gate (D2-D) — a generator. Five inverse-distance-weighted control points
 * folded into a running weighted mean via `mixColorsVariants[mode]` (compile-time colorSpace; the
 * D1-G non-preconvert ladder — v1 used plain `mixColors`, NOT preconverted colors). `mpgFactors`
 * (the four incremental mix factors) is pure sqrt/pow → CPU-goldened.
 */
const MPG = MultiPointGradient as GpuShaderDefinition

const build = (props: Record<string, unknown> = {}) =>
    buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'mpg', def: MPG, parentId: 'root', props, metadata: {renderOrder: 0}},
    ])

describe('MultiPointGradient (a) generator path', () => {
    it('folds 5 weighted colors via mixColors — no RTT', () => {
        const ir = composeNodeTree(build().registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/mpgFactors/)
        expect(wgsl).toMatch(/mixColors/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (colorSpace: string) => collectStructuralHashInputs(build({colorSpace}).registry).join('\n')
        expect(hashWith('linear')).not.toBe(hashWith('oklch'))
    })
})

describe('MultiPointGradient (b) CPU golden — incremental mix factors', () => {
    it('t_i = w_i / (accW + w_i) over inverse-distance weights (authored y via 1 - pos.y)', () => {
        const weight = (ux: number, uy: number, px: number, py: number, eff: number) => {
            const dx = ux - px, dy = uy - py
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.001
            return 1 / Math.pow(dist, eff)
        }
        const uv: [number, number] = [0.5, 0.5]
        const vp: [number, number] = [100, 100]
        const smoothness = 2
        // stored positions = (x, 1 - authoredY)
        const stored: [number, number][] = [[0.2, 0.8], [0.8, 0.8], [0.2, 0.2], [0.8, 0.2], [0.5, 0.5]]
        const aspect = vp[0] / vp[1]
        const ua: [number, number] = [uv[0] * aspect, uv[1]]
        const pts = stored.map(([x, y]): [number, number] => [x * aspect, 1 - y])
        const eff = Math.min(8 / (smoothness + 0.5), 8)
        const w = pts.map(([px, py]) => weight(ua[0], ua[1], px, py, eff))
        let accW = w[0]
        const ts: number[] = []
        for (let i = 1; i < 5; i++) { ts.push(w[i] / (accW + w[i])); accW += w[i] }

        const out = mpgFactors(
            d.vec2f(uv[0], uv[1]), d.vec2f(vp[0], vp[1]),
            d.vec2f(stored[0][0], stored[0][1]), d.vec2f(stored[1][0], stored[1][1]),
            d.vec2f(stored[2][0], stored[2][1]), d.vec2f(stored[3][0], stored[3][1]),
            d.vec2f(stored[4][0], stored[4][1]), smoothness,
        ) as unknown as {x: number; y: number; z: number; w: number}
        expect(out.x).toBeCloseTo(ts[0], 4)
        expect(out.y).toBeCloseTo(ts[1], 4)
        expect(out.z).toBeCloseTo(ts[2], 4)
        expect(out.w).toBeCloseTo(ts[3], 4)
    })
})
