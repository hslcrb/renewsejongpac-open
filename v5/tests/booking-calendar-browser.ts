import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, expect } from "playwright/test";

// [실제 달력과 가이드의 포인터·키보드·터치 계약 / Real calendar pointer, keyboard and touch contracts]
const base = (process.argv[2] || "http://127.0.0.1:4173/v5/").replace(/\/?$/, "/");
const directory = path.resolve(".lemonade/calendar-preview");
fs.mkdirSync(directory, { recursive: true });
const fixture = JSON.parse(fs.readFileSync("src/generated/catalog-snapshot.json", "utf8"));
const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date());
const date = `${month}-14`;
const ids = ["dance", "winter", "carmen", "sumire"];
for (const program of fixture.programs) {
    program.start = ids.includes(program.id) ? date : "2001-01-01";
    program.end = program.start;
}
const expected = fixture.programs.filter(program => ids.includes(program.id));
assert.equal(expected.length, 4);
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", timezoneId: "Asia/Seoul" });
await context.route("**/rest/v1/rpc/sejong_catalog_snapshot", route => route.fulfill({ json: fixture }));
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
const results: { name: string; passed: boolean; error?: string }[] = [];
const day = () => page.locator(`#home-booking-date-${date}`);
const preview = () => page.locator('[data-component-part="booking-date-preview"]');
async function go(route = "") {
    await page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".quick-calendar").scrollIntoViewIfNeeded();
}
async function close() {
    await page.keyboard.press("Escape");
    await page.mouse.move(5, 100);
    await expect(preview()).toHaveCount(0);
}
async function withinViewport() {
    await expect.poll(async () => {
        const box = await preview().boundingBox();
        const viewport = page.viewportSize()!;
        return Boolean(box && box.x >= 11 && box.y >= 11 && box.x + box.width <= viewport.width - 11 && box.y + box.height <= viewport.height - 11);
    }).toBe(true);
}
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
        console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
