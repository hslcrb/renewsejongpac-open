import {describe, it, expect, vi} from 'vitest'
import {tgpu, d, blur} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import FilmStock from '@coreroot/shaders/FilmStock/index'
import {lutAtlasFnsFor} from '@coreroot/std/effects/color'
import {tintedScreenGlow, swayUV} from '@coreroot/std/effects/blurs'
import {LUT_SIZE, STOCK_OPTIONS, decodeStockLut} from '@coreroot/shaders/FilmStock/stockLuts'

/**
 * FilmStock v2 gate — stripped to stock color (real measured film-emulation LUTs from the
 * RawTherapee Film Simulation Collection, shipped as 17³ rgba8unorm slice atlases and sampled
 * with two bilinear taps + a blue mix), emulsion halation (bright-extract + variable Gaussian,
 * Glow's mechanism) and gate weave. GPU-free: a mock root answers the compute allocations and an
 * injected createDataTexture stands in for the LUT atlas; kernels resolve standalone and the LUT
 * math + decoded stock data are CPU-goldened.
 */

function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) {return buffer})}
    const texture = {$usage: vi.fn(function (this: unknown) {return texture}), destroy: vi.fn(), write: vi.fn()}
    const uniform = {buffer: {}, write: vi.fn(), patch: vi.fn()}
    const guarded = {with: vi.fn(function (this: unknown) {return guarded}), dispatchThreads: vi.fn()}
    return {
        createBuffer: vi.fn(() => buffer),
        createBindGroup: vi.fn(() => ({})),
        createTexture: vi.fn(() => texture),
        createUniform: vi.fn(() => uniform),
        createGuardedComputePipeline: vi.fn(() => guarded),
        device: {},
    } as never
}
const mockMediaTexture = () => ({texture: {}, width: LUT_SIZE * LUT_SIZE, height: LUT_SIZE, write: vi.fn(), unwrap: vi.fn(), destroy: vi.fn()})

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, 0.5, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {} as never,
    fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv]),
}
const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(genBody, 'genBody', []),
}

interface NodeSpec {id: string; def: GpuShaderDefinition; parentId: string | null; props?: Record<string, unknown>; metadata?: Partial<NodeMetadata>}

function bridgeFieldInits(def: GpuShaderDefinition, props: Record<string, unknown>, id: string): FieldInit[] {
    const map = createGpuUniformsMap(def as never, props, id)
    const inits: FieldInit[] = []
    for (const [name, u] of Object.entries(map)) inits.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
    return inits
}
function defaultsFor(def: GpuShaderDefinition): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(def.props)) out[name] = (cfg as {default: unknown}).default
    return out
}
function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore; root: ReturnType<typeof mockRoot>} {
    const root = mockRoot()
    const store = createUniformStore(root, {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const props = {...defaultsFor(s.def), ...(s.props ?? {})}
        const propFields = bridgeFieldInits(s.def, props, s.id)
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.defineSystem()
    store.finalize()
    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) {
        nodes.set(s.id, {
            id: s.id, componentName: s.def.name, parentId: s.parentId, definition: s.def,
            metadata: {blendMode: 'normal', opacity: undefined, renderOrder: 0, ...s.metadata} as NodeMetadata,
            handles: handlesById[s.id],
        })
    }
    for (const s of specs) {
        if (s.parentId) {
            const arr = childrenByParent.get(s.parentId) ?? []
            arr.push(nodes.get(s.id)!)
            childrenByParent.set(s.parentId, arr)
        }
    }
    const rootNode = specs.find((s) => s.parentId === null)!
    const registry: RegistryView = {
        rootId: rootNode.id,
        getNode: (id) => nodes.get(id),
        getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: () => null,
        store,
    }
    return {registry, store, root}
}
const composeOpts = (root: unknown) => ({
    flipY: false,
    dimensions: {width: 800, height: 600},
    gpu: {device: (root as {device: unknown}).device, root} as never,
    createDataTexture: () => mockMediaTexture() as never,
})
const tree = (props?: Record<string, unknown>) => [
    {id: 'root', def: RootContainer, parentId: null},
    {id: 'fs', def: FilmStock as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 0}},
    {id: 'gen', def: Generator, parentId: 'fs', metadata: {renderOrder: 0}},
] as NodeSpec[]

