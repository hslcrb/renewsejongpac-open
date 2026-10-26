import {describe, it, expect, vi} from 'vitest'
import {tgpu, d, colorMixing} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, collectStructuralHashInputs} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import LinearGradient from '@coreroot/shaders/LinearGradient/index'
import {gradientPaints, colorStops} from '@coreroot/gpu/kit'

const {gradientRawT} = gradientPaints
const {gradientStopsInSpace} = colorStops

/**
 * LinearGradient port gate (Phase D1 — the FIRST array-uniform shader). GPU-free: the uniform
 * store's root is mocked, the composer builds the real raw-WGSL fragment entries, and we
 * `tgpu.resolve` each pass to WGSL and snapshot it. Plus CPU golden values: the exported
 * `gradientRawT` (DualFn) is checked against the ORIGINAL TSL projection formula, and
 * `gradientStopsInSpace` against a hand-computed alpha-weighted multi-stop mix.
 *
 * The default props take the literal two-color path (stops=null → stopCount 0 → mixColors), which
 * is what GATE B captures (green→blue). The multi-stop array path is forced with an explicit
 * `stops` prop to exercise the array uniforms + the working-space accumulation.
 */

function mockRoot() {
    const buffer = {
        patch: vi.fn(),
        write: vi.fn(),
        destroy: vi.fn(),
        $usage: vi.fn(function (this: unknown) {
            return buffer
        }),
    }
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}

const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? (undefined as never),
}

interface NodeSpec {
    id: string
    def: GpuShaderDefinition
    parentId: string | null
    props?: Record<string, unknown>
    metadata?: Partial<NodeMetadata>
}

function bridgeFieldInits(def: GpuShaderDefinition, props: Record<string, unknown>, id: string): FieldInit[] {
    const map = createGpuUniformsMap(def as never, props, id)
    const inits: FieldInit[] = []
    for (const [name, u] of Object.entries(map)) {
        inits.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
    }
    return inits
}

function defaultsFor(def: GpuShaderDefinition): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(def.props)) out[name] = (cfg as {default: unknown}).default
    return out
}

