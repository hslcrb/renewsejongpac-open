import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import type { Page, Locator } from "playwright";

// [실제 메뉴를 잡고 옮기는 검증 / Dragging the real menu in a browser]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const connected = Boolean(process.env.SEJONG_TEST_CDP);
const browser = connected
    ? await chromium.connectOverCDP(process.env.SEJONG_TEST_CDP!)
    : await chromium.launch();
const context = connected ? browser.contexts()[0] : await browser.newContext();
const page = connected ? context.pages()[0] || (await context.newPage()) : await context.newPage();
const directory = path.resolve(".lemonade/floating-menu");
fs.mkdirSync(directory, { recursive: true });
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.setDefaultTimeout(7000);
const panel = () => page.locator('.glass-menu[data-phase="open"]');
const trigger = () => page.getByRole("button", { name: "전체 메뉴 열기" });
const bounds = async () => (await panel().boundingBox())!;
const pause = () => page.evaluate(() => new Promise(requestAnimationFrame));
async function check(name: string, action: () => Promise<void>) {
    try {
        await action();
        results.push({ name, passed: true });
        console.log("PASS", name);
    } catch (error) {
        results.push({ name, passed: false, error: String(error) });
        console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
async function open() {
    if (!(await panel().count())) await trigger().click();
    await panel().waitFor();
    await page.waitForFunction(() =>
        getComputedStyle(
            document.querySelector(".glass-menu .liquid-glass-optics")!,
        ).backdropFilter.includes("url("),
    );
}
async function drag(target: Locator, dx: number, dy: number) {
    const box = (await target.boundingBox())!;
    const x = box.x + Math.min(36, box.width / 2);
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 14 });
    await page.mouse.up();
    await pause();
}
async function inBounds(target: Page) {
    // 반응형 전환 자체의 WebGL 모션이 끝난 뒤 정착한 창의 배치를 검증합니다.
    // Resizing can switch presentation; measure the settled interactive panel.
    await target.waitForFunction(() => {
        const panel = document.querySelector<HTMLElement>(".glass-menu");
        const presentation = matchMedia("(max-width: 700px)").matches ? "drawer" : "floating";
        return panel?.dataset.phase === "open" && panel.dataset.presentation === presentation;
    });
    const state = await target.evaluate(() => {
        const panel = document.querySelector(".glass-menu")!;
        const box = panel.getBoundingClientRect();
        const controls = panel.querySelector(".glass-menu-actions")!.getBoundingClientRect();
        const drawer = panel.getAttribute("data-presentation") === "drawer";
        return {
            fits: drawer ? Math.abs(box.left) < 1 && Math.abs(box.top) < 1 &&
                box.right <= innerWidth - 23 && Math.abs(box.bottom - innerHeight) < 1 :
                box.left >= 11 &&
                box.top >= 11 &&
                box.right <= innerWidth - 11 &&
                box.bottom <= innerHeight - 11,
            controls:
                controls.left >= 0 &&
                controls.right <= innerWidth &&
                controls.top >= 0 &&
                controls.bottom <= innerHeight,
            overflow: document.documentElement.scrollWidth > innerWidth,
        };
    });
    assert.deepEqual(state, { fits: true, controls: true, overflow: false });
}

