import { icon } from "../lib/core.js";
import { heroCard } from "./cards.js";

export const HERO_INTERVAL = 2700;
export const HERO_DURATION = 800;

// [드래그 가능한 카드-히어로 / Draggable card-hero carousel]
// DOM 카드를 재배치해 루프하며 전환 중 이미지·명암이 재생성되어 깜빡이지 않게 합니다.
// Recycle existing cards so the active image and shading survive loop transitions.
export function bindHero(hero, items) {
    const track = hero.querySelector(".season-track");
    const stage = hero.querySelector(".season-stage");
    const progress = hero.querySelector(".season-progress i");
    const pauseButton = hero.querySelector('[data-hero="pause"]');
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const events = new AbortController();
    let active = 0, paused = reduced.matches, moving = false, hovered = false, visible = true;
    let elapsed = 0, lastFrame = 0, frameId, settleTimer, pending = 0, announcePending = false;
    let pointer = null, suppressClickUntil = 0;
    hero.style.setProperty("--carousel-duration", `${HERO_DURATION}ms`);
    const index = value => (value + items.length) % items.length;
    const step = () => track.children[2].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
    const offset = value => track.style.setProperty("--drag-x", `${value}px`);

    function markActive(direction = 0) {
        [...track.children].forEach((slide, i) => {
            const selected = i === 2 + direction;
            slide.classList.toggle("is-active", selected);
            slide.inert = !selected;
            if (selected) slide.removeAttribute("aria-hidden"); else slide.setAttribute("aria-hidden", "true");
        });
    }
    function position(value = active, announce = false) {
        hero.querySelector("[data-season-current]").textContent = String(value + 1).padStart(2, "0");
        if (announce) hero.querySelector("#season-status").textContent = `${value + 1} / ${items.length}, ${items[value].name}`;
    }
    function refreshPause() {
        pauseButton.innerHTML = icon(paused ? "play" : "pause", 24);
        pauseButton.setAttribute("aria-label", paused ? "자동 재생 시작" : "자동 재생 일시정지");
        pauseButton.setAttribute("aria-pressed", String(paused));
    }
    function settle() {
        clearTimeout(settleTimer);
        track.classList.remove("is-moving");
        if (pending > 0) {
            active = index(active + 1);
            track.firstElementChild.remove();
            track.insertAdjacentHTML("beforeend", heroCard(items[index(active + 2)]));
        } else if (pending < 0) {
            active = index(active - 1);
            track.lastElementChild.remove();
            track.insertAdjacentHTML("afterbegin", heroCard(items[index(active - 2)]));
        }
        offset(0);
        moving = false;
        pending = 0;
        markActive();
        position(active, announcePending);
        announcePending = false;
    }
    function move(direction, announce = false) {
        if (moving) return;
        elapsed = 0;
        progress.style.transform = "scaleX(0)";
        pending = direction;
        announcePending = announce;
        markActive(direction);
        position(index(active + direction));
        track.dataset.direction = direction > 0 ? "next" : direction < 0 ? "previous" : "snap";
        if (reduced.matches) { settle(); return; }
        moving = true;
        track.getBoundingClientRect();
        track.classList.add("is-moving");
        offset(-direction * step());
        settleTimer = setTimeout(settle, HERO_DURATION);
    }
    function interrupt() {
        if (!moving) return 0;
        const x = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41 + 2 * step();
        clearTimeout(settleTimer);
        track.classList.remove("is-moving");
        moving = false;
        pending = 0;
        announcePending = false;
        offset(x);
        return x;
    }

    // [포인터로 직접 이동 / Direct pointer movement]
    // 실제 가로 드래그에만 캡처하여 일반 클릭·우클릭·세로 스크롤을 보존합니다.
    // Capture horizontal drags only; keep normal clicks, context menus and vertical scrolling.
    stage.addEventListener("pointerdown", event => {
        if (event.button !== 0 || !event.isPrimary) return;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, offset: interrupt(), dragging: false };
    }, { signal: events.signal });
    stage.addEventListener("pointermove", event => {
        if (!pointer || event.pointerId !== pointer.id) return;
        const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
        if (!pointer.dragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { pointer = null; move(0); return; }
        if (!pointer.dragging && Math.abs(dx) < 6) return;
        if (!pointer.dragging) { pointer.dragging = true; stage.setPointerCapture(pointer.id); stage.dataset.dragging = "true"; }
        event.preventDefault();
        const amount = Math.max(-step() * 1.15, Math.min(step() * 1.15, pointer.offset + dx));
        offset(amount);
        markActive(Math.abs(amount) > step() / 2 ? (amount < 0 ? 1 : -1) : 0);
    }, { signal: events.signal });
    function release(event, cancelled = false) {
        if (!pointer || event.pointerId !== pointer.id) return;
        const gesture = pointer; pointer = null;
        delete stage.dataset.dragging;
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
        if (!gesture.dragging) { if (gesture.offset) move(0); return; }
        suppressClickUntil = performance.now() + 400;
        const dx = gesture.offset + event.clientX - gesture.x;
        const velocity = (event.clientX - gesture.x) / Math.max(1, event.timeStamp - gesture.time);
        const committed = !cancelled && (Math.abs(dx) > Math.min(96, step() * 0.16) || Math.abs(velocity) > 0.45);
        move(committed ? (dx < 0 ? 1 : -1) : 0, committed);
    }
    stage.addEventListener("pointerup", event => release(event), { signal: events.signal });
    stage.addEventListener("pointercancel", event => release(event, true), { signal: events.signal });
    stage.addEventListener("click", event => {
        if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
    }, { capture: true, signal: events.signal });
    hero.addEventListener("mouseenter", () => { hovered = matchMedia("(hover: hover)").matches; }, { signal: events.signal });
    hero.addEventListener("mouseleave", () => { hovered = false; }, { signal: events.signal });
    hero.querySelectorAll("[data-hero]").forEach(control => control.addEventListener("click", () => {
        if (control.dataset.hero === "pause") { paused = !paused; refreshPause(); }
        else move(control.dataset.hero === "previous" ? -1 : 1, true);
    }, { signal: events.signal }));
    hero.addEventListener("keydown", event => {
        if (["ArrowRight", "ArrowLeft"].includes(event.key)) { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1, true); }
    }, { signal: events.signal });
    const onMotion = () => { if (moving) settle(); paused = reduced.matches; refreshPause(); };
    reduced.addEventListener("change", onMotion);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.2 });
    observer.observe(hero);
    function frame(now) {
        const delta = lastFrame ? now - lastFrame : 0; lastFrame = now;
        if (!paused && !hovered && visible && !pointer && !document.hidden && !stage.contains(document.activeElement)) {
            elapsed += Math.min(delta, 100);
            progress.style.transform = `scaleX(${Math.min(elapsed / HERO_INTERVAL, 1)})`;
            if (elapsed >= HERO_INTERVAL && !moving) move(1);
        }
        frameId = requestAnimationFrame(frame);
    }
    refreshPause(); position();
    frameId = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(frameId); clearTimeout(settleTimer); observer.disconnect(); reduced.removeEventListener("change", onMotion); events.abort(); };
}
