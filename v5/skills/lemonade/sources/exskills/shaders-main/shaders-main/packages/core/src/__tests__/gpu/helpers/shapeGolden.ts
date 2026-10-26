/**
 * CPU golden transcriptions of the shared shape helpers (kit/sdf `shapeLocalCoords` +
 * `strokeMaskFromSdf`), used by the analytic shape-shader port gates (Ellipse/Cross/Heart).
 * These mirror the ORIGINAL v1 shape fragmentNode math by hand so each shader's exported
 * `<shape>Shape` DualFn can be checked for math equivalence, not just self-consistency.
 */

/** Aspect-correct + center double-flip + rotate, matching kit/sdf `shapeLocalCoords`. */
function localCoords(center: [number, number], rotationDeg: number, uv: [number, number], aspect: number): [number, number] {
    const acx = uv[0] * aspect
    const acy = uv[1]
    const cx = center[0] * aspect
    const cy = 1 - center[1]
    const dx = acx - cx
    const dy = acy - cy
    const r = (rotationDeg * Math.PI) / 180
    const cosR = Math.cos(r)
    const sinR = Math.sin(r)
    return [dx * cosR + dy * sinR, dy * cosR - dx * sinR]
}

export const shapeGolden = {localCoords}

/** Fill coverage + stroke blend from an SDF value, matching kit/sdf `strokeMaskFromSdf`. */
export function strokeMaskGolden(
    dist: number,
    softness: number,
    strokeThickness: number,
    strokePosition: number,
): {overallMask: number; strokeBlend: number} {
    const smoothstep = (e0: number, e1: number, x: number) => {
        const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
        return t * t * (3 - 2 * t)
    }
    const isInside = strokePosition >= 1.5
    const isCenterOrAbove = strokePosition >= 0.5
    const half = strokeThickness * 0.5
    const strokeInner = isInside ? -strokeThickness : isCenterOrAbove ? -half : 0
    const strokeOuter = isInside ? 0 : isCenterOrAbove ? half : strokeThickness
    const overallMask = 1 - smoothstep(strokeOuter - softness, strokeOuter, dist)
    const strokeBlend = strokeThickness > 0 ? smoothstep(strokeInner - softness, strokeInner, dist) : 0
    return {overallMask, strokeBlend}
}
