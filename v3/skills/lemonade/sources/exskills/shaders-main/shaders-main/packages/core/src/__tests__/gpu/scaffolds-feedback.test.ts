import {describe, it, expect, vi} from 'vitest'
import {createPingPongPair} from '@coreroot/gpu/compute'
import {createLateBoundChildInput} from '@coreroot/gpu/scaffolds/lateBoundChild'
import {createFeedbackTrailSim} from '@coreroot/gpu/scaffolds/feedbackSim'
import type {GpuFragmentParams} from '@coreroot/gpu/contract'

/**
 * Phase 9.3/9.4 scaffolds. All three are CPU orchestration — allocation, bind-group bookkeeping,
 * orientation flags and clock arithmetic — so they are tested GPU-free against a mock root. The
 * KERNELS these serve stay per-shader and are covered by the per-shader resolve gates.
 */

/** Mock TgpuRoot: every allocation is an identifiable object so bind-group wiring is assertable. */
function mockRoot() {
    let texId = 0
    const created: Array<{id: number; size: unknown; destroyed: boolean}> = []
    const root = {
        createTexture: vi.fn((opts: {size: unknown}) => {
            const rec = {id: texId++, size: opts.size, destroyed: false}
            created.push(rec)
            const tex = {rec, $usage: () => tex, destroy: () => {rec.destroyed = true}}
            return tex
        }),
        createBindGroup: vi.fn((_layout: unknown, entries: unknown) => ({entries})),
        createUniform: vi.fn(() => ({buffer: {}, write: vi.fn()})),
        device: {},
    }
    return {root, created}
}

/** Minimal GpuFragmentParams for a compute hook: a child node, a root, and the two registries. */
function mockParams(opts: {child?: boolean} = {}) {
    const {root, created} = mockRoot()
    const cleanups: Array<() => void> = []
    const registered: unknown[] = []
    const params = {
        childNode: opts.child === false ? null : {node: 'child'},
        convertToTexture: vi.fn(() => ({key: 'rtt_0'})),
        registerComputeTexture: vi.fn((tex: unknown) => {
            registered.push(tex)
            return {key: `compute_${registered.length - 1}`}
        }),
        onCleanup: (cb: () => void) => cleanups.push(cb),
        getCpuValue: vi.fn((name: string) => (name === 'speed' ? 2 : undefined)),
        gpu: {device: {}, root},
    } as unknown as GpuFragmentParams
    return {params, root, created, cleanups, registered}
}

const resolver = (key: string) => ({texture: {boundKey: key}})

describe('createPingPongPair', () => {
    it('pre-builds both orientations of a group family and flips on swap', () => {
        const pair = createPingPongPair('A', 'B')
        const make = vi.fn((read: string, write: string) => `${read}->${write}`)
        const group = pair.groups(make)
        // Both built up front — swapping thereafter allocates nothing.
        expect(make).toHaveBeenCalledTimes(2)
        expect(group()).toBe('A->B')
        expect(pair.orientation()).toBe(0)
        pair.swap()
        expect(group()).toBe('B->A')
        expect(pair.orientation()).toBe(1)
        expect(make).toHaveBeenCalledTimes(2)
    })

    it('exposes read vs written sides, which is what an output/gradient pass needs', () => {
        const pair = createPingPongPair('A', 'B')
        const perSide = pair.perSide((side: string) => `bg(${side})`)
        // Orientation 0 reads A and writes B, so the pass that consumes this frame's result wants B.
        expect(pair.readSource()).toBe('A')
        expect(pair.writeTarget()).toBe('B')
        expect(perSide.read()).toBe('bg(A)')
        expect(perSide.written()).toBe('bg(B)')
        pair.swap()
        expect(perSide.read()).toBe('bg(B)')
        expect(perSide.written()).toBe('bg(A)')
    })

    it('reset() forces orientation 0 — the re-seed case', () => {
        const pair = createPingPongPair('A', 'B')
        pair.swap()
        expect(pair.orientation()).toBe(1)
        pair.reset()
        expect(pair.orientation()).toBe(0)
        expect(pair.readSource()).toBe('A')
    })

    it('swaps lockstep slots together when a side is a record of resources', () => {
        const pair = createPingPongPair({state: 'sA', live: 'lA'}, {state: 'sB', live: 'lB'})
        const group = pair.groups((read, write) => `${read.state}+${read.live}->${write.state}+${write.live}`)
        expect(group()).toBe('sA+lA->sB+lB')
        pair.swap()
        expect(group()).toBe('sB+lB->sA+lA')
    })
})

