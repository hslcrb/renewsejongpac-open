import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import IsometricCubes from '@coreroot/shaders/IsometricCubes/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/** IsometricCubes port gate (D1-F). Rhombille tiling; fwidth AA + per-cube color → resolve + smoke. */
const IC = IsometricCubes as GpuShaderDefinition

describe('IsometricCubes', () => {
    it('final pass calls isoCubeField (fwidth) + mixColors, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'ic', def: IC, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/isoCubeField/)
        expect(wgsl).toMatch(/fwidth/)
        expect(wgsl).toMatch(/mixColors/)
        expect(ir.rttPasses.length).toBe(0)
        expect(wgsl).toMatchSnapshot('final-pass')
    })

    it('colorSpace is part of the structural hash', () => {
        const hashWith = (props: Record<string, unknown>) =>
            collectStructuralHashInputs(
                buildRegistry([
                    {id: 'root', def: RootContainer, parentId: null},
                    {id: 'ic', def: IC, parentId: 'root', props, metadata: {renderOrder: 0}},
                ]).registry,
            ).join('\n')
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklab'}))
    })
})
