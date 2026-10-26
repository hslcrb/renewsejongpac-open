import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {createUniformStore, type UniformStore, type FieldInit} from '@coreroot/gpu/uniformStore'
import {SystemUniforms} from '@coreroot/gpu/kit/coords'
import {composeNodeTree, call} from '@coreroot/gpu/composer'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import type {GpuShaderDefinition, GpuFragmentParams, Expr, RegistryView, RegistryNode} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'
import Godrays from '@coreroot/shaders/Godrays/index'
import LensFlare from '@coreroot/shaders/LensFlare/index'
import FlutedGlass from '@coreroot/shaders/FlutedGlass/index'

/**
 * D2-E misc generators/filters gate. Godrays + LensFlare are animated procedural generators
 * (hash / cosine spectral — GPU-only, resolve+smoke coverage). FlutedGlass is an RTT refraction
 * filter (struct-return geometry, compile-time shape/edges/aberration branches).
 */
function mockRoot() {
    const buffer = {patch: vi.fn(), write: vi.fn(), destroy: vi.fn(), $usage: vi.fn(function (this: unknown) { return buffer })}
    return {createBuffer: vi.fn(() => buffer), createBindGroup: vi.fn(() => ({}))} as never
}
interface NodeSpec {id: string; def: GpuShaderDefinition; parentId: string | null; props?: Record<string, unknown>; metadata?: Partial<NodeMetadata>}
function defaultsFor(def: GpuShaderDefinition): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(def.props)) out[name] = (cfg as {default: unknown}).default
    return out
}
function buildRegistry(specs: NodeSpec[]): {registry: RegistryView; store: UniformStore} {
    const store = createUniformStore(mockRoot(), {systemSchema: SystemUniforms})
    const handlesById: Record<string, Record<string, {accessorPath: string; cpu: boolean; value: unknown}>> = {}
    for (const s of specs) {
        const map = createGpuUniformsMap(s.def as never, {...defaultsFor(s.def), ...(s.props ?? {})}, s.id)
        const fields: FieldInit[] = []
        for (const [name, u] of Object.entries(map)) fields.push({name, initial: u.value, transform: u.transform, cpu: u.cpu, schema: u.schema})
        fields.push({name: '_opacity', schema: d.f32, initial: 1})
        if (s.def.animatedTime) fields.push({name: '_animTime', schema: d.f32, initial: 0})
        handlesById[s.id] = store.defineNode(s.id, fields) as never
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
    return {registry: {rootId: root.id, getNode: (id) => nodes.get(id), getChildren: (pid) => childrenByParent.get(pid) ?? [], resolveCustomId: () => null, store}, store}
}

const genBody = tgpu.fn([d.vec2f], d.vec4f)((uv) => { 'use gpu'; return d.vec4f(uv.x, uv.y, 0.5, 1.0) })
const Generator: GpuShaderDefinition = {name: 'Generator', props: {} as never, fragment: ({ctx}: GpuFragmentParams): Expr => call(genBody, 'genBody', [ctx.uv])}
const Root: GpuShaderDefinition = {name: 'Root', props: {} as never, fragment: ({childNode}: GpuFragmentParams): Expr => childNode ?? call(genBody, 'genBody', [])}

const resolveOne = (def: GpuShaderDefinition, props?: Record<string, unknown>): string => {
    const {registry} = buildRegistry([{id: 'n', def, parentId: null, props}])
    return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
}

describe('Godrays (animated generator)', () => {
    it('reads _animTime and emits the ray field + composite', () => {
        const wgsl = resolveOne(Godrays as GpuShaderDefinition)
        expect(wgsl).toMatch(/godraysFrame/)
        expect(wgsl).toMatch(/godraysRayStack/)
        expect(wgsl).toMatch(/coverageOver/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatchSnapshot('godrays')
    })
})

describe('LensFlare (animated procedural generator)', () => {
    it('emits the flare stack (ghosts + spectral) reading _animTime', () => {
        const wgsl = resolveOne(LensFlare as GpuShaderDefinition)
        expect(wgsl).toMatch(/flareFrame/)
        expect(wgsl).toMatch(/flareComposite/)
        expect(wgsl).toMatch(/lensFlareGhost/)
        expect(wgsl).toMatch(/_animTime/)
        expect(wgsl).toMatchSnapshot('lensflare')
    })
})

describe('FlutedGlass (RTT refraction filter)', () => {
    const resolveFilter = (props?: Record<string, unknown>): string => {
        const {registry} = buildRegistry([
            {id: 'root', def: Root, parentId: null},
            {id: 'gen', def: Generator, parentId: 'root', metadata: {renderOrder: 0}},
            {id: 'fg', def: FlutedGlass as GpuShaderDefinition, parentId: 'root', props, metadata: {renderOrder: 1}},
        ])
        return tgpu.resolve([composeNodeTree(registry).finalPass.entry], {names: 'strict'})
    }

    it('samples the child RTT through the flute geometry + unpremultiplies (default: mirror, aberration on)', () => {
        const wgsl = resolveFilter()
        expect(wgsl).toMatch(/flutedGlassGeom/)
        expect(wgsl).toMatch(/textureSample\(rtt_/)
        expect(wgsl).toMatch(/unpremultiplyAlpha/)
        // Aberration on by default → three chromatic samples recombined.
        expect(wgsl).toMatchSnapshot('flutedglass-mirror-aberration')
    })

    it('transparent edges + aberration off resolves a distinct pass (compile-time branches)', () => {
        const on = resolveFilter()
        const off = resolveFilter({edges: 'transparent', aberration: 0})
        expect(off).not.toEqual(on)
    })
})
