import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, expect } from "playwright/test";
import type { Locator } from "playwright/test";

// [같은 버튼의 중첩 상태와 실제 연결 / Overlapping states of the same control and its product connections]
const base = (process.argv[2] || "http://127.0.0.1:4173/v5/").replace(/\/?$/, "/");
const directory = path.resolve(".lemonade/control-states");
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors: string[] = [];
const results: { name: string; passed: boolean; error?: string }[] = [];
page.on("pageerror", error => errors.push(error.message));
page.setDefaultTimeout(10000);
async function sample(control: Locator) {
    return control.evaluate(element => {
        const style = getComputedStyle(element);
        const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
        const chain: Element[] = [];
        for (let item: Element | null = element; item; item = item.parentElement) chain.unshift(item);
        let background = [255, 255, 255];
        for (const item of chain) {
            const color = rgba(getComputedStyle(item).backgroundColor);
            const alpha = color[3] ?? 1;
            background = background.map((value, index) => color[index] * alpha + value * (1 - alpha));
        }
        const luminance = (color: number[]) => color.slice(0, 3).map(value => {
            const channel = value / 255;
            return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
        const foreground = luminance(rgba(style.color)), backdrop = luminance(background);
        return { color: style.color, background: style.backgroundColor, contrast: (Math.max(foreground, backdrop) + .05) / (Math.min(foreground, backdrop) + .05),
            width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height,
            transition: style.transitionProperty, icon: element.querySelector("svg") ? getComputedStyle(element.querySelector("svg")!).fill : null };
    });
}
async function settle(control: Locator) {
    await control.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {}))));
}
async function readable(control: Locator) {
    const state = await sample(control);
    assert.ok(state.contrast >= 4.5, JSON.stringify(state));
    if (state.icon) assert.equal(state.icon, state.color, "icons inherit the same foreground as labels");
}
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) {
        results.push({ name, passed: false, error: String(error) }); console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
async function go(route = "") {
    await page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
}
try {
    await go("design-rules/#components/registry");
    await check("selected filters retain contrasting foregrounds while hovered and pressed", async () => {
        const filter = page.locator("#example-filter-button-selected-true button");
        await filter.hover(); await settle(filter); await readable(filter);
        await page.mouse.down(); await readable(filter); await page.mouse.up();
        await expect(filter).toHaveAttribute("aria-pressed", "false");
        await readable(filter);
        await filter.click();
        await expect(filter).toHaveAttribute("aria-pressed", "true");
        for (let index = 0; index < 6; index++) { await page.waitForTimeout(20); await readable(filter); }
        await page.screenshot({ path: path.join(directory, "guide-selected-hover.png") });
    });
    await check("selected disabled controls retain disabled colors even under hover", async () => {
        const filter = page.locator("#example-filter-button-state-disabled button");
        await filter.evaluate((element: HTMLButtonElement) => element.setAttribute("aria-pressed", "true"));
        await filter.hover({ force: true });
        await settle(filter);
        const disabled = await sample(filter);
        const expected = await filter.evaluate(element => {
            const probe = document.createElement("i");
            probe.style.cssText = "color:var(--action-disabled-text);background:var(--action-disabled)";
            element.append(probe);
            const style = getComputedStyle(probe);
            const result = { color: style.color, background: style.backgroundColor }; probe.remove(); return result;
        });
        assert.equal(disabled.color, expected.color); assert.equal(disabled.background, expected.background);
        await filter.evaluate(element => element.removeAttribute("aria-pressed"));
    });
    await check("every guide control variant stays readable at rest, hover and pointer press", async () => {
        for (const component of ["button", "button-link", "icon-button", "filter-button"]) {
            const controls = page.locator(`[data-component-example="${component}"][data-example-axis="variant"] :is(button,a).ds-button`);
            for (const control of await controls.all()) {
                await control.scrollIntoViewIfNeeded(); await page.mouse.move(2, 80); await settle(control); await readable(control);
                await control.hover(); await settle(control); await readable(control);
                await page.mouse.down(); await readable(control); await page.mouse.move(2, 80); await page.mouse.up();
                if (component !== "button-link") {
                    const original = await control.getAttribute("aria-pressed");
                    await control.evaluate(element => element.setAttribute("aria-pressed", "true"));
                    await control.hover(); await settle(control); await readable(control);
                    await control.evaluate((element, value) => value === null ? element.removeAttribute("aria-pressed") : element.setAttribute("aria-pressed", value), original);
                }
            }
        }
    });
    await check("circles contain icons with accessible labels; flow circles have equal 50px axes", async () => {
        for (const component of ["button", "button-link", "icon-button", "filter-button"]) {
            const control = page.locator(`#example-${component}-shape-circle .ds-button`);
            await expect(control.locator('[data-component-id="icon"]')).toHaveCount(1);
            assert.ok(await control.getAttribute("aria-label"));
            const metric = await sample(control); assert.equal(metric.width, metric.height); assert.equal(metric.width, 48);
            await control.evaluate(element => element.setAttribute("data-context", "flow"));
            const flow = await sample(control); assert.equal(flow.width, 50); assert.equal(flow.height, 50);
            await control.evaluate(element => element.setAttribute("data-context", "default"));
        }
        const flow = page.locator("#example-icon-button-context-flow button");
        const metric = await sample(flow); assert.equal(metric.width, 50); assert.equal(metric.height, 50);
    });
    await check("neutral toggles invert as a pair without a low-contrast transition frame", async () => {
        const button = page.locator("#example-button-state-pressed button");
        await button.hover(); await settle(button);
        const selected = await sample(button);
        await button.click();
        await expect(button).toHaveAttribute("aria-pressed", "false");
        const unselected = await sample(button);
        assert.notEqual(selected.background, unselected.background);
        for (let index = 0; index < 6; index++) { await page.waitForTimeout(20); await readable(button); }
        await page.keyboard.press("Tab"); await button.focus(); await page.keyboard.press("Space");
        await expect(button).toHaveAttribute("aria-pressed", "true"); await readable(button);
    });
    await go();
    await check("real program and news filters use the same selected-hover contract", async () => {
        for (const selector of ["#home-program-filters", ".home-news-filters"]) {
            const group = page.locator(selector);
            const selected = group.locator('[aria-pressed="true"]');
            await selected.hover(); await settle(selected); await readable(selected);
            const alternative = page.locator(`#${await group.locator('[aria-pressed="false"]').first().getAttribute("id")}`);
            await alternative.click(); await expect(alternative).toHaveAttribute("aria-pressed", "true"); await readable(alternative);
        }
    });
    await check("real circular controls render registered icons before and after playback toggles", async () => {
        const playback = page.locator("#home-feature-playback");
        await playback.hover(); await settle(playback); await readable(playback);
        await playback.click(); await readable(playback);
        await expect(playback.locator('[data-component-id="icon"]')).toHaveCount(1);
        const menu = page.getByRole("button", { name: "전체 메뉴 열기", exact: true });
        await expect(menu.locator('[data-component-id="icon"]')).toHaveCount(1);
        await menu.click();
        const move = page.locator("[data-panel-move]");
        await move.click(); await readable(move);
        await expect(move.locator('[data-component-id="icon"]')).toHaveCount(1);
        await page.keyboard.press("Escape");
    });
    await check("390px touch keeps circle geometry and avoids sticky hover selection", async () => {
        const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        const tab = await touch.newPage();
        await tab.goto(base, { waitUntil: "networkidle" });
        const filter = tab.locator(`#${await tab.locator(".home-news-filters [aria-pressed='false']").first().getAttribute("id")}`);
        await filter.tap(); await expect(filter).toHaveAttribute("aria-pressed", "true");
        const style = await sample(filter); assert.ok(style.contrast >= 4.5);
        const menu = tab.getByRole("button", { name: "전체 메뉴 열기", exact: true });
        const metric = await sample(menu); assert.equal(metric.width, metric.height);
        assert.ok(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await touch.close();
    });
    assert.deepEqual(errors, []);
} finally {
    fs.writeFileSync(path.join(directory, "browser-results.json"), JSON.stringify({ base, results, errors }, null, 2) + "\n");
    await browser.close();
}
assert.ok(results.every(result => result.passed), "Control state regressions failed; see browser-results.json.");
