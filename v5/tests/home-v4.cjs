const { chromium, expect } = require("playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8764/v4/index.html";
const directory = path.resolve(__dirname, "../.lemonade/home-v4");
const report = { target: base, startedAt: new Date().toISOString(), checks: [], errors: [], screenshots: [] };
fs.mkdirSync(directory, { recursive: true });
const save = () => fs.writeFileSync(path.join(directory, "results.json"), JSON.stringify(report, null, 2));

// [독립된 날짜와 브라우저 증거 / Independent dates and browser evidence]
// 실제 선택으로 상태를 바꾸고 고정한 서울 날짜를 기대값으로 사용합니다.
// Exercise real controls and use a fixed Seoul date as the independent expectation.
async function check(name, run) {
    const result = { name, status: "running" };
    report.checks.push(result);
    try {
        result.details = await run();
        result.status = "passed";
        console.log(`PASS ${name}`);
    } catch (error) {
        result.status = "failed";
        result.error = error.stack;
        console.error(`FAIL ${name}: ${error.message}`);
    } finally {
        save();
    }
}

async function screenshot(page, filename, selector) {
    if (!selector) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    }
    await (selector ? page.locator(selector) : page).screenshot({
        path: path.join(directory, filename),
        ...(selector ? {} : { fullPage: true }),
        animations: "disabled",
    });
    report.screenshots.push(filename);
}

