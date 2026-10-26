import {describe, it, expect, vi} from 'vitest'
import {tgpu, d} from '@coreroot/gpu/kit'
import {
    createUniformStore,
    FieldHandle,
    ArrayFieldHandle,
    VectorFieldView,
    updateFieldValue,
    sanitizeId,
    nodeKey,
    inferFieldSchema,
    UNIFORM_ENTRY_KEY,
} from '@coreroot/gpu/uniformStore'
import {transformBoolean} from '@coreroot/utilities/transformations'

// Faithful stand-ins for the three-based color/position transforms. transformColor /
// transformPosition return `{ node, data: new Vector4|Vector2(...) }`, but the shared
// `three` mock in __tests__/setup.ts implements Vector4/Vector2 as arrow functions, which
// are not `new`-able under vitest — so we mirror only their CPU output shape here (a
// `{ node, data }` pair whose `data` is Vector-like). transformBoolean is pure and used real.
const fakeTransformColor = (hex: string) => {
    const table: Record<string, [number, number, number, number]> = {
        '#ffffff': [1, 1, 1, 1],
        '#ff0000': [1, 0, 0, 1],
    }
    const [r, g, b, a] = table[hex] ?? [0, 0, 0, 0]
    return {node: null, data: {x: r, y: g, z: b, w: a}}
}
const fakeTransformPosition = (p: {x: number; y: number}) => ({
    node: null,
    data: {x: p.x, y: 1 - p.y}, // Y-flip, exactly as transformPosition does
})

/**
 * B2 uniformStore tests. No GPU under vitest, so the root/buffer layer is mocked with vi.fns
 * (mirrors how TypeGPU's own suite mocks the device). We assert:
 *   - struct schema shapes build correctly + resolve to valid WGSL (tgpu.resolve snapshot),
 *   - FieldHandle set → coalesce → flush produces ONE merged patch object,
 *   - sparse + whole-array patches for ArrayFieldHandle,
 *   - sanitization, JS-value → schema mapping, transform integration.
 */

interface MockBuffer {
    patch: ReturnType<typeof vi.fn>
    write: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
    $usage: ReturnType<typeof vi.fn>
}

function mockRoot() {
    const buffer: MockBuffer = {
        patch: vi.fn(),
        write: vi.fn(),
        destroy: vi.fn(),
        $usage: vi.fn(() => buffer),
    }
    const createBuffer = vi.fn(() => buffer)
    const createBindGroup = vi.fn(() => ({resourceType: 'bind-group'}))
    const root = {createBuffer, createBindGroup} as never
    return {root, buffer, createBuffer, createBindGroup}
}

describe('uniformStore — naming', () => {
    it('sanitizes ids to WGSL-safe identifiers', () => {
        expect(sanitizeId('layer-3.abc')).toBe('layer_3_abc')
        expect(sanitizeId('0.123456')).toBe('0_123456')
        expect(nodeKey('layer-3.abc')).toBe('n_layer_3_abc')
    })
})

describe('uniformStore — schema inference (§2.2/§5.2)', () => {
    it('maps JS values to schema fields', () => {
        expect((inferFieldSchema(1) as {type: string}).type).toBe('f32')
        expect((inferFieldSchema(true) as {type: string}).type).toBe('f32')
        expect((inferFieldSchema({x: 0.5, y: 0.5}) as {type: string}).type).toBe('vec2f')
        expect((inferFieldSchema({x: 1, y: 2, z: 3}) as {type: string}).type).toBe('vec3f')
        expect((inferFieldSchema({x: 1, y: 2, z: 3, w: 4}) as {type: string}).type).toBe('vec4f')
        const arr = inferFieldSchema([0, 0, 0, 0]) as {type: string; elementCount: number}
        expect(arr.type).toBe('array')
        expect(arr.elementCount).toBe(4)
        // d.vec4f instances (own `.kind`) infer as vec4f
        expect((inferFieldSchema(d.vec4f(1, 0, 0, 1)) as {type: string}).type).toBe('vec4f')
    })
})

