"use client";

import { forwardRef, useId, useRef } from "react";
import type { DetailsHTMLAttributes, HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import type { TabOrientation, Appearance } from "../src/system/component-contracts";

// [키보드 탐색이 가능한 탭 / Keyboard accessible tabs]
// 실제 탭과 패널만 사용하며 방향키는 선택과 초점을 함께 이동합니다.
// Use tab semantics only for panels, with automatic keyboard activation.
export type SystemTab = { id: string; label: ReactNode; content: ReactNode; disabled?: boolean };
export type SystemTabsProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
    items: SystemTab[];
    value: string;
    onValueChange: (value: string) => void;
    orientation?: TabOrientation;
    tabListClassName?: string;
    panelClassName?: string;
    idPrefix?: string;
};

export const SystemTabs = forwardRef<HTMLDivElement, SystemTabsProps>(function SystemTabs(
    { items, value, onValueChange, orientation = "horizontal", className = "", tabListClassName = "", panelClassName = "", idPrefix, "aria-label": label, "aria-labelledby": labelledBy, ...props }, ref,
) {
    const generatedPrefix = useId();
    const prefix = idPrefix || generatedPrefix;
    const buttons = useRef(new Map<string, HTMLButtonElement>());
    const enabled = items.filter((item) => !item.disabled);
    const selected = enabled.some((item) => item.id === value) ? value : enabled[0]?.id;
    const tabId = (id: string) => `${prefix}-tab-${id}`;
    const panelId = (id: string) => `${prefix}-panel-${id}`;
    function handleKey(event: KeyboardEvent<HTMLButtonElement>, id: string) {
        const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
        const previousKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
        if (![nextKey, previousKey, "Home", "End"].includes(event.key) || !enabled.length) return;
        event.preventDefault();
        const index = enabled.findIndex((item) => item.id === id);
        const targetIndex = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (index + (event.key === nextKey ? 1 : -1) + enabled.length) % enabled.length;
        const next = enabled[targetIndex].id;
        onValueChange(next);
        buttons.current.get(next)?.focus();
    }
    return <div data-text="body" {...props} ref={ref} className={`ds-tab-group ${className}`.trim()} data-component="tabs" data-component-id="tabs" data-orientation={orientation}>
        <div data-text="body" className={`ds-tabs ${tabListClassName}`.trim()} data-component-part="list" data-component-owner="tabs" role="tablist" aria-label={label} aria-labelledby={labelledBy} aria-orientation={orientation}>
            {items.map((item) => <button data-text="action" data-text-size="control" key={item.id} ref={(element) => { if (element) buttons.current.set(item.id, element); else buttons.current.delete(item.id); }} type="button" role="tab" id={tabId(item.id)} aria-controls={panelId(item.id)} aria-selected={selected === item.id} tabIndex={selected === item.id ? 0 : -1} disabled={item.disabled} onClick={() => onValueChange(item.id)} onKeyDown={(event) => handleKey(event, item.id)}>{item.label}</button>)}
        </div>
        {items.map((item) => <div data-text="body" key={item.id} id={panelId(item.id)} data-component-part="panel" data-component-owner="tabs" role="tabpanel" aria-labelledby={tabId(item.id)} hidden={selected !== item.id} tabIndex={0} className={`ds-tabpanel ${panelClassName}`.trim()}>{item.content}</div>)}
    </div>;
});

// [브라우저 기본 펼침 동작 / Native disclosure behavior]
export type SystemDisclosureProps = DetailsHTMLAttributes<HTMLDetailsElement> & { summary: ReactNode; summaryClassName?: string; appearance?: Appearance };
export const SystemDisclosure = forwardRef<HTMLDetailsElement, SystemDisclosureProps>(function SystemDisclosure(
    { summary, children, className = "", summaryClassName, appearance = "default", ...props }, ref,
) {
    return <details data-text="body" {...props} ref={ref} className={`${appearance === "plain" ? "ds-disclosure-plain" : "ds-disclosure"} ${className}`.trim()} data-component="disclosure" data-component-id="disclosure" data-appearance={appearance}><summary data-text="label" className={summaryClassName}>{summary}</summary>{children}</details>;
});
