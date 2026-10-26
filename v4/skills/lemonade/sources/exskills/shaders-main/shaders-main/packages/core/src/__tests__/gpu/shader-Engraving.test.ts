import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, collectStructuralHashInputs, call} from '@coreroot/gpu/composer'
import type {GpuShaderDefinition, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import Engraving from '@coreroot/shaders/Engraving/index'
import {hatchPlate, spiralPlate} from '@coreroot/std/effects/stylize'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Engraving gate — a Stylize RTT filter: the child is redrawn as luminance-displaced line work.
 * The compileTime `style` bakes one plate stack: a single line plate, the 3-plate cross-hatch
 * build-up, or one continuous Archimedean spiral around a configurable centre. GPU-free: compose +
 * resolve + CPU goldens on the exported plate tonal endpoints.
 */
const EG = Engraving as GpuShaderDefinition

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

const treeWith = (props?: Record<string, unknown>) => buildRegistry([
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'eg', def: EG, parentId: 'root', props, metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'eg', metadata: {renderOrder: 0}},
])

describe('Engraving (a) RTT line-work filter (default cross-hatch)', () => {
    it('RTTs the child, unpremultiplies, and redraws through the cross-hatched plates', () => {
        const {registry} = treeWith()
        const ir = composeNodeTree(registry)
        expect(ir.rttPasses.length).toBe(1)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/lineworkComposite_1/)
        expect(finalWgsl).toMatch(/hatchPlate/)
        expect(finalWgsl).not.toMatch(/spiralPlate/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).toMatch(/mxNoiseFloat2/) // the wavy domain warp
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })
})

describe('Engraving (b) compile-time style branching', () => {
    const resolveWith = (props: Record<string, unknown>): string =>
        tgpu.resolve([composeNodeTree(treeWith(props).registry).finalPass.entry], {names: 'strict'})

    it('line bakes the single plate; spiral bakes the spiral cut', () => {
        const line = resolveWith({style: 'line'})
        expect(line).toMatch(/lineworkComposite_0/)
        expect(line).not.toMatch(/spiralPlate/)
        const spiral = resolveWith({style: 'spiral'})
        expect(spiral).toMatch(/lineworkComposite_2/)
        expect(spiral).toMatch(/spiralPlate/)
    })

    it('style is part of the structural (recompile) hash', () => {
        const hashWith = (props: Record<string, unknown>) =>
            collectStructuralHashInputs(treeWith(props).registry).join('\n')
        expect(hashWith({style: 'line'})).not.toBe(hashWith({style: 'spiral'}))
    })
})

describe('Engraving (c) CPU golden — plate tonal endpoints', () => {
    const p = d.vec2f(0.3, 0.4)
    it('line plate: level 0 (black) → solid ink; level 1 (white) → bare paper', () => {
        const black = hatchPlate(p, 0, 10, 0, 0, 0.02) as unknown as number
        const white = hatchPlate(p, 0, 10, 0, 1, 0.02) as unknown as number
        expect(black).toBeCloseTo(1, 5)
        expect(white).toBeCloseTo(0, 5)
    })
    it('mid-level ink follows the wave: crest inked, trough bare', () => {
        // angle 0 → lines along +x, coordinate = p.y. freq 1 → phase = y·2π.
        const crest = hatchPlate(d.vec2f(0, 1.0), 0, 1, 0, 0.5, 0.02) as unknown as number // cos(2π)=1
        const trough = hatchPlate(d.vec2f(0, 0.5), 0, 1, 0, 0.5, 0.02) as unknown as number // cos(π)=−1
        expect(crest).toBeCloseTo(1, 4)
        expect(trough).toBeCloseTo(0, 4)
    })
    it('spiral plate: same tonal endpoints; the coil advances one ring spacing per turn', () => {
        const c = d.vec2f(0.5, 0.5)
        const black = spiralPlate(d.vec2f(0.8, 0.5), c, 10, 0, 0, 0.02) as unknown as number
        const white = spiralPlate(d.vec2f(0.8, 0.5), c, 10, 0, 1, 0.02) as unknown as number
        expect(black).toBeCloseTo(1, 5)
        expect(white).toBeCloseTo(0, 5)
        // On the +x axis (θ = 0) the phase is purely radial: r·freq·2π. r = 0.3, freq 10 → 3 turns
        // → a crest; half a spacing out (r = 0.35) → a trough.
        const crest = spiralPlate(d.vec2f(0.8, 0.5), c, 10, 0, 0.5, 0.02) as unknown as number
        const trough = spiralPlate(d.vec2f(0.85, 0.5), c, 10, 0, 0.5, 0.02) as unknown as number
        expect(crest).toBeCloseTo(1, 4)
        expect(trough).toBeCloseTo(0, 4)
    })
})
