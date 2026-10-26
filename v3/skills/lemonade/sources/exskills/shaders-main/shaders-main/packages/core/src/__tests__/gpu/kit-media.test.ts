import {describe, it, expect} from 'vitest'
import {d} from '@coreroot/gpu/kit'
import * as media from '@coreroot/gpu/kit/media'
import {srgbToLinear} from '@coreroot/gpu/kit/tonemap'

/**
 * Golden-value gates for kit/media (the shared object-fit math for ImageTexture / WebcamTexture /
 * VideoTexture) + the sRGB decode. Each fit fn is a DualFn — it runs as plain JS off-GPU — so we
 * check it against the ORIGINAL v1 fit formulas transcribed by hand (the same references the
 * VideoTexture test used, extended with `scaleNone` for Webcam's natural-size mode).
 */

type Vec2 = [number, number]

const dims: {dw: number; dh: number; vpx: number; vpy: number}[] = [
    {dw: 1920, dh: 1080, vpx: 800, vpy: 600}, // 16:9 media in 4:3 viewport
    {dw: 640, dh: 480, vpx: 1280, vpy: 400}, // 4:3 media in wide viewport
    {dw: 500, dh: 500, vpx: 800, vpy: 600}, // square media
]

const coverGolden = (dw: number, dh: number, vpx: number, vpy: number): Vec2 => {
    const a = dw / dh
    const va = vpx / vpy
    const s = Math.max(va / a, 1)
    return [(a / va) * s, s]
}
const containGolden = (dw: number, dh: number, vpx: number, vpy: number): Vec2 => {
    const a = dw / dh
    const va = vpx / vpy
    const s = Math.min(va / a, 1)
    return [(a / va) * s, s]
}
const scaleDownGolden = (dw: number, dh: number, vpx: number, vpy: number): Vec2 => {
    const a = dw / dh
    const va = vpx / vpy
    const s = Math.min(Math.min(va / a, 1), Math.min(vpx / dw, vpy / dh))
    return [(a / va) * s, s]
}
const noneGolden = (dw: number, dh: number, vpx: number, vpy: number): Vec2 => {
    const a = dw / dh
    const va = vpx / vpy
    const s = Math.min(vpx / dw, vpy / dh)
    return [(a / va) * s, s]
}
const sampleGolden = (uv: Vec2, scale: Vec2): Vec2 => [(uv[0] - 0.5) / scale[0] + 0.5, (uv[1] - 0.5) / scale[1] + 0.5]

describe('kit/media — object-fit uvScale', () => {
    it('scaleCover reproduces the v1 cover scale', () => {
        for (const {dw, dh, vpx, vpy} of dims) {
            const out = media.scaleCover(d.vec2f(dw, dh), d.vec2f(vpx, vpy)) as d.v2f
            const [ex, ey] = coverGolden(dw, dh, vpx, vpy)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
    it('scaleContain reproduces the v1 contain scale', () => {
        for (const {dw, dh, vpx, vpy} of dims) {
            const out = media.scaleContain(d.vec2f(dw, dh), d.vec2f(vpx, vpy)) as d.v2f
            const [ex, ey] = containGolden(dw, dh, vpx, vpy)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
    it('scaleFill is (1,1)', () => {
        const out = media.scaleFill() as d.v2f
        expect(out.x).toBeCloseTo(1, 6)
        expect(out.y).toBeCloseTo(1, 6)
    })
    it('scaleScaleDown reproduces the v1 scale-down scale', () => {
        for (const {dw, dh, vpx, vpy} of dims) {
            const out = media.scaleScaleDown(d.vec2f(dw, dh), d.vec2f(vpx, vpy)) as d.v2f
            const [ex, ey] = scaleDownGolden(dw, dh, vpx, vpy)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
    it('scaleNone reproduces the v1 natural-size scale (Webcam)', () => {
        for (const {dw, dh, vpx, vpy} of dims) {
            const out = media.scaleNone(d.vec2f(dw, dh), d.vec2f(vpx, vpy)) as d.v2f
            const [ex, ey] = noneGolden(dw, dh, vpx, vpy)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})

describe('kit/media — sampleUV (centre / scale / recentre, no Y-flip)', () => {
    it('matches the v1 centre-scale formula', () => {
        const cases: {uv: Vec2; scale: Vec2}[] = [
            {uv: [0.5, 0.5], scale: [1, 1]},
            {uv: [0.2, 0.8], scale: [1.5, 0.75]},
            {uv: [1, 0], scale: [2, 0.5]},
        ]
        for (const c of cases) {
            const out = media.sampleUV(d.vec2f(c.uv[0], c.uv[1]), d.vec2f(c.scale[0], c.scale[1])) as d.v2f
            const [ex, ey] = sampleGolden(c.uv, c.scale)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
        // centre stays centred (no flip): 0.5 → 0.5.
        const center = media.sampleUV(d.vec2f(0.5, 0.5), d.vec2f(1, 1)) as d.v2f
        expect(center.y).toBeCloseTo(0.5, 6)
    })
})

describe('kit/media — alphaCutLinear (sRGB decode + letterbox cut) + tonemap.srgbToLinear', () => {
    // sRGB → linear reference (the exact inverse the shader relies on).
    const decode = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

    it('srgbToLinear matches the sRGB EOTF', () => {
        for (const c of [0, 0.04045, 0.2, 0.5, 1]) {
            const out = srgbToLinear(d.vec3f(c, c, c)) as d.v3f
            expect(out.x).toBeCloseTo(decode(c), 5)
        }
    })

    it('decodes rgb to linear and keeps alpha inside [0,1]²', () => {
        const inBounds = media.alphaCutLinear(d.vec4f(0.5, 0.5, 0.5, 0.8), d.vec2f(0.5, 0.5)) as d.v4f
        expect(inBounds.x).toBeCloseTo(decode(0.5), 5)
        expect(inBounds.w).toBeCloseTo(0.8, 6)
    })

    it('cuts alpha to 0 outside [0,1]² (letterbox)', () => {
        const above = media.alphaCutLinear(d.vec4f(0.5, 0.5, 0.5, 0.8), d.vec2f(1.2, 0.5)) as d.v4f
        expect(above.w).toBeCloseTo(0, 6)
        const below = media.alphaCutLinear(d.vec4f(0.5, 0.5, 0.5, 0.8), d.vec2f(0.5, -0.1)) as d.v4f
        expect(below.w).toBeCloseTo(0, 6)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// object-fit mode tables
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The two tables are what `mediaSurface` branches on. Their ONE difference — `none` — is the whole
// reason there are two, so it is asserted directly rather than left to the shader snapshots.
describe('kit/media object-fit tables', () => {
    it('agree on every mode except none', () => {
        for (const mode of ['cover', 'contain', 'fill', 'scale-down']) {
            expect(media.OBJECT_FIT_MODES[mode]).toBe(media.OBJECT_FIT_MODES_ALLOW_NONE[mode])
        }
    })

    it('none coalesces to fill (2) for Image/Video and is a real mode (4) for Webcam', () => {
        expect(media.OBJECT_FIT_MODES.none).toBe(2)
        expect(media.OBJECT_FIT_MODES.none).toBe(media.OBJECT_FIT_MODES.fill)
        expect(media.OBJECT_FIT_MODES_ALLOW_NONE.none).toBe(4)
    })

    it('the numbering matches the fit fn each mode selects', () => {
        expect(media.OBJECT_FIT_MODES).toMatchObject({cover: 0, contain: 1, fill: 2, 'scale-down': 3})
    })
})
