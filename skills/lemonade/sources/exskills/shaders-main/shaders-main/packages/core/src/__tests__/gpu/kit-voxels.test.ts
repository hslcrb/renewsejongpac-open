import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import * as sdf3d from '@coreroot/gpu/kit/sdf3d'
import * as voxels from '@coreroot/gpu/kit/voxels'

/**
 * kit/voxels resolve gate. The voxel pre-march is GPU-only at runtime (the shader's compute node
 * returns null without a device), so — like kit/sdf3d's (f) gate — this is where its TGSL is proven
 * to transpile: the DDA march for every `style` × `gridSpace` variant over a params-baked sphere,
 * the compute kernel wrapping it, the unfiltered texel sampler the fragment decodes with, and the
 * flat-analytic extrusion setup's slab SDF (built against a mocked root so its CPU resolver runs).
 */

const mockRoot = () => ({
    createUniform: () => ({buffer: {}, write() { /* no device */ }}),
}) as never

describe('kit/voxels (a) DDA march resolve gate', () => {
    it('all style × gridSpace variants + the kernel + the texel sampler resolve to WGSL (snapshot)', () => {
        const {layout} = sdf3d.makeVolumetricFieldLayout()
        const voxLayout = voxels.makeVoxelLayout()
        const sphereBaked = tgpu.fn([d.vec3f], d.f32)((p) => {
            'use gpu'
            return sdf3d.sdSphere(p, layout.$.params.pA)
        })
        const bakeLayout = voxels.makeVoxelBakeLayout()
        const marches = (['cube', 'sphere', 'rounded'] as const).flatMap((style) =>
            (['shape', 'view'] as const).map((gridSpace) =>
                voxels.buildVoxelFieldFn(layout, voxLayout, {style, gridSpace}).$name(`voxelFieldMarch_${style}_${gridSpace}`),
            ),
        )
        const bakes = (['shape', 'view'] as const).map((gridSpace) =>
            voxels.buildVoxelBakeFn(sphereBaked, layout, bakeLayout, gridSpace).$name(`voxelGridBake_${gridSpace}`),
        )
        const kernel = sdf3d.buildVolumetricFieldKernel(
            layout,
            voxels.buildVoxelFieldFn(layout, voxLayout, {style: 'cube', gridSpace: 'shape'}).$name('voxelFieldMarch_kernel'),
        )
        const shadowMaps = (['cube', 'sphere'] as const).map((style) =>
            voxels.buildVoxelShadowMapFn(voxLayout, style).$name(`voxelShadowMap_${style}`),
        )
        const {fieldSampleTexelArg} = sdf3d.buildFieldSampleGraphArgs()

        const wgsl = tgpu.resolve(
            [
                ...marches, ...bakes, ...shadowMaps, kernel, voxels.voxelShadowLookup, fieldSampleTexelArg,
                voxels.voxelRayBox, voxels.voxelRaySphere, voxels.voxelRayRoundedBox,
            ],
            {names: 'strict'},
        )
        expect(typeof wgsl).toBe('string')
        // The DDA, the sub-shape tests, the grid bake and the sampler all made it into the WGSL.
        expect(wgsl).toMatch(/voxelFieldMarch_cube_shape/)
        expect(wgsl).toMatch(/voxelFieldMarch_sphere_view/)
        expect(wgsl).toMatch(/voxelFieldMarch_rounded_shape/)
        expect(wgsl).toMatch(/voxelGridBake_view/)
        expect(wgsl).toMatch(/extractBits/)
        expect(wgsl).toMatch(/sdRoundBox/)
        expect(wgsl).toMatch(/textureStore/)
        expect(wgsl).toMatch(/fieldSampleTexelArg/)
        // The shape SDF runs ONLY in the bake, and the march carries no light/shadow work at all.
        const marchStart = wgsl.indexOf('fn voxelFieldMarch_cube_shape')
        const marchEnd = wgsl.indexOf('\n}', marchStart)
        const marchBody = wgsl.slice(marchStart, marchEnd)
        expect(marchBody).not.toMatch(/sdSphere/)
        expect(marchBody).not.toMatch(/lightDir|shadow/i)
        // The shadow map + the PCSS lookup resolve (blocker search + bilinear compare).
        expect(wgsl).toMatch(/voxelShadowMap_sphere/)
        expect(wgsl).toMatch(/voxelShadowLookup/)
        expect(wgsl).toMatch(/voxelShadowCompare/)
        // The fragment's analytic re-rasterisation words.
        expect(wgsl).toMatch(/fn voxelRayBox/)
        expect(wgsl).toMatch(/fn voxelRaySphere/)
        expect(wgsl).toMatch(/fn voxelRayRoundedBox/)
        // Packing constants (face id / cell index) are emitted as f32 literals, not i32.
        expect(wgsl).toMatch(/65536/)
        expect(wgsl).toMatchSnapshot()
    })
})

describe('kit/voxels (b) flat-analytic extrusion setup', () => {
    it('lifts a 2D analytic shape into a slab SDF that resolves, and reports a content-tight bounding radius', () => {
        const setup = sdf3d.createAnalytic2dExtrudeSetup(
            mockRoot(),
            'heartSDF',
            () => ({type: 'heartSDF', radius: 0.3}),
            () => 0.05,
            {extraPad: () => 0.02},
        )
        const wgsl = tgpu.resolve([setup.sdfFn as never], {names: 'strict'})
        expect(wgsl).toMatch(/heartSdf/)
        // Bounding radius: hypot(0.3, 0.3, 0.05) + 0.02 + pad 0.02
        const fp = setup.getFootprint()
        expect(fp.rBound).toBeCloseTo(Math.hypot(0.3, 0.3, 0.05) + 0.04, 6)
        expect(fp.spanX).toBeCloseTo((fp.rBound + 0.05) * 2, 6)
        expect(setup.getRotation()).toEqual({cx: 1, sx: 0, cy: 1, sy: 0, cz: 1, sz: 0})
        expect(setup.getStateKey()).toContain('0.05')
    })
})

describe('kit/voxels (c) CPU contracts', () => {
    it('publishes the reconstruction extraFields with the schema the fragment reads', () => {
        const f = voxels.VOXEL_FIELD_EXTRA_FIELDS
        expect(Object.keys(f)).toEqual(['_vxMx', '_vxMy', '_vxMz', '_vxVoxel', '_vxGridOrigin', '_vxL', '_vxT1', '_vxT2'])
        expect(f._vxMx.initial).toEqual([1, 0, 0])
        expect(voxels.VOXEL_GRID_MAX).toBeLessThanOrEqual(255)
        // Occupancy buffer: four u8 cells per word over the full grid cap.
        expect(voxels.OCC_BUFFER_WORDS).toBe(Math.ceil(voxels.VOXEL_GRID_MAX / 4) * voxels.VOXEL_GRID_MAX ** 2)
    })
})
