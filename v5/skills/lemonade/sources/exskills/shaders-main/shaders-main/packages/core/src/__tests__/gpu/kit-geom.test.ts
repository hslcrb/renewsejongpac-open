import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {SystemUniforms, viewportCoordinate, aspectOf} from '@coreroot/gpu/kit/coords'
import {
    edgeClampUV,
    edgeMirrorUV,
    edgeWrapUV,
    edgeTransparentMask,
    applyEdgeToUV,
    composeEdgeRemap,
} from '@coreroot/gpu/kit/edges'
import {
    applyUVTransform,
    applyInverseUVTransform,
    applyRectangularClipMask,
    boundingBoxToGeneratorUVContext,
    boundingBoxToUVParams,
    needsTransformation,
    screenUVToBoxLocal,
    boxLocalToScreenUV,
} from '@coreroot/gpu/kit/uvTransform'
import type {BoundingBoxConfig} from '@coreroot/types'

/**
 * B6 kit geometry gate — coords/edges/uvTransform.
 * Two layers per §8.1: (1) resolve-gate — the `'use gpu'` fns transpile to valid WGSL and
 * snapshot; (2) CPU golden values — the same fns run as plain JS off-GPU, asserted against
 * hand-computed math (mathematical-equivalence enforcement for the shared helpers).
 */

describe('coords', () => {
    it('viewportCoordinate = uv * viewportSize (CPU)', () => {
        const c = viewportCoordinate(d.vec2f(0.25, 0.5), d.vec2f(800, 600))
        expect(c.x).toBeCloseTo(200)
        expect(c.y).toBeCloseTo(300)
    })

    it('aspectOf = w / h (CPU)', () => {
        expect(aspectOf(d.vec2f(1600, 900))).toBeCloseTo(1600 / 900)
    })

    it('SystemUniforms is a struct schema with the _sys fields', () => {
        // Field presence is the contract B5's composer nests under `_sys`.
        expect(SystemUniforms.propTypes.time).toBeDefined()
        expect(SystemUniforms.propTypes.viewportSize).toBeDefined()
        expect(SystemUniforms.propTypes.logicalViewportSize).toBeDefined()
        expect(SystemUniforms.propTypes.aspect).toBeDefined()
        expect(SystemUniforms.propTypes.pointer).toBeDefined()
        expect(SystemUniforms.propTypes.pointerActive).toBeDefined()
    })
})

describe('edges — per-mode GPU math (CPU golden values)', () => {
    it('clamp (mode 0)', () => {
        const r = edgeClampUV(d.vec2f(1.3, -0.2))
        expect(r.x).toBeCloseTo(1.0)
        expect(r.y).toBeCloseTo(0.0)
    })

    it('mirror (mode 2): m = mod(abs(x),2); m>=1 ? 2-m : m', () => {
        const r = edgeMirrorUV(d.vec2f(1.3, -0.2))
        expect(r.x).toBeCloseTo(0.7) // mod(1.3,2)=1.3 → 2-1.3
        expect(r.y).toBeCloseTo(0.2) // mod(0.2,2)=0.2 → 0.2
    })

    it('wrap (mode 3): fract', () => {
        const r = edgeWrapUV(d.vec2f(1.3, -0.2))
        expect(r.x).toBeCloseTo(0.3)
        expect(r.y).toBeCloseTo(0.8) // fract(-0.2) = 0.8
    })

    it('transparent (mode 1) coverage mask', () => {
        expect(edgeTransparentMask(d.vec2f(0.5, 0.5))).toBeCloseTo(1.0)
        expect(edgeTransparentMask(d.vec2f(1.3, 0.5))).toBeCloseTo(0.0)
        expect(edgeTransparentMask(d.vec2f(0.5, -0.1))).toBeCloseTo(0.0)
    })
})

