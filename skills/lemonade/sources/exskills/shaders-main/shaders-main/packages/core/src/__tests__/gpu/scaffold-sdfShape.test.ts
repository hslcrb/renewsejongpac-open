import {describe, it, expect} from 'vitest'
import {tgpu} from '@coreroot/gpu/kit'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import {composeShape} from './helpers/shapeRegistry'
import {halfUvFromProp} from '@coreroot/utilities/halfUvProps'

import Arc from '@coreroot/shaders/Arc/index'
import Circle from '@coreroot/shaders/Circle/index'
import Crescent from '@coreroot/shaders/Crescent/index'
import Cross from '@coreroot/shaders/Cross/index'
import Ellipse from '@coreroot/shaders/Ellipse/index'
import Flower from '@coreroot/shaders/Flower/index'
import Heart from '@coreroot/shaders/Heart/index'
import Parallelogram from '@coreroot/shaders/Parallelogram/index'
import Polygon from '@coreroot/shaders/Polygon/index'
import Ring from '@coreroot/shaders/Ring/index'
import RoundedRect from '@coreroot/shaders/RoundedRect/index'
import Star from '@coreroot/shaders/Star/index'
import Teardrop from '@coreroot/shaders/Teardrop/index'
import Trapezoid from '@coreroot/shaders/Trapezoid/index'
import Vesica from '@coreroot/shaders/Vesica/index'

/**
 * `defineSdfShapeShader` migration gate (Phase 4).
 *
 * The per-shader `shader-*.test.ts` files already pin each shape's emitted WGSL (unchanged
 * snapshots are the Gate A proof). What they do NOT cover is the CPU-side surface the factory took
 * over, so this file pins that against the values the fifteen shapes declared inline before the
 * migration:
 *
 * 1. `boundingBoxDeclaration` — the Design Editor overlay contract, asserted against literals
 *    (not against the factory, which would be circular).
 * 2. Prop KEY ORDER — load-bearing twice over: `createGpuUniformsMap` walks it to lay out the
 *    node's uniform struct, and the generated `shaderMetadata.ts` carries it into the settings
 *    panel. Circle's order is the non-canonical one the factory has to be told about.
 * 3. Circle's and Ring's documented prop divergences, so a later "tidy-up" can't quietly narrow
 *    Circle's map-driveable ranges or Ring's stroke maximum.
 * 4. Ring's and Trapezoid's custom bounds arithmetic, which the factory passes through and which
 *    the `halfUvFromProp` extraction touched.
 */

type Def = GpuShaderDefinition & {
    boundingBoxDeclaration?: {
        propBindings?: Record<string, unknown>
        computeBounds?: (props: Record<string, any>, cw: number, ch: number) => Record<string, number>
        writeBounds?: (
            bounds: Record<string, number>,
            props: Record<string, any>,
            cw: number,
            ch: number,
        ) => Record<string, any>
        freeResize?: boolean
    }
}

