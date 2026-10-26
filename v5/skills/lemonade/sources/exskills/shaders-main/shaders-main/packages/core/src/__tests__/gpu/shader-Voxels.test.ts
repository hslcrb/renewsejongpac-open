import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Voxels from '@coreroot/shaders/Voxels/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Voxels gate. A shape effect whose GEOMETRY lives in the voxel pre-march (kit/voxels — a compute
 * DDA writing a G-buffer field; GPU-only) and whose LOOK is std algebra over the decoded
 * `VoxelFrame` (std/paint/voxels). GPU-free → no compute node, so the spine falls back to the flat
 * analytic sampler for the default 3D shape config (`sphere3D` resolves to the circle branch of the
 * analytic fn); the material still composes and resolves — that is the contract this gate holds:
 * G-buffer decode + normal reconstruction + hash13 identity + the lighting recipe, inside the
 * `guarded` shape region, with the `_vx*` reconstruction fields
 * on the node struct.
 */
const V = Voxels as GpuShaderDefinition

function compose(props?: Record<string, unknown>) {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'v', def: V, parentId: 'root', metadata: {renderOrder: 0}, props},
    ])
    const ir = composeNodeTree(registry)
    return {ir, wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'})}
}

describe('Voxels (a) default — cube voxels, model grid, height palette', () => {
    it('composes the voxel material over the flat fallback sampler, no RTT pass', () => {
        const {ir, wgsl} = compose()
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatch(/analyticSdf_sphere3D/)
        expect(wgsl).toMatch(/sdfSpaceUV/)
        expect(wgsl).toMatch(/hash13/)
        expect(wgsl).toMatch(/perspectiveViewRay/)
        expect(wgsl).toMatch(/mixColors\(/)
        expect(wgsl).toMatch(/_vxMx/)
        expect(wgsl).toMatch(/_vxVoxel/)
        expect(wgsl).toMatch(/_vxGridOrigin/)
        expect(wgsl).toMatch(/_vfSpanX/)
        expect(wgsl).toMatch(/outsideShape/)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('declares no clock of its own + the reconstruction extraFields', () => {
        expect(V.animatedTime).toBeUndefined()
        expect(Object.keys(V.extraFields ?? {})).toEqual(expect.arrayContaining(['_vfOriginX', '_vfRBound', '_vxMx', '_vxMy', '_vxMz', '_vxVoxel', '_vxGridOrigin', '_vxL', '_vxT1', '_vxT2']))
        expect(typeof V.compute).toBe('function')
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'v', def: V, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        expect(collectStructuralHashInputs(registry).join('\n')).toContain('Voxels')
    })
})

describe('Voxels (b) compile-time variants', () => {
    it('sphere voxels on the screen grid with the random palette resolve (no matrix rotation of the hit)', () => {
        const {wgsl} = compose({voxelShape: 'sphere', gridSpace: 'view', colorMode: 'random', colorSpace: 'linear', shape: JSON.stringify({type: 'heartSDF', radius: 0.35})})
        expect(wgsl).toMatch(/analyticSdf_heartSDF/)
        expect(wgsl).toMatch(/mixColors\(/)
        expect(wgsl).toMatch(/hash13/)
        expect(wgsl).toMatchSnapshot('sphere-view-random')
    })

    it('rounded voxels with the top/sides palette and a solid fallback both resolve', () => {
        const a = compose({voxelShape: 'rounded', colorMode: 'faces'})
        expect(a.wgsl).toMatch(/mixColors\(/)
        const b = compose({colorMode: 'solid'})
        expect(b.wgsl).not.toMatch(/mixColors/)
        expect(a.wgsl).toMatchSnapshot('rounded-faces')
    })
})
