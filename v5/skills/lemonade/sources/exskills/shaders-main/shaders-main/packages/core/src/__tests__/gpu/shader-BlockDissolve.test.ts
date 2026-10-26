import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import BlockDissolve from '@coreroot/shaders/BlockDissolve/index'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * BlockDissolve gate — pointwise alpha-mask dissolve (NO RTT). Per-block hash threshold (stable,
 * time-independent); blocks fade in random order as progress crosses their threshold.
 */
const BD = BlockDissolve as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

describe('BlockDissolve (a) pointwise alpha-mask path (NO RTT)', () => {
    it('operates on the composed child inline — no RTT; hashes the block index, not time', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'w', def: BD, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'gen', def: Generator, parentId: 'w', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(0)
        const wgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(wgsl).toMatch(/cellShuffleCoord/)
        expect(wgsl).toMatch(/revealMask/)
        // Stable randomization: the block threshold comes from hash12 of the cell index, with no
        // per-node animated-time field wired in — so the ordering is frozen frame-to-frame.
        expect(wgsl).toMatch(/hash12/)
        expect(wgsl).not.toMatch(/_animTime/)
        expect(wgsl).not.toMatch(/textureSample\(rtt_/)
    })
})
