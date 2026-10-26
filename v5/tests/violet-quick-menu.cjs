const { chromium, expect } = require("playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:3000/v5/";
const directory = path.resolve(process.env.SEJONG_VIOLET_REPORT_DIR || path.join(__dirname, "../.lemonade/violet-quick-menu"));
const testFilter = process.env.SEJONG_VIOLET_TEST_FILTER || "";
const presenceCheck = "a working v5 home page exposes the violet quick-menu component";
const report = { target: base, filter: testFilter || null, startedAt: new Date().toISOString(), checks: [], menuErrors: [], unrelatedErrors: [], screenshots: [] };
fs.mkdirSync(directory, { recursive: true });
const save = () => fs.writeFileSync(path.join(directory, "results.json"), JSON.stringify(report, null, 2));
const selectors = {
    menu: "[data-violet-menu]",
    toggle: "[data-violet-toggle]",
    wheel: "[data-violet-wheel]",
    links: "[data-violet-link]",
    current: "[data-violet-current]",
};
const destinations = ["#quick-booking", "/v5/programs/", "/v5/visit/directions/", "/v5/visit/group/", "/v5/rental/", "/v5/account/"];

// [실제 메뉴의 존재와 조작 / Real menu presence and interaction]
// 먼저 정상 홈 화면에서 새 메뉴가 없는 실패를 확인한 뒤 실제 브라우저 입력으로 검증합니다.
// Establish a missing-feature failure on a working home page, then exercise real browser input.
async function check(name, run) {
    // Keep the real-page prerequisite when running a focused regression by name.
    if (testFilter && name !== presenceCheck && !name.includes(testFilter)) return true;
    const result = { name, status: "running" };
    report.checks.push(result);
    try {
        result.details = await run();
        result.status = "passed";
        console.log(`PASS ${name}`);
        return true;
    } catch (error) {
        result.status = "failed";
        result.error = error.stack;
        console.error(`FAIL ${name}: ${error.message}`);
        return false;
    } finally {
        save();
    }
}

function destinationOf(href) {
    assert.ok(href, "A menu destination must have a native href");
    const url = new URL(href, base);
    return url.hash === "#quick-booking" ? url.hash : `${url.pathname.replace(/\/+$/, "")}/`;
}

function observeErrors(page, scope) {
    const record = (kind, message) => {
        const result = { scope, kind, message };
        const group = /VioletQuickMenu|violet-quick-menu|violetQuickMenu|data-violet/i.test(message)
            ? report.menuErrors : report.unrelatedErrors;
        if (!group.some((item) => item.kind === kind && item.message === message)) group.push(result);
    };
    page.on("pageerror", (error) => record("page", error.stack || error.message));
    page.on("console", (message) => {
        if (message.type() === "error") record("console", `${message.text()} ${message.location().url || ""}`.trim());
    });
    page.on("dialog", (dialog) => dialog.dismiss());
    page.setDefaultTimeout(6000);
    page.setDefaultNavigationTimeout(30000);
}

async function home(page) {
    await page.mouse.move(0, 0);
    const response = await page.goto(base, { waitUntil: "domcontentloaded" });
    assert.ok(response && response.ok(), `Home page must load before checking the feature (HTTP ${response?.status()})`);
    await expect(page.locator("#featured-season")).toHaveCount(1);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.evaluate(() => document.fonts.ready);
    // The hero is server-rendered; the visibility observer starts after hydration.
    await expect(page.locator(selectors.toggle)).toBeVisible();
    return response;
}

async function wheelIsStable(page) {
    let previous;
    let stableSamples = 0;
    await expect.poll(async () => {
        // A pending transition can return the same compressed box before its first paint.
        const transitioning = await page.locator(selectors.wheel).evaluate((element) => {
            for (let node = element; node; node = node.parentElement) {
                if (node.getAnimations().some((animation) => animation instanceof CSSTransition && (animation.playState === "running" || animation.pending))) return true;
                if (node.matches("[data-violet-menu]")) break;
            }
            return false;
        });
        if (transitioning) {
            previous = undefined;
            stableSamples = 0;
            return false;
        }
        const box = await page.locator(selectors.wheel).boundingBox();
        assert.ok(box, "The expanded wheel must have a visible box");
        const stable = previous && ["x", "y", "width", "height"].every((key) => Math.abs(previous[key] - box[key]) < 0.5);
        stableSamples = stable ? stableSamples + 1 : 0;
        previous = box;
        return stableSamples >= 2;
    }, { message: "The expanded wheel must finish its layout transition", timeout: 5000, intervals: [40, 70, 100] }).toBe(true);
}

async function openMenu(page, input = "hover") {
    const toggle = page.locator(selectors.toggle);
    await expect(toggle).toBeVisible();
    if (input === "touch") await toggle.tap();
    else if (input === "keyboard") {
        await toggle.focus();
        await page.keyboard.press("Enter");
    } else await toggle.hover();
    await expect(page.locator(selectors.menu)).toHaveAttribute("data-state", "open");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAccessibleName("퀵메뉴 닫기");
    await expect(page.getByRole("navigation", { name: "원형 퀵메뉴", exact: true })).toBeVisible();
    await expect(page.locator(selectors.links)).toHaveCount(6);
    await wheelIsStable(page);
}

async function screenshot(page, filename) {
    await page.screenshot({ path: path.join(directory, filename), animations: "disabled" });
    report.screenshots.push(filename);
}

async function visuallyPresent(page) {
    return page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height || box.bottom <= 0 || box.right <= 0 || box.top >= innerHeight || box.left >= innerWidth) return false;
        for (let node = element; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (node.hidden || node.getAttribute("aria-hidden") === "true" || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) <= 0.01) return false;
        }
        return true;
    }, selectors.menu);
}

