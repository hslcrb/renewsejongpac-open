import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {call, floatE, expr} from '@coreroot/gpu/composer'
import {isExpr, type Expr, type EmitContext, type GpuFragmentParams, type KitTexture, type KitCtx} from '@coreroot/gpu/contract'
import * as glass from '@coreroot/gpu/kit/effects/glass'
import * as neon from '@coreroot/gpu/kit/effects/neon'
import * as emboss from '@coreroot/gpu/kit/effects/emboss'

/**
 * kit/effects lighting gate (D2/D3 shape-effect helpers: Glass / Neon / Emboss). Three layers:
 *   1. RESOLVE GATE — every exported `'use gpu'` body fn transpiles to WGSL (snapshot).
 *   2. CPU GOLDEN — the pure extracted lighting/refraction/tint/glow/edge fns vs a hand-transcribed
 *      copy of the v1 formula at 2–3 input points.
 *   3. BUILDER RESOLVE-SNAPSHOT — each Expr-level builder is assembled against a minimal stub
 *      (literal uniforms, stub sdfSampler, stub child/blurred KitTextures), wrapped in a
 *      `tgpu.fragmentFn`, and genuinely `tgpu.resolve`d per compile-time variant (glass: blur/
 *      aberration/blurredTexture/volumetric+baked; emboss + neon: volumetric on/off).
 */

