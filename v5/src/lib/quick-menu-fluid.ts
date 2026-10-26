import { QUICK_MENU_MATERIAL } from "../data/design-tokens.ts";

export interface QuickMenuInteraction {
    x: number;
    y: number;
    energy: number;
    velocityX: number;
    velocityY: number;
    spin: number;
    lastInput: number;
    active: boolean;
}
export interface FluidState { phase: number; x: number; y: number; spin: number }
export type FluidPalette = Record<keyof typeof QUICK_MENU_MATERIAL.colors, string>;
export const FLUID_SIZE = 400;
const clampInput = (value: number) => Math.max(-1, Math.min(1, value));

// [입력의 잔향과 일정한 흐름 / Damped input and a steady flow]
export function stepFluid(state: FluidState, input: QuickMenuInteraction, elapsed: number, now: number): void {
    const { period, response, maxInput } = QUICK_MENU_MATERIAL.motion;
    const dt = Math.min(0.05, Math.max(0, elapsed));
    const freshness = input.active ? 1 : Math.exp(-Math.max(0, now - input.lastInput) / 450);
    const follow = 1 - Math.exp(-response * dt);
    state.x += (clampInput(input.x) * maxInput * freshness - state.x) * follow;
    state.y += (clampInput(input.y) * maxInput * freshness - state.y) * follow;
    state.spin += (clampInput(input.spin) * freshness - state.spin) * follow;
    state.phase += dt * (Math.PI * 2 / period + state.spin * 0.65);
}

// [한 번 만든 색 면과 광택 / Cached color fields and soft highlights]
export function createFluidPaint(context: CanvasRenderingContext2D, palette: FluidPalette) {
    const base = context.createLinearGradient(0, 0, FLUID_SIZE, FLUID_SIZE);
    base.addColorStop(0, palette.mint);
    base.addColorStop(0.6, palette.green);
    base.addColorStop(1, palette.mint);
    const yellow = context.createLinearGradient(0, 0, FLUID_SIZE * 0.8, FLUID_SIZE);
    yellow.addColorStop(0, palette.lemon);
    yellow.addColorStop(0.5, palette.yellow);
    yellow.addColorStop(1, palette.lemon);
    const mint = context.createLinearGradient(0, FLUID_SIZE, FLUID_SIZE, 0);
    mint.addColorStop(0, palette.mint);
    mint.addColorStop(1, palette.green);
    const light = context.createRadialGradient(110, 70, 0, 125, 85, 280);
    light.addColorStop(0, palette.light);
    light.addColorStop(1, palette.clear);
    const shade = context.createRadialGradient(170, 145, 130, 200, 200, 210);
    shade.addColorStop(0, palette.clear);
    shade.addColorStop(1, palette.ink);
    return { base, yellow, mint, light, shade };
}
export type FluidPaint = ReturnType<typeof createFluidPaint>;

// [직접 구성한 넓은 물결 / Authored broad wave contours]
// A few continuous curves replace thousands of individual fibres.
export function drawFluid(context: CanvasRenderingContext2D, paint: FluidPaint, state: FluidState): void {
    const phase = state.phase;
    const swell = Math.sin(phase) * 0.095;
    const tide = Math.cos(phase * 0.85) * 0.075;
    const curl = Math.sin(phase + 1.4) * 0.055;
    const x = state.x;
    const y = state.y;
    context.clearRect(0, 0, FLUID_SIZE, FLUID_SIZE);
    context.save();
    context.beginPath();
    context.arc(200, 200, 200, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = paint.base;
    context.fillRect(0, 0, FLUID_SIZE, FLUID_SIZE);
    context.scale(FLUID_SIZE, FLUID_SIZE);

    context.beginPath();
    context.moveTo(-0.2, -0.2);
    context.lineTo(1.2, -0.2);
    context.lineTo(1.2, 0.24 + tide);
    context.bezierCurveTo(0.8 + x, 0.15 + swell, 0.73 - x, 0.9 + y, 0.31 + curl, 0.72 + swell);
    context.bezierCurveTo(0.06 - x, 0.61 + tide, 0.21 + x, 0.3 + y, -0.2, 0.45 + curl);
    context.closePath();
    context.fillStyle = paint.yellow;
    context.fill();

    context.beginPath();
    context.moveTo(-0.2, 0.79 + tide);
    context.bezierCurveTo(0.23 + x, 0.43 + y, 0.27 - x, 1.07 - swell, 0.78, 0.88 + curl);
    context.bezierCurveTo(0.95, 0.83 + swell, 1.03, 0.63 + tide, 1.2, 0.66);
    context.lineTo(1.2, 1.2);
    context.lineTo(-0.2, 1.2);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(0.12 + curl, -0.2);
    context.bezierCurveTo(-0.05 + x, 0.14 + y, 0.23 + swell, 0.4, 0.51 + tide, 0.35 + curl);
    context.bezierCurveTo(0.74 + x, 0.3 - swell, 0.71, -0.07, 1, -0.2);
    context.closePath();
    context.fillStyle = paint.mint;
    context.globalAlpha = 0.7;
    context.fill();
    context.restore();

    context.save();
    context.beginPath();
    context.arc(200, 200, 199.5, 0, Math.PI * 2);
    context.clip();
    context.globalAlpha = 0.24;
    context.fillStyle = paint.light;
    context.fillRect(0, 0, FLUID_SIZE, FLUID_SIZE);
    context.globalAlpha = 0.11;
    context.fillStyle = paint.shade;
    context.fillRect(0, 0, FLUID_SIZE, FLUID_SIZE);
    context.restore();
}
