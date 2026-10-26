const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { mkdir } = require("node:fs/promises");
const path = require("node:path");

const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v4/index.html";
const artifacts = path.resolve(__dirname, "../.lemonade/discovery-motion");

// [탐색 결과의 연결과 즉시 조작 / Discovery continuity and immediate controls]
// 실제 클릭·키보드·빠른 재입력으로 상태, 위치, 퇴장과 모션 감소를 함께 검증합니다.
// Verify state, position, exit and reduced motion through real clicks, keys and rapid reversal.
(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || "/opt/google/chrome/chrome",
        headless: true,
        args: ["--no-sandbox"],
    });
    const errors = [];
    try {
        await mkdir(artifacts, { recursive: true });
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("dialog", (dialog) => dialog.dismiss());
        await page.addInitScript(() => {
            window.motionCalls = [];
            const nativeAnimate = Element.prototype.animate;
            Element.prototype.animate = function (...args) {
                const animation = nativeAnimate.apply(this, args);
                window.motionCalls.push({ element: this, animation, frames: animation.effect.getKeyframes(), timing: animation.effect.getTiming() });
                return animation;
            };
        });
        const go = async (route) => {
            await page.goto(base + "#" + route);
            await page.waitForFunction((expected) => document.body.dataset.page === expected, route.split("?")[0]);
            await page.waitForTimeout(650);
        };
        const clearCalls = () => page.evaluate(() => { window.motionCalls = []; });
        const callsFor = (selector) => page.evaluate((selector) => window.motionCalls
            .filter((call) => call.element.matches(selector))
            .map(({ frames, timing }) => ({ frames, duration: timing.duration, delay: timing.delay })), selector);

        await go("/");
        await page.locator("#home-program-results").scrollIntoViewIfNeeded();
        await page.locator("#home-program-results").evaluate(async (element) => {
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
        });
        await page.evaluate(() => { window.originalCard = document.querySelector("#home-program-results .program-card"); });
        await clearCalls();
        await page.locator('[data-home-category="전체"]').click();
        assert(await page.evaluate(() => window.originalCard === document.querySelector("#home-program-results .program-card")), "same category preserves the existing cards");
        assert.equal((await callsFor("#home-program-results .program-card")).length, 0);
        await page.locator('[data-home-category="전시"]').click();
        assert.equal(await page.locator('[data-home-category="전시"]').getAttribute("aria-pressed"), "true");
        assert.equal(await page.locator("#home-program-results .program-card").count(), 2);
        assert((await callsFor("#home-program-results .program-card")).length > 0, "changed category animates individual cards");
        await page.evaluate(() => {
            for (const category of ["교육", "공연", "전시", "전체"]) document.querySelector(`[data-home-category="${category}"]`).click();
        });
        await page.waitForTimeout(400);
        assert.equal(await page.locator("#home-program-results .program-card").count(), 4);
        assert(await page.locator("#home-program-results").evaluate((element) => [...element.querySelectorAll(".program-card")].every((card) => getComputedStyle(card).opacity === "1" && getComputedStyle(card).transform === "none")));
        assert.equal(await page.locator("#home-program-results [data-motion-key]").evaluateAll((cards) => new Set(cards.map((card) => card.dataset.motionKey)).size), 4);

        await go("/programs/dance");
        await clearCalls();
        await page.locator('[data-program-tab="schedule"]').click();
        assert.equal(await page.locator('[data-program-tab="schedule"]').getAttribute("aria-selected"), "true");
        const forward = await callsFor("#program-panel-schedule");
        assert(forward.some((call) => call.duration === 200 && call.frames.some((frame) => frame.transform?.includes("12px"))), "pointer tab change shows its direction");
        await clearCalls();
        await page.locator('[data-program-tab="schedule"]').click();
        assert.equal((await callsFor(".program-tab-panel")).length, 0, "selected tab is a no-op");
        await page.locator('[data-program-tab="schedule"]').focus();
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator('[data-program-tab="booking"]').getAttribute("aria-selected"), "true");
        assert.equal((await callsFor(".program-tab-panel")).length, 0, "keyboard tab navigation is immediate");
        await page.locator('[data-program-tab="overview"]').focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator('[data-program-tab="overview"]').getAttribute("aria-selected"), "true");
        assert.equal((await callsFor(".program-tab-panel")).length, 0, "keyboard activation is immediate");

        const share = page.locator("[data-program-share]");
        const panel = page.locator("#program-share-panel");
        await clearCalls();
        await share.click();
        assert(await page.locator("#program-share-url").evaluate((element) => element === document.activeElement));
        assert((await callsFor("#program-share-panel")).some((call) => call.duration === 160));
        await page.evaluate(() => {
            const control = document.querySelector("[data-program-share]");
            control.click();
            control.click();
        });
        await page.waitForTimeout(220);
        assert.equal(await share.getAttribute("aria-expanded"), "true");
        assert(await panel.isVisible(), "reopen during exit keeps the panel visible");
        assert.equal(await panel.evaluate((element) => element.inert), false);
        await page.screenshot({ path: path.join(artifacts, "share-open-1440.png") });
        await page.keyboard.press("Escape");
        assert.equal(await share.getAttribute("aria-expanded"), "false");
        assert(await share.evaluate((element) => element === document.activeElement));
        assert(await panel.evaluate((element) => element.inert || element.hidden), "closing content is removed from keyboard navigation immediately");
        await page.waitForFunction(() => document.querySelector("#program-share-panel").hidden);
        assert((await callsFor("#program-share-panel")).some((call) => call.duration === 120));

        // [같은 주소의 소개에서 새 상세로 / A new detail view on the same pathname]
        // 투어 하단 링크는 소개의 스크롤을 보존하지 않고 상세 첫 화면과 일정 탭으로 진입합니다.
        // The tour footer link starts the detail view at its top with the schedule tab selected.
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            await go("/programs/tour");
            const scheduleLink = page.getByRole("link", { name: "일정·참여 정보 확인" });
            await scheduleLink.scrollIntoViewIfNeeded();
            assert(await page.evaluate(() => scrollY > 500), "begin the tour detail transition from the introduction's lower content");
            await clearCalls();
            await scheduleLink.click();
            await page.locator(".program-detail-summary").waitFor();
            await page.waitForFunction(() => scrollY === 0);
            assert.match(page.url(), /\/programs\/tour\?tab=schedule&detail=1$/);
            assert(await page.locator("#main").evaluate((element) => element === document.activeElement), "new detail view starts reading from main");
            assert.match(await page.locator(".program-detail-summary h1").innerText(), /백스테이지 투어/);
            assert.equal(await page.locator('[data-program-tab="schedule"]').getAttribute("aria-selected"), "true");
            assert.equal(await page.locator("#program-panel-schedule").evaluate((element) => element.hidden), false);
            if (width === 1440) {
                await page.waitForFunction(() => window.motionCalls.some((call) => call.element.matches(".program-detail-summary > h1")));
                assert((await callsFor(".program-detail-summary > h1")).some((call) => call.duration === 260), "the new detail title receives its entrance");
            }
        }
        await page.setViewportSize({ width: 1440, height: 1000 });

        await go("/visit/directions");
        await page.locator("[data-arrival-result]").scrollIntoViewIfNeeded();
        const mapBefore = await page.locator(".arrival-map svg").boundingBox();
        await page.locator("#arrival-origin").selectOption("parking");
        await page.locator("#arrival-venue").selectOption("s-theater");
        await clearCalls();
        await page.locator("[data-arrival-planner] button").click();
        const routeCalls = await callsFor(".arrival-map-route path");
        assert(routeCalls.some((call) => call.duration === 240 && Number.parseFloat(call.frames[0].strokeDashoffset) > 0 && Number.parseFloat(call.frames.at(-1).strokeDashoffset) === 0), "route line draws from origin to destination");
        assert.equal((await callsFor("[data-arrival-result], .arrival-map, .arrival-instructions")).length, 0, "map and directions text remain still");
        assert.match(await page.locator("#arrival-result-heading").innerText(), /세종로 공영주차장[\s\S]*세종S씨어터/);
        const mapAfter = await page.locator(".arrival-map svg").boundingBox();
        assert.equal(mapAfter.width, mapBefore.width);
        assert.equal(mapAfter.height, mapBefore.height);
        await page.waitForTimeout(300);
        assert.equal(await page.locator(".arrival-map-route path").evaluate((element) => getComputedStyle(element).strokeDashoffset), "0px");
        await page.evaluate(() => {
            document.querySelector("[data-arrival-planner]").requestSubmit();
            window.routeAnimation = document.querySelector(".arrival-map-route path").getAnimations()[0];
            window.routeAnimation.pause();
            window.routeAnimation.currentTime = 0;
        });
        for (const [label, time] of [["start", 0], ["mid", 120], ["end", 240]]) {
            await page.evaluate((time) => { window.routeAnimation.currentTime = time; }, time);
            await page.locator(".arrival-map").screenshot({ path: path.join(artifacts, `arrival-route-${label}.png`) });
        }
        await page.evaluate(() => window.routeAnimation.finish());

        await go("/about/disclosure");
        await page.locator("#disclosure-category").selectOption("공간");
        await clearCalls();
        await page.locator("[data-disclosure-search] [type=submit]").click();
        assert.equal(await page.locator(".disclosure-record-list article").count(), 1);
        assert.match(await page.locator(".disclosure-record-list").innerText(), /공간/);
        assert.equal((await callsFor("[data-disclosure-results]")).length, 0, "collection transitions target rows rather than the whole result");
        await page.locator("#disclosure-search").fill("없는자료999");
        await page.locator("[data-disclosure-search] [type=submit]").click();
        assert.match(await page.locator("[data-disclosure-results]").innerText(), /일치하는 자료가 없습니다/);
        await page.locator("[data-disclosure-search] [type=reset]").click();
        assert.equal(await page.locator(".disclosure-record-list article").count(), 4);
        await page.waitForTimeout(400);
        assert(await page.locator(".disclosure-record-list article").evaluateAll((rows) => rows.every((row) => getComputedStyle(row).opacity === "1" && getComputedStyle(row).transform === "none")));

        await page.evaluate(() => localStorage.setItem("sejong-v4:applications", JSON.stringify([
            { id: "APP-MOTION-AUTUMN", type: "/news/events/autumn-walk/apply", status: "saved", createdAt: "2026-10-15T10:00:00Z", fields: [] },
            { id: "APP-MOTION-REVIEW", type: "/news/events/review/apply", status: "cancelled", createdAt: "2026-10-15T10:00:00Z", fields: [] },
        ])));
        await go("/news/events/winners");
        await page.locator("#event-lookup-event").selectOption("autumn-walk");
        await clearCalls();
        await page.locator("[data-event-lookup] [type=submit]").click();
        assert.equal(await page.locator(".event-status-record").count(), 1);
        assert.equal(await page.locator(".event-status-record").getAttribute("data-motion-key"), "event-APP-MOTION-AUTUMN");
        assert.equal((await callsFor("[data-event-results]")).length, 0);
        await page.locator("[data-event-lookup] [type=reset]").click();
        assert.equal(await page.locator(".event-status-record").count(), 2);

        await go("/news/newsletter");
        await page.locator("#newsletter-email").fill("motion@example.com");
        await page.locator('[data-newsletter] [name="consent"]').check();
        await clearCalls();
        await page.locator("[data-newsletter] [type=submit]").click();
        assert.match(await page.locator("[data-newsletter-result]").innerText(), /구독 체험을 완료했습니다/);
        assert((await callsFor("[data-newsletter-result]")).some((call) => call.duration === 180));
        assert.equal(await page.locator("#newsletter-email").inputValue(), "");

        // [작은 화면과 실행 중 모션 감소 / Narrow screens and runtime reduced motion]
        // 축소된 화면과 설정 변경에서도 상태를 완료하고 오래된 애니메이션을 남기지 않습니다.
        // Complete each state on small screens and preference changes without stale animations.
        await page.setViewportSize({ width: 390, height: 844 });
        await go("/programs/dance");
        await share.click();
        await page.keyboard.press("Escape");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(() => document.querySelector("#program-share-panel").hidden);
        assert(await share.evaluate((element) => element === document.activeElement));
        await clearCalls();
        await share.click();
        assert(await panel.isVisible());
        assert.equal((await callsFor("#program-share-panel")).length, 0);
        await page.keyboard.press("Escape");
        await go("/visit/directions");
        await page.locator("#arrival-origin").selectOption("parking");
        await clearCalls();
        await page.locator("[data-arrival-planner] button").click();
        assert.equal((await callsFor(".arrival-map-route path")).length, 0);
        assert.equal(await page.locator(".arrival-map-route path").evaluate((element) => getComputedStyle(element).strokeDashoffset), "0px");
        await page.waitForFunction(() => !document.querySelector("#toast").classList.contains("visible"));
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({ path: path.join(artifacts, "arrival-reduced-390.png"), fullPage: true });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await go("/");
        await clearCalls();
        await page.locator('[data-home-category="전시"]').click();
        assert.equal((await callsFor("#home-program-results .program-card")).length, 0);
        assert.equal(await page.locator("#home-program-results .program-card").count(), 2);
        assert.deepEqual(errors, []);
        console.log("PASS discovery motion: keyed results, pointer/keyboard tabs, reversible share, tour detail reset, route explanation, local records, confirmation and reduced motion at 1440/390px");
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
