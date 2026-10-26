import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Trapezoid from '@coreroot/shaders/Trapezoid/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Trapezoid gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → trapezoidSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * NOTE the arg mapping: r1=topWidth, r2=bottomWidth (screen-y is downward, so iq's y<0 half-width
 * r1 is the visual TOP). The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const T = Trapezoid as GpuShaderDefinition

describe('Trapezoid (a) default generator', () => {
    it('emits trapezoidSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(T)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/trapezoidSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Trapezoid (b) compile-time colorSpace', () => {
    it('lch back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(T, {colorSpace: 'lch'})).toMatch(/lchToLab/)
        expect(resolveShapeWgsl(T, {colorSpace: 'linear'})).not.toMatch(/lchToLab/)
        expect(structuralHashInputs(T, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(T, {colorSpace: 'lch'}))
    })
})