const XY = {
    x: {prop: 'center', as: 'position-x'},
    y: {prop: 'center', as: 'position-y'},
}
const ROT = {rotation: {prop: 'rotation', as: 'degrees'}}
const half = (prop: string) => ({prop, as: 'half-canvas-height'})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) boundingBoxDeclaration — literal, per shape
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('defineSdfShapeShader (a) bounding box declarations are unchanged', () => {
    const declarative: [string, Def, Record<string, unknown>][] = [
        ['Arc', Arc as Def, {...XY, width: half('radius'), height: half('radius'), ...ROT}],
        ['Crescent', Crescent as Def, {...XY, width: half('radius'), height: half('radius'), ...ROT}],
        ['Cross', Cross as Def, {...XY, width: half('radius'), height: half('radius'), ...ROT}],
        ['Ellipse', Ellipse as Def, {...XY, width: half('radiusX'), height: half('radiusY'), ...ROT}],
        ['Flower', Flower as Def, {...XY, width: half('radius'), height: half('radius'), ...ROT}],
        ['Heart', Heart as Def, {...XY, width: half('radius'), height: half('radius'), ...ROT}],
        ['Parallelogram', Parallelogram as Def, {...XY, width: half('width'), height: half('height'), ...ROT}],
        ['Polygon', Polygon as Def, {...XY, width: half('radius'), height: half('radius'), ...ROT}],
        ['RoundedRect', RoundedRect as Def, {...XY, width: half('width'), height: half('height'), ...ROT}],
        ['Star', Star as Def, {...XY, width: half('radius'), height: half('radius'), ...ROT}],
        ['Teardrop', Teardrop as Def, {...XY, width: half('radius'), height: half('height'), ...ROT}],
        ['Vesica', Vesica as Def, {...XY, width: half('radius'), height: half('radius'), ...ROT}],
    ]

    for (const [name, def, propBindings] of declarative) {
        it(`${name} binds x/y/width/height/rotation as before`, () => {
            expect(def.boundingBoxDeclaration).toEqual({propBindings})
        })
    }

    it('Circle binds radius as canvas-height and declares NO rotation axis', () => {
        // radius names the full visual size (the shader halves it), and a circle looks the same at
        // any angle — both divergences from the fleet default.
        expect(Circle.boundingBoxDeclaration).toEqual({
            propBindings: {...XY, width: {prop: 'radius', as: 'canvas-height'}, height: {prop: 'radius', as: 'canvas-height'}},
        })
    })

    it('Ring keeps propBindings x/y only, plus its custom bounds pair', () => {
        const bbox = (Ring as Def).boundingBoxDeclaration!
        expect(bbox.propBindings).toEqual(XY)
        expect(typeof bbox.computeBounds).toBe('function')
        expect(typeof bbox.writeBounds).toBe('function')
        expect(bbox.freeResize).toBeUndefined()
    })

    it('Trapezoid keeps x/y/rotation bindings, its custom bounds pair, and freeResize', () => {
        const bbox = (Trapezoid as Def).boundingBoxDeclaration!
        expect(bbox.propBindings).toEqual({...XY, ...ROT})
        expect(typeof bbox.computeBounds).toBe('function')
        expect(typeof bbox.writeBounds).toBe('function')
        expect(bbox.freeResize).toBe(true)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) Prop key order — the uniform struct layout and the panel order both read it
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('defineSdfShapeShader (b) prop key order is unchanged', () => {
    const STROKE_TAIL = ['softness', 'strokeThickness', 'strokeColor', 'strokePosition', 'colorSpace']
    const canonical = (shape: string[], rotatable = true) => [
        'origin', 'color', 'center', ...shape, ...(rotatable ? ['rotation'] : []), ...STROKE_TAIL,
    ]

    const cases: [string, GpuShaderDefinition, string[]][] = [
        ['Arc', Arc, canonical(['radius', 'aperture'])],
        ['Crescent', Crescent, canonical(['radius', 'innerRatio', 'offset'])],
        ['Cross', Cross, canonical(['radius', 'thickness', 'rounding'])],
        ['Ellipse', Ellipse, canonical(['radiusX', 'radiusY'])],
        ['Flower', Flower, canonical(['radius', 'sides', 'innerRatio'])],
        ['Heart', Heart, canonical(['radius'])],
        ['Parallelogram', Parallelogram, canonical(['width', 'height', 'skew'])],
        ['Polygon', Polygon, canonical(['radius', 'sides', 'rounding'])],
        ['RoundedRect', RoundedRect, canonical(['width', 'height', 'rounding'])],
        ['Star', Star, canonical(['radius', 'sides', 'innerRatio'])],
        ['Teardrop', Teardrop, canonical(['radius', 'height'])],
        ['Trapezoid', Trapezoid, canonical(['bottomWidth', 'topWidth', 'height'])],
        ['Vesica', Vesica, canonical(['radius', 'spread'])],
        ['Ring', Ring, canonical(['radius', 'thickness'], false)],
        // Circle predates the canonical order: radius + softness sit before center.
        ['Circle', Circle, ['origin', 'color', 'radius', 'softness', 'center', 'strokeThickness', 'strokeColor', 'strokePosition', 'colorSpace']],
    ]

    for (const [name, def, order] of cases) {
        it(`${name}`, () => {
            expect(Object.keys(def.props)).toEqual(order)
        })
    }
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (c) The two shapes whose props diverge from the fleet standard
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('defineSdfShapeShader (c) preserved prop divergences', () => {
    const props = (def: GpuShaderDefinition) => def.props as Record<string, any>

    it("Circle's softness and strokeThickness stay map-driveable with widened ranges", () => {
        expect(props(Circle).softness.ui).toEqual({
            type: ['range', 'map'], min: 0, max: 1, step: 0.01,
            label: 'Softness', group: 'Effect', dimensional: 'canvas-height',
        })
        expect(props(Circle).strokeThickness.ui).toEqual({
            type: ['range', 'map'], min: 0, max: 0.5, step: 0.01,
            label: 'Stroke Thickness', group: 'Stroke',
        })
        expect(props(Circle).center.ui.label).toBe('Center Position')
        expect(props(Circle).colorSpace.description).toBe('Color space for blending fill and stroke colors in soft edges')
        expect(props(Circle).strokeColor.description).toBe('The color of the stroke outline')
        expect(props(Circle).rotation).toBeUndefined()
    })

    it("Ring's stroke maximum stays 0.1 and its softness wording names both edges", () => {
        expect(props(Ring).strokeThickness.ui.max).toBe(0.1)
        expect(props(Ring).softness.description).toBe(
            'Edge softness for antialiasing (applied to both inner and outer ring edges)',
        )
        expect(props(Ring).strokePosition.description).toBe('Position of the stroke relative to the ring edge')
        expect(props(Ring).rotation).toBeUndefined()
    })

    it("Cross keeps its rotation description; the rest use the fleet wording", () => {
        expect(props(Cross).rotation.description).toBe('Rotation in degrees (45° turns a plus into an ×)')
        expect(props(Star).rotation.description).toBe('Rotation in degrees')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (d) The custom bounds arithmetic the factory passes through
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('defineSdfShapeShader (d) custom bounds arithmetic', () => {
    const bbox = (def: Def) => def.boundingBoxDeclaration!

    it("Ring's box tracks the outer edge and resize preserves band thickness", () => {
        const {computeBounds, writeBounds} = bbox(Ring as Def)
        // outer edge = (radius + thickness) → diameter = 2 · (0.3 + 0.07) · 600 = 444px
        expect(computeBounds!({radius: 0.3, thickness: 0.07, center: {x: 0.5, y: 0.5}}, 800, 600)).toEqual({
            centerXPx: 400, centerYPx: 300, widthPx: 444, heightPx: 444, rotationDeg: 0,
        })
        const written = writeBounds!(
            {centerXPx: 400, centerYPx: 300, widthPx: 600, heightPx: 600, rotationDeg: 0},
            {radius: 0.3, thickness: 0.07, center: {x: 0.5, y: 0.5}},
            800, 600,
        )
        // new outer = 600 / (2 · 600) = 0.5 → radius = 0.5 − 0.07
        expect(written.radius).toBeCloseTo(0.43, 10)
    })

    it("Trapezoid's box uses the WIDER edge, in both uv and px units", () => {
        const {computeBounds} = bbox(Trapezoid as Def)
        // topWidth 0.5 > bottomWidth 0.35 → width reads the top edge
        expect(computeBounds!({bottomWidth: 0.35, topWidth: 0.5, height: 0.25, center: {x: 0.5, y: 0.5}}, 800, 600)).toEqual({
            centerXPx: 400, centerYPx: 300, widthPx: 600, heightPx: 300, rotationDeg: 0,
        })
        // a px bottomWidth carries the FULL pixel size → half-UV = 480 / (2 · 600) = 0.4
        expect(
            computeBounds!(
                {bottomWidth: {value: 480, unit: 'px'}, topWidth: 0.2, height: 0.25, center: {x: 0.5, y: 0.5}},
                800, 600,
            ).widthPx,
        ).toBeCloseTo(480, 10)
    })

    it("Trapezoid's resize scales both edges proportionally and keeps px props in px", () => {
        const {writeBounds} = bbox(Trapezoid as Def)
        const written = writeBounds!(
            {centerXPx: 400, centerYPx: 300, widthPx: 840, heightPx: 300, rotationDeg: 30},
            {bottomWidth: 0.35, topWidth: 0.2, height: {value: 300, unit: 'px'}, center: {x: 0.5, y: 0.5}},
            800, 600,
        )
        // newMax = 840 / 1200 = 0.7; oldMax = 0.35 → factor 2
        expect(written.bottomWidth).toBeCloseTo(0.7, 10)
        expect(written.topWidth).toBeCloseTo(0.4, 10)
        expect(written.height).toEqual({value: 300, unit: 'px'})
        expect(written.rotation).toBe(30)
    })

    it('halfUvFromProp reads px as a full size, plain numbers as half-UV, junk as the fallback', () => {
        expect(halfUvFromProp({value: 480, unit: 'px'}, 600, 0.35)).toBeCloseTo(0.4, 10)
        expect(halfUvFromProp({value: 0.4, unit: 'uv'}, 600, 0.35)).toBe(0.4)
        expect(halfUvFromProp(0.25, 600, 0.35)).toBe(0.25)
        expect(halfUvFromProp(undefined, 600, 0.35)).toBe(0.35)
    })

    it('halfUvFromProp never returns NaN: non-finite values and an unmeasured canvas fall back', () => {
        expect(halfUvFromProp(NaN, 600, 0.35)).toBe(0.35)
        expect(halfUvFromProp(Infinity, 600, 0.35)).toBe(0.35)
        expect(halfUvFromProp({value: NaN, unit: 'px'}, 600, 0.35)).toBe(0.35)
        expect(halfUvFromProp({value: NaN}, 600, 0.35)).toBe(0.35)
        // A px value read before the canvas has a height would divide by zero.
        expect(halfUvFromProp({value: 480, unit: 'px'}, 0, 0.35)).toBe(0.35)
        expect(halfUvFromProp({value: 480, unit: 'px'}, NaN, 0.35)).toBe(0.35)
        // The fallback itself is normalized at the boundary (→ 0.5), so even a computed non-finite
        // fallback cannot leak NaN/Infinity out — the "never NaN" promise is unconditional.
        expect(halfUvFromProp(NaN, 600, NaN)).toBe(0.5)
        expect(halfUvFromProp('nope', 600, Infinity)).toBe(0.5)
        expect(halfUvFromProp({value: 480, unit: 'px'}, 0, NaN)).toBe(0.5)
        // A valid value still wins regardless of the fallback's state.
        expect(halfUvFromProp(0.2, 600, NaN)).toBe(0.2)
        expect(halfUvFromProp({value: 480, unit: 'px'}, 600, NaN)).toBe(0.4)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (e) Two factory instances in one tree — the $name-collision check (PRIMITIVES.md C3)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('defineSdfShapeShader (e) two configurations compose together', () => {
    it('a rotatable and a rotation-free shape resolve into one WGSL module without colliding', () => {
        // Star (rotatable, declarative bounds) + Ring (rotation-free, custom bounds), resolved as one
        // module under strict naming: if two differently-configured factory instances shared a WGSL
        // identifier, this is where it would surface (C3 in PRIMITIVES.md).
        const wgsl = tgpu.resolve(
            [
                composeShape(Star as GpuShaderDefinition).finalPass.entry,
                composeShape(Ring as GpuShaderDefinition).finalPass.entry,
            ],
            {names: 'strict'},
        )
        // Each shape's primitive appears exactly once, and the shared helpers
        // (shapeLocalCoords, strokeMaskFromSdf) dedupe rather than duplicate.
        expect(wgsl.match(/fn starSdf/g)?.length).toBe(1)
        expect(wgsl.match(/fn ringSdf/g)?.length).toBe(1)
        expect(wgsl.match(/fn strokeMaskFromSdf/g)?.length).toBe(1)
        expect(wgsl.match(/fn shapeLocalCoords/g)?.length).toBe(1)
    })
})
