import {describe, it, expect} from 'vitest'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import {colorToRGBA} from '@coreroot/gpu/transforms'
import LinearGradient from '@coreroot/shaders/LinearGradient/index'
import type {GpuShaderDefinition, GpuUniformsMap} from '@coreroot/gpu/contract'
import type {NodeMetadata} from '@coreroot/types'

/**
 * d1a colorStops runtime-edit repack gate (gpu/index.ts updateUniformValue). A colorStops prop
 * expands into a cpu `stops` mirror + four packed struct fields; editing `stops` at runtime must
 * re-pack all four (v1's updateColorStopsUniforms). GPU-free: the renderer is forced ready without
 * a device (`_liveHandles` stay null → only the `.value` mirrors update, which is what a recompose
 * re-seeds from and what this asserts).
 *
 *   - count change (2 → 3 stops)   → schedules a recompose (compileTimeWhen) AND re-packs the arrays
 *   - same-count edit (3 → 3 stops) → patches the arrays in place, NO recompose
 */

const Root: GpuShaderDefinition = {name: 'Root', props: {} as never, fragment: (() => ({})) as never}
const LG = LinearGradient as GpuShaderDefinition
const meta = (): NodeMetadata => ({blendMode: 'normal', opacity: undefined, renderOrder: 0}) as NodeMetadata

function uniformsFor(stops: unknown): GpuUniformsMap {
    const reactive: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(LG.props)) reactive[name] = (cfg as {default: unknown}).default
    reactive.stops = stops
    return createGpuUniformsMap(LG as never, reactive, 'lg') as unknown as GpuUniformsMap
}

const TWO = [
    {color: '#ff0000', position: 0},
    {color: '#0000ff', position: 1},
]
const THREE = [
    {color: '#ff0000', position: 0},
    {color: '#00ff00', position: 0.5},
    {color: '#0000ff', position: 1},
]
const THREE_RECOLORED = [
    {color: '#ffffff', position: 0}, // white — distinguishable from #ff0000
    {color: '#00ff00', position: 0.5},
    {color: '#0000ff', position: 1},
]

function mount(stops: unknown) {
    const r = shaderRendererGPU()
    r.__testing.setTestReady({width: 100, height: 100})
    r.registerNode('root', Root.fragment, null, meta(), {} as never, Root)
    r.registerNode('lg', LG.fragment, 'root', meta(), uniformsFor(stops) as never, LG)
    const node = r.__testing.getNodeRegistry().nodes.get('lg')!
    return {r, node}
}

describe('colorStops — effective count is in the structural hash (FIX-J)', () => {
    // The shader's `stopCount > 1` two-color↔multi-stop selection is a COMPILE-TIME branch, so a
    // count change must produce a DIFFERENT structural hash — otherwise getOrBuild hands back the
    // stale composition and the gradient stays stuck on whichever path it first built. This is the
    // exact editor bug: a layer created with default colorA/colorB (effective count 0) whose stops
    // are then materialised stayed two-color, so recolors had no visible effect — until an
    // unrelated recompose (colorSpace switch / added layer) forced a real rebuild.
    const ONE = [{color: '#ff0000', position: 0}] // effective count 0 (n <= 1 → two-color path)

    it('materialising stops (0 → 2) changes the hash so the composition actually rebuilds', () => {
        const {r} = mount(null) // stops=null → effective count 0
        const h0 = r.__testing.computeStructuralHash()
        r.updateUniformValue('lg', 'stops', TWO)
        expect(r.__testing.computeStructuralHash()).not.toBe(h0)
    })

    it('a single stop (effective 0) hashes the same as null, and 1 → 3 rebuilds', () => {
        const {r} = mount(ONE)
        const hOne = r.__testing.computeStructuralHash()
        const {r: rNull} = mount(null)
        expect(rNull.__testing.computeStructuralHash()).toBe(hOne) // both are the two-color path
        r.updateUniformValue('lg', 'stops', THREE)
        expect(r.__testing.computeStructuralHash()).not.toBe(hOne)
    })

    it('a same-count recolor (3 → 3) keeps the hash STABLE (in-place patch, no rebuild)', () => {
        const {r} = mount(THREE)
        const h3 = r.__testing.computeStructuralHash()
        r.updateUniformValue('lg', 'stops', THREE_RECOLORED)
        expect(r.__testing.computeStructuralHash()).toBe(h3)
    })

    it('a count change among multi-stop values (2 → 3) changes the hash', () => {
        const {r} = mount(TWO)
        const h2 = r.__testing.computeStructuralHash()
        r.updateUniformValue('lg', 'stops', THREE)
        expect(r.__testing.computeStructuralHash()).not.toBe(h2)
    })

    // Undo/redo bumps structureVersion → PresetRenderer REMOUNTS → the node is removeNode()'d then
    // registerNode()'d with the restored values. A same-count recolor keeps the hash STABLE, so
    // that remount lands on the SAME cached composition — which is exactly why bindComposition must
    // re-seed the store from the re-registered node's `.value` instead of early-returning. This
    // guards the precondition; the store re-seed itself is verified by the real-GPU colorstops-probe
    // (the compose/render path needs a device, so it is not unit-testable here).
    it('remove + re-register with recolored same-count stops keeps the hash stable', () => {
        const {r} = mount(THREE)
        const h = r.__testing.computeStructuralHash()
        r.registerNode('lg', null as never, null, null) // remount step 1: unmount → removeNode
        r.registerNode('lg', LG.fragment, 'root', meta(), uniformsFor(THREE_RECOLORED) as never, LG)
        expect(r.__testing.computeStructuralHash()).toBe(h)
    })
})

