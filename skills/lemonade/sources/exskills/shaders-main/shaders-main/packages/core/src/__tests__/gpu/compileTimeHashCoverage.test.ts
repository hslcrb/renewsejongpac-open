import {describe, it, expect} from 'vitest'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import {getAllShaders} from '@coreroot/shaderRegistry'
import type {GpuShaderDefinition, GpuUniformsMap} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'

/**
 * GENERIC compile-time hash-coverage enforcement (FIX-N systemic gate).
 *
 * A compile-time input is any prop that selects the emitted WGSL / the pass set at compose time:
 *   - `compileTime: true`      — every value change recompiles; folded into the base structural
 *                                hash's `ct:` segment (composer.ts collectStructuralHashInputs).
 *   - `compileTimeWhen(p,n)`   — recompiles only when the predicate fires (a threshold crossing,
 *                                an effective-count change); folded into the renderer's
 *                                extraHashInputs (`ctw:` for primitive buckets, `stops:` for the
 *                                colorStops effective count).
 *
 * The recurring bug class (colorStops effective count, layer transform edges, Glass frosted blur)
 * is a compile-time input whose recompose fires but whose value never reaches the structural hash,
 * so `pipelineCache.getOrBuild` serves the STALE pipeline and the control does nothing live until
 * an unrelated change forces a rebuild. This test makes that class un-shippable: for EVERY shader
 * in the registry, for EVERY compile-time prop, it mutates the prop ACROSS its compile-relevant
 * boundary and asserts the structural hash CHANGES; and, where a distinct same-bucket value exists,
 * asserts a same-bucket edit leaves the hash STABLE (the fast in-place path is preserved).
 *
 * GPU-free: the renderer is forced ready without a device; computeStructuralHash reads the live
 * node uniforms (sotHandleView), so both hash segments see current values.
 */

const Root: GpuShaderDefinition = {name: 'Root', props: {} as never, fragment: (() => ({})) as never}
const meta = (): NodeMetadata => ({blendMode: 'normal', opacity: undefined, renderOrder: 0}) as NodeMetadata

interface PropConfigLike {
    default: unknown
    compileTime?: boolean
    compileTimeWhen?: (prev: unknown, next: unknown) => boolean
    ui?: {type?: unknown; min?: number; max?: number; options?: unknown[]}
}

// Candidate pools to search with the real predicate / to pick a distinct compileTime value.
const NUMERIC_POOL = [0, 0.005, 0.5, 1, 2, 5, 8, 10, 20, 50, 50.4, 100, 128, 360]
const BOOL_POOL = [true, false]
// color-stop-shaped arrays of varying effective count (the only object-valued compileTimeWhen prop
// is the shared gradient `stops`, whose predicate keys on effective count `n > 1 ? n : 0`).
const stops = (colors: string[]): {color: string; position: number}[] =>
    colors.map((color, i) => ({color, position: colors.length <= 1 ? 0 : i / (colors.length - 1)}))
const ARRAY_POOL: unknown[] = [
    null,
    [],
    stops(['#ff0000']), // effective count 0
    stops(['#ff0000', '#0000ff']), // count 2
    stops(['#ffffff', '#000000']), // count 2, different colors (same bucket as the one above)
    stops(['#ff0000', '#00ff00', '#0000ff']), // count 3
]

const ser = (v: unknown): string => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v))
const poolFor = (def: unknown): unknown[] =>
    typeof def === 'number' ? NUMERIC_POOL : typeof def === 'boolean' ? BOOL_POOL : ARRAY_POOL

function uniformsFor(def: GpuShaderDefinition, id: string): GpuUniformsMap {
    const reactive: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(def.props ?? {})) reactive[name] = (cfg as {default: unknown}).default
    return createGpuUniformsMap(def as never, reactive, id) as unknown as GpuUniformsMap
}

/** Fresh renderer with the shader mounted (all defaults) under an invisible root. */
function mount(def: GpuShaderDefinition) {
    const r = shaderRendererGPU()
    r.__testing.setTestReady({width: 200, height: 200})
    r.registerNode('root', Root.fragment, null, meta(), {} as never, Root)
    r.registerNode('n0', def.fragment, 'root', meta(), uniformsFor(def, 'n0') as never, def)
    return r
}

/** For a compileTime prop: a value whose String() differs from the default's (any change recompiles). */
function pickDistinct(cfg: PropConfigLike): {ok: true; value: unknown} | {ok: false} {
    const def = cfg.default
    const options = cfg.ui?.options
    if (Array.isArray(options)) {
        for (const o of options) {
            const v = o && typeof o === 'object' && 'value' in (o as object) ? (o as {value: unknown}).value : o
            if (ser(v) !== ser(def)) return {ok: true, value: v}
        }
    }
    if (typeof def === 'boolean') return {ok: true, value: !def}
    if (typeof def === 'number') {
        for (const c of [cfg.ui?.max, cfg.ui?.min, def + 1, def - 1, 0, 1, 2, 5]) {
            if (typeof c === 'number' && ser(c) !== ser(def)) return {ok: true, value: c}
        }
    }
    if (typeof def === 'string') return {ok: true, value: def === '' ? 'coverage-alt' : `${def}-alt`}
    if (def === null) return {ok: true, value: 'coverage-alt'}
    return {ok: false}
}

const allShaders = getAllShaders()