try {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(base, { waitUntil: "networkidle" });
    await check(
        "opening paints only the floating panel and preserves the header and page",
        async () => {
            const before = await page
                .locator("#header")
                .evaluate((el) => el.getBoundingClientRect().height);
            await open();
            assert.equal(
                await page.locator("#header").evaluate((el) => el.getBoundingClientRect().height),
                before,
            );
            assert.equal(await panel().evaluate((el) => el.parentElement === document.body), true);
            assert.equal(await panel().getAttribute("aria-modal"), "false");
            assert.equal(await trigger().getAttribute("aria-expanded"), "true");
            await inBounds(page);
            await page.screenshot({ path: path.join(directory, "desktop.png") });
        },
    );
    await check(
        "actual backdrop refraction, type hierarchy and 48px navigation targets",
        async () => {
            const state = await page.evaluate(() => ({
                lens: document
                    .querySelector(".glass-lens-definitions feImage")!
                    .getAttribute("href")!
                    .startsWith("data:image/png"),
                blur: document
                    .querySelector(".glass-menu feGaussianBlur")!
                    .getAttribute("stdDeviation"),
                refraction: document
                    .querySelector(".glass-menu feDisplacementMap")!
                    .getAttribute("scale"),
                filter: getComputedStyle(
                    document.querySelector(".glass-menu .liquid-glass-optics")!,
                ).backdropFilter,
                sizes: [
                    ".glass-menu-header h2",
                    ".glass-menu-title",
                    ".glass-menu-columns a:not(.glass-menu-title)",
                ].map((s) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize)),
                targets: [
                    ...document.querySelectorAll(
                        ".glass-menu-columns a,.glass-menu-actions button",
                    ),
                ].every(
                    (el) =>
                        el.getBoundingClientRect().height >= 48 &&
                        el.getBoundingClientRect().width >= 48,
                ),
            }));
            assert.equal(state.lens, true);
            assert.match(state.filter, /url\(/);
            assert.equal(state.blur, "18");
            assert.equal(state.refraction, "64");
            assert.deepEqual(state.sizes, [48, 24, 18]);
            assert.equal(state.targets, true);
        },
    );
    await check("every menu destination opens an exported document", async () => {
        const paths = await panel()
            .locator("a")
            .evaluateAll((links) => [...new Set(links.map((link) => link.href))]);
        const responses = await Promise.all(paths.map((url) => context.request.get(url)));
        for (let index = 0; index < responses.length; index++) {
            assert.equal(responses[index].status(), 200, paths[index]);
            assert.match(await responses[index].text(), /<html/);
        }
    });
    await check("the heading follows a free drag in both axes", async () => {
        const before = await bounds();
        await drag(page.locator(".glass-menu-header h2"), 110, 70);
        const after = await bounds();
        assert.ok(Math.abs(after.x - before.x - 110) < 1);
        assert.ok(Math.abs(after.y - before.y - 70) < 1);
    });
    await check(
        "dragging a navigation label moves the panel without following its link",
        async () => {
            const url = page.url();
            const before = await bounds();
            await drag(
                page
                    .locator(".glass-menu-columns")
                    .getByRole("link", { name: "공연", exact: true }),
                -80,
                -40,
            );
            const after = await bounds();
            assert.ok(Math.abs(after.x - before.x + 80) < 1);
            assert.ok(Math.abs(after.y - before.y + 40) < 1);
            assert.equal(page.url(), url);
            assert.equal(await panel().count(), 1);
        },
    );
    await check(
        "keyboard movement is precise and Home restores the starting position",
        async () => {
            const move = page.getByRole("button", { name: "메뉴 위치 이동" });
            await move.focus();
            await move.press("Home");
            await pause();
            const start = await bounds();
            await move.press("ArrowRight");
            await pause();
            assert.equal((await bounds()).x, start.x + 16);
            await move.press("Shift+ArrowDown");
            await pause();
            assert.equal((await bounds()).y, start.y + 4);
            await move.press("Home");
            await pause();
            assert.deepEqual(await bounds(), start);
        },
    );
    await check("the full panel clamps at every viewport edge", async () => {
        const target = page.locator(".glass-menu-header h2");
        await drag(target, -1100, -500);
        assert.equal((await bounds()).x, 12);
        assert.equal((await bounds()).y, 12);
        await drag(target, 1300, 850);
        await inBounds(page);
        const box = await bounds();
        const rightEdge = await page.evaluate(() => document.documentElement.clientWidth - 12);
        assert.ok(Math.abs(box.x + box.width - rightEdge) < 1);
        assert.ok(Math.abs(box.y + box.height - 988) < 1);
    });
    await check(
        "close and Escape restore focus; reopening retains the chosen position",
        async () => {
            const before = await bounds();
            await page.getByRole("button", { name: "전체 메뉴 닫기" }).click();
            await page.waitForFunction(() => !document.querySelector(".glass-menu"));
            assert.equal(await trigger().evaluate((el) => el === document.activeElement), true);
            await open();
            assert.deepEqual(await bounds(), before);
            await page.keyboard.press("Escape");
            await page.waitForFunction(() => !document.querySelector(".glass-menu"));
            assert.equal(await trigger().evaluate((el) => el === document.activeElement), true);
            await open();
        },
    );
    await check(
        "background scrolling remains available while the menu holds its position",
        async () => {
            const before = await bounds();
            await page.mouse.move(4, 450);
            await page.mouse.wheel(0, 450);
            await page.waitForFunction(() => scrollY > 0);
            assert.deepEqual(await bounds(), before);
            await page.evaluate(() => scrollTo(0, 0));
        },
    );
    await check(
        "desktop, tablet and mobile reflow keep controls and all links reachable",
        async () => {
            for (const width of [1920, 1440, 1024, 768, 390, 320]) {
                await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
                await pause();
                await inBounds(page);
                await panel().evaluate((el) => {
                    const body = el.querySelector(".glass-menu-content")!;
                    body.scrollTop = body.scrollHeight;
                });
                const finalLink = page.locator(".glass-menu-utilities a").last();
                const last = (await finalLink.boundingBox())!;
                const body = (await page.locator(".glass-menu-content").boundingBox())!;
                assert.ok(last.y >= body.y && last.y + last.height <= body.y + body.height + 1);
                await panel().evaluate(
                    (el) => (el.querySelector(".glass-menu-content")!.scrollTop = 0),
                );
                await page.screenshot({ path: path.join(directory, `width-${width}.png`) });
            }
        },
    );
    await check("high contrast uses an opaque readable surface", async () => {
        await page.emulateMedia({ contrast: "more" });
        const state = await page.locator(".glass-menu .liquid-glass-optics").evaluate((el) => ({
            filter: getComputedStyle(el).backdropFilter,
            background: getComputedStyle(el).backgroundColor,
        }));
        assert.deepEqual(state, { filter: "none", background: "rgb(255, 255, 255)" });
        await page.emulateMedia({ contrast: "no-preference", reducedMotion: "reduce" });
        await inBounds(page);
        await page.emulateMedia({ reducedMotion: "no-preference" });
    });
    await check("a regular link still navigates and dismisses the menu", async () => {
        await page.setViewportSize({ width: 1600, height: 1000 });
        await page
            .locator(".glass-menu-columns")
            .getByRole("link", { name: "공연", exact: true })
            .click();
        await page.waitForURL(/\/v5\/programs\/performance\//);
        await page.getByRole("heading", { name: "공연", level: 1, exact: true }).waitFor();
        await page.waitForFunction(() => !document.querySelector(".glass-menu"));
    });
    await check(
        "the design guide demonstrates the same floating menu and restores its trigger",
        async () => {
            await page.goto(new URL("design-rules/#components/floating-menu", base).href, {
                waitUntil: "networkidle",
            });
            const button = page.getByRole("button", { name: "전체 메뉴 열기", exact: true }).last();
            await button.click();
            await panel().waitFor();
            assert.equal(
                await panel()
                    .getByRole("navigation", { name: "전체 메뉴", exact: true })
                    .getByRole("link")
                    .count(),
                34,
            );
            await page.keyboard.press("Escape");
            await page.waitForFunction(() => !document.querySelector(".glass-menu"));
            assert.equal(await button.evaluate((el) => el === document.activeElement), true);
            await page.screenshot({ path: path.join(directory, "design-guide.png") });
        },
    );
    await check(
        "native touch scrolls the body, drags the title and cancels a gesture cleanly",
        async () => {
            const touchContext = await browser.newContext({
                hasTouch: true,
                viewport: { width: 1280, height: 1100 },
            });
            const touchPage = await touchContext.newPage();
            touchPage.on("pageerror", (error) => errors.push(error.message));
            await touchPage.goto(base, { waitUntil: "networkidle" });
            await touchPage.getByRole("button", { name: "전체 메뉴 열기" }).click();
            await touchPage.locator('.glass-menu[data-phase="open"]').waitFor();
            const cdp = await touchContext.newCDPSession(touchPage);
            const touch = async (type: string, x = 0, y = 0) =>
                cdp.send("Input.dispatchTouchEvent", {
                    type,
                    touchPoints: type === "touchEnd" || type === "touchCancel" ? [] : [{ x, y }],
                });
            const heading = (await touchPage.locator(".glass-menu-header h2").boundingBox())!;
            const original = (await touchPage.locator(".glass-menu").boundingBox())!;
            const x = heading.x + 40,
                y = heading.y + 24;
            await touch("touchStart", x, y);
            for (let i = 1; i <= 8; i++) await touch("touchMove", x + i * 3, y + i * 8);
            await touch("touchEnd");
            await touchPage.evaluate(() => new Promise(requestAnimationFrame));
            const moved = (await touchPage.locator(".glass-menu").boundingBox())!;
            assert.ok(moved.x > original.x + 20 && moved.y > original.y + 60);
            await touch("touchStart", x + 24, y + 64);
            await touch("touchMove", x + 34, y + 84);
            await touch("touchCancel");
            await touchPage
                .locator(".glass-menu[data-dragging]")
                .waitFor({ state: "detached", timeout: 1500 });
            assert.equal(await touchPage.locator(".glass-menu[data-dragging]").count(), 0);
            await touchPage.setViewportSize({ width: 390, height: 844 });
            await touchPage.evaluate(() => new Promise(requestAnimationFrame));
            await touchPage.locator('.glass-menu[data-phase="open"][data-presentation="drawer"]').waitFor();
            await touchPage.locator(".glass-menu-group summary").first().click();
            const body = (await touchPage.locator(".glass-menu-content").boundingBox())!;
            await touch("touchStart", body.x + 100, body.y + 350);
            for (let i = 1; i <= 10; i++)
                await touch("touchMove", body.x + 100, body.y + 350 - i * 20);
            await touch("touchEnd");
            await touchPage.waitForFunction(
                () => document.querySelector(".glass-menu-content")!.scrollTop > 50,
            );
            await inBounds(touchPage);
            await touchContext.close();
        },
    );
    await check("no browser runtime errors", async () => assert.deepEqual(errors, []));
} finally {
    fs.writeFileSync(
        path.join(directory, "report.json"),
        JSON.stringify({ base, results, errors }, null, 2),
    );
    if (connected) {
        await page.setViewportSize({ width: 1600, height: 1000 });
        await page.goto(base, { waitUntil: "networkidle" });
        await open();
    }
    await browser.close();
}
if (results.some((result) => !result.passed)) process.exitCode = 1;