// ── shared JS transcriptions of the WGSL std fns (for the goldens) ──────────────────────────────
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (e0: number, e1: number, x: number) => {
    const t = clamp((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)
}
const DEG = Math.PI / 180

// ════════════════════════════════════════════════════════════════════════════════════════════
// (1) Resolve gate — every body fn transpiles to WGSL
// ════════════════════════════════════════════════════════════════════════════════════════════
describe('kit/effects (1) resolve gate', () => {
    it('all glass/neon/emboss body fns resolve to WGSL (snapshot)', () => {
        const wgsl = tgpu.resolve(
            [
                glass.sdfSpaceUV, glass.offsetUV, glass.glassGradient, glass.glassRefrStrength,
                glass.glassLensUVs, glass.glassBlurOffset, glass.glassTint, glass.glassBorderHighlight,
                glass.glassSpecular, glass.glassFresnelRim, glass.glassComposite,
                neon.neonSmoothEPS, neon.neonGlow, neon.neonFlicker, neon.neonFlow, neon.neonComposite,
                emboss.embossHeight, emboss.embossTraceUV, emboss.embossWarpUV, emboss.embossEdgeLighting, emboss.embossComposite,
            ],
            {names: 'strict'},
        )
        expect(typeof wgsl).toBe('string')
        expect(wgsl).toMatch(/fn/)
        expect(wgsl).toMatchSnapshot()
    })
})

// ════════════════════════════════════════════════════════════════════════════════════════════
// (2) CPU golden — pure lighting/refraction/tint/glow/edge math
// ════════════════════════════════════════════════════════════════════════════════════════════
describe('kit/effects (2a) shared sdfSpaceUV golden', () => {
    const golden = (cx: number, cy: number, scale: number, rot: number, ux: number, uy: number, aspect: number) => {
        const centerX = cx
        const centerY = 1 - cy
        const dxAc = (ux - centerX) * aspect
        const dy = uy - centerY
        const r = rot * DEG
        const rdx = dxAc * Math.cos(r) + dy * Math.sin(r)
        const rdy = dy * Math.cos(r) - dxAc * Math.sin(r)
        return [rdx / scale + 0.5, rdy / scale + 0.5]
    }
    const cases: [number, number, number, number, number, number, number][] = [
        [0.5, 0.5, 0.5, 0, 0.5, 0.5, 1.6],
        [0.4, 0.6, 0.3, 45, 0.7, 0.2, 1.0],
        [0.5, 0.5, 0.5, 90, 0.5, 0.5, 16 / 9],
    ]
    it('aspect-correct + rotate + scale into SDF space', () => {
        for (const [cx, cy, scale, rot, ux, uy, aspect] of cases) {
            const out = glass.sdfSpaceUV(d.vec2f(cx, cy), scale, rot, d.vec2f(ux, uy), aspect) as unknown as {x: number; y: number}
            const [ex, ey] = golden(cx, cy, scale, rot, ux, uy, aspect)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
        }
    })
})

describe('kit/effects (2b) glass refraction/tint/specular/fresnel golden', () => {
    it('glassRefrStrength — depth fade (2D) vs ramp-in (volumetric)', () => {
        const golden = (sdf: number, thickness: number, vol: number) => {
            const tr = Math.max(thickness * 0.3, 0.005)
            const dn = clamp(-sdf / tr, 0, 1)
            return vol > 0.5 ? smoothstep(0, 1, dn) : (1 - dn) * (1 - dn)
        }
        const cases: [number, number, number][] = [[-0.05, 0.5, 0], [-0.02, 0.3, 1], [0.1, 0.5, 0]]
        for (const [sdf, th, vol] of cases) {
            expect(glass.glassRefrStrength(sdf, th, vol) as unknown as number).toBeCloseTo(golden(sdf, th, vol), 5)
        }
    })

    it('glassTint — mix-based tint + optional luminosity preservation', () => {
        const w = [0.299, 0.587, 0.114]
        const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
        const golden = (rgb: number[], tint: number[], intensity: number, preserve: number) => {
            const origLum = dot3(rgb, w)
            const tinted = rgb.map((c, i) => mix(c, tint[i], intensity))
            const tintedLum = dot3(tinted, w)
            const scale = origLum / Math.max(tintedLum, 0.0001)
            const lumPreserved = tinted.map((c) => c * scale)
            const f = preserve > 0.5 ? 1 : 0
            return tinted.map((c, i) => mix(c, lumPreserved[i], f))
        }
        const cases: [number[], number[], number, number][] = [
            [[0.5, 0.4, 0.3], [0.8, 0.9, 1.0], 0.3, 0],
            [[0.6, 0.2, 0.1], [0.1, 0.5, 0.9], 0.5, 1],
        ]
        for (const [rgb, tint, intensity, preserve] of cases) {
            const out = glass.glassTint(d.vec3f(rgb[0], rgb[1], rgb[2]), d.vec3f(tint[0], tint[1], tint[2]), intensity, preserve) as unknown as {x: number; y: number; z: number}
            const [ex, ey, ez] = golden(rgb, tint, intensity, preserve)
            expect(out.x).toBeCloseTo(ex, 5)
            expect(out.y).toBeCloseTo(ey, 5)
            expect(out.z).toBeCloseTo(ez, 5)
        }
    })

    it('glassSpecular — Phong glint on the SDF normal', () => {
        const INV = 1 / Math.sqrt(5)
        const golden = (gx: number, gy: number, la: number, highlight: number, softness: number, refr: number) => {
            const lx = Math.cos(la * DEG)
            const ly = Math.sin(la * DEG)
            const nz = 2
            const nLen = Math.sqrt(gx * gx + gy * gy + nz * nz)
            const nDotH = (gx / nLen) * (lx * INV) + (gy / nLen) * (ly * INV) + (nz / nLen) * (2 * INV)
            const shininess = Math.pow(2, 8 - softness * 7)
            return Math.pow(clamp(nDotH, 0, 1), shininess) * highlight * refr
        }
        const cases: [number, number, number, number, number, number][] = [
            [0.8, 0.2, 45, 0.6, 0.5, 0.7],
            [-0.5, 0.9, 120, 1.0, 0.2, 1.0],
        ]
        for (const [gx, gy, la, h, s, r] of cases) {
            expect(glass.glassSpecular(gx, gy, la, h, s, r) as unknown as number).toBeCloseTo(golden(gx, gy, la, h, s, r), 5)
        }
    })

    it('glassFresnelRim — rim distance (2D) vs view-angle (volumetric)', () => {
        const golden = (sdf: number, gx: number, gy: number, fresnel: number, softness: number, rb1: number, vol: number) => {
            const slopeSq = gx * gx + gy * gy
            const cosView = 1 / Math.sqrt(slopeSq + 1)
            const exponent = mix(6, 1.5, clamp(softness, 0, 1))
            const volRim = Math.pow(1 - cosView, exponent) * fresnel * 2 * rb1
            const fw = Math.max(softness * 0.06, 0.001)
            const fd = clamp(-sdf / fw, 0, 1)
            const flatRim = (1 - fd) * (1 - fd) * fresnel * rb1
            return vol > 0.5 ? volRim : flatRim
        }
        const cases: [number, number, number, number, number, number, number][] = [
            [-0.01, 0.3, 0.4, 0.5, 0.5, 0.8, 0],
            [-0.03, 0.9, 0.5, 0.4, 0.3, 1.0, 1],
        ]
        for (const [sdf, gx, gy, f, s, rb1, vol] of cases) {
            expect(glass.glassFresnelRim(sdf, gx, gy, f, s, rb1, vol) as unknown as number).toBeCloseTo(golden(sdf, gx, gy, f, s, rb1, vol), 5)
        }
    })
})

describe('kit/effects (2c) neon glow / flicker / flow golden', () => {
    it('neonGlow — two-layer exp bloom, masked to the exterior', () => {
        const golden = (sdf: number, gr: number, gi: number) => {
            const glowR = Math.max(gr, 0.001)
            const so = Math.max(sdf, 0)
            const inner = Math.exp(-so * (12 / glowR)) * 0.7
            const outer = Math.exp(-so * (4 / glowR)) * 0.35
            return (inner + outer) * gi * smoothstep(-0.003, 0.003, sdf)
        }
        const cases: [number, number, number][] = [[0.05, 0.2, 1], [0.0, 0.1, 0.5], [-0.02, 0.3, 1]]
        for (const [sdf, gr, gi] of cases) {
            expect(neon.neonGlow(sdf, gr, gi) as unknown as number).toBeCloseTo(golden(sdf, gr, gi), 5)
        }
    })

    it('neonFlicker — sporadic on/off from three irrational sines', () => {
        const golden = (time: number, speed: number, amount: number) => {
            const ft = time * speed
            const c = Math.sin(ft * 17.13) + Math.sin(ft * 31.71) * 0.5 + Math.sin(ft * 47.29) * 0.3
            const th = mix(-2, 0.8, amount)
            return smoothstep(th - 0.1, th + 0.1, c)
        }
        const cases: [number, number, number][] = [[1.2, 1, 0.3], [3.7, 2, 0.7], [0.5, 1.5, 0.1]]
        for (const [t, s, a] of cases) {
            expect(neon.neonFlicker(t, s, a) as unknown as number).toBeCloseTo(golden(t, s, a), 5)
        }
    })

    it('neonFlow — rotating sweep band', () => {
        const golden = (x: number, y: number, time: number, speed: number, amount: number) => {
            const angle = Math.atan2(y - 0.5, x - 0.5)
            const wave = Math.sin(angle * 2 + time * speed) * 0.5 + 0.5
            return mix(1, wave, amount)
        }
        const cases: [number, number, number, number, number][] = [[0.7, 0.6, 1.0, 1.0, 0.5], [0.2, 0.9, 2.0, 0.5, 1.0]]
        for (const [x, y, t, s, a] of cases) {
            expect(neon.neonFlow(d.vec2f(x, y), t, s, a) as unknown as number).toBeCloseTo(golden(x, y, t, s, a), 5)
        }
    })
})

describe('kit/effects (2d) emboss height + edge lighting golden', () => {
    const embossHeightG = (s: number, depth: number, tw: number, vol: number) =>
        vol > 0.5 ? depth * clamp(-s / 0.18, 0, 1) : depth * smoothstep(tw, -tw, s)

    it('embossHeight — plateau (2D) vs continuous thickness (volumetric)', () => {
        const cases: [number, number, number, number][] = [
            [0.0, 5, 0.003, 0], [-0.001, 5, 0.003, 0], [-0.09, 5, 0.003, 1], [-0.3, 5, 0.003, 1],
        ]
        for (const [s, depth, tw, vol] of cases) {
            expect(emboss.embossHeight(s, depth, tw, vol) as unknown as number).toBeCloseTo(embossHeightG(s, depth, tw, vol), 5)
        }
    })

    it('embossEdgeLighting — normal-from-height + directional edge lighting', () => {
        const INV = 1 / Math.sqrt(1 + 0.7 * 0.7)
        const LZN = 0.7 * INV
        const golden = (sR: number, sL: number, sU: number, sD: number, depth: number, la: number, li: number, vol: number) => {
            const eps = 0.003
            const tw = 0.003
            const hR = embossHeightG(sR, depth, tw, vol)
            const hL = embossHeightG(sL, depth, tw, vol)
            const hU = embossHeightG(sU, depth, tw, vol)
            const hD = embossHeightG(sD, depth, tw, vol)
            const dhx = (hR - hL) / (eps * 2)
            const dhy = (hU - hD) / (eps * 2)
            const nLen = Math.sqrt(dhx * dhx + dhy * dhy + 1)
            const nx = -dhx / nLen
            const ny = -dhy / nLen
            const nz = 1 / nLen
            const lx = Math.cos(la * DEG)
            const ly = Math.sin(la * DEG)
            const NdotL = nx * (lx * INV) + ny * (ly * INV) + nz * LZN
            const el = (NdotL - LZN) * li
            return [Math.max(el, 0), Math.max(-el, 0)]
        }
        // A left/right height step (raised plateau edge) at depth 5, light from 45°.
        const cases: [number, number, number, number, number, number, number, number][] = [
            [-0.002, 0.002, 0.0, 0.0, 5, 45, 1.0, 0],
            [-0.05, -0.02, -0.04, -0.03, 5, 135, 0.8, 1],
        ]
        for (const c of cases) {
            const out = emboss.embossEdgeLighting(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7]) as unknown as {x: number; y: number}
            const [eh, es] = golden(...c)
            expect(out.x).toBeCloseTo(eh, 5)
            expect(out.y).toBeCloseTo(es, 5)
        }
    })
})