describe('uniformStore — FieldHandle scalar coalesce/flush', () => {
    it('coalesces multiple scalar writes into ONE merged patch', () => {
        const {root, buffer} = mockRoot()
        const store = createUniformStore(root)
        const a = store.defineNode('layer-a', [
            {name: 'speed', initial: 1},
            {name: 'scale', initial: 2},
        ]) as {speed: FieldHandle; scale: FieldHandle}
        const b = store.defineNode('layer-b', [{name: 'speed', initial: 0}]) as {speed: FieldHandle}
        store.finalize()
        buffer.write.mockClear()

        // Multiple writes across two nodes within one "frame".
        a.speed.value = 5
        a.speed.value = 7 // last write wins
        a.scale.value = 9
        b.speed.value = 3

        expect(buffer.patch).not.toHaveBeenCalled() // nothing until flush
        store.flush()

        expect(buffer.patch).toHaveBeenCalledTimes(1)
        expect(buffer.patch).toHaveBeenCalledWith({
            n_layer_a: {speed: 7, scale: 9},
            n_layer_b: {speed: 3},
        })

        // A second flush with no changes is a no-op.
        store.flush()
        expect(buffer.patch).toHaveBeenCalledTimes(1)
    })

    it('reads the CPU mirror through .value', () => {
        const {root} = mockRoot()
        const store = createUniformStore(root)
        const {cutout} = store.defineNode('x', [{name: 'cutout', initial: 1}]) as {cutout: FieldHandle}
        store.finalize()
        expect(cutout.value).toBe(1)
        cutout.value = -1
        expect(cutout.value === 1).toBe(false)
        expect(cutout.value).toBe(-1)
    })
})

describe('uniformStore — FieldHandle vector in-place semantics', () => {
    it('supports .value.copy(), .value.set(), component writes, and vec-instance assignment', () => {
        const {root, buffer} = mockRoot()
        const store = createUniformStore(root)
        const {center, color} = store.defineNode('v', [
            {name: 'center', schema: d.vec2f, initial: {x: 0.5, y: 0.5}},
            {name: 'color', schema: d.vec4f, initial: [1, 1, 1, 1]},
        ]) as {center: FieldHandle; color: FieldHandle}
        store.finalize()

        // .value getter returns a live VectorFieldView for vector fields.
        expect(center.value).toBeInstanceOf(VectorFieldView)

        // three's `.value.set(x, y)` idiom (driver code).
        ;(center.value as VectorFieldView).set(0.25, 0.75)
        // three's `.value.copy(vectorLike)` idiom (updateUniformValue).
        ;(color.value as VectorFieldView).copy({x: 1, y: 0, z: 0, w: 1})

        store.flush()
        expect(buffer.patch).toHaveBeenCalledWith({
            n_v: {center: [0.25, 0.75], color: [1, 0, 0, 1]},
        })

        // Component write routes through the patch too.
        buffer.patch.mockClear()
        ;(center.value as VectorFieldView).x = 0.1
        store.flush()
        expect(buffer.patch).toHaveBeenCalledWith({n_v: {center: [0.1, 0.75]}})

        // Assigning a d.vec4f instance directly (f32 readback → compare with tolerance).
        buffer.patch.mockClear()
        color.value = d.vec4f(0.2, 0.3, 0.4, 0.5)
        store.flush()
        const payload = buffer.patch.mock.calls[0][0].n_v.color as number[]
        ;[0.2, 0.3, 0.4, 0.5].forEach((expected, i) => expect(payload[i]).toBeCloseTo(expected, 5))
    })
})

describe('uniformStore — ArrayFieldHandle (colorStops shape)', () => {
    it('whole-array and sparse element patches', () => {
        const {root, buffer} = mockRoot()
        const store = createUniformStore(root)
        const {colors} = store.defineNode('grad', [
            {name: 'colors', schema: d.arrayOf(d.f32, 8), initial: new Array(8).fill(0)},
        ]) as {colors: ArrayFieldHandle}
        store.finalize()

        expect(colors).toBeInstanceOf(ArrayFieldHandle)

        // Mutate-and-reassign (three's UniformArrayNode idiom) → whole-array patch.
        const arr = colors.array
        arr[0] = 1
        arr[1] = 0.5
        colors.array = arr
        store.flush()
        expect(buffer.patch).toHaveBeenCalledWith({n_grad: {colors: [1, 0.5, 0, 0, 0, 0, 0, 0]}})

        // Sparse single-element writes coalesce into a Record<index, value>.
        buffer.patch.mockClear()
        colors.setElement(3, 0.9)
        colors.setElement(5, 0.2)
        store.flush()
        expect(buffer.patch).toHaveBeenCalledWith({n_grad: {colors: {3: 0.9, 5: 0.2}}})
    })
})

