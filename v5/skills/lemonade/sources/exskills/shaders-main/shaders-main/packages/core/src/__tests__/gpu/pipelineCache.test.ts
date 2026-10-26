import {describe, it, expect, vi} from 'vitest'
import {createPipelineCache, structuralHash} from '@coreroot/gpu/pipelineCache'
import {collectStructuralHashInputs} from '@coreroot/gpu/composer'
import type {RegistryView, RegistryNode, GpuShaderDefinition} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'

/**
 * B5a pipelineCache tests:
 *   - structural hash stability (same registry → same hash) + every §2.1 trigger changes it,
 *   - LRU eviction (disposes the least-recently-used, never active/pending),
 *   - the swap-when-ready state machine (build new → render old → markReady → swap).
 */

// ── a tiny registry builder for hashing (no uniform store needed — hashing reads metadata) ──
const Def: GpuShaderDefinition = {name: 'X', props: {}, fragment: () => ({}) as never}
const DefCompileTime: GpuShaderDefinition = {
    name: 'Y',
    props: {mode: {default: 0, compileTime: true} as never},
    fragment: () => ({}) as never,
}

function reg(specs: {id: string; parentId: string | null; def?: GpuShaderDefinition; meta?: Partial<NodeMetadata>; handles?: Record<string, unknown>}[]): RegistryView {
    const nodes = new Map<string, RegistryNode>()
    const children = new Map<string, RegistryNode[]>()
    for (const s of specs) {
        const node: RegistryNode = {
            id: s.id,
            componentName: (s.def ?? Def).name,
            parentId: s.parentId,
            definition: s.def ?? Def,
            metadata: {blendMode: 'normal', renderOrder: 0, opacity: undefined, ...s.meta} as NodeMetadata,
            handles: (s.handles ?? {}) as never,
        }
        nodes.set(s.id, node)
    }
    for (const s of specs) {
        if (s.parentId) {
            const arr = children.get(s.parentId) ?? []
            arr.push(nodes.get(s.id)!)
            children.set(s.parentId, arr)
        }
    }
    return {
        rootId: specs.find((s) => s.parentId === null)!.id,
        getNode: (id) => nodes.get(id),
        getChildren: (p) => children.get(p) ?? [],
        resolveCustomId: () => null,
        store: {gpuAccessor: () => '', layout: undefined},
    }
}

describe('structuralHash + collectStructuralHashInputs', () => {
    const base = () =>
        reg([
            {id: 'root', parentId: null},
            {id: 'g1', parentId: 'root', meta: {renderOrder: 0}},
        ])

    it('is stable for identical registries', () => {
        const a = structuralHash(collectStructuralHashInputs(base()))
        const b = structuralHash(collectStructuralHashInputs(base()))
        expect(a).toBe(b)
    })

    it('changes when toneMapping changes', () => {
        const a = structuralHash(collectStructuralHashInputs(base(), {toneMapping: 'linear'}))
        const b = structuralHash(collectStructuralHashInputs(base(), {toneMapping: 'aces'}))
        expect(a).not.toBe(b)
    })

    const triggers: {name: string; meta: Partial<NodeMetadata>}[] = [
        {name: 'blendMode', meta: {blendMode: 'multiply'}},
        {name: 'opacity bucket (→0)', meta: {opacity: 0}},
        {name: 'visible', meta: {visible: false}},
        {name: 'renderOrder', meta: {renderOrder: 5}},
        {name: 'mask', meta: {mask: {source: 's', type: 'alpha'}}},
        {name: 'transform', meta: {transform: {offsetX: 0.2, offsetY: 0, rotation: 0, scale: 1, anchorX: 0.5, anchorY: 0.5, edges: 'stretch'}}},
    ]
    for (const t of triggers) {
        it(`changes when ${t.name} changes`, () => {
            const a = structuralHash(collectStructuralHashInputs(base()))
            const withTrigger = reg([
                {id: 'root', parentId: null},
                {id: 'g1', parentId: 'root', meta: {renderOrder: 0, ...t.meta}},
            ])
            const b = structuralHash(collectStructuralHashInputs(withTrigger))
            expect(b).not.toBe(a)
        })
    }

    it('changes when a compileTime prop value changes (but not a runtime prop)', () => {
        const mk = (modeVal: number) =>
            reg([
                {id: 'root', parentId: null},
                {id: 'g1', parentId: 'root', def: DefCompileTime, handles: {mode: {value: modeVal, cpu: false, accessorPath: 'n_g1.mode'}}},
            ])
        expect(structuralHash(collectStructuralHashInputs(mk(0)))).not.toBe(
            structuralHash(collectStructuralHashInputs(mk(1))),
        )
    })

    it('opacity 0.4 vs 0.9 does NOT change the hash (same non-zero bucket)', () => {
        const mk = (op: number) =>
            reg([
                {id: 'root', parentId: null},
                {id: 'g1', parentId: 'root', meta: {opacity: op}},
            ])
        expect(structuralHash(collectStructuralHashInputs(mk(0.4)))).toBe(
            structuralHash(collectStructuralHashInputs(mk(0.9))),
        )
    })
})