async function rotation(page) {
    const raw = await page.locator(selectors.wheel).getAttribute("data-rotation");
    assert.ok(raw !== null && raw.trim() !== "", "The wheel must expose its data-rotation value");
    const value = Number(raw);
    assert.ok(Number.isFinite(value), "The wheel must expose a finite numeric rotation");
    return value;
}

async function settledRotation(page) {
    let previous;
    let stableSamples = 0;
    let value;
    await expect.poll(async () => {
        value = await rotation(page);
        const snapped = Math.abs(value - Math.round(value / 60) * 60) < 0.75;
        stableSamples = snapped && previous !== undefined && Math.abs(value - previous) < 0.15 ? stableSamples + 1 : 0;
        previous = value;
        return stableSamples >= 3;
    }, { message: "Released rotation must settle on a 60-degree item", timeout: 6000, intervals: [50, 80, 100] }).toBe(true);
    return value;
}

async function dragArc(page) {
    return page.evaluate(({ wheel, links }) => {
        const box = document.querySelector(wheel).getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const link = [...document.querySelectorAll(links)].map((element) => {
            const rect = element.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }).sort((a, b) => a.x - b.x)[0];
        const radius = Math.hypot(link.x - cx, link.y - cy);
        const start = Math.atan2(link.y - cy, link.x - cx) * 180 / Math.PI;
        const end = start >= 0 ? 230 : -230;
        return Array.from({ length: 17 }, (_, index) => {
            const angle = (start + (end - start) * index / 16) * Math.PI / 180;
            return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
        });
    }, selectors);
}

