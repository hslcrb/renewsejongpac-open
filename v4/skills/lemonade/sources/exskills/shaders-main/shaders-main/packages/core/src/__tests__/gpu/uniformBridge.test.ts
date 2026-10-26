import {describe, it, expect, afterEach, vi} from 'vitest'
import {
    transformColorGpu,
    transformPositionGpu,
    colorToRGBA,
    gpuTransformFor,
    identityTransform,
    setColorSpaceModeGpu,
    getColorSpaceModeGpu,
    transformBoolean as transformBooleanGpu,
    transformAngle as transformAngleGpu,
    transformEdges as transformEdgesGpu,
    transformColorSpace as transformColorSpaceGpu,
} from '@coreroot/gpu/transforms'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import {MAX_COLOR_STOPS} from '@coreroot/gpu/kit/colorStops'
import {
    transformColor,
    transformPosition,
    transformBoolean,
    transformAngle,
    transformEdges,
    transformColorSpace,
} from '@coreroot/utilities/transformations'
import {colorStopsTransform, colorStopsPropConfig} from '@coreroot/utilities/colorStops'
import {resolveDimensionalProp} from '@coreroot/utilities/dimensionalProps'
import {getAllShaders} from '@coreroot/shaderRegistry'

// ─── helpers ─────────────────────────────────────────────────────────────────
const comps = (v: unknown, n: number): number[] => {
    const o = v as Record<string, number>
    return [o.x, o.y, o.z, o.w].slice(0, n)
}
const expectClose = (actual: number[], expected: number[]): void => {
    expect(actual.length).toBe(expected.length)
    for (let i = 0; i < expected.length; i++) expect(actual[i]).toBeCloseTo(expected[i], 4)
}
const schemaType = (s: unknown): string => (s as {type?: string})?.type ?? ''

