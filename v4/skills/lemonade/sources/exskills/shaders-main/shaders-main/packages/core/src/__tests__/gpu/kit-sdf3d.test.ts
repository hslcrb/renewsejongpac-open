import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import * as sdf3d from '@coreroot/gpu/kit/sdf3d'

/**
 * kit/sdf3d golden + resolve gates. The 3D SDF primitives are DualFns (run as plain JS on CPU
 * under vitest), so each is checked against a hand-transcription of the ORIGINAL v1 formula
 * (negative inside / 0 on boundary / positive outside). Then a resolve gate confirms the
 * orthographic march (over a baked sphere/box SDF, for patternMode 'none'/'raw'/'triplanar'), the
 * compute pre-march kernel, and the field samplers all transpile to WGSL (snapshot).
 *
 * The device-side allocator (createVolumetricFieldCompute) needs a GPU, so — like kit/blur's
 * createGaussianBlurCompute — it is tsc-checked only, not exercised here.
 */

// Helpers to call the exported tgpu.fns as plain JS DualFns.
const v3 = (x: number, y: number, z: number) => d.vec3f(x, y, z)
const sphere = (p: [number, number, number], r: number) => sdf3d.sdSphere(v3(...p), r) as unknown as number
const roundBox = (p: [number, number, number], hx: number, hy: number, hz: number, rounding: number) =>
    sdf3d.sdRoundBox(v3(...p), hx, hy, hz, rounding) as unknown as number
const torus = (p: [number, number, number], ringR: number, tubeR: number) =>
    sdf3d.sdTorus(v3(...p), ringR, tubeR) as unknown as number
