const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { readFile, mkdir } = require("node:fs/promises");
const path = require("node:path");

const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v4/index.html";
const artifacts = path.resolve(__dirname, "../.lemonade/experiences");

// [내부 길찾기·공개자료·응모 확인 / In-site directions, documents and applications]
// 독립적인 입력과 다운로드 파일로 실제 선택·검색·저장 상태를 확인합니다.
// Verify real selections, searches, downloads and saved states with explicit expectations.
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
        page.on("dialog", (dialog) => dialog.dismiss());
        page.on("pageerror", (error) => errors.push(error.message));
        const go = async (route) => {
            await page.goto(base + "#" + route);
            await page.waitForFunction((expected) => document.body.dataset.page === expected, route.split("?")[0]);
            await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        };

        await go("/visit/directions");
        assert.equal(await page.locator("#arrival-origin").inputValue(), "gwanghwamun");
        assert.equal(await page.locator(".arrival-map-route").count(), 1);
        assert.equal(await page.locator('#main a[href^="http"]').count(), 0);
        await page.locator("#arrival-origin").selectOption("parking");
        await page.locator("#arrival-venue").selectOption("s-theater");
        await page.locator("[data-arrival-planner] button").click();
        assert.match(await page.locator("#arrival-result-heading").innerText(), /세종로 공영주차장[\s\S]*세종S씨어터/);
        assert.match(await page.locator(".arrival-instructions").innerText(), /별도 출입구/);
        assert.match(page.url(), /origin=parking&venue=s-theater/);
        assert.equal(await page.locator(".arrival-map-route path").getAttribute("d"), "M368 402H438V300");
        await page.reload();
        assert.equal(await page.locator("#arrival-origin").inputValue(), "parking");
        assert.equal(await page.locator("#arrival-venue").inputValue(), "s-theater");
        await page.locator("#arrival-origin").focus();
        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("Enter");
        await page.locator("[data-arrival-planner] button").click();
        assert.match(await page.locator("#arrival-result-heading").innerText(), /경복궁역/);
        await go("/visit/directions?origin=invalid&venue=invalid");
        assert.equal(await page.locator("#arrival-origin").inputValue(), "gwanghwamun");
        assert.equal(await page.locator("#arrival-venue").inputValue(), "grand");

        await go("/about/disclosure");
        assert.equal(await page.locator(".disclosure-record-list article").count(), 4);
        await page.locator("#disclosure-category").selectOption("공간");
        await page.locator("[data-disclosure-search] [type=submit]").click();
        assert.equal(await page.locator(".disclosure-record-list article").count(), 1);
        await page.locator(".disclosure-record-list a").click();
        assert.match(page.url(), /document=open-data/);
        await page.locator('[data-disclosure-download="open-data"]').waitFor();
        assert.equal(await page.locator(".disclosure-data tbody tr").count(), 5);
        const downloadPromise = page.waitForEvent("download");
        await page.locator("[data-disclosure-download]").click();
        const download = await downloadPromise;
        assert.equal(download.suggestedFilename(), "sejong-open-data-prototype.csv");
        const csv = await readFile(await download.path(), "utf8");
        for (const name of ["세종대극장", "세종M씨어터", "세종S씨어터", "세종체임버홀", "세종미술관"]) assert(csv.includes(name));
        assert(csv.includes("시연용 공간 데이터"));
        assert(csv.includes('"공간명","분류","소개 규모","주요 용도"'));
        assert.equal(csv.trim().split(/\r?\n/).length, 10);

        await go("/about/disclosure/management");
        await page.locator("#disclosure-search").fill("카르멘");
        await page.locator("[data-disclosure-search] [type=submit]").click();
        assert.equal(await page.locator(".disclosure-record-list article").count(), 2);
        await page.locator("#disclosure-search").fill("존재하지않는자료123");
        await page.locator("[data-disclosure-search] [type=submit]").click();
        assert.match(await page.locator("[data-disclosure-results]").innerText(), /일치하는 자료가 없습니다/);
        await page.locator("[data-disclosure-search] [type=reset]").click();
        assert.equal(await page.locator(".disclosure-record-list article").count(), 4);
        for (const [route, ids] of [
            ["/about/disclosure", ["prior", "contracts", "rules", "open-data"]],
            ["/about/disclosure/management", ["operations", "finance", "organization", "evaluation"]],
        ]) {
            for (const id of ids) {
                await go(route + "?document=" + id);
                assert.equal(await page.locator("[data-disclosure-download]").getAttribute("data-disclosure-download"), id);
                assert(await page.locator(".disclosure-data tbody tr").count() >= 5);
                assert.match(await page.locator(".disclosure-document").innerText(), /자료 성격[\s\S]*자료 출처/);
            }
        }
        await go("/about/disclosure?document=missing");
        assert.match(await page.locator(".experience-query-notice").innerText(), /요청한 자료를 찾을 수 없어/);
        assert.equal(await page.locator(".disclosure-record-list article").count(), 4);
        await go("/about/disclosure/management?document=operations");
        assert.equal(await page.locator(".disclosure-data tbody tr").count(), 15);

        await go("/news/events/winners");
        assert.match(await page.locator("[data-event-results]").innerText(), /아직 저장한 이벤트 응모가 없습니다/);
        await page.evaluate(() => localStorage.setItem("sejong-v4:applications", JSON.stringify([
            { id: "APP-TEST-AUTUMN", type: "/news/events/autumn-walk/apply", title: "가을의 취향을 나누다 · 이벤트 응모", status: "saved", createdAt: "2026-10-15T10:00:00Z", fields: [] },
            { id: "APP-TEST-REVIEW", type: "/news/events/review/apply", title: "관람 후기 이벤트 응모", status: "cancelled", createdAt: "2026-10-15T10:00:00Z", fields: [] },
            { id: "APP-TEST-OTHER", type: "/rental/apply", title: "대관신청", status: "saved", fields: [] },
        ])));
        await page.reload();
        assert.equal(await page.locator(".event-status-record").count(), 2);
        assert.match(await page.locator("[data-event-results]").innerText(), /체험 응모 저장/);
        assert.match(await page.locator("[data-event-results]").innerText(), /철회 완료/);
        await page.locator("#event-lookup-reference").fill("REVIEW");
        await page.locator("[data-event-lookup] [type=submit]").click();
        assert.equal(await page.locator(".event-status-record").count(), 1);
        assert.match(await page.locator(".event-status-record").innerText(), /APP-TEST-REVIEW/);
        await page.locator("#event-lookup-event").selectOption("autumn-walk");
        await page.locator("[data-event-lookup] [type=submit]").click();
        assert.match(await page.locator("[data-event-results]").innerText(), /일치하는 응모내역이 없습니다/);
        await page.locator("[data-event-lookup] [type=reset]").click();
        assert.equal(await page.locator(".event-status-record").count(), 2);
        await go("/account/applications");
        await page.locator("details").filter({ hasText: "APP-TEST-AUTUMN" }).locator("summary").click();
        await page.locator('[data-withdraw-application="APP-TEST-AUTUMN"]').click();
        await go("/news/events/winners?reference=AUTUMN");
        assert.match(await page.locator(".event-status-record").innerText(), /철회 완료/);
        await go("/news/notices/recruit");
        assert.equal(await page.getByRole("link", { name: "채용 지원서 작성" }).getAttribute("href"), "#/news/notices/recruit/apply");
        await page.getByRole("link", { name: "채용 지원서 작성" }).click();
        await page.locator("[data-application-form]").waitFor();
        assert.equal(await page.locator("[data-application-form]").count(), 1);

        await page.waitForFunction(() => !document.querySelector("#toast").classList.contains("visible"));
        for (const width of [320, 390, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            for (const [name, route] of [
                ["arrival", "/visit/directions?origin=parking&venue=s-theater"],
                ["documents", "/about/disclosure/management?document=operations"],
                ["events", "/news/events/winners"],
            ]) {
                await go(route);
                await page.evaluate(() => document.fonts.ready);
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px ${name}: no page overflow`);
                const ids = await page.locator("[id]").evaluateAll((elements) => elements.map((element) => element.id));
                assert.equal(new Set(ids).size, ids.length, `${name}: unique IDs`);
                if ([390, 1440].includes(width)) {
                    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
                    await page.screenshot({ path: path.join(artifacts, `${name}-${width}.png`), fullPage: true, animations: "disabled" });
                }
            }
        }
        await page.emulateMedia({ reducedMotion: "reduce" });
        await go("/visit/directions");
        await page.locator("#arrival-origin").selectOption("parking");
        await page.locator("[data-arrival-planner] button").click();
        assert.match(await page.locator("#arrival-result-heading").innerText(), /세종로 공영주차장/);
        assert.deepEqual(errors, []);
        console.log("PASS in-site directions, 8 document datasets, CSV, search/reset, event lookup/withdrawal, recruitment link, 5 responsive widths, reduced motion");
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
