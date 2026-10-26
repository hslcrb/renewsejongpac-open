import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Star from '@coreroot/shaders/Star/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Star gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → starSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const S = Star as GpuShaderDefinition

describe('Star (a) default generator', () => {
    it('emits starSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(S)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/starSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Star (b) compile-time colorSpace', () => {
    it('oklab back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(S, {colorSpace: 'oklab'})).toMatch(/oklabToRgb/)
        expect(resolveShapeWgsl(S, {colorSpace: 'linear'})).not.toMatch(/oklabToRgb/)
        expect(structuralHashInputs(S, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(S, {colorSpace: 'oklab'}))
    })
})