describe('FilmStock (a) compute → RTT input → LUT-graded composite', () => {
    it('RTTs the child, uploads the LUT atlas (media), runs the halation pre-pass, grades + screens', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))

        expect(ir.computeSteps.length).toBe(1)
        expect(ir.rttPasses.length).toBe(1)
        const kinds = ir.textures.map((t) => t.kind).sort()
        expect(kinds).toContain('rtt')
        expect(kinds).toContain('compute')
        expect(kinds).toContain('media')

        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).toMatch(/textureSample\(compute_0/)
        expect(finalWgsl).toMatch(/textureSample\(media_0/)
        expect(finalWgsl).toMatch(/lutAtlasUv/)
        expect(finalWgsl).toMatch(/lutAtlasApply/)
        expect(finalWgsl).toMatch(/tintedScreenGlow/)
        expect(finalWgsl).toMatch(/swayUV/)
        expect(finalWgsl).toMatch(/unpremultiplyAlpha/)
        expect(finalWgsl).toMatchSnapshot('final-pass')
    })

    it('every stock decodes and composes (compile-time LUT bake)', () => {
        for (const {value} of STOCK_OPTIONS) {
            const {registry, root} = buildRegistry(tree({stock: value}))
            const ir = composeNodeTree(registry, composeOpts(root))
            expect(ir.computeSteps.length).toBe(1)
        }
    })

    it('getComputeNodes returns the pre-pass + the two variable-blur passes (3 steps)', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps[0].getComputeNodes({})?.length).toBe(3)
    })

    it('bindInputs resolves the child RTT key and builds the pre-pass bind group', () => {
        const {registry, root} = buildRegistry(tree())
        const ir = composeNodeTree(registry, composeOpts(root))
        const before = (root as unknown as {createBindGroup: {mock: {calls: unknown[]}}}).createBindGroup.mock.calls.length
        let requestedKey: string | null = null
        ir.computeSteps[0].bindInputs?.((key) => {
            requestedKey = key
            return {texture: {}}
        })
        const after = (root as unknown as {createBindGroup: {mock: {calls: unknown[]}}}).createBindGroup.mock.calls.length
        expect(requestedKey).toBe('rtt_0')
        expect(after).toBeGreaterThan(before)
    })
})

describe('FilmStock (b) halation=0 bypass + GPU-free fallback', () => {
    it('halation=0 → no compute pass; the fragment still RTTs the child (weave) and LUT-grades', () => {
        const {registry, root} = buildRegistry(tree({halation: 0}))
        const ir = composeNodeTree(registry, composeOpts(root))
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/lutAtlasApply/)
        expect(finalWgsl).toMatch(/textureSample\(rtt_0/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })

    it('no device (GPU-free) → LUT-grades without halation, no compute textures', () => {
        const {registry} = buildRegistry(tree())
        const ir = composeNodeTree(registry, {flipY: false, createDataTexture: () => mockMediaTexture() as never})
        expect(ir.computeSteps.length).toBe(0)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/lutAtlasApply/)
        expect(finalWgsl).not.toMatch(/compute_0/)
    })
})

describe('FilmStock (c) pre-pass kernel resolves (D3 rules)', () => {
    it('extract kernel resolves with a sampled textureLoad + TWO storage textureStores', () => {
        const {layout, kernel} = blur.buildBloomExtractGraph(1024, 640, 'filmStockHalationExtract')
        const wgsl = tgpu.resolve([layout, kernel], {names: 'strict'})
        expect(wgsl).toMatch(/filmStockHalationExtract/)
        expect(wgsl).toMatch(/textureLoad/)
        expect((wgsl.match(/textureStore/g) ?? []).length).toBeGreaterThanOrEqual(2)
        expect(wgsl).toMatchSnapshot('halationExtract')
    })
})

