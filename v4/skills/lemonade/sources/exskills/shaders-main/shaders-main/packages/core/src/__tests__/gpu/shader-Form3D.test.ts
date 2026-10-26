import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Form3D from '@coreroot/shaders/Form3D/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Form3D port gate (W6-C — the raymarch3d consumer). An RTT filter that raymarches a 3D shape and
 * wraps the child onto its surface. The v1 kit `buildDistortion3dTrace` calls `sdf(p)` with no
 * params, so Form3D builds a param-THREADED trace over the kit sdf3d param-threaded primitives: shape
 * rotation/spin/size ride in as packed vec4 extraFields (_f3p0/1/2) + `animatedTime`, threaded to
 * the shape SDF each march step; it reuses the kit's `applyUVMode3d` + `distortion3dLighting`. `shape3dType` is compile-time (recompiles per shape).
 */
const F = Form3D as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

const resolveWith = (props: Record<string, unknown>) => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'f', def: F, parentId: 'root', props, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'f', metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    return {ir, wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'})}
}

describe('Form3D (a) raymarched 3D shape over an RTT child', () => {
    it('default ribbon: RTTs the child, threads packed params through the trace, lights the surface', () => {
        const {ir, wgsl} = resolveWith({})
        expect(ir.rttPasses.length).toBe(1)
        expect(wgsl).toMatch(/paramTwistedRibbonSdf/) // the active shape's SDF (kit sdf3d primitive, distinctly $named)
        expect(wgsl).toMatch(/form3dTrace_ribbon/) // the param-threaded march (per-shape name — no cross-shape collision)
        expect(wgsl).toMatch(/twistedRibbonSurfaceUV/)
        expect(wgsl).toMatch(/applyUVMode3d/)      // reused kit boundary mode
        expect(wgsl).toMatch(/distortion3dLighting/) // reused kit lighting
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatch(/_f3p0/)              // the packed shape-param extraFields
        expect(wgsl).toMatch(/_animTime/)          // ribbon twist clock
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('torus: the compile-time shape branch emits paramTorusSdf (not the ribbon SDF)', () => {
        const {wgsl} = resolveWith({shape3dType: 'torus'})
        expect(wgsl).toMatch(/paramTorusSdf/)
        expect(wgsl).not.toMatch(/paramTwistedRibbonSdf/)
    })
})

describe('Form3D (b) shape3dType is a compile-time structural-hash input', () => {
    const hashWith = (props: Record<string, unknown>) => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'f', def: F, parentId: 'root', props, metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'f', metadata: {renderOrder: 0}},
        ])
        return collectStructuralHashInputs(registry).join('\n')
    }
    it('switching shape type changes the structural hash (recompile)', () => {
        expect(hashWith({shape3dType: 'ribbon'})).not.toBe(hashWith({shape3dType: 'torus'}))
    })
})
