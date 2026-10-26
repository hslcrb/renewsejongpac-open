"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { DialogHTMLAttributes, RefObject } from "react";

// [중첩 모달의 스크롤 잠금 / Scroll locking for nested modals]
const modalLocks = new Set<HTMLDialogElement>();
let previousOverflow = "";
function lockScroll(dialog: HTMLDialogElement) {
    if (modalLocks.has(dialog)) return;
    if (!modalLocks.size) previousOverflow = document.body.style.overflow;
    modalLocks.add(dialog);
    document.body.style.overflow = "hidden";
}
function unlockScroll(dialog: HTMLDialogElement) {
    if (!modalLocks.delete(dialog)) return;
    if (!modalLocks.size) document.body.style.overflow = previousOverflow;
}

// [네이티브 모달 수명 주기 / Native modal lifecycle]
// ref.showModal()과 제어형 open 모두 동일한 초점 및 정리 동작을 사용합니다.
// Imperative and controlled opening share focus restoration and cleanup.
export type SystemDialogProps = DialogHTMLAttributes<HTMLDialogElement> & {
    triggerRef?: RefObject<HTMLElement>;
    initialFocusRef?: RefObject<HTMLElement>;
    closeOnBackdrop?: boolean;
};

export const SystemDialog = forwardRef<HTMLDialogElement, SystemDialogProps>(function SystemDialog(
    { open, triggerRef, initialFocusRef, closeOnBackdrop = true, className = "", onClick, children, ...props }, forwardedRef,
) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const focusRefs = useRef({ triggerRef, initialFocusRef });
    focusRefs.current = { triggerRef, initialFocusRef };
    useImperativeHandle(forwardedRef, () => dialogRef.current!, []);

    useEffect(() => {
        const dialog = dialogRef.current!;
        const nativeShowModal = dialog.showModal;
        const nativeClose = dialog.close;
        let returnFocus: HTMLElement | null = null;
        let active = false;
        function available(element: HTMLElement) {
            return dialog.contains(element) && !element.matches(":disabled") && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden" && !element.closest("[inert]");
        }
        function enter() {
            if (active) return;
            active = true;
            lockScroll(dialog);
            const preferred = focusRefs.current.initialFocusRef?.current;
            const autofocus = [...dialog.querySelectorAll<HTMLElement>("[autofocus],[data-autofocus]")].find(available);
            const first = preferred && available(preferred) ? preferred : autofocus || [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])")].find(available);
            if (first) first.focus({ preventScroll: true });
            else dialog.focus({ preventScroll: true });
        }
        function leave() {
            if (!active) return;
            active = false;
            unlockScroll(dialog);
            const target = focusRefs.current.triggerRef?.current || returnFocus;
            if (target?.isConnected) target.focus({ preventScroll: true });
            returnFocus = null;
        }
        function containTab(event: KeyboardEvent) {
            if (!active || event.key !== "Tab" || event.defaultPrevented) return;
            const controls = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])")].filter((element) => element.tabIndex >= 0 && available(element));
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (!first) { event.preventDefault(); dialog.focus(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
        dialog.showModal = function () {
            if (dialog.open) return;
            returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            nativeShowModal.call(dialog);
            enter();
        };
        dialog.close = function (returnValue?: string) {
            nativeClose.call(dialog, returnValue);
            leave();
        };
        dialog.addEventListener("close", leave);
        dialog.addEventListener("keydown", containTab);
        // open 속성 제거와 브라우저 Escape 닫기도 자원을 정리합니다.
        // Attribute removal and browser Escape dismissal also release resources.
        const observer = new MutationObserver(() => {
            if (!dialog.open) leave();
            else if (dialog.matches(":modal")) enter();
        });
        observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
        if (dialog.open && dialog.matches(":modal")) enter();
        return () => {
            observer.disconnect();
            dialog.removeEventListener("close", leave);
            dialog.removeEventListener("keydown", containTab);
            dialog.showModal = nativeShowModal;
            dialog.close = nativeClose;
            leave();
        };
    }, []);

    useEffect(() => {
        if (open === undefined) return;
        const dialog = dialogRef.current!;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    return <dialog data-text="body" {...props} ref={dialogRef} className={`ds-dialog ${className}`.trim()} data-component="dialog" data-component-id="dialog" data-stroke="inner" onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !closeOnBackdrop || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
    }}>{children}</dialog>;
});

export default SystemDialog;