describe('uniformStore — transform integration (§5.2)', () => {
    it('applies transforms and unwraps the { node, data } pair via setFromRaw', () => {
        const {root, buffer} = mockRoot()
        const store = createUniformStore(root)
        const {color, center, flag} = store.defineNode('t', [
            {name: 'color', initial: '#ffffff', transform: fakeTransformColor as (v: unknown) => unknown},
            {name: 'center', initial: {x: 0.5, y: 0.5}, transform: fakeTransformPosition as (v: unknown) => unknown},
            {name: 'flag', initial: true, transform: transformBoolean as (v: unknown) => unknown},
        ]) as {color: FieldHandle; center: FieldHandle; flag: FieldHandle}
        store.finalize()

        // Schema inferred from the transformed initial values (unwrapping { node, data }).
        expect(color.schema && (color.schema as {type: string}).type).toBe('vec4f')
        expect(center.schema && (center.schema as {type: string}).type).toBe('vec2f')
        expect(flag.schema && (flag.schema as {type: string}).type).toBe('f32')

        // Boolean encodes ±1 (real transformBoolean).
        expect(flag.value).toBe(1)
        updateFieldValue(flag, false)
        expect(flag.value).toBe(-1)

        // Color transform via the raw setter → mirror matches the transform's `.data`.
        updateFieldValue(color, '#ff0000')
        expect((color.value as VectorFieldView).toArray()).toEqual([1, 0, 0, 1])

        // Position transform applies the Y-flip (y → 1 - y).
        updateFieldValue(center, {x: 0.2, y: 0})
        expect((center.value as VectorFieldView).toArray()).toEqual([0.2, 1])

        store.flush()
        expect(buffer.patch).toHaveBeenCalledTimes(1)
    })
})

describe('uniformStore — CPU-only props', () => {
    it('keeps strings out of the struct and mirror-only', () => {
        const {root} = mockRoot()
        const store = createUniformStore(root)
        const {url, origin} = store.defineNode('media', [
            {name: 'url', initial: 'https://example.com/x.png'},
            {name: 'origin', initial: 'center'},
        ]) as {url: FieldHandle; origin: FieldHandle}
        const result = store.finalize()

        expect(url.cpu).toBe(true)
        expect(origin.value).toBe('center')
        origin.value = 'top-left'
        expect(origin.value).toBe('top-left')

        // No CPU-only fields leak into the node's struct — an all-cpu node gets ONLY the
        // 16-byte pad block (an empty struct would be invalid WGSL and break sizeOf).
        const nodeStruct = (result.schema.propTypes as Record<string, {propTypes?: object}>).n_media
        expect(Object.keys(nodeStruct?.propTypes ?? {})).toEqual(['_pad0', '_pad1', '_pad2', '_pad3'])
    })
})

