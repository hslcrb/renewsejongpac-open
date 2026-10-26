import {describe, it, expect} from 'vitest'
import {
    centerPropConfig,
    edgesPropConfig,
    objectFitProp,
    originProp,
    shapeColorSpaceProp,
    shapeStrokeProps,
} from '@coreroot/utilities/propConfigs'
import {componentDefinition as circle} from '@coreroot/shaders/Circle'
import {componentDefinition as heart} from '@coreroot/shaders/Heart'
import {componentDefinition as ring} from '@coreroot/shaders/Ring'
import {componentDefinition as mirror} from '@coreroot/shaders/Mirror'
import {componentDefinition as twirl} from '@coreroot/shaders/Twirl'
import {componentDefinition as bulge} from '@coreroot/shaders/Bulge'
import {componentDefinition as reflectivePlane} from '@coreroot/shaders/ReflectivePlane'
import {componentDefinition as imageTexture} from '@coreroot/shaders/ImageTexture'
import {componentDefinition as webcamTexture} from '@coreroot/shaders/WebcamTexture'

/**
 * Gate A assertion for the prop-config factories: each factory's output must deep-equal the inline
 * prop block the shader declares TODAY. These compare against the real `componentDefinition`
 * imports rather than replicated literals, so the test fails if either side drifts.
 *
 * `transform` is compared by reference where the shader uses a shared imported transform
 * (`transformEdges`, `transformPosition`, …) — deep equality covers that. `objectFit` is the one
 * exception: both the shader and the factory build an inline closure, and two distinct closures are
 * never `toEqual`. Those are compared structurally with `transform` stripped, plus an exhaustive
 * behavioural comparison over every input value (which is the part that actually matters — the mode
 * numbers are baked into shipped presets).
 */

const props = (def: any) => def.props as Record<string, any>

describe('edgesPropConfig', () => {
    const STANDARD_DESCRIPTION = 'How to handle edges when distortion pushes content out of bounds'

    it('matches Mirror.edges (default mirror)', () => {
        expect(edgesPropConfig('mirror', STANDARD_DESCRIPTION)).toEqual(props(mirror).edges)
    })

    it('matches Twirl.edges and Bulge.edges (default stretch)', () => {
        expect(edgesPropConfig('stretch', STANDARD_DESCRIPTION)).toEqual(props(twirl).edges)
        expect(edgesPropConfig('stretch', STANDARD_DESCRIPTION)).toEqual(props(bulge).edges)
    })

    it('matches ReflectivePlane.edges via the group override', () => {
        expect(edgesPropConfig(
            'stretch',
            "How to handle reflected samples that fall outside the source content.",
            {group: 'Surface'},
        )).toEqual(props(reflectivePlane).edges)
    })

    it('does not share its options array between calls', () => {
        expect(edgesPropConfig('mirror', 'x').ui?.options).not.toBe(edgesPropConfig('mirror', 'x').ui?.options)
    })
})

describe('centerPropConfig', () => {
    it('matches Twirl.center (distortion form — no units)', () => {
        expect(centerPropConfig("The center point of the twirl effect")).toEqual(props(twirl).center)
    })

    it('matches Circle.center (shape form — px units, "Center Position" label)', () => {
        expect(centerPropConfig("The center point of the circle", {
            label: 'Center Position',
            units: ['%', 'px'],
        })).toEqual(props(circle).center)
    })

    it('matches Heart.center (shape form — "Center" label)', () => {
        expect(centerPropConfig("Center position of the heart", {units: ['%', 'px']})).toEqual(props(heart).center)
    })

    it('omits ui.units entirely rather than setting it undefined', () => {
        expect('units' in (centerPropConfig('x').ui ?? {})).toBe(false)
    })
})

describe('originProp', () => {
    it('matches Circle.origin, Heart.origin and Ring.origin (identical fleet-wide)', () => {
        expect(originProp()).toEqual(props(circle).origin)
        expect(originProp()).toEqual(props(heart).origin)
        expect(originProp()).toEqual(props(ring).origin)
    })
})

