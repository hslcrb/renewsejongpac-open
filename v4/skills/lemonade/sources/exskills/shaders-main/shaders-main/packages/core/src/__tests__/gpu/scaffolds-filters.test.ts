import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {composeNodeTree, call, ZERO} from '@coreroot/gpu/composer'
import type {Expr, GpuFragmentParams, GpuShaderDefinition} from '@coreroot/gpu/contract'
import {definePointwiseFilter, isFilterIdentity} from '@coreroot/gpu/scaffolds/pointwiseFilter'
import {defineRttFilter} from '@coreroot/gpu/scaffolds/rttFilter'
import {buildRegistry, RootContainer} from './_patternHarness'

/**
 * Gate for the two filter scaffolds
 *
 * The per-shader gates (shader-Invert, shader-Saturation, …) already prove each MIGRATION is
 * byte-identical; this file gates the scaffolds themselves, including the branches no single shader
 * exercises: the silent-vs-logging child guard, the pointwise-returns-child-raw bypass versus the
 * RTT sample-centre-and-unpremultiply bypass, and the map-driver refusal.
 */
const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}

const scaleBody = tgpu.fn([d.vec4f, d.f32], d.vec4f)((color, gain) => {
    'use gpu'
    return d.vec4f(color.xyz.mul(gain), color.w)
})

const PROPS = {
    gain: {default: 2, ui: {type: ['range', 'map'], min: 0, max: 4, step: 0.1, label: 'Gain', group: 'Effect'}},
} as never

function resolve(def: GpuShaderDefinition, props?: Record<string, unknown>) {
    const {registry} = buildRegistry([
        {id: 'root', def: RootContainer, parentId: null},
        {id: 'f', def, parentId: 'root', metadata: {renderOrder: 0}, props},
        {id: 'gen', def: Generator, parentId: 'f', metadata: {renderOrder: 0}},
    ])
    const ir = composeNodeTree(registry)
    return {ir, wgsl: tgpu.resolve([ir.finalPass.entry], {names: 'strict'})}
}

describe('definePointwiseFilter (a) equals the hand-written original', () => {
    const handWritten: GpuShaderDefinition = {
        name: 'ScaleFilter',
        category: 'Adjustments',
        requiresChild: true,
        props: PROPS,
        fragment: ({childNode, uniforms}: GpuFragmentParams): Expr => {
            if (!childNode) return ZERO
            return call(scaleBody, 'scaleBody', [childNode, uniforms.gain])
        },
    }
    const scaffolded = definePointwiseFilter({
        name: 'ScaleFilter',
        category: 'Adjustments',
        props: PROPS,
        body: {fn: scaleBody, hint: 'scaleBody'},
        args: ({uniforms}) => [uniforms.gain],
    })

    it('resolves to byte-identical WGSL', () => {
        expect(resolve(scaffolded).wgsl).toBe(resolve(handWritten).wgsl)
    })
    it('is a non-RTT filter that declares requiresChild', () => {
        const {ir} = resolve(scaffolded)
        expect(scaffolded.requiresChild).toBe(true)
        expect(scaffolded.requiresRTT).toBeUndefined()
        expect(ir.rttPasses.length).toBe(0)
    })
})

describe('definePointwiseFilter (b) missing-child guard', () => {
    const childless = (missingChildMessage?: string) =>
        definePointwiseFilter({
            name: 'ScaleFilter',
            props: PROPS,
            body: {fn: scaleBody, hint: 'scaleBody'},
            missingChildMessage,
        })

    it('logs an actionable error when a message is configured', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const out = childless('pass a child!').fragment({childNode: undefined} as GpuFragmentParams)
        expect(spy).toHaveBeenCalledWith('pass a child!')
        expect(out).toBe(ZERO)
        spy.mockRestore()
    })
    it('stays SILENT when no message is configured (the tone filters)', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const out = childless().fragment({childNode: undefined} as GpuFragmentParams)
        expect(spy).not.toHaveBeenCalled()
        expect(out).toBe(ZERO)
        spy.mockRestore()
    })
})

describe('definePointwiseFilter (c) identity bypass returns the child RAW', () => {
    const def = definePointwiseFilter({
        name: 'ScaleFilter',
        props: PROPS,
        body: {fn: scaleBody, hint: 'scaleBody'},
        args: ({uniforms}) => [uniforms.gain],
        identity: {props: ['gain'], when: (p) => (p.gain as number) === 1},
    })

    it('at the identity value nothing is emitted — the child passes through', () => {
        const {wgsl} = resolve(def, {gain: 1})
        expect(wgsl).toMatch(/genBody/)
        expect(wgsl).not.toMatch(/scaleBody/)
        // A pointwise filter's child is straight-alpha, so no unpremultiply is involved either.
        expect(wgsl).not.toMatch(/unpremultiplyAlpha/)
    })
    it('off the identity value the body emits normally', () => {
        expect(resolve(def, {gain: 2}).wgsl).toMatch(/scaleBody/)
    })
    it('skips `setup` on the identity path and runs it otherwise', () => {
        const setup = vi.fn()
        const withSetup = definePointwiseFilter({
            name: 'ScaleFilter',
            props: PROPS,
            body: {fn: scaleBody, hint: 'scaleBody'},
            args: ({uniforms}) => [uniforms.gain],
            identity: {props: ['gain'], when: (p) => (p.gain as number) === 1},
            setup,
        })
        resolve(withSetup, {gain: 1})
        expect(setup).not.toHaveBeenCalled()
        resolve(withSetup, {gain: 2})
        expect(setup).toHaveBeenCalledTimes(1)
    })
})

