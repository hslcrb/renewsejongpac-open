import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Arc from '@coreroot/shaders/Arc/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Arc gate. Resolve+snapshot the generator; assert the distance algebra (incl. the aperture° →
 * half-aperture-radians conversion) lowers through shapeLocalCoords → arcSdf → strokeMaskFromSdf
 * → mixColors + compile-time colorSpace. The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const A = Arc as GpuShaderDefinition

describe('Arc (a) default generator', () => {
    it('emits arcSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(A)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/arcSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Arc (b) compile-time colorSpace', () => {
    it('oklab back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(A, {colorSpace: 'oklab'})).toMatch(/oklabToRgb/)
        expect(resolveShapeWgsl(A, {colorSpace: 'linear'})).not.toMatch(/oklabToRgb/)
        expect(structuralHashInputs(A, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(A, {colorSpace: 'oklab'}))
    })
})