const octahedron = (p: [number, number, number], s: number) => sdf3d.sdOctahedron(v3(...p), s) as unknown as number
const capsule = (p: [number, number, number], r: number, h: number) => sdf3d.sdCapsule(v3(...p), r, h) as unknown as number

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) sphere — |p| - r
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf3d (a) sdSphere golden', () => {
    const golden = (p: [number, number, number], r: number) => Math.hypot(p[0], p[1], p[2]) - r
    it('inside / boundary / outside', () => {
        expect(sphere([0, 0, 0], 1)).toBeCloseTo(-1, 5) // center → -r (inside)
        expect(sphere([1, 0, 0], 1)).toBeCloseTo(0, 5) // on boundary
        expect(sphere([0, 3, 4], 1)).toBeCloseTo(golden([0, 3, 4], 1), 5) // len 5 → 4 (outside)
        expect(sphere([0, 3, 4], 1)).toBeCloseTo(4, 5)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) rounded box
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf3d (b) sdRoundBox golden', () => {
    // Transcribed verbatim from v1 sdRoundBox.
    const golden = (p: [number, number, number], hx: number, hy: number, hz: number, r: number) => {
        const qx = Math.abs(p[0]) - hx + r
        const qy = Math.abs(p[1]) - hy + r
        const qz = Math.abs(p[2]) - hz + r
        const outer = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0))
        const inner = Math.min(Math.max(qx, Math.max(qy, qz)), 0)
        return outer + inner - r
    }
    const cases: [[number, number, number], number, number, number, number][] = [
        [[0, 0, 0], 0.5, 0.5, 0.5, 0], // center (inside)
        [[0.5, 0, 0], 0.5, 0.5, 0.5, 0], // on the +x face (boundary)
        [[1, 0, 0], 0.5, 0.5, 0.5, 0], // outside along x
        [[0.6, 0.6, 0.6], 0.4, 0.4, 0.4, 0.1], // rounded, outside corner
        [[0, 0, 0], 0.5, 0.5, 0.5, 0.1], // rounded, inside
    ]
    it('reproduces the original box distance', () => {
        for (const [p, hx, hy, hz, r] of cases) {
            expect(roundBox(p, hx, hy, hz, r)).toBeCloseTo(golden(p, hx, hy, hz, r), 5)
        }
        expect(roundBox([0, 0, 0], 0.5, 0.5, 0.5, 0)).toBeLessThan(0) // negative inside
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (c) torus
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf3d (c) sdTorus golden', () => {
    const golden = (p: [number, number, number], R: number, t: number) => {
        const qx = Math.hypot(p[0], p[2]) - R
        return Math.hypot(qx, p[1]) - t
    }
    it('on the ring centerline / on tube boundary / in the hole', () => {
        expect(torus([0.3, 0, 0], 0.3, 0.1)).toBeCloseTo(-0.1, 5) // on the ring centerline (inside)
        expect(torus([0.4, 0, 0], 0.3, 0.1)).toBeCloseTo(0, 5) // on the tube boundary
        expect(torus([0, 0, 0], 0.3, 0.1)).toBeCloseTo(golden([0, 0, 0], 0.3, 0.1), 5) // in the hole (outside)
        expect(torus([0, 0, 0], 0.3, 0.1)).toBeCloseTo(0.2, 5)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (d) octahedron — scaled L1 distance
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf3d (d) sdOctahedron golden', () => {
    const golden = (p: [number, number, number], s: number) =>
        (Math.abs(p[0]) + Math.abs(p[1]) + Math.abs(p[2]) - s) * 0.57735027
    it('center inside / on the L1 boundary / outside', () => {
        expect(octahedron([0, 0, 0], 1)).toBeCloseTo(-0.57735027, 5) // center (inside)
        expect(octahedron([1, 0, 0], 1)).toBeCloseTo(0, 5) // on the L1 shell
        expect(octahedron([1, 1, 1], 1)).toBeCloseTo(golden([1, 1, 1], 1), 5) // outside
        expect(octahedron([0, 0, 0], 1)).toBeLessThan(0) // negative inside
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (e) capsule
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf3d (e) sdCapsule golden', () => {
    const golden = (p: [number, number, number], r: number, h: number) => {
        const cy = Math.max(-h, Math.min(h, p[1]))
        return Math.hypot(p[0], p[1] - cy, p[2]) - r
    }
    it('axis inside / on the side / at the cap top / outside', () => {
        expect(capsule([0, 0, 0], 0.2, 0.3)).toBeCloseTo(-0.2, 5) // on the axis (inside)
        expect(capsule([0.2, 0, 0], 0.2, 0.3)).toBeCloseTo(0, 5) // on the cylindrical side
        expect(capsule([0, 0.3, 0], 0.2, 0.3)).toBeCloseTo(-0.2, 5) // at the axis top (inside the hemisphere cap)
        expect(capsule([0.4, 0, 0], 0.2, 0.3)).toBeCloseTo(golden([0.4, 0, 0], 0.2, 0.3), 5) // outside
        expect(capsule([0.4, 0, 0], 0.2, 0.3)).toBeCloseTo(0.2, 5)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (f) Resolve gate — the march (all pattern modes), the compute kernel, and the samplers → WGSL
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('kit/sdf3d (f) resolve gate', () => {
    it('march + compute kernel + samplers resolve to WGSL (snapshot)', () => {
        // A shape SDF baked against the march-params uniform (as the parent bakes it).
        const {layout} = sdf3d.makeVolumetricFieldLayout()
        const sphereBaked = tgpu.fn([d.vec3f], d.f32)((p) => {
            'use gpu'
            return sdf3d.sdSphere(p, layout.$.params.pA)
        })
        const boxBaked = tgpu.fn([d.vec3f], d.f32)((p) => {
            'use gpu'
            return sdf3d.sdRoundBox(p, layout.$.params.pA, layout.$.params.pB, layout.$.params.pC, layout.$.params.pD)
        })

        // Standalone marches (fixed-radius sphere / box) for each pattern mode.
        const sphereConst = tgpu.fn([d.vec3f], d.f32)((p) => {
            'use gpu'
            return sdf3d.sdSphere(p, 0.35)
        })
        const marchNone = sdf3d.buildRaymarchedFieldFn(sphereConst, 'none')
        const marchRaw = sdf3d.buildRaymarchedFieldFn(sphereConst, 'raw')
        const marchTri = sdf3d.buildRaymarchedFieldFn(boxBaked, 'triplanar')
        // chordMode 'firstLobe' (Glass): forward interior exit march instead of the backward trace.
        const marchFirstLobe = sdf3d.buildRaymarchedFieldFn(sphereConst, 'none', 'firstLobe')

        // Compute kernel over the params-baked sphere march.
        const marchForKernel = sdf3d.buildRaymarchedFieldFn(sphereBaked, 'raw')
        const kernel = sdf3d.buildVolumetricFieldKernel(layout, marchForKernel)

        const {fieldSample, fieldSampleFast} = sdf3d.buildFieldSampleGraph()

        const wgsl = tgpu.resolve(
            [marchNone, marchRaw, marchTri, marchFirstLobe, kernel, fieldSample, fieldSampleFast],
            {names: 'strict'},
        )
        expect(typeof wgsl).toBe('string')
        expect(wgsl).toMatch(/fn/)
        expect(wgsl).toMatchSnapshot()
    })

    it('all 18 SDF primitives resolve to WGSL (snapshot)', () => {
        const wgsl = tgpu.resolve(
            [
                sdf3d.sdSphere, sdf3d.sdRoundBox, sdf3d.sdTorus, sdf3d.sdOctahedron, sdf3d.sdRoundCylinder,
                sdf3d.sdCapsule, sdf3d.sdCappedCone, sdf3d.sdPyramid, sdf3d.sdHexPrism, sdf3d.sdEllipsoid,
                sdf3d.sdBicone, sdf3d.sdLink, sdf3d.smin, sdf3d.sdGem, sdf3d.sdHelix, sdf3d.sdMetaballs,
                sdf3d.sdDodecahedron, sdf3d.sdCutSphere, sdf3d.rotateVec3,
            ],
            {names: 'strict'},
        )
        expect(typeof wgsl).toBe('string')
        expect(wgsl).toMatch(/fn/)
        expect(wgsl).toMatchSnapshot()
    })
})