// ════════════════════════════════════════════════════════════════════════════════════════════
// (3) Builder resolve-snapshot — genuine tgpu.resolve of each builder variant
// ════════════════════════════════════════════════════════════════════════════════════════════

// Minimal EmitContext mirroring composer.serialiseFragment's externals dedupe (readable names).
function makeCtx() {
    const externals: Record<string, unknown> = {}
    const byIdentity = new Map<unknown, string>()
    const used = new Set<string>()
    const statements: string[] = ['var uv = in.uv;']
    const ctx: EmitContext = {
        external(value, hint) {
            const e = byIdentity.get(value)
            if (e) return e
            let name = hint.replace(/[^a-zA-Z0-9_]/g, '_')
            if (used.has(name)) {
                let i = 1
                while (used.has(`${name}_${i}`)) i++
                name = `${name}_${i}`
            }
            used.add(name)
            byIdentity.set(value, name)
            externals[name] = value
            return name
        },
        statement: (wgsl) => statements.push(wgsl),
        freshLocal: (hint) => `${hint.replace(/[^a-zA-Z0-9_]/g, '_')}_${used.size}`,
        memo: (_key, factory) => factory(),
    }
    return {ctx, externals, statements}
}

function resolveBuilder(result: Expr): string {
    expect(isExpr(result)).toBe(true)
    const {ctx, externals, statements} = makeCtx()
    const emitted = result._emit(ctx)
    const body = `{\n  ${statements.join('\n  ')}\n  return ${emitted};\n}`
    const entry = tgpu.fragmentFn({in: {uv: d.vec2f}, out: d.vec4f})(body).$uses(externals)
    return tgpu.resolve([entry as never], {names: 'strict'})
}

