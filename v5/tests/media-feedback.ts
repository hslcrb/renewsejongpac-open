import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import type { Page } from "playwright";

// [실제 이미지·채워지는 하트·하단 알림 / Real imagery, filled hearts and bottom notifications]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const browser = process.env.SEJONG_TEST_CDP ? await chromium.connectOverCDP(process.env.SEJONG_TEST_CDP) : await chromium.launch();
const context = process.env.SEJONG_TEST_CDP ? browser.contexts()[0] : await browser.newContext();
const page = await context.newPage();
const directory = path.resolve(".lemonade/media-feedback");
fs.mkdirSync(directory, { recursive: true });
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
page.setDefaultTimeout(10000);
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) {
        results.push({ name, passed: false, error: String(error) }); console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
async function loadedImages(tab: Page) {
    await tab.locator("img").evaluateAll(images => images.forEach(image => image.loading = "eager"));
    await tab.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    const sources = await tab.locator('img[src*="/assets/images/"]').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
    assert.ok(sources.length > 0);
    for (const source of sources) assert.doesNotMatch(source, /concept|poster-.*\.svg|venue-.*\.svg|visit-guide-|hero-dance|assets\/images\/assets/);
}
const firstCard = () => page.locator(".program-card").first();
const heart = () => firstCard().locator(".favorite-button");
try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.bringToFront();
    await page.evaluate(() => localStorage.removeItem("sejong-v4:favorites"));
    await page.reload({ waitUntil: "networkidle" });
    await check("all visible home imagery loads from official local media on desktop and phone", async () => {
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            await loadedImages(page);
            await page.screenshot({ path: path.join(directory, `home-${width}.png`) });
        }
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await check("the home card uses the shared filled heart and visible notification", async () => {
        await firstCard().hover(); await heart().click();
        assert.equal(await heart().getAttribute("aria-pressed"), "true");
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector("#toast")!).opacity) > 0.99);
        assert.match(await page.locator('#toast[role="status"]').innerText(), /관심 프로그램에 저장/);
        await page.screenshot({ path: path.join(directory, "notification-home.png") });
        await heart().click(); assert.equal(await heart().getAttribute("aria-pressed"), "false");
    });
    await page.goto(new URL("programs/", base).href, { waitUntil: "networkidle" });
    await check("every program card uses a loaded official image with no generated poster fallback", async () => {
        await loadedImages(page);
        assert.ok(await page.locator('.program-card img[src*="/official/"]').count() >= 10);
    });
    await check("clicking the heart fills its real icon, persists the choice and keeps the card on the same page", async () => {
        await firstCard().hover();
        assert.equal(await heart().getAttribute("aria-pressed"), "false");
        assert.ok((await heart().locator("use").getAttribute("href"))!.endsWith("#favorite"));
        await heart().screenshot({ path: path.join(directory, "heart-empty.png") });
        const url = page.url();
        await heart().click();
        assert.equal(await heart().getAttribute("aria-pressed"), "true");
        assert.ok((await heart().locator("use").getAttribute("href"))!.endsWith("#favorite-fill"));
        assert.equal(await heart().locator("use").count(), 1);
        assert.equal(page.url(), url);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("sejong-v4:favorites")!).length), 1);
        await heart().screenshot({ path: path.join(directory, "heart-filled.png") });
        await page.getByRole("button", { name: "전체 메뉴 열기" }).focus();
        await page.mouse.move(2, 2);
        assert.equal(await heart().evaluate(el => getComputedStyle(el).opacity), "1");
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForFunction(() => document.querySelector('.favorite-button')?.getAttribute("aria-pressed") === "true");
    });
    await check("favorite changes are synchronized between two open pages", async () => {
        const other = await context.newPage();
        try {
            await other.goto(new URL("programs/", base).href, { waitUntil: "networkidle" });
            await other.waitForFunction(() => document.querySelector('.favorite-button')?.getAttribute("aria-pressed") === "true");
            await page.bringToFront(); await firstCard().hover(); await heart().click();
            await other.waitForFunction(() => document.querySelector('.favorite-button')?.getAttribute("aria-pressed") === "false");
            assert.ok((await heart().locator("use").getAttribute("href"))!.endsWith("#favorite"));
        } finally { await other.close(); }
        await page.bringToFront();
    });
    await check("the notification is a readable rounded bottom capsule that renews and fades without stealing focus", async () => {
        await heart().focus(); await heart().click();
        const notification = page.locator('#toast[data-component="알림소형모달"]');
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector("#toast")!).opacity) > 0.99);
        assert.match(await notification.innerText(), /관심 프로그램에 저장/);
        const style = await notification.evaluate(el => {
            const css = getComputedStyle(el), box = el.getBoundingClientRect();
            return { radius: parseFloat(css.borderRadius), font: parseFloat(css.fontSize), pointer: css.pointerEvents, inside: box.x >= 0 && box.right <= innerWidth && box.bottom <= innerHeight };
        });
        assert.ok(style.radius >= 999 && style.font >= 16 && style.inside); assert.equal(style.pointer, "none");
        assert.equal(await heart().evaluate(el => document.activeElement === el), true);
        await page.screenshot({ path: path.join(directory, "notification-desktop.png") });
        await page.waitForTimeout(900);
        await page.evaluate(() => window.dispatchEvent(new CustomEvent("sejong-toast", { detail: "연속 알림도 같은 캡슐에서 갱신됩니다." })));
        await page.waitForTimeout(2800);
        assert.equal(await notification.getAttribute("aria-hidden"), null);
        await page.waitForFunction(() => document.querySelector("#toast")?.getAttribute("aria-hidden") === "true");
        assert.ok((await notification.textContent())!.includes("연속 알림"));
        await page.waitForFunction(() => getComputedStyle(document.querySelector("#toast")!).opacity === "0");
    });
    await check("the registered component has its requested name, public props and working live demo", async () => {
        await page.goto(new URL("design-rules/#components/small-notification", base).href, { waitUntil: "networkidle" });
        await page.getByRole("heading", { name: "알림소형모달", exact: true }).waitFor();
        await page.getByRole("region", { name: "알림소형모달 컴포넌트 속성" }).waitFor();
        await page.getByRole("button", { name: "알림소형모달 보기", exact: true }).click();
        await page.waitForFunction(() => document.querySelector("#toast")?.classList.contains("visible"));
        assert.match(await page.locator("#toast").innerText(), /저장/);
        assert.ok((await page.locator(".ds-code-block").allTextContents()).some(code => code.includes("SmallNotificationModal")));
        await page.setViewportSize({ width: 320, height: 844 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.evaluate(() => window.dispatchEvent(new CustomEvent("sejong-toast", { detail: "관심 프로그램에 저장했어요." })));
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector("#toast")!).opacity) > 0.99);
        const box = (await page.locator("#toast").boundingBox())!;
        assert.ok(box.x >= 15 && box.x + box.width <= 305);
        assert.equal(await page.locator("#toast").evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42), 0);
        await page.screenshot({ path: path.join(directory, "notification-mobile.png") });
        await page.emulateMedia({ reducedMotion: "no-preference" });
    });
    await check("favorites still fill and report their temporary state when browser storage is unavailable", async () => {
        const isolated = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
        try {
            const tab = await isolated.newPage(); tab.on("pageerror", error => errors.push(error.message));
            await tab.addInitScript(() => {
                const set = Storage.prototype.setItem;
                Storage.prototype.setItem = function(key, value) {
                    if (key === "sejong-v4:favorites") throw new DOMException("Unavailable", "SecurityError");
                    set.call(this, key, value);
                };
            });
            await tab.goto(new URL("programs/", base).href, { waitUntil: "networkidle" });
            const button = tab.locator(".favorite-button").first(); await button.tap();
            assert.equal(await button.getAttribute("aria-pressed"), "true");
            assert.match(await tab.locator("#toast").innerText(), /이 창에서만 유지/);
            await button.tap(); assert.equal(await button.getAttribute("aria-pressed"), "false");
        } finally { await isolated.close(); }
        await page.bringToFront();
    });
    await check("account favorites display the same official image without a duplicated asset path", async () => {
        await page.evaluate(() => {
            localStorage.setItem("sejong-v4:favorites", '["dance"]');
            localStorage.setItem("sejong-v4:session", '{"active":true}');
        });
        await page.goto(new URL("account/", base).href, { waitUntil: "networkidle" });
        await page.getByRole("tab", { name: "관심 프로그램 (1)", exact: true }).click();
        await loadedImages(page);
        assert.ok((await page.locator(".account-list img").first().getAttribute("src"))!.includes("/official/ilmu-poster.jpg"));
    });
    await check("no browser runtime errors", async () => assert.deepEqual(errors, []));
} finally {
    fs.writeFileSync(path.join(directory, "report.json"), JSON.stringify({ base, verifiedAt: new Date().toISOString(), results, errors }, null, 2));
    await browser.close();
}
if (results.some(result => !result.passed)) process.exitCode = 1;
