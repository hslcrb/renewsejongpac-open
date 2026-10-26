const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// [검증 대상과 증거 기록 / Verification target and evidence report]
// 독립된 결과 파일에 화면군·실패·측정값을 함께 저장합니다.
// Keep route coverage, failures and measurements in a dedicated report.
const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8091/v4/index.html";
const filter = process.env.SEJONG_SITEWIDE_FILTER || "";
const selectedCheck = filter ? new RegExp(filter) : null;
const artifacts = path.resolve(__dirname, "../.lemonade/sitewide-motion", filter ? "focused-" + filter.replace(/[^a-z0-9]+/gi, "-") : "");
const reportPath = path.join(artifacts, "results.json");
const report = { startedAt: new Date().toISOString(), target: base, filter, status: "running", checks: [], routes: [], screenshots: [], samples: [], errors: [] };
fs.mkdirSync(artifacts, { recursive: true });
const save = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

// [실제 생성된 모션을 관찰 / Observe animations actually created by the app]
// 제품 코드를 바꾸지 않고 실제 WAAPI 대상과 관찰자의 수명을 기록합니다.
// Instrument native APIs without changing production selectors or renderers.
function instrumentation() {
    const audit = window.__sitewideMotion = { records: [], history: [], observers: [], hold: true, pendingFrames: new Set(), longTasks: [], frameGaps: [] };
    const nativeAnimate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
        const animation = nativeAnimate.call(this, frames, options);
        const record = { element: this, animation, route: location.hash, time: performance.now() };
        audit.records.push(record);
        audit.history.push(record);
        if (audit.hold) {
            const timing = animation.effect.getTiming();
            animation.pause();
            animation.currentTime = timing.delay + Number(timing.duration) / 2;
        }
        return animation;
    };
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
        constructor(callback, options) {
            super(callback, options);
            this.auditTargets = new Set();
            audit.observers.push(this);
        }
        observe(element) { this.auditTargets.add(element); return super.observe(element); }
        unobserve(element) { this.auditTargets.delete(element); return super.unobserve(element); }
        disconnect() { this.auditTargets.clear(); return super.disconnect(); }
    };
    const nativeFrame = window.requestAnimationFrame.bind(window);
    const nativeCancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
        const id = nativeFrame(time => { audit.pendingFrames.delete(id); callback(time); });
        audit.pendingFrames.add(id);
        return id;
    };
    window.cancelAnimationFrame = id => { audit.pendingFrames.delete(id); nativeCancel(id); };
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
        new PerformanceObserver(list => audit.longTasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration })))).observe({ type: "longtask", buffered: true });
    }
    audit.sampleFrames = milliseconds => new Promise(resolve => {
        const start = performance.now();
        let previous;
        const gaps = [];
        function sample(time) {
            if (previous !== undefined) gaps.push(time - previous);
            previous = time;
            if (time - start < milliseconds) nativeFrame(sample);
            else resolve(gaps);
        }
        nativeFrame(sample);
    });
}

// [실제 경로 이동과 중간 프레임 / Real navigation and intermediate frames]
// 네이티브 고지를 닫고 실제 애니메이션을 정지·완료해 상태를 비교합니다.
// Dismiss native notices and pause or finish real animations for comparison.
function observe(page) {
    page.setDefaultTimeout(10000);
    page.on("dialog", dialog => dialog.dismiss().catch(() => {}));
    page.on("pageerror", error => report.errors.push({ route: page.url(), message: error.message }));
}

async function check(name, callback) {
    if (selectedCheck && !selectedCheck.test(name)) return;
    const result = { name, status: "running" };
    report.checks.push(result);
    try {
        result.detail = await callback();
        result.status = "passed";
        console.log(`PASS ${name}`);
    } catch (error) {
        result.status = "failed";
        result.error = error.stack || String(error);
        console.error(`FAIL ${name}: ${error.message}`);
    }
    save();
}

