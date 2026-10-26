import {describe, it, expect} from 'vitest'
import {tgpu, d, colorOps} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import HueShift from '@coreroot/shaders/HueShift/index'
import {buildRegistry, RootContainer} from './_patternHarness'

const {hueRotate} = colorOps

/**
 * HueShift port gate (D2-A) — inline color filter (see Invert for the recipe). Two things beyond the
 * plain filters: (1) v1's inline deg→rad transform is folded into the body (bridge drops it), so the
 * `shift` uniform is RAW DEGREES; (2) at shift=0 the rotation is identity → a COMPILE-TIME bypass
 * (read from propValues) returns the child untouched (no matrix emitted). compileTimeWhen recomposes
 * when shift crosses 0.
 */
const HS = HueShift as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

const buildWgsl = (shift: number) => {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'hs', def: HS, parentId: 'root', props: {shift}, metadata: {renderOrder: 0}},
        {id: 'gen', def: Generator, parentId: 'hs', metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    return {ir, wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'})}
}

describe('HueShift (a) shift=0 identity bypass', () => {
    it('passes the child through unchanged — no rotation matrix, no RTT', () => {
        const {ir, wgsl} = buildWgsl(0)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/hueRotate/)
        expect(wgsl).toMatchSnapshot('identity-final-pass')
    })
})

describe('HueShift (b) shift≠0 rotation path', () => {
    it('emits the hue-rotation body over the composed child inline', () => {
        const {ir, wgsl} = buildWgsl(45)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatch(/hueRotate/)
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot('rotation-final-pass')
    })
})

describe('HueShift (c) CPU golden — Rodrigues rotation around (1,1,1)', () => {
    const goldenRotate = (r: number, g: number, b: number, shiftDeg: number): [number, number, number] => {
        const angle = (shiftDeg * Math.PI) / 180
        const cosA = Math.cos(angle)
        const sinA = Math.sin(angle)
        const k = 1 / 3
        const kOneMinusCos = (1 - cosA) * k
        const sinOverSqrt3 = sinA / 1.7320508075688772
        const m00 = cosA + kOneMinusCos, m01 = kOneMinusCos - sinOverSqrt3, m02 = kOneMinusCos + sinOverSqrt3
        const m10 = kOneMinusCos + sinOverSqrt3, m11 = cosA + kOneMinusCos, m12 = kOneMinusCos - sinOverSqrt3
        const m20 = kOneMinusCos - sinOverSqrt3, m21 = kOneMinusCos + sinOverSqrt3, m22 = cosA + kOneMinusCos
        return [r * m00 + g * m01 + b * m02, r * m10 + g * m11 + b * m12, r * m20 + g * m21 + b * m22]
    }
    it('matches the hand-transcribed rotation matrix, preserves alpha', () => {
        const cases: {c: [number, number, number, number]; shift: number}[] = [
            {c: [1, 0, 0, 1], shift: 120},
            {c: [0.3, 0.6, 0.2, 0.5], shift: -45},
            {c: [0.5, 0.5, 0.5, 0.8], shift: 90}, // achromatic → unchanged under rotation about (1,1,1)
        ]
        for (const {c: [r, g, b, a], shift} of cases) {
            const [er, eg, eb] = goldenRotate(r, g, b, shift)
            const out = hueRotate(d.vec4f(r, g, b, a), shift) as unknown as {x: number; y: number; z: number; w: number}
            expect(out.x).toBeCloseTo(er, 5)
            expect(out.y).toBeCloseTo(eg, 5)
            expect(out.z).toBeCloseTo(eb, 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})
