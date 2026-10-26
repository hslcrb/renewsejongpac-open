"use client";

import Link from "next/link";
import type { LinkProps } from "next/link";
import { forwardRef, useId } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Icon from "./Icon";
import LiquidGlass from "./LiquidGlass";
import type { ControlVariant, ControlContext, ControlShape, BadgeTone, Appearance } from "../src/system/component-contracts";

// [공통 조작과 링크 / Shared controls and links]
// 네이티브 속성과 ref를 보존하며 제품 화면과 문서가 같은 토큰을 사용합니다.
// Preserve native attributes and refs while product and documentation share tokens.
export type SystemControlStyle = {
    variant?: ControlVariant;
    context?: ControlContext;
    shape?: ControlShape;
};
export type SystemButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & SystemControlStyle;

export const SystemButton = forwardRef<HTMLButtonElement, SystemButtonProps>(function SystemButton(
    { variant = "primary", context = "default", shape = "rounded", className = "", type = "button", "data-component": component = "button", "data-component-id": componentId = "button", ...props }: SystemButtonProps & { "data-component"?: string; "data-component-id"?: string }, ref,
) {
    return <button data-text="action" data-text-size="control" {...props} ref={ref} type={type} data-component={component} data-component-id={componentId} data-variant={variant} data-context={context} data-shape={shape} data-stroke="inner" data-autofocus={props.autoFocus || undefined} className={`ds-button ds-button-${variant} ${className}`.trim()} />;
});

export type SystemLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & Omit<LinkProps, "as"> & SystemControlStyle;
export const SystemLink = forwardRef<HTMLAnchorElement, SystemLinkProps>(function SystemLink(
    { variant = "primary", context = "default", shape = "rounded", className = "", href, rel, target, ...props }, ref,
) {
    const safeRel = target === "_blank" ? [...new Set([...(rel || "").split(/\s+/).filter(Boolean), "noopener", "noreferrer"])].join(" ") : rel;
    const shared = { ref, rel: safeRel, target, "data-component": "link", "data-component-id": "button-link", "data-variant": variant, "data-context": context, "data-shape": shape, "data-stroke": "inner", className: `ds-button ds-button-${variant} ${className}`.trim() };
    if (typeof href === "string" && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) {
        const { prefetch: _prefetch, replace: _replace, scroll: _scroll, shallow: _shallow, locale: _locale, ...anchorProps } = props;
        return <a data-text="action" data-text-size="control" {...anchorProps} {...shared} href={href} />;
    }
    return <Link data-text="action" data-text-size="control" {...props} {...shared} href={href} />;
});

// 원형 아이콘 조작은 이름을 반드시 제공합니다. / Icon-only controls always require an accessible name.
export type SystemIconButtonProps = SystemButtonProps & ({ "aria-label": string } | { "aria-labelledby": string });
export const SystemIconButton = forwardRef<HTMLButtonElement, SystemIconButtonProps>(function SystemIconButton(
    { variant = "quiet", className = "", shape = "circle", ...props }, ref,
) {
    return <SystemButton data-component-id="icon-button" data-text="action" data-text-size="control" {...props} ref={ref} variant={variant} shape={shape} className={`ds-icon-button ${className}`.trim()} data-component="icon-button" />;
});

export const SystemFilterButton = forwardRef<HTMLButtonElement, SystemButtonProps & { selected: boolean }>(function SystemFilterButton(
    { selected, className = "", variant = "quiet", ...props }, ref,
) {
    return <SystemButton data-text="action" data-text-size="control" {...props} ref={ref} variant={variant} aria-pressed={selected} className={`ds-filter-button ${selected ? "is-active " : ""}${className}`.trim()} data-component="filter-button" data-component-id="filter-button" />;
});

