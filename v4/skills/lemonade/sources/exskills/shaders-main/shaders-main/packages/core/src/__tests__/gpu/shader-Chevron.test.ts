import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Chevron from '@coreroot/shaders/Chevron/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/** Chevron port gate (D1-F). animatedTime zigzag; fwidth AA + separate alpha mix → resolve + smoke. */
const CH = Chevron as GpuShaderDefinition

describe('Chevron', () => {
    it('final pass calls chevronMask, reads _animTime (fwidth) + mixColors, no RTT', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'ch', def: CH, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/chevronMask/)
        expect(wgsl).toMatch(/_animTime/)
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
                    {id: 'ch', def: CH, parentId: 'root', props, metadata: {renderOrder: 0}},
                ]).registry,
            ).join('\n')
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklch'}))
    })
})