describe('pipelineCache — LRU', () => {
    it('evicts the least-recently-used entry beyond capacity (disposing it)', () => {
        const dispose = vi.fn()
        const cache = createPipelineCache<{id: string}>({maxSize: 2, dispose})
        const a = cache.getOrBuild('a', () => ({id: 'a'})) // active
        cache.getOrBuild('b', () => ({id: 'b'}))
        cache.markReady('b') // b active, a in LRU
        // Touch a so b becomes LRU, then add c → evicts b (LRU, not active a).
        cache.getOrBuild('a', () => ({id: 'a'}))
        cache.markReady('a')
        cache.getOrBuild('c', () => ({id: 'c'}))
        expect(cache.has('b')).toBe(false)
        expect(dispose).toHaveBeenCalledWith({id: 'b'}, 'b')
        expect(cache.has('a')).toBe(true)
        expect(cache.has('c')).toBe(true)
        void a
    })

    it('never evicts the active or pending composition', () => {
        const dispose = vi.fn()
        const cache = createPipelineCache<{id: string}>({maxSize: 1, dispose})
        cache.getOrBuild('a', () => ({id: 'a'})) // active (first)
        cache.getOrBuild('b', () => ({id: 'b'})) // pending; over capacity but a=active b=pending, neither evictable
        expect(cache.has('a')).toBe(true)
        expect(cache.has('b')).toBe(true)
        expect(dispose).not.toHaveBeenCalled()
    })
})

describe('pipelineCache — swap when ready', () => {
    it('renders the OLD composition until the new one is confirmed ready', () => {
        const cache = createPipelineCache<{id: string}>({maxSize: 4})
        cache.getOrBuild('a', () => ({id: 'a'}))
        expect(cache.activeHash).toBe('a')
        expect(cache.renderValue).toEqual({id: 'a'})

        // Composition changes → build 'b' but keep rendering 'a'.
        const b = cache.getOrBuild('b', () => ({id: 'b'}))
        expect(b).toEqual({id: 'b'})
        expect(cache.pendingHash).toBe('b')
        expect(cache.activeHash).toBe('a')
        expect(cache.renderValue).toEqual({id: 'a'}) // still old

        // New one drew its first frame → swap.
        cache.markReady('b')
        expect(cache.activeHash).toBe('b')
        expect(cache.pendingHash).toBeNull()
        expect(cache.renderValue).toEqual({id: 'b'})
    })

    it('the first-ever composition renders immediately (no old to keep)', () => {
        const cache = createPipelineCache<{id: string}>()
        cache.getOrBuild('a', () => ({id: 'a'}))
        expect(cache.renderValue).toEqual({id: 'a'})
        expect(cache.pendingHash).toBeNull()
    })

    it('reuses a cached composition on swap-back without rebuilding', () => {
        const build = vi.fn((id: string) => ({id}))
        const cache = createPipelineCache<{id: string}>({maxSize: 4})
        cache.getOrBuild('a', () => build('a'))
        cache.getOrBuild('b', () => build('b'))
        cache.markReady('b')
        // Swap back to a — already cached, no rebuild.
        cache.getOrBuild('a', () => build('a'))
        expect(build).toHaveBeenCalledTimes(2)
        expect(cache.pendingHash).toBe('a')
        cache.markReady('a')
        expect(cache.activeHash).toBe('a')
    })

    it('release() disposes and clears active/pending references', () => {
        const dispose = vi.fn()
        const cache = createPipelineCache<{id: string}>({dispose})
        cache.getOrBuild('a', () => ({id: 'a'}))
        cache.release('a')
        expect(dispose).toHaveBeenCalledWith({id: 'a'}, 'a')
        expect(cache.activeHash).toBeNull()
        expect(cache.has('a')).toBe(false)
    })
})