async function visit(page, route, { hold = true, heading = true } = {}) {
    // 이전 호버가 새 화면의 진입을 의도적으로 끝내지 않도록 포인터를 비워 둡니다.
    // Park the pointer so a prior hover cannot intentionally settle the next capture.
    await page.mouse.move(1, 1);
    await page.evaluate(({ route, hold }) => {
        window.__sitewideMotion.records = [];
        window.__sitewideMotion.hold = hold;
        location.hash = "#" + route;
    }, { route, hold });
    await page.waitForFunction(value => document.body.dataset.page === value.split("?")[0], route);
    await page.locator("#main h1").waitFor({ state: "attached" });
    // [소개 전용 진입 계약 / Story-specific entrance contract]
    // 소개의 h1은 정적으로 읽히며 전용 관찰자가 아래 장면의 모션을 관리합니다.
    // The story title stays static; its own observer manages the scenes below it.
    const pathname = route.split("?")[0];
    const story = pathname === "/about" || pathname === "/about/introduction";
    if (story) await page.locator("[data-story] #story-title").waitFor({ state: "visible" });
    else if (heading) await page.waitForFunction(() => window.__sitewideMotion.records.some(record => record.animation.id === "sejong-enter-heading"));
}

async function records(page) {
    return page.evaluate(() => window.__sitewideMotion.records.map(({ element, animation }) => ({
        id: animation.id,
        target: element.id || element.className || element.tagName,
        duration: animation.effect.getTiming().duration,
        delay: animation.effect.getTiming().delay,
        playState: animation.playState,
        connected: element.isConnected,
        frames: animation.effect.getKeyframes().map(({ opacity, transform, clipPath }) => ({ opacity, transform, clipPath })),
    })));
}

