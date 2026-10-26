import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, expect } from "playwright/test";
import type { Locator } from "playwright/test";

// [인라인 안내의 실제 흰 유리와 접근성 / Real white glass and accessibility of inline notices]
const base = (process.argv[2] || "http://127.0.0.1:4173/v5/").replace(/\/?$/, "/");
const directory = path.resolve(".lemonade/notice-white-glass");
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
let otpRequests = 0;
await context.route(url => url.pathname === "/auth/v1/otp", async route => { otpRequests++; await route.fulfill({ json: {} }); });
await context.route("**/auth/v1/settings", route => route.fulfill({ json: { external: { google: false } } }));
const fixture = JSON.parse(fs.readFileSync("src/generated/catalog-snapshot.json", "utf8"));
await context.route("**/rest/v1/rpc/sejong_catalog_snapshot", route => route.fulfill({ json: fixture }));
const page = await context.newPage();
page.setDefaultTimeout(10000);
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error" && /hydration|uncaught/i.test(message.text())) errors.push(message.text()); });
const notices = () => page.locator('[data-component-example="notice"] [data-component-id="notice"]');
async function glass(notice: Locator) {
    await expect(notice).toHaveAttribute("data-glass-variant", "white");
    await expect(notice.locator("feDisplacementMap")).toHaveAttribute("scale", "70");
    await expect(notice.locator("feImage")).toHaveAttribute("href", /^data:image\/png;base64,/);
    await expect(notice).toHaveCSS("background-color", "rgba(33, 31, 28, 0)");
    await expect(notice).toHaveCSS("color", "rgb(33, 31, 28)");
    await expect(notice.locator(".liquid-glass-optics")).toHaveCSS("pointer-events", "none");
    const material = await notice.evaluate(element => {
        const style = getComputedStyle(element);
        return ["opacity", "refraction", "blur", "thickness"].map(name => style.getPropertyValue(`--glass-${name}`).trim());
    });
    assert.deepEqual(material, ["0.82", "70", "18px", "24px"]);
}
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) {
        results.push({ name, passed: false, error: String(error) }); console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
try {
    await page.goto(new URL("design-rules/#components/registry", base).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await check("all four notice examples compose the registered white lens and forward their real root refs", async () => {
        await expect(notices()).toHaveCount(4);
        for (const notice of await notices().all()) {
            await glass(notice);
            await expect(notice).toHaveAttribute("data-ref-forwarded", "true");
            await expect(notice).toHaveAttribute("role", await notice.getAttribute("data-error") === "true" ? "alert" : "status");
            await expect(notice.locator(".ds-notice-content")).toHaveCSS("filter", "none");
            await expect(notice.locator(".ds-notice-content")).toHaveCSS("color", "rgb(33, 31, 28)");
        }
        await page.locator("#example-notice-variant-default").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(directory, "guide-desktop.png") });
    });
    await check("all five widths preserve readable text, inset edges and responsive notice dimensions", async () => {
        for (const width of [320, 390, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            for (const notice of await notices().all()) {
                assert.ok(await notice.evaluate(element => [...element.querySelectorAll("[data-text]")].every(text => parseFloat(getComputedStyle(text).fontSize) >= 16)));
                const metric = await notice.evaluate(element => ({ border: getComputedStyle(element).borderWidth, shadow: getComputedStyle(element).boxShadow, width: element.getBoundingClientRect().width }));
                assert.equal(metric.border, "0px"); assert.ok(metric.shadow.includes("inset")); assert.ok(metric.width <= width);
            }
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            if (width === 390) { await notices().first().scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(directory, "guide-mobile.png") }); }
        }
    });
    await check("increased contrast replaces optical transparency with the solid white fallback", async () => {
        await page.emulateMedia({ contrast: "more" });
        await expect(notices().first().locator(".liquid-glass-optics")).toHaveCSS("background-color", "rgb(255, 254, 250)");
        await expect(notices().first().locator(".liquid-glass-optics")).toHaveCSS("backdrop-filter", "none");
        await page.emulateMedia({ contrast: "no-preference" });
    });
    await check("white is available in the material demo and still generates a real displacement map", async () => {
        await page.goto(new URL("design-rules/#components/liquid-glass", base).href, { waitUntil: "networkidle" });
        const tool = page.locator('[data-documentation-tool="glass-demo"]');
        await expect(tool).toHaveCount(1);
        await tool.locator("#glass-variant").selectOption("white");
        const demo = tool.locator(".ds-glass-example");
        await expect(demo).toHaveAttribute("data-glass-variant", "white");
        await expect(demo.locator("feDisplacementMap")).toHaveAttribute("scale", "70");
        const stage = tool.locator(".ds-glass-stage");
        await stage.scrollIntoViewIfNeeded();
        await stage.screenshot({ path: path.join(directory, "white-material.png") });
    });
    await check("real recovery error and status notices keep their roles, focusability and form handling", async () => {
        await page.goto(new URL("account/recovery/", base).href, { waitUntil: "networkidle" });
        const submit = page.locator('[data-account-auth="recovery"] button[type="submit"]');
        await submit.click();
        const error = page.locator("#flow-error");
        await expect(error).toHaveAttribute("role", "alert"); await glass(error);
        await error.focus(); await expect(error).toBeFocused();
        await expect(error).toHaveCSS("outline-offset", "-3px");
        await page.locator("#flow-email").fill("notice-glass@example.test");
        await submit.click();
        const status = page.locator('[data-component-id="notice"][role="status"]');
        await expect(status).toContainText("이메일로 로그인 링크를 보냈습니다.");
        await glass(status); await expect(error).toHaveCount(0);
        assert.equal(otpRequests, 1, "the email request is intercepted; no real email is sent");
        await page.screenshot({ path: path.join(directory, "product-recovery.png") });
    });
    await check("the small notification capsule retains its black material and inverse text", async () => {
        await page.evaluate(() => window.dispatchEvent(new CustomEvent("sejong-toast", { detail: "유리 알림을 확인했습니다." })));
        const toast = page.locator('[data-component-id="small-notification"]');
        await expect(toast).toBeVisible();
        await expect(toast).toHaveAttribute("data-glass-variant", "black");
        await expect(toast).toHaveCSS("color", "rgb(255, 254, 250)");
    });
    assert.deepEqual(errors, []);
} finally {
    fs.writeFileSync(path.join(directory, "browser-results.json"), JSON.stringify({ base, results, errors, otpRequests }, null, 2) + "\n");
    await browser.close();
}
assert.ok(results.every(result => result.passed), "White notice glass regression; inspect browser-results.json.");
