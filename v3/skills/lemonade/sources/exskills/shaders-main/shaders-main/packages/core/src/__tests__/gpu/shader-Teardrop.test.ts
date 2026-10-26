import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Teardrop from '@coreroot/shaders/Teardrop/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Teardrop gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → teardropSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const T = Teardrop as GpuShaderDefinition

describe('Teardrop (a) default generator', () => {
    it('emits teardropSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(T)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/teardropSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Teardrop (b) compile-time colorSpace', () => {
    it('hsv back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(T, {colorSpace: 'hsv'})).toMatch(/hsvToRgb/)
        expect(resolveShapeWgsl(T, {colorSpace: 'linear'})).not.toMatch(/hsvToRgb/)
        expect(structuralHashInputs(T, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(T, {colorSpace: 'hsv'}))
    })
})

