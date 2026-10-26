const { chromium, expect } = require("playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:3000/v5/";
const galleryUrl = new URL("design-rules/#violet-quick-menu", base).href;
const directory = path.resolve(process.env.SEJONG_VIOLET_REPORT_DIR || path.join(__dirname, "../.lemonade/violet-quick-menu"));
const report = { target: base, gallery: galleryUrl, startedAt: new Date().toISOString(), checks: [], menuErrors: [], unrelatedErrors: [], screenshots: [] };
const inlineSelector = '[data-violet-menu][data-placement="inline"]';
const heroSelector = '[data-violet-menu][data-placement="hero"]';
const selectors = { toggle: "[data-violet-toggle]", wheel: "[data-violet-wheel]", links: "[data-violet-link]", current: "[data-violet-current]" };
fs.mkdirSync(directory, { recursive: true });
const save = () => fs.writeFileSync(path.join(directory, "gallery-results.json"), JSON.stringify(report, null, 2));

async function check(name, run) {
    const result = { name, status: "running" };
    report.checks.push(result);
    try {
        result.details = await run();
        result.status = "passed";
        console.log(`PASS ${name}`);
        return true;
    } catch (error) {
        result.status = "failed";
        result.error = error.stack || String(error);
        console.error(`FAIL ${name}: ${error.message}`);
        return false;
    } finally {
        save();
    }
}

function observeErrors(page) {
    const record = (kind, message) => {
        const group = /VioletQuickMenu|violet-quick-menu|violetQuickMenu|data-violet/i.test(message)
            ? report.menuErrors : report.unrelatedErrors;
        if (!group.some((item) => item.kind === kind && item.message === message)) group.push({ kind, message, url: page.url() });
    };
    page.on("pageerror", (error) => record("page", error.stack || error.message));
    page.on("console", (message) => {
        if (message.type() === "error") record("console", `${message.text()} ${message.location().url || ""}`.trim());
    });
    page.on("dialog", (dialog) => dialog.dismiss());
    page.setDefaultTimeout(6000);
    page.setDefaultNavigationTimeout(30000);
}

async function gallery(page, width = 1024) {
    await page.setViewportSize({ width, height: 1000 });
    await page.mouse.move(0, 0);
    let response = await page.goto(galleryUrl, { waitUntil: "domcontentloaded" });
    // Reusing the same hash URL can be a same-document navigation; reset the menu for each case.
    if (!response) response = await page.reload({ waitUntil: "domcontentloaded" });
    assert.ok(response && response.ok(), `The gallery must load (HTTP ${response?.status()})`);
    await page.waitForLoadState("load");
    await page.evaluate(() => document.fonts.ready);
    const root = page.locator(inlineSelector);
    await expect(root).toHaveCount(1);
    await expect(root).toBeVisible();
    // Fragment restoration may follow hydration; establish the actual in-view test position.
    await expect(async () => {
        await root.scrollIntoViewIfNeeded();
        await expect(root).toBeInViewport({ timeout: 500 });
        await expect(root).toHaveAttribute("data-sleeping", "false", { timeout: 500 });
    }).toPass({ timeout: 6000 });
    return root;
}

async function home(page) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.mouse.move(0, 0);
    const response = await page.goto(base, { waitUntil: "domcontentloaded" });
    assert.ok(response && response.ok(), `The home page must load (HTTP ${response?.status()})`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.evaluate(() => document.fonts.ready);
    const root = page.locator(heroSelector);
    await expect(root).toBeVisible();
    return root;
}

async function wheelIsStable(root) {
    let previous;
    let stableSamples = 0;
    await expect.poll(async () => {
        const box = await root.locator(selectors.wheel).boundingBox();
        assert.ok(box, "The open wheel must have a visible box");
        const stable = previous && ["x", "y", "width", "height"].every((key) => Math.abs(previous[key] - box[key]) < 0.5);
        stableSamples = stable ? stableSamples + 1 : 0;
        previous = box;
        return stableSamples >= 2;
    }, { message: "The wheel must finish its opening transition", timeout: 6000, intervals: [40, 70, 100] }).toBe(true);
}

async function openMenu(page, root) {
    const toggle = root.locator(selectors.toggle);
    await expect(toggle).toBeVisible();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(root.getByRole("navigation", { name: "원형 퀵메뉴", exact: true })).toBeVisible();
    await expect(root.locator(selectors.links)).toHaveCount(6);
    await wheelIsStable(root);
}

async function screenshot(page, filename) {
    assert.ok(filename.startsWith("gallery-"), "Supplemental screenshots must not overwrite the hero suite's files");
    await page.screenshot({ path: path.join(directory, filename), animations: "disabled" });
    report.screenshots.push(filename);
}

async function geometry(root) {
    return root.evaluate((element, selectors) => {
        const rect = (node) => {
            const box = node.getBoundingClientRect();
            return { x: box.left, y: box.top, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
        };
        return {
            viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
            preview: rect(element.parentElement),
            root: rect(element),
            wheel: rect(element.querySelector(selectors.wheel)),
            center: rect(element.querySelector(selectors.current)),
            links: [...element.querySelectorAll(selectors.links)].map((link) => ({ label: link.textContent.trim(), href: link.getAttribute("href"), ...rect(link) })),
        };
    }, selectors);
}

function assertGeometry(layout) {
    const epsilon = 2;
    const inside = (box, frame) => box.x >= frame.x - epsilon && box.y >= frame.y - epsilon && box.right <= frame.right + epsilon && box.bottom <= frame.bottom + epsilon;
    const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1;
    const { viewport, preview, root, wheel, center, links } = layout;
    assert.ok(viewport.scrollWidth <= viewport.width + 1, `No horizontal page overflow: ${JSON.stringify(viewport)}`);
    assert.ok(preview.x >= -epsilon && preview.right <= viewport.width + epsilon, `The preview must fit the page width: ${JSON.stringify(preview)}`);
    assert.ok(inside(root, preview), "The inline component must remain inside its preview");
    assert.ok(wheel.width > 0 && wheel.height > 0 && inside(wheel, root), `The wheel must fit its actual container: ${JSON.stringify({ root, wheel })}`);
    assert.ok(inside(center, wheel), "The selected action must fit inside the wheel");
    for (const [index, link] of links.entries()) {
        assert.ok(link.width >= 44 && link.height >= 44, `Each shortcut needs a usable pointer target: ${JSON.stringify(link)}`);
        assert.ok(inside(link, wheel), `A shortcut must not be clipped by the container: ${JSON.stringify(link)}`);
        assert.ok(!overlaps(link, center), `A shortcut must not overlap the selected action: ${link.label}`);
        for (const other of links.slice(index + 1)) assert.ok(!overlaps(link, other), `Shortcut targets overlap: ${link.label} / ${other.label}`);
    }
}

async function rotation(root) {
    const value = Number(await root.locator(selectors.wheel).getAttribute("data-rotation"));
    assert.ok(Number.isFinite(value), "The wheel must expose a finite angle");
    return value;
}

async function beginDrag(page, root) {
    await wheelIsStable(root);
    const before = await rotation(root);
    const box = await root.locator(selectors.wheel).boundingBox();
    assert.ok(box, "The wheel needs a physical pointer target");
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const radius = box.width * 0.43;
    const point = (degrees) => ({ x: center.x + Math.cos(degrees * Math.PI / 180) * radius, y: center.y + Math.sin(degrees * Math.PI / 180) * radius });
    const start = point(150);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (const degrees of [162, 174, 186, 198]) {
        const next = point(degrees);
        await page.mouse.move(next.x, next.y);
    }
    await expect(root.locator(selectors.wheel)).toHaveAttribute("data-dragging", "true");
    const moved = await rotation(root);
    assert.ok(Math.abs(moved - before) > 20, "The pointer must actually rotate the wheel before its gesture is interrupted");
    return { point, rotation: moved };
}

async function interruptedDrag(page, kind) {
    const root = await home(page);
    await openMenu(page, root);
    const originalUrl = page.url();
    let pointerDown = false;
    try {
        pointerDown = true;
        const drag = await beginDrag(page, root);
        if (kind === "resize") await page.setViewportSize({ width: 1200, height: 900 });
        else await page.evaluate(() => window.dispatchEvent(new Event("blur")));
        await expect(root.locator(selectors.wheel)).toHaveAttribute("data-dragging", "false");
        const stopped = await rotation(root);
        const next = drag.point(228);
        await page.mouse.move(next.x, next.y);
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        assert.equal(await rotation(root), stopped, "Pointer movement after interruption must not continue the cancelled drag");
        await page.mouse.up();
        pointerDown = false;
        assert.equal(page.url(), originalUrl, "Interrupting and releasing a drag must not navigate");
        pointerDown = true;
        await beginDrag(page, root);
        await page.mouse.up();
        pointerDown = false;
        await expect(root.locator(selectors.wheel)).toHaveAttribute("data-dragging", "false");
        assert.equal(page.url(), originalUrl, "The wheel must accept a fresh drag without an accidental click");
        return { interruption: kind === "resize" ? "actual viewport resize" : "dispatched window blur event", before: drag.rotation, stopped, afterFreshDrag: await rotation(root) };
    } finally {
        if (pointerDown) await page.mouse.up();
    }
}

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
        const context = await browser.newContext({ viewport: { width: 1024, height: 1000 }, locale: "ko-KR" });
        const page = await context.newPage();
        observeErrors(page);

        const mounted = await check("the design guide exposes one inline menu with six native destinations", async () => {
            const root = await gallery(page);
            await expect(page.locator(heroSelector)).toHaveCount(0);
            await expect(root.locator(selectors.toggle)).toHaveAttribute("aria-expanded", "false");
            await screenshot(page, "gallery-closed-1024.png");
            await openMenu(page, root);
            const links = await root.locator(selectors.links).evaluateAll((elements) => elements.map((element) => ({ tag: element.tagName, href: element.getAttribute("href"), label: element.textContent.trim() })));
            assert.equal(links.length, 6);
            assert.ok(links.every((link) => link.tag === "A" && link.href), "Every shortcut must remain a native link");
            assert.equal(new Set(links.map((link) => link.href)).size, 6, "The six shortcuts must retain distinct destinations");
            assert.equal(links[0].href, "/v5/#quick-booking", "The gallery's booking shortcut must target the real homepage section");
            return { links };
        });
        if (!mounted) return;

        for (const width of [320, 390, 768, 1024]) {
            await check(`the inline wheel and all six targets fit their container at ${width}px`, async () => {
                const root = await gallery(page, width);
                await openMenu(page, root);
                const layout = await geometry(root);
                assertGeometry(layout);
                await screenshot(page, `gallery-open-${width}.png`);
                return layout;
            });
        }

        await check("keyboard selection, Tab and Escape work inside the inline menu", async () => {
            const root = await gallery(page, 390);
            await openMenu(page, root);
            const links = root.locator(selectors.links);
            await expect(links.first()).toBeFocused();
            for (const [key, index] of [["End", 5], ["ArrowRight", 0], ["ArrowLeft", 5], ["Home", 0], ["Tab", 1]]) {
                await page.keyboard.press(key);
                await expect(links.nth(index)).toBeFocused();
                await expect(root.locator(selectors.current)).toHaveAttribute("href", await links.nth(index).getAttribute("href"));
            }
            await page.keyboard.press("Escape");
            await expect(root.locator(selectors.toggle)).toHaveAttribute("aria-expanded", "false");
            await expect(root.locator(selectors.toggle)).toBeFocused();
            await expect(root.locator("nav")).not.toBeVisible();
            await page.keyboard.press("Space");
            await expect(root.locator(selectors.toggle)).toHaveAttribute("aria-expanded", "true");
            await expect(links.nth(1)).toBeFocused();
            return { retainedDestination: await links.nth(1).getAttribute("href") };
        });

        await check("the gallery booking link navigates to the real homepage booking section", async () => {
            const root = await gallery(page, 390);
            await openMenu(page, root);
            await Promise.all([
                page.waitForURL((url) => url.pathname === new URL(base).pathname && url.hash === "#quick-booking"),
                root.locator(selectors.links).first().click(),
            ]);
            await expect(page.locator("#featured-season")).toHaveCount(1);
            await expect(page.locator(inlineSelector)).toHaveCount(0);
            await expect.poll(() => page.locator("#quick-booking-heading").evaluate((element) => {
                const box = element.getBoundingClientRect();
                return box.top >= 0 && box.bottom <= innerHeight;
            }), { message: "Native cross-page anchor navigation must scroll the booking heading into view", timeout: 10000 }).toBe(true);
            await screenshot(page, "gallery-booking-destination.png");
            return { arrived: page.url(), heading: await page.locator("#quick-booking-heading").textContent() };
        });

        await check("scrolling away closes and pauses the inline menu without collapsing its layout", async () => {
            const root = await gallery(page, 390);
            await openMenu(page, root);
            const height = (await root.boundingBox()).height;
            await page.mouse.move(0, 0);
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
            await expect(root.locator(selectors.toggle)).toHaveAttribute("aria-expanded", "false");
            await expect(root).toHaveAttribute("data-sleeping", "true");
            const offscreen = await root.evaluate((element) => ({ hidden: element.hidden, height: element.getBoundingClientRect().height, top: element.getBoundingClientRect().top, viewport: innerHeight }));
            assert.equal(offscreen.hidden, false, "An offscreen inline instance must stay rendered so it can be observed again");
            assert.ok(Math.abs(offscreen.height - height) < 1, "The gallery must retain its space when the menu leaves view");
            assert.ok(offscreen.top >= offscreen.viewport, "This check must actually scroll the gallery out of view");
            await expect.poll(() => root.evaluate((element) => element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running" || animation.pending).length),
                { message: "Offscreen menu decoration must stop animating", timeout: 6000 }).toBe(0);
            await root.scrollIntoViewIfNeeded();
            await expect(root).toHaveAttribute("data-sleeping", "false");
            await openMenu(page, root);
            await expect(root.locator(selectors.links).first()).toBeVisible();
            await screenshot(page, "gallery-returned-390.png");
            return { retainedHeight: height, offscreen, reopened: true };
        });

        await check("a window blur during a real pointer drag releases the hero wheel", () => interruptedDrag(page, "blur"));
        await check("a viewport resize during a real pointer drag releases the hero wheel", () => interruptedDrag(page, "resize"));
        await check("the gallery and interrupted gestures complete without any browser errors", async () => {
            assert.deepEqual(report.menuErrors, []);
            assert.deepEqual(report.unrelatedErrors, []);
            return { menuErrors: report.menuErrors.length, otherErrors: report.unrelatedErrors.length };
        });
    } catch (error) {
        report.checks.push({ name: "gallery suite setup and execution", status: "failed", error: error.stack || String(error) });
        console.error(error);
    } finally {
        if (browser) await browser.close();
        report.finishedAt = new Date().toISOString();
        report.status = report.checks.some((result) => result.status === "failed") ? "failed" : "passed";
        save();
        process.exitCode = report.status === "passed" ? 0 : 1;
        console.log(JSON.stringify({ status: report.status, checks: report.checks.length, failed: report.checks.filter((result) => result.status === "failed").map((result) => result.name), unrelatedErrors: report.unrelatedErrors.length, artifacts: directory }));
    }
})();
