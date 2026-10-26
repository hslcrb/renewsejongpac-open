import {describe, it, expect} from 'vitest'
import {d} from '@coreroot/gpu/kit'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import {
    listPropConfig, listSpecOf, resolveListItems, packList, listFieldName, listCountName,
    listDriverPath, parseListDriverPath, listHasDrivers, listPropTransform,
} from '@coreroot/utilities/listProps'
import Irradiance from '@coreroot/shaders/Irradiance/index'
import type {GpuShaderDefinition} from '@coreroot/gpu/contract'

/**
 * List props — the generic array-valued prop mechanism (utilities/listProps + the bridge's
 * expansion). Irradiance's `lights` is the first consumer.
 */
const rgba = (hex: string): [number, number, number, number] => (hex === '#ffffff' ? [1, 1, 1, 1] : [0.5, 0.25, 0, 1])

describe('listProps (a) declaration + resolution + packing', () => {
    const cfg = listPropConfig<{position: {x: number; y: number}; color: string; intensity: number}>({
        maxItems: 4,
        item: {
            position: {kind: 'position', default: {x: 0.5, y: 0.5}},
            color: {kind: 'color', default: '#ffffff'},
            intensity: {kind: 'number', default: 1},
        },
    }, {default: [], description: 'd', label: 'L', group: 'G'})

    it('declares a list ui carrying the item spec; the marker transform identifies it', () => {
        expect(cfg.ui?.type).toBe('list')
        expect(cfg.transform).toBe(listPropTransform)
        expect(listSpecOf(cfg)?.maxItems).toBe(4)
        expect(Object.keys(listSpecOf(cfg)!.item)).toEqual(['position', 'color', 'intensity'])
    })

    it('resolves positions to the stored (x, 1−y) convention, colors to rgba, fills defaults, caps at maxItems', () => {
        const spec = listSpecOf(cfg)!
        const items = resolveListItems([
            {position: {x: 0.2, y: 0.8}, color: '#abcdef', intensity: 2},
            {}, {}, {}, {position: {x: 0, y: 0}},
        ], spec, {color: rgba})
        expect(items.length).toBe(4)
        expect(items[0].position).toEqual({x: 0.2, y: 1 - 0.8})
        expect(items[0].color).toEqual([0.5, 0.25, 0, 1])
        expect(items[0].intensity).toBe(2)
        expect(items[1].position).toEqual({x: 0.5, y: 0.5})
        expect(items[1].intensity).toBe(1)
    })

    it('substitutes a driven position live, or parks it at the driver origin before the first tick', () => {
        const spec = listSpecOf(cfg)!
        const driver = {type: 'mouse-position' as const, originX: 0.1, originY: 0.9}
        const parked = resolveListItems([{position: driver}], spec, {color: rgba})
        expect(parked[0].position).toEqual({x: 0.1, y: 1 - 0.9})
        const live = resolveListItems([{position: driver}], spec, {color: rgba, drivenPosition: () => ({x: 0.3, y: 0.4})})
        expect(live[0].position).toEqual({x: 0.3, y: 0.4})
        expect(listHasDrivers([{position: driver}], spec)).toBe(true)
        expect(listHasDrivers([{position: {x: 0, y: 0}}], spec)).toBe(false)
    })

    it('packs flat maxItems×4 lanes per field + the count', () => {
        const spec = listSpecOf(cfg)!
        const items = resolveListItems([{position: {x: 0.2, y: 0.8}, color: '#abcdef', intensity: 2}], spec, {color: rgba})
        const packed = packList(items, spec)
        expect(packed.count).toBe(1)
        expect(packed.fields.position.length).toBe(16)
        expect(packed.fields.position.slice(0, 4)).toEqual([0.2, 1 - 0.8, 0, 0])
        expect(packed.fields.color.slice(0, 4)).toEqual([0.5, 0.25, 0, 1])
        expect(packed.fields.intensity.slice(0, 4)).toEqual([2, 0, 0, 0])
        expect(packed.fields.intensity.slice(4)).toEqual(new Array(12).fill(0))
    })

    it('driver paths round-trip', () => {
        expect(listDriverPath('lights', 2, 'position')).toBe('lights.2.position')
        expect(parseListDriverPath('lights.2.position')).toEqual({prop: 'lights', index: 2, field: 'position'})
        expect(parseListDriverPath('center')).toBeNull()
    })
})

describe('listProps (b) bridge expansion for Irradiance.lights', () => {
    it('expands into per-field vec4 arrays + a runtime count + a cpu mirror of the resolved items', () => {
        const def = Irradiance as GpuShaderDefinition
        const props: Record<string, unknown> = {}
        for (const [k, c] of Object.entries(def.props)) props[k] = (c as {default: unknown}).default
        const map = createGpuUniformsMap(def as never, props, 'n')
        expect(map.lights.cpu).toBe(true)
        expect(map.lights.transform).toBe(listPropTransform)
        expect(Array.isArray(map.lights.value)).toBe(true)
        expect((map.lights.value as unknown[]).length).toBe(2)
        expect(map[listCountName('lights')].value).toBe(2)
        expect(map[listCountName('lights')].schema).toBe(d.f32)
        for (const f of ['position', 'color', 'intensity']) {
            const u = map[listFieldName('lights', f)]
            expect(u.schema).toBeDefined()
            expect((u.value as number[]).length).toBe(6 * 4)
        }
        // No compile-time coupling: adding a light is a uniform patch, never a recompile.
        expect(map.lights.compileTime).toBe(false)
        expect(map.lights.compileTimeWhen).toBeUndefined()
    })
})