try {
    await go();
    await check("hover shows date, count, posters and titles without committing the date", async () => {
        const selection = await page.locator('.quick-date[aria-pressed="true"]').getAttribute("id");
        await day().hover();
        await expect(preview()).toBeVisible();
        await expect(preview()).toContainText("4개 프로그램");
        for (const program of expected.slice(0, 3)) {
            const title = preview().locator("strong").filter({ hasText: program.title });
            await expect(title).toBeVisible();
            assert.equal(await title.innerText(), program.title);
        }
        await expect(preview().locator("img")).toHaveCount(3);
        await expect(preview().locator("img").first()).toBeVisible();
        await expect(preview()).toContainText("외 1개");
        await expect(day()).toHaveAttribute("aria-describedby", await preview().getAttribute("id"));
        assert.equal(await page.locator('.quick-date[aria-pressed="true"]').getAttribute("id"), selection);
        await withinViewport();
    });
    await check("preview follows the cursor and remains open when entered", async () => {
        const box = (await day().boundingBox())!;
        await page.mouse.move(box.x + 10, box.y + 12);
        await expect.poll(async () => (await preview().boundingBox())?.x).toBeCloseTo(box.x + 28, 0);
        await preview().hover();
        await page.waitForTimeout(220);
        await expect(preview()).toBeVisible();
        await page.mouse.move(5, 100);
        await expect(preview()).toHaveCount(0);
    });
    await check("empty dates replace stale content; Escape dismisses without selecting", async () => {
        const empty = page.locator(`#home-booking-date-${month}-13`);
        await empty.hover();
        await expect(preview()).toContainText("등록된 프로그램이 없습니다.");
        await expect(preview().locator("img")).toHaveCount(0);
        await page.keyboard.press("Escape");
        await expect(preview()).toHaveCount(0);
        await expect(empty).not.toHaveAttribute("aria-pressed", "true");
    });
    await check("keyboard focus previews, Enter commits, and Escape restores the unobstructed calendar", async () => {
        await page.mouse.move(5, 100);
        await page.keyboard.press("Tab");
        await day().focus();
        await expect(preview()).toBeVisible();
        await expect(day()).toBeFocused();
        await withinViewport();
        await page.keyboard.press("Escape");
        await expect(preview()).toHaveCount(0);
        await expect(day()).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(day()).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator("#home-booking-day-heading")).toContainText("14일");
        await expect(page.locator(".quick-program-list .quick-program")).toHaveCount(4);
    });
    await check("month navigation and scrolling dismiss a transient preview", async () => {
        await day().hover();
        await page.locator("#home-booking-next-month").click();
        await expect(preview()).toHaveCount(0);
        await page.locator("#home-booking-previous-month").click();
        await expect(day()).toHaveAttribute("aria-pressed", "true");
        await day().hover();
        await page.mouse.wheel(0, 80);
        await expect(preview()).toHaveCount(0);
    });
    for (const width of [768, 1024, 1440]) await check(`${width}px: separated 48px dates, shared radii, readable text and bounded preview`, async () => {
        await page.setViewportSize({ width, height: 1000 });
        await page.locator(".quick-calendar").scrollIntoViewIfNeeded();
        await day().hover();
        await expect(preview()).toBeVisible();
        await withinViewport();
        const metrics = await day().evaluate(element => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            const siblings = [...element.parentElement!.querySelectorAll("button")].map(sibling => sibling.getBoundingClientRect());
            return { width: box.width, height: box.height, radius: style.borderRadius, border: style.borderWidth,
                text: getComputedStyle(element.querySelector("span")!).fontSize,
                overlaps: siblings.some(other => other.x !== box.x && other.y === box.y && other.x < box.right && other.right > box.x) };
        });
        assert.deepEqual(metrics, { width: 48, height: 48, radius: "12px", border: "0px", text: "16px", overlaps: false });
        assert.ok(await preview().locator("[data-text]").evaluateAll(elements => elements.every(element => parseFloat(getComputedStyle(element).fontSize) >= 16)));
        await expect(preview()).toHaveCSS("animation-name", "none");
        await expect(preview()).toHaveCSS("transition-property", "none");
        if (width === 1440) await page.screenshot({ path: path.join(directory, "desktop-preview.png") });
        await close();
    });
    for (const width of [320, 390]) await check(`${width}px: touch-sized native date input changes and clears the selected date`, async () => {
        await page.setViewportSize({ width, height: 844 });
        await page.locator(".quick-calendar").scrollIntoViewIfNeeded();
        const field = page.getByLabel("관람 날짜", { exact: true });
        await expect(field).toBeVisible();
        await expect(day()).toBeHidden();
        await field.fill(date);
        await expect(page.locator("#home-booking-day-heading")).toContainText("14일");
        await expect(page.locator(".quick-program-list .quick-program")).toHaveCount(4);
        await expect(preview()).toHaveCount(0);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (width === 390) await page.screenshot({ path: path.join(directory, "mobile-date-input.png") });
        await field.fill("");
        await expect(page.locator(".quick-program-list .quick-program")).toHaveCount(0);
        await expect(page.locator("#home-booking-action button")).toBeDisabled();
    });
    await check("short viewports retain a scrollable preview and respect normal motion settings", async () => {
        await page.setViewportSize({ width: 1024, height: 500 });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await day().hover();
        await expect(preview()).toBeVisible();
        await withinViewport();
        await expect(preview()).toHaveCSS("animation-name", "calendar-preview-enter");
        await expect(preview()).toHaveCSS("animation-duration", "0.14s");
        await expect(preview().locator(".booking-date-preview-surface")).toHaveCSS("overflow-y", "auto");
        await close();
        await page.emulateMedia({ reducedMotion: "reduce" });
    });
    await check("guide renders the same calendar and owned preview implementation", async () => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await go("design-rules/#components/registry");
        const guideDay = page.locator("#home-booking-date-2026-10-14");
        await guideDay.hover();
        await expect(preview()).toBeVisible();
        await expect(preview()).toHaveAttribute("data-component-owner", "booking-calendar");
        await expect(preview().locator('[data-component-id="surface"]')).toHaveAttribute("data-surface-variant", "elevated");
        await withinViewport();
        await close();
    });
    await check("tablet touch selects directly without relying on hover", async () => {
        const touch = await browser.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
        await touch.route("**/rest/v1/rpc/sejong_catalog_snapshot", route => route.fulfill({ json: fixture }));
        const tab = await touch.newPage();
        await tab.goto(base, { waitUntil: "networkidle" });
        const button = tab.locator(`#home-booking-date-${date}`);
        await button.tap();
        await expect(button).toHaveAttribute("aria-pressed", "true");
        await expect(tab.locator('[role="tooltip"]')).toHaveCount(0);
        await touch.close();
    });
    assert.deepEqual(errors, []);
} finally {
    fs.writeFileSync(path.join(directory, "browser-results.json"), JSON.stringify({ base, results, errors }, null, 2) + "\n");
    await browser.close();
}
assert.ok(results.every(result => result.passed), "Calendar browser checks failed; inspect browser-results.json.");