describe('edges — builder selectors (JS-branch on mode)', () => {
    it('applyEdgeToUV routes by mode', () => {
        expect(applyEdgeToUV(d.vec2f(1.3, -0.2), 1).x).toBeCloseTo(1.3) // transparent = passthrough
        expect(applyEdgeToUV(d.vec2f(1.3, -0.2), 2).x).toBeCloseTo(0.7) // mirror
        expect(applyEdgeToUV(d.vec2f(1.3, -0.2), 3).x).toBeCloseTo(0.3) // wrap
        expect(applyEdgeToUV(d.vec2f(1.3, -0.2), 0).x).toBeCloseTo(1.0) // stretch
    })

    it('composeEdgeRemap transparent drops coverage outside bounds', () => {
        const inside = composeEdgeRemap(d.vec2f(0.5, 0.5), 1, 1)
        expect(inside.mask).toBeCloseTo(1.0)
        const outside = composeEdgeRemap(d.vec2f(1.5, 0.5), 1, 1)
        expect(outside.mask).toBeCloseTo(0.0)
        // non-transparent keeps mask, transforms uv
        const wrapped = composeEdgeRemap(d.vec2f(1.3, -0.2), 1, 3)
        expect(wrapped.mask).toBeCloseTo(1.0)
        expect(wrapped.uv.x).toBeCloseTo(0.3)
    })
})

describe('uvTransform — CPU golden values', () => {
    it('needsTransformation only when non-default', () => {
        expect(needsTransformation(undefined)).toBe(false)
        expect(needsTransformation({offsetX: 0, offsetY: 0, rotation: 0, scale: 1, anchorX: 0.5, anchorY: 0.5, edges: 'stretch'})).toBe(false)
        expect(needsTransformation({offsetX: 0, offsetY: 0, rotation: 0, scale: 1, anchorX: 0.5, anchorY: 0.5, edges: 'mirror'})).toBe(false)
        expect(needsTransformation({offsetX: 0.1, offsetY: 0, rotation: 0, scale: 1, anchorX: 0.5, anchorY: 0.5, edges: 'stretch'})).toBe(true)
    })

    it('applyUVTransform identity returns the input', () => {
        const r = applyUVTransform(d.vec2f(0.3, 0.7), 0, 0, 0, 1, 0.5, 0.5, 1)
        expect(r.x).toBeCloseTo(0.3)
        expect(r.y).toBeCloseTo(0.7)
    })

    it('applyUVTransform 90° about centre (aspect 1) rotates a right-point to an up-point', () => {
        // point 0.1 to the right of centre → 0.1 above centre
        const r = applyUVTransform(d.vec2f(0.6, 0.5), 0, 0, 90, 1, 0.5, 0.5, 1)
        expect(r.x).toBeCloseTo(0.5)
        expect(r.y).toBeCloseTo(0.6)
    })

    it('applyInverseUVTransform undoes applyUVTransform', () => {
        const fwd = applyUVTransform(d.vec2f(0.62, 0.41), 0.1, -0.05, 37, 1.4, 0.3, 0.6, 1.5)
        const back = applyInverseUVTransform(fwd, 0.1, -0.05, 37, 1.4, 0.3, 0.6, 1.5)
        expect(back.x).toBeCloseTo(0.62, 4)
        expect(back.y).toBeCloseTo(0.41, 4)
    })

    it('applyRectangularClipMask: 1 inside, 0 outside', () => {
        // full-canvas box (centre .5,.5, half-extents .5), no corner radius, no rotation, aspect 1
        expect(applyRectangularClipMask(d.vec2f(0.5, 0.5), 0.5, 0.5, 0.5, 0.5, 0, 0, 1, 0)).toBeCloseTo(1.0)
        // small box, point clearly outside
        expect(applyRectangularClipMask(d.vec2f(0.9, 0.9), 0.5, 0.5, 0.1, 0.1, 0, 0, 1, 0)).toBeCloseTo(0.0)
        // Zero feather is the LEGACY BINARY step, so a point exactly ON the edge (uv.y == 1 is the
        // box's own boundary → sdf == 0) counts as inside. A floored-feather ramp would report 0.5
        // here, which is a whole half-alpha row wherever an axis-aligned edge hits pixel centres.
        expect(applyRectangularClipMask(d.vec2f(0.5, 1.0), 0.5, 0.5, 0.5, 0.5, 0, 0, 1, 0)).toBeCloseTo(1.0)
        // Same point WITH a feather is genuinely half-covered — the ramp is centred on the edge.
        expect(applyRectangularClipMask(d.vec2f(0.5, 1.0), 0.5, 0.5, 0.5, 0.5, 0, 0, 1, 0.001)).toBeCloseTo(0.5)
    })

    it('applyRectangularClipMask: the feather ramps coverage across one pixel', () => {
        // Half-pixel feather for a 1000px-tall canvas; box edge at y = 0.75 (centre .5, half .25).
        const aa = 0.5 / 1000
        const at = (y: number) => applyRectangularClipMask(d.vec2f(0.5, y), 0.5, 0.5, 0.25, 0.25, 0, 0, 1, aa)
        // A pixel centre half a pixel INSIDE the edge is still fully covered (no darkened border row).
        expect(at(0.75 - aa)).toBeCloseTo(1.0)
        // On the edge → half covered; half a pixel outside → fully transparent.
        expect(at(0.75)).toBeCloseTo(0.5)
        expect(at(0.75 + aa)).toBeCloseTo(0.0)
    })

    it('boundingBoxToGeneratorUVContext reduces to identity at full-canvas box', () => {
        const r = boundingBoxToGeneratorUVContext(d.vec2f(0.3, 0.7), 0.5, 0.5, 0.5, 0.5, 0, 1)
        expect(r.x).toBeCloseTo(0.3)
        expect(r.y).toBeCloseTo(0.7)
    })

    it('boundingBoxToUVParams: uv-unit box', () => {
        const bbox: BoundingBoxConfig = {
            x: {value: 0.25, unit: 'uv'},
            y: {value: 0.25, unit: 'uv'},
            width: {value: 0.5, unit: 'uv'},
            height: {value: 0.5, unit: 'uv'},
            origin: 'top-left',
            rotation: 0,
        }
        const p = boundingBoxToUVParams(bbox, 1000, 500)
        expect(p.centerX).toBeCloseTo(0.5)
        expect(p.centerY).toBeCloseTo(0.5)
        expect(p.halfWidthUV).toBeCloseTo(0.25)
        expect(p.halfHeightUV).toBeCloseTo(0.25)
    })

    it('screenUVToBoxLocal / boxLocalToScreenUV are exact inverses', () => {
        const g = {centerX: 0.4, centerY: 0.55, halfWidthUV: 0.3, halfHeightUV: 0.2, rotationDeg: 25, aspectRatio: 1.6}
        const local = screenUVToBoxLocal(0.62, 0.48, g)
        const screen = boxLocalToScreenUV(local.x, local.y, g)
        expect(screen.x).toBeCloseTo(0.62, 6)
        expect(screen.y).toBeCloseTo(0.48, 6)
    })
})

