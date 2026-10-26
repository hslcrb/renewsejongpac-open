// [상태 변화의 공통 모션 / Shared motion for state changes]
// 현재 상태에서 새 입력을 받아들이며 모션 감소 설정에서는 즉시 최종 상태를 보여 줍니다.
// Retarget interrupted input and resolve immediately when reduced motion is requested.
const preference = typeof matchMedia === "function"
    ? matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener() {} };
const activeAnimations = new Map();
const easeOut = typeof document === "undefined" ? "cubic-bezier(0.22, 1, 0.36, 1)"
    : getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "cubic-bezier(0.22, 1, 0.36, 1)";

function stopAnimation(element) {
    const record = activeAnimations.get(element);
    if (!record) return;
    activeAnimations.delete(element);
    record.animation.cancel();
}

function finishAnimation(element) {
    const record = activeAnimations.get(element);
    if (!record) return;
    activeAnimations.delete(element);
    record.animation.cancel();
    record.complete();
}

function play(element, keyframes, duration, complete = () => {}, options = {}) {
    stopAnimation(element);
    if (!element?.isConnected || preference.matches || document.hidden || !element.animate) {
        complete();
        return null;
    }
    const animation = element.animate(keyframes, { duration, easing: easeOut, fill: "both", delay: options.delay || 0 });
    animation.id = `sejong-${options.kind || "feedback"}`;
    const record = { animation, complete, kind: options.kind || "feedback" };
    activeAnimations.set(element, record);
    animation.onfinish = () => {
        if (activeAnimations.get(element) !== record) return;
        activeAnimations.delete(element);
        complete();
        animation.cancel();
    };
    return animation;
}

preference.addEventListener("change", () => {
    if (!preference.matches) return;
    for (const element of [...activeAnimations.keys()]) finishAnimation(element);
});

// [숨겨진 탭의 모션 정리 / Finish motion in hidden tabs]
// 돌아왔을 때 오래된 전환이 재생되지 않도록 최종 상태를 즉시 확정합니다.
// Resolve final state instead of replaying stale transitions when the tab returns.
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => {
    if (document.hidden) [...activeAnimations.keys()].forEach(finishAnimation);
});

export function cancelMotion(container) {
    if (!container) return;
    container.dispatchEvent(new CustomEvent("motion:cancel", { bubbles: true }));
    for (const element of activeAnimations.keys()) {
        if (element === container || container.contains(element)) finishAnimation(element);
    }
}

export function animateFeedback(element, kind = "content") {
    if (!element) return null;
    if (kind === "favorite") element = element.querySelector("svg") || element;
    const current = activeAnimations.has(element) ? getComputedStyle(element) : null;
    const opacity = current?.opacity || (kind === "emphasis" ? "0.65" : "0.35");
    const transform = current?.transform;
    if (kind === "route" && typeof element.getTotalLength === "function") {
        const length = element.getTotalLength();
        return play(element, [
            { strokeDasharray: `${length}`, strokeDashoffset: `${length}` },
            { strokeDasharray: `${length}`, strokeDashoffset: "0" },
        ], 240, undefined, { kind: "route" });
    }
    if (kind === "forward" || kind === "backward") {
        return play(element, [
            { opacity, transform: transform || `translateX(${kind === "forward" ? 12 : -12}px)` },
            { opacity: 1, transform: "none" },
        ], 200, undefined, { kind: "direction" });
    }
    if (kind === "step") {
        return play(element, [
            { opacity, transform: transform || "translateY(8px)" },
            { opacity: 1, transform: "none" },
        ], 200);
    }
    if (kind === "success") {
        return play(element, [
            { opacity, transform: transform || "scale(0.98)" },
            { opacity: 1, transform: "none" },
        ], 220);
    }
    return play(element, [{ opacity }, { opacity: 1 }], ["error", "status"].includes(kind) ? 180 : 160,
        undefined, { kind });
}

// [목록의 읽기 순서와 위치 연속성 / Reading order and list continuity]
// 데이터와 레이아웃은 즉시 갱신하고 같은 항목의 시각 위치만 짧게 이어 줍니다.
// Commit data and layout immediately; bridge only the visual position of surviving items.
function inViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
}

