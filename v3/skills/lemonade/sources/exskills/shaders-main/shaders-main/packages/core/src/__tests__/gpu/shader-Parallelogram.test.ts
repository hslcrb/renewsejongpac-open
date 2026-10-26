import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Parallelogram from '@coreroot/shaders/Parallelogram/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Parallelogram gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → parallelogramSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const P = Parallelogram as GpuShaderDefinition

describe('Parallelogram (a) default generator', () => {
    it('emits parallelogramSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(P)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/parallelogramSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Parallelogram (b) compile-time colorSpace', () => {
    it('oklab back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(P, {colorSpace: 'oklab'})).toMatch(/oklabToRgb/)
        expect(resolveShapeWgsl(P, {colorSpace: 'linear'})).not.toMatch(/oklabToRgb/)
        expect(structuralHashInputs(P, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(P, {colorSpace: 'oklab'}))
    })
})

