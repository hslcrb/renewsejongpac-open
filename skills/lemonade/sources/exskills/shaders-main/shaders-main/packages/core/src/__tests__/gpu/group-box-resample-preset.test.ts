import {describe, it, expect} from 'vitest'
import {shaderRendererGPU} from '@coreroot/gpu/index'
import {createGpuUniformsMap} from '@coreroot/gpu/uniformBridge'
import {boundingBoxToUVParams} from '@coreroot/gpu/kit/uvTransform'
import Group from '@coreroot/shaders/Group/index'
import Circle from '@coreroot/shaders/Circle/index'
import type {GpuShaderDefinition, GpuUniformsMap} from '@coreroot/gpu/contract'
import type {NodeMetadata, BoundingBoxConfig} from '@coreroot/types'

/**
 * E0-5 — Group boxResamplesContent from a REAL preset shape (GATE D §D item 19). The `--all` sweep
 * only exercised Group's plain passthrough; GroupBox.png validated the resample but with a
 * hand-built box. This drives the ACTUAL renderer registration path with a `metadata.boundingBox`
 * carrying PX units, and asserts the `_bbox_*` synthetic fields resolve to the exact UV geometry
 * `boundingBoxToUVParams` produces (px → UV divide by the live frame size) — the chain a real
 * design-editor preset takes. The composer's resample WGSL from `_bbox_*` is covered separately
 * (shader-Group.test.ts); together they cover preset → fields → resample end to end.
 */

const G = Group as GpuShaderDefinition
const C = Circle as GpuShaderDefinition
const meta = (boundingBox?: BoundingBoxConfig): NodeMetadata =>
    ({blendMode: 'normal', opacity: undefined, renderOrder: 0, boundingBox}) as NodeMetadata

function uniformsFor(def: GpuShaderDefinition, id: string): GpuUniformsMap {
    const reactive: Record<string, unknown> = {}
    for (const [name, cfg] of Object.entries(def.props)) reactive[name] = (cfg as {default: unknown}).default
    return createGpuUniformsMap(def as never, reactive, id) as unknown as GpuUniformsMap
}

// A real preset-shaped box: a 400×200 px window offset (200,100) px from the top-left, at a
// 1000×500 logical frame. px → UV: x 0.2, y 0.2, w 0.4, h 0.4 → centre (0.4, 0.4), half (0.2, 0.2).
const PX_BOX: BoundingBoxConfig = {
    x: {value: 200, unit: 'px'},
    y: {value: 100, unit: 'px'},
    width: {value: 400, unit: 'px'},
    height: {value: 200, unit: 'px'},
    origin: 'top-left',
    rotation: 0,
    cornerRadius: {value: 25, unit: 'px'},
} as BoundingBoxConfig

const FRAME = {width: 1000, height: 500}

function mount(boundingBox?: BoundingBoxConfig) {
    const r = shaderRendererGPU()
    r.__testing.setTestReady(FRAME)
    r.registerNode('root', C.fragment, null, meta(), uniformsFor(C, 'root') as never, C)
    r.registerNode('grp', G.fragment, 'root', meta(boundingBox), uniformsFor(G, 'grp') as never, G)
    r.registerNode('a', C.fragment, 'grp', meta(), uniformsFor(C, 'a') as never, C)
    return r
}

describe('Group box-resample from a real px-unit preset bbox (e0)', () => {
    it('resolves _bbox_* synthetic fields from a px BoundingBoxConfig to the exact UV geometry', () => {
        const r = mount(PX_BOX)
        const inits = r.__testing.buildFieldInits('grp')!
        expect(inits).toBeTruthy()
        const field = (name: string) => inits.find((f) => f.name === name)?.initial as number | undefined

        // The px box must have produced the seven _bbox_* fields (bboxActive).
        for (const k of ['centerX', 'centerY', 'halfWidth', 'halfHeight', 'cornerRadius', 'rotation', 'aspectRatio']) {
            expect(field(`_bbox_${k}`), `_bbox_${k} missing`).toBeTypeOf('number')
        }

        // They must equal the canonical px → UV resolution at the live frame size.
        const p = boundingBoxToUVParams(PX_BOX, FRAME.width, FRAME.height)
        expect(field('_bbox_centerX')).toBeCloseTo(p.centerX, 6)
        expect(field('_bbox_centerY')).toBeCloseTo(p.centerY, 6)
        expect(field('_bbox_halfWidth')).toBeCloseTo(p.halfWidthUV, 6)
        expect(field('_bbox_halfHeight')).toBeCloseTo(p.halfHeightUV, 6)
        expect(field('_bbox_cornerRadius')).toBeCloseTo(p.cornerRadiusUV, 6)

        // Sanity against the hand-computed values (guards a silent change in the resolution math).
        expect(field('_bbox_centerX')).toBeCloseTo(0.4, 6)
        expect(field('_bbox_centerY')).toBeCloseTo(0.4, 6)
        expect(field('_bbox_halfWidth')).toBeCloseTo(0.2, 6)
        expect(field('_bbox_halfHeight')).toBeCloseTo(0.2, 6)
        // cornerRadius (px) resolves against the HEIGHT axis: 25 / 500 = 0.05.
        expect(field('_bbox_cornerRadius')).toBeCloseTo(0.05, 6)
    })

    it('a Group with NO boundingBox is identity — no _bbox_* fields (plain passthrough)', () => {
        const r = mount(undefined)
        const inits = r.__testing.buildFieldInits('grp')!
        expect(inits.some((f) => f.name.startsWith('_bbox_'))).toBe(false)
    })
})