// Stub field-samplers + textures: emit self-contained body-fn calls (no `tex.$.`/`uni.$.`), so the
// assembled builder graph resolves standalone.
const stubSdfBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x - 0.5, 0.1, 0.2, 1.0)
})
const stubSampler = (uv: Expr): Expr => call(stubSdfBody, 'stubSdf', [uv])

function makeStubTexture(hint: string): KitTexture {
    const body = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
        'use gpu'
        return d.vec4f(uv.x, uv.y, 0.5, 1.0)
    })
    return {
        key: hint,
        sample: (uv: Expr) => call(body, hint, [uv]),
        accessor: () => expr(hint),
        dimensions: () => expr('vec2f(1.0, 1.0)'),
    }
}

const stubCtx: KitCtx = {
    uv: expr('uv'),
    time: floatE(1.5),
    viewportSize: expr('vec2f(800.0, 600.0)'),
    logicalViewportSize: expr('vec2f(800.0, 600.0)'),
    aspect: floatE(1.3333333),
    pointer: expr('vec2f(0.5, 0.5)'),
}

function makeParams(uniforms: Record<string, Expr>, propValues: Record<string, unknown> = {}): GpuFragmentParams {
    return {uniforms, propValues, ctx: stubCtx, onBeforeRender: () => {}} as unknown as GpuFragmentParams
}

