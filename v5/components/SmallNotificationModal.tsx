"use client";

import { useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import LiquidGlass from "./LiquidGlass";
import { textAttributes } from "./SystemText";

export type SmallNotificationModalProps = HTMLAttributes<HTMLDivElement> & { open: boolean; message: string; id?: string };

// [알림소형모달: 비차단 캡슐 / Small notification modal: a nonblocking capsule]
export default function SmallNotificationModal({ open, message, id, ...props }: SmallNotificationModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(
        <LiquidGlass {...props} id={id} variant="black" className={`toast small-notification-modal${open ? " visible" : ""}`}
            data-component="알림소형모달" data-component-id="small-notification" role="status" aria-live="polite" aria-atomic="true"
            aria-hidden={!open || undefined}>
            <span {...textAttributes("body")}>{message}</span>
        </LiquidGlass>, document.body,
    );
}

export function showSmallNotification(message: string) {
    if (typeof window !== "undefined" && message.trim())
        window.dispatchEvent(new CustomEvent("sejong-toast", { detail: message }));
}

// [연속 알림은 같은 창에서 3.5초 갱신 / Consecutive notices renew one 3.5-second capsule]
export function SmallNotificationModalHost({ duration = 3500 }: { duration?: number }) {
    const [notice, setNotice] = useState({ open: false, message: "" });
    useEffect(() => {
        let timer = 0;
        const show = (event: Event) => {
            const message = (event as CustomEvent<unknown>).detail;
            if (typeof message !== "string" || !message.trim()) return;
            clearTimeout(timer);
            setNotice({ open: true, message });
            timer = window.setTimeout(() => setNotice(current => ({ ...current, open: false })), duration);
        };
        window.addEventListener("sejong-toast", show);
        return () => { clearTimeout(timer); window.removeEventListener("sejong-toast", show); };
    }, [duration]);
    return <SmallNotificationModal id="toast" {...notice} data-component-part="notification-host" data-component-owner="small-notification" />;
}