// [라벨과 오류를 연결하는 폼 필드 / Fields with connected labels and feedback]
type SystemFieldCommon = { label?: ReactNode; labelHidden?: boolean; hint?: ReactNode; error?: ReactNode; variant?: ControlContext; outerClassName?: string };
export type SystemFieldProps = SystemFieldCommon & (
    | (InputHTMLAttributes<HTMLInputElement> & { as?: "input" })
    | (SelectHTMLAttributes<HTMLSelectElement> & { as: "select" })
    | (TextareaHTMLAttributes<HTMLTextAreaElement> & { as: "textarea" })
);
type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export const SystemField = forwardRef<FieldElement, SystemFieldProps>(function SystemField(
    { id: suppliedId, label, hint, error, variant = "default", labelHidden = false, outerClassName = "", as = "input", ...props }, ref,
) {
    const generatedId = useId();
    const id = suppliedId || `field-${generatedId}`;
    const message = error || hint;
    const describedBy = [props["aria-describedby"], message ? `${id}-message` : undefined].filter(Boolean).join(" ") || undefined;
    const controlProps = { ...props, id, "aria-invalid": error ? true : props["aria-invalid"], "aria-describedby": describedBy, "data-component": "field-control", "data-component-part": "control", "data-component-owner": "field", "data-text-size": "control", "data-stroke": "inner", "data-autofocus": props.autoFocus || undefined };
    return <div data-text="body" className={`ds-field ${outerClassName}`.trim()} data-component="field" data-component-id="field" data-variant={variant}>
        {label != null && <label data-text="label" data-component-part="label" data-component-owner="field" htmlFor={id} className={labelHidden ? "ds-visually-hidden" : undefined}>{label}{props.required && typeof label === "string" && <span data-text="body"> (필수)</span>}</label>}
        {as === "select" ? <select data-text="body" {...controlProps as SelectHTMLAttributes<HTMLSelectElement>} ref={ref as Ref<HTMLSelectElement>} />
            : as === "textarea" ? <textarea data-text="body" {...controlProps as TextareaHTMLAttributes<HTMLTextAreaElement>} ref={ref as Ref<HTMLTextAreaElement>} />
                : <input data-text="body" {...controlProps as InputHTMLAttributes<HTMLInputElement>} ref={ref as Ref<HTMLInputElement>} />}
        {message && <p data-text="caption" id={`${id}-message`} className={error ? "ds-field-error" : "ds-field-hint"}>{error && <Icon name="close" size={20} />}{message}</p>}
    </div>;
});

export type SystemCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: ReactNode; outerClassName?: string };
export const SystemCheckbox = forwardRef<HTMLInputElement, SystemCheckboxProps>(function SystemCheckbox(
    { label, id: suppliedId, outerClassName = "", className = "", ...props }, ref,
) {
    const generatedId = useId();
    const id = suppliedId || `check-${generatedId}`;
    return <label data-text="label" className={`ds-check ${outerClassName} ${className}`.trim()} htmlFor={id} data-component="checkbox" data-component-id="checkbox"><input data-text="body" {...props} ref={ref} id={id} type="checkbox" />{label != null && <span data-text="body">{label}</span>}</label>;
});

// [상태 배지와 안내 / Status badges and notices]
export const SystemBadge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; appearance?: Appearance }>(function SystemBadge(
    { tone = "neutral", appearance = "default", className = "", ...props }, ref,
) {
    return <span data-text="meta" {...props} ref={ref} data-component="badge" data-component-id="badge" data-tone={tone} data-appearance={appearance} className={`ds-badge ds-badge-${tone} ${className}`.trim()} />;
});

export type SystemNoticeProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & { title?: ReactNode; error?: boolean; variant?: ControlContext };
export const SystemNotice = forwardRef<HTMLDivElement, SystemNoticeProps>(function SystemNotice(
    { title, children, error = false, variant = "default", className = "", role, ...props }, ref,
) {
    return <LiquidGlass {...props} ref={ref} variant="white" className={`ds-notice ${className}`.trim()} role={role || (error ? "alert" : "status")} data-component="notice" data-component-id="notice" data-variant={variant} data-stroke="inner" data-error={error || undefined}>
        {variant !== "flow" && <Icon name={error ? "close" : "check"} size={24} />}
        <div data-text="body">{title != null && <strong data-text="item-title">{title}</strong>}<div data-text="body" className="ds-notice-content">{children}</div></div>
    </LiquidGlass>;
});
