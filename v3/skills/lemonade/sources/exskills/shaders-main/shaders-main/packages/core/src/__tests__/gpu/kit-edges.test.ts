import {describe, it, expect} from 'vitest'
import {applyEdgeToUVExpr, composeEdgeRemapExpr, applyEdgeHandlingExpr} from '@coreroot/gpu/kit/edges'
import {call, expr} from '@coreroot/gpu/composer'
import type {Expr, EmitContext} from '@coreroot/gpu/contract'

/**
 * Expr-level edge builders (the kit-gap the Twirl port flagged: value-level `applyEdgeToUV` /
 * `composeEdgeRemap` / `applyEdgeHandling` operate on vec VALUES, unusable from a composition-time
 * builder). These assert each builder JS-branches on the compile-time mode and emits the matching
 * per-mode `call(...)`. Edge modes: 0=stretch, 1=transparent, 2=mirror, 3=wrap. The composer's
 * resolve+snapshot coverage of the same emission lives in shader-Twirl.test.ts.
 */

// Minimal EmitContext: `external` returns the hint verbatim so the emitted call shows its fn name.
const CTX = {
    external: (_v: unknown, hint: string) => hint,
    statement: () => {},
    freshLocal: () => 'l',
    memo: (_k: string, f: () => string) => f(),
} as EmitContext
const emit = (e: Expr): string => (e as unknown as {_emit: (c: EmitContext) => string})._emit(CTX)

const UV = expr('twisted')
const MASK = expr('m')

describe('applyEdgeToUVExpr', () => {
    it('emits the per-mode fn call (transparent passes the UV through)', () => {
        expect(emit(applyEdgeToUVExpr(UV, 0))).toBe('edgeClampUV(twisted)')
        expect(emit(applyEdgeToUVExpr(UV, 1))).toBe('twisted')
        expect(emit(applyEdgeToUVExpr(UV, 2))).toBe('edgeMirrorUV(twisted)')
        expect(emit(applyEdgeToUVExpr(UV, 3))).toBe('edgeWrapUV(twisted)')
    })
})

describe('composeEdgeRemapExpr', () => {
    it('transparent: UV unchanged, mask multiplied by coverage', () => {
        const r = composeEdgeRemapExpr(UV, MASK, 1)
        expect(emit(r.uv)).toBe('twisted')
        expect(emit(r.mask)).toBe('(m * edgeTransparentMask(twisted))')
    })
    it('stretch/mirror/wrap: UV transformed, mask unchanged', () => {
        expect(emit(composeEdgeRemapExpr(UV, MASK, 0).uv)).toBe('edgeClampUV(twisted)')
        expect(emit(composeEdgeRemapExpr(UV, MASK, 2).uv)).toBe('edgeMirrorUV(twisted)')
        expect(emit(composeEdgeRemapExpr(UV, MASK, 3).uv)).toBe('edgeWrapUV(twisted)')
        expect(emit(composeEdgeRemapExpr(UV, MASK, 2).mask)).toBe('m')
    })
})

describe('applyEdgeHandlingExpr', () => {
    // Model the RTT sample as a named call so the emitted text reflects the looked-up UV.
    const sample = (uv: Expr): Expr => call({}, 'texSample', [uv])

    it('stretch: samples straight (sampler clamps)', () => {
        expect(emit(applyEdgeHandlingExpr(UV, sample, 0))).toBe('texSample(twisted)')
    })
    it('mirror/wrap: re-samples at the reflected / tiled UV', () => {
        expect(emit(applyEdgeHandlingExpr(UV, sample, 2))).toBe('texSample(edgeMirrorUV(twisted))')
        expect(emit(applyEdgeHandlingExpr(UV, sample, 3))).toBe('texSample(edgeWrapUV(twisted))')
    })
    it('transparent: samples straight then fades alpha by the in-bounds coverage', () => {
        expect(emit(applyEdgeHandlingExpr(UV, sample, 1))).toBe(
            'vec4f((texSample(twisted)).rgb, ((texSample(twisted)).a * edgeTransparentMask(twisted)))',
        )
    })
})
