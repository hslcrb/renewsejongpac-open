import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, RegistryView, RegistryNode, GpuFragmentParams, Expr} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import ContourLines from '@coreroot/shaders/ContourLines/index'
import {colorOps, tone} from '@coreroot/gpu/kit'

const {contourCompose} = colorOps
const contourLuma = tone.luma709Dot

/**
 * ContourLines port gate (Phase D2-C). Inline stylization filter (requiresChild, NOT requiresRTT)
 * with blendWithChildren:true — the FIRST consumer of composeReplaceFilter's over-child branch.
 * The leaf-sibling test proves the composer composites the pattern OVER the child (genBody + the
 * filter both appear in the final pass). compileTime source/colorMode JS-branch. fwidth AA →
 * resolve + smoke; contourLuma (the kit luma709Dot alias) / contourCompose CPU-goldened.
 */
function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) { return buffer })}
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}

// A plain generator sibling — the content ContourLines composites over.
const genBody = tgpu.fn([d.f32, d.vec2f], d.vec4f)((seed, uv) => {
    'use gpu'
    return d.vec4f(uv.x, uv.y, seed, 1.0)
})
const Generator: GpuShaderDefinition = {
    name: 'Generator',
    props: {seed: {default: 0.5}} as never,
    fragment: ({uniforms, ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [uniforms.seed, ctx.uv]),
}
const RootContainer: GpuShaderDefinition = {
    name: 'Root',
    props: {} as never,
    fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(genBody, 'genBody', []),
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
    for (const [name, u] of Object.entries(map)) inits.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
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

const CL = ContourLines as GpuShaderDefinition

describe('ContourLines (a) shipped-v1 replace over a preceding sibling (blendWithChildren:false parity)', () => {
    it('REPLACES the sibling composition (shipped v1 parity; luminance default)', () => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'gen', def: Generator, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'cl', def: CL, parentId: 'root', metadata: {renderOrder: 1}},
        ])
        const ir = composeNodeTree(registry)
        const finalWgsl = tgpu.resolve([ir.finalPass.entry], {names: 'strict'})
        // The child (generator) is STILL in the graph — proof it's composited under the filter.
        expect(finalWgsl).toMatch(/genBody/)
        // The filter's own math.
        expect(finalWgsl).toMatch(/luma709/)
        expect(finalWgsl).toMatch(/contourLineMask/)
        expect(finalWgsl).toMatch(/contourCompose/)
        expect(finalWgsl).toMatchSnapshot('contourlines-over-sibling')
    })
})

describe('ContourLines (b) compile-time source + colorMode branches', () => {
    const resolve = (props: Record<string, unknown>): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: RootContainer, parentId: null},
            {id: 'gen', def: Generator, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'cl', def: CL, parentId: 'root', props, metadata: {renderOrder: 1}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('source=alpha reads the child alpha, not luminance', () => {
        const alpha = resolve({source: 'alpha'})
        expect(alpha).not.toMatch(/luma709/)
        expect(alpha).toMatch(/contourLineMask/)
    })

    it('source=luminance emits the luminance dot', () => {
        expect(resolve({source: 'luminance'})).toMatch(/luma709/)
    })

    it('custom colorMode resolves (uses line/background color uniforms)', () => {
        expect(resolve({colorMode: 'custom'})).toMatch(/contourCompose/)
    })
})

describe('ContourLines (c) CPU golden — luminance + compose', () => {
    it('contourLuma is Rec.709 luminance (now the shared kit `tone.luma709Dot`, which takes rgb)', () => {
        const out = contourLuma(d.vec3f(0.2, 0.5, 0.9)) as number
        expect(out).toBeCloseTo(0.2 * 0.2126 + 0.5 * 0.7152 + 0.9 * 0.0722, 6)
    })

    it('contourCompose mixes bg→line by the mask (rgb + alpha)', () => {
        const bg = d.vec4f(0, 0, 0, 0)
        const line = d.vec4f(1, 0.5, 0.25, 1)
        const at = (m: number) => contourCompose(bg, line, m) as {x: number; y: number; z: number; w: number}
        const o = at(0.5)
        expect(o.x).toBeCloseTo(0.5, 6)
        expect(o.y).toBeCloseTo(0.25, 6)
        expect(o.z).toBeCloseTo(0.125, 6)
        expect(o.w).toBeCloseTo(0.5, 6)
        expect((at(0) as {w: number}).w).toBe(0)
        expect((at(1) as {w: number}).w).toBe(1)
    })
})
