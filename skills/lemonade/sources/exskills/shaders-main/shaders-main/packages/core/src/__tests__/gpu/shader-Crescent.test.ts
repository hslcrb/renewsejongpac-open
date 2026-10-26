import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Crescent from '@coreroot/shaders/Crescent/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Crescent gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → crescentSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const C = Crescent as GpuShaderDefinition

describe('Crescent (a) default generator', () => {
    it('emits crescentSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(C)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/crescentSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Crescent (b) compile-time colorSpace', () => {
    it('hsl back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(C, {colorSpace: 'hsl'})).toMatch(/hslToRgb/)
        expect(resolveShapeWgsl(C, {colorSpace: 'linear'})).not.toMatch(/hslToRgb/)
        expect(structuralHashInputs(C, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(C, {colorSpace: 'hsl'}))
    })
})

