"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { QUICK_MENU_MATERIAL } from "../src/data/design-tokens";
import { createFluidPaint, drawFluid, FLUID_SIZE, stepFluid } from "../src/lib/quick-menu-fluid";
import type { FluidPaint, FluidPalette, FluidState, QuickMenuInteraction } from "../src/lib/quick-menu-fluid";
import styles from "./VioletQuickMenu.module.css";

interface QuickMenuFluidProps {
    awake: boolean;
    animated: boolean;
    expanded?: boolean;
    interaction: MutableRefObject<QuickMenuInteraction>;
}

/** Native navigation remains usable with the CSS material if Canvas is unavailable. */
export default function QuickMenuFluid({ awake, animated, expanded = false, interaction }: QuickMenuFluidProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const state = useRef<FluidState>({ phase: 0.7, x: 0, y: 0, spin: 0 });

    useEffect(() => {
        if (!awake) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        const style = getComputedStyle(canvas);
        const palette = {} as FluidPalette;
        for (const key of Object.keys(QUICK_MENU_MATERIAL.colors) as Array<keyof FluidPalette>) {
            palette[key] = style.getPropertyValue(QUICK_MENU_MATERIAL.colors[key]).trim();
        }
        const modest = window.matchMedia("(pointer: coarse)").matches;
        const ratio = Math.min(window.devicePixelRatio || 1, modest ? 1.5 : 2);
        let paint: FluidPaint;
        const interval = 1000 / (modest ? QUICK_MENU_MATERIAL.motion.mobileFps : QUICK_MENU_MATERIAL.motion.desktopFps);
        let frame = 0;
        let lastDraw = 0;
        let previous = 0;
        const resize = () => {
            const pixels = Math.max(96, Math.min(800, Math.round((canvas.clientWidth || (expanded ? 370 : 88)) * ratio)));
            if (canvas.width !== pixels || canvas.height !== pixels) {
                canvas.width = pixels;
                canvas.height = pixels;
            }
            context.setTransform(pixels / FLUID_SIZE, 0, 0, pixels / FLUID_SIZE, 0, 0);
            paint = createFluidPaint(context, palette);
            drawFluid(context, paint, state.current);
        };

        // [보이는 동안만 그리기 / Paint only while visible]
        const tick = (now: number) => {
            const elapsed = previous ? (now - previous) / 1000 : 0;
            previous = now;
            stepFluid(state.current, interaction.current, elapsed, now);
            if (now - lastDraw >= interval) {
                drawFluid(context, paint, state.current);
                lastDraw = now - (now - lastDraw) % interval;
            }
            frame = requestAnimationFrame(tick);
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        if (animated) frame = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(frame); observer.disconnect(); };
    }, [awake, animated, expanded, interaction]);

    return <canvas ref={canvasRef} className={styles.fluid} data-component-part="quick-menu-fluid" data-component-owner="quick-menu" data-quick-fluid={expanded ? "expanded" : "resting"} aria-hidden="true" />;
}
