"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { useCatalog } from "../src/catalog/CatalogProvider";
import { HERO_MOTION } from "../src/data/design-tokens";
import HeroSlide from "./HeroSlide";
import HeroCompanion from "./HeroCompanion";
import Icon from "./Icon";
import { SystemButton, SystemIconButton } from "./SystemPrimitives";

export type HeroCarouselHandle = { showFeature: (anchor: string) => boolean };
type Gesture = { id: number; x: number; y: number; time: number; captured: boolean };

// [작품·양옆 미리보기·정보 레일의 조합 / Compose the work, neighbour previews and information rail]
const HeroCarousel = forwardRef<HeroCarouselHandle, { externalPaused?: boolean }>(function HeroCarousel({ externalPaused = false }, ref) {
    const { catalog } = useCatalog();
    const HOME_FEATURES = catalog.homeFeatures;
    const [active, setActive] = useState(0);
    const [dragX, setDragX] = useState(0);
    const [direction, setDirection] = useState<1 | -1 | 0>(0);
    const [returning, setReturning] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [paused, setPaused] = useState(true);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [inView, setInView] = useState(true);
    const [documentHidden, setDocumentHidden] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [progress, setProgress] = useState(0);
    const [announcement, setAnnouncement] = useState("");
    const stage = useRef<HTMLDivElement>(null);
    const section = useRef<HTMLElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const locked = useRef(false);
    const gesture = useRef<Gesture | null>(null);
    const suppressClickUntil = useRef(0);
    const moveRef = useRef<(direction: 1 | -1, manual?: boolean) => void>(() => {});
    const count = HOME_FEATURES.length;
    const featureSignature = HOME_FEATURES.map(feature => feature.id).join("\0");
    const safeActive = Math.min(active, Math.max(0, count - 1));
    const previous = HOME_FEATURES[(safeActive - 1 + count) % count];
    const next = HOME_FEATURES[(safeActive + 1) % count];

    function resetMotion() {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        locked.current = false;
        if (gesture.current?.captured && stage.current?.hasPointerCapture(gesture.current.id)) stage.current.releasePointerCapture(gesture.current.id);
        if (stage.current) delete stage.current.dataset.dragging;
        gesture.current = null;
        setDirection(0);
        setReturning(false);
        setDragging(false);
        setDragX(0);
        setProgress(0);
    }

    function move(by: 1 | -1, manual = true) {
        if (locked.current || count < 2) return;
        const target = (safeActive + by + count) % count;
        const finish = () => {
            setActive(target);
            resetMotion();
            if (manual) setAnnouncement(`${target + 1} / ${count}, ${HOME_FEATURES[target].name}`);
        };
        if (reducedMotion) { finish(); return; }
        const track = stage.current?.querySelector<HTMLElement>(".season-track");
        const slide = track?.querySelector<HTMLElement>(".season-slide");
        if (!track || !slide) return;
        const step = slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || "0");
        locked.current = true;
        setDirection(by);
        setDragX(-by * step);
        setProgress(0);
        timer.current = setTimeout(finish, HERO_MOTION.transition);
    }
    moveRef.current = move;

    useEffect(() => {
        resetMotion();
        setActive(index => Math.min(index, Math.max(0, count - 1)));
    }, [featureSignature]);

    // [공유 앵커와 수명 주기 / Shared anchors and lifecycle cleanup]
    useImperativeHandle(ref, () => ({ showFeature(anchor) {
        const index = HOME_FEATURES.findIndex(feature => anchor === `home-feature-${feature.id}`);
        if (index < 0) return false;
        resetMotion();
        setActive(index);
        setPaused(true);
        return true;
    } }));

    useEffect(() => {
        const preference = matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => { setReducedMotion(preference.matches); setPaused(preference.matches); };
        const updateVisibility = () => setDocumentHidden(document.hidden);
        const releaseUncapturedGesture = (event: globalThis.PointerEvent) => {
            if (gesture.current?.id !== event.pointerId || gesture.current.captured) return;
            gesture.current = null;
            setDragging(false);
        };
        updatePreference();
        updateVisibility();
        preference.addEventListener("change", updatePreference);
        document.addEventListener("visibilitychange", updateVisibility);
        window.addEventListener("pointerup", releaseUncapturedGesture);
        window.addEventListener("pointercancel", releaseUncapturedGesture);
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
        if (section.current) observer.observe(section.current);
        return () => {
            preference.removeEventListener("change", updatePreference);
            document.removeEventListener("visibilitychange", updateVisibility);
            window.removeEventListener("pointerup", releaseUncapturedGesture);
            window.removeEventListener("pointercancel", releaseUncapturedGesture);
            observer.disconnect();
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const suspended = count < 2 || paused || hovered || focused || externalPaused || !inView || documentHidden || direction !== 0 || returning || dragging;
    useEffect(() => {
        if (suspended) return;
        const interval = 50;
        const tick = setInterval(() => setProgress(value => Math.min(1, value + interval / HERO_MOTION.interval)), interval);
        return () => clearInterval(tick);
    }, [suspended, active]);
    useEffect(() => { if (progress >= 1 && !suspended) moveRef.current(1, false); }, [progress, suspended]);

    // [가로 드래그와 세로 스크롤을 구분 / Distinguish a horizontal drag from native vertical scroll]
    function startGesture(event: PointerEvent<HTMLDivElement>) {
        if (count < 2 || locked.current || event.button !== 0 || (event.target as Element).closest("a,button,input,select,textarea")) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), captured: false };
        setDragging(true);
    }
    function dragGesture(event: PointerEvent<HTMLDivElement>) {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        const x = event.clientX - current.x;
        const y = event.clientY - current.y;
        if (!current.captured) {
            if (Math.abs(y) > Math.abs(x) && Math.abs(y) > 8) { gesture.current = null; setDragging(false); return; }
            if (Math.abs(x) < 8) return;
            current.captured = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.dataset.dragging = "true";
        }
        const width = stage.current?.querySelector(".season-slide")?.getBoundingClientRect().width || innerWidth;
        setDragX(Math.max(-width, Math.min(width, x)));
    }
    function endGesture(event: PointerEvent<HTMLDivElement>, cancelled = false) {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        gesture.current = null;
        setDragging(false);
        delete event.currentTarget.dataset.dragging;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        if (!current.captured) return;
        suppressClickUntil.current = performance.now() + 250;
        setProgress(0);
        const distance = event.clientX - current.x;
        const width = stage.current?.querySelector(".season-slide")?.getBoundingClientRect().width || innerWidth;
        const velocity = Math.abs(distance) / Math.max(1, performance.now() - current.time);
        if (!cancelled && (Math.abs(distance) > width * 0.12 || (Math.abs(distance) > 40 && velocity > 0.3))) {
            move(distance < 0 ? 1 : -1);
        } else if (reducedMotion) setDragX(0);
        else {
            locked.current = true;
            setReturning(true);
            setDragX(0);
            timer.current = setTimeout(resetMotion, HERO_MOTION.settle);
        }
    }

    if (!count) return <section className="season-hero container" data-component-id="hero-carousel" aria-label="이번 달의 문화예술"><p data-text="body">현재 공개된 주요 프로그램이 없습니다.</p></section>;

    return <section
        className="season-hero"
        id="featured-season"
        data-home-anchor
        data-component="HeroCarousel" data-component-id="hero-carousel"
        aria-label="이번 달의 문화예술"
        aria-roledescription="캐러셀"
        ref={section}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
    >
        <div
            className="season-stage"
            ref={stage}
            onPointerDown={startGesture}
            onPointerMove={dragGesture}
            onPointerUp={event => endGesture(event)}
            onPointerCancel={event => endGesture(event, true)}
            onDragStart={event => event.preventDefault()}
            onClickCapture={event => { if (performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); } }}
        >
            <div data-text="body" className={`season-track${direction ? " is-moving" : ""}${returning ? " is-returning" : ""}`} style={{ "--drag-x": `${dragX}px` } as CSSProperties}>
                {[-2, -1, 0, 1, 2].map(offset => <HeroSlide
                    key={offset}
                    feature={HOME_FEATURES[(safeActive + offset + count) % count]}
                    active={offset === 0}
                    entering={direction === offset && direction !== 0}
                    preview={offset === -1 ? "previous" : offset === 1 ? "next" : undefined}
                    onSelect={offset === -1 ? () => move(-1) : offset === 1 ? () => move(1) : undefined}
                />)}
            </div>
        </div>

        <div className="hero-neighbor-navigation container" role="group" aria-label="양옆 프로그램">
            <SystemButton data-text="action" variant="quiet" disabled={count < 2} onClick={() => move(-1)} aria-label={`${previous.name} 이전 슬라이드로 보기`}><Icon name="back" size={20} /><span data-text="body">{previous.programTitle}</span></SystemButton>
            <SystemButton data-text="action" variant="quiet" disabled={count < 2} onClick={() => move(1)} aria-label={`${next.name} 다음 슬라이드로 보기`}><span data-text="body">{next.programTitle}</span><Icon name="arrow" size={20} /></SystemButton>
        </div>
        <HeroCompanion />
        <div className="season-toolbar container">
            <p data-text="body">이번 달의 문화예술</p>
            <div className="season-controls" id="home-feature-controls" data-home-anchor role="group" aria-label="주요 프로그램 제어">
                <span className="season-pagination" aria-hidden="true"><span data-text="body">{String(safeActive + 1).padStart(2, "0")}</span><span data-text="body" className="season-pagination-total"> / {String(count).padStart(2, "0")}</span></span>
                <span className="season-progress" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></span>
                <SystemIconButton data-text="action" id="home-feature-previous" disabled={count < 2} className="round-button" onClick={() => move(-1)} aria-label="이전 프로그램"><Icon name="back" size={24} /></SystemIconButton>
                <SystemIconButton data-text="action" id="home-feature-next" disabled={count < 2} className="round-button" onClick={() => move(1)} aria-label="다음 프로그램"><Icon name="arrow" size={24} /></SystemIconButton>
                <SystemIconButton data-text="action" id="home-feature-playback" disabled={count < 2} className="round-button" onClick={() => { if (paused) setFocused(false); setPaused(value => !value); }} aria-label={paused ? "자동 재생 시작" : "자동 재생 일시정지"} aria-pressed={paused}><Icon name={paused ? "play" : "pause"} size={24} /></SystemIconButton>
                <span data-text="body" className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
            </div>
        </div>
    </section>;
});

export default HeroCarousel;