function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore} {
    const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const props = {...defaultsFor(s.def), ...(s.props ?? {})}
        const propFields = bridgeFieldInits(s.def, props, s.id)
        const synthetic: FieldInit[] = [{name: '_opacity', schema: d.f32, initial: s.metadata?.opacity ?? 1}]
        handlesById[s.id] = store.defineNode(s.id, [...propFields, ...synthetic]) as never
    }
    store.finalize()

    const nodes = new Map<string, RegistryNode>()
    const childrenByParent = new Map<string, RegistryNode[]>()
    for (const s of specs) {
        nodes.set(s.id, {
            id: s.id,
            componentName: s.def.name,
            parentId: s.parentId,
            definition: s.def,
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
    const root = specs.find((s) => s.parentId === null)!
    const registry: RegistryView = {
        rootId: root.id,
        getNode: (id) => nodes.get(id),
        getChildren: (parentId) => childrenByParent.get(parentId) ?? [],
        resolveCustomId: () => null,
        store,
    }
    return {registry, store}
}

const LG = LinearGradient as GpuShaderDefinition

// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) Default two-color generator — the GATE B path
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('LinearGradient (a) default two-color path', () => {
    it('emits the gradient projection + mixColors (linear), no array loop', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'lg', def: LG, parentId: 'root', metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/gradientRawT/)
        expect(finalWgsl).toMatch(/mixColors/)
        // Default edge (stretch) → clamp, no mirror/wrap; no multi-stop accumulation.
        expect(finalWgsl).not.toMatch(/gradientEdgeMirror/)
        expect(finalWgsl).not.toMatch(/gradientStopsInSpace/)
        expect(ir.rttPasses.length).toBe(0)
        expect(finalWgsl).toMatchSnapshot('final-pass-two-color')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) Multi-stop path — the array uniforms + working-space accumulation
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('LinearGradient (b) multi-stop array path', () => {
    const stops = [
        {color: '#ff0000', position: 0},
        {color: '#00ff00', position: 0.5},
        {color: '#0000ff', position: 1},
    ]
    it('emits the working-space accumulation loop over the array uniforms', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'lg', def: LG, parentId: 'root', props: {stops}, metadata: {renderOrder: 0}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        expect(finalWgsl).toMatch(/gradientStopsInSpace/)
        expect(finalWgsl).toMatch(/mixPreconvertedInSpace/)
        expect(finalWgsl).toMatchSnapshot('final-pass-multi-stop')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (c) Compile-time branching — edges + colorSpace + stopCount drive the emitted WGSL
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('LinearGradient (c) compile-time branching', () => {
    const resolveWith = (props: Record<string, unknown>): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'lg', def: LG, parentId: 'root', props, metadata: {renderOrder: 0}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('edge modes select the matching WGSL', () => {
        expect(resolveWith({edges: 'mirror'})).toMatch(/gradientEdgeMirror/)
        expect(resolveWith({edges: 'wrap'})).toMatch(/gradientEdgeWrap/)
        expect(resolveWith({edges: 'transparent'})).toMatch(/gradientTransparentAlpha/)
    })

    it('non-linear colorSpace back-converts (multi-stop) via the space conversion fns', () => {
        const stops = [
            {color: '#ff0000', position: 0},
            {color: '#0000ff', position: 1},
        ]
        const wgsl = resolveWith({stops, colorSpace: 'oklch'})
        expect(wgsl).toMatch(/oklchToOklab/)
        expect(wgsl).toMatch(/oklabToRgb/)
    })

    it('edges + colorSpace are part of the structural (recompile) hash', () => {
        const hashWith = (props: Record<string, unknown>) => {
            const {registry} = buildRegistry([
                {id: 'root', def: RootContainer, parentId: null},
                {id: 'lg', def: LG, parentId: 'root', props, metadata: {renderOrder: 0}},
            ])
            return collectStructuralHashInputs(registry).join('\n')
        }
        expect(hashWith({edges: 'stretch'})).not.toBe(hashWith({edges: 'mirror'}))
        expect(hashWith({colorSpace: 'linear'})).not.toBe(hashWith({colorSpace: 'oklch'}))
        expect(hashWith({edges: 'stretch'})).toMatch(/edges=0/)
        expect(hashWith({colorSpace: 'oklab'})).toMatch(/colorSpace=2/)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (d) CPU golden — gradientRawT vs the ORIGINAL projection, computed by hand
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('LinearGradient (d) CPU golden — gradientRawT', () => {
    // ORIGINAL projection, transcribed from the v1 fragmentNode. start/end are TRANSFORMED
    // (transformPosition → (x, 1 - y)); the shader recovers y via `1 - start.y`.
    const golden = (
        start: [number, number],
        end: [number, number],
        angleDeg: number,
        uv: [number, number],
        viewport: [number, number],
    ): number => {
        const sp: [number, number] = [start[0], 1 - start[1]]
        const ep: [number, number] = [end[0], 1 - end[1]]
        const gv: [number, number] = [ep[0] - sp[0], ep[1] - sp[1]]
        const gl = Math.hypot(gv[0], gv[1])
        const gd: [number, number] = [gv[0] / gl, gv[1] / gl]
        const aspect = viewport[0] / Math.max(viewport[1], 1e-6)
        const ar = -(angleDeg * Math.PI) / 180
        const ca = Math.cos(ar)
        const sa = Math.sin(ar)
        const mid: [number, number] = [(sp[0] + ep[0]) * 0.5, (sp[1] + ep[1]) * 0.5]
        const cu: [number, number] = [uv[0] - mid[0], uv[1] - mid[1]]
        const acx = cu[0] * aspect
        const acy = cu[1]
        const rx = acx * ca - acy * sa
        const ry = acx * sa + acy * ca
        const ru: [number, number] = [rx / aspect + mid[0], ry + mid[1]]
        const rel: [number, number] = [ru[0] - sp[0], ru[1] - sp[1]]
        const proj = rel[0] * gd[0] + rel[1] * gd[1]
        return proj / Math.max(gl, 1e-6)
    }

    const cases: {start: [number, number]; end: [number, number]; angle: number; uv: [number, number]; vp: [number, number]}[] = [
        {start: [0, 0.5], end: [1, 0.5], angle: 0, uv: [0.8, 0.2], vp: [800, 600]},
        {start: [0, 0], end: [1, 1], angle: 30, uv: [0.3, 0.7], vp: [1, 1]},
        {start: [0.25, 0.25], end: [0.75, 0.9], angle: 200, uv: [0.6, 0.4], vp: [1920, 1080]},
    ]

    it('gradientRawT reproduces the original projection', () => {
        for (const c of cases) {
            const out = gradientRawT(
                d.vec2f(c.start[0], c.start[1]),
                d.vec2f(c.end[0], c.end[1]),
                c.angle,
                d.vec2f(c.uv[0], c.uv[1]),
                d.vec2f(c.vp[0], c.vp[1]),
            ) as unknown as number
            expect(out).toBeCloseTo(golden(c.start, c.end, c.angle, c.uv, c.vp), 5)
        }
    })

    it('the default horizontal gradient maps t=uv.x (start left, end right)', () => {
        // start (0,0.5)→(0,0.5 transformed), end (1,0.5)→(1,0.5); angle 0 → t == uv.x.
        const t = gradientRawT(d.vec2f(0, 0.5), d.vec2f(1, 0.5), 0, d.vec2f(0.42, 0.9), d.vec2f(800, 600)) as unknown as number
        expect(t).toBeCloseTo(0.42, 5)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (e) CPU golden — gradientStopsInSpace vs a hand alpha-weighted multi-stop mix (linear)
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('LinearGradient (e) CPU golden — multi-stop accumulation', () => {
    // Three opaque stops at 0, 0.5, 1 in linear (working space == P3). At t=0.25 (inside the
    // first segment, seg = 0.5) the running color is lerp(stop0, stop1, 0.5); the second segment
    // clamps seg to 0 (t < 0.5) so it passes the running color through unchanged.
    const colors = new Array(8).fill(0).map(() => d.vec4f(0, 0, 0, 0))
    colors[0] = d.vec4f(1, 0, 0, 1)
    colors[1] = d.vec4f(0, 1, 0, 1)
    colors[2] = d.vec4f(0, 0, 1, 1)
    // positions packed 4-per-vec4: [0, 0.5, 1, 0][0,0,0,0]
    const positions = [d.vec4f(0, 0.5, 1, 0), d.vec4f(0, 0, 0, 0)]
    const converted = new Array(8).fill(0).map(() => d.vec3f(0, 0, 0))
    converted[0] = d.vec3f(1, 0, 0)
    converted[1] = d.vec3f(0, 1, 0)
    converted[2] = d.vec3f(0, 0, 1)

    it('accumulates in-space with per-segment linstep', () => {
        const out = gradientStopsInSpace(0.25, colors as never, positions as never, converted as never, 3) as unknown as {
            conv: {x: number; y: number; z: number}
            alpha: number
        }
        // seg(0→0.5) at t=0.25 = 0.5 → lerp(red, green, 0.5) = (0.5, 0.5, 0); seg(0.5→1) clamps to 0.
        expect(out.conv.x).toBeCloseTo(0.5, 5)
        expect(out.conv.y).toBeCloseTo(0.5, 5)
        expect(out.conv.z).toBeCloseTo(0, 5)
        expect(out.alpha).toBeCloseTo(1, 5)
    })

    it('at t=1 the running color reaches the last stop', () => {
        const out = gradientStopsInSpace(1, colors as never, positions as never, converted as never, 3) as unknown as {
            conv: {x: number; y: number; z: number}
            alpha: number
        }
        expect(out.conv.x).toBeCloseTo(0, 5)
        expect(out.conv.y).toBeCloseTo(0, 5)
        expect(out.conv.z).toBeCloseTo(1, 5)
    })

    it('mixColorsLinear (two-color golden) alpha-weights correctly', () => {
        const a = d.vec4f(1, 0, 0, 1)
        const b = d.vec4f(0, 0, 1, 1)
        const out = colorMixing.mixColorsLinear(a, b, 0.25) as unknown as {x: number; y: number; z: number; w: number}
        expect(out.x).toBeCloseTo(0.75, 5)
        expect(out.z).toBeCloseTo(0.25, 5)
        expect(out.w).toBeCloseTo(1, 5)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// (f) Bridge re-pack — convertedColorsArray is packed at the ACTIVE colorSpace mode
// ═══════════════════════════════════════════════════════════════════════════════════════
describe('LinearGradient (f) convertedColorsArray packed at the active colorSpace', () => {
    const stops = [
        {color: '#ff0000', position: 0},
        {color: '#0000ff', position: 1},
    ]
    const packed = (colorSpace: string): {conv: number[]; colors: number[]} => {
        const map = createGpuUniformsMap(LG as never, {...defaultsFor(LG), stops, colorSpace}, 'x')
        return {
            conv: (map.convertedColorsArray!.value as number[]).slice(0, 3),
            colors: (map.colorsArray!.value as number[]).slice(0, 3),
        }
    }
    it('linear packs the raw P3 colors (identity); non-linear spaces differ', () => {
        const linear = packed('linear')
        const oklch = packed('oklch').conv
        const oklab = packed('oklab').conv
        // Linear working space IS P3 → the preconverted triplet equals the raw stop color.
        expect(linear.conv[0]).toBeCloseTo(linear.colors[0], 6)
        expect(linear.conv[1]).toBeCloseTo(linear.colors[1], 6)
        expect(linear.conv[2]).toBeCloseTo(linear.colors[2], 6)
        // Non-linear working spaces are NOT P3 → the packed triplet differs from linear + each other.
        expect(oklch).not.toEqual(linear.conv)
        expect(oklab).not.toEqual(linear.conv)
        expect(oklch).not.toEqual(oklab)
    })
})