export function captureLayout(container, selector) {
    return new Map([...container?.querySelectorAll(selector) || []].map(element => [
        element.dataset.motionKey || element.id, element.getBoundingClientRect(),
    ]).filter(([key]) => key));
}

export function animateLayout(container, before, selector) {
    if (!container) return;
    const elements = [...container.querySelectorAll(selector)];
    elements.forEach(element => cancelMotion(element));
    const measured = elements.map(element => ({ element, rect: element.getBoundingClientRect() }));
    measured.forEach(({ element, rect }) => {
        if (!inViewport(element) || element.contains(document.activeElement)) return;
        const previous = before?.get(element.dataset.motionKey || element.id);
        if (!previous) {
            animateFeedback(element, "content");
            return;
        }
        const x = previous.left - rect.left;
        const y = previous.top - rect.top;
        if (Math.abs(x) + Math.abs(y) < 1) return;
        if (Math.abs(x) > innerWidth / 2 || Math.abs(y) > innerHeight / 2) {
            animateFeedback(element, "content");
            return;
        }
        play(element, [{ transform: `translate(${x}px, ${y}px)` }, { transform: "none" }], 220,
            undefined, { kind: "layout" });
    });
}

export function animateSequence(elements, kind = "content", { stagger = 35, maxDelay = 140 } = {}) {
    [...elements].filter(element => inViewport(element) && !element.contains(document.activeElement)).forEach((element, index) => {
        const keyframes = kind === "item"
            ? [{ opacity: 0.4, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }]
            : [{ opacity: 0.4 }, { opacity: 1 }];
        play(element, keyframes, 220, undefined, { delay: Math.min(index * stagger, maxDelay), kind: "sequence" });
    });
}

// [트리거에 연결된 패널의 열림·닫힘 / Trigger-connected panel presence]
// 역방향 입력은 현재 값에서 이어지고 닫히는 내용은 즉시 키보드 탐색에서 제외합니다.
// Reverse from the current frame and remove closing content from keyboard navigation immediately.
export function animatePresence(element, open, { trigger } = {}) {
    if (!element) return null;
    const current = element.hidden ? null : getComputedStyle(element);
    const start = { opacity: current?.opacity || "0", transform: current?.transform || "scale(0.98)" };
    if (!open && element.contains(document.activeElement)) trigger?.focus({ preventScroll: true });
    element.hidden = false;
    element.inert = !open;
    element.setAttribute("aria-hidden", String(!open));
    return play(element, [start, { opacity: open ? 1 : 0, transform: open ? "none" : "scale(0.98)" }], open ? 160 : 120, () => {
        element.hidden = !open;
        element.inert = false;
        element.removeAttribute("aria-hidden");
    }, { kind: "presence" });
}

// [페이지 역할별 등장 대상 / Entrance surfaces by page role]
// 제목·사진·편집 목록을 구분하며 표·정책 본문·날짜·좌석·입력 컨트롤은 대상에서 제외합니다.
// Distinguish headings, imagery and editorial groups; keep tables, policies and inputs stable.
const entranceSurfaces = [
    { kind: "heading", selector: ".page-title-row, .program-page-heading > div, .program-detail-summary > h1" },
    { kind: "editorial", selector: [
        ".section-heading", ".info-section-heading", ".overview-section-heading", ".program-results-heading",
        ".overview-intro-copy", ".institution-story-heading", ".news-editorial-copy", ".program-feature__copy",
        ".identity-story > div:first-child", ".home-identity .identity-layout > div:first-child",
        ".newsletter-intro > div:first-child", ".info-statement", ".program-history-hero > h2",
        ".membership-hero > h2", ".company-hero > h2", ".donation-hero > h2", ".esg-statement",
        ".program-season-banner > h2", ".visit-editorial > h2", ".card-banner-link > div:first-child",
        ".overview-help > div:first-child", ".account-auth-intro", ".footer-utility .container",
        ".journey-intro", ".journey-consultation", ".discovery-group > h2",
    ].join(", ") },
    { kind: "media", selector: [
        ".overview-intro-media", ".institution-story > figure", ".program-detail-artwork",
        ".program-feature__image", ".venue-detail-hero > img", ".venue-row-image",
        ".visit-photograph", ".news-editorial-feature > img", ".goods-detail-art > .goods-art",
    ].join(", ") },
    { kind: "group", selector: [
        ".home-program-grid > *", ".program-results-grid > *", ".info-program-grid > *",
        ".program-season-grid > *", ".info-link-grid > *", ".overview-services > *", ".overview-process > *",
        ".event-grid > *", ".magazine-grid > *", ".lost-item-grid > *", ".company-list > *",
        ".goods-grid > *", ".news-editorial-list > *", ".program-history-stories > *",
        ".english-grid > section", ".sitemap-grid > *",
    ].join(", ") },
];

