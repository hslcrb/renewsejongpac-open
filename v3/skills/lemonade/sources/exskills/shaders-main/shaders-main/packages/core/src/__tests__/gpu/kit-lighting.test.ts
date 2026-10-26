import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {
    fieldGradient,
    volumetricNormal,
    bevelledFlatNormal,
    patternCoords,
    outsideShape,
    insideMask,
    perspectiveViewRay,
    orthonormalTangentFrame,
    wardAnisotropicSpecular,
    WardSpecularInput,
    cosinePalette,
} from '@coreroot/gpu/kit/lighting'

/**
 * Phase 8 kit lighting gate (`gpu/kit/lighting.ts`) — the shape-effect surface-normal / edge-mask /
 * optics primitives. Two layers per C8: (1) RESOLVE GATE — every exported `'use gpu'` fn transpiles
 * to WGSL and snapshots; (2) CPU GOLDEN — each fn runs as plain JS off-GPU against hand-computed
 * math, which is what makes the "extraction was pixel-neutral" claim checkable rather than asserted.
 */

const TWO_PI = Math.PI * 2

describe('lighting — resolve gate', () => {
    it('every exported body fn transpiles to WGSL', () => {
        // `externals` (not the array form): kit fns are deliberately not `$named` — consumers name
        // their calls — so only the externals map gives them their identifiers in the output.
        // A `template` with real call-sites is required (as of TypeGPU 0.12): externals are only
        // resolved when their name literally appears in the template text — an empty template no
        // longer resolves anything (see the 0.12 migration guide's `tgpu.resolve` note).
        const wgsl = tgpu.resolve({
            template: `
                fn __probe() {
                    fieldGradient(); volumetricNormal(); bevelledFlatNormal(); patternCoords();
                    outsideShape(); insideMask(); perspectiveViewRay(); orthonormalTangentFrame();
                    wardAnisotropicSpecular(); cosinePalette();
                }
            `,
            externals: {
                fieldGradient, volumetricNormal, bevelledFlatNormal, patternCoords, outsideShape,
                insideMask, perspectiveViewRay, orthonormalTangentFrame, wardAnisotropicSpecular,
                cosinePalette,
            },
        })
        for (const name of [
            'fieldGradient', 'volumetricNormal', 'bevelledFlatNormal', 'patternCoords', 'outsideShape',
            'insideMask', 'perspectiveViewRay', 'orthonormalTangentFrame', 'wardAnisotropicSpecular',
            'cosinePalette',
        ]) expect(wgsl).toContain(`fn ${name}(`)
        expect(wgsl).toMatchSnapshot('lighting-wgsl')
    })
})

describe('normals from the field taps (CPU golden)', () => {
    const surf0 = d.vec4f(0.2, 0.0, 0.0, 0.5)
    const surfX = d.vec4f(0.21, 0.0, 0.0, 0.53)
    const surfY = d.vec4f(0.19, 0.0, 0.0, 0.48)

    it('fieldGradient = forward difference of .x over eps', () => {
        const g = fieldGradient(surf0, surfX, surfY, 0.01)
        expect(g.x).toBeCloseTo((0.21 - 0.2) / 0.01, 5)
        expect(g.y).toBeCloseTo((0.19 - 0.2) / 0.01, 5)
    })

    it('volumetricNormal differentiates .w and normalizes with z = -1', () => {
        const n = volumetricNormal(surf0, surfX, surfY, 0.01, 5)
        const ddx = (0.53 - 0.5) / 0.01
        const ddy = (0.48 - 0.5) / 0.01
        const len = Math.hypot(ddx, ddy, 1)
        expect(n.x).toBeCloseTo(ddx / len, 5)
        expect(n.y).toBeCloseTo(ddy / len, 5)
        expect(n.z).toBeCloseTo(-1 / len, 5)
        expect(Math.hypot(n.x, n.y, n.z)).toBeCloseTo(1, 5)
    })

    it('volumetricNormal clamps the slope to ±gradClamp (the chord-discontinuity guard)', () => {
        // A .w step of 1.0 over eps 0.01 is a slope of 100 — clamped to the bound.
        const steep = d.vec4f(0.21, 0, 0, 1.5)
        const tight = volumetricNormal(surf0, steep, surf0, 0.01, 4)
        const loose = volumetricNormal(surf0, steep, surf0, 0.01, 5)
        expect(tight.x).toBeCloseTo(4 / Math.hypot(4, 0, 1), 5)
        expect(loose.x).toBeCloseTo(5 / Math.hypot(5, 0, 1), 5)
    })

    it('bevelledFlatNormal tilts along the gradient by sinTilt, capped below 1', () => {
        const n = bevelledFlatNormal(d.vec2f(3, 4), 0.6)
        expect(n.x).toBeCloseTo(0.6 * 3 / 5, 5)
        expect(n.y).toBeCloseTo(0.6 * 4 / 5, 5)
        expect(n.z).toBeCloseTo(-Math.sqrt(1 - 0.36), 5)
        // sinTilt = 1 would put the normal in the plane (z = 0); the 0.9995 cap prevents that.
        expect(bevelledFlatNormal(d.vec2f(1, 0), 1).z).toBeLessThan(0)
    })

    it('patternCoords: sdfUV − 0.5 when flat, the sampler .g/.b when volumetric', () => {
        const s = d.vec4f(0.0, 0.7, -0.3, 0.0)
        const flat = patternCoords(d.vec2f(0.75, 0.25), s, 0)
        expect(flat.x).toBeCloseTo(0.25, 5)
        expect(flat.y).toBeCloseTo(-0.25, 5)
        const vol = patternCoords(d.vec2f(0.75, 0.25), s, 1)
        expect(vol.x).toBeCloseTo(0.7, 5)
        expect(vol.y).toBeCloseTo(-0.3, 5)
    })
})

