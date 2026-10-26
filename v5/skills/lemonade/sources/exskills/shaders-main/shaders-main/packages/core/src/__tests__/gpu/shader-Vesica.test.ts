import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Vesica from '@coreroot/shaders/Vesica/index'
import {composeShape, resolveShapeWgsl, structuralHashInputs} from './helpers/shapeRegistry'

/**
 * Vesica gate. Resolve+snapshot the generator; assert the distance algebra lowers through
 * shapeLocalCoords → vesicaSdf → strokeMaskFromSdf → mixColors + compile-time colorSpace.
 * The primitive math is CPU-goldened in kit-sdf.test.ts.
 */

const V = Vesica as GpuShaderDefinition

describe('Vesica (a) default generator', () => {
    it('emits vesicaSdf → shapeLocalCoords → mixColors, no RTT pass', () => {
        const ir = composeShape(V)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/strokeMaskFromSdf/)
        expect(wgsl).toMatch(/vesicaSdf/)
        expect(wgsl).toMatch(/shapeLocalCoords/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })
})

describe('Vesica (b) compile-time colorSpace', () => {
    it('oklch back-converts; linear does not; colorSpace in the recompile hash', () => {
        expect(resolveShapeWgsl(V, {colorSpace: 'oklch'})).toMatch(/oklchToOklab/)
        expect(resolveShapeWgsl(V, {colorSpace: 'linear'})).not.toMatch(/oklchToOklab/)
        expect(structuralHashInputs(V, {colorSpace: 'linear'})).not.toBe(structuralHashInputs(V, {colorSpace: 'oklch'}))
    })
})

