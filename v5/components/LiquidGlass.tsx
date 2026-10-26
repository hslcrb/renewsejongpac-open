"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import GlassRefraction from "./GlassRefraction";
import { resolveGlassOptions } from "../src/lib/liquid-glass";
import type { GlassOptions, GlassVariant } from "../src/lib/liquid-glass";

export type LiquidGlassProps = HTMLAttributes<HTMLDivElement> & Partial<GlassOptions> & { variant?: GlassVariant };

// [콘텐츠와 분리된 공통 유리 표면 / Reusable glass without altering its content]
// 기본값은 디자인 토큰을 따르며 개별 표면만 props로 조정할 수 있습니다.
// Defaults inherit design tokens; props override only this particular surface.
const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(function LiquidGlass(
    { children, className = "", style, variant = "surface", opacity, refraction, blur, thickness, ...props },
    forwardedRef,
) {
    const surfaceRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(forwardedRef, () => surfaceRef.current!, []);
    const options = resolveGlassOptions({ opacity, refraction, blur, thickness }, variant);
    const surfaceStyle: CSSProperties & Record<string, string | number> = {};
    if (opacity !== undefined) surfaceStyle["--glass-opacity"] = options.opacity;
    if (refraction !== undefined) surfaceStyle["--glass-refraction"] = options.refraction;
    if (blur !== undefined) surfaceStyle["--glass-blur"] = `${options.blur}px`;
    if (thickness !== undefined) surfaceStyle["--glass-thickness"] = `${options.thickness}px`;

    return (
        <div
            data-component-id="glass"
            {...props}
            ref={surfaceRef}
            data-text="body"
            data-glass-variant={variant}
            className={`liquid-glass ${className}`.trim()}
            style={{ ...surfaceStyle, ...style }}
        >
            <GlassRefraction
                surfaceRef={surfaceRef}
                blur={blur ?? (variant !== "surface" ? options.blur : undefined)}
                refraction={refraction ?? (variant !== "surface" ? options.refraction : undefined)}
                thickness={thickness ?? (variant !== "surface" ? options.thickness : undefined)}
            />
            <div className="liquid-glass-optics" aria-hidden="true" />
            {children}
        </div>
    );
});

export default LiquidGlass;
