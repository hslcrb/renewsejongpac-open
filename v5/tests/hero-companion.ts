import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

// [히어로 정보 영역의 실제 화면 검증 / Verify the rendered hero information rail]
const base = process.argv[2] || "http://127.0.0.1:3000/v5/";
const browser = await chromium.connectOverCDP(process.env.SEJONG_TEST_CDP || "http://127.0.0.1:9223");
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "America/Los_Angeles" });
const page = await context.newPage();
const directory = path.resolve(".lemonade/hero-companion");
fs.mkdirSync(directory, { recursive: true });
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
page.setDefaultTimeout(10000);
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
        console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
try {
    await page.clock.install({ time: new Date("2026-10-21T13:00:00+09:00") });
    await page.clock.pauseAt(new Date("2026-10-21T13:00:00+09:00"));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.bringToFront();
    await page.waitForFunction(() => document.querySelector(".hero-clock")?.textContent === "13:00:00");
    await page.getByRole("button", { name: "자동 재생 일시정지", exact: true }).click();

    await check("the first view keeps one main work and exposes both neighbouring program names", async () => {
        assert.equal(await page.locator('.season-slide.is-active').count(), 1);
        assert.equal(await page.locator('.season-slide[data-preview] .season-peer-title').count(), 2);
        const active = page.locator(".season-slide.is-active");
        assert.equal(await active.getByRole("link", { name: "상세보기", exact: true }).getAttribute("href"), "/v5/programs/dance/");
        assert.equal(await active.getByRole("link", { name: "예매하기", exact: true }).getAttribute("href"), "/v5/booking/dance/");
        assert.ok((await active.locator(".season-description").innerText()).length > 10);
        const viewport = await page.locator(".season-stage").boundingBox();
        const slide = await active.boundingBox();
        assert.ok(viewport && slide && viewport.width - slide.width > 80);
    });
    await check("the clock uses Seoul time, ticks independently and links the actual next official release", async () => {
        await page.clock.runFor(1100);
        assert.equal(await page.locator(".hero-clock").innerText(), "13:00:01");
        assert.match(await page.locator(".hero-next-release").innerText(), /10\. 28\. \(수\) 12:00/);
        assert.match(await page.locator(".hero-next-release > a").getAttribute("href") || "", /nttId=50214/);
        assert.match(await page.locator(".hero-next-release").innerText(), /D-7/);
        assert.equal(await page.locator(".hero-time-glass.liquid-glass .liquid-glass-optics").count(), 1);
    });

    for (const width of [1440, 1024, 768, 390, 320]) {
        await check(`readable non-overlapping hero and information cards at ${width}px`, async () => {
            await page.setViewportSize({ width, height: 1000 });
            await page.locator(".hero-companion").waitFor();
            await page.evaluate(() => document.fonts.ready);
            const geometry = await page.evaluate(() => {
                const rail = document.querySelector<HTMLElement>(".hero-companion")!;
                const copy = document.querySelector<HTMLElement>(".season-slide.is-active .season-copy")!;
                const r = rail.getBoundingClientRect();
                const c = copy.getBoundingClientRect();
                const sizes = [...rail.querySelectorAll<HTMLElement>("h2, strong, span, time, p, a")].map(el => parseFloat(getComputedStyle(el).fontSize));
                return {
                    overflow: document.documentElement.scrollWidth - innerWidth,
                    overlap: r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top,
                    minFont: Math.min(...sizes),
                    railPosition: getComputedStyle(rail).position,
                    top: r.top,
                    stageBottom: document.querySelector(".season-stage")!.getBoundingClientRect().bottom,
                };
            });
            assert.ok(geometry.overflow <= 1, JSON.stringify(geometry));
            assert.equal(geometry.overlap, false, JSON.stringify(geometry));
            assert.ok(geometry.minFont >= 16, JSON.stringify(geometry));
            assert.equal(geometry.railPosition, width > 1100 ? "absolute" : "relative");
            if (width <= 1100) assert.ok(geometry.top >= geometry.stageBottom);
            await page.screenshot({ path: path.join(directory, `hero-${width}.png`) });
        });
    }

    await check("carousel controls retain the one-work layout and expose each slide's matching actions", async () => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.getByRole("button", { name: "다음 프로그램", exact: true }).click();
        await page.clock.runFor(800);
        assert.equal(await page.locator(".season-slide.is-active").getAttribute("data-feature"), "carmen");
        assert.equal(await page.locator(".season-slide.is-active .season-actions a").last().getAttribute("href"), "/v5/booking/carmen/");
        await page.getByRole("button", { name: "이전 프로그램", exact: true }).click();
        await page.clock.runFor(800);
        assert.equal(await page.locator(".season-slide.is-active").getAttribute("data-feature"), "dance");
    });
    await check("every featured work keeps both actions inside the image on a 320px phone", async () => {
        await page.setViewportSize({ width: 320, height: 1000 });
        for (let index = 0; index < 3; index++) {
            const geometry = await page.locator(".season-slide.is-active").evaluate(slide => {
                const frame = slide.getBoundingClientRect();
                const actions = slide.querySelector(".season-actions")!.getBoundingClientRect();
                return {
                    inside: actions.left >= frame.left && actions.right <= frame.right + 1 && actions.bottom <= frame.bottom + 1,
                    overflow: document.documentElement.scrollWidth - innerWidth,
                };
            });
            assert.ok(geometry.inside, JSON.stringify(geometry));
            assert.ok(geometry.overflow <= 1, JSON.stringify(geometry));
            await page.getByRole("button", { name: "다음 프로그램", exact: true }).click();
            await page.clock.runFor(800);
        }
    });
    await check("at release time the next opening advances, then becomes an honest empty state", async () => {
        await page.clock.setSystemTime(new Date("2026-10-28T12:00:00+09:00"));
        await page.clock.runFor(1000);
        assert.match(await page.locator(".hero-next-release > a").getAttribute("href") || "", /nttId=50215/);
        assert.match(await page.locator(".hero-next-release").innerText(), /14:00/);
        await page.clock.setSystemTime(new Date("2026-10-28T14:00:00+09:00"));
        await page.clock.runFor(1000);
        assert.match(await page.locator(".hero-next-release").innerText(), /새로운 오픈 일정을 기다려/);
        assert.doesNotMatch(await page.locator(".hero-release-list").innerText(), /D-/);
    });
    await check("there are no browser runtime errors", async () => assert.deepEqual(errors, []));
} finally {
    fs.writeFileSync(path.join(directory, "report.json"), JSON.stringify({ base, verifiedAt: new Date().toISOString(), results, errors }, null, 2));
    await context.close();
    await browser.close();
}
if (results.some(result => !result.passed)) process.exitCode = 1;
