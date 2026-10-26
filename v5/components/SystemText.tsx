import { createElement, forwardRef } from "react";
import type { ComponentPropsWithoutRef, ComponentPropsWithRef, ElementType, ReactElement } from "react";
import type { TextVariant, TextSize } from "../src/data/design-tokens";

export type { TextVariant, TextSize } from "../src/data/design-tokens";

// [래퍼 없이 연결하는 공유 텍스트 속성 / Shared text attributes without an extra wrapper]
export function textAttributes(variant: TextVariant = "body", size?: TextSize) {
    return {
        "data-text": variant,
        "data-component-id": "text",
        ...(size ? { "data-text-size": size } : {}),
    } as const;
}

export type SystemTextProps<As extends ElementType = "span"> = {
    as?: As;
    variant?: TextVariant;
    size?: TextSize;
} & Omit<ComponentPropsWithoutRef<As>, "as" | "variant" | "size">;

// [의미와 표시 역할을 분리한 공유 텍스트 / Shared text with independent semantics and visual roles]
export const SystemText = forwardRef<unknown, SystemTextProps<ElementType>>(function SystemText({
    as,
    variant = "body",
    size,
    className,
    ...props
}, ref) {
    return createElement(as || "span", {
        ...props,
        ...textAttributes(variant, size),
        ref,
        className: ["system-text", className].filter(Boolean).join(" "),
    });
}) as <As extends ElementType = "span">(props: SystemTextProps<As> & { ref?: ComponentPropsWithRef<As>["ref"] }) => ReactElement | null;