async function home(page) {
    await page.goto(base);
    await expect(page.locator("#quick-booking")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
}

async function choose(page, { date = "2026-10-16", program = "carmen", time = "19:30", participants = "2", mobile = false } = {}) {
    if (mobile) await page.locator("[data-quick-native]").fill(date);
    else await page.locator(`[data-quick-date="${date}"]`).click();
    await page.locator(`[data-quick-program="${program}"]`).click();
    await page.locator("#quick-time").selectOption(time);
    await page.locator("#quick-participants").selectOption(participants);
}

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "Asia/Seoul", locale: "ko-KR" });
        const page = await context.newPage();
        page.setDefaultTimeout(8000);
        page.on("dialog", dialog => dialog.dismiss());
        page.on("pageerror", error => report.errors.push({ kind: "page", message: error.message }));
        page.on("console", message => {
            if (message.type() === "error") report.errors.push({ kind: "console", message: message.text() });
        });
        await page.clock.setFixedTime(new Date("2026-10-16T03:00:00Z"));

        await check("desktop calendar dots, keyboard and independent month navigation", async () => {
            await home(page);
            await expect(page.locator("[data-quick-date]")).toHaveCount(31);
            await expect(page.locator('[data-quick-date="2026-10-16"]')).toHaveAttribute("aria-current", "date");
            assert.ok(await page.locator(".quick-date i").count() > 0);
            await expect(page.locator('.quick-calendar-grid [tabindex="0"]')).toHaveCount(1);
            await page.locator('[data-quick-date="2026-10-16"]').focus();
            await page.keyboard.press("ArrowRight");
            await expect(page.locator('[data-quick-date="2026-10-17"]')).toBeFocused();
            await expect(page.locator('[data-quick-date="2026-10-16"]')).toHaveAttribute("aria-pressed", "true");
            await page.keyboard.press("Enter");
            await expect(page.locator('[data-quick-date="2026-10-17"]')).toHaveAttribute("aria-pressed", "true");
            await page.locator('[data-quick-month="1"]').click();
            await expect(page.locator("#quick-month")).toHaveText("2026. 11");
            await expect(page.locator(".quick-day-heading h3")).toContainText("17");
            await page.locator('[data-quick-month="-1"]').click();
            await expect(page.locator('[data-quick-date="2026-10-17"]')).toHaveAttribute("aria-pressed", "true");
        });

        await check("performance keeps date, session and party through seat selection", async () => {
            await home(page);
            await choose(page);
            await expect(page.locator("[data-quick-submit]")).toHaveAttribute("href", "#/booking/carmen?date=2026-10-16&time=19%3A30&participants=2&source=home");
            await screenshot(page, "quick-desktop-selected.png", "#quick-booking");
            await page.locator("[data-quick-submit]").click();
            await expect(page.locator("#booking-date")).toHaveValue("2026-10-16");
            await expect(page.locator('[name="time"]:checked')).toHaveValue("19:30");
            await expect(page.locator(".booking-party-note")).toContainText("2명");
            await page.locator('[data-booking-date] button[type="submit"]').click();
            await page.locator('[data-seat="A1"]').click();
            await page.locator('[data-seat="A2"]').click();
            await expect(page.locator("[data-seat-summary]")).toContainText("A1, A2");
            await screenshot(page, "performance-handoff.png", ".booking-layout");
        });

        await check("exhibition keeps two admissions and the selected session", async () => {
            await home(page);
            await choose(page, { date: "2026-10-20", program: "light", time: "14:00" });
            await page.locator("[data-quick-submit]").click();
            await expect(page.locator("#booking-date")).toHaveValue("2026-10-20");
            await expect(page.locator('[name="time"]:checked')).toHaveValue("14:00");
            await page.locator('[data-booking-date] button[type="submit"]').click();
            await expect(page.locator('[name="quantity"]:checked')).toHaveValue("2");
            await expect(page.locator("[data-seat-summary]")).toContainText("2명");
        });

        await check("education keeps program, date, session and two participants", async () => {
            await home(page);
            await choose(page, { date: "2026-10-20", program: "academy", time: "19:30" });
            await page.locator("[data-quick-submit]").click();
            await expect(page.locator('[name="program"]')).toHaveValue("academy");
            await expect(page.locator('[name="date"]')).toHaveValue("2026-10-20");
            await expect(page.locator('[name="time"]')).toHaveValue("19:30");
            await expect(page.locator('[name="participants"]')).toHaveValue("2");
            await screenshot(page, "education-handoff.png", ".application-page");
        });

        await check("date changes clear dependencies and empty dates cannot book", async () => {
            await home(page);
            await choose(page, { participants: "4" });
            await page.locator('[data-quick-date="2026-10-20"]').click();
            await expect(page.locator("[data-quick-program][aria-pressed=true]")).toHaveCount(0);
            await expect(page.locator("#quick-time")).toHaveValue("");
            await expect(page.locator("#quick-time")).toBeDisabled();
            await expect(page.locator("#quick-participants")).toHaveValue("1");
            await expect(page.locator("[data-quick-submit]")).toHaveCount(0);
            for (let index = 0; index < 4; index++) await page.locator('[data-quick-month="1"]').click();
            await page.locator('[data-quick-date="2027-02-01"]').click();
            await expect(page.locator(".quick-empty")).toContainText("등록된 프로그램이 없는 날");
            await expect(page.locator("[data-quick-submit]")).toHaveCount(0);
            await screenshot(page, "quick-empty.png", "#quick-booking");
        });

        await check("program filters and news filters show actual related entries", async () => {
            await home(page);
            await page.locator('[data-home-category="전시"]').click();
            await expect(page.locator("#home-program-results .program-card")).toHaveCount(2);
            const exhibitionLinks = await page.locator("#home-program-results .card-poster-link").evaluateAll(links => links.map(link => link.getAttribute("href")));
            assert.deepEqual(exhibitionLinks, ["#/programs/art-goods", "#/programs/light"]);
            await page.locator('[data-home-category="교육"]').click();
            await expect(page.locator("#home-program-results .program-card")).toHaveCount(3);
            await page.locator('[data-home-category="기획·시즌"]').click();
            await expect(page.locator("#home-program-results .program-card")).toHaveCount(4);
            assert.ok((await page.locator("#home-program-results .card-poster-link").evaluateAll(links => links.map(link => link.getAttribute("href")))).every(link => !/light|art-class|academy|tour/.test(link)));
            await page.locator('[data-home-news="티켓오픈"]').click();
            const categories = await page.locator("#home-news-results .news-category").allTextContents();
            assert.ok(categories.length > 0 && categories.every(category => category === "티켓오픈"));
            for (const destination of ["#/news/events", "#/news/newsletter", "#/about/donation"]) {
                await expect(page.locator(`.home-participation a[href="${destination}"]`)).toBeVisible();
            }
        });

        await check("hero controls, pause and drag retain their existing contract", async () => {
            await home(page);
            await page.locator("#featured-season").scrollIntoViewIfNeeded();
            const pause = page.locator('[data-hero="pause"]');
            await pause.click();
            await expect(pause).toHaveAttribute("aria-pressed", "true");
            assert.equal(await page.locator(".season-hero").evaluate(element => element.style.getPropertyValue("--carousel-duration")), "800ms");
            const before = await page.locator(".season-slide.is-active").getAttribute("data-feature");
            await page.locator('[data-hero="next"]').click();
            await expect(page.locator(".season-track")).not.toHaveClass(/is-moving/);
            assert.notEqual(await page.locator(".season-slide.is-active").getAttribute("data-feature"), before);
            const current = await page.locator(".season-slide.is-active").getAttribute("data-feature");
            const box = await page.locator(".season-stage").boundingBox();
            await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.4);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4, { steps: 15 });
            await page.mouse.up();
            await expect(page.locator(".season-track")).not.toHaveClass(/is-moving/);
            assert.notEqual(await page.locator(".season-slide.is-active").getAttribute("data-feature"), current);
            assert.ok(!page.url().includes("#/programs/"), "drag must not activate the card link");
        });

        await check("visit hover and keyboard preview reuse the shared image frame", async () => {
            await home(page);
            const preview = page.locator(".visit-hover-preview");
            await expect(preview).toHaveCount(1);
            await page.locator('[data-visit-preview="spaces"]').hover();
            await expect(page.locator('[data-visit-image="spaces"]')).toHaveAttribute("aria-hidden", "false");
            await expect(page.locator('[data-visit-hover-image="spaces"]')).toHaveClass(/is-active/);
            await page.locator('[data-visit-preview="accessibility"]').focus();
            await expect(page.locator('[data-visit-image="accessibility"]')).toHaveAttribute("aria-hidden", "false");
            await screenshot(page, "visit-preview.png", "#plan-your-visit");
        });

        for (const width of [1440, 390, 320]) {
            await check(`home has no overflow and all primary sections at ${width}px`, async () => {
                await page.setViewportSize({ width, height: 1000 });
                await home(page);
                for (const id of ["quick-booking", "discover-programs", "plan-your-visit", "sejong-news", "our-identity"]) await page.locator(`#${id}`).scrollIntoViewIfNeeded();
                const geometry = await page.evaluate(() => ({
                    viewport: innerWidth,
                    scroll: document.documentElement.scrollWidth,
                    sections: document.querySelectorAll("main > section").length,
                    offenders: [...document.querySelectorAll("main *")].filter(element => {
                        const style = getComputedStyle(element);
                        const box = element.getBoundingClientRect();
                        return style.position !== "absolute" && style.position !== "fixed" && box.width && box.right > innerWidth + 1 && !element.closest(".season-stage");
                    }).slice(0, 8).map(element => ({ tag: element.tagName, className: element.className })),
                }));
                assert.ok(geometry.scroll <= width + 1, JSON.stringify(geometry));
                assert.equal(geometry.sections, 6);
                await screenshot(page, `home-${width}.png`);
                const topFilename = `home-${width}-top.png`;
                await page.screenshot({ path: path.join(directory, topFilename), animations: "disabled" });
                report.screenshots.push(topFilename);
                return geometry;
            });
        }

        await check("mobile native date clears and rapidly changes selections without stale handoff", async () => {
            await page.setViewportSize({ width: 390, height: 1000 });
            await home(page);
            await expect(page.locator("[data-quick-native]")).toBeVisible();
            await expect(page.locator(".quick-calendar-grid")).not.toBeVisible();
            await choose(page, { mobile: true });
            await page.locator("[data-quick-native]").fill("");
            await expect(page.locator("[data-quick-submit]")).toHaveCount(0);
            await expect(page.locator("#quick-time")).toBeDisabled();
            for (const date of ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-20"]) await page.locator("[data-quick-native]").fill(date);
            await page.locator('[data-quick-program="academy"]').click();
            for (const time of ["19:30", "14:00", "19:30"]) await page.locator("#quick-time").selectOption(time);
            for (const count of ["4", "1", "2"]) await page.locator("#quick-participants").selectOption(count);
            await expect(page.locator("[data-quick-submit]")).toHaveAttribute("href", "#/apply/education?program=academy&date=2026-10-20&time=19%3A30&participants=2&source=home");
            await screenshot(page, "quick-mobile-selected.png", "#quick-booking");
            await page.locator("[data-quick-submit]").click();
            await expect(page.locator('[name="date"]')).toHaveValue("2026-10-20");
            await expect(page.locator('[name="participants"]')).toHaveValue("2");
            await expect(page.locator('[name="time"]')).toHaveValue("19:30");
        });

        await check("reduced motion and repeated route entry leave usable home controls", async () => {
            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.setViewportSize({ width: 1440, height: 1000 });
            await home(page);
            for (let index = 0; index < 3; index++) {
                await page.locator('.home-pathways a[href="#/programs"]').click();
                await expect(page.locator("body")).toHaveAttribute("data-page", "/programs");
                await page.evaluate(() => { location.hash = "#/"; });
                await expect(page.locator("#quick-booking")).toBeVisible();
            }
            await expect(page.locator('[data-hero="pause"]')).toHaveAttribute("aria-pressed", "true");
            await choose(page);
            await expect(page.locator("[data-quick-submit]")).toHaveAttribute("href", /participants=2/);
            const invisible = await page.locator("#quick-booking, #discover-programs, #plan-your-visit, #sejong-news, #our-identity").evaluateAll(elements => elements.filter(element => getComputedStyle(element).opacity === "0").length);
            assert.equal(invisible, 0);
        });

        await check("no browser or console errors", async () => assert.deepEqual(report.errors, []));
        await context.close();
    } finally {
        await browser.close();
        report.finishedAt = new Date().toISOString();
        report.status = report.checks.some(check => check.status === "failed") ? "failed" : "passed";
        save();
        process.exitCode = report.status === "passed" ? 0 : 1;
        console.log(JSON.stringify({ status: report.status, checks: report.checks.length, failed: report.checks.filter(check => check.status === "failed").map(check => check.name), artifacts: directory }));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
