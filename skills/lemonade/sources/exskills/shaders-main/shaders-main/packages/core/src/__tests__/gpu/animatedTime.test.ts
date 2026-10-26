import {describe, it, expect} from 'vitest'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import {createAnimatedTimeState, getAnimatedTimeState} from '@coreroot/gpu/kit/time'
import {animatedTime} from '@coreroot/gpu/porters'
import {expr} from '@coreroot/gpu/composer'
import type {Expr, EmitContext, GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'

/**
 * `_animTime` wiring gate — the per-node animated-time path (createAnimatedTime equivalent):
 *   1. the CPU accumulator (advance / pause-at-0 / multi-node isolation),
 *   2. the renderer registering the synthetic `_animTime` field iff the definition declares it,
 *   3. the frame driver advancing + pausing it, seeded from the live accumulator on recompose,
 *   4. the `animatedTime()` porter helper emitting the `_animTime` read (+ GPU seed offset).
 * GPU-free: the accumulator is plain CPU state and the renderer shell runs without a device.
 */

// ── Definitions (fragment never invoked here — no composition without a device) ─────────────
const Root: GpuShaderDefinition = {name: 'Root', props: {} as never, fragment: (() => ({})) as never}
const TimeShader: GpuShaderDefinition = {
    name: 'TimeShader',
    animatedTime: {speed: 'speed'},
    props: {speed: {default: 2}} as never,
    fragment: (() => ({})) as never,
}
const NoTimeShader: GpuShaderDefinition = {name: 'NoTime', props: {speed: {default: 2}} as never, fragment: (() => ({})) as never}
// d2c: two independent animated-time clocks (FlowField's flow speed + evolution speed).
const TwoClockShader: GpuShaderDefinition = {
    name: 'TwoClock',
    animatedTime: {speed: 'speed'},
    extraAnimatedTimes: {evolution: 'evolutionSpeed'},
    props: {speed: {default: 2}, evolutionSpeed: {default: 0.5}} as never,
    fragment: (() => ({})) as never,
}

const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata
// GpuUniformsMap entry shape (raw value + flags) the renderer registers from.
const u = (value: unknown) => ({value})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (1) CPU accumulator — advance / pause / isolation (verbatim createAnimatedTime semantics)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('animated time — CPU accumulator', () => {
    it('advances by deltaTime * speed each step', () => {
        const s = createAnimatedTimeState()
        expect(s.value).toBe(0)
        s.advance(0.1, 2)
        expect(s.value).toBeCloseTo(0.2, 6)
        s.advance(0.1, 2)
        expect(s.value).toBeCloseTo(0.4, 6)
    })

    it('pauses (no accumulation, no rewind) at speed 0', () => {
        const s = createAnimatedTimeState()
        s.advance(0.5, 3) // → 1.5
        s.advance(1.0, 0) // paused — unchanged
        expect(s.value).toBeCloseTo(1.5, 6)
        s.advance(0.5, 3) // resumes from 1.5
        expect(s.value).toBeCloseTo(3.0, 6)
    })

    it('negative speed reverses (a speed sign flip smoothly adjusts the rate)', () => {
        const s = createAnimatedTimeState()
        s.advance(1.0, 1) // → 1
        s.advance(0.25, -4) // → 0
        expect(s.value).toBeCloseTo(0, 6)
    })

    it('getAnimatedTimeState reuses one accumulator per key and isolates distinct keys', () => {
        const keyA = {}
        const keyB = {}
        const a = getAnimatedTimeState(keyA)
        a.advance(1, 1)
        // Same key → same accumulator (a node composed twice animates in lockstep).
        expect(getAnimatedTimeState(keyA).value).toBe(1)
        // Different key → independent accumulator, starting at 0.
        expect(getAnimatedTimeState(keyB).value).toBe(0)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (2) Registration — `_animTime` lands in the node's struct iff the definition declares it
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('animated time — field registration (buildFieldInits)', () => {
    it('registers a synthetic `_animTime` f32 field for an animatedTime shader', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        r.registerNode('t', TimeShader.fragment, 'root', meta(), {speed: u(2)} as never, TimeShader)

        const inits = r.__testing.buildFieldInits('t')!
        const field = inits.find((f) => f.name === '_animTime')
        expect(field).toBeDefined()
        expect((field!.schema as {type?: string})?.type).toBe('f32')
    })

    it('does NOT register `_animTime` for a shader that does not declare animatedTime', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        r.registerNode('n', NoTimeShader.fragment, 'root', meta(), {speed: u(2)} as never, NoTimeShader)

        const inits = r.__testing.buildFieldInits('n')!
        expect(inits.some((f) => f.name === '_animTime')).toBe(false)
    })

    it('seeds `_animTime` from the live accumulator so a recompose resumes (no reset flash)', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        r.registerNode('t', TimeShader.fragment, 'root', meta(), {speed: u(2)} as never, TimeShader)

        // Advance the accumulator, then re-derive the field inits (as a recompose would).
        r.__testing.stepAnimatedTime(0.5) // dt=0.5, speed=2 → 1.0
        const inits = r.__testing.buildFieldInits('t')!
        const field = inits.find((f) => f.name === '_animTime')!
        expect(field.initial as number).toBeCloseTo(1.0, 6)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (3) Frame driver — advance + pause via the renderer's driver step
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('animated time — frame driver (updateAnimatedTime)', () => {
    it('accumulates each frame and isolates two nodes with different speeds', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        r.registerNode('fast', TimeShader.fragment, 'root', meta(), {speed: u(2)} as never, TimeShader)
        r.registerNode('slow', TimeShader.fragment, 'root', meta(), {speed: u(0.5)} as never, TimeShader)

        r.__testing.stepAnimatedTime(0.1)
        r.__testing.stepAnimatedTime(0.1)
        expect(r.__testing.getAnimatedTimeValue('fast')!).toBeCloseTo(0.4, 6) // 2 * 0.2
        expect(r.__testing.getAnimatedTimeValue('slow')!).toBeCloseTo(0.1, 6) // 0.5 * 0.2
    })

    it('pauses a node whose speed is 0', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        r.registerNode('paused', TimeShader.fragment, 'root', meta(), {speed: u(0)} as never, TimeShader)

        r.__testing.stepAnimatedTime(1.0)
        r.__testing.stepAnimatedTime(1.0)
        expect(r.__testing.getAnimatedTimeValue('paused')!).toBe(0)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (4) Porter helper — emits the `_animTime` read (+ optional GPU seed offset)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('animated time — animatedTime() porter helper', () => {
    // A minimal EmitContext: the raw `expr(...)` accessors ignore it; `.member` / `.add` only
    // wrap the child's emitted text, so no externals/statements are needed here.
    const CTX = {external: () => '', statement: () => {}, freshLocal: () => '', memo: (_k: string, f: () => string) => f()} as EmitContext
    const emit = (e: Expr): string => (e as unknown as {_emit: (c: EmitContext) => string})._emit(CTX)

    const params = {
        props: expr('uni.$.uniforms.n_x'),
        uniforms: {seed: expr('uni.$.uniforms.n_x.seed')},
    }

    it('reads the node struct\'s `_animTime` field', () => {
        expect(emit(animatedTime(params))).toBe('uni.$.uniforms.n_x._animTime')
    })

    it('adds the seed uniform on the GPU when a seed prop is named (v1 accumulatedTime.add(seed))', () => {
        expect(emit(animatedTime(params, 'seed'))).toBe('(uni.$.uniforms.n_x._animTime + uni.$.uniforms.n_x.seed)')
    })

    it('ignores an unknown seed name (no crash, no offset)', () => {
        expect(emit(animatedTime(params, 'nope'))).toBe('uni.$.uniforms.n_x._animTime')
    })

    it('d2c: reads an EXTRA clock field when fieldName is passed (FlowField evolution)', () => {
        expect(emit(animatedTime(params, undefined, '_animTime_evolution'))).toBe('uni.$.uniforms.n_x._animTime_evolution')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (5) d2c — a second independent animated-time clock (extraAnimatedTimes)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('animated time — extra clocks (extraAnimatedTimes)', () => {
    it('registers a `_animTime_<key>` field per extra clock alongside the primary', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        r.registerNode('tc', TwoClockShader.fragment, 'root', meta(), {speed: u(2), evolutionSpeed: u(0.5)} as never, TwoClockShader)
        const inits = r.__testing.buildFieldInits('tc')!
        const names = inits.map((i) => i.name)
        expect(names).toContain('_animTime')
        expect(names).toContain('_animTime_evolution')
    })

    it('advances each clock independently by its own speed prop', () => {
        const r = shaderRendererGPU()
        r.__testing.setTestReady({width: 100, height: 100})
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        r.registerNode('tc', TwoClockShader.fragment, 'root', meta(), {speed: u(2), evolutionSpeed: u(0.5)} as never, TwoClockShader)
        r.__testing.stepAnimatedTime(0.1)
        r.__testing.stepAnimatedTime(0.1)
        // buildFieldInits seeds each field from its LIVE accumulator, so it reflects the accumulated value.
        const inits = r.__testing.buildFieldInits('tc')!
        const primary = inits.find((i) => i.name === '_animTime')!.initial as number
        const evolution = inits.find((i) => i.name === '_animTime_evolution')!.initial as number
        expect(primary).toBeCloseTo(0.4, 6) // 2 * 0.2
        expect(evolution).toBeCloseTo(0.1, 6) // 0.5 * 0.2
    })
})
