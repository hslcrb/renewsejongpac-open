const { chromium } = require("playwright");
const assert = require("node:assert/strict");

// [거래·계정 상태 모션의 실제 동작 / Actual motion in transaction and account states]
// 값과 포커스가 즉시 맞고 진행 중 모션·완료·중단·감소 설정에서도 같은 상태인지 검증합니다.
// Verify immediate values and focus, active motion, completion, interruption and reduced motion.
(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || "/opt/google/chrome/chrome",
        headless: true,
        args: ["--no-sandbox"],
    });
    try {
        const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8091/v3/index.html";
        const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
        const errors = [];
        page.on("dialog", (dialog) => dialog.dismiss());
        page.on("pageerror", (error) => errors.push(error.message));
        const visit = async (route) => {
            await page.goto(base + "#" + route);
            await page.waitForFunction(() => document.querySelector("#main")?.textContent.trim().length > 0);
        };
        const settle = async (selector) => {
            await page.waitForFunction((value) => [...document.querySelectorAll(value)].every((node) => node.getAnimations().length === 0), selector);
        };

        await visit("/account/profile");
        const errorMotion = await page.evaluate(() => {
            document.querySelector("[data-profile]").requestSubmit();
            const error = document.querySelector("#flow-error");
            return { animations: error.getAnimations().length, message: error.textContent, focus: document.activeElement.name };
        });
        assert.ok(errorMotion.animations > 0, "validation message has actual feedback motion");
        assert.match(errorMotion.message, /입력/);
        assert.equal(errorMotion.focus, "name");
        await settle("#flow-error");
        await page.locator('[name="name"]').fill("관람객");
        await page.locator('[name="email"]').fill("visitor@example.com");
        const profileMotion = await page.evaluate(() => {
            document.querySelector("[data-profile]").requestSubmit();
            const success = document.querySelector(".flow-success");
            return { animations: success.getAnimations().length, focused: success === document.activeElement };
        });
        assert.ok(profileMotion.animations > 0);
        assert.equal(profileMotion.focused, true, "saved profile result receives focus");
        await settle(".flow-success");
        assert.equal(await page.locator('[name="name"]').inputValue(), "관람객");
        await visit("/account/recovery");
        await page.locator('[name="email"]').fill("visitor@example.com");
        const recoveryMotion = await page.evaluate(() => {
            document.querySelector("[data-recovery]").requestSubmit();
            const result = document.querySelector(".flow-info-box");
            return { animations: result.getAnimations().length, focused: result === document.activeElement, text: result.textContent };
        });
        assert.ok(recoveryMotion.animations > 0);
        assert.equal(recoveryMotion.focused, true);
        assert.match(recoveryMotion.text, /저장되어/);

        await visit("/booking/carmen?date=2026-10-17");
        await page.locator("[data-booking-date] button[type=submit]").click();
        await page.waitForSelector("[data-seat]");
        const seatMotion = await page.evaluate(() => {
            const seat = document.querySelector('[data-seat="A1"]');
            seat.click();
            return { total: document.querySelector("[data-booking-total]").textContent, animations: document.querySelector("[data-booking-total]").getAnimations().length, pressed: seat.getAttribute("aria-pressed") };
        });
        assert.equal(seatMotion.total, "80,000원");
        assert.equal(seatMotion.pressed, "true");
        assert.ok(seatMotion.animations > 0);
        await page.locator("[data-booking-next]").click();
        await page.waitForSelector('[name="discount"]');
        const discountMotion = await page.evaluate(() => {
            const discount = document.querySelector('[name="discount"]');
            discount.value = "membership";
            discount.dispatchEvent(new Event("change", { bubbles: true }));
            discount.value = "youth";
            discount.dispatchEvent(new Event("change", { bubbles: true }));
            const total = document.querySelector("[data-review-total]");
            return { total: total.textContent, animations: total.getAnimations().length };
        });
        assert.equal(discountMotion.total, "64,000원");
        assert.equal(discountMotion.animations, 1, "rapid amount updates retarget one animation");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await settle("[data-booking-total], [data-review-total]");
        assert.equal(await page.locator("[data-review-total]").textContent(), "64,000원");
        await page.locator('[name="discount"]').selectOption("general");
        assert.equal(await page.locator("[data-review-total]").evaluate((node) => node.getAnimations().length), 0);
        assert.equal(await page.locator("[data-review-total]").textContent(), "80,000원");
        await page.emulateMedia({ reducedMotion: "no-preference" });

        await visit("/news/goods/canvas-bag");
        const quantityMotion = await page.evaluate(() => {
            const select = document.querySelector("[data-goods-quantity]");
            select.focus();
            select.value = "2";
            select.dispatchEvent(new Event("change", { bubbles: true }));
            const amount = document.querySelector("[data-goods-selection-total]");
            return { text: amount.textContent, animations: amount.getAnimations().length, focused: select === document.activeElement };
        });
        assert.equal(quantityMotion.text, "36,000원");
        assert.ok(quantityMotion.animations > 0);
        assert.equal(quantityMotion.focused, true);
        await page.locator('[data-goods-add] button[type="submit"]').click();
        await page.locator('.goods-navigation [href="#/news/goods/cart"]').click();
        await page.locator('[href="#/news/goods/cart?step=review"]').click();
        await page.waitForSelector("[data-goods-order]");
        const invalidMotion = await page.evaluate(() => {
            document.querySelector("[data-goods-order]").requestSubmit();
            const feedback = document.querySelector("[data-goods-feedback]");
            return { text: feedback.textContent, animations: feedback.getAnimations().length, checked: document.querySelector('[name="consent"]').checked };
        });
        assert.ok(invalidMotion.text.length > 0);
        assert.ok(invalidMotion.animations > 0);
        assert.equal(invalidMotion.checked, false);

        await page.evaluate(() => {
            localStorage.setItem("sejong-v3:goods-cart", JSON.stringify([
                { id: "art-postcards", quantity: 1 }, { id: "canvas-bag", quantity: 1 }, { id: "viewing-journal", quantity: 1 },
            ]));
        });
        await visit("/news/goods/cart");
        await page.locator(".goods-cart-list").scrollIntoViewIfNeeded();
        const removal = await page.evaluate(() => {
            document.querySelector('[data-goods-remove="art-postcards"]').click();
            const last = document.querySelector('[data-goods-cart-row="viewing-journal"]');
            return {
                count: document.querySelectorAll("[data-goods-cart-row]").length,
                focused: document.activeElement.dataset.goodsQuantity,
                animations: last.getAnimations().length,
                frames: last.getAnimations().flatMap((animation) => animation.effect.getKeyframes()).map((frame) => frame.transform),
            };
        });
        assert.equal(removal.count, 2, "cart data commits before list motion completes");
        assert.equal(removal.focused, "canvas-bag");
        assert.ok(removal.animations > 0, "unfocused surviving cart row has layout continuity");
        assert.ok(removal.frames.some((transform) => transform && transform !== "none"));
        await settle("[data-goods-cart-row]");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.locator('[data-goods-remove="canvas-bag"]').focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator('[data-goods-quantity="viewing-journal"]').evaluate((node) => node === document.activeElement), true);
        assert.equal(await page.locator('[data-goods-cart-row="viewing-journal"]').evaluate((node) => node.getAnimations().length), 0);
        await page.locator('[data-goods-remove="viewing-journal"]').click();
        assert.equal(await page.locator(".empty-state h2").evaluate((node) => node === document.activeElement), true);

        await page.evaluate(() => {
            localStorage.setItem("sejong-v3:bookings", JSON.stringify([
                { id: "SJ-MOTION-ONE", programId: "carmen", date: "2026-10-17", time: "19:30", seats: ["A1"], total: 80000, status: "confirmed" },
            ]));
            localStorage.setItem("sejong-v3:applications", JSON.stringify([
                { id: "APP-MOTION-ONE", title: "교육 신청 체험", createdAt: "2026-10-16T00:00:00Z", status: "saved", fields: [] },
            ]));
        });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await visit("/account/bookings");
        const confirmation = await page.evaluate(() => {
            document.querySelector("[data-cancel-booking]").click();
            return { animations: document.querySelector(".booking-cancel-confirm").getAnimations().length, focused: document.activeElement.hasAttribute("data-cancel-dismiss") };
        });
        assert.ok(confirmation.animations > 0);
        assert.equal(confirmation.focused, true);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("[data-cancel-booking]").evaluate((node) => node === document.activeElement), true);
        await page.locator("[data-cancel-booking]").click();
        const cancellation = await page.evaluate(() => {
            document.querySelector("[data-cancel-confirm]").click();
            const state = document.querySelector("[data-booking-state]");
            return { animations: state.getAnimations().length, text: state.textContent, focusTag: document.activeElement.tagName };
        });
        assert.equal(cancellation.text, "취소 완료");
        assert.ok(cancellation.animations > 0);
        assert.equal(cancellation.focusTag, "H3");
        await visit("/account/applications");
        await page.locator(".application-record summary").click();
        const withdrawal = await page.evaluate(() => {
            document.querySelector("[data-withdraw-application]").click();
            const state = document.querySelector("[data-application-state]");
            return { animations: state.getAnimations().length, text: state.textContent, open: document.querySelector(".application-record").open, focusTag: document.activeElement.tagName };
        });
        assert.equal(withdrawal.text, "철회 완료");
        assert.ok(withdrawal.animations > 0);
        assert.equal(withdrawal.open, true);
        assert.equal(withdrawal.focusTag, "SUMMARY");

        await visit("/search?q=공연");
        await page.locator("#search-query").focus();
        const repeatedSearch = await page.evaluate(() => {
            const hash = location.hash;
            document.querySelector("#search-page-form").requestSubmit();
            const result = document.querySelector(".search-count");
            return { animations: result.getAnimations().length, sameHash: hash === location.hash, focused: document.activeElement.id, role: result.getAttribute("role") };
        });
        assert.ok(repeatedSearch.animations > 0);
        assert.equal(repeatedSearch.sameHash, true);
        assert.equal(repeatedSearch.focused, "search-query");
        assert.equal(repeatedSearch.role, "status");
        await settle(".search-count");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.keyboard.press("Enter");
        assert.equal(await page.locator(".search-count").evaluate((node) => node.getAnimations().length), 0);

        // [펼침 중 키보드 이동 / Keyboard movement during disclosure entry]
        // Enter 직후 Tab으로 진입한 버튼이 펼침 완료 뒤 화면 밖으로 밀리지 않아야 합니다.
        // A button reached with Tab immediately after Enter must remain visible after expansion.
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.setViewportSize({ width: 390, height: 1000 });
        await page.evaluate(() => {
            localStorage.setItem("sejong-v3:goods-orders", JSON.stringify([
                { id: "goods-keyboard-entry", createdAt: "2026-10-16T00:00:00Z", status: "confirmed", items: [{ id: "canvas-bag", quantity: 1 }] },
            ]));
        });
        await visit("/news/goods/orders");
        await page.locator(".goods-cancel-confirm summary").focus();
        await page.keyboard.press("Enter");
        await page.keyboard.press("Tab");
        await settle(".goods-cancel-confirm");
        const disclosureFocus = await page.evaluate(() => {
            const button = document.activeElement;
            const rect = button.getBoundingClientRect();
            return { correctTarget: button.hasAttribute("data-goods-cancel"), top: rect.top, bottom: rect.bottom, viewportHeight: innerHeight, overflow: document.querySelector(".goods-cancel-confirm").style.overflow };
        });
        assert.equal(disclosureFocus.correctTarget, true);
        assert.ok(disclosureFocus.top >= -1 && disclosureFocus.bottom <= disclosureFocus.viewportHeight + 1, "rapid Tab target stays inside the viewport after disclosure finishes (allow integer scroll rounding)");
        assert.equal(disclosureFocus.overflow, "");
        assert.deepEqual(errors, []);
        console.log("Transaction motion: actual error/status/amount/list animations, immediate totals, interruption, profile/recovery focus, cart keyboard removal, booking cancel, application withdrawal, repeated search and reduced motion passed.");
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