// [각도 경계와 실제 터치 입력 / Angular wrap and actual touch input]
// 링크 위에서 시작하여 ±180도 경계를 지나며 드래그 후 잘못된 이동까지 확인합니다.
// Start on a real link, cross the atan2 boundary, and verify that release cannot navigate.
async function dragWheel(page, touch = false) {
    const beforeUrl = page.url();
    const points = await dragArc(page);
    const startHit = await page.evaluate(({ point, links }) => {
        const hit = document.elementFromPoint(point.x, point.y);
        const link = hit?.closest(links);
        return { point, tag: hit?.tagName, link: link?.matches("a[href]") ? link.getAttribute("data-violet-link") : null };
    }, { point: points[0], links: selectors.links });
    assert.ok(startHit.link, `Dragging must start on a visible native shortcut: ${JSON.stringify(startHit)}`);
    const samples = [await rotation(page)];
    const client = touch ? await page.context().newCDPSession(page) : null;
    const touchPoint = (point) => ({ ...point, id: 1, radiusX: 4, radiusY: 4, force: 1 });
    let pressed = false;
    try {
        if (touch) await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touchPoint(points[0])] });
        else {
            await page.mouse.move(points[0].x, points[0].y);
            await page.mouse.down();
        }
        pressed = true;
        for (const point of points.slice(1)) {
            if (touch) await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [touchPoint(point)] });
            else await page.mouse.move(point.x, point.y);
            await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
            samples.push(await rotation(page));
        }
        if (touch) await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        else await page.mouse.up();
        pressed = false;
    } finally {
        if (pressed) {
            if (touch) await client.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
            else await page.mouse.up();
        }
        if (client) await client.detach();
    }
    const liveChange = Math.abs(samples.at(-1) - samples[0]);
    assert.ok(liveChange > 25, `Dragging must rotate the wheel, received ${liveChange} degrees`);
    for (let index = 1; index < samples.length; index++) {
        assert.ok(Math.abs(samples[index] - samples[index - 1]) < 45, `Crossing ±180 degrees must not jump the wheel: ${JSON.stringify(samples)}`);
    }
    const snapped = await settledRotation(page);
    assert.ok(Math.abs(snapped - samples.at(-1)) <= 120.75, "Gentle inertia must settle within two further items");
    assert.equal(page.url(), beforeUrl, "Dragging a native menu link must not navigate on release");
    await expect(page.locator(selectors.menu)).toHaveAttribute("data-state", "open");
    return { input: touch ? "CDP touch events" : "mouse pointer", startHit, liveChange, snapped, samples };
}