describe('uniformStore — writeAll + gpuAccessor + finalize wiring', () => {
    it('seeds the buffer, exposes the layout entry, and builds GPU accessors', () => {
        const {root, buffer, createBuffer, createBindGroup} = mockRoot()
        const store = createUniformStore(root)
        const {speed} = store.defineNode('x3', [{name: 'speed', initial: 4}]) as {speed: FieldHandle}
        const result = store.finalize()

        // finalize seeds the buffer once with the full tree (incl. _sys defaults).
        expect(createBuffer).toHaveBeenCalledTimes(1)
        expect(buffer.$usage).toHaveBeenCalledWith('uniform')
        expect(createBindGroup).toHaveBeenCalledTimes(1)
        expect(buffer.write).toHaveBeenCalledTimes(1)
        const seeded = buffer.write.mock.calls[0][0]
        // A lone f32 node is padded to 16 bytes for strict uniform layout; the pads are
        // seeded as zeros so whole-buffer writes never leave NaN bytes.
        expect(seeded.n_x3).toEqual({speed: 4, _pad0: 0, _pad1: 0, _pad2: 0})
        expect(seeded._sys).toBeDefined()

        // GPU reference contract.
        expect(speed.gpuPath).toEqual(['n_x3', 'speed'])
        expect(speed.accessorPath).toBe('n_x3.speed')
        expect(result.uniformEntryKey).toBe(UNIFORM_ENTRY_KEY)
        expect(store.gpuAccessor(speed)).toBe('layout.$.uniforms.n_x3.speed')
        expect(store.gpuAccessor(speed, 'lyt')).toBe('lyt.$.uniforms.n_x3.speed')

        // writeAll performs a full buffer write from mirrors.
        buffer.write.mockClear()
        store.writeAll()
        expect(buffer.write).toHaveBeenCalledTimes(1)
    })
})

describe('uniformStore — WGSL schema validity (resolve gate)', () => {
    it('the combined struct resolves to valid WGSL', () => {
        const {root} = mockRoot()
        const store = createUniformStore(root)
        store.defineNode('a', [
            {name: 'speed', initial: 1},
            {name: 'center', schema: d.vec2f, initial: {x: 0.5, y: 0.5}},
            {name: 'color', schema: d.vec4f, initial: [1, 1, 1, 1]},
            {name: 'colors', schema: d.arrayOf(d.vec4f, 8), initial: new Array(32).fill(0)},
        ])
        store.defineNode('b', [{name: 'opacity', initial: 1}])
        const result = store.finalize()

        // Resolve a layout that binds the combined struct — proves it's a valid uniform schema
        // and emits deterministic WGSL (names: 'strict'), GPU-free.
        const layout = tgpu.bindGroupLayout({[UNIFORM_ENTRY_KEY]: {uniform: result.schema}})
        const wgsl = tgpu.resolve([layout], {names: 'strict'})
        expect(wgsl).toMatch(/struct/)
        expect(wgsl).toMatch(/n_a/)
        expect(wgsl).toMatch(/_sys/)
        expect(wgsl).toMatchSnapshot()
    })
})

describe('uniformStore — applied-transform packability guard (FIX-E)', () => {
    it('warns ONCE when an applied transform returns a non-packable value', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const {root} = mockRoot()
        const store = createUniformStore(root)
        // Porter mistake: returns a plain color object (no x/y, no `.kind`) → would pack to NaN.
        const badTransform = (() => ({r: 1, g: 0, b: 0, a: 1})) as never
        store.defineNode('bad', [{name: 'tint', initial: '#f00', transform: badTransform}])
        store.defineNode('bad2', [{name: 'tint', initial: '#0f0', transform: badTransform}]) // same fn → no re-warn
        expect(warn).toHaveBeenCalledTimes(1)
        expect(String(warn.mock.calls[0][0])).toContain('non-packable')
        warn.mockRestore()
    })

    it('does NOT warn for packable applied transforms (scalar / bool→float / enum→number / vector / cpu string)', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const {root} = mockRoot()
        const store = createUniformStore(root)
        store.defineNode('ok', [
            {name: 'thickness', initial: 0.2, transform: ((v: number) => v * 0.5) as never}, // → number
            {name: 'flag', initial: false, transform: ((v: boolean) => (v ? 1 : 0)) as never}, // → number
            {name: 'mode', initial: 'bars', transform: ((v: string) => (({bars: 0, waves: 2}) as Record<string, number>)[v] ?? 0) as never}, // → number
            {name: 'center', schema: d.vec2f, initial: {x: 0.5, y: 0.5}, transform: fakeTransformPosition as never}, // → {node,data}
            {name: 'url', initial: 'https://x', transform: ((s: string) => s) as never}, // → string (cpu)
        ])
        expect(warn).not.toHaveBeenCalled()
        warn.mockRestore()
    })
})
