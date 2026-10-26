"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { constrainPanel, initialPanelPosition } from "../src/lib/floating-panel";
import type { PanelFrame, PanelPoint } from "../src/lib/floating-panel";

// [마우스·터치·키보드의 같은 위치 / Shared pointer, touch and keyboard positioning]
export default function useFloatingPanel(
    panelRef: RefObject<HTMLDivElement>,
    savedPosition: { current: PanelPoint | null },
    onClose: () => void,
    docked = false,
) {
    const [moveMode, setMoveMode] = useState(false);
    const [announcement, setAnnouncement] = useState("");
    const moving = useRef(false);
    moving.current = moveMode;

    useLayoutEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        let frame: PanelFrame;
        let point: PanelPoint;
        let pending = 0;
        let suppressClick = false;
        let clickReset = 0;
        let gesture: {
            id: number;
            x: number;
            y: number;
            origin: PanelPoint;
            dragging: boolean;
        } | null = null;

        const paint = () => {
            pending = 0;
            panel.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
        };
        const move = (target: PanelPoint) => {
            point = constrainPanel(target, frame);
            // 화면 크기 보정은 사용자가 옮긴 원래 위치를 덮어쓰지 않습니다.
            // Only an intentional move replaces the saved desktop position.
            if (!docked) savedPosition.current = point;
            if (!pending) pending = requestAnimationFrame(paint);
        };
        const measure = () => {
            if (pending) cancelAnimationFrame(pending);
            frame = {
                width: document.documentElement.clientWidth,
                height: window.innerHeight,
                panelWidth: panel.offsetWidth,
                panelHeight: panel.offsetHeight,
                inset: 12,
            };
            point = docked ? { x: 0, y: 0 } : constrainPanel(savedPosition.current || initialPanelPosition(frame), frame);
            paint();
            panel.dataset.ready = "true";
        };
        const finish = () => {
            if (!gesture) return;
            const { id, dragging } = gesture;
            gesture = null;
            if (panel.hasPointerCapture(id)) panel.releasePointerCapture(id);
            delete panel.dataset.dragging;
            if (pending) {
                cancelAnimationFrame(pending);
                paint();
            }
            if (dragging) {
                suppressClick = true;
                clearTimeout(clickReset);
                clickReset = window.setTimeout(() => {
                    suppressClick = false;
                }, 0);
                setAnnouncement("메뉴 위치를 옮겼습니다.");
            }
        };
        const down = (event: PointerEvent) => {
            if (docked || panel.dataset.phase !== "open") return;
            const target = event.target as Element;
            if (
                !event.isPrimary ||
                event.button !== 0 ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey
            )
                return;
            if (target.closest("button,input,textarea,select,[contenteditable=true]")) return;
            // 터치 본문은 스크롤, 제목과 이동 모드는 자유 이동입니다.
            // Touch content scrolls; the heading and move mode allow free dragging.
            if (
                event.pointerType === "touch" &&
                !moving.current &&
                !target.closest(".floating-panel-header")
            )
                return;
            measure();
            gesture = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                origin: point,
                dragging: false,
            };
        };
        const track = (event: PointerEvent) => {
            if (!gesture || event.pointerId !== gesture.id) return;
            const dx = event.clientX - gesture.x;
            const dy = event.clientY - gesture.y;
            if (!gesture.dragging && Math.hypot(dx, dy) < 6) return;
            if (!gesture.dragging) {
                gesture.dragging = true;
                panel.setPointerCapture(event.pointerId);
                panel.dataset.dragging = "true";
                setAnnouncement("");
            }
            if (event.cancelable) event.preventDefault();
            move({ x: gesture.origin.x + dx, y: gesture.origin.y + dy });
        };
        const up = (event: PointerEvent) => {
            if (gesture?.id === event.pointerId) finish();
        };
        const preventDraggedClick = (event: MouseEvent) => {
            if (suppressClick) {
                suppressClick = false;
                event.preventDefault();
                event.stopPropagation();
            }
        };
        const preventNativeDrag = (event: DragEvent) => event.preventDefault();
        const keyboard = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            const target = event.target as Element;
            if (docked) return;
            if (!target.closest("[data-panel-move]")) return;
            const step = event.shiftKey ? 4 : 16;
            const directions: Record<string, PanelPoint> = {
                ArrowLeft: { x: -step, y: 0 },
                ArrowRight: { x: step, y: 0 },
                ArrowUp: { x: 0, y: -step },
                ArrowDown: { x: 0, y: step },
            };
            if (event.key === "Home") {
                event.preventDefault();
                move(initialPanelPosition(frame));
            } else if (directions[event.key]) {
                event.preventDefault();
                const delta = directions[event.key];
                move({ x: point.x + delta.x, y: point.y + delta.y });
            } else return;
            setAnnouncement("메뉴 위치를 옮겼습니다.");
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(panel);
        panel.addEventListener("pointerdown", down);
        panel.addEventListener("click", preventDraggedClick, true);
        panel.addEventListener("dragstart", preventNativeDrag);
        window.addEventListener("pointermove", track, { passive: false });
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
        window.addEventListener("blur", finish);
        window.addEventListener("keydown", keyboard);
        window.addEventListener("resize", measure);
        window.visualViewport?.addEventListener("resize", measure);
        return () => {
            finish();
            clearTimeout(clickReset);
            if (pending) cancelAnimationFrame(pending);
            observer.disconnect();
            panel.removeEventListener("pointerdown", down);
            panel.removeEventListener("click", preventDraggedClick, true);
            panel.removeEventListener("dragstart", preventNativeDrag);
            window.removeEventListener("pointermove", track);
            window.removeEventListener("pointerup", up);
            window.removeEventListener("pointercancel", up);
            window.removeEventListener("blur", finish);
            window.removeEventListener("keydown", keyboard);
            window.removeEventListener("resize", measure);
            window.visualViewport?.removeEventListener("resize", measure);
        };
    }, [panelRef, savedPosition, onClose, docked]);

    return { moveMode, setMoveMode, announcement };
}