describe('createLateBoundChildInput', () => {
    it('returns null when the node has no child', () => {
        const {params} = mockParams({child: false})
        expect(createLateBoundChildInput(params, () => 'groups')).toBeNull()
    })

    it('names the child RTT immediately but builds groups only once bindInputs resolves it', () => {
        const {params} = mockParams()
        const build = vi.fn((tex: never) => ({tex}))
        const child = createLateBoundChildInput(params, build)!
        expect(child.childTexture.key).toBe('rtt_0')
        // Nothing to bind against yet: the pass manager has not allocated the RTT.
        expect(child.bound()).toBeNull()
        expect(child.ready()).toBe(false)
        expect(build).not.toHaveBeenCalled()

        child.bindInputs(resolver)
        expect(child.ready()).toBe(true)
        expect(child.bound()).toEqual({tex: {boundKey: 'rtt_0'}})
    })

    it('stays unbound when the resolver has nothing for the key (and rebuilds on recompose)', () => {
        const {params} = mockParams()
        const build = vi.fn((tex: never) => ({tex}))
        const child = createLateBoundChildInput(params, build)!
        child.bindInputs(() => undefined)
        expect(child.bound()).toBeNull()
        child.bindInputs(resolver)
        child.bindInputs(resolver)
        expect(build).toHaveBeenCalledTimes(2) // once per successful (re)bind
    })
})

describe('createFeedbackTrailSim', () => {
    const simOpts = () => ({
        size: 64 as const,
        format: 'rgba16float' as const,
        speedProp: 'speed',
        bindGroups: vi.fn((ctx: {childTexture: never; display: unknown}, read: {state: unknown}, write: {state: unknown}) =>
            ({src: ctx.childTexture, prev: read.state, next: write.state, display: ctx.display})),
    })

    it('allocates state pair + display copy, registers only the display, and cleans all three up', () => {
        const {params, created, cleanups, registered} = mockParams()
        const sim = createFeedbackTrailSim(params, simOpts())!
        expect(created.length).toBe(3) // stateA, stateB, display
        expect(registered.length).toBe(1)
        expect(sim.display.key).toBe('compute_0')
        for (const cb of cleanups) cb()
        expect(created.every((t) => t.destroyed)).toBe(true)
    })

    it('allocates extra lockstep slots and orientation-independent textures at their own sizes', () => {
        const {params, created} = mockParams()
        createFeedbackTrailSim(params, {
            ...simOpts(),
            extraSlots: {prevLive: [1, 1]},
            textures: {grid: 96},
        })
        // state×2 + display + prevLive×2 + grid
        expect(created.length).toBe(6)
        expect(created.map((t) => t.size)).toEqual([[64, 64], [64, 64], [64, 64], [1, 1], [1, 1], [96, 96]])
    })

    it('tick returns null until the child RTT is bound, then runs the frame callback', () => {
        const {params} = mockParams()
        const sim = createFeedbackTrailSim(params, simOpts())!
        const frame = vi.fn(() => ['step'] as never)
        expect(sim.tick({deltaTime: 0.016}, frame)).toBeNull()
        expect(frame).not.toHaveBeenCalled()
        sim.bindInputs(resolver)
        expect(sim.tick({deltaTime: 0.016}, frame)).toEqual(['step'])
    })

    it('clamps the frame delta, scales it by the speed prop, and accumulates a local clock', () => {
        const {params} = mockParams() // getCpuValue('speed') → 2
        const sim = createFeedbackTrailSim(params, simOpts())!
        sim.bindInputs(resolver)
        const seen: Array<{dt: number; localTime: number; raw: number}> = []
        const run = (deltaTime: number) => sim.tick({deltaTime}, ({dt, localTime, rawDeltaTime}) => {
            seen.push({dt, localTime, raw: rawDeltaTime})
            return ['step'] as never
        })
        run(0.016)
        run(5) // a tab-switch-sized delta: clamped to maxDeltaTime before the speed scale
        expect(seen[0].dt).toBeCloseTo(0.032, 6) // 0.016 × speed 2
        expect(seen[1].dt).toBeCloseTo(0.1, 6) // min(5, 0.05) × 2
        expect(seen[1].raw).toBe(5)
        expect(seen[1].localTime).toBeCloseTo(0.132, 6)
    })

    it('swaps orientation only on a frame that produced steps, so an idle skip does not desync', () => {
        const {params} = mockParams()
        const opts = simOpts()
        const sim = createFeedbackTrailSim(params, opts)!
        sim.bindInputs(resolver)
        const orientations: number[] = []
        const run = (steps: unknown[] | null) => sim.tick({deltaTime: 0.016}, () => {
            orientations.push(sim.pair.orientation())
            return steps as never
        })
        run(['step'])
        run(null) // idle skip
        run(['step'])
        expect(orientations).toEqual([0, 1, 1])
    })

    it('returns null with no GPU device (the fragment-passthrough branch)', () => {
        const {params} = mockParams()
        ;(params as {gpu?: unknown}).gpu = undefined
        expect(createFeedbackTrailSim(params, simOpts())).toBeNull()
    })
})