const V2 = (a: number, b: number) => expr(`vec2f(${a.toFixed(3)}, ${b.toFixed(3)})`)
const V3 = (a: number, b: number, c: number) => expr(`vec3f(${a.toFixed(3)}, ${b.toFixed(3)}, ${c.toFixed(3)})`)
// w6c: color uniforms are vec4 rgba (transformColor) — the builder swizzles `.rgb` for the vec3-taking
// composite. Stub colors as vec4 so the resolve gate exercises the real swizzle (was vec3, masking it).
const V4 = (a: number, b: number, c: number, d: number) => expr(`vec4f(${a.toFixed(3)}, ${b.toFixed(3)}, ${c.toFixed(3)}, ${d.toFixed(3)})`)

const glassUniforms: Record<string, Expr> = {
    center: V2(0.5, 0.5), scale: floatE(0.5), rotation: floatE(30), edgeSoftness: floatE(0.2),
    refraction: floatE(0.5), innerZoom: floatE(1.1), aberration: floatE(0.3), blur: floatE(0.4),
    tintColor: V4(0.8, 0.9, 1.0, 1.0), tintIntensity: floatE(0.3), tintPreserveLuminosity: floatE(1),
    lightAngle: floatE(45), highlight: floatE(0.6), highlightColor: V4(1, 1, 1, 1), highlightSoftness: floatE(0.5),
    fresnel: floatE(0.4), fresnelColor: V4(0.6, 0.8, 1.0, 1.0), fresnelSoftness: floatE(0.5),
    cutout: floatE(0), thickness: floatE(0.5),
}

