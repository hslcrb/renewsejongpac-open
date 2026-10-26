/* 실제 정적 v5 빌드에서 인트로 수명과 접근성을 확인하는 브라우저 계약. */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const host = (process.env.BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(host + "/v5/", { waitUntil: "domcontentloaded" });
    const intro = page.locator("[data-v5-entry-intro]");
    await intro.waitFor({ state: "visible", timeout: 12_000 });
    assert.equal(await intro.getAttribute("role"), "dialog");
    assert.equal(await intro.getAttribute("aria-modal"), "true");
    assert.equal(await intro.locator('img[src="/v5/assets/intro/scenartmv.svg"]').count(), 1);

    const asset = await page.request.get(host + "/v5/assets/intro/scenartmv.svg");
    assert.equal(asset.status(), 200, "정적 자산 미러가 접근 가능해야 한다");
    const assetText = await asset.text();
    assert.match(assetText, /<animate/);

    await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
    await intro.waitFor({ state: "detached" });
    assert.equal(await page.locator("#main").count(), 1);
    assert.equal(await page.locator("#main").evaluate(e => (e as HTMLElement).inert), false);
    assert.notEqual(await page.locator("body").evaluate(e => e.style.overflow), "hidden");

    await page.goto(host + "/v5/programs/", { waitUntil: "domcontentloaded" });
    assert.equal(await intro.count(), 0, "내부 경로 직접 진입에 인트로를 재생하지 않는다");
    await page.close();

    const timerPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await timerPage.goto(host + "/v5/", { waitUntil: "domcontentloaded" });
    await timerPage.locator("[data-v5-entry-intro]").waitFor({ state: "visible" });
    await timerPage.locator("[data-v5-entry-intro]").waitFor({ state: "detached", timeout: 12_000 });
    assert.equal(await timerPage.locator("html").evaluate(e => e.scrollWidth <= window.innerWidth + 1), true);
    await timerPage.close();

    const reduced = await browser.newPage({ reducedMotion: "reduce" });
    await reduced.goto(host + "/v5/", { waitUntil: "domcontentloaded" });
    await reduced.locator("[data-v5-entry-intro]").waitFor({ state: "detached", timeout: 5_000 });
    assert.equal(await reduced.locator("#main").count(), 1);
    await reduced.close();
    console.log("v5 entry intro browser acceptance: passed");
} finally {
    await browser.close();
}
