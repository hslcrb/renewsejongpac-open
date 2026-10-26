import {describe, it, expect} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import * as mask from '@coreroot/gpu/kit/mask'

/** Golden-value + resolve gates for kit/mask (port of masks/*.ts). */

const near = (actual: d.v4f, expected: number[], eps = 1e-6) => {
    const a = [...actual]
    for (let i = 0; i < 4; i++) expect(Math.abs(a[i] - expected[i])).toBeLessThan(eps)
}
const lum709 = (r: number, g: number, b: number) => r * 0.2126 + g * 0.7152 + b * 0.0722

describe('mask — alpha / alphaInverted', () => {
    const T = () => d.vec4f(0.2, 0.4, 0.6, 0.8)
    it('alpha scales target alpha by mask alpha (rgb untouched)', () => {
        near(mask.alpha(T(), d.vec4f(0, 0, 0, 0.5)), [0.2, 0.4, 0.6, 0.4])
        near(mask.alpha(T(), d.vec4f(1, 1, 1, 1.0)), [0.2, 0.4, 0.6, 0.8])
        near(mask.alpha(T(), d.vec4f(1, 1, 1, 0.0)), [0.2, 0.4, 0.6, 0.0])
    })
    it('alphaInverted scales by (1 - mask alpha)', () => {
        near(mask.alphaInverted(T(), d.vec4f(0, 0, 0, 0.0)), [0.2, 0.4, 0.6, 0.8])
        near(mask.alphaInverted(T(), d.vec4f(0, 0, 0, 0.25)), [0.2, 0.4, 0.6, 0.8 * 0.75])
        near(mask.alphaInverted(T(), d.vec4f(0, 0, 0, 1.0)), [0.2, 0.4, 0.6, 0.0])
    })
})

describe('mask — luminance / luminanceInverted', () => {
    const T = () => d.vec4f(0.3, 0.5, 0.9, 0.6)
    it('luminance scales target alpha by mask luminance (BT.709)', () => {
        near(mask.luminance(T(), d.vec4f(1, 1, 1, 1)), [0.3, 0.5, 0.9, 0.6 * lum709(1, 1, 1)])
        near(mask.luminance(T(), d.vec4f(0, 0, 0, 1)), [0.3, 0.5, 0.9, 0.0])
        near(mask.luminance(T(), d.vec4f(0.5, 0.25, 0.75, 1)), [0.3, 0.5, 0.9, 0.6 * lum709(0.5, 0.25, 0.75)], 1e-5)
    })
    it('luminanceInverted scales by (1 - mask luminance)', () => {
        near(mask.luminanceInverted(T(), d.vec4f(0, 0, 0, 1)), [0.3, 0.5, 0.9, 0.6])
        near(mask.luminanceInverted(T(), d.vec4f(1, 1, 1, 1)), [0.3, 0.5, 0.9, 0.6 * (1 - lum709(1, 1, 1))], 1e-6)
        near(mask.luminanceInverted(T(), d.vec4f(0.4, 0.6, 0.2, 1)), [0.3, 0.5, 0.9, 0.6 * (1 - lum709(0.4, 0.6, 0.2))], 1e-5)
    })
})

describe('mask — applyMask dispatcher', () => {
    it('dispatches to the named mask and falls back to alpha', () => {
        const T = d.vec4f(0.2, 0.4, 0.6, 0.8)
        const M = d.vec4f(0.5, 0.5, 0.5, 0.5)
        near(mask.applyMask(T, M, 'luminance'), [...mask.luminance(T, M)] as number[], 1e-9)
        near(mask.applyMask(T, M, 'bogus' as mask.MaskType), [...mask.alpha(T, M)] as number[], 1e-9)
    })
})

describe('mask — resolve gate', () => {
    it('all masks resolve to WGSL (snapshot)', () => {
        const wgsl = tgpu.resolve(
            [mask.alpha, mask.alphaInverted, mask.luminance, mask.luminanceInverted],
            {names: 'strict'},
        )
        expect(wgsl).toMatch(/fn/)
        expect(wgsl).toMatchSnapshot()
    })
})
