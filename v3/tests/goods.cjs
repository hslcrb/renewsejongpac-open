const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

// [굿즈 주문 흐름 검증 / Goods ordering flow verification]
// 상품 선택부터 합계·중복 방지·새로고침·취소와 손상된 저장소까지 검증합니다.
// Exercise selection, totals, duplicate prevention, reload, cancellation, and malformed storage.
(async () => {
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH || "/opt/google/chrome/chrome",
        args: ["--no-sandbox"],
    });
    try {
        const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v3/index.html";
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("dialog", (dialog) => dialog.dismiss());
        const visit = async (route) => {
            await page.goto(base + "#" + route);
            await page.waitForSelector("[data-goods-page]");
        };
        const assertFits = async (label) => {
            await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth, null, { timeout: 3000 }).catch(async () => {
                console.error(label, await page.evaluate(() => [...document.querySelectorAll("body *")].filter((node) => node.getBoundingClientRect().right > innerWidth + 1).map((node) => ({ tag: node.tagName, className: node.className, right: node.getBoundingClientRect().right }))));
            });
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), label + " fits viewport");
        };
        await visit("/news/goods");
        assert.equal(await page.locator(".goods-product").count(), 3);
        await page.locator('.goods-product-link[href="#/news/goods/art-postcards"]').click();
        await page.waitForSelector("[data-goods-add]");
        await page.locator("[data-goods-quantity]").selectOption("2");
        assert.equal(await page.locator("[data-goods-selection-total]").textContent(), "12,000원");
        await page.locator('[data-goods-add] button[type="submit"]').focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator("[data-goods-count]").textContent(), "2");
        await visit("/news/goods/canvas-bag");
        await page.locator('[data-goods-add] button[type="submit"]').click();
        await visit("/news/goods/cart");
        assert.equal(await page.locator("[data-goods-cart-row]").count(), 2);
        assert.equal(await page.locator("[data-goods-total]").first().textContent(), "30,000원");
        await page.locator('[data-goods-quantity="art-postcards"]').selectOption("3");
        assert.equal(await page.locator("[data-goods-total]").first().textContent(), "36,000원");
        assert.equal(await page.locator('[data-goods-line-total="art-postcards"]').textContent(), "18,000원");
        await page.locator('[href="#/news/goods/cart?step=review"]').click();
        await page.waitForSelector("[data-goods-order]");
        assert.equal(await page.locator('[name="email"], [name="address"], [autocomplete="cc-number"]').count(), 0);
        await page.locator("[data-goods-confirm]").click();
        assert.equal(await page.locator("[data-goods-order]").count(), 1, "consent required before confirmation");
        await page.locator('[href="#/news/goods/cart"]').last().click();
        await page.waitForSelector('[data-goods-quantity="art-postcards"]');
        assert.equal(await page.locator('[data-goods-quantity="art-postcards"]').inputValue(), "3");
        await page.locator('[href="#/news/goods/cart?step=review"]').click();
        await page.locator('[name="consent"]').check();
        await page.locator("[data-goods-confirm]").evaluate((button) => { button.click(); button.click(); });
        await page.waitForSelector(".goods-receipt");
        assert.equal(await page.locator("[data-goods-order-id]").count(), 1, "duplicate confirmation creates one order");
        assert.equal(await page.locator(".goods-order-total strong").textContent(), "36,000원");
        assert.equal(await page.locator("[data-goods-count]").textContent(), "0");
        await page.reload();
        await page.waitForSelector("[data-goods-order-id]");
        assert.equal(await page.locator("[data-goods-order-id]").count(), 1, "order survives reload");
        await page.locator(".goods-cancel-confirm summary").click();
        await page.locator("[data-goods-keep]").click();
        await page.waitForFunction(() => !document.querySelector(".goods-cancel-confirm").open);
        assert.equal(await page.locator(".goods-cancel-confirm").evaluate((details) => details.open), false);
        assert.equal(await page.locator(".goods-cancel-confirm summary").evaluate((summary) => summary === document.activeElement), true);
        await page.locator(".goods-cancel-confirm summary").press("Enter");
        await page.locator("[data-goods-cancel]").click();
        assert.equal(await page.locator(".goods-order-status").textContent(), "취소됨");
        await page.reload();
        await page.waitForSelector("[data-goods-order-id]");
        assert.equal(await page.locator(".goods-order-status").textContent(), "취소됨", "cancellation survives reload");
        assert.equal(await page.locator(".goods-receipt").count(), 0, "cancelled order does not regain success receipt after reload");

        await visit("/news/goods/viewing-journal");
        await page.locator("[data-goods-quantity]").selectOption("10");
        await page.locator('[data-goods-add] button[type="submit"]').click();
        await page.locator('[data-goods-add] button[type="submit"]').click();
        assert.match(await page.locator("[data-goods-feedback]").textContent(), /최대 10개/);
        assert.equal(await page.locator("[data-goods-count]").textContent(), "10");
        await visit("/news/goods/cart");
        await page.locator("[data-goods-remove]").click();
        assert.match(await page.locator(".empty-state h2").textContent(), /비어/);
        assert.equal(await page.locator("[data-goods-count]").textContent(), "0");

        const artifactDir = path.resolve("v3/.lemonade/goods");
        await fs.mkdir(artifactDir, { recursive: true });
        for (const width of [320, 390, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            for (const route of ["/news/goods", "/news/goods/canvas-bag", "/news/goods/orders"]) {
                await visit(route);
                await assertFits(route + " " + width);
            }
            await page.screenshot({ path: path.join(artifactDir, `orders-${width}.png`), fullPage: true });
        }
        await page.emulateMedia({ reducedMotion: "reduce" });
        await visit("/news/goods/orders?receipt=" + await page.locator("[data-goods-order-id]").getAttribute("data-goods-order-id"));
        assert.equal(await page.locator(".goods-receipt").count(), 0, "direct cancelled receipt URL has no success banner");
        await page.evaluate(() => {
            localStorage.setItem("sejong-v3:goods-cart", JSON.stringify([null, { id: "canvas-bag", quantity: -1 }, { id: "missing", quantity: 2 }, { id: "art-postcards", quantity: 2 }, { id: "art-postcards", quantity: 8 }]));
            localStorage.setItem("sejong-v3:goods-orders", JSON.stringify([null, {}, { id: '<img src=x onerror="alert(1)">', items: [] }, { id: "goods-test", createdAt: "bad", status: "confirmed", items: [{ id: "canvas-bag", quantity: 1 }] }]));
        });
        await page.reload();
        await page.waitForSelector("[data-goods-page]");
        assert.equal(await page.locator("[data-goods-order-id]").count(), 0);
        await visit("/news/goods/cart");
        assert.equal(await page.locator("[data-goods-cart-row]").count(), 1);
        assert.equal(await page.locator("[data-goods-total]").first().textContent(), "12,000원");
        await assertFits("cart with valid recovered item at 1440");
        await page.setViewportSize({ width: 320, height: 800 });
        await assertFits("cart at 320");
        await page.locator('[href="#/news/goods/cart?step=review"]').click();
        await page.waitForSelector("[data-goods-order]");
        await assertFits("review at 320");
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
        await page.screenshot({ path: path.join(artifactDir, "review-320.png"), fullPage: true });
        await visit("/news/goods/not-a-product");
        assert.match(await page.locator(".empty-state h2").textContent(), /상품 주소/);
        assert.deepEqual(errors, []);

        const blocked = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
        blocked.on("dialog", (dialog) => dialog.dismiss());
        await blocked.addInitScript(() => {
            Storage.prototype.setItem = () => { throw new DOMException("Storage disabled", "QuotaExceededError"); };
        });
        await blocked.goto(base + "#/news/goods/canvas-bag");
        await blocked.locator('[data-goods-add] button[type="submit"]').click();
        assert.match(await blocked.locator("[data-goods-feedback]").textContent(), /저장소를 사용할 수 없어/);
        await blocked.locator('.goods-navigation [href="#/news/goods/cart"]').click();
        await blocked.locator('[href="#/news/goods/cart?step=review"]').click();
        await blocked.locator('[name="consent"]').check();
        await blocked.locator("[data-goods-confirm]").click();
        await blocked.waitForSelector(".goods-receipt");
        assert.match(await blocked.locator(".goods-receipt").textContent(), /열어 둔 동안만/);
        assert.equal(await blocked.locator(".goods-receipt").evaluate((node) => getComputedStyle(node).animationName), "none");

        // [여러 탭의 검토 무결성 / Review integrity across tabs]
        // 검토 이후 상품이 바뀌면 금액을 다시 보여 주고 새 동의 없이는 확정하지 않습니다.
        // Changes after review must be shown and consented to again before confirmation.
        const sharedContext = await browser.newContext({ reducedMotion: "reduce" });
        const reviewTab = await sharedContext.newPage();
        const otherTab = await sharedContext.newPage();
        for (const tab of [reviewTab, otherTab]) tab.on("dialog", (dialog) => dialog.dismiss());
        await reviewTab.goto(base + "#/news/goods/art-postcards");
        await reviewTab.locator('[data-goods-add] button[type="submit"]').click();
        await reviewTab.locator('.goods-navigation [href="#/news/goods/cart"]').click();
        await reviewTab.locator('[href="#/news/goods/cart?step=review"]').click();
        assert.equal(await reviewTab.locator("[data-goods-total]").first().textContent(), "6,000원");
        await otherTab.goto(base + "#/news/goods/canvas-bag");
        await otherTab.locator('[data-goods-add] button[type="submit"]').click();
        await reviewTab.locator('[name="consent"]').check();
        await reviewTab.locator("[data-goods-confirm]").click();
        assert.match(await reviewTab.locator("[data-goods-feedback]").textContent(), /다른 탭에서 장바구니가 변경/);
        assert.equal(await reviewTab.locator("[data-goods-total]").first().textContent(), "24,000원");
        assert.equal(await reviewTab.locator('[name="consent"]').isChecked(), false);
        assert.equal(await reviewTab.evaluate(() => localStorage.getItem("sejong-v3:goods-orders")), null);
        assert.equal(await reviewTab.locator("#goods-cart-heading").evaluate((heading) => heading === document.activeElement), true);
        await reviewTab.locator('[name="consent"]').check();
        await reviewTab.locator("[data-goods-confirm]").click();
        await reviewTab.waitForSelector(".goods-receipt");
        assert.equal(await reviewTab.locator(".goods-order-total strong").textContent(), "24,000원");
        await sharedContext.close();
        console.log("Goods: discovery, detail, keyboard add, quantities, totals, cart editing/removal, review consent, duplicate prevention, reload, cancellation receipt consistency, malformed/disabled storage, two-tab review changes, 5 widths, reduced motion and missing product passed.");
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