describe('definePointwiseFilter (d) compile-time body pair + compose hook', () => {
    const otherBody = tgpu.fn([d.vec4f, d.f32], d.vec4f)((color, gain) => {
        'use gpu'
        return d.vec4f(color.xyz.mul(gain).add(0.1), color.w)
    })
    const def = definePointwiseFilter({
        name: 'ScaleFilter',
        props: {...(PROPS as object), mode: {default: 0, compileTime: true, ui: {type: 'range', min: 0, max: 1, step: 1}}} as never,
        body: (propValues) =>
            Number(propValues.mode) > 0 ? {fn: otherBody, hint: 'otherBody'} : {fn: scaleBody, hint: 'scaleBody'},
        args: ({uniforms}) => [uniforms.gain],
        compose: (result, {childNode}) => result.add(childNode.member('a').mul(0)),
    })

    it('emits only the picked body', () => {
        expect(resolve(def, {mode: 0}).wgsl).toMatch(/scaleBody/)
        expect(resolve(def, {mode: 0}).wgsl).not.toMatch(/otherBody/)
        expect(resolve(def, {mode: 1}).wgsl).toMatch(/otherBody/)
    })
    it('applies the builder-level compose tail to the body result', () => {
        // `compose` wraps the call, so the emitted expression is no longer a bare `scaleBody(...)`.
        expect(resolve(def, {mode: 0}).wgsl).toMatch(/scaleBody\(.*\) \+ \(/)
    })
})

describe('isFilterIdentity map-driver guard', () => {
    const params = (mapped: string[], values: Record<string, unknown>) =>
        ({
            propValues: values,
            getMapInfo: (prop: string) => (mapped.includes(prop) ? ({} as never) : null),
        }) as unknown as GpuFragmentParams

    const identity = {props: ['gain'], when: (p: Record<string, unknown>) => p.gain === 1}

    it('honours the bypass for an undriven prop', () => {
        expect(isFilterIdentity(identity, params([], {gain: 1}))).toBe(true)
    })
    it('REFUSES the bypass when the prop carries a map driver (the map varies per pixel around the base)', () => {
        expect(isFilterIdentity(identity, params(['gain'], {gain: 1}))).toBe(false)
    })
    it('is false when no identity is declared', () => {
        expect(isFilterIdentity(undefined, params([], {gain: 1}))).toBe(false)
    })
})

describe('defineRttFilter', () => {
    const tapBody = tgpu.fn([d.vec4f, d.vec4f, d.f32], d.vec4f)((a, b, gain) => {
        'use gpu'
        return d.vec4f(a.xyz.add(b.xyz).mul(gain), a.w)
    })
    const def = defineRttFilter({
        name: 'TapFilter',
        props: PROPS,
        identity: {props: ['gain'], when: (p) => (p.gain as number) === 1},
        build: ({texture, ctx, uniforms}) =>
            call(tapBody, 'tapBody', [texture.sample(ctx.uv), texture.sample(ctx.uv), uniforms.gain]),
    })

    it('declares requiresRTT + requiresChild and registers one RTT boundary', () => {
        const {ir} = resolve(def, {gain: 2})
        expect(def.requiresRTT).toBe(true)
        expect(def.requiresChild).toBe(true)
        expect(ir.rttPasses.length).toBe(1)
    })
    it('appends the unpremultiply tail to the premultiplied kernel result', () => {
        const {wgsl} = resolve(def, {gain: 2})
        expect(wgsl).toMatch(/unpremultiplyAlpha\(tapBody\(/)
    })
    it('identity samples the centre and unpremultiplies — it must NOT return the child raw', () => {
        const {ir, wgsl} = resolve(def, {gain: 1})
        expect(wgsl).not.toMatch(/tapBody/)
        expect(wgsl).toMatch(/unpremultiplyAlpha\(textureSample/)
        // The RTT boundary still exists: the child was already rendered to a texture.
        expect(ir.rttPasses.length).toBe(1)
    })
    it('resultAlpha: "straight" skips the unpremultiply tail', () => {
        const straight = defineRttFilter({
            name: 'TapFilter',
            props: PROPS,
            resultAlpha: 'straight',
            build: ({sampleStraight, ctx}) => sampleStraight(ctx.uv),
        })
        const {wgsl} = resolve(straight, {gain: 2})
        // Exactly one CALL (the `fn unpremultiplyAlpha(` declaration aside) — the one
        // `sampleStraight` emits, not a second tail on top of it.
        expect(wgsl.match(/(?<!fn )unpremultiplyAlpha\(/g)?.length).toBe(1)
    })
})
