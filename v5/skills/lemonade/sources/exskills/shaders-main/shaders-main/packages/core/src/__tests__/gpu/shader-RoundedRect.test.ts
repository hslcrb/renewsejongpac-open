import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import RoundedRect from '@coreroot/shaders/RoundedRect/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * RoundedRect gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → roundedRectSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const R = RoundedRect as GpuShaderDefinition

describe('RoundedRect (a) default generator', () => {
    it('emits roundedRectSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(R)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/roundedRectSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('RoundedRect (b) compile-time colorSpace', () => {
    it('hsv back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(R, {colorSpace: 'hsv'})).toMatch(/hsvToRgb/)
        expect(resolveShapeWgsl(R, {colorSpace: 'linear'})).not.toMatch(/hsvToRgb/)
        expect(structuralHashInputs(R, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(R, {colorSpace: 'hsv'}))
    })
})

