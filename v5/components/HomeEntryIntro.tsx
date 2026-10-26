"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SystemButton } from "./SystemPrimitives";
import { HOME_ENTRY_COPY, HOME_ENTRY_TIMING, homeEntryTimeline, isV5HomeEntry } from "../src/lib/home-entry-intro";
import styles from "./HomeEntryIntro.module.css";

/**
 * 첫 /v5/ 진입에 한 번만 표시한다. 내부 페이지 이동에서는 재생하지 않는다.
 * 화면 뒤의 SiteShell/CatalogProvider는 계속 마운트되어 초기 데이터 요청을 병렬 수행한다.
 * SVG는 사용자 제공 원본 파일을 이미지로 격리해 삽입한다 (innerHTML 금지).
 */
export default function HomeEntryIntro() {
    const pathname = usePathname();
    const onEntryRoute = useRef(isV5HomeEntry(pathname));
    const [visible, setVisible] = useState(onEntryRoute.current);
    const [phase, setPhase] = useState<"artwork" | "copy" | "exit">("artwork");
    const [characterCount, setCharacterCount] = useState(0);
    const dialogRef = useRef<HTMLDivElement>(null);
    const skipRef = useRef<HTMLButtonElement>(null);
    const descriptionId = useId();

    useEffect(() => {
        if (!isV5HomeEntry(pathname)) setVisible(false);
    }, [pathname]);

    useEffect(() => {
        if (!onEntryRoute.current || !visible) return;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (motion.matches || document.visibilityState === "hidden" ||
            window.location.hash || new URLSearchParams(window.location.search).get("mode") === "cms-scm") {
            setVisible(false);
            return;
        }

        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.getPropertyValue("overflow");
        const previousOverflowPriority = document.body.style.getPropertyPriority("overflow");
        const underlay = Array.from(document.body.children)
            .filter((element): element is HTMLElement =>
                element instanceof HTMLElement && element !== dialog &&
                !element.contains(dialog) && !["SCRIPT", "STYLE", "LINK"].includes(element.tagName))
            .map(element => ({
                element,
                inert: element.inert,
                ariaHidden: element.getAttribute("aria-hidden"),
            }));

        // 화면만 덮는다. 데이터 요청·인증 초기화·리소스 다운로드는 방해하지 않는다.
        for (const item of underlay) {
            item.element.inert = true;
            item.element.setAttribute("aria-hidden", "true");
        }
        document.body.style.setProperty("overflow", "hidden", "important");
        skipRef.current?.focus({ preventScroll: true });

        const timers = new Set<number>();
        function schedule(fn: () => void, delay: number) {
            const id = window.setTimeout(() => {
                timers.delete(id);
                fn();
            }, delay);
            timers.add(id);
        }
        const finish = () => setVisible(false);
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                finish();
            } else if (event.key === "Tab") {
                event.preventDefault();
                skipRef.current?.focus({ preventScroll: true });
            }
        };
        const onVisibilityChange = () => { if (document.visibilityState === "hidden") finish(); };
        const onMotionChange = (event: MediaQueryListEvent) => { if (event.matches) finish(); };

        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("visibilitychange", onVisibilityChange);
        motion.addEventListener("change", onMotionChange);
        window.addEventListener("hashchange", finish);
        window.addEventListener("pagehide", finish);

        schedule(() => setPhase("copy"), HOME_ENTRY_TIMING.copyStart);
        for (let count = 1; count <= HOME_ENTRY_COPY.length; count++) {
            schedule(() => setCharacterCount(count),
                HOME_ENTRY_TIMING.copyStart + count * HOME_ENTRY_TIMING.typeCharacter);
        }
        const { exitAt, finishAt } = homeEntryTimeline();
        schedule(() => setPhase("exit"), exitAt);
        schedule(finish, finishAt);
        schedule(finish, HOME_ENTRY_TIMING.watchdog);

        return () => {
            for (const id of timers) window.clearTimeout(id);
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            motion.removeEventListener("change", onMotionChange);
            window.removeEventListener("hashchange", finish);
            window.removeEventListener("pagehide", finish);
            for (const item of underlay) {
                item.element.inert = item.inert;
                if (item.ariaHidden === null) item.element.removeAttribute("aria-hidden");
                else item.element.setAttribute("aria-hidden", item.ariaHidden);
            }
            if (previousOverflow) {
                document.body.style.setProperty("overflow", previousOverflow, previousOverflowPriority);
            } else {
                document.body.style.removeProperty("overflow");
            }
            // 이미 다른 곳으로 포커스를 옮겼다면 기존 포커스를 빼앗지 않는다.
            if (document.activeElement && dialog.contains(document.activeElement)) {
                const destination = previousFocus?.isConnected && !previousFocus.closest("[inert]")
                    ? previousFocus
                    : document.getElementById("main");
                if (destination instanceof HTMLElement) destination.focus({ preventScroll: true });
            }
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <div
            ref={dialogRef}
            data-v5-entry-intro
            data-component-id="home-entry-intro"
            data-phase={phase}
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-label="세종문화회관 시작 화면"
            aria-describedby={descriptionId}
        >
            <p id={descriptionId} className={styles.srOnly}>
                세종문화회관 시작 애니메이션입니다. 건너뛰기 버튼 또는 Escape 키로 바로 이동할 수 있습니다.
            </p>
            <div className={styles.stage}>
                <div className={styles.artwork} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- SMIL을 포함한 제공 SVG를 그대로 재생 */}
                    <img
                        src="/v5/assets/intro/scenartmv.svg"
                        width={1560}
                        height={1040}
                        alt=""
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        draggable={false}
                    />
                </div>
                <div className={styles.copy} aria-hidden="true">
                    <span data-text="label" className={styles.eyebrow}>SEJONG PERFORMING ARTS CENTER</span>
                    <p data-text="heading" className={styles.message}>
                        {HOME_ENTRY_COPY.slice(0, characterCount)}
                        {phase === "copy" && characterCount < HOME_ENTRY_COPY.length && (
                            <span className={styles.caret} aria-hidden="true" />
                        )}
                    </p>
                </div>
            </div>
            <SystemButton
                ref={skipRef}
                className={styles.skip}
                variant="inverse"
                type="button"
                onClick={() => setVisible(false)}
            >
                인트로 건너뛰기
            </SystemButton>
        </div>
    );
}
