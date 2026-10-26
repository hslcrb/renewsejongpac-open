import {describe, it, expect} from 'vitest'
import {tgpu, d, std} from '@coreroot/gpu/kit'
import {call, floatE, expr} from '@coreroot/gpu/composer'
import {isExpr, type Expr, type EmitContext, type GpuFragmentParams, type KitTexture, type KitCtx} from '@coreroot/gpu/contract'
import * as thinFilm from '@coreroot/gpu/kit/effects/thinFilm'
import * as raymarch3d from '@coreroot/gpu/kit/effects/raymarch3d'

/**
 * kit/effects 3D gate (thinFilm / raymarch3d). Three layers, mirroring
 * kit-effects-lighting.test.ts (the D2/D3 sibling):
 *   1. RESOLVE GATE — every exported `'use gpu'` body fn (+ two built param-threaded 3D marches, so
 *      a collision between two differently-shaped traces in one module would show) transpiles to
 *      WGSL (snapshot).
 *   2. CPU GOLDEN — the pure extracted thin-film / lighting math vs a hand-transcribed copy of the
 *      v1 formula at 2–3 input points.
 *   3. BUILDER RESOLVE-SNAPSHOT — each Expr-level builder is assembled against a minimal stub and
 *      genuinely `tgpu.resolve`d per compile-time variant (thinFilm: rainbow ±volumetric + custom).
 *      raymarch3d has no Expr-level builder — its only consumer, Form3D, assembles the trace + UV
 *      mode + lighting itself and is gated by shader-Form3D.test.ts.
 */

// ── shared JS transcriptions of the WGSL std fns (for the goldens) ──────────────────────────────
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const fract = (x: number) => x - Math.floor(x)
const smoothstep = (e0: number, e1: number, x: number) => {
    const t = clamp((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)
}
const DEG = Math.PI / 180
const TWO_PI = Math.PI * 2
const norm3 = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l] }
const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

// ════════════════════════════════════════════════════════════════════════════════════════════
// (1) Resolve gate — every body fn transpiles to WGSL
// ════════════════════════════════════════════════════════════════════════════════════════════
describe('kit/effects-3d (1) resolve gate', () => {
    it('all thinFilm/raymarch3d body fns resolve to WGSL (snapshot)', () => {
        // Two built param-threaded marches, each closing over its own stub SDF (the march is not a
        // top-level export). Distinct $names on the SDFs are what keep the two traces from colliding.
        const sphereSdf = tgpu.fn([d.vec3f, d.vec4f, d.vec4f, d.vec4f, d.f32], d.f32)((p, _rp0, _rp1, _rp2, _t) => {
            'use gpu'
            return std.length(p) - 0.35
        }).$name('stubSphereSdf')
        const boxSdf = tgpu.fn([d.vec3f, d.vec4f, d.vec4f, d.vec4f, d.f32], d.f32)((p, _rp0, _rp1, _rp2, _t) => {
            'use gpu'
            const q = std.abs(p).sub(d.vec3f(0.3))
            return std.length(std.max(q, d.vec3f(0.0)))
        }).$name('stubBoxSdf')
        const sphereTrace = raymarch3d.buildParamThreadedTrace(sphereSdf as never, {steps: 32, stepCap: 0.15, hitEps: 0.001})
        const boxTrace = raymarch3d.buildParamThreadedTrace(boxSdf as never, {steps: 48, stepCap: 0.5, hitEps: 0.001, maxDistance: 20})
        const wgsl = tgpu.resolve(
            [
                thinFilm.thinFilmShade, thinFilm.thinFilmRainbow, thinFilm.thinFilmCustomParams, thinFilm.thinFilmCompose,
                raymarch3d.applyUVMode3d, raymarch3d.distortion3dLighting, sphereTrace, boxTrace,
            ],
            {names: 'strict'},
        )
        expect(typeof wgsl).toBe('string')
        expect(wgsl).toMatch(/fn/)
        expect(wgsl).toMatchSnapshot()
    })
})

