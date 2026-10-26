"use client";

import React, { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import QuickMenuFluid from "./QuickMenuFluid";
import type { QuickMenuInteraction } from "../src/lib/quick-menu-fluid";
import styles from "./VioletQuickMenu.module.css";

export interface VioletQuickMenuItem {
    id: string;
    label: string;
    href: string;
    icon: string;
}

export type VioletQuickMenuItems = readonly [
    VioletQuickMenuItem, VioletQuickMenuItem, VioletQuickMenuItem,
    VioletQuickMenuItem, VioletQuickMenuItem, VioletQuickMenuItem,
];

export const SEJONG_QUICK_MENU_ITEMS: VioletQuickMenuItems = [
    { id: "booking", label: "빠른 예매", href: "#quick-booking", icon: "ticket" },
    { id: "programs", label: "공연·전시", href: "/programs", icon: "calendar" },
    { id: "directions", label: "오시는 길", href: "/visit/directions", icon: "pin" },
    { id: "group", label: "단체 관람", href: "/visit/group", icon: "user" },
    { id: "rental", label: "대관 안내", href: "/rental", icon: "building" },
    { id: "account", label: "나의 예매", href: "/account", icon: "heart" },
];

export interface VioletQuickMenuProps {
    /** Keep the default fixed hero control, or contain the same menu in page content. */
    placement?: "hero" | "inline";
    /** Fade the fixed menu as this hero scrolls behind the header. */
    heroId?: string;
    items?: VioletQuickMenuItems;
    /** Lets a host carousel pause while its visitor is choosing a destination. */
    onOpenChange?: (open: boolean) => void;
}

interface Gesture {
    pointerId: number;
    capture: Element;
    centerX: number;
    centerY: number;
    startX: number;
    startY: number;
    lastAngle: number | null;
    lastTime: number;
    velocity: number;
    dragged: boolean;
}

const STEP = 60;
const radians = (degrees: number) => degrees * Math.PI / 180;
const angleDelta = (from: number, to: number) => ((to - from + 540) % 360 + 360) % 360 - 180;
const selectedAt = (rotation: number) => ((-Math.round(rotation / STEP) % 6) + 6) % 6;

function sectorPath(index: number) {
    const start = radians(-120 + index * STEP);
    const end = start + radians(STEP);
    // Browser and server math libraries can differ in their last binary digits.
    const point = (radius: number, angle: number) => `${(200 + Math.cos(angle) * radius).toFixed(3)},${(200 + Math.sin(angle) * radius).toFixed(3)}`;
    return `M ${point(195, start)} A 195,195 0 0 1 ${point(195, end)} L ${point(67, end)} A 67,67 0 0 0 ${point(67, start)} Z`;
}

function LiquidSurface() {
    return <span className={styles.art} aria-hidden="true" />;
}

/** Non-modal radial navigation for a hero or an inline preview. All destinations are real links. */
function VioletQuickMenu({ placement = "hero", heroId = "featured-season", items = SEJONG_QUICK_MENU_ITEMS, onOpenChange }: VioletQuickMenuProps) {
    const menuId = useId();
    const hintId = useId();
    const [visible, setVisible] = useState(false);
    const [open, setOpen] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(true);
    const [sleeping, setSleeping] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const dockRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const linksRef = useRef<Array<HTMLAnchorElement | null>>([]);
    const rotationRef = useRef(0);
    const gestureRef = useRef<Gesture | null>(null);
    const openRef = useRef(false);
    const pinnedRef = useRef(false);
    const hoverBlockedRef = useRef(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suppressClickUntil = useRef(0);
    const interaction = useRef<QuickMenuInteraction>({ x: -.3, y: -.5, energy: 0, velocityX: 0, velocityY: 0, spin: 0, lastInput: 0, active: false });
    const interactionSurface = useRef<EventTarget | null>(null);
    const selected = selectedAt(rotation);
    const current = items[selected];

    const clearTimers = useCallback(() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        hoverTimer.current = null;
        closeTimer.current = null;
    }, []);

    const changeRotation = useCallback((value: number) => {
        rotationRef.current = value;
        setRotation(value);
    }, []);

    const finishGesture = useCallback((cancelled = false) => {
        const gesture = gestureRef.current;
        if (!gesture) return;
        gestureRef.current = null;
        interaction.current.active = false;
        setDragging(false);
        if (gesture.dragged) {
            suppressClickUntil.current = performance.now() + 450;
            const velocity = performance.now() - gesture.lastTime < 100 ? gesture.velocity : 0;
            const coast = cancelled || reducedMotion ? 0 : Math.max(-70, Math.min(70, velocity * 110));
            changeRotation(Math.round((rotationRef.current + coast) / STEP) * STEP);
        }
        if (gesture.capture.hasPointerCapture(gesture.pointerId)) {
            gesture.capture.releasePointerCapture(gesture.pointerId);
        }
    }, [changeRotation, reducedMotion]);

    const closeMenu = useCallback((restoreFocus = false, blockHover = true) => {
        clearTimers();
        finishGesture(true);
        openRef.current = false;
        pinnedRef.current = false;
        hoverBlockedRef.current = blockHover;
        interaction.current.active = false;
        interaction.current.velocityX = 0;
        interaction.current.velocityY = 0;
        interaction.current.spin = 0;
        interactionSurface.current = null;
        setOpen(false);
        if (restoreFocus) toggleRef.current?.focus({ preventScroll: true });
    }, [clearTimers, finishGesture]);

    const openMenu = (pinned: boolean, focusLink = false) => {
        clearTimers();
        pinnedRef.current = pinned;
        openRef.current = true;
        setOpen(true);
        if (focusLink) requestAnimationFrame(() => linksRef.current[selectedAt(rotationRef.current)]?.focus({ preventScroll: true }));
    };

    useEffect(() => {
        const observed = placement === "inline" ? rootRef.current : document.getElementById(heroId);
        const root = rootRef.current;
        if (!observed || !root) return;
        const header = placement === "hero" ? document.querySelector<HTMLElement>(".renewal-header") : null;
        let frame = 0;
        let lastOpacity = -1;
        let lastVisible: boolean | null = null;
        const update = () => {
            frame = 0;
            const rect = observed.getBoundingClientRect();
            const topInset = header ? header.getBoundingClientRect().height : 0;
            const inView = rect.bottom > topInset && rect.top < window.innerHeight;
            // Start fading when the hero reaches the header; finish within a short scroll.
            const distance = Math.min(180, Math.max(120, rect.height * .25));
            const opacity = placement === "inline" ? 1 : inView ? Math.min(1, Math.max(0, (rect.top - topInset + distance) / distance)) : 0;
            const nextVisible = inView && (placement === "inline" || opacity > .001);
            if (Math.abs(opacity - lastOpacity) > .001) {
                root.style.setProperty("--hero-opacity", opacity.toFixed(4));
                lastOpacity = opacity;
            }
            // No invisible links can intercept pointer or keyboard input during dismissal.
            root.inert = !nextVisible;
            if (nextVisible !== lastVisible) {
                lastVisible = nextVisible;
                setVisible(nextVisible);
            }
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
        update();
        // Event-driven and coalesced: no idle loop or per-scroll React render.
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
        observer?.observe(observed);
        if (header) observer?.observe(header);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            observer?.disconnect();
        };
    }, [heroId, placement]);

    useEffect(() => {
        // A lost window or changed wheel geometry must not leave a captured drag active.
        const cancel = () => finishGesture(true);
        window.addEventListener("blur", cancel);
        window.addEventListener("resize", cancel);
        return () => {
            window.removeEventListener("blur", cancel);
            window.removeEventListener("resize", cancel);
        };
    }, [finishGesture]);

    useEffect(() => {
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotion = () => setReducedMotion(motion.matches);
        const updateVisibility = () => setSleeping(document.hidden);
        updateMotion();
        updateVisibility();
        motion.addEventListener("change", updateMotion);
        document.addEventListener("visibilitychange", updateVisibility);
        return () => { motion.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", updateVisibility); };
    }, []);

    useEffect(() => {
        if (!visible || sleeping) closeMenu();
        else hoverBlockedRef.current = false;
    }, [visible, sleeping, closeMenu]);
    useEffect(() => { onOpenChange?.(open && visible); }, [open, visible, onOpenChange]);
    useEffect(() => () => { clearTimers(); onOpenChange?.(false); }, [clearTimers, onOpenChange]);

    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => {
            if (!dockRef.current?.contains(event.target as Node)) closeMenu(false, false);
        };
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, [open, closeMenu]);

    const selectItem = (index: number, focus = false) => {
        const delta = angleDelta(rotationRef.current, -index * STEP);
        changeRotation(rotationRef.current + delta);
        if (Math.abs(delta) > .01) {
            interaction.current.spin = Math.max(-.5, Math.min(.5, delta / 120));
            interaction.current.lastInput = performance.now();
        }
        if (focus) linksRef.current[index]?.focus({ preventScroll: true });
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            closeMenu(true);
            return;
        }
        if (event.altKey || event.ctrlKey || event.metaKey || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        if (!open) { openMenu(true, true); return; }
        const focused = linksRef.current.findIndex(link => link === document.activeElement);
        const from = focused >= 0 ? focused : selected;
        const next = event.key === "Home" ? 0 : event.key === "End" ? 5 : (from + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + 6) % 6;
        pinnedRef.current = true;
        selectItem(next, true);
    };

    const trackSurfacePointer = (event: React.PointerEvent<HTMLElement>, reset = false, bounds?: DOMRect) => {
        if (!event.isPrimary) return;
        const rect = bounds || event.currentTarget.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1));
        const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height) * 2 - 1));
        const now = performance.now();
        const pointer = interaction.current;
        const continuous = !reset && interactionSurface.current === event.currentTarget && now - pointer.lastInput < 120;
        const elapsed = Math.max(8, now - pointer.lastInput);
        const velocityX = continuous ? Math.max(-8, Math.min(8, (x - pointer.x) * 1000 / elapsed)) : 0;
        const velocityY = continuous ? Math.max(-8, Math.min(8, (y - pointer.y) * 1000 / elapsed)) : 0;
        pointer.velocityX = continuous ? pointer.velocityX * .4 + velocityX * .6 : 0;
        pointer.velocityY = continuous ? pointer.velocityY * .4 + velocityY * .6 : 0;
        pointer.x = x;
        pointer.y = y;
        pointer.lastInput = now;
        pointer.active = true;
        pointer.energy = Math.min(1, Math.hypot(pointer.velocityX, pointer.velocityY) / 8);
        if (!gestureRef.current) pointer.spin = 0;
        interactionSurface.current = event.currentTarget;
    };

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.isPrimary || event.button !== 0 || gestureRef.current || (event.target as Element).closest("[data-no-drag]")) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        trackSurfacePointer(event, true, bounds);
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const capture = (event.target as Element).closest("a") || event.currentTarget;
        // Capturing on the original anchor preserves ordinary taps and modified clicks.
        capture.setPointerCapture(event.pointerId);
        suppressClickUntil.current = 0;
        gestureRef.current = {
            pointerId: event.pointerId, capture, centerX, centerY,
            startX: event.clientX, startY: event.clientY,
            lastAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
            lastTime: performance.now(), velocity: 0, dragged: false,
        };
        pinnedRef.current = true;
        clearTimers();
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        trackSurfacePointer(event);
        const gesture = gestureRef.current;
        if (!gesture || event.pointerId !== gesture.pointerId) return;
        const x = event.clientX - gesture.centerX;
        const y = event.clientY - gesture.centerY;
        if (Math.hypot(x, y) < 32) { gesture.lastAngle = null; return; }
        const angle = Math.atan2(y, x) * 180 / Math.PI;
        if (gesture.lastAngle === null) { gesture.lastAngle = angle; return; }
        const delta = angleDelta(gesture.lastAngle, angle);
        const now = performance.now();
        if (!gesture.dragged && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) >= 7) {
            gesture.dragged = true;
            setDragging(true);
        }
        if (gesture.dragged) {
            event.preventDefault();
            changeRotation(rotationRef.current + delta);
            gesture.velocity = gesture.velocity * .55 + (delta / Math.max(8, now - gesture.lastTime)) * .45;
            interaction.current.energy = Math.min(1, Math.abs(gesture.velocity) * 1.7);
            interaction.current.spin = Math.max(-1, Math.min(1, gesture.velocity * 1.8));
        }
        gesture.lastAngle = angle;
        gesture.lastTime = now;
    };

    const onNavigate = (event: React.MouseEvent<HTMLAnchorElement>, item: VioletQuickMenuItem) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        closeMenu();
        if (item.href.startsWith("#")) {
            const section = document.getElementById(item.href.slice(1));
            if (!section) return;
            event.preventDefault();
            window.history.pushState(window.history.state, "", item.href);
            const heading = section.querySelector<HTMLElement>("h2, h3") || section;
            heading.setAttribute("tabindex", "-1");
            heading.focus({ preventScroll: true });
            section.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
        }
    };

    const renderLink = (item: VioletQuickMenuItem, index: number) => {
        const angle = radians(index * STEP - 90);
        return <Link data-text="action"
            key={item.id}
            ref={node => { linksRef.current[index] = node; }}
            href={item.href}
            prefetch={false}
            draggable={false}
            className={styles.menuLink}
            data-violet-link={item.id}
            data-selected={selected === index}
            tabIndex={open ? 0 : -1}
            style={{ "--item-x": `${(50 + Math.cos(angle) * 35.5).toFixed(4)}%`, "--item-y": `${(50 + Math.sin(angle) * 35.5).toFixed(4)}%` } as React.CSSProperties}
            onFocus={() => {
                if (openRef.current && !gestureRef.current) {
                    pinnedRef.current = true;
                    selectItem(index);
                }
            }}
            onClick={event => onNavigate(event, item)}
        ><span className={styles.menuLabel}><Icon name={item.icon} size={24} /><span data-text="body">{item.label}</span></span></Link>;
    };

    return <div data-component-id="quick-menu" ref={rootRef} className={styles.experience} data-violet-menu data-placement={placement} data-visible={visible} data-state={open ? "open" : "closed"} data-sleeping={sleeping || !visible} aria-hidden={!visible}>
        <div
            ref={dockRef}
            className={styles.dock}
            onKeyDown={onKeyDown}
            onPointerEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
            onPointerLeave={event => {
                hoverBlockedRef.current = false;
                if (!gestureRef.current) interaction.current.active = false;
                if (hoverTimer.current) clearTimeout(hoverTimer.current);
                if (openRef.current && event.pointerType === "mouse" && !pinnedRef.current && !gestureRef.current) closeTimer.current = setTimeout(() => closeMenu(false, false), 220);
            }}
            onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) closeMenu(false, false); }}
        >
            <div className={styles.panel} aria-hidden={!open}>
                <p data-text="body" className={styles.instruction} id={hintId}>원을 돌려 고르고, 눌러서 이동해요</p>
                <nav id={menuId} aria-label="원형 퀵메뉴" aria-describedby={hintId}>
                    <div
                        className={styles.wheel}
                        data-violet-wheel
                        data-rotation={rotation}
                        data-dragging={dragging}
                        style={{ "--rotation": `${rotation}deg` } as React.CSSProperties}
                        onPointerEnter={event => trackSurfacePointer(event, true)}
                        onPointerLeave={() => { if (!gestureRef.current) interaction.current.active = false; }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={event => { if (event.pointerId === gestureRef.current?.pointerId) finishGesture(); }}
                        onPointerCancel={event => { if (event.pointerId === gestureRef.current?.pointerId) finishGesture(true); }}
                        onLostPointerCapture={event => { if (event.pointerId === gestureRef.current?.pointerId) finishGesture(true); }}
                        onClickCapture={event => {
                            if (event.detail !== 0 && performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); }
                        }}
                        onDragStart={event => event.preventDefault()}
                    >
                        <LiquidSurface />
                        <QuickMenuFluid awake={visible && open && !sleeping} animated={!reducedMotion && !sleeping} expanded interaction={interaction} />
                        <div data-text="body" className={styles.rotor}>
                            <svg className={styles.slices} viewBox="0 0 400 400" aria-hidden="true">
                                {items.map((item, index) => <path key={item.id} className={styles.slice} d={sectorPath(index)} data-selected={selected === index} />)}
                            </svg>
                            {items.map(renderLink)}
                        </div>
                        <span className={styles.marker} aria-hidden="true" />
                        <Link data-text="action" href={current.href} prefetch={false} className={styles.current} data-violet-current data-no-drag tabIndex={open ? 0 : -1} onClick={event => onNavigate(event, current)} aria-label={`${current.label}로 이동`}>
                            <strong data-text="item-title" data-text-size="quick-action">{current.label}</strong>
                            <Icon name="diagonal" size={19} />
                        </Link>
                        <span data-text="body" className="sr-only" aria-live="polite" aria-atomic="true">{open && !dragging ? `선택한 메뉴: ${current.label}.` : ""}</span>
                    </div>
                </nav>
            </div>
            <button data-text="action"
                data-system-part="violet-toggle"
                ref={toggleRef}
                type="button"
                className={styles.toggle}
                data-violet-toggle
                aria-label={open ? "퀵메뉴 닫기" : "퀵메뉴 열기"}
                aria-expanded={open}
                aria-controls={menuId}
                onClick={event => { if (open) closeMenu(); else openMenu(true, event.detail === 0); }}
                onPointerMove={event => { if (!open) trackSurfacePointer(event); }}
                onPointerEnter={event => {
                    if (!open) trackSurfacePointer(event, true);
                    if (event.pointerType !== "mouse" || open || hoverBlockedRef.current || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
                    clearTimers();
                    hoverTimer.current = setTimeout(() => openMenu(false), 180);
                }}
            >
                <LiquidSurface />
                <QuickMenuFluid awake={visible && !open && !sleeping} animated={!reducedMotion && !sleeping} interaction={interaction} />
                {open ? <Icon name="close" size={21} /> : <span className={styles.toggleLabel} aria-hidden="true">
                    <Icon name="menu" size={24} />
                    <span data-text="body">퀵메뉴</span>
                </span>}
                <span data-text="body" className={styles.closedHint} aria-hidden="true">돌려서 둘러보기</span>
            </button>
        </div>
    </div>;
}

export default memo(VioletQuickMenu);
