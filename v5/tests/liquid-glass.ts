import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

// [실제 배경과 공통 표면의 검증 / Verify the shared surface against a real backdrop]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const connected = Boolean(process.env.SEJONG_TEST_CDP);
const browser = connected
    ? await chromium.connectOverCDP(process.env.SEJONG_TEST_CDP!)
    : await chromium.launch();
const context = connected ? browser.contexts()[0] : await browser.newContext();
const page = connected ? context.pages()[0] || (await context.newPage()) : await context.newPage();
const directory = path.resolve(".lemonade/liquid-glass");
fs.mkdirSync(directory, { recursive: true });
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.setDefaultTimeout(7000);
async function check(name: string, run: () => Promise<void>) {
    try {
        await run();
        results.push({ name, passed: true });
        console.log("PASS", name);
    } catch (error) {
        results.push({ name, passed: false, error: String(error) });
        console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
const example = () => page.locator(".ds-glass-example");
try {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.bringToFront();
    await page.getByRole("button", { name: "전체 메뉴 열기" }).click();
    await page.locator('.glass-menu[data-phase="open"]').waitFor();
    await check(
        "the menu uses the registered surface with denser glass and stronger refraction",
        async () => {
            await page.waitForFunction(() =>
                getComputedStyle(document.querySelector(".glass-menu")!)
                    .getPropertyValue("--glass-filter")
                    .includes("url("),
            );
            assert.equal(await page.locator(".glass-menu.liquid-glass").count(), 1);
            const surface = await page.locator(".glass-menu").evaluate((el) => ({
                opacity: getComputedStyle(el).getPropertyValue("--glass-opacity").trim(),
                strength: el.querySelector("feDisplacementMap")!.getAttribute("scale"),
                blur: el.querySelector("feGaussianBlur")!.getAttribute("stdDeviation"),
                composite: el.querySelector('feComposite[operator="arithmetic"]') !== null,
            }));
            assert.deepEqual(surface, {
                opacity: "0.82",
                strength: "64",
                blur: "18",
                composite: true,
            });
            await page.screenshot({ path: path.join(directory, "menu-desktop.png") });
        },
    );
    await page.keyboard.press("Escape");
    await page.goto(new URL("design-rules/#components/liquid-glass", base).href, {
        waitUntil: "networkidle",
    });
    await example().waitFor();
    await page.waitForFunction(() =>
        document
            .querySelector(".ds-glass-example feImage")!
            .getAttribute("href")
            ?.startsWith("data:image/png"),
    );
    await check(
        "the component is registered with a live example, public props and importable code",
        async () => {
            assert.equal(
                (await page.locator('[href="#components/liquid-glass"]').count()) > 0,
                true,
            );
            await page.getByRole("region", { name: "LiquidGlass 컴포넌트 속성" }).waitFor();
            assert.match(
                await page.locator("#components-liquid-glass .ds-code-block").innerText(),
                /import LiquidGlass/,
            );
            assert.equal(await example().evaluate((el) => getComputedStyle(el).filter), "none");
            await page.locator("#components-liquid-glass").scrollIntoViewIfNeeded();
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({ path: path.join(directory, "component-desktop.png") });
        },
    );
    await check(
        "opacity updates the actual glass tint, its value and the generated example",
        async () => {
            const slider = page.locator("#glass-opacity");
            await slider.press("End");
            assert.equal(await slider.inputValue(), "0.96");
            const tint = await example()
                .locator(".liquid-glass-optics")
                .evaluate((el) => getComputedStyle(el).backgroundColor);
            assert.equal(tint, "rgba(255, 255, 255, 0.96)");
            assert.match(
                await page.locator("#components-liquid-glass .ds-code-block").innerText(),
                /opacity=\{0.96\}/,
            );
            await page.getByRole("button", { name: "기본값으로", exact: true }).click();
        },
    );
    await check(
        "refraction changes the rendered pixels while foreground text stays unchanged",
        async () => {
            const slider = page.locator("#glass-refraction");
            const text = await example().innerText();
            await slider.press("Home");
            await page.waitForFunction(
                () =>
                    document
                        .querySelector(".ds-glass-example feDisplacementMap")!
                        .getAttribute("scale") === "0",
            );
            const without = await example().screenshot({
                path: path.join(directory, "refraction-0.png"),
            });
            await slider.press("End");
            await page.waitForFunction(
                () =>
                    document
                        .querySelector(".ds-glass-example feDisplacementMap")!
                        .getAttribute("scale") === "120",
            );
            const withRefraction = await example().screenshot({
                path: path.join(directory, "refraction-120.png"),
            });
            assert.equal(without.equals(withRefraction), false);
            assert.equal(await example().innerText(), text);
            await page.getByRole("button", { name: "기본값으로", exact: true }).click();
        },
    );
    await check(
        "separate surfaces keep unique filters and independent material settings",
        async () => {
            await page.locator("#glass-opacity").press("Home");
            await page.getByRole("button", { name: "전체 메뉴 열기", exact: true }).last().click();
            await page.locator('.glass-menu[data-phase="open"]').waitFor();
            await page.waitForFunction(
                () => document.querySelectorAll(".ds-glass-example feImage[href], .glass-menu feImage[href]").length === 2,
            );
            const state = await page.evaluate(() => {
                const filters = [...document.querySelectorAll(".ds-glass-example filter, .glass-menu filter")].map(
                    (el) => el.id,
                );
                return {
                    unique: new Set(filters).size === 2,
                    preview: getComputedStyle(
                        document.querySelector(".ds-glass-example .liquid-glass-optics")!,
                    ).backgroundColor,
                    menu: getComputedStyle(
                        document.querySelector(".glass-menu .liquid-glass-optics")!,
                    ).backgroundColor,
                };
            });
            assert.deepEqual(state, {
                unique: true,
                preview: "rgba(255, 255, 255, 0.4)",
                menu: "rgba(255, 255, 255, 0.82)",
            });
            await page.keyboard.press("Escape");
            await page.getByRole("button", { name: "기본값으로", exact: true }).click();
        },
    );
    await check("resizing regenerates the lens and the component fits mobile widths", async () => {
        const originalMap = await example().locator("feImage").getAttribute("href");
        for (const width of [768, 390, 320]) {
            await page.setViewportSize({ width, height: 900 });
            await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
            await example().scrollIntoViewIfNeeded();
            assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
                false,
            );
            await page.screenshot({ path: path.join(directory, `component-${width}.png`) });
        }
        assert.notEqual(await example().locator("feImage").getAttribute("href"), originalMap);
    });
    await check("high contrast replaces the optical effect with an opaque surface", async () => {
        await page.emulateMedia({ contrast: "more" });
        const style = await example()
            .locator(".liquid-glass-optics")
            .evaluate((el) => ({
                filter: getComputedStyle(el).backdropFilter,
                tint: getComputedStyle(el).backgroundColor,
            }));
        assert.deepEqual(style, { filter: "none", tint: "rgb(255, 255, 255)" });
        await page.emulateMedia({ contrast: "no-preference" });
    });
    await check("no browser runtime errors", async () => assert.deepEqual(errors, []));
} finally {
    fs.writeFileSync(
        path.join(directory, "report.json"),
        JSON.stringify({ base, verifiedAt: new Date().toISOString(), results, errors }, null, 2),
    );
    await browser.close();
}
if (results.some((result) => !result.passed)) process.exitCode = 1;
