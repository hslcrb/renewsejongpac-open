import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import {composeNodeTree} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import Prism from '@coreroot/shaders/Prism/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Prism gate — the rainbow-beam generator, authored entirely in the std expression
 * algebra (segment frame → soft elbow → fade envelope → gaussian fan → hue wheel).
 * No `'use gpu'` bodies exist in the shader; the emitted fragment IS the composition.
 */
const P = Prism as GpuShaderDefinition

describe('Prism (a) beam generator', () => {
    it('emits the composed beam expression + reads the animated-time clock, no RTT pass', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'p', def: P, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // The frame locals and the hue wheel are visible in the emitted expression.
        expect(finalWgsl).toMatch(/let along_/)
        expect(finalWgsl).toMatch(/let across_/)
        expect(finalWgsl).toMatch(/let hue6_/)
        expect(finalWgsl).toMatch(/_animTime/)
        // The elbow + fan + envelope math is present (smooth relu, gaussian, smoothsteps).
        expect(finalWgsl).toMatch(/sqrt/)
        expect(finalWgsl).toMatch(/exp\(/)
        expect(finalWgsl).toMatch(/smoothstep/)
        expect(P.animatedTime).toEqual({speed: 'speed'})
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})
