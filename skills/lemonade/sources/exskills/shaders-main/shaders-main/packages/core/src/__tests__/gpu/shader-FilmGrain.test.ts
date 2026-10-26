import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import FilmGrain from '@coreroot/shaders/FilmGrain/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * FilmGrain port gate (D2-D) — an INLINE color filter (requiresChild, NOT requiresRTT — the D2-A
 * recipe). Operates on the composed child color Expr directly (no RTT sample, no unpremultiply).
 * The grain drift is a CPU-accumulated `animTime` extraField (0 when not animated), read on the GPU.
 * sin-fract-hash driven → GPU-only (resolve + smoke, no CPU golden).
 */
const FG = FilmGrain as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('FilmGrain (a) inline color-filter path (NO RTT)', () => {
    it('adds dark-weighted grain inline — no RTT, no unpremultiply, alpha preserved', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'fg', def: FG, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'fg', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/filmGrain/)
        expect(wgsl).toMatch(/genBody/)
        // the animTime extraField is read on the GPU
        expect(wgsl).toMatch(/animTime/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})