// ════════════════════════════════════════════════════════════════════════════════════════════
// (2) CPU golden — pure thin-film / lighting / spectral math
// ════════════════════════════════════════════════════════════════════════════════════════════
describe('kit/effects-3d (2a) thinFilm golden', () => {
    const shadeG = (sdfRaw: number, scale: number, gx: number, gy: number, es: number, rw: number, th: number, disp: number, hs: number, la: number, at: number, vol: number) => {
        const sdf = sdfRaw / scale
        const sharp = Math.max(es * 0.5, 0.001)
        const gLen = Math.max(Math.sqrt(gx * gx + gy * gy), 0.0001)
        const nx = gx / gLen, ny = gy / gLen
        const rb1 = clamp(-sdf / sharp * 32, 0, 1)
        const rimWidth = Math.max(rw * 0.1, 0.001)
        const depth = clamp(-sdf / rimWidth, 0, 1)
        const cosView = 1 / Math.sqrt(gLen * gLen + 1)
        const exponent = mix(7, 1.5, clamp(rw, 0, 1))
        const rim = vol > 0.5 ? Math.pow(1 - cosView, exponent) * rb1 : (1 - depth) * (1 - depth) * rb1
        const lx = Math.cos(la * DEG), ly = Math.sin(la * DEG)
        const baseCos = nx * lx + ny * ly, baseSin = ny * lx - nx * ly
        const theta = at * TWO_PI
        const rotatedDot = baseCos * Math.cos(theta) + baseSin * Math.sin(theta)
        const thicknessTerm = vol > 0.5 ? th * Math.max(-sdf, 0) * 10 : th * depth * 2
        const phase = hs + disp * rotatedDot + thicknessTerm
        return [phase, rim]
    }
    it('thinFilmShade — rim + interference phase (2D vs volumetric)', () => {
        const cases: number[][] = [
            [-0.02, 0.5, 0.3, 0.4, 0.2, 0.5, 0.5, 1.0, 0.1, 45, 0.25, 0],
            [-0.03, 0.4, 0.8, 0.2, 0.3, 0.6, 0.7, 2.0, 0.5, 120, 0.5, 1],
            [0.1, 0.5, 0.2, 0.1, 0.2, 0.4, 0.3, 1.0, 0.0, 0, 0, 0],
        ]
        for (const c of cases) {
            const out = thinFilm.thinFilmShade(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11]) as unknown as {x: number; y: number}
            const [ep, er] = shadeG(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11])
            expect(out.x).toBeCloseTo(ep, 5)
            expect(out.y).toBeCloseTo(er, 5)
        }
    })

    it('thinFilmRainbow — IQ cosine palette', () => {
        const golden = (phase: number) => [
            Math.cos((phase + 0.0) * TWO_PI) * 0.5 + 0.5,
            Math.cos((phase + 0.3333) * TWO_PI) * 0.5 + 0.5,
            Math.cos((phase + 0.6667) * TWO_PI) * 0.5 + 0.5,
        ]
        for (const phase of [0.0, 0.25, 0.83]) {
            const out = thinFilm.thinFilmRainbow(phase) as unknown as {x: number; y: number; z: number}
            const [r, g, b] = golden(phase)
            expect(out.x).toBeCloseTo(r, 5)
            expect(out.y).toBeCloseTo(g, 5)
            expect(out.z).toBeCloseTo(b, 5)
        }
    })

    it('thinFilmCustomParams — segment blend + step gates', () => {
        const golden = (phase: number) => {
            const t3 = fract(phase) * 3
            return [fract(t3), Math.floor(t3) <= 1.5 ? 1 : 0, Math.floor(t3) <= 0.5 ? 1 : 0]
        }
        for (const phase of [0.1, 0.5, 0.9]) {
            const out = thinFilm.thinFilmCustomParams(phase) as unknown as {x: number; y: number; z: number}
            const [si, g12, g01] = golden(phase)
            expect(out.x).toBeCloseTo(si, 5)
            expect(out.y).toBeCloseTo(g12, 5)
            expect(out.z).toBeCloseTo(g01, 5)
        }
    })

    it('thinFilmCompose — saturation blend + rim/intensity + alpha', () => {
        const golden = (base: number[], rim: number, intensity: number, sat: number) => {
            const col = base.map((c) => mix(1, c, sat))
            return [col[0] * rim * intensity, col[1] * rim * intensity, col[2] * rim * intensity, clamp(rim, 0, 1)]
        }
        const cases: [number[], number, number, number][] = [
            [[1, 0.2, 0.6], 0.5, 1.2, 0.8],
            [[0.3, 0.9, 0.4], 0.3, 2.0, 0.5],
        ]
        for (const [base, rim, intensity, sat] of cases) {
            const out = thinFilm.thinFilmCompose(d.vec3f(base[0], base[1], base[2]), rim, intensity, sat) as unknown as {x: number; y: number; z: number; w: number}
            const [r, g, b, a] = golden(base, rim, intensity, sat)
            expect(out.x).toBeCloseTo(r, 5)
            expect(out.y).toBeCloseTo(g, 5)
            expect(out.z).toBeCloseTo(b, 5)
            expect(out.w).toBeCloseTo(a, 5)
        }
    })
})

