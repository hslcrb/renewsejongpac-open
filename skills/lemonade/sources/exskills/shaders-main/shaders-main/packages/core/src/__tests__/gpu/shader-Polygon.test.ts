import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Polygon from '@coreroot/shaders/Polygon/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Polygon gate. Resolve+snapshot the generator; assert the distance algebra — the `rounding` mix
 * of polygonSdf toward circleSdf — lowers through shapeLocalCoords → strokeMaskFromSdf →
 * mixColors + compile-time colorSpace. The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const P = Polygon as GpuShaderDefinition

describe('Polygon (a) default generator', () => {
    it('emits polygonSdf + circleSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(P)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/polygonSdf/)
        expect(wgsl).toMatch(/circleSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Polygon (b) compile-time colorSpace', () => {
    it('hsl back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(P, {colorSpace: 'hsl'})).toMatch(/hslToRgb/)
        expect(resolveShapeWgsl(P, {colorSpace: 'linear'})).not.toMatch(/hslToRgb/)
        expect(structuralHashInputs(P, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(P, {colorSpace: 'hsl'}))
    })
})

