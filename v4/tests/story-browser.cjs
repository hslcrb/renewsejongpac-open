const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// [독립 로컬 제품 검증 / Isolated local product verification]
// 사용자 브라우저 프로필과 외부 레퍼런스에 접근하지 않고 localhost의 통합 제품을 검사합니다.
// Test the integrated localhost product without user profiles or external reference browsing.
const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8764/v4/index.html";
const output = path.resolve(__dirname, "../../.codex/analysis-v4/story-verification");
const report = { target: base, checks: [], errors: [], screenshots: [] };
fs.mkdirSync(output, { recursive: true });

function auditObservers() {
    window.storyObserverAudit = [];
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
        constructor(callback, options) {
            super(callback, options);
            this.targets = new Set();
            window.storyObserverAudit.push(this);
        }
        observe(element) { this.targets.add(element); return super.observe(element); }
        unobserve(element) { this.targets.delete(element); return super.unobserve(element); }
        disconnect() { this.targets.clear(); return super.disconnect(); }
    };
}

async function check(name, action) {
    try {
        const detail = await action();
        report.checks.push({ name, status: "passed", detail });
        console.log("PASS " + name);
    } catch (error) {
        report.checks.push({ name, status: "failed", error: error.stack });
        console.error("FAIL " + name + ": " + error.message);
    }
}

async function capture(page, name) {
    await page.waitForFunction(() => !document.querySelector("[data-story]")?.getAnimations({ subtree: true })
        .some(animation => animation.playState === "running"));
    const filename = path.join(output, name + ".png");
    await page.screenshot({ path: filename });
    report.screenshots.push(filename);
}

(async () => {
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        await context.addInitScript(auditObservers);
        const page = await context.newPage();
        page.on("dialog", dialog => dialog.dismiss());
        page.on("pageerror", error => report.errors.push(error.message));
        await page.goto(base + "#/about", { waitUntil: "networkidle" });
        await page.locator("[data-story]").waitFor();

        await check("About renders its own title and all first-frame media", async () => {
            assert.equal(await page.locator("#main h1").count(), 1);
            await page.waitForFunction(() => [...document.querySelectorAll("[data-story] img")]
                .filter(image => image.loading !== "lazy").every(image => image.complete && image.naturalWidth > 0));
            assert.equal(await page.locator("[data-story-space]:checked").inputValue(), "grand");
            await capture(page, "about-1440-hero");
        });

        await check("Story jump scrolls and moves keyboard focus to the next chapter", async () => {
            await page.locator("[data-story-jump]").click();
            assert.equal(await page.evaluate(() => document.activeElement.id), "story-experience-title");
        });

        await check("Native arrow keys change the selected venue and keep its next action accurate", async () => {
            await page.locator('[data-story-space="grand"]').focus();
            await page.keyboard.press("ArrowRight");
            assert.equal(await page.locator("[data-story-space]:checked").inputValue(), "m-theater");
            assert.equal(await page.locator("[data-story-space-panel] h3").innerText(), "세종M씨어터");
            assert.equal(await page.locator("[data-story-space-panel] a").getAttribute("href"), "#/visit/spaces/m-theater");
            await page.keyboard.press("Tab");
            assert.equal(await page.evaluate(() => document.activeElement.getAttribute("href")), "#/visit/spaces/m-theater");
            await page.locator('[data-story-space="s-theater"]').check();
            await page.locator('[data-story-space="gallery"]').check();
            await page.locator('[data-story-space="grand"]').check();
            assert.equal(await page.locator("[data-story-space-panel] h3").innerText(), "세종대극장");
            assert.match(await page.locator("[data-story-status]").innerText(), /세종대극장/);
            await page.locator("#story-spaces").scrollIntoViewIfNeeded();
            await capture(page, "about-1440-spaces");
        });

        await check("Live reduced-motion preference restores a static hero and cancels story animation", async () => {
            await page.evaluate(() => window.scrollTo(0, 300));
            await page.waitForFunction(() => document.querySelector("[data-story-media]").style.length > 0);
            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.waitForFunction(() => document.querySelector("[data-story-media]").style.length === 0);
            const state = await page.evaluate(() => ({
                transform: getComputedStyle(document.querySelector(".story-hero-frame img")).transform,
                clip: getComputedStyle(document.querySelector(".story-hero-frame")).clipPath,
                active: document.querySelector("[data-story]").getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length,
            }));
            assert.equal(state.transform, "none");
            assert.equal(state.clip, "none");
            assert.equal(state.active, 0);
            return state;
        });

        for (const width of [390, 320]) {
            await check(`About at ${width}px retains readable controls without horizontal overflow`, async () => {
                await page.setViewportSize({ width, height: 844 });
                await page.evaluate(() => window.scrollTo(0, 0));
                await capture(page, `about-${width}-hero`);
                await page.locator('[data-story-space="s-theater"]').check();
                await page.locator("#story-spaces").scrollIntoViewIfNeeded();
                const sizes = await page.evaluate(() => ({
                    width: innerWidth,
                    scrollWidth: document.documentElement.scrollWidth,
                    labels: [...document.querySelectorAll(".story-space-choice")].map(label => label.getBoundingClientRect().height),
                    bodySize: getComputedStyle(document.querySelector(".story-space-copy > p:not(.story-kicker)")).fontSize,
                }));
                assert.ok(sizes.scrollWidth <= width + 1, JSON.stringify(sizes));
                assert.ok(sizes.labels.every(height => height >= 48));
                assert.equal(sizes.bodySize, "18px");
                await capture(page, `about-${width}-spaces`);
                return sizes;
            });
        }

        await check("Leaving About releases observers and returning restores an independent default selection", async () => {
            await page.evaluate(() => { location.hash = "#/about/companies"; });
            await page.waitForFunction(() => document.body.dataset.page === "/about/companies");
            assert.equal(await page.evaluate(() => window.storyObserverAudit.flatMap(observer => [...observer.targets])
                .filter(element => element.matches("[data-story-scene]")).length), 0);
            await page.evaluate(() => { location.hash = "#/about/introduction"; });
            await page.locator("[data-story]").waitFor();
            assert.equal(await page.locator("[data-story-space]:checked").inputValue(), "grand");
            assert.equal(await page.locator("[data-story-space-panel] h3").innerText(), "세종대극장");
        });
        assert.deepEqual(report.errors, [], "No browser runtime errors");
    } catch (error) {
        report.errors.push(error.stack || String(error));
    } finally {
        await browser.close();
        report.status = report.errors.length || report.checks.some(item => item.status === "failed") ? "failed" : "passed";
        fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(report, null, 2) + "\n");
        if (report.status === "failed") process.exitCode = 1;
    }
})();
