const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v3/index.html";

// [실제 입력으로 모션의 상태 계약 검증 / Verify motion state contracts with real input]
// 연속 입력·Escape·Tab·모션 감소와 페이지 수명 동안 최종 상태가 일치하는지 확인합니다.
// Check final states under repeated input, Escape, Tab, reduced motion and route cleanup.
(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
        headless: true,
        args: ["--no-sandbox"],
    });
    const errors = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        page.on("dialog", dialog => dialog.dismiss());
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(base);
        await page.waitForSelector(".season-hero");
        const search = page.locator("#search-dialog");
        const searchOpener = page.locator('[data-open-dialog="search-dialog"]');

        await searchOpener.click();
        assert(await search.evaluate(element => element.open));
        assert(await page.locator("#global-query").evaluate(element => element === document.activeElement));
        const modalScroll = await page.evaluate(() => scrollY);
        await page.mouse.move(10, 700);
        await page.mouse.wheel(0, 450);
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => scrollY), modalScroll, "modal keeps background scroll locked");
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.getElementById("search-dialog").open);
        assert(await searchOpener.evaluate(element => element === document.activeElement));
        assert.equal(await page.locator("body").evaluate(element => getComputedStyle(element).overflow), "visible");

        // 닫히는 중에 다시 열어도 이전 완료 콜백이 새 대화상자를 닫지 않습니다.
        // Reopening during exit must invalidate the earlier close completion.
        await searchOpener.click();
        await page.evaluate(() => {
            document.querySelector('#search-dialog [data-close-dialog]').click();
            document.querySelector('[data-open-dialog="search-dialog"]').click();
        });
        await page.waitForTimeout(280);
        assert(await search.evaluate(element => element.open));
        assert.equal(await search.getAttribute("data-dialog-closing"), null);
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.getElementById("search-dialog").open);

        await page.locator('[data-open-dialog="menu-dialog"]').click();
        const menu = page.locator("#menu-dialog");
        await page.keyboard.press("Tab");
        assert(await menu.evaluate(element => element.contains(document.activeElement)));
        await page.evaluate(() => { location.hash = "#/visit/support/faq"; });
        await page.waitForSelector(".faq-list details");
        assert.equal(await page.locator("dialog[open]").count(), 0);

        const details = page.locator(".faq-list details").first();
        const summary = details.locator("summary");
        await summary.focus();
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => {
            const details = document.querySelector(".faq-list details");
            return details.open && !details.getAnimations().length;
        });
        assert.equal(await details.evaluate(element => element.style.height), "");
        assert.equal(await details.evaluate(element => element.style.overflow), "");
        assert(await details.locator(".faq-answer").isVisible());
        await page.keyboard.press("Space");
        await page.waitForFunction(() => !document.querySelector(".faq-list details").open);
        assert(await summary.evaluate(element => element === document.activeElement));
        assert.equal(await details.locator(".faq-answer").isVisible(), false);

        await summary.click();
        await page.evaluate(() => {
            const summary = document.querySelector(".faq-list summary");
            summary.click();
            summary.click();
        });
        await page.waitForFunction(() => {
            const details = document.querySelector(".faq-list details");
            return details.open && !details.getAnimations().length;
        });
        assert.equal(await summary.getAttribute("aria-expanded"), null, "native disclosure semantics resume after transition");
        assert.equal(await details.locator(".faq-answer").evaluate(element => element.inert), false);

        await page.evaluate(() => {
            const details = document.querySelector(".faq-list details");
            details.querySelector("summary").click();
            details.querySelector("summary").click();
            details.open = false;
        });
        await page.waitForTimeout(230);
        assert.equal(await details.evaluate(element => element.open), false, "native closure must win over a pending entrance");
        await summary.click();
        await page.waitForFunction(() => document.querySelector(".faq-list details").open);

        // 모션 감소를 실행 중에 바꿔도 닫힘과 포커스 복귀가 완료됩니다.
        // Runtime reduced-motion changes finish transitions and preserve focus restoration.
        await searchOpener.click();
        await page.evaluate(() => document.querySelector('#search-dialog [data-close-dialog]').click());
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(() => !document.getElementById("search-dialog").open);
        assert(await searchOpener.evaluate(element => element === document.activeElement));
        await summary.focus();
        await page.keyboard.press("Enter");
        assert.equal(await details.evaluate(element => element.open), false);
        assert.equal(await details.evaluate(element => element.getAnimations().length), 0);

        // 같은 페이지의 조건 변경은 검색 위치와 입력 포커스를 유지합니다.
        // Same-page filtering preserves reading position and input focus.
        await page.locator("#faq-search").fill("관람");
        await page.locator("#faq-search").focus();
        const beforeScroll = await page.evaluate(() => scrollY);
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => location.hash.includes("search="));
        await page.waitForFunction(() => document.activeElement?.id === "faq-search");
        assert(Math.abs((await page.evaluate(() => scrollY)) - beforeScroll) < 2);
        assert.equal(await page.locator("#faq-search").inputValue(), "관람");

        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.evaluate(() => { location.hash = "#/visit/directions"; });
        await page.waitForSelector("[data-arrival-planner]");
        await page.locator("#arrival-origin").selectOption("parking");
        const update = await page.locator("[data-arrival-planner] button").evaluate(button => {
            button.click();
            return {
                moving: document.querySelector(".arrival-map-route path").getAnimations().length > 0,
                focus: document.activeElement.id,
            };
        });
        assert(update.moving, "result focus preserves the arrival path animation");
        assert.equal(update.focus, "arrival-result-heading");

        // 자료 열람·주문 단계는 같은 경로여도 새 화면의 시작점으로 이동합니다.
        // Document and checkout views start afresh even when their pathname stays the same.
        await page.evaluate(() => { location.hash = "#/about/disclosure"; });
        await page.waitForSelector(".disclosure-record-list");
        await page.locator(".disclosure-record-list a").last().scrollIntoViewIfNeeded();
        assert(await page.evaluate(() => scrollY > 500));
        await page.locator(".disclosure-record-list a").last().click();
        await page.waitForSelector(".disclosure-document");
        assert.equal(await page.evaluate(() => scrollY), 0);
        assert.equal(await page.evaluate(() => document.activeElement.id), "main");
        const heading = await page.locator("#disclosure-document-heading").boundingBox();
        assert(heading.y > 0 && heading.y < 1000, "new document heading is visible at the start");

        await page.evaluate(() => { location.hash = "#/news/goods/art-postcards"; });
        await page.waitForSelector("[data-goods-add]");
        await page.locator("[data-goods-add] button").click();
        await page.locator('.goods-navigation a[href="#/news/goods/cart"]').click();
        await page.waitForSelector('[href="#/news/goods/cart?step=review"]');
        await page.locator('[href="#/news/goods/cart?step=review"]').focus();
        await page.keyboard.press("Enter");
        await page.waitForSelector("[data-goods-order]");
        assert(await page.evaluate(() => scrollY <= 2), "checkout begins at the page start");
        assert.equal(await page.evaluate(() => document.activeElement.id), "main");

        await page.evaluate(() => { location.hash = "#/about"; });
        await page.waitForSelector(".identity-story");
        await page.evaluate(() => {
            const element = document.querySelector(".identity-story > div:first-child");
            scrollTo({ top: scrollY + element.getBoundingClientRect().top - 250, behavior: "instant" });
        });
        await page.waitForFunction(() => document.querySelector(".identity-story > div:first-child").getAnimations().length > 0);
        await page.locator(".identity-story .text-link").focus();
        assert.equal(await page.locator(".identity-story > div:first-child").evaluate(element => element.getAnimations().length), 0, "focus resolves an active editorial entrance");

        await page.evaluate(() => { location.hash = "#/"; });
        await page.waitForSelector("#discover-programs");
        await page.locator("#discover-programs").scrollIntoViewIfNeeded();
        await page.locator('[data-home-category="공연"]').click();
        await page.locator('[data-home-category="교육"]').click();
        assert.equal(await page.locator('[data-home-category="교육"]').getAttribute("aria-pressed"), "true");
        assert(await page.locator("#program-selection-status").textContent().then(text => text.startsWith("교육")));

        const favorite = page.locator(".card--poster .favorite-button").first();
        await favorite.focus();
        await page.keyboard.press("Enter");
        assert.equal(await favorite.getAttribute("aria-pressed"), "true");
        assert.equal(await favorite.evaluate(element => getComputedStyle(element).transform), "none");
        assert.equal(await favorite.evaluate(element => getComputedStyle(element).transitionDuration), "0.18s");
        assert(await page.locator("#toast").evaluate(element => element.classList.contains("visible")));

        await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
        await page.waitForFunction(() => !document.querySelector(".return-top").hidden);
        await page.locator(".return-top").click();
        await page.waitForFunction(() => scrollY === 0);
        await page.waitForFunction(() => document.querySelector(".return-top").hidden);

        // 다른 화면으로 나갈 때 진행 중 효과와 모달 차단이 남지 않습니다.
        // Leaving a route cleans up in-flight effects and modal blocking.
        await page.locator('[data-open-dialog="menu-dialog"]').click();
        await page.evaluate(() => { location.hash = "#/visit/support/faq"; });
        await page.waitForSelector(".faq-list");
        assert.equal(await page.locator("dialog[open]").count(), 0);
        assert.equal(await page.locator("body").evaluate(element => getComputedStyle(element).overflow), "visible");
        await page.emulateMedia({ reducedMotion: "reduce" });
        for (const width of [390, 768, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.locator(".faq-list summary").first().click();
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        }
        assert.deepEqual(errors, []);
        console.log("Motion: native dialogs, interrupt/reopen, Escape/Tab focus, disclosures, rapid input, runtime reduced motion, same-route filters, favorite feedback, return-to-top and route cleanup passed.");
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
