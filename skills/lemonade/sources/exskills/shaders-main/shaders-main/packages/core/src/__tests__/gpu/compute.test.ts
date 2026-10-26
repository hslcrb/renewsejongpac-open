import {describe, it, expect, vi} from 'vitest'
import {d} from '@coreroot/gpu/kit'
import {
    createComputeDispatcher,
    createGuardedCompute,
    createPingPong,
    createStateBuffer,
    type ComputeStep,
    type KitComputePipeline,
} from '@coreroot/gpu/compute'

/**
 * B4 compute dispatcher tests. GPU-free: the dispatcher, ping-pong, and wrapper logic are pure
 * orchestration over mocked pipelines/root — no device is touched. (Kernel WGSL is covered by
 * the resolve-gate in kit-blur.test.ts; live dispatch is covered by the runtime smoke.)
 */

/** A KitComputePipeline stand-in that records when it is dispatched. */
function mockPipeline(label: string, order: string[]): ComputeStep {
    return {
        guarded: {} as never,
        with() {
            return this as unknown as KitComputePipeline
        },
        dispatch() {
            order.push(label)
        },
        dispatchThreads() {
            order.push(label)
        },
    } as unknown as ComputeStep
}

describe('createComputeDispatcher', () => {
    it('dispatches pipelines in array order', () => {
        const order: string[] = []
        const dispatcher = createComputeDispatcher({} as never)
        dispatcher.dispatch([mockPipeline('A', order), mockPipeline('B', order), mockPipeline('C', order)])
        expect(order).toEqual(['A', 'B', 'C'])
    })

    it('executes function (thunk) entries inline at their position, interleaved with pipelines', () => {
        const order: string[] = []
        const dispatcher = createComputeDispatcher({} as never)
        const steps: ComputeStep[] = [
            mockPipeline('P1', order),
            () => order.push('thunk1'),
            mockPipeline('P2', order),
            () => order.push('thunk2'),
            mockPipeline('P3', order),
        ]
        dispatcher.dispatch(steps)
        // Thunk boundaries preserve submission order: writes land between the dispatches.
        expect(order).toEqual(['P1', 'thunk1', 'P2', 'thunk2', 'P3'])
    })

    it('runs an empty step list without error', () => {
        const dispatcher = createComputeDispatcher({} as never)
        expect(() => dispatcher.dispatch([])).not.toThrow()
    })
})

describe('createGuardedCompute', () => {
    function makeMockRoot() {
        const dispatched: number[][] = []
        const withCalls: unknown[] = []
        const guarded = {
            with: vi.fn((bg: unknown) => {
                withCalls.push(bg)
                return guarded
            }),
            dispatchThreads: vi.fn((...args: number[]) => {
                dispatched.push(args)
            }),
        }
        const root = {createGuardedComputePipeline: vi.fn(() => guarded)} as never
        return {root, guarded, dispatched, withCalls}
    }

    it('dispatch() uses the pre-bound size', () => {
        const {root, dispatched} = makeMockRoot()
        const pipe = createGuardedCompute(root, () => {}, {size: [1024, 640]})
        pipe.dispatch()
        expect(dispatched).toEqual([[1024, 640]])
    })

    it('dispatchThreads() forwards explicit thread counts', () => {
        const {root, dispatched} = makeMockRoot()
        const pipe = createGuardedCompute(root, () => {})
        pipe.dispatchThreads(10, 20)
        expect(dispatched).toEqual([[10, 20]])
    })

    it('dispatch() throws when no size was pre-bound', () => {
        const {root} = makeMockRoot()
        const pipe = createGuardedCompute(root, () => {})
        expect(() => pipe.dispatch()).toThrow(/no pre-bound size/)
    })

    it('binds a bind group passed via opts', () => {
        const {root, guarded} = makeMockRoot()
        const bg = {tag: 'bg'} as never
        createGuardedCompute(root, () => {}, {bindGroup: bg})
        expect(guarded.with).toHaveBeenCalledWith(bg)
    })

    it('.with() rebinds and preserves the pre-bound size', () => {
        const {root, guarded, dispatched} = makeMockRoot()
        const pipe = createGuardedCompute(root, () => {}, {size: [8]})
        const bg = {tag: 'bg2'} as never
        const rebound = pipe.with(bg)
        expect(guarded.with).toHaveBeenCalledWith(bg)
        rebound.dispatch()
        expect(dispatched).toEqual([[8]])
    })
})

describe('createPingPong', () => {
    it('pre-builds both orientations and flips read/write on swap', () => {
        const make = vi.fn((read: string, write: string) => `${read}->${write}`)
        const pp = createPingPong('A', 'B', make)
        // Both bind groups built up front (zero-allocation swap thereafter).
        expect(make).toHaveBeenCalledTimes(2)
        expect(pp.current).toBe('A->B')
        pp.swap()
        expect(pp.current).toBe('B->A')
        pp.swap()
        expect(pp.current).toBe('A->B')
        // No further bind-group construction after the initial pair.
        expect(make).toHaveBeenCalledTimes(2)
    })
})

describe('createStateBuffer', () => {
    it('creates a fixed-length array buffer with storage usage', () => {
        const usageArg: string[] = []
        const createBuffer = vi.fn((schema: unknown) => ({
            schema,
            $usage: (...u: string[]) => {
                usageArg.push(...u)
                return {schema, usage: u}
            },
        }))
        const root = {createBuffer} as never
        const buf = createStateBuffer(root, d.vec4f, 128) as unknown as {usage: string[]}
        expect(createBuffer).toHaveBeenCalledTimes(1)
        expect(usageArg).toEqual(['storage'])
        expect(buf.usage).toEqual(['storage'])
    })
})
