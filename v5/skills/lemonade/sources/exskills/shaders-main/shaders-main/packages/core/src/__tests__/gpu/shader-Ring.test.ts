import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Ring from '@coreroot/shaders/Ring/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Ring gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords (rotation pinned to 0 — Ring is rotationally symmetric, no rotation prop) →
 * ringSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace. The primitive math is
 * CPU-goldened in kit-sdf.test.ts.
 */

const R = Ring as GpuShaderDefinition

describe('Ring (a) default generator', () => {
    it('emits ringSdf → strokeMaskFromSdf → mixColors, no RTT pass', () => {
        const ir = composeShape(R)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/ringSdf/)
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Ring (b) compile-time colorSpace', () => {
    it('hsl back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(R, {colorSpace: 'hsl'})).toMatch(/hslToRgb/)
        expect(resolveShapeWgsl(R, {colorSpace: 'linear'})).not.toMatch(/hslToRgb/)
        expect(structuralHashInputs(R, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(R, {colorSpace: 'hsl'}))
    })
})