describe('colorStops repack — count change', () => {
    it('re-packs the arrays AND schedules a recompose when the effective stop count changes', () => {
        const {r, node} = mount(TWO)
        expect((node.uniforms as Record<string, {value: unknown}>).stopCount.value).toBe(2)
        r.__testing.clearStructuralDirty()

        r.updateUniformValue('lg', 'stops', THREE)

        // Recompose scheduled (2 → 3 crosses the effective-count boundary).
        expect(r.__testing.isStructuralDirty()).toBe(true)
        // Arrays re-packed: stopCount now 3, and the middle stop (#00ff00) landed in colorsArray[1]
        // exactly as the color transform produces it (P3-linear green is not a pure channel).
        const u = node.uniforms as Record<string, {value: unknown}>
        expect(u.stopCount.value).toBe(3)
        const colors = u.colorsArray.value as number[]
        const green = colorToRGBA('#00ff00')
        expect(colors[4 + 0]).toBeCloseTo(green[0], 5)
        expect(colors[4 + 1]).toBeCloseTo(green[1], 5)
        expect(colors[4 + 2]).toBeCloseTo(green[2], 5)
        expect(colors[4 + 3]).toBeCloseTo(green[3], 5)
    })
})

describe('colorStops repack — same-count edit', () => {
    it('patches the arrays in place with NO recompose when the count is unchanged', () => {
        const {r, node} = mount(THREE)
        r.__testing.clearStructuralDirty()

        r.updateUniformValue('lg', 'stops', THREE_RECOLORED)

        // No recompose (3 → 3 is a same-count edit).
        expect(r.__testing.isStructuralDirty()).toBe(false)
        // But the arrays DID update: stop 0 is now white (#ffffff → all channels high).
        const u = node.uniforms as Record<string, {value: unknown}>
        expect(u.stopCount.value).toBe(3)
        const colors = u.colorsArray.value as number[]
        expect(colors[0]).toBeGreaterThan(0.5) // r of stop 0 (white)
        expect(colors[1]).toBeGreaterThan(0.5) // g of stop 0
        expect(colors[2]).toBeGreaterThan(0.5) // b of stop 0
    })
})

describe('colorStops repack — convertedColorsArray at the active mode', () => {
    it('linear mode packs converted == raw P3 (identity); the arrays stay length-consistent', () => {
        const {r, node} = mount(THREE)
        r.updateUniformValue('lg', 'stops', THREE_RECOLORED)
        const u = node.uniforms as Record<string, {value: unknown}>
        const colors = u.colorsArray.value as number[]
        const converted = u.convertedColorsArray.value as number[]
        // Mode 0 (linear default): converted rgb == raw rgb for each active stop.
        for (let i = 0; i < 3; i++) {
            expect(converted[i * 3]).toBeCloseTo(colors[i * 4], 5)
            expect(converted[i * 3 + 1]).toBeCloseTo(colors[i * 4 + 1], 5)
            expect(converted[i * 3 + 2]).toBeCloseTo(colors[i * 4 + 2], 5)
        }
    })
})

describe('colorStops repack — live colorSpace switch (e0)', () => {
    it('re-packs convertedColorsArray at the NEW mode AND schedules a recompose on a colorSpace change', () => {
        const {r, node} = mount(THREE)
        const u = node.uniforms as Record<string, {value: unknown}>
        // Baseline: linear (mode 0) → converted == raw P3.
        const linearConverted = (u.convertedColorsArray.value as number[]).slice()
        const colors = u.colorsArray.value as number[]
        for (let i = 0; i < 3; i++) {
            expect(linearConverted[i * 3]).toBeCloseTo(colors[i * 4], 5)
        }
        r.__testing.clearStructuralDirty()

        // Switch to OKLCh (mode 1). colorSpace is compileTime → must recompose,
        // AND convertedColorsArray must be re-seeded at the new mode BEFORE that recompose.
        r.updateUniformValue('lg', 'colorSpace', 'oklch')

        // Recompose scheduled (colorSpace is compileTime).
        expect(r.__testing.isStructuralDirty()).toBe(true)
        // convertedColorsArray now holds OKLCh coordinates — different from the linear P3 values
        // (a stale re-seed would leave these byte-identical to the linear baseline).
        const oklchConverted = u.convertedColorsArray.value as number[]
        let changed = false
        for (let i = 0; i < oklchConverted.length; i++) {
            if (Math.abs(oklchConverted[i] - linearConverted[i]) > 1e-4) changed = true
        }
        expect(changed).toBe(true)
        // Length stays consistent (still 3 stops → 9 vec3-packed floats used).
        expect(u.stopCount.value).toBe(3)
    })
})
