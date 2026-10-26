import {describe, it, expect} from 'vitest'
import fs from 'fs'
import path from 'path'
import {getAllShaders} from '@coreroot/shaderRegistry'
import {gpuTransformFor, identityTransform} from '@coreroot/gpu/transforms'

/**
 * E0-4 enum-prop invariant (GATE D §D item 18 residual risk). A `select` prop that is read as a
 * NUMBER via `uniforms.<prop>` in a GPU body MUST carry a transform that maps its string value to a
 * number — otherwise the raw string lands in an `f32` (NaN). Since the FIX-E bridge change,
 * `gpuTransformFor` applies ANY prop transform (shared OR inline string→number map), so a prop that
 * declares a transform is fine; the remaining DANGER is a select prop read via `uniforms.<prop>`
 * with NO transform at all (→ cpu-only raw string → NaN in the field). Many enum props instead
 * JS-branch on `propValues.<prop>` / `getCpuValue('<prop>')` at compile time (now the transformed
 * number, still handled by their number-tolerant helpers) and are never read via `uniforms.<prop>`.
 *
 * This invariant guards the roster: EVERY select prop read via `uniforms.<prop>` MUST carry a
 * transform (shared like transformEdges/transformColorSpace, or an inline string→number map) so the
 * uniform store writes a number. Comments are stripped first (v1-reference comments like
 * "v1 read uniforms.objectFit…" must not count).
 */

function isSelect(ui: unknown): boolean {
    if (!ui || typeof ui !== 'object') return false
    const u = ui as {type?: unknown; options?: unknown}
    const t = u.type
    return t === 'select' || (Array.isArray(t) && t.includes('select')) || Array.isArray(u.options)
}

/** Strip `//` line comments and `/* … *\/` block comments so v1-reference comments don't match. */
function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

describe('enum-prop sweep — no unmapped raw string reaches a consumed numeric field (e0)', () => {
    const shaders = getAllShaders()

    it('every select prop read via uniforms.<prop> carries a registered numeric transform', () => {
        const violations: string[] = []
        for (const entry of shaders) {
            const def = entry.definition as {name: string; props?: Record<string, {ui?: unknown; transform?: unknown}>}
            if (!def?.props) continue
            const srcPath = path.resolve(process.cwd(), `src/shaders/${def.name}/index.ts`)
            let src = ''
            try {
                src = stripComments(fs.readFileSync(srcPath, 'utf8'))
            } catch {
                continue // no source (e.g. smoke-only fixture) — skip
            }
            for (const [prop, cfg] of Object.entries(def.props)) {
                if (!isSelect(cfg.ui)) continue
                const readsUniform =
                    new RegExp(`uniforms\\.${prop}([^A-Za-z0-9_]|$)`).test(src) ||
                    new RegExp(`uniforms\\[['"]${prop}['"]\\]`).test(src)
                if (!readsUniform) continue // propValues/getCpuValue-only → raw string is intended
                const gpuTransform = gpuTransformFor(cfg.transform as ((v: never) => unknown) | undefined)
                // Registered numeric transform → the store writes a number. Unregistered (identity) or
                // absent (cpu string) → a raw string would reach the f32. That's the bug.
                if (!gpuTransform || gpuTransform === identityTransform) {
                    violations.push(`${def.name}.${prop} is read via uniforms.${prop} but its transform is ${gpuTransform ? 'UNREGISTERED (identity passthrough)' : 'ABSENT (cpu string)'}`)
                }
            }
        }
        expect(violations).toEqual([])
    })
})