describe('shapeStrokeProps', () => {
    it('baseline matches the 13-shape fleet standard (Heart)', () => {
        const s = shapeStrokeProps()
        expect(s.softness).toEqual(props(heart).softness)
        expect(s.strokeThickness).toEqual(props(heart).strokeThickness)
        expect(s.strokeColor).toEqual(props(heart).strokeColor)
        expect(s.strokePosition).toEqual(props(heart).strokePosition)
    })

    it('matches Ring via its two documented overrides', () => {
        const s = shapeStrokeProps({
            softnessDescription: "Edge softness for antialiasing (applied to both inner and outer ring edges)",
            strokeThicknessMax: 0.1,
            strokePositionDescription: "Position of the stroke relative to the ring edge",
        })
        expect(s.softness).toEqual(props(ring).softness)
        expect(s.strokeThickness).toEqual(props(ring).strokeThickness)
        expect(s.strokeColor).toEqual(props(ring).strokeColor)
        expect(s.strokePosition).toEqual(props(ring).strokePosition)
    })

    it('covers Circle only for the two props it does NOT diverge on', () => {
        // Circle's softness/strokeThickness are ['range','map'] typed with widened maxima and a
        // dimensional marker, so Circle keeps those inline and spreads over the factory result.
        const s = shapeStrokeProps({
            strokeColorDescription: 'The color of the stroke outline',
            strokePositionDescription: 'Position of the stroke relative to the circle edge',
        })
        expect(s.strokeColor).toEqual(props(circle).strokeColor)
        expect(s.strokePosition).toEqual(props(circle).strokePosition)
        // Guard the documented divergence so a future migration can't quietly narrow Circle.
        expect(s.softness).not.toEqual(props(circle).softness)
        expect(s.strokeThickness).not.toEqual(props(circle).strokeThickness)
    })
})

describe('shapeColorSpaceProp', () => {
    it('baseline matches the fleet (Heart, Ring)', () => {
        expect(shapeColorSpaceProp()).toEqual(props(heart).colorSpace)
        expect(shapeColorSpaceProp()).toEqual(props(ring).colorSpace)
    })

    it('matches Circle via its description override', () => {
        expect(shapeColorSpaceProp({
            description: 'Color space for blending fill and stroke colors in soft edges',
        })).toEqual(props(circle).colorSpace)
    })
})

describe('objectFitProp', () => {
    const OBJECT_FIT_VALUES = ['cover', 'contain', 'fill', 'scale-down', 'none', '', 'bogus']

    const withoutTransform = (p: any) => {
        const {transform: _transform, ...rest} = p
        return rest
    }

    it('matches ImageTexture.objectFit (allowNone: false — none coalesces to fill)', () => {
        const factory = objectFitProp('fill', 'How the image should be sized within the viewport', {allowNone: false})
        const inline = props(imageTexture).objectFit
        expect(withoutTransform(factory)).toEqual(withoutTransform(inline))
        for (const v of OBJECT_FIT_VALUES) {
            expect(factory.transform?.(v)).toBe(inline.transform(v))
        }
        // Pin the retired-'none' mapping explicitly: 2 (fill), not 0 (cover).
        expect(factory.transform?.('none')).toBe(2)
        expect(factory.transform?.('bogus')).toBe(2)
    })

    it('matches WebcamTexture.objectFit (allowNone: true — none is mode 4)', () => {
        const factory = objectFitProp('cover', 'How the webcam feed should be sized within the viewport', {allowNone: true})
        const inline = props(webcamTexture).objectFit
        expect(withoutTransform(factory)).toEqual(withoutTransform(inline))
        for (const v of OBJECT_FIT_VALUES) {
            expect(factory.transform?.(v)).toBe(inline.transform(v))
        }
        // The preserved divergence: 'none' is its own mode here and the fallback is cover, not fill.
        expect(factory.transform?.('none')).toBe(4)
        expect(factory.transform?.('bogus')).toBe(0)
    })

    it('only offers the "None" select option when allowNone', () => {
        const values = (allowNone: boolean) =>
            (objectFitProp('fill', 'x', {allowNone}).ui?.options ?? []).map((o) => (o as {value: string}).value)
        expect(values(false)).toEqual(['cover', 'contain', 'fill', 'scale-down'])
        expect(values(true)).toEqual(['cover', 'contain', 'fill', 'scale-down', 'none'])
    })
})
