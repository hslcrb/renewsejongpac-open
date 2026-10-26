import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

// [왼쪽 고정·실제 GPU·홈 첨언 검증 / Left attachment, real GPU motion and home feedback]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const browser = process.env.SEJONG_TEST_CDP
    ? await chromium.connectOverCDP(process.env.SEJONG_TEST_CDP)
    : await chromium.launch();
const context = process.env.SEJONG_TEST_CDP ? browser.contexts()[0] : await browser.newContext();
const page = await context.newPage();
const directory = path.resolve(".lemonade/mobile-drawer");
fs.mkdirSync(directory, { recursive: true });
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
page.setDefaultTimeout(10000);
await page.addInitScript(() => {
    (window as any).drawerFrames = [];
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
        const gl = (original as any).call(this, type, ...args);
        if (type === "webgl" && gl && !(gl as any).drawerWrapped) {
            (gl as any).drawerWrapped = true;
            const draw = gl.drawElements.bind(gl);
            gl.drawElements = (...args: any[]) => {
                draw(...args);
                if (!this.classList.contains("floating-panel-webgl")) return;
                const program = gl.getParameter(gl.CURRENT_PROGRAM);
                (window as any).drawerFrames.push({
                    phase: this.dataset.phase, progress: Number(this.dataset.progress),
                    opacity: gl.getUniform(program, gl.getUniformLocation(program, "u_opacity")),
                    refraction: gl.getUniform(program, gl.getUniformLocation(program, "u_refraction")),
                });
            };
        }
        return gl;
    } as any;
});
const panel = () => page.locator(".glass-menu");
const open = async () => {
    await page.getByRole("button", { name: "전체 메뉴 열기" }).click();
    await page.locator('.glass-menu[data-phase="open"]').waitFor();
};
const close = async () => {
    await page.keyboard.press("Escape");
    await panel().waitFor({ state: "detached" });
};
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
        console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.bringToFront();
    await check("phone and small-tablet menus are full-height left drawers with the denser material", async () => {
        for (const width of [320, 390, 600, 700]) {
            await page.setViewportSize({ width, height: 844 });
            await open();
            const box = (await panel().boundingBox())!;
            assert.equal(box.x, 0); assert.equal(box.y, 0); assert.equal(box.height, 844);
            assert.ok(box.width <= width - 23);
            assert.equal(await panel().getAttribute("data-glass-variant"), "drawer");
            assert.equal(await page.getByRole("button", { name: "메뉴 위치 이동" }).count(), 0);
            const style = await panel().evaluate(el => {
                const style = getComputedStyle(el);
                return { opacity: style.getPropertyValue("--glass-opacity").trim(), refraction: style.getPropertyValue("--glass-refraction").trim(), radius: style.borderTopLeftRadius };
            });
            assert.deepEqual(style, { opacity: "0.94", refraction: "96", radius: "0px" });
            assert.equal(await panel().locator("feDisplacementMap").getAttribute("scale"), "96");
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.screenshot({ path: path.join(directory, `drawer-${width}.png`) });
            await close();
        }
    });
    await check("native disclosure groups expose the complete vertical navigation to touch and keyboard", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await open();
        const groups = panel().locator("details");
        assert.equal(await groups.count(), 5);
        assert.equal(await panel().locator("details[open]").count(), 0);
        await groups.first().locator("summary").focus();
        await page.keyboard.press("Enter");
        assert.equal(await groups.first().evaluate(el => (el as HTMLDetailsElement).open), true);
        await groups.evaluateAll(elements => elements.forEach(element => (element as HTMLDetailsElement).open = true));
        assert.equal(await panel().getByRole("navigation", { name: "전체 메뉴", exact: true }).getByRole("link").count(), 34);
        const links = await groups.locator("a").evaluateAll(elements => elements.map(element => ({ size: parseFloat(getComputedStyle(element).fontSize), height: element.getBoundingClientRect().height })));
        assert.ok(links.every(link => link.size >= 16 && link.height >= 48));
    });
    await check("dragging cannot detach the drawer and the complete list scrolls inside it", async () => {
        const heading = (await panel().locator("h2").boundingBox())!;
        await page.mouse.move(heading.x + 30, heading.y + 15);
        await page.mouse.down(); await page.mouse.move(heading.x + 100, heading.y + 100, { steps: 8 }); await page.mouse.up();
        assert.equal((await panel().boundingBox())!.x, 0);
        assert.equal((await panel().boundingBox())!.y, 0);
        await panel().locator(".glass-menu-content").evaluate(el => el.scrollTop = el.scrollHeight);
        const last = (await panel().locator(".glass-menu-utilities a").last().boundingBox())!;
        assert.ok(last.y >= 0 && last.y + last.height <= 845);
        await page.screenshot({ path: path.join(directory, "drawer-scrolled.png") });
        await close();
    });
    await check("WebGL uses the drawer lens and reverses into the left wall before removing the DOM", async () => {
        await open();
        const canvas = page.locator(".floating-panel-webgl");
        assert.equal(await canvas.getAttribute("data-renderer"), "webgl");
        await page.waitForFunction(() => document.querySelector<HTMLElement>(".floating-panel-webgl")?.dataset.texture === "ready");
        await panel().locator("summary").first().click();
        const box = (await panel().boundingBox())!;
        await page.evaluate(async () => {
            (document.querySelector('[aria-label="전체 메뉴 닫기"]') as HTMLButtonElement).click();
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        assert.equal(await panel().getAttribute("data-phase"), "closing");
        assert.equal(await canvas.getAttribute("data-texture"), "preview");
        const origin = await canvas.evaluate(el => JSON.parse((el as HTMLElement).dataset.origin!));
        assert.equal(origin.x, -box.width); assert.equal(origin.height, box.height);
        await panel().waitFor({ state: "detached" });
        const frames = await page.evaluate(() => (window as any).drawerFrames);
        for (const phase of ["opening", "closing"]) {
            assert.ok(frames.some(frame => frame.phase === phase && frame.progress > 0.1 && frame.progress < 0.9 && frame.refraction === 96 && Math.abs(frame.opacity - 0.94) < 0.001));
        }
    });
    await check("switching presentations restores the desktop position without moving the mobile drawer", async () => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await open();
        const heading = (await panel().locator("h2").boundingBox())!;
        await page.mouse.move(heading.x + 30, heading.y + 15);
        await page.mouse.down(); await page.mouse.move(heading.x + 70, heading.y + 65, { steps: 8 }); await page.mouse.up();
        const desktop = (await panel().boundingBox())!;
        await page.getByRole("button", { name: "메뉴 위치 이동" }).click();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('.glass-menu[data-phase="open"][data-presentation="drawer"]').waitFor();
        assert.equal((await panel().boundingBox())!.x, 0);
        assert.equal(await panel().evaluate(element => getComputedStyle(element).touchAction), "pan-y");
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.locator('.glass-menu[data-phase="open"][data-presentation="floating"]').waitFor();
        const restored = (await panel().boundingBox())!;
        assert.ok(Math.abs(restored.x - desktop.x) < 1 && Math.abs(restored.y - desktop.y) < 1, JSON.stringify({ desktop, restored }));
        await close();
    });
    await check("reduced motion retains the attached drawer and the short close fade", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await open();
        assert.equal(await page.locator(".floating-panel-webgl").getAttribute("data-renderer"), "reduced-motion");
        assert.equal((await panel().boundingBox())!.x, 0);
        await close(); await page.emulateMedia({ reducedMotion: "no-preference" });
    });
    await check("the no-WebGL fallback also enters and exits through the left edge", async () => {
        const fallback = await browser.newContext({ viewport: { width: 390, height: 844 } });
        try {
            const tab = await fallback.newPage();
            tab.on("pageerror", error => errors.push(error.message));
            await tab.addInitScript(() => {
                const original = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
                    return type === "webgl" ? null : (original as any).call(this, type, ...args);
                } as any;
            });
            await tab.goto(base, { waitUntil: "networkidle" });
            await tab.getByRole("button", { name: "전체 메뉴 열기" }).click();
            await tab.locator('.glass-menu[data-phase="open"]').waitFor();
            assert.equal(await tab.locator(".floating-panel-webgl").getAttribute("data-renderer"), "dom");
            const origin = await tab.locator(".floating-panel-webgl").evaluate(el => JSON.parse((el as HTMLElement).dataset.origin!));
            assert.ok(origin.x < 0); assert.equal(origin.y, 0);
            await tab.keyboard.press("Escape"); await tab.locator(".glass-menu").waitFor({ state: "detached" });
        } finally { await fallback.close(); }
        await page.bringToFront();
    });
    await check("the design registry changes the live material and generated usage code by variant", async () => {
        await page.goto(new URL("design-rules/#components/liquid-glass", base).href, { waitUntil: "networkidle" });
        await page.getByRole("combobox", { name: "재질 베리언트", exact: true }).selectOption("drawer");
        const example = page.locator(".ds-glass-example");
        assert.equal(await example.getAttribute("data-glass-variant"), "drawer");
        await page.waitForFunction(() => document.querySelector('.ds-glass-example feDisplacementMap')?.getAttribute("scale") === "96");
        assert.ok(await page.getByRole("region", { name: "리퀴드 글래스 재질 베리언트" }).count());
        assert.ok((await page.locator(".ds-code-block").allTextContents()).some(code => code.includes('variant="drawer"')));
    });
    await check("home preserves its headings, shared invitation and three filled participation cards", async () => {
        await page.goto(base, { waitUntil: "networkidle" });
        for (const [id, text] of [["quick-booking-heading", "관람 예약"], ["discover-heading", "관람 일정"], ["visit-heading", "오시는 길"]]) {
            assert.equal(await page.locator("#" + id).textContent(), text);
        }
        assert.equal(await page.locator("#quick-booking-heading").getAttribute("aria-label"), "관람 예약");
        assert.equal(await page.locator("#quick-booking-heading .booking-invitation-letter").count(), 4);
        for (const width of [390, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.locator(".home-participation").scrollIntoViewIfNeeded();
            const state = await page.locator(".home-participation").evaluate(el => ({
                border: getComputedStyle(el).borderTopWidth,
                cards: [...el.querySelectorAll("a")].map(a => ({ background: getComputedStyle(a).backgroundColor, border: getComputedStyle(a).borderTopWidth })),
            }));
            assert.equal(state.border, "0px");
            assert.equal(new Set(state.cards.map(card => card.background)).size, 3);
            assert.ok(state.cards.every(card => card.border === "0px" && card.background !== "rgba(0, 0, 0, 0)"));
            await page.screenshot({ path: path.join(directory, `home-participation-${width}.png`) });
        }
    });
    await check("no browser runtime errors", async () => assert.deepEqual(errors, []));
} finally {
    fs.writeFileSync(path.join(directory, "report.json"), JSON.stringify({ base, verifiedAt: new Date().toISOString(), results, errors }, null, 2));
    await browser.close();
}
if (results.some(result => !result.passed)) process.exitCode = 1;
