"use client";

import { useEffect, useRef } from "react";

interface HomeAnchorNavigationProps {
    /** Reveal a filtered item or slide before the corresponding anchor is focused. */
    resolveAnchor: (id: string) => boolean;
}

const hiddenByContent = (element: HTMLElement) =>
    Boolean(element.closest('[hidden], [inert], [aria-hidden="true"]'));

function focusTarget(target: HTMLElement) {
    const canFocus = (element: HTMLElement) =>
        !hiddenByContent(element) && !element.matches(":disabled") && element.getClientRects().length > 0;
    const nativeTarget = target.matches("a[href], button, input, select, textarea, [tabindex]") && canFocus(target);
    const heading = Array.from(target.querySelectorAll<HTMLElement>("h1, h2, h3, h4")).find(canFocus);
    const control = Array.from(target.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea")).find(canFocus);
    const parentLink = target.closest<HTMLAnchorElement>("a[href]");
    const element = nativeTarget ? target : heading || control || parentLink || (target.matches(":disabled") ? target.parentElement : target);
    if (!element || !canFocus(element)) return;

    const temporaryTabIndex = !element.matches("a[href], button, input, select, textarea, [tabindex]");
    if (temporaryTabIndex) {
        element.setAttribute("tabindex", "-1");
        element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true });
    }
    element.focus({ preventScroll: true });
}

/** Resolve fragment navigation once per navigation, never on a carousel render. */
export default function HomeAnchorNavigation({ resolveAnchor }: HomeAnchorNavigationProps) {
    const resolveRef = useRef(resolveAnchor);
    resolveRef.current = resolveAnchor;

    useEffect(() => {
        let frame = 0;
        let navigation = 0;
        let disposed = false;
        const html = document.documentElement;
        const previousOffset = html.style.getPropertyValue("--anchor-header-offset");
        const header = document.getElementById("header");

        const headerOffset = () => {
            if (!header) return 0;
            const stickyTop = Number.parseFloat(getComputedStyle(header).top) || 0;
            return Math.max(0, header.getBoundingClientRect().height + Math.min(0, stickyTop));
        };
        const measureHeader = () => html.style.setProperty("--anchor-header-offset", `${Math.ceil(headerOffset())}px`);
        measureHeader();
        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureHeader);
        if (header) observer?.observe(header);
        window.addEventListener("resize", measureHeader);

        const navigate = () => {
            const token = ++navigation;
            cancelAnimationFrame(frame);
            let id: string;
            try { id = decodeURIComponent(window.location.hash.slice(1)); }
            catch { return; }
            if (!id || !resolveRef.current(id)) return;
            let attempts = 0;

            const place = () => {
                if (disposed || token !== navigation) return;
                const target = document.getElementById(id);
                if (!target || hiddenByContent(target) || !target.getClientRects().length) {
                    // The resolver can commit a filter/slide change on the next React frame.
                    if (++attempts < 20) frame = requestAnimationFrame(place);
                    return;
                }

                // Reveal a booking item in its own vertical list without moving a carousel.
                const list = target.closest<HTMLElement>(".quick-program-list");
                if (list && list !== target) {
                    const itemRect = target.getBoundingClientRect();
                    const listRect = list.getBoundingClientRect();
                    list.scrollTop += itemRect.top - listRect.top - 8;
                }
                focusTarget(target);
                const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerOffset() - 16);
                // Fragment navigation is immediate; it never scrolls a cloned slide sideways.
                window.scrollTo({ top, left: window.scrollX, behavior: "instant" });
            };

            // The preloaded font can finish after the server's native fragment jump.
            // Wait for its final layout, then let React reveal the requested content.
            if (document.fonts.status === "loading") document.fonts.ready.then(() => {
                if (!disposed && token === navigation) frame = requestAnimationFrame(place);
            });
            else frame = requestAnimationFrame(place);
        };

        navigate();
        window.addEventListener("hashchange", navigate);
        window.addEventListener("popstate", navigate);
        window.addEventListener("pageshow", navigate);
        return () => {
            disposed = true;
            navigation++;
            cancelAnimationFrame(frame);
            observer?.disconnect();
            window.removeEventListener("resize", measureHeader);
            window.removeEventListener("hashchange", navigate);
            window.removeEventListener("popstate", navigate);
            window.removeEventListener("pageshow", navigate);
            if (previousOffset) html.style.setProperty("--anchor-header-offset", previousOffset);
            else html.style.removeProperty("--anchor-header-offset");
        };
    }, []);

    return null;
}
