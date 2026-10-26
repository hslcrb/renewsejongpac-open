import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'

/**
 * A4 resolve-gate — the load-bearing proof that:
 *   1. typegpu imports work under vitest,
 *   2. TGSL (`'use gpu'`) transpiles under vitest — unplugin-typegpu is applied via
 *      vitest.config.ts's `plugins`, and
 *   3. `tgpu.resolve` emits WGSL with NO GPU / device present.
 *
 */

// A build-time TGSL fragment entry. The unplugin transpiles the JS body to a WGSL AST at
// import time; `tgpu.resolve` turns that into a WGSL string with no device involved.
const redFragment = tgpu
    .fragmentFn({out: d.vec4f})(() => {
        'use gpu'
        return d.vec4f(1, 0, 0, 1)
    })
    .$name('redFragment')

describe('resolve-gate (A4)', () => {
    it('resolves a TGSL fragment fn to WGSL without a GPU', () => {
        const wgsl = tgpu.resolve([redFragment], {names: 'strict'})

        expect(typeof wgsl).toBe('string')
        expect(wgsl.length).toBeGreaterThan(0)
        // Proof of transpilation: the JS `d.vec4f(1, 0, 0, 1)` became a WGSL fn body.
        expect(wgsl.includes('@fragment') || /\bfn\b/.test(wgsl)).toBe(true)
        expect(wgsl).toMatch(/vec4f/)
    })

    it('matches the WGSL snapshot', () => {
        const wgsl = tgpu.resolve([redFragment], {names: 'strict'})
        expect(wgsl).toMatchSnapshot()
    })
})
