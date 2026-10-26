"use client";

import { useId, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { createGlassMap, GLASS_DEFAULTS, resolveGlassOptions } from "../src/lib/liquid-glass";
import type { GlassOptions } from "../src/lib/liquid-glass";

// [배경을 실제로 굴절시키는 렌즈 / A lens that displaces the actual backdrop]
// 크기·곡률이 바뀔 때 지도를 만들고 굴절 강도 조절에는 재사용합니다.
// Regenerate the map for geometry changes; strength changes reuse it.
export default function GlassRefraction({
    surfaceRef,
    blur,
    refraction,
    thickness,
}: {
    surfaceRef: RefObject<HTMLDivElement>;
} & Partial<Pick<GlassOptions, "blur" | "refraction" | "thickness">>) {
    const id = "glass-lens-" + useId().replace(/:/g, "");
    const image = useRef<SVGFEImageElement>(null);
    const previousSize = useRef("");
    const [filterOptions, setFilterOptions] = useState(GLASS_DEFAULTS);
    useEffect(() => {
        const panel = surfaceRef.current;
        if (!panel) return;
        const update = () => {
            const width = Math.ceil(panel.offsetWidth);
            const height = Math.ceil(panel.offsetHeight);
            if (!width || !height) return;
            const computed = getComputedStyle(panel);
            const options = resolveGlassOptions({
                blur: parseFloat(computed.getPropertyValue("--glass-blur")),
                refraction: parseFloat(computed.getPropertyValue("--glass-refraction")),
                thickness: parseFloat(computed.getPropertyValue("--glass-thickness")),
            });
            setFilterOptions((previous) =>
                previous.blur === options.blur && previous.refraction === options.refraction
                    ? previous
                    : options,
            );
            const radius = Math.max(
                0,
                Math.min(Math.max(
                    parseFloat(computed.borderTopLeftRadius) || 0,
                    parseFloat(computed.borderTopRightRadius) || 0,
                    parseFloat(computed.borderBottomRightRadius) || 0,
                    parseFloat(computed.borderBottomLeftRadius) || 0,
                ), width / 2, height / 2),
            );
            const sizeKey = `${width}x${height}:${radius}:${options.thickness}`;
            if (previousSize.current === sizeKey) return;
            previousSize.current = sizeKey;
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");
            if (!context) return;
            const map = context.createImageData(width, height);
            map.data.set(createGlassMap(width, height, radius, options.thickness));
            context.putImageData(map, 0, 0);
            // 숨긴 SVG의 비율 크기 대신 실제 픽셀 크기를 사용합니다.
            // The hidden SVG has no viewport; the lens needs explicit pixel dimensions.
            image.current?.setAttribute("width", String(width));
            image.current?.setAttribute("height", String(height));
            image.current?.setAttribute("href", canvas.toDataURL());
            panel.style.setProperty("--glass-filter", `url("#${id}")`);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(panel);
        return () => observer.disconnect();
    }, [id, surfaceRef, blur, refraction, thickness]);
    return (
        <svg
            className="glass-lens-definitions" data-component-part="glass-refraction" data-component-owner="glass"
            width="0"
            height="0"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <filter
                    id={id}
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    colorInterpolationFilters="sRGB"
                >
                    <feImage ref={image} x="0" y="0" preserveAspectRatio="none" result="lens" />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="lens"
                        scale={filterOptions.refraction}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="refracted"
                    />
                    <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation={filterOptions.blur}
                        result="frosted"
                    />
                    <feColorMatrix
                        in="lens"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 0"
                        result="rim-mask"
                    />
                    <feComposite in="refracted" in2="rim-mask" operator="in" result="clear-rim" />
                    <feComposite in="frosted" in2="rim-mask" operator="out" result="soft-center" />
                    <feComposite
                        in="clear-rim"
                        in2="soft-center"
                        operator="arithmetic"
                        k1="0"
                        k2="1"
                        k3="1"
                        k4="0"
                    />
                </filter>
            </defs>
        </svg>
    );
}