describe('compile-time hash coverage — every compile-time prop reaches the structural hash', () => {
    it('sanity: the shader registry loaded a full roster', () => {
        expect(allShaders.length).toBeGreaterThan(100)
    })

    it('every `compileTime: true` prop changes the hash when its value changes', () => {
        const problems: string[] = []
        let tested = 0
        for (const entry of allShaders) {
            const def = entry.definition as GpuShaderDefinition
            for (const [prop, cfgRaw] of Object.entries(def.props ?? {})) {
                const cfg = cfgRaw as PropConfigLike
                if (cfg.compileTime !== true) continue
                let r
                try {
                    r = mount(def)
                } catch (e) {
                    problems.push(`${def.name}: mount threw — ${String(e)}`)
                    break
                }
                const pick = pickDistinct(cfg)
                if (!pick.ok) {
                    problems.push(`${def.name}.${prop}: could not derive a distinct compileTime value (default=${ser(cfg.default)})`)
                    continue
                }
                const h0 = r.__testing.computeStructuralHash()
                try {
                    r.updateUniformValue('n0', prop, pick.value)
                } catch (e) {
                    problems.push(`${def.name}.${prop}: updateUniformValue threw — ${String(e)}`)
                    continue
                }
                const h1 = r.__testing.computeStructuralHash()
                if (h1 === h0) {
                    problems.push(`${def.name}.${prop}: compileTime prop ${ser(cfg.default)}→${ser(pick.value)} did NOT change the structural hash`)
                }
                tested++
            }
        }
        expect(tested).toBeGreaterThan(100) // colorSpace alone appears on dozens of shaders
        expect(problems).toEqual([])
    })

    it('every `compileTimeWhen` prop crosses the hash on a boundary change and stays stable within a bucket', () => {
        const problems: string[] = []
        let crossTested = 0
        let sameBucketTested = 0
        for (const entry of allShaders) {
            const def = entry.definition as GpuShaderDefinition
            for (const [prop, cfgRaw] of Object.entries(def.props ?? {})) {
                const cfg = cfgRaw as PropConfigLike
                const pred = cfg.compileTimeWhen
                if (!pred) continue
                const pool = poolFor(cfg.default)

                // (1) boundary crossing MUST change the hash — the core invariant.
                const crossValue = pool.find((c) => {
                    try {
                        return pred(cfg.default, c) === true
                    } catch {
                        return false
                    }
                })
                if (crossValue === undefined && !pool.includes(undefined)) {
                    problems.push(`${def.name}.${prop}: no boundary-crossing candidate found in the pool (default=${ser(cfg.default)}) — add one or cover explicitly`)
                    continue
                }
                let r
                try {
                    r = mount(def)
                } catch (e) {
                    problems.push(`${def.name}: mount threw — ${String(e)}`)
                    break
                }
                const hBase = r.__testing.computeStructuralHash()
                try {
                    r.updateUniformValue('n0', prop, crossValue)
                } catch (e) {
                    problems.push(`${def.name}.${prop}: updateUniformValue(cross) threw — ${String(e)}`)
                    continue
                }
                if (r.__testing.computeStructuralHash() === hBase) {
                    problems.push(`${def.name}.${prop}: crossing the compileTimeWhen boundary ${ser(cfg.default)}→${ser(crossValue)} did NOT change the structural hash`)
                }
                crossTested++

                // (2) a same-bucket edit (distinct value, predicate does NOT fire) keeps the hash
                // stable — the fast in-place path. Best-effort: only when the bucket holds >1 value.
                const sameBucket = pool.find((c) => {
                    try {
                        return pred(cfg.default, c) === false && ser(c) !== ser(cfg.default)
                    } catch {
                        return false
                    }
                })
                if (sameBucket !== undefined) {
                    let r2
                    try {
                        r2 = mount(def)
                    } catch {
                        continue
                    }
                    const h2 = r2.__testing.computeStructuralHash()
                    r2.__testing.clearStructuralDirty()
                    try {
                        r2.updateUniformValue('n0', prop, sameBucket)
                    } catch {
                        continue
                    }
                    if (r2.__testing.computeStructuralHash() !== h2) {
                        problems.push(`${def.name}.${prop}: a same-bucket edit ${ser(cfg.default)}→${ser(sameBucket)} CHANGED the hash (fast-path lost)`)
                    }
                    if (r2.__testing.isStructuralDirty()) {
                        problems.push(`${def.name}.${prop}: a same-bucket edit ${ser(cfg.default)}→${ser(sameBucket)} scheduled a recompose (should be in-place)`)
                    }
                    sameBucketTested++
                }
            }
        }
        // The known compileTimeWhen roster (illustrative, not authoritative — see the derived count
        // below): Glass(blur,aberration), FlutedGlass(aberration), HueShift(shift), Sharpness,
        // Saturation, Glow(size), GridDistortion(gridSize), Repeater(hueShift), FilmStock(halation),
        // ParticleFlow(trails), Watercolor(bleed,strength,paper), Surface3D(lighting,cursorIntensity,
        // octaves) + the shared gradient `stops` prop (registered on every multi-stop gradient shader).
        //
        // Derived rather than hardcoded: every registered `compileTimeWhen` prop must either land in
        // `crossTested` or `problems` above (there's no third outcome), so if `problems` is empty this
        // is an exact equality, not a floor — a future prop that's silently skipped (e.g. a bug that
        // makes the loop miss it) fails here even though it can't produce a `problems` entry.
        const totalCompileTimeWhenProps = allShaders.reduce((n, entry) => {
            const def = entry.definition as GpuShaderDefinition
            return n + Object.values(def.props ?? {}).filter((cfg) => typeof (cfg as PropConfigLike).compileTimeWhen === 'function').length
        }, 0)
        expect(totalCompileTimeWhenProps).toBeGreaterThanOrEqual(11)
        expect(crossTested).toBe(totalCompileTimeWhenProps)
        expect(sameBucketTested).toBeGreaterThan(0)
        expect(problems).toEqual([])
    })
})
