import { createElement, forwardRef } from "react";
import type { ComponentPropsWithoutRef, ComponentPropsWithRef, ReactElement } from "react";

// [의미를 보존하는 공통 표면 / Shared surfaces that preserve native semantics]
export { SURFACE_VARIANTS as SYSTEM_SURFACE_VARIANTS } from "../src/system/component-contracts";
import type { SurfaceVariant, SurfacePadding, SurfaceRadius } from "../src/system/component-contracts";
export type SystemSurfaceVariant = SurfaceVariant;
export type SystemSurfacePadding = SurfacePadding;
export type SystemSurfaceRadius = SurfaceRadius;
export type SystemSurfaceTag = "div" | "section" | "article" | "aside" | "header" | "footer" | "main" | "nav" | "form" | "fieldset" | "ul" | "ol" | "li";

type SurfaceStyle<Element extends SystemSurfaceTag> = {
    as?: Element;
    variant?: SystemSurfaceVariant;
    padding?: SystemSurfacePadding;
    radius?: SystemSurfaceRadius;
};

export type SystemSurfaceProps<Element extends SystemSurfaceTag = "div"> =
    SurfaceStyle<Element> & Omit<ComponentPropsWithoutRef<Element>, keyof SurfaceStyle<Element>>;

// [배치와 콘텐츠는 소비자가 소유 / Consumers own layout and content]
// overflow를 숨기지 않아 중첩 조작의 초점과 팝업을 보존합니다.
// Preserve nested control focus and popups by leaving overflow visible.
export const SystemSurface = forwardRef<HTMLElement, SystemSurfaceProps<SystemSurfaceTag>>(function SystemSurface({
    as,
    variant = "panel",
    padding = "md",
    radius = "panel",
    className = "",
    ...props
}, ref) {
    return createElement(as || "div", {
        ...props,
        ref,
        className: `system-surface ${className}`.trim(),
        "data-component": "surface",
        "data-component-id": "surface",
        "data-stroke": "inner",
        "data-surface-variant": variant,
        "data-surface-padding": padding,
        "data-surface-radius": radius,
    });
}) as <Element extends SystemSurfaceTag = "div">(props: SystemSurfaceProps<Element> & { ref?: ComponentPropsWithRef<Element>["ref"] }) => ReactElement | null;

export default SystemSurface;