describe('FilmStock (d) CPU goldens — LUT math', () => {
    const N = LUT_SIZE
    const ATLAS_W = N * N

    it('black maps to the first texel centre of slice 0; hi selects the next slice', () => {
        const lo = lutAtlasFnsFor(LUT_SIZE).uv(d.vec4f(0, 0, 0, 1), 0)
        expect(lo.x).toBeCloseTo(0.5 / ATLAS_W, 6)
        expect(lo.y).toBeCloseTo(0.5 / N, 6)
        const hi = lutAtlasFnsFor(LUT_SIZE).uv(d.vec4f(0, 0, 0, 1), 1)
        expect(hi.x).toBeCloseTo((N + 0.5) / ATLAS_W, 6)
    })

    it('white lands at the atlas end without overrun (slice pair straddles the last boundary)', () => {
        // linearToSrgb(1) is 1−ε in float, so white sits at slice N−2 with fraction ≈ 1 — the
        // trilinear mix lands on the true last slice; hi must never index past the atlas.
        const lo = lutAtlasFnsFor(LUT_SIZE).uv(d.vec4f(1, 1, 1, 1), 0)
        const hi = lutAtlasFnsFor(LUT_SIZE).uv(d.vec4f(1, 1, 1, 1), 1)
        expect(lo.x).toBeCloseTo(((N - 2) * N + 0.5 + (N - 1)) / ATLAS_W, 3)
        expect(lo.y).toBeCloseTo((0.5 + (N - 1)) / N, 3)
        expect(hi.x).toBeCloseTo(((N - 1) * N + 0.5 + (N - 1)) / ATLAS_W, 3)
        expect(hi.x).toBeLessThan(1)
    })

    it('strength 0 returns the input unchanged; strength 1 decodes the sRGB LUT value to linear', () => {
        const c = d.vec4f(0.3, 0.5, 0.7, 0.8)
        const tap = d.vec4f(0.5, 0.5, 0.5, 1)
        const off = lutAtlasFnsFor(LUT_SIZE).apply(c, tap, tap, 0)
        expect(off.x).toBeCloseTo(0.3, 6)
        expect(off.y).toBeCloseTo(0.5, 6)
        expect(off.z).toBeCloseTo(0.7, 6)
        expect(off.w).toBeCloseTo(0.8, 6)
        const on = lutAtlasFnsFor(LUT_SIZE).apply(c, tap, tap, 1)
        expect(on.x).toBeCloseTo(0.2140, 3) // srgbToLinear(0.5)
        expect(on.w).toBeCloseTo(0.8, 6)
    })

    it('halation with zero strength leaves the graded color unchanged', () => {
        const graded = d.vec4f(0.4, 0.5, 0.6, 1)
        const out = tintedScreenGlow(graded, d.vec4f(1, 1, 1, 1), d.vec4f(1, 0.38, 0.16, 0))
        expect(out.x).toBeCloseTo(0.4, 6)
        expect(out.y).toBeCloseTo(0.5, 6)
        expect(out.z).toBeCloseTo(0.6, 6)
        expect(out.w).toBeCloseTo(1, 6)
    })

    it('weave 0 is a UV no-op', () => {
        const uv = swayUV(d.vec2f(0.25, 0.75), 0, 123.4)
        expect(uv.x).toBeCloseTo(0.25, 6)
        expect(uv.y).toBeCloseTo(0.75, 6)
    })
})

describe('FilmStock (e) CPU goldens — decoded stock LUTs', () => {
    it('every stock decodes to a full opaque rgba atlas', () => {
        for (const {value} of STOCK_OPTIONS) {
            const data = decodeStockLut(value)
            expect(data.length).toBe(LUT_SIZE ** 3 * 4)
            expect(data[3]).toBe(255)
            expect(data[data.length - 1]).toBe(255)
        }
    })

    it('the atlas layout is (b·N + r, g): black in texel 0, white in the last, endpoints preserved', () => {
        const N = LUT_SIZE
        const data = decodeStockLut('portrait400')
        const texel = (r: number, g: number, b: number) => {
            const o = (g * N * N + b * N + r) * 4
            return [data[o], data[o + 1], data[o + 2]]
        }
        // Film toe lifts pure black only slightly; white stays white.
        expect(Math.max(...texel(0, 0, 0))).toBeLessThan(24)
        expect(Math.min(...texel(N - 1, N - 1, N - 1))).toBeGreaterThan(230)
        // The real Portra signature: mid grey renders LIFTED (brighter than the identity 127).
        expect(texel(8, 8, 8)[0]).toBeGreaterThan(140)
    })

    it('the mono stock is genuinely neutral (r = g = b everywhere)', () => {
        const data = decodeStockLut('mono400')
        for (let i = 0; i < data.length; i += 4) {
            expect(data[i]).toBe(data[i + 1])
            expect(data[i + 1]).toBe(data[i + 2])
        }
    })

    it('unknown slugs fall back to the first stock', () => {
        expect(decodeStockLut('nope')).toEqual(decodeStockLut(STOCK_OPTIONS[0].value))
    })
})
