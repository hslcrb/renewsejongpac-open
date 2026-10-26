import { Children, createElement, Fragment, isValidElement } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

// [남는 폭을 비율로 나누는 조작 묶음 / Controls sharing the available width]
export type SystemControlColumns = 1 | 2 | 3 | 4 | 5 | 6;
export type SystemControlGroupTag = "div" | "nav" | "section" | "ul" | "ol";
export type SystemControlGroupColumns = {
    compact?: SystemControlColumns;
    medium?: SystemControlColumns;
    wide?: SystemControlColumns;
};

type ControlGroupStyle<Element extends SystemControlGroupTag> = {
    as?: Element;
    columns?: SystemControlGroupColumns;
    maxColumns?: SystemControlColumns;
};

export type SystemControlGroupProps<Element extends SystemControlGroupTag = "div"> =
    ControlGroupStyle<Element> & Omit<ComponentPropsWithoutRef<Element>, keyof ControlGroupStyle<Element>>;

// [프래그먼트와 배열을 같은 항목으로 해석 / Treat fragments and arrays as the same item sequence]
// 각 경로의 key를 보존해 이름 있는 조작의 순서가 바뀌어도 상태를 유지합니다.
// Preserve keyed ancestry so reordering named controls does not replace their state.
function controlItems(children: ReactNode, parentKeys: readonly string[] = []): { child: ReactNode; key: string }[] {
    return Children.toArray(children).flatMap((child, index) => {
        const keys = [...parentKeys, isValidElement(child) && child.key !== null ? String(child.key) : String(index)];
        if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
            return controlItems(child.props.children, keys);
        }
        return [{ child, key: JSON.stringify(keys) }];
    });
}

// [내용 수와 화면 너비에 맞는 열 / Columns limited by content and viewport]
// 간격을 뺀 너비를 균등 분배하며 마지막 줄도 남는 폭을 채웁니다.
// Share the width after gaps; let the last row fill its remaining space.
export function SystemControlGroup<Element extends SystemControlGroupTag = "div">({
    as,
    columns,
    maxColumns = 6,
    children,
    className = "",
    style,
    ...props
}: SystemControlGroupProps<Element>) {
    const items = controlItems(children);
    const columnLimit = Math.max(1, Math.min(items.length, maxColumns));
    const limit = (value: SystemControlColumns) => Math.min(value, columnLimit);
    const groupStyle = {
        ...style,
        "--control-group-columns-compact": limit(columns?.compact ?? 2),
        "--control-group-columns-medium": limit(columns?.medium ?? 3),
        "--control-group-columns-wide": limit(columns?.wide ?? 6),
    } as CSSProperties;
    const tag = as || "div";
    const itemTag = tag === "ul" || tag === "ol" ? "li" : "div";

    return createElement(tag, {
        ...props,
        className: `system-control-group ${className}`.trim(),
        style: groupStyle,
        "data-component": "control-group",
        "data-component-id": "control-group",
        "data-control-count": items.length,
    }, items.map(({ child, key }) => createElement(itemTag, {
        key,
        className: "system-control-group-item",
    }, child)));
}

export default SystemControlGroup;