async function settle(page) {
    await page.evaluate(() => {
        window.__sitewideMotion.hold = false;
        window.__sitewideMotion.history.forEach(({ animation }) => { if (animation.playState === "paused") animation.finish(); });
    });
    // [finish 이벤트와 실제 효과 해제 / Finish events and effect removal]
    // finish() 직후의 finished 상태에는 fill 효과가 남을 수 있으므로 취소 콜백까지 기다립니다.
    // A finished animation can still apply fill until its completion handler cancels the effect.
    await page.waitForFunction(() => !window.__sitewideMotion.history.some(({ element, animation }) =>
        ["paused", "running"].includes(animation.playState) || element.getAnimations().includes(animation)));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function screenshot(page, filename) {
    await page.screenshot({ path: path.join(artifacts, filename), animations: "allow" });
    report.screenshots.push(filename);
}

async function reveal(page, selector) {
    await page.locator(selector).first().evaluate(element => element.scrollIntoView({ behavior: "instant", block: "center" }));
    await page.waitForFunction(value => {
        const target = document.querySelector(value);
        return window.__sitewideMotion.records.some(({ element, animation }) => element === target && animation.id.startsWith("sejong-enter-"));
    }, selector);
}

// [전체 화면군과 입력 조건 검증 / Verify route families and input conditions]
// 모든 경로의 진입, 화면 밖 대기, 포커스, 감소 설정과 정리를 함께 검증합니다.
// Verify route entries, offscreen scheduling, focus, reduced motion and lifecycle cleanup.
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/google/chrome/chrome", headless: true, args: ["--no-sandbox"] });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        observe(page);
        await page.addInitScript(instrumentation);
        await page.goto(base + "#/policy/privacy");
        await page.waitForSelector(".policy-content");
        const catalog = await page.evaluate(async () => (await import("./src/data/catalog.js")).PAGES.map(({ path, group }) => ({ path, group })));

        await check("Every catalog route has its intended page entrance", async () => {
            assert.equal(catalog.length, 140, "update the coverage document deliberately when the catalog changes");
            const groups = {};
            for (const item of catalog) {
                await visit(page, item.path, { heading: item.path !== "/" });
                groups[item.group] = (groups[item.group] || 0) + 1;
                const entry = await page.evaluate(() => {
                    const heading = document.querySelector("#main h1");
                    const entries = window.__sitewideMotion.records.filter(({ animation }) => animation.id === "sejong-enter-heading");
                    const story = document.querySelector("[data-story]");
                    const scenes = [...story?.querySelectorAll("[data-story-scene]") || []];
                    const observed = new Set(window.__sitewideMotion.observers.flatMap(observer => [...observer.auditTargets]));
                    return {
                        text: heading.textContent.trim(),
                        heading: entries.some(({ element }) => element === heading || element.contains(heading)),
                        count: entries.length,
                        story: story ? {
                            titleOpacity: getComputedStyle(heading).opacity,
                            titleAnimations: heading.getAnimations().length,
                            media: Boolean(story.querySelector("[data-story-media] img")),
                            sceneCount: scenes.length,
                            observedScenes: scenes.filter(scene => observed.has(scene)).length,
                        } : null,
                    };
                });
                assert.ok(entry.text.length > 0, `${item.path} has a readable heading`);
                assert.doesNotMatch(entry.text, /페이지를 불러오지 못했어요/, `${item.path} renderer succeeds`);
                if (["/about", "/about/introduction"].includes(item.path)) {
                    assert.ok(entry.story, `${item.path} renders the dedicated story`);
                    assert.equal(entry.story.titleOpacity, "1", "story title is readable without an entrance delay");
                    assert.equal(entry.story.titleAnimations, 0, "story title has one static owner");
                    assert.equal(entry.story.media, true, "story has its actual scroll media");
                    assert.ok(entry.story.sceneCount > 0, "story chapters exist");
                    assert.equal(entry.story.observedScenes, entry.story.sceneCount, "all story chapters have their dedicated observer");
                } else if (item.path !== "/") assert.equal(entry.heading, true, `${item.path} enters its actual h1 surface`);
                report.routes.push({ ...item, ...entry });
            }
            return { total: catalog.length, groups };
        });

        for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
            const width = viewport.width;
            await page.setViewportSize(viewport);
            await check(`${width}px page, media and group entrances have actual midpoint frames`, async () => {
                await visit(page, "/programs/carmen");
                const initial = await records(page);
                assert.ok(initial.some(record => record.id === "sejong-enter-heading"));
                assert.ok(initial.some(record => record.id === "sejong-enter-media"));
                const midpoint = await page.evaluate(() => window.__sitewideMotion.records.filter(({ animation }) => animation.id.startsWith("sejong-enter-")).map(({ element, animation }) => ({
                    id: animation.id,
                    opacity: Number(getComputedStyle(element).opacity),
                    transform: getComputedStyle(element).transform,
                    clipPath: getComputedStyle(element).clipPath,
                    progress: animation.effect.getComputedTiming().progress,
                    time: animation.currentTime,
                    duration: animation.effect.getTiming().duration,
                })));
                assert.ok(midpoint.some(frame => frame.opacity > 0 && frame.opacity < 1), "actual paused animation exposes an intermediate frame");
                assert.ok(midpoint.filter(frame => frame.id === "sejong-enter-media").every(frame => frame.clipPath !== "none"));
                await screenshot(page, `program-${width}-midpoint.png`);
                await settle(page);
                assert.equal(await page.locator(".program-detail-artwork").evaluate(element => getComputedStyle(element).clipPath), "none");
                await screenshot(page, `program-${width}-settled.png`);

                await visit(page, "/news/goods");
                await reveal(page, ".goods-grid > :first-child");
                const group = (await records(page)).filter(record => record.id === "sejong-enter-group");
                assert.ok(group.length > 0, "visible collection items receive group entry");
                assert.ok(group.every(record => record.delay <= 105 && record.duration <= 300), "long collections never accumulate excessive delay");
                const overlap = await page.evaluate(() => {
                    const entries = window.__sitewideMotion.records.filter(({ animation }) => animation.id.startsWith("sejong-enter-"));
                    return entries.some((child, index) => entries.some((parent, other) => index !== other && parent.element !== child.element && parent.element.contains(child.element)));
                });
                assert.equal(overlap, false, "parent and child entrances do not compound opacity or travel");
                await screenshot(page, `goods-${width}-midpoint.png`);
                const firstProduct = page.locator(".goods-grid > :first-child");
                await firstProduct.locator("a").hover();
                assert.equal(await firstProduct.evaluate(element => element.getAnimations().length), 0, "pointer entry resolves the active target without delaying navigation");
                await settle(page);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "entry effects do not introduce horizontal overflow");

                await visit(page, "/news");
                await reveal(page, ".news-editorial-feature > img");
                const newsMedia = await page.locator(".news-editorial-feature > img").evaluate(element => element.getAnimations().map(animation => ({ id: animation.id, state: animation.playState })));
                assert.ok(newsMedia.some(animation => animation.id === "sejong-enter-media" && animation.state === "paused"), "news overview animates its actual image, not a nonexistent nested anchor");
                await screenshot(page, `news-${width}-midpoint.png`);
                await settle(page);
                return { midpoint, group, newsMedia };
            });

            await check(`${width}px offscreen entrances are visible by default, one-shot and focus-safe`, async () => {
                // [현재 공통 모션 대상 / Current shared-motion target]
                // 대관 절차의 마지막 항목은 실제 공통 group 대상이며 키보드로 접근할 링크를 포함합니다.
                // The final rental preparation item is a real shared group surface with a native link.
                await visit(page, "/rental");
                const selector = "#rental-preparation .overview-process > li:last-child";
                const initial = await page.locator(selector).evaluate(element => ({ top: element.getBoundingClientRect().top, opacity: getComputedStyle(element).opacity, transform: getComputedStyle(element).transform, animations: element.getAnimations().length }));
                assert.ok(initial.top > viewport.height, "fixture begins outside the viewport");
                assert.equal(initial.opacity, "1", "offscreen content has a readable default state");
                assert.equal(initial.animations, 0, "offscreen entry does not run early");
                await page.locator(selector + " a").focus();
                await page.locator(selector).evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
                await page.waitForTimeout(50);
                assert.equal(await page.locator(selector).evaluate(element => element.getAnimations().length), 0, "keyboard focus resolves a pending entry");

                await visit(page, "/sitemap");
                await visit(page, "/rental");
                await reveal(page, selector);
                assert.ok(await page.locator(selector).evaluate(element => element.getAnimations().some(animation => animation.playState === "paused")), "actual entrance can be inspected while active");
                await page.locator(selector + " a").focus();
                assert.equal(await page.locator(selector).evaluate(element => element.getAnimations().length), 0, "focus resolves an active entry");
                const count = await page.evaluate(selector => window.__sitewideMotion.records.filter(({ element }) => element.matches(selector)).length, selector);
                await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
                await page.locator(selector).evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
                await page.waitForTimeout(50);
                assert.equal(await page.evaluate(selector => window.__sitewideMotion.records.filter(({ element }) => element.matches(selector)).length, selector), count, "re-entering the viewport does not repeat entry");
                await settle(page);
                return initial;
            });

            await check(`${width}px reduced motion resolves active entries and preserves all content`, async () => {
                await visit(page, "/programs/carmen");
                assert.ok((await records(page)).some(record => record.playState === "paused"));
                await page.emulateMedia({ reducedMotion: "reduce" });
                await page.waitForFunction(() => !window.__sitewideMotion.history.some(({ animation }) => ["paused", "running"].includes(animation.playState)));
                await visit(page, "/visit", { heading: false });
                assert.equal((await records(page)).filter(record => record.id.startsWith("sejong-enter-")).length, 0);
                const visibility = await page.locator(".overview-intro-copy, .overview-intro-media, .page-title-row").evaluateAll(elements => elements.map(element => ({ opacity: getComputedStyle(element).opacity, transform: getComputedStyle(element).transform, clip: getComputedStyle(element).clipPath })));
                assert.ok(visibility.every(item => item.opacity === "1" && item.transform === "none" && item.clip === "none"));
                await screenshot(page, `visit-${width}-reduced.png`);
                await page.emulateMedia({ reducedMotion: "no-preference" });
                return visibility;
            });

            await check(`${width}px route interruption disposes animations, observers and scheduled frames`, async () => {
                for (const route of ["/about", "/programs/carmen", "/visit", "/news/goods", "/about", "/policy/privacy"]) await visit(page, route);
                await settle(page);
                await page.waitForTimeout(120);
                const state = await page.evaluate(() => ({
                    detachedAnimations: window.__sitewideMotion.history.filter(({ element, animation }) => !element.isConnected && ["paused", "running"].includes(animation.playState)).length,
                    detachedObserved: window.__sitewideMotion.observers.flatMap(observer => [...observer.auditTargets]).filter(element => !element.isConnected).length,
                    pendingFrames: window.__sitewideMotion.pendingFrames.size,
                    readingAnimation: window.__sitewideMotion.records.some(({ element }) => element.matches(".policy-content, .policy-content section, .policy-content p")),
                }));
                assert.equal(state.detachedAnimations, 0);
                assert.equal(state.detachedObserved, 0);
                assert.equal(state.pendingFrames, 0);
                assert.equal(state.readingAnimation, false, "legal reading content remains still");
                return state;
            });

            await check(`${width}px playback performance sample is recorded without a device-performance claim`, async () => {
                await visit(page, "/about", { hold: false });
                const sample = await page.evaluate(async () => {
                    const start = performance.now();
                    const gaps = await window.__sitewideMotion.sampleFrames(900);
                    const ordered = [...gaps].sort((a, b) => a - b);
                    return { start, gaps, frames: gaps.length, p95GapMs: ordered[Math.floor((ordered.length - 1) * 0.95)], maximumGapMs: Math.max(...gaps), longTasks: window.__sitewideMotion.longTasks.filter(entry => entry.start >= start) };
                });
                assert.ok(sample.frames > 0, "sample observes real frame callbacks");
                report.samples.push({ viewport, ...sample, limitation: "Headless desktop Chrome with a resized viewport; not a physical mobile-device benchmark." });
                return { frames: sample.frames, p95GapMs: sample.p95GapMs, maximumGapMs: sample.maximumGapMs, longTasks: sample.longTasks.length };
            });
        }

        await check("Local category replacement releases removed entrance targets", async () => {
            await page.setViewportSize({ width: 390, height: 844 });
            await visit(page, "/", { hold: false, heading: false });
            await page.locator('[data-home-category="전시"]').click();
            await page.waitForFunction(() => !window.__sitewideMotion.observers.some(observer => [...observer.auditTargets].some(element => !element.isConnected)));
            assert.equal(await page.locator('[data-home-category="전시"]').getAttribute("aria-pressed"), "true");
            assert.ok(await page.locator("#home-program-results .program-card").count() > 0);
            await visit(page, "/policy/privacy");
            await settle(page);
        });

        await check("Same-path filters preserve focus and scroll without repeating page entrances", async () => {
            await page.setViewportSize({ width: 1440, height: 1000 });
            await visit(page, "/visit/support/faq");
            await settle(page);
            const input = page.locator("#faq-search");
            await input.fill("주차");
            await input.focus();
            await page.evaluate(() => scrollTo({ top: 180, behavior: "instant" }));
            const before = await page.evaluate(() => scrollY);
            await page.evaluate(() => { window.__sitewideMotion.records = []; window.__sitewideMotion.hold = true; });
            await input.press("Enter");
            await page.waitForFunction(() => location.hash.includes("search=") && document.querySelector("#faq-search")?.value === "주차");
            await page.waitForFunction(() => window.__sitewideMotion.records.some(({ animation }) => animation.id === "sejong-content"));
            const result = await page.evaluate(() => ({ focus: document.activeElement.id, scroll: scrollY, entrances: window.__sitewideMotion.records.filter(({ animation }) => animation.id.startsWith("sejong-enter-")).length }));
            assert.equal(result.focus, "faq-search");
            assert.ok(Math.abs(result.scroll - before) <= 1);
            assert.equal(result.entrances, 0);
            await settle(page);
            return result;
        });

        await check("Pages stay readable when IntersectionObserver is unavailable", async () => {
            const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
            observe(fallback);
            await fallback.addInitScript(() => { delete window.IntersectionObserver; });
            await fallback.goto(base + "#/programs/carmen");
            await fallback.waitForSelector(".program-detail-artwork");
            assert.equal(await fallback.locator(".program-detail-summary h1").evaluate(element => getComputedStyle(element).opacity), "1");
            assert.equal(await fallback.locator(".program-detail-artwork").evaluate(element => getComputedStyle(element).clipPath), "none");
            await fallback.close();
        });

        assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
        report.status = report.checks.some(item => item.status === "failed") ? "failed" : "passed";
    } catch (error) {
        report.status = "failed";
        report.fatal = error.stack || String(error);
        console.error(error);
    } finally {
        report.finishedAt = new Date().toISOString();
        save();
        await browser.close();
    }
    if (report.status !== "passed") process.exitCode = 1;
    else console.log(`PASS sitewide motion: ${report.routes.length} routes, ${report.checks.length} checks; ${reportPath}`);
})();