async function geometry(page) {
    return page.evaluate((selectors) => {
        const rect = (element) => {
            const box = element.getBoundingClientRect();
            return { x: box.left, y: box.top, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
        };
        return {
            viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
            wheel: rect(document.querySelector(selectors.wheel)),
            center: rect(document.querySelector(selectors.current)),
            links: [...document.querySelectorAll(selectors.links)].map((element) => ({ label: element.textContent.trim(), href: element.getAttribute("href"), ...rect(element) })),
        };
    }, selectors);
}

function assertGeometry(layout) {
    const { viewport, wheel, center, links } = layout;
    const epsilon = 2;
    assert.ok(viewport.scrollWidth <= viewport.width + 1, `No horizontal page overflow: ${JSON.stringify(viewport)}`);
    assert.ok(wheel.width > 0 && wheel.height > 0, "The open wheel must have nonzero dimensions");
    assert.ok(wheel.x >= -epsilon && wheel.y >= -epsilon && wheel.right <= viewport.width + epsilon && wheel.bottom <= viewport.height + epsilon, `The entire wheel must fit in the viewport: ${JSON.stringify(wheel)}`);
    const inside = (box, frame) => box.x >= frame.x - epsilon && box.y >= frame.y - epsilon && box.right <= frame.right + epsilon && box.bottom <= frame.bottom + epsilon;
    const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1;
    for (const [index, link] of links.entries()) {
        assert.ok(link.width > 0 && link.height > 0 && inside(link, wheel), `Target must fit inside the wheel: ${JSON.stringify(link)}`);
        assert.ok(!overlaps(link, center), `Target overlaps the center CTA: ${JSON.stringify(link)}`);
        for (const other of links.slice(index + 1)) assert.ok(!overlaps(link, other), `Targets overlap: ${link.label} / ${other.label}`);
    }
    assert.ok(inside(center, wheel), "The selected CTA must fit inside the wheel");
}

async function bookingArrived(page) {
    await expect(page.locator("#quick-booking-heading")).toBeFocused();
    await expect.poll(() => page.locator("#quick-booking-heading").evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= innerHeight;
    }), { message: "The booking heading must scroll into view" }).toBe(true);
    await expect.poll(() => visuallyPresent(page), { message: "The menu must hide when scrolling beyond the hero" }).toBe(false);
}

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
    try {
        const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
        const page = await desktop.newPage();
        observeErrors(page, "desktop");
        const mounted = await check(presenceCheck, async () => {
            const response = await home(page);
            await expect(page.locator(selectors.menu), "The new violet quick-menu component must exist on the home hero").toHaveCount(1, { timeout: 2500 });
            await expect(page.locator(selectors.toggle)).toBeVisible();
            return { status: response.status(), menus: await page.locator(selectors.menu).count() };
        });
        if (!mounted) return;

        await check("the resting control has a closed state and an accessible open action", async () => {
            await home(page);
            await expect(page.locator(selectors.menu)).toHaveAttribute("data-state", "closed");
            await expect(page.locator(selectors.toggle)).toHaveAttribute("aria-expanded", "false");
            await expect(page.locator(selectors.toggle)).toHaveAccessibleName("퀵메뉴 열기");
            await screenshot(page, "closed-1440.png");
        });

        await check("fine-pointer hover exposes six real navigation destinations", async () => {
            await home(page);
            assert.ok(await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches));
            await openMenu(page);
            const links = await page.locator(selectors.links).evaluateAll((elements) => elements.map((element) => ({ tag: element.tagName, href: element.getAttribute("href") })));
            assert.ok(links.every((link) => link.tag === "A"), "Outer targets must remain native anchors");
            assert.deepEqual(links.map((link) => destinationOf(link.href)).sort(), [...destinations].sort());
            for (const link of await page.locator(selectors.links).all()) await expect(link).toBeVisible();
            assert.ok(destinations.includes(destinationOf(await page.locator(selectors.current).getAttribute("href"))));
        });

        await check("hover can reopen after automatic pointer exit", async () => {
            await home(page);
            await openMenu(page);
            await page.mouse.move(0, 0);
            await expect(page.locator(selectors.menu)).toHaveAttribute("data-state", "closed");
            await page.locator(selectors.toggle).hover();
            await expect(page.locator(selectors.menu), "Returning the pointer after automatic close must reopen the menu").toHaveAttribute("data-state", "open", { timeout: 1800 });
            await expect(page.locator(selectors.toggle)).toHaveAttribute("aria-expanded", "true");
        });

        await check("hover can reopen after leaving the closed control before its delay", async () => {
            await home(page);
            const toggle = page.locator(selectors.toggle);
            const box = await toggle.boundingBox();
            assert.ok(box, "The resting toggle must have a visible hit area");
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.move(0, 0);
            // Pause beyond the opening and exit grace periods after this brief pass.
            await page.waitForTimeout(400);
            await expect(page.locator(selectors.menu)).toHaveAttribute("data-state", "closed");
            await toggle.hover();
            await expect(page.locator(selectors.menu), "A cancelled short hover must not block the next deliberate hover").toHaveAttribute("data-state", "open", { timeout: 1800 });
            await expect(toggle).toHaveAttribute("aria-expanded", "true");
        });

        await check("Escape closes the wheel and restores the toggle focus", async () => {
            await home(page);
            await openMenu(page, "keyboard");
            await page.locator(selectors.current).focus();
            await page.keyboard.press("Escape");
            await expect(page.locator(selectors.menu)).toHaveAttribute("data-state", "closed");
            await expect(page.locator(selectors.toggle)).toHaveAttribute("aria-expanded", "false");
            await expect(page.locator(selectors.toggle)).toHaveAccessibleName("퀵메뉴 열기");
            await expect(page.locator(selectors.toggle)).toBeFocused();
        });

        await check("arrow keys wrap the selection and Home/End reach the boundary items", async () => {
            await home(page);
            await openMenu(page, "keyboard");
            const hrefs = await page.locator(selectors.links).evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
            const order = hrefs.map(destinationOf);
            await page.locator(selectors.current).focus();
            for (const [key, index] of [["Home", 0], ["ArrowRight", 1], ["ArrowDown", 2], ["ArrowLeft", 1], ["ArrowUp", 0], ["ArrowLeft", 5], ["End", 5], ["ArrowRight", 0], ["End", 5], ["Home", 0]]) {
                await page.keyboard.press(key);
                await expect.poll(async () => destinationOf(await page.locator(selectors.current).getAttribute("href")), { message: `${key} must select ${order[index]}` }).toBe(order[index]);
            }
            return { itemOrder: order };
        });

        await check("mouse dragging crosses the angle boundary and snaps without navigation", async () => {
            await home(page);
            await openMenu(page);
            return dragWheel(page);
        });

        for (const { width, height } of [...[320, 390, 768, 1024, 1440].map((width) => ({ width, height: 1000 })), { width: 844, height: 390 }]) {
            await check(`all six targets and the center remain separate and onscreen at ${width}x${height}px`, async () => {
                await page.setViewportSize({ width, height });
                await home(page);
                await openMenu(page, "keyboard");
                const layout = await geometry(page);
                assertGeometry(layout);
                await screenshot(page, `open-${width}x${height}.png`);
                return layout;
            });
        }

        await check("the center booking action scrolls and focuses the booking heading", async () => {
            await page.setViewportSize({ width: 1440, height: 1000 });
            await home(page);
            await openMenu(page, "keyboard");
            await page.locator(selectors.current).focus();
            await page.keyboard.press("Home");
            const hrefs = await page.locator(selectors.links).evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
            const bookingIndex = hrefs.map(destinationOf).indexOf("#quick-booking");
            for (let index = 0; index < bookingIndex; index++) await page.keyboard.press("ArrowRight");
            await expect.poll(async () => destinationOf(await page.locator(selectors.current).getAttribute("href"))).toBe("#quick-booking");
            await page.locator(selectors.current).click();
            await bookingArrived(page);
            await page.mouse.move(0, 0);
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
            await expect.poll(() => visuallyPresent(page), { message: "The control must return when the hero is visible again" }).toBe(true);
            await expect(page.locator(selectors.menu)).toHaveAttribute("data-state", "closed");
        });

        const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "ko-KR" });
        const touchPage = await mobile.newPage();
        observeErrors(touchPage, "touch");
        await check("a coarse-pointer tap opens and closes the menu", async () => {
            await home(touchPage);
            assert.ok(await touchPage.evaluate(() => matchMedia("(hover: none) and (pointer: coarse)").matches));
            await openMenu(touchPage, "touch");
            await touchPage.locator(selectors.toggle).tap();
            await expect(touchPage.locator(selectors.menu)).toHaveAttribute("data-state", "closed");
            await expect(touchPage.locator(selectors.toggle)).toHaveAttribute("aria-expanded", "false");
        });

        await check("actual touch dragging rotates and snaps without activating the touched link", async () => {
            await home(touchPage);
            await openMenu(touchPage, "touch");
            const result = await dragWheel(touchPage, true);
            await screenshot(touchPage, "touch-drag-390.png");
            return result;
        });

        for (const destination of destinations) {
            await check(`a native outer-link tap reaches ${destination}`, async () => {
                await home(touchPage);
                await openMenu(touchPage, "touch");
                const hrefs = await touchPage.locator(selectors.links).evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
                const link = touchPage.locator(selectors.links).nth(hrefs.map(destinationOf).indexOf(destination));
                if (destination === "#quick-booking") {
                    await link.tap();
                    await bookingArrived(touchPage);
                } else {
                    await Promise.all([
                        touchPage.waitForURL((url) => destinationOf(url.href) === destination, { timeout: 20000 }),
                        link.tap(),
                    ]);
                }
                return { destination, arrived: touchPage.url() };
            });
        }

        const reduced = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", locale: "ko-KR" });
        const reducedPage = await reduced.newPage();
        observeErrors(reducedPage, "reduced-motion");
        await check("reduced motion leaves no active animated menu layer", async () => {
            await home(reducedPage);
            await openMenu(reducedPage, "keyboard");
            await expect.poll(() => reducedPage.locator(selectors.menu).evaluate((element) => element.getAnimations({ subtree: true })
                .filter((animation) => animation.playState === "running" || animation.pending)
                .map((animation) => ({ name: animation.animationName || "web-animation", state: animation.playState }))),
            { message: "Reduced motion must stop decorative menu animations", timeout: 3000 }).toEqual([]);
            await reducedPage.locator(selectors.current).focus();
            await reducedPage.keyboard.press("ArrowRight");
            await settledRotation(reducedPage);
            await expect(reducedPage.locator(selectors.current)).toBeVisible();
            await screenshot(reducedPage, "reduced-motion-1440.png");
        });

        await check("the home and menu produce no browser errors", async () => {
            assert.deepEqual(report.menuErrors, []);
            assert.deepEqual(report.unrelatedErrors, []);
            return { pageAndConsoleErrors: 0 };
        });
    } finally {
        await browser.close();
        report.finishedAt = new Date().toISOString();
        report.status = report.checks.some((result) => result.status === "failed") ? "failed" : "passed";
        save();
        process.exitCode = report.status === "passed" ? 0 : 1;
        console.log(JSON.stringify({ status: report.status, filter: report.filter, checks: report.checks.length, failed: report.checks.filter((result) => result.status === "failed").map((result) => result.name), unrelatedErrors: report.unrelatedErrors.length, artifacts: directory }));
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