describe('edge masks (CPU golden)', () => {
    it('outsideShape is true beyond two device pixels', () => {
        const pxH = 1 / 600
        expect(outsideShape(3 * pxH, pxH)).toBe(true)
        expect(outsideShape(pxH, pxH)).toBe(false)
        expect(outsideShape(-0.1, pxH)).toBe(false)
    })

    it('insideMask ramps over sharpEdge/32 when that is wider than the pixel floor', () => {
        const pxH = 1 / 600
        const sharpEdge = 0.5 // → width 0.015625, far above 1.5 px (0.0025)
        expect(insideMask(0, sharpEdge, pxH, 1.5)).toBeCloseTo(0, 5)
        expect(insideMask(-0.015625, sharpEdge, pxH, 1.5)).toBeCloseTo(1, 5)
        expect(insideMask(-0.0078125, sharpEdge, pxH, 1.5)).toBeCloseTo(0.5, 5)
    })

    it('insideMask floors the width at minPixels device pixels (the D-7 AA fix)', () => {
        const pxH = 1 / 600
        // sharpEdge 0.001 (edgeSoftness → 0) would give a width of 3.125e-5 — a third of a pixel,
        // which is the aliased raw step the clamp exists to prevent.
        const sharpEdge = 0.001
        const oneDeviceIn = -pxH
        expect(insideMask(oneDeviceIn, sharpEdge, pxH, 1.5)).toBeCloseTo(1 / 1.5, 5)
        // Without the floor the same fragment would already be fully inside.
        expect(insideMask(oneDeviceIn, sharpEdge, pxH, 0)).toBeCloseTo(1, 5)
    })
})

describe('view geometry + anisotropic specular (CPU golden)', () => {
    it('perspectiveViewRay is a normalized ray into the scene, aspect-corrected', () => {
        const r = perspectiveViewRay(d.vec2f(0.75, 0.5), 2, 0.6)
        const raw = [0.25 * 2 * 0.6, 0, 1]
        const len = Math.hypot(...raw)
        expect(r.x).toBeCloseTo(raw[0] / len, 5)
        expect(r.y).toBeCloseTo(0, 5)
        expect(r.z).toBeCloseTo(1 / len, 5)
        // Centre of the canvas looks straight in.
        const c = perspectiveViewRay(d.vec2f(0.5, 0.5), 2, 0.6)
        expect(c.z).toBeCloseTo(1, 5)
    })

    it('orthonormalTangentFrame projects the axis into the surface plane', () => {
        const n = d.vec3f(0, 0, -1)
        const f = orthonormalTangentFrame(n, d.vec3f(1, 0, 0.5))
        expect(f.tangent.x).toBeCloseTo(1, 5)
        expect(f.tangent.z).toBeCloseTo(0, 5)
        // T ⟂ N and B ⟂ both, all unit length.
        expect(f.tangent.x * n.x + f.tangent.y * n.y + f.tangent.z * n.z).toBeCloseTo(0, 5)
        expect(Math.hypot(f.bitangent.x, f.bitangent.y, f.bitangent.z)).toBeCloseTo(1, 5)
    })

    it('wardAnisotropicSpecular smears along the tangent, not across it', () => {
        const n = d.vec3f(0, 0, -1)
        const view = d.vec3f(0, 0, 1)
        const base = {normal: n, tangent: d.vec3f(1, 0, 0), view, alphaAlong: 0.4, alphaAcross: 0.05}
        // A light tilted ALONG the grain keeps more energy than the same tilt ACROSS it.
        const along = wardAnisotropicSpecular(WardSpecularInput({...base, light: d.vec3f(0.3, 0, -0.95)}))
        const across = wardAnisotropicSpecular(WardSpecularInput({...base, light: d.vec3f(0, 0.3, -0.95)}))
        expect(along).toBeGreaterThan(across)
        expect(along).toBeLessThanOrEqual(1)
        expect(across).toBeGreaterThanOrEqual(0)
    })
})

describe('cosinePalette (CPU golden)', () => {
    it('is cos((t + phase)·2π)·0.5 + 0.5 per channel', () => {
        const c = cosinePalette(0.1, 0, 1 / 3, 2 / 3)
        expect(c.x).toBeCloseTo(Math.cos(0.1 * TWO_PI) * 0.5 + 0.5, 5)
        expect(c.y).toBeCloseTo(Math.cos((0.1 + 1 / 3) * TWO_PI) * 0.5 + 0.5, 5)
        expect(c.z).toBeCloseTo(Math.cos((0.1 + 2 / 3) * TWO_PI) * 0.5 + 0.5, 5)
    })

    it('wraps every 1.0 and stays in [0,1]', () => {
        const a = cosinePalette(0.2, 0, 0.3333, 0.6667)
        const b = cosinePalette(1.2, 0, 0.3333, 0.6667)
        expect(a.x).toBeCloseTo(b.x, 4)
        for (const v of [a.x, a.y, a.z]) {
            expect(v).toBeGreaterThanOrEqual(0)
            expect(v).toBeLessThanOrEqual(1)
        }
    })
})
