import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

// [실제 GPU 프레임과 창의 수명 주기 / Actual GPU frames and the panel lifecycle]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const connected = Boolean(process.env.SEJONG_TEST_CDP);
const browser = connected ? await chromium.connectOverCDP(process.env.SEJONG_TEST_CDP!) : await chromium.launch();
const context = connected ? browser.contexts()[0] : await browser.newContext();
const page = connected ? context.pages()[0] || await context.newPage() : await context.newPage();
const directory = path.resolve(".lemonade/panel-motion");
fs.mkdirSync(directory, { recursive: true });
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
page.setDefaultTimeout(10000);
await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    (window as any).panelSamples = [];
    (window as any).panelImages = [];
    const captured = new Set<string>();
    HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
        const gl = (original as any).call(this, type, ...args);
        if (type === "webgl" && gl && !(gl as any).panelWrapped) {
            (gl as any).panelWrapped = true;
            const draw = gl.drawElements.bind(gl);
            gl.drawElements = (...parameters: any[]) => {
                draw(...parameters);
                if (!this.classList.contains("floating-panel-webgl")) return;
                const phase = this.dataset.phase;
                const progress = Number(this.dataset.progress || 0);
                (window as any).panelSamples.push({ phase, progress, texture: this.dataset.texture, time: performance.now() });
                const bands = phase === "opening" ? [0.08, 0.3, 0.6, 0.9] : [0.85, 0.55, 0.25];
                for (let index = 0; index < bands.length; index++) {
                    const key = `${phase}-${index}`;
                    if (!captured.has(key) && (phase === "opening" ? progress >= bands[index] : progress <= bands[index])) {
                        captured.add(key);
                        (window as any).panelImages.push({ key, progress, data: this.toDataURL("image/png") });
                    }
                }
            };
        }
        return gl;
    } as any;
});
async function check(name: string, action: () => Promise<void>) {
    try { await action(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
        console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
const trigger = () => page.getByRole("button", { name: "전체 메뉴 열기" });
const panel = () => page.locator(".glass-menu");
async function open() { await trigger().click(); await page.locator('.glass-menu[data-phase="open"]').waitFor(); }
async function close() { await page.keyboard.press("Escape"); await panel().waitFor({ state: "detached" }); }

try {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.bringToFront();
    await check("real WebGL deforms the menu texture and settles with a gentle overshoot", async () => {
        await open();
        await page.waitForFunction(() => document.querySelector<HTMLCanvasElement>(".floating-panel-webgl")!.dataset.texture === "ready");
        const state = await page.locator(".floating-panel-webgl").evaluate(canvas => ({
            renderer: (canvas as HTMLElement).dataset.renderer,
            context: (canvas as HTMLCanvasElement).getContext("webgl") instanceof WebGLRenderingContext,
            texture: (canvas as HTMLElement).dataset.texture,
            samples: (window as any).panelSamples,
        }));
        assert.equal(state.renderer, "webgl"); assert.equal(state.context, true); assert.equal(state.texture, "ready");
        assert.ok(state.samples.some(sample => sample.phase === "opening" && sample.progress > 0.05 && sample.progress < 0.9));
        assert.ok(state.samples.some(sample => sample.progress > 0.05 && sample.progress < 0.9 && ["preview", "ready"].includes(sample.texture)));
        assert.ok(state.samples.every(sample => !sample.progress || sample.progress < 1.12));
        assert.ok(state.samples.some(sample => sample.progress > 1.005));
        assert.equal(await panel().evaluate(el => (el as HTMLElement).inert), false);
    });
    await check("exit keeps the panel mounted, folds into the trigger and restores focus", async () => {
        const anchor = (await trigger().boundingBox())!;
        await page.evaluate(async () => {
            (document.querySelector('[aria-label="전체 메뉴 닫기"]') as HTMLButtonElement).click();
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        assert.equal(await panel().count(), 1);
        assert.equal(await panel().getAttribute("data-phase"), "closing");
        const origin = await page.locator(".floating-panel-webgl").evaluate(canvas => JSON.parse((canvas as HTMLElement).dataset.origin!));
        assert.ok(Math.abs(origin.x - anchor.x) < 1 && Math.abs(origin.y - anchor.y) < 1);
        await panel().waitFor({ state: "detached" });
        assert.equal(await page.locator(".floating-panel-webgl").count(), 0);
        assert.equal(await trigger().evaluate(el => document.activeElement === el), true);
    });
    await check("a dragged panel returns from its actual position", async () => {
        await open();
        const heading = (await page.locator(".glass-menu-header h2").boundingBox())!;
        await page.mouse.move(heading.x + 30, heading.y + 20);
        await page.mouse.down(); await page.mouse.move(heading.x - 70, heading.y + 70, { steps: 12 }); await page.mouse.up();
        const moved = (await panel().boundingBox())!;
        await page.getByRole("button", { name: "전체 메뉴 닫기" }).click();
        const destination = await page.locator(".floating-panel-webgl").evaluate(canvas => JSON.parse((canvas as HTMLElement).dataset.destination!));
        assert.ok(Math.abs(moved.x - destination.x) < 1 && Math.abs(moved.y - destination.y) < 1);
        await panel().waitFor({ state: "detached" });
    });
    await check("rapid reversals retain the same panel and continue the current spring", async () => {
        await page.evaluate(async () => {
            (document.querySelector('[aria-label="전체 메뉴 열기"]') as HTMLButtonElement).click();
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            (window as any).retainedPanel = document.querySelector(".glass-menu");
        });
        await trigger().click();
        await trigger().click();
        await page.locator('.glass-menu[data-phase="open"]').waitFor();
        assert.equal(await panel().evaluate(el => el === (window as any).retainedPanel), true);
        await close();
    });
    await check("reduced motion uses a short fade with the same close lifecycle", async () => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await open();
        assert.equal(await page.locator(".floating-panel-webgl").getAttribute("data-renderer"), "reduced-motion");
        await close();
        await page.emulateMedia({ reducedMotion: "no-preference" });
    });
    await check("WebGL-unavailable browsers retain an animated usable panel", async () => {
        const fallbackContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        try {
            const fallbackPage = await fallbackContext.newPage();
            fallbackPage.on("pageerror", error => errors.push(error.message));
            await fallbackPage.addInitScript(() => {
                const original = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
                    return type === "webgl" || type === "webgl2" ? null : (original as any).call(this, type, ...args);
                } as any;
            });
            await fallbackPage.goto(base, { waitUntil: "networkidle" });
            await fallbackPage.getByRole("button", { name: "전체 메뉴 열기" }).click();
            await fallbackPage.locator('.glass-menu[data-phase="open"]').waitFor();
            assert.equal(await fallbackPage.locator(".floating-panel-webgl").getAttribute("data-renderer"), "dom");
            await fallbackPage.getByRole("button", { name: "전체 메뉴 닫기" }).click();
            await fallbackPage.locator(".glass-menu").waitFor({ state: "detached" });
        } finally { await fallbackContext.close(); }
        await page.bringToFront();
    });
    await check("mobile drawers enter from the left wall and remain attached at rest", async () => {
        for (const width of [390, 320]) {
            await page.setViewportSize({ width, height: 844 });
            await open();
            const bounds = (await panel().boundingBox())!;
            assert.equal(bounds.x, 0); assert.equal(bounds.y, 0);
            assert.ok(bounds.width <= width - 23 && bounds.height === 844);
            const origin = await page.locator(".floating-panel-webgl").evaluate(canvas => JSON.parse((canvas as HTMLElement).dataset.origin!));
            assert.equal(origin.x, -bounds.width); assert.equal(origin.y, 0);
            await page.screenshot({ path: path.join(directory, `mobile-${width}.png`) });
            await close();
        }
    });
    await check("the registered component documents LiquidGlass composition and replays the same motion", async () => {
        await page.setViewportSize({ width: 1600, height: 1000 });
        await page.goto(new URL("design-rules/#components/floating-menu", base).href, { waitUntil: "networkidle" });
        await page.getByRole("region", { name: "FloatingPanel 컴포넌트 속성" }).waitFor();
        const button = page.getByRole("button", { name: "전체 메뉴 열기", exact: true }).last();
        // 해시 이동의 smooth scroll과 자동 클릭 스크롤이 경합하지 않게 실제 체험 위치에 정착합니다.
        // Settle the documentation's smooth hash navigation before measuring the clicked anchor.
        await button.evaluate(element => element.scrollIntoView({ behavior: "instant", block: "center" }));
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const anchor = (await button.boundingBox())!;
        await button.click();
        await page.locator('.glass-menu[data-phase="open"]').waitFor();
        const origin = await page.locator(".floating-panel-webgl").evaluate(canvas => JSON.parse((canvas as HTMLElement).dataset.origin!));
        const actual = (await button.boundingBox())!;
        assert.ok(Math.abs(origin.x - actual.x) < 1 && Math.abs(origin.y - actual.y) < 1);
        assert.ok(anchor.width > 0);
        await close();
    });
    await check("no browser runtime errors", async () => assert.deepEqual(errors, []));
    const images = await page.evaluate(() => (window as any).panelImages || []);
    for (const image of images) fs.writeFileSync(path.join(directory, `mesh-${image.key}.png`), Buffer.from(image.data.split(",")[1], "base64"));
} finally {
    fs.writeFileSync(path.join(directory, "report.json"), JSON.stringify({ base, verifiedAt: new Date().toISOString(), results, errors }, null, 2));
    await browser.close();
}
if (results.some(result => !result.passed)) process.exitCode = 1;