describe('resolve gate — geom fns emit valid WGSL', () => {
    const frag = tgpu
        .fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})((input) => {
            'use gpu'
            const t = applyUVTransform(input.uv, 0.1, 0.2, 30, 1.2, 0.5, 0.5, 1.5)
            const clamped = edgeClampUV(t)
            const mir = edgeMirrorUV(clamped)
            const wr = edgeWrapUV(mir)
            const m = edgeTransparentMask(wr)
            const clip = applyRectangularClipMask(wr, 0.5, 0.5, 0.4, 0.3, 0.05, 15, 1.5, 0.0005)
            const ctx = boundingBoxToGeneratorUVContext(wr, 0.5, 0.5, 0.4, 0.3, 15, 1.5)
            const inv = applyInverseUVTransform(ctx, 0.1, 0.2, 30, 1.2, 0.5, 0.5, 1.5)
            return d.vec4f(inv.x, inv.y, m, clip)
        })
        .$name('geomProbe')

    it('resolves', () => {
        const wgsl = tgpu.resolve([frag], {names: 'strict'})
        expect(typeof wgsl).toBe('string')
        expect(wgsl.length).toBeGreaterThan(0)
    })

    it('matches WGSL snapshot', () => {
        expect(tgpu.resolve([frag], {names: 'strict'})).toMatchSnapshot()
    })
})
