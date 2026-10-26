import {describe, it, expect, vi, afterEach} from 'vitest'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import {shapeEffectBoundingBoxDeclaration} from '@coreroot/utilities/shapeEffectBounds'
import {boxHalfExtentsUV, resolveDimensionalProp} from '@coreroot/utilities/dimensionalProps'
import {isSdfContentBoundsScanned} from '@coreroot/utilities/sdfBounds'

/**
 * Regression: a custom-SVG shape effect (shapeSdfUrl) with a non-centre `origin` anchors against
 * CONTENT-TIGHT bounds that arrive from an async scan of the SDF. At registration the scan hasn't
 * landed, so the position resolves against the full-field fallback — and previously NOTHING
 * re-resolved it when the scan completed (the shape sat off its anchor until an unrelated prop
 * patch happened to re-run the resolve). The renderer must now re-anchor the node itself.
 */

const SDF_SIZE = 512
const W = 1280, H = 800

function def(name: string, decl?: GpuShaderDefinition['boundingBoxDeclaration']): GpuShaderDefinition {
    return {name, props: {}, fragment: (() => ({})) as never, boundingBoxDeclaration: decl}
}
const Root = def('Root')
const ShapeFx = def('ShapeFx', shapeEffectBoundingBoxDeclaration)
const meta = (m: Partial<NodeMetadata> = {}): NodeMetadata => ({blendMode: 'normal', opacity: undefined, ...m}) as NodeMetadata

/** A compact Uint16 SDF whose inside pixels span x∈[128,384) × y∈[192,320) → hwf 0.25, hhf 0.125. */
function makeSdfBinary(): ArrayBuffer {
    const u = new Uint16Array(SDF_SIZE * SDF_SIZE)
    const inside = Math.round((-0.5 + 1) * 32767.5)
    const outside = Math.round((0.5 + 1) * 32767.5)
    for (let y = 0; y < SDF_SIZE; y++) {
        for (let x = 0; x < SDF_SIZE; x++) {
            const isInside = x >= 128 && x < 384 && y >= 192 && y < 320
            u[y * SDF_SIZE + x] = isInside ? inside : outside
        }
    }
    return u.buffer
}

async function untilScanned(url: string): Promise<void> {
    for (let i = 0; i < 200 && !isSdfContentBoundsScanned(url); i++) await new Promise((r) => setTimeout(r, 5))
    // The onReady waiters fire in the scan's `finally` — give that microtask a tick to land.
    await new Promise((r) => setTimeout(r, 0))
}

describe('origin-anchored SVG shape re-resolves when the SDF content scan lands', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('re-anchors center against the content-tight extent without any prop patch', async () => {
        const url = `https://sdf.test/logo-${Date.now()}.bin`
        const bin = makeSdfBinary()
        vi.stubGlobal('fetch', vi.fn(async () => new Response(bin, {status: 200})))

        const r = shaderRendererGPU()
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        const raw = {x: 1.04, y: 1.1}
        r.registerNode(
            'fx',
            ShapeFx.fragment,
            'root',
            meta(),
            {
                origin: {value: 'bottom-right'},
                center: {value: {...raw}},
                scale: {value: 1.32},
                shapeSdfUrl: {value: url},
            },
            ShapeFx,
        )
        r.__testing.setTestReady({width: W, height: H})

        const node = r.__testing.getNodeRegistry().nodes.get('fx')!
        expect(node).toBeDefined()
        const before = node.uniforms.center.value as {x: number; y: number}

        // Registration resolved against the full-field fallback (scan not landed yet).
        expect(isSdfContentBoundsScanned(url)).toBe(false)
        const snapBefore = {origin: 'bottom-right', center: raw, scale: 1.32, shapeSdfUrl: url}
        const heFallback = boxHalfExtentsUV(shapeEffectBoundingBoxDeclaration, snapBefore, W, H)
        expect(heFallback.hwx).toBeCloseTo(heFallback.hhy * (H / W), 6) // full field is a square

        await untilScanned(url)
        expect(isSdfContentBoundsScanned(url)).toBe(true)

        // The same snapshot now yields the content-tight extent (cache filled) — and the node's
        // live value must have followed it with NO updateUniformValue call in between.
        const heTight = boxHalfExtentsUV(shapeEffectBoundingBoxDeclaration, snapBefore, W, H)
        expect(heTight.hwx).toBeLessThan(heFallback.hwx)
        const expected = resolveDimensionalProp(
            shapeEffectBoundingBoxDeclaration, 'center', raw, 'bottom-right', W, H, undefined, heTight,
        ) as {x: number; y: number}
        const after = node.uniforms.center.value as {x: number; y: number}
        expect(after).not.toEqual(before)
        expect(after.x).toBeCloseTo(expected.x, 6)
        expect(after.y).toBeCloseTo(expected.y, 6)
    })

    it('ignores a scan that lands after the node was removed', async () => {
        const url = `https://sdf.test/gone-${Date.now()}.bin`
        const bin = makeSdfBinary()
        vi.stubGlobal('fetch', vi.fn(async () => new Response(bin, {status: 200})))

        const r = shaderRendererGPU()
        r.registerNode('root', Root.fragment, null, meta(), {}, Root)
        r.registerNode(
            'fx', ShapeFx.fragment, 'root', meta(),
            {origin: {value: 'top-left'}, center: {value: {x: 0.2, y: 0.2}}, scale: {value: 1}, shapeSdfUrl: {value: url}},
            ShapeFx,
        )
        r.__testing.setTestReady({width: W, height: H})
        const node = r.__testing.getNodeRegistry().nodes.get('fx')!
        const before = {...(node.uniforms.center.value as {x: number; y: number})}
        r.removeNode('fx')

        await untilScanned(url)
        // Removed node's uniforms are left untouched (no throw, no write).
        expect(node.uniforms.center.value).toEqual(before)
        expect(r.__testing.getNodeRegistry().nodes.has('fx')).toBe(false)
    })
})