describe('kit/effects-3d (2b) raymarch3d lighting golden', () => {
    const golden = (color: number[], normal: number[], rd: number[], hit: number, vis: number, gloss: number, light: number) => {
        const lightDir = norm3([0.4, 0.7, -0.6])
        const viewDir = [-rd[0], -rd[1], -rd[2]]
        const diffuse = clamp(dot3(normal, lightDir), 0, 1)
        const halfVec = norm3([lightDir[0] + viewDir[0], lightDir[1] + viewDir[1], lightDir[2] + viewDir[2]])
        const specPow = gloss * 256 + 4
        const specular = Math.pow(clamp(dot3(normal, halfVec), 0, 1), specPow) * gloss * 1.5
        const nDotV = clamp(dot3(normal, viewDir), 0, 1)
        const fresnel = Math.pow(1 - nDotV, 3) * 0.5 * gloss
        const lit = mix(1, 0.35 + diffuse * 0.65 + specular + fresnel, light)
        const litC = clamp(lit, 0, 3)
        const col = [color[0] * litC, color[1] * litC, color[2] * litC].map((c) => clamp(c, 0, 1))
        return [col[0], col[1], col[2], hit * color[3] * vis]
    }
    it('distortion3dLighting — Blinn-Phong + Fresnel', () => {
        const n1 = norm3([0.2, 0.3, 0.9]), rd1 = norm3([0.1, -0.1, 1])
        const n2 = norm3([-0.5, 0.6, 0.6]), rd2 = norm3([-0.2, 0.05, 1])
        const cases: [number[], number[], number[], number, number, number, number][] = [
            [[0.8, 0.5, 0.3, 1], n1, rd1, 1, 1, 0.25, 0.25],
            [[0.4, 0.7, 0.9, 0.6], n2, rd2, 1, 1, 0.5, 0.3],
        ]
        for (const [color, normal, rd, hit, vis, gloss, light] of cases) {
            const out = raymarch3d.distortion3dLighting(
                d.vec4f(color[0], color[1], color[2], color[3]),
                d.vec3f(normal[0], normal[1], normal[2]),
                d.vec3f(rd[0], rd[1], rd[2]),
                hit, vis, gloss, light,
            ) as unknown as {x: number; y: number; z: number; w: number}
            const [r, g, b, a] = golden(color, normal, rd, hit, vis, gloss, light)
            expect(out.x).toBeCloseTo(r, 4)
            expect(out.y).toBeCloseTo(g, 4)
            expect(out.z).toBeCloseTo(b, 4)
            expect(out.w).toBeCloseTo(a, 5)
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

// Stub field-sampler + textures: emit self-contained body-fn calls, so the assembled builder graph
// resolves standalone.
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

const V2 = (a: number, b: number) => expr(`vec2f(${a.toFixed(3)}, ${b.toFixed(3)})`)
const V3 = (a: number, b: number, c: number) => expr(`vec3f(${a.toFixed(3)}, ${b.toFixed(3)}, ${c.toFixed(3)})`)
const V4 = (a: number, b: number, c: number, e: number) => expr(`vec4f(${a.toFixed(3)}, ${b.toFixed(3)}, ${c.toFixed(3)}, ${e.toFixed(3)})`)

// A resolvable stub for `params.props` — a struct with the synthetic `_animTime` field, so
// `params.props.member('_animTime')` emits `(tfProps())._animTime` (valid WGSL).
const TFProps = d.struct({_animTime: d.f32})
const tfPropsBody = tgpu.fn([], TFProps)(() => {
    'use gpu'
    return TFProps({_animTime: 0.25})
})
const stubProps = call(tfPropsBody, 'tfProps', [])

function makeParams(uniforms: Record<string, Expr>, propValues: Record<string, unknown> = {}, extra: Partial<GpuFragmentParams> = {}): GpuFragmentParams {
    return {uniforms, propValues, ctx: stubCtx, props: stubProps, onBeforeRender: () => {}, setExtraField: () => {}, ...extra} as unknown as GpuFragmentParams
}

describe('kit/effects-3d (3a) thinFilm builder resolve-snapshot', () => {
    const thinFilmUniforms: Record<string, Expr> = {
        center: V2(0.5, 0.5), scale: floatE(0.5), rotation: floatE(30), intensity: floatE(1),
        rimWidth: floatE(0.4), edgeSoftness: floatE(0.2), thickness: floatE(0.5), dispersion: floatE(1),
        saturation: floatE(0.8), hueShift: floatE(0.1), lightAngle: floatE(45), speed: floatE(1),
        colorA: V4(1, 0, 0, 1), colorB: V4(0, 1, 0, 1), colorC: V4(0, 0, 1, 1),
    }

    it('rainbow mode, 2D rim', () => {
        const wgsl = resolveBuilder(thinFilm.applyThinFilmEffect(makeParams(thinFilmUniforms, {mode: 'rainbow'}), stubSampler))
        expect(wgsl).toMatch(/thinFilmShade/)
        expect(wgsl).toMatch(/thinFilmRainbow/)
        expect(wgsl).toMatch(/thinFilmCompose/)
        expect(wgsl).toMatch(/glassGradient/)
        expect(wgsl).toMatchSnapshot()
    })

    it('rainbow mode, volumetric', () => {
        const wgsl = resolveBuilder(thinFilm.applyThinFilmEffect(makeParams(thinFilmUniforms, {mode: 'rainbow'}), stubSampler, {volumetric: true}))
        expect(wgsl).toMatch(/thinFilmShade/)
        expect(wgsl).toMatchSnapshot()
    })

    it('custom mode (linear color space, 3-color cycle)', () => {
        const wgsl = resolveBuilder(thinFilm.applyThinFilmEffect(makeParams(thinFilmUniforms, {mode: 'custom', colorSpace: 0}), stubSampler))
        expect(wgsl).toMatch(/thinFilmCustomParams/)
        expect(wgsl).not.toMatch(/thinFilmRainbow/)
        expect(wgsl).toMatch(/thinFilmCompose/)
        expect(wgsl).toMatchSnapshot()
    })
})