function enterSurface(element, kind, delay, complete) {
    let keyframes = [{ opacity: 0.4 }, { opacity: 1 }];
    let duration = 220;
    if (kind === "heading" || kind === "editorial") {
        keyframes = [
            { opacity: 0.4, transform: `translateY(${kind === "heading" ? 8 : 12}px)` },
            { opacity: 1, transform: "none" },
        ];
        duration = kind === "heading" ? 260 : 320;
    } else if (kind === "media") {
        keyframes = [
            { opacity: 0.5, clipPath: "inset(0 10% 0 0)" },
            { opacity: 1, clipPath: "inset(0 0 0 0)" },
        ];
        duration = 430;
    }
    return play(element, keyframes, duration, complete, { delay, kind: `enter-${kind}` });
}

// [검색·메뉴의 진입과 닫힘 / Search and menu dialog transitions]
// 네이티브 dialog의 포커스·Escape·배경 차단을 유지하고 연속 열기와 닫기를 처리합니다.
// Preserve native focus, Escape and modal blocking while allowing rapid reversals.
export function bindShellMotion(header) {
    const events = new AbortController();
    const dialogs = [...header.querySelectorAll("dialog")];
    const triggers = new WeakMap();

    function finishClose(dialog, restoreFocus) {
        dialog.removeAttribute("data-dialog-closing");
        if (dialog.open) dialog.close();
        const trigger = triggers.get(dialog);
        if (restoreFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
    }

    function closeDialog(dialog, { immediate = false, restoreFocus = true } = {}) {
        if (!dialog?.open) return;
        if (immediate || preference.matches) {
            stopAnimation(dialog);
            finishClose(dialog, restoreFocus);
            return;
        }
        if (dialog.hasAttribute("data-dialog-closing")) return;
        const style = getComputedStyle(dialog);
        const start = { opacity: style.opacity, transform: style.transform };
        dialog.setAttribute("data-dialog-closing", "");
        play(dialog, [start, { opacity: 0, transform: "translateY(12px)" }], 150,
            () => finishClose(dialog, restoreFocus));
    }

    function closeDialogs(options = {}) {
        dialogs.forEach(dialog => closeDialog(dialog, options));
    }

    function openDialog(dialog, trigger) {
        if (!dialog) return;
        const reversing = dialog.open && dialog.hasAttribute("data-dialog-closing");
        if (dialog.open && !reversing) return;
        const start = reversing
            ? { opacity: getComputedStyle(dialog).opacity, transform: getComputedStyle(dialog).transform }
            : { opacity: 0, transform: "translateY(12px)" };
        stopAnimation(dialog);
        dialog.removeAttribute("data-dialog-closing");
        dialogs.filter(item => item !== dialog).forEach(item => closeDialog(item, { immediate: true, restoreFocus: false }));
        triggers.set(dialog, trigger);
        if (!dialog.open) dialog.showModal();
        dialog.querySelector('input[type="search"]')?.focus({ preventScroll: true });
        play(dialog, [start, { opacity: 1, transform: "none" }], 220);
    }

    header.addEventListener("click", event => {
        const opener = event.target.closest("[data-open-dialog]");
        if (opener) openDialog(document.getElementById(opener.dataset.openDialog), opener);
        const closer = event.target.closest("[data-close-dialog]");
        if (closer) closeDialog(closer.closest("dialog"));
        if (event.target.closest("dialog a")) closeDialogs({ immediate: true, restoreFocus: false });
        if (event.target.matches("dialog")) {
            const rect = event.target.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right
                || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(event.target);
        }
    }, { signal: events.signal });

    dialogs.forEach(dialog => {
        dialog.addEventListener("cancel", event => {
            event.preventDefault();
            closeDialog(dialog);
        }, { signal: events.signal });
        dialog.addEventListener("close", () => {
            if (dialog.open) return;
            stopAnimation(dialog);
            dialog.removeAttribute("data-dialog-closing");
        }, { signal: events.signal });
    });

    return {
        closeDialogs,
        dispose() {
            closeDialogs({ immediate: true, restoreFocus: false });
            events.abort();
        },
    };
}

// [펼침 영역과 읽기 순서 / Disclosures and editorial reading order]
// 정보 표·좌석·입력값은 움직이지 않으며 새 페이지와 다시 그린 흐름의 이벤트를 함께 관리합니다.
// Keep tables, seats and input values stable; cover both routed and locally redrawn content.
export function bindPageMotion(root, { enter = true } = {}) {
    const events = new AbortController();
    const disclosures = new Map();
    const observed = new Set();
    const editorial = new Set();
    const surfaces = new Map();
    let observer;

    // [부분 갱신 전 관찰 해제 / Release observers before local replacement]
    // 필터·목록 교체로 제거할 요소를 페이지 이탈까지 보관하지 않습니다.
    // Do not retain removed filter results until the next route navigation.
    root.addEventListener("motion:cancel", event => {
        for (const element of observed) {
            if (element !== event.target && !event.target.contains(element)) continue;
            observer?.unobserve(element);
            observed.delete(element);
            surfaces.delete(element);
        }
    }, { signal: events.signal });

    function resolveDisclosure(details, state) {
        if (disclosures.get(details) !== state) return;
        details.open = state.open;
        details.style.overflow = state.overflow;
        state.summary.removeAttribute("aria-expanded");
        details.removeAttribute("data-disclosure-closing");
        state.content.forEach(([element, inert]) => { element.inert = inert; });
        disclosures.delete(details);
    }

    root.addEventListener("click", event => {
        const summary = event.target.closest("summary");
        const details = summary?.parentElement;
        if (!details?.matches("details") || !root.contains(details)
            || event.defaultPrevented || event.button > 0
            || event.target.closest("a, button, input, select, textarea")) return;
        event.preventDefault();
        const previous = disclosures.get(details);
        const open = !(previous ? previous.open : details.open);
        const startHeight = details.getBoundingClientRect().height;
        stopAnimation(details);
        if (previous) resolveDisclosure(details, previous);
        const state = {
            open,
            summary,
            overflow: details.style.overflow,
            content: [...details.children].filter(child => child !== summary).map(child => [child, child.inert]),
        };
        disclosures.set(details, state);
        summary.setAttribute("aria-expanded", String(open));
        if (!open && state.content.some(([child]) => child.contains(document.activeElement))) summary.focus({ preventScroll: true });
        details.open = open;
        const endHeight = details.getBoundingClientRect().height;
        details.open = true;
        details.style.overflow = "hidden";
        if (!open) {
            details.setAttribute("data-disclosure-closing", "");
            state.content.forEach(([child]) => { child.inert = true; });
        }
        play(details, [{ height: `${startHeight}px` }, { height: `${endHeight}px` }], 180,
            () => resolveDisclosure(details, state));
    }, { signal: events.signal });

    root.addEventListener("content:updated", event => {
        const kind = { panel: "content", step: "step", receipt: "success" }[event.detail?.kind] || event.detail?.kind || "content";
        const container = event.detail?.container || event.target;
        const targets = event.detail?.targets || [container];
        const available = targets.filter(target => target instanceof Element && root.contains(target));
        if (event.detail?.sequence) animateSequence(available, kind);
        else available.forEach(target => animateFeedback(target, kind));
    }, { signal: events.signal });

    // 네이티브 속성 변경으로 닫힌 영역을 오래된 열기 완료 콜백이 다시 열지 않게 합니다.
    // A native attribute change must not be undone by an older opening completion.
    root.addEventListener("toggle", event => {
        const details = event.target;
        const state = disclosures.get(details);
        if (!state || details.open) return;
        state.open = false;
        finishAnimation(details);
    }, { capture: true, signal: events.signal });

    window.addEventListener("resize", () => {
        for (const details of [...disclosures.keys()]) finishAnimation(details);
    }, { signal: events.signal });

    // [처음 보이는 화면과 스크롤의 연속성 / Initial viewport and scrolling continuity]
    // 첫 화면도 포함하되 각각 한 번만 재생하고, 관찰자 실패 시에도 콘텐츠는 항상 보입니다.
    // Include the first viewport, play each surface once, and keep content visible without observers.
    if (enter && !preference.matches && "IntersectionObserver" in window) {
        entranceSurfaces.forEach(surface => root.querySelectorAll(surface.selector).forEach(element => {
            if (!element.closest("[hidden], [inert], details:not([open])")) surfaces.set(element, surface.kind);
        }));
        for (const element of surfaces.keys()) {
            if ([...surfaces.keys()].some(parent => parent !== element && parent.contains(element))) surfaces.delete(element);
        }
        const reveal = (element, index = 0) => {
            const kind = surfaces.get(element);
            if (!kind) return;
            surfaces.delete(element);
            observed.delete(element);
            observer?.unobserve(element);
            if (element.contains(document.activeElement) || document.hidden) return;
            editorial.add(element);
            enterSurface(element, kind, kind === "group" ? Math.min(index * 35, 105) : 0,
                () => editorial.delete(element));
        };
        observer = new IntersectionObserver(entries => {
            let groupIndex = 0;
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                reveal(entry.target, surfaces.get(entry.target) === "group" ? groupIndex++ : 0);
            });
        }, { rootMargin: "0px 0px -24px 0px", threshold: 0.1 });
        let initialGroup = 0;
        surfaces.forEach((kind, element) => {
            if (inViewport(element)) reveal(element, kind === "group" ? initialGroup++ : 0);
            else {
                observed.add(element);
                observer.observe(element);
            }
        });
    }

    function settleInputTarget(event) {
        for (const [details, state] of disclosures) {
            if (!state.open || !state.content.some(([child]) => child.contains(event.target))) continue;
            finishAnimation(details);
            if (event.type === "focusin") {
                const rect = event.target.getBoundingClientRect();
                if (rect.top < 0 || rect.bottom > innerHeight) event.target.scrollIntoView({ block: "nearest", behavior: "instant" });
            }
        }
        for (const element of observed) {
            if (!element.contains(event.target)) continue;
            observer?.unobserve(element);
            observed.delete(element);
            surfaces.delete(element);
            cancelMotion(element);
        }
        for (const element of [...editorial]) {
            if (element.contains(event.target)) finishAnimation(element);
        }
        for (const [element, record] of activeAnimations) {
            if (["layout", "sequence"].includes(record.kind) && element.contains(event.target)) finishAnimation(element);
        }
    }
    root.addEventListener("focusin", settleInputTarget, { signal: events.signal });
    root.addEventListener("pointerdown", settleInputTarget, { signal: events.signal });
    root.addEventListener("pointerover", settleInputTarget, { signal: events.signal });

    const onPreference = () => {
        if (!preference.matches) return;
        observer?.disconnect();
        observed.clear();
        surfaces.clear();
    };
    preference.addEventListener("change", onPreference, { signal: events.signal });

    return () => {
        events.abort();
        observer?.disconnect();
        observed.clear();
        surfaces.clear();
        for (const [details, state] of disclosures) resolveDisclosure(details, state);
        cancelMotion(root);
        editorial.clear();
    };
}

// [맨 위로 이동 버튼의 등장 / Return-to-top availability]
// 표시 여부가 바뀔 때만 짧게 반응하고 스크롤 중인 문서나 버튼 위치는 이동시키지 않습니다.
// Respond only when availability changes without moving the document or button position.
export function bindReturnTop(button) {
    if (!button) return () => {};
    const events = new AbortController();
    let shown = !button.hidden;
    function update() {
        const next = window.scrollY >= 800;
        if (next === shown) return;
        shown = next;
        if (next) {
            button.hidden = false;
            button.inert = false;
            button.removeAttribute("aria-hidden");
            animateFeedback(button, "content");
        } else {
            button.inert = true;
            button.setAttribute("aria-hidden", "true");
            const opacity = getComputedStyle(button).opacity;
            play(button, [{ opacity }, { opacity: 0 }], 140, () => {
                if (!shown) button.hidden = true;
            });
        }
    }
    window.addEventListener("scroll", update, { passive: true, signal: events.signal });
    update();
    return () => { events.abort(); stopAnimation(button); };
}
