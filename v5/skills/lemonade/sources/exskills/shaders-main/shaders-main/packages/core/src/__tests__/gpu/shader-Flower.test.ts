import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Flower from '@coreroot/shaders/Flower/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Flower gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → flowerSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const F = Flower as GpuShaderDefinition

describe('Flower (a) default generator', () => {
    it('emits flowerSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(F)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/flowerSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Flower (b) compile-time colorSpace', () => {
    it('hsv back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(F, {colorSpace: 'hsv'})).toMatch(/hsvToRgb/)
        expect(resolveShapeWgsl(F, {colorSpace: 'linear'})).not.toMatch(/hsvToRgb/)
        expect(structuralHashInputs(F, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(F, {colorSpace: 'hsv'}))
    })
})