describe('kit/effects (3a) glass builder resolve-snapshot', () => {
    const child = makeStubTexture('childTex')
    const blurred = makeStubTexture('blurTex')

    it('blur+aberration Vogel fallback (no blurred buffer)', () => {
        const params = makeParams(glassUniforms, {blur: 0.4, aberration: 0.3})
        const wgsl = resolveBuilder(glass.applyGlassEffect(params, stubSampler, child))
        expect(wgsl).toMatch(/glassComposite/)
        expect(wgsl).toMatch(/glassLensUVs/)
        expect(wgsl).toMatch(/glassBlurOffset/)
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot()
    })

    it('fast path — blur off, aberration off (1 tap)', () => {
        const params = makeParams(glassUniforms, {blur: 0, aberration: 0})
        const wgsl = resolveBuilder(glass.applyGlassEffect(params, stubSampler, child))
        expect(wgsl).not.toMatch(/glassBlurOffset/)
        expect(wgsl).toMatch(/glassComposite/)
        expect(wgsl).toMatchSnapshot()
    })

    it('pre-blurred compute buffer + aberration (3 taps)', () => {
        const params = makeParams(glassUniforms, {blur: 0.4, aberration: 0.3})
        const wgsl = resolveBuilder(glass.applyGlassEffect(params, stubSampler, child, blurred))
        expect(wgsl).toMatch(/blurTex/)
        expect(wgsl).not.toMatch(/glassBlurOffset/)
        expect(wgsl).toMatchSnapshot()
    })

    it('volumetric + baked gradients (skips the finite-difference taps)', () => {
        const params = makeParams(glassUniforms, {blur: 0, aberration: 0})
        const wgsl = resolveBuilder(glass.applyGlassEffect(params, stubSampler, child, undefined, {volumetric: true, bakedGradients: true}))
        expect(wgsl).not.toMatch(/glassGradient/)
        expect(wgsl).toMatch(/glassComposite/)
        expect(wgsl).toMatchSnapshot()
    })
})

describe('kit/effects (3b) neon builder resolve-snapshot', () => {
    const neonUniforms: Record<string, Expr> = {
        center: V2(0.5, 0.5), scale: floatE(0.5), rotation: floatE(0), color: V3(0.9, 0.2, 0.6),
        secondaryColor: V3(0.2, 0.6, 0.9), secondaryBlend: floatE(0.5), glowColor: V3(1, 0.3, 0.7),
        tubeThickness: floatE(0.05), intensity: floatE(1), hotCoreIntensity: floatE(0.5),
        glowIntensity: floatE(1), glowRadius: floatE(0.2), lightAngle: floatE(45), specularIntensity: floatE(0.5),
        specularSize: floatE(0.5), cornerSmoothing: floatE(0.3), flickerSpeed: floatE(1), flickerAmount: floatE(0.2),
        flowSpeed: floatE(1), flowAmount: floatE(0.3),
    }

    it('2D silhouette tube', () => {
        const wgsl = resolveBuilder(neon.applyNeonEffect(makeParams(neonUniforms), stubSampler, stubCtx.time))
        expect(wgsl).toMatch(/neonComposite/)
        expect(wgsl).toMatch(/neonSmoothEPS/)
        expect(wgsl).toMatchSnapshot()
    })

    it('volumetric (view-depth crease tubes)', () => {
        const wgsl = resolveBuilder(neon.applyNeonEffect(makeParams(neonUniforms), stubSampler, stubCtx.time, {volumetric: true}))
        expect(wgsl).toMatch(/neonComposite/)
        expect(wgsl).toMatchSnapshot()
    })
})

describe('kit/effects (3c) emboss builder resolve-snapshot', () => {
    const embossUniforms: Record<string, Expr> = {
        center: V2(0.5, 0.5), scale: floatE(0.5), rotation: floatE(0), depth: floatE(5),
        lightAngle: floatE(45), lightIntensity: floatE(1), shadowIntensity: floatE(1),
    }
    const child = makeStubTexture('childTex')

    it('2D plateau relief', () => {
        const wgsl = resolveBuilder(emboss.applyEmbossEffect(makeParams(embossUniforms), stubSampler, child))
        expect(wgsl).toMatch(/embossComposite/)
        expect(wgsl).toMatch(/embossTraceUV/)
        expect(wgsl).toMatch(/embossWarpUV/)
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        expect(wgsl).toMatchSnapshot()
    })

    it('volumetric height field', () => {
        const wgsl = resolveBuilder(emboss.applyEmbossEffect(makeParams(embossUniforms), stubSampler, child, {volumetric: true}))
        expect(wgsl).toMatch(/embossComposite/)
        expect(wgsl).toMatchSnapshot()
    })
})
