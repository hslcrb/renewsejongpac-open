// ==========================================================================
// [커스텀 우클릭 컨텍스트 메뉴 / Custom Right-click Context Menu]
// 우클릭 시 토큰 기반 둥근 메뉴를 띄우고 페이지·링크 작업을 실행한다.
// Opens a token-based rounded menu on right click and runs page or link actions.
// ==========================================================================
"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { SystemButton } from "./SystemPrimitives";
import { showToast } from "./Toast";
import ContextMenuStyles from "./ContextMenu.module.css";

interface MenuState {
    x: number;
    y: number;
    href: string | null;
    canGoBack: boolean;
}

interface MenuAction {
    icon: string;
    label: string;
    run: () => void;
    closeAfter: boolean;
}

const MARGIN = 12;
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

export default function ContextMenu() {
    const router = useRouter();
    const [menu, setMenu] = useState<MenuState | null>(null);
    const shellRef = useRef<HTMLDivElement | null>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const isOpen = menu !== null;

    useEffect(() => {
        const onContextMenu = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            // 폼 편집 중에는 네이티브 메뉴(복사·붙여넣기)를 남긴다.
            // Keep the native menu while editing form fields (copy, paste, etc.).
            if (target?.closest(EDITABLE_SELECTOR)) return;
            event.preventDefault();
            const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
            previousFocusRef.current = document.activeElement as HTMLElement | null;
            setMenu({
                x: event.clientX,
                y: event.clientY,
                href: anchor?.href ?? null,
                canGoBack: window.history.length > 1,
            });
        };
        document.addEventListener("contextmenu", onContextMenu);
        return () => document.removeEventListener("contextmenu", onContextMenu);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const dismiss = () => setMenu(null);
        const onKeyDown = (event: KeyboardEvent) => {
            const shell = shellRef.current;
            if (!shell) return;
            const items = Array.from(shell.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
            const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
            if (event.key === "Escape" || event.key === "Tab") {
                event.preventDefault();
                previousFocusRef.current?.focus({ preventScroll: true });
                setMenu(null);
                return;
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                items[(currentIndex + 1) % items.length]?.focus();
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                items[(currentIndex - 1 + items.length) % items.length]?.focus();
            } else if (event.key === "Home") {
                event.preventDefault();
                items[0]?.focus();
            } else if (event.key === "End") {
                event.preventDefault();
                items[items.length - 1]?.focus();
            }
        };
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('[role="menu"]')) return;
            dismiss();
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown, true);
        window.addEventListener("blur", dismiss);
        window.addEventListener("resize", dismiss);
        window.addEventListener("scroll", dismiss, true);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown, true);
            window.removeEventListener("blur", dismiss);
            window.removeEventListener("resize", dismiss);
            window.removeEventListener("scroll", dismiss, true);
        };
    }, [isOpen]);

    useLayoutEffect(() => {
        const shell = shellRef.current;
        if (!menu || !shell) return;
        const rect = shell.getBoundingClientRect();
        const x = Math.max(MARGIN, Math.min(menu.x, window.innerWidth - rect.width - MARGIN));
        const y = Math.max(MARGIN, Math.min(menu.y, window.innerHeight - rect.height - MARGIN));
        shell.style.left = `${x}px`;
        shell.style.top = `${y}px`;
        shell.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus({ preventScroll: true });
    }, [menu]);

    const close = (restoreFocus: boolean = false) => {
        if (restoreFocus) previousFocusRef.current?.focus({ preventScroll: true });
        setMenu(null);
    };

    const copyAddress = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const scratch = document.createElement("textarea");
            scratch.value = text;
            scratch.setAttribute("readonly", "");
            scratch.style.position = "fixed";
            scratch.style.opacity = "0";
            scratch.style.pointerEvents = "none";
            document.body.appendChild(scratch);
            scratch.select();
            document.execCommand("copy");
            scratch.remove();
        }
        showToast("주소를 복사했어요.");
        close(true);
    };

    if (!menu) return null;

    const linkLocation = menu.href ? new URL(menu.href) : null;
    const actions: MenuAction[] = [];
    if (linkLocation) {
        actions.push({
            icon: "open_in_new",
            label: "새 창에서 열기",
            run: () => window.open(linkLocation.href, "_blank", "noopener"),
            closeAfter: true,
        });
        actions.push({
            icon: "content_copy",
            label: "링크 주소 복사",
            run: () => { void copyAddress(linkLocation.href); },
            closeAfter: false,
        });
    } else {
        actions.push({
            icon: "content_copy",
            label: "페이지 주소 복사",
            run: () => { void copyAddress(window.location.href); },
            closeAfter: false,
        });
    }

    return createPortal(
        <div data-text="body"
            ref={shellRef} data-component-id="context-menu"
            className={ContextMenuStyles.shell}
            role="menu"
            aria-label="페이지 바로가기 메뉴"
            style={{ left: menu.x, top: menu.y }}
        >
            <div data-text="body" className={ContextMenuStyles.list}>
                <SystemButton data-text="action" variant="quiet"
                    style={{ justifyContent: "flex-start" }}
                    type="button"
                    role="menuitem"
                    className={ContextMenuStyles.item}
                    onClick={() => location.reload()}
                >
                    <Icon name="refresh" size={20} />
                    새로 고침
                </SystemButton>
                {actions.map((action) => (
                    <SystemButton data-text="action" variant="quiet"
                        style={{ justifyContent: "flex-start" }}
                        key={action.label}
                        type="button"
                        role="menuitem"
                        className={ContextMenuStyles.item}
                        onClick={() => {
                            action.run();
                            if (action.closeAfter) close(true);
                        }}
                    >
                        <Icon name={action.icon} size={20} />
                        {action.label}
                    </SystemButton>
                ))}
                <SystemButton data-text="action" variant="quiet"
                    style={{ justifyContent: "flex-start" }}
                    type="button"
                    role="menuitem"
                    className={ContextMenuStyles.item}
                    disabled={!menu.canGoBack}
                    onClick={() => history.back()}
                >
                    <Icon name="undo" size={20} />
                    이전 페이지로
                </SystemButton>
                <SystemButton data-text="action" variant="quiet"
                    style={{ justifyContent: "flex-start" }}
                    type="button"
                    role="menuitem"
                    className={ContextMenuStyles.item}
                    onClick={() => router.push("/")}
                >
                    <Icon name="home" size={20} />
                    홈으로
                </SystemButton>
            </div>
            {linkLocation && (
                <>
                    <div className={ContextMenuStyles.divider} aria-hidden="true" />
                    <span data-text="body" className={ContextMenuStyles.location}>
                        {linkLocation.host}
                        {linkLocation.pathname}
                    </span>
                </>
            )}
        </div>,
        document.body
    );
}