// ═══════════════════════════════════════════════════════════════════════════════════════
// transformColorGpu
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('transformColorGpu', () => {
    afterEach(() => setColorSpaceModeGpu('p3-linear'))

    it('parses to p3-linear (default) — golden values', () => {
        expectClose(comps(transformColorGpu('#ff0000'), 4), [0.822462, 0.033194, 0.017083, 1])
        expectClose(comps(transformColorGpu('#ffffff'), 4), [1, 1, 1, 1])
        expectClose(comps(transformColorGpu('#000000'), 4), [0, 0, 0, 1])
        // named colors resolve identically to their hex
        expectClose(comps(transformColorGpu('white'), 4), [1, 1, 1, 1])
    })

    it('returns a d.vec4f CPU instance (no Vector4 / TSL node)', () => {
        const v = transformColorGpu('#ff0000')
        expect((v as {kind?: string}).kind).toBe('vec4f')
        expect(Array.isArray(v)).toBe(true)
    })

    it("'transparent' → alpha 0 (NaN-safe guard), rgb finite", () => {
        expectClose(comps(transformColorGpu('transparent'), 4), [0, 0, 0, 0])
    })

    it('malformed input falls back to transparent black (no throw)', () => {
        expectClose(comps(transformColorGpu('not-a-color'), 4), [0, 0, 0, 0])
        expectClose(comps(transformColorGpu(''), 4), [0, 0, 0, 0])
    })

    it('carries alpha from a hex8 color', () => {
        const v = comps(transformColorGpu('#ff000080'), 4)
        expect(v[3]).toBeCloseTo(0.50196, 4)
    })

    it('respects the srgb vs p3 color-space mode switch', () => {
        expect(getColorSpaceModeGpu()).toBe('p3-linear')
        setColorSpaceModeGpu('srgb')
        expect(getColorSpaceModeGpu()).toBe('srgb')
        // sRGB primary red is exactly (1,0,0) in srgb-linear, but gamut-compressed in p3-linear.
        expectClose(comps(transformColorGpu('#ff0000'), 4), [1, 0, 0, 1])
        setColorSpaceModeGpu('p3-linear')
        expectClose(comps(transformColorGpu('#ff0000'), 4), [0.822462, 0.033194, 0.017083, 1])
    })

    it('colorToRGBA returns the flat tuple used by packStops', () => {
        const rgba = colorToRGBA('#ff0000')
        expect(rgba).toHaveLength(4)
        expectClose(rgba, [0.822462, 0.033194, 0.017083, 1])
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// transformPositionGpu
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('transformPositionGpu', () => {
    it('applies the Y-flip (1 - y) for {x, y} inputs', () => {
        expectClose(comps(transformPositionGpu({x: 0.25, y: 0.75}), 2), [0.25, 0.25])
        expectClose(comps(transformPositionGpu({x: 0, y: 0}), 2), [0, 1])
        expectClose(comps(transformPositionGpu({x: 1, y: 1}), 2), [1, 0])
    })

    it('returns a d.vec2f CPU instance', () => {
        const v = transformPositionGpu({x: 0.5, y: 0.5})
        expect((v as {kind?: string}).kind).toBe('vec2f')
    })

    it('parses CSS-style keyword strings (with Y-flip)', () => {
        expectClose(comps(transformPositionGpu('top left'), 2), [0, 1])
        expectClose(comps(transformPositionGpu('bottom right'), 2), [1, 0])
        expectClose(comps(transformPositionGpu('center'), 2), [0.5, 0.5])
    })

    it('reads a uv DimensionalValue axis via .value', () => {
        expectClose(comps(transformPositionGpu({x: {value: 0.3, unit: 'uv'}, y: 0.2}), 2), [0.3, 0.8])
    })

    it('defensively reads an UNRESOLVED px DimensionalValue as its raw .value (treated as UV)', () => {
        // The renderer resolves px→UV before transform; if it doesn't, we fall back to .value.
        expectClose(comps(transformPositionGpu({x: {value: 100, unit: 'px'}, y: 0.5}), 2), [100, 0.5])
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// gpuTransformFor mapping
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('gpuTransformFor', () => {
    it('maps color / position v1 transforms to their GPU equivalents', () => {
        expect(gpuTransformFor(transformColor)).toBe(transformColorGpu)
        expect(gpuTransformFor(transformPosition)).toBe(transformPositionGpu)
    })

    it('maps colorStopsTransform to the passthrough marker', () => {
        expect(gpuTransformFor(colorStopsTransform)).toBe(colorStopsTransform)
    })

    it('maps pure scalar transforms to themselves (re-exported v1 fns)', () => {
        expect(gpuTransformFor(transformBoolean)).toBe(transformBoolean)
        expect(gpuTransformFor(transformAngle)).toBe(transformAngle)
        expect(gpuTransformFor(transformEdges)).toBe(transformEdges)
        expect(gpuTransformFor(transformColorSpace)).toBe(transformColorSpace)
        // and the re-exports are the same identities
        expect(transformBooleanGpu).toBe(transformBoolean)
        expect(transformAngleGpu).toBe(transformAngle)
        expect(transformEdgesGpu).toBe(transformEdges)
        expect(transformColorSpaceGpu).toBe(transformColorSpace)
    })

    it('returns undefined when there is no transform', () => {
        expect(gpuTransformFor(undefined)).toBeUndefined()
    })

    it('returns an inline/unregistered transform AS-IS (applied directly) — no warn, no identity', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const halve = (v: number) => v * 0.5
        const boolToFloat = (v: boolean) => (v ? 1 : 0)
        const enumMap = (v: string) => ({bars: 0, rounded: 1, waves: 2} as Record<string, number>)[v] ?? 0
        // The GPU transform IS the function itself, so it produces the transformed value.
        expect(gpuTransformFor(halve as never)).toBe(halve)
        expect(gpuTransformFor(boolToFloat as never)).toBe(boolToFloat)
        expect(gpuTransformFor(enumMap as never)).toBe(enumMap)
        expect((gpuTransformFor(halve as never) as (v: number) => number)(0.2)).toBeCloseTo(0.1, 6)
        expect((gpuTransformFor(boolToFloat as never) as (v: boolean) => number)(false)).toBe(0)
        expect((gpuTransformFor(enumMap as never) as (v: string) => number)('waves')).toBe(2)
        // The prior identity-passthrough + one-time warn behaviour is gone (was console spam).
        expect(gpuTransformFor(halve as never)).not.toBe(identityTransform)
        expect(warn).not.toHaveBeenCalled()
        warn.mockRestore()
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// gpuTransformFor — full shader-roster inventory (regression guard for the FIX-E gap)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('gpuTransformFor — shader-roster inventory', () => {
    interface PropCfg {
        transform?: (v: never) => unknown
        default?: unknown
    }
    const rosterProps = (): Array<{shader: string; prop: string; cfg: PropCfg}> => {
        const out: Array<{shader: string; prop: string; cfg: PropCfg}> = []
        for (const entry of getAllShaders()) {
            const def = entry.definition as {name: string; props?: Record<string, PropCfg>}
            for (const [prop, cfg] of Object.entries(def?.props ?? {})) {
                if (cfg?.transform) out.push({shader: def.name, prop, cfg})
            }
        }
        return out
    }

    it('NO prop transform anywhere maps to the identity passthrough (the FIX-E gap)', () => {
        const gaps = rosterProps()
            .filter(({cfg}) => gpuTransformFor(cfg.transform) === identityTransform)
            .map(({shader, prop}) => `${shader}.${prop}`)
        expect(gaps).toEqual([])
    })

    it('color/position map to their GPU equivalents; every other transform is returned as-is', () => {
        for (const {cfg} of rosterProps()) {
            const t = cfg.transform as unknown
            if (t === (transformColor as unknown)) {
                expect(gpuTransformFor(cfg.transform)).toBe(transformColorGpu)
            } else if (t === (transformPosition as unknown)) {
                expect(gpuTransformFor(cfg.transform)).toBe(transformPositionGpu)
            } else {
                // colorStops marker + all scalar / inline-numeric / boolean→float / enum transforms
                expect(gpuTransformFor(cfg.transform)).toBe(t)
            }
        }
    })

    it('the transforms that were previously dropped now produce their transformed values', () => {
        const find = (shader: string, prop: string): {fn: (v: unknown) => unknown; def: unknown} => {
            const m = rosterProps().find((r) => r.shader === shader && r.prop === prop)
            if (!m) throw new Error(`missing ${shader}.${prop} in roster`)
            return {fn: gpuTransformFor(m.cfg.transform) as (v: unknown) => unknown, def: m.cfg.default}
        }
        const glass = find('Glass', 'thickness') // v => v*0.5, default 0.2 → 0.1
        expect(glass.fn(glass.def)).toBeCloseTo(0.1, 6)
        const neon = find('Neon', 'tubeThickness') // v => v*0.05, default 0.2 → 0.01
        expect(neon.fn(neon.def)).toBeCloseTo(0.01, 6)
        const ascii = find('Ascii', 'spacing') // v => 0.1 + v*1.4, default 1.0 → 1.5
        expect(ascii.fn(ascii.def)).toBeCloseTo(1.5, 6)
        const text = find('Text', 'italic') // boolean → float
        expect(text.fn(true)).toBe(1)
        expect(text.fn(false)).toBe(0)
        const film = find('FilmGrain', 'animated') // boolean → float
        expect(film.fn(true)).toBe(1)
        expect(film.fn(false)).toBe(0)
        const fluted = find('FlutedGlass', 'shape') // enum string → number
        expect(fluted.fn('bars')).toBe(0)
        expect(fluted.fn('waves')).toBe(2)
        const rep = find('Repeater', 'instanceRotation') // deg → rad
        expect(rep.fn(180)).toBeCloseTo(Math.PI, 6)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// createGpuUniformsMap — full bridge shape
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('createGpuUniformsMap', () => {
    const makeDefinition = () => ({
        name: 'TestShader',
        props: {
            color: {default: '#1aff00', transform: transformColor},
            center: {default: {x: 0.5, y: 0.5}, transform: transformPosition},
            speed: {default: 1.0},
            enabled: {default: true, transform: transformBoolean},
            angle: {default: 90, transform: transformAngle},
            variant: {default: 'smooth', compileTime: true},
            softness: {default: 0.1, ui: {dimensional: 'canvas-height' as const}},
            stops: colorStopsPropConfig(),
        },
    })

    const makeProps = () => ({
        color: '#ff0000',
        center: {x: 0.25, y: 0.75},
        speed: 2.5,
        enabled: false,
        angle: 45,
        variant: 'sharp',
        softness: {value: 20, unit: 'px' as const},
        stops: [
            {color: '#ff0000', position: 0},
            {color: '#00ff00', position: 0.5},
            {color: '#0000ff', position: 1},
        ],
    })

    it('applies gpuTransformFor and stores RAW values (store applies the transform)', () => {
        const map = createGpuUniformsMap(makeDefinition(), makeProps(), 'node1')

        expect(map.color.value).toBe('#ff0000')
        expect(map.color.transform).toBe(transformColorGpu)
        expect(map.color.cpu).toBeUndefined()

        expect(map.center.value).toEqual({x: 0.25, y: 0.75})
        expect(map.center.transform).toBe(transformPositionGpu)

        expect(map.speed.value).toBe(2.5)
        expect(map.speed.transform).toBeUndefined()

        expect(map.enabled.value).toBe(false)
        expect(map.enabled.transform).toBe(transformBoolean)

        expect(map.angle.value).toBe(45)
        expect(map.angle.transform).toBe(transformAngle)
    })

    it('marks string select props (no transform) cpu-only and carries compileTime', () => {
        const map = createGpuUniformsMap(makeDefinition(), makeProps(), 'node1')
        expect(map.variant.value).toBe('sharp')
        expect(map.variant.transform).toBeUndefined()
        expect(map.variant.cpu).toBe(true)
        expect(map.variant.compileTime).toBe(true)
    })

    it('marks a no-transform config OBJECT prop cpu-only, intact (shape JSON as an object)', () => {
        // The shape prop can arrive as a serialized STRING or a live OBJECT (e.g. the homepage hero's
        // `:shape="{...}"`). Both must be cpu-only — a config object is NOT a packable scalar/vec, so if
        // it fell to the GPU-field path the store would pack it to a number that reads back as 0, the
        // 3D-shape compute would parse {} and use ALL defaults (wrong radius → oversized; static
        // rotations → frozen). Regression guard for that bug.
        const shape = {type: 'dodecahedron3D', radius: 0.22, rotX: 20, rotY: {type: 'auto-animate', outputMin: -180, outputMax: 180}}
        const def = {name: 'ShapeShader', props: {shape: {default: {type: 'circleSDF'}}}}
        const map = createGpuUniformsMap(def, {shape}, 'node1')
        expect(map.shape.cpu).toBe(true)
        expect(map.shape.transform).toBeUndefined()
        // The object must survive intact — radius + the nested driver still present for the compute.
        expect(map.shape.value).toEqual(shape)
    })

    it('keeps dimensional props RAW and flags _rawDimensional (registerNode resolves later)', () => {
        const map = createGpuUniformsMap(makeDefinition(), makeProps(), 'node1')
        expect(map.softness.value).toEqual({value: 20, unit: 'px'})
        expect(map.softness._rawDimensional).toEqual({value: 20, unit: 'px'})
        // The preserved raw is exactly what the resolver needs: 20px / canvasHeight(200) = 0.1 UV.
        const resolved = resolveDimensionalProp(
            undefined,
            'softness',
            map.softness._rawDimensional,
            'center',
            400,
            200,
            new Map([['softness', 'canvas-height']]),
        )
        expect(resolved).toBeCloseTo(0.1, 6)
    })

    it('falls back to the prop default when a value is null/undefined', () => {
        const props = {...makeProps(), speed: undefined as unknown as number}
        const map = createGpuUniformsMap(makeDefinition(), props, 'node1')
        expect(map.speed.value).toBe(1.0)
    })

    it('logs + coerces to 0 when a prop has no value and no default', () => {
        const err = vi.spyOn(console, 'error').mockImplementation(() => {})
        const def = {name: 'X', props: {mystery: {default: undefined as unknown as number}}}
        const map = createGpuUniformsMap(def, {}, 'node1')
        expect(map.mystery.value).toBe(0)
        expect(err).toHaveBeenCalledTimes(1)
        err.mockRestore()
    })

    // ── colorStops expansion ──────────────────────────────────────────────────
    it('expands a colorStops prop into cpu mirror + packed array fields', () => {
        const map = createGpuUniformsMap(makeDefinition(), makeProps(), 'node1')

        // The `stops` prop itself: cpu mirror carrying raw + the recompile trigger.
        expect(map.stops.cpu).toBe(true)
        expect(map.stops.transform).toBe(colorStopsTransform)
        expect(Array.isArray(map.stops.value)).toBe(true)
        expect(map.stops.compileTimeWhen).toBeTypeOf('function')
        expect(map.stops._lastCompiledValue).toBe((map.stops.value as unknown[]))

        // stopCount scalar.
        expect(map.stopCount.value).toBe(3)
        expect(schemaType(map.stopCount.schema)).toBe('f32')

        // colorsArray: vec4f × 8, 32 flat floats, first stop = transformColorGpu('#ff0000').
        expect(schemaType(map.colorsArray.schema)).toBe('array')
        expect((map.colorsArray.schema as {elementCount?: number}).elementCount).toBe(MAX_COLOR_STOPS)
        expect(schemaType((map.colorsArray.schema as {elementType?: unknown}).elementType)).toBe('vec4f')
        const colors = map.colorsArray.value as number[]
        expect(colors).toHaveLength(MAX_COLOR_STOPS * 4)
        expectClose(colors.slice(0, 4), [0.822462, 0.033194, 0.017083, 1])
        expectClose(colors.slice(20, 32), new Array(12).fill(0)) // unused stops zeroed

        // positionsArray: vec4f × 2 (8 positions packed 4-per-vec4).
        expect(schemaType(map.positionsArray.schema)).toBe('array')
        expect((map.positionsArray.schema as {elementCount?: number}).elementCount).toBe(MAX_COLOR_STOPS / 4)
        const positions = map.positionsArray.value as number[]
        expect(positions).toHaveLength(MAX_COLOR_STOPS)
        expectClose(positions, [0, 0.5, 1, 0, 0, 0, 0, 0])

        // convertedColorsArray: vec3f × 8, seeded at mode 0 (identity) → equals colors rgb.
        expect(schemaType(map.convertedColorsArray.schema)).toBe('array')
        expect(schemaType((map.convertedColorsArray.schema as {elementType?: unknown}).elementType)).toBe('vec3f')
        const converted = map.convertedColorsArray.value as number[]
        expect(converted).toHaveLength(MAX_COLOR_STOPS * 3)
        expectClose(converted.slice(0, 3), colors.slice(0, 3))
    })

    it('colorStops: null/legacy stops → stopCount 0 (shader takes the two-color path)', () => {
        const props = {...makeProps(), stops: null}
        const map = createGpuUniformsMap(makeDefinition(), props, 'node1')
        expect(map.stopCount.value).toBe(0)
        expect(map.stops.value).toBeNull()
    })

    it('produces WGSL-safe field entries only for GPU props (strings stay cpu)', () => {
        const map = createGpuUniformsMap(makeDefinition(), makeProps(), 'node1')
        // Every non-cpu, non-array entry carries a value the store can pack.
        for (const [name, input] of Object.entries(map)) {
            if (input.cpu) {
                expect(['variant', 'stops']).toContain(name)
            }
        }
    })
})
