const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

// [검증 대상과 증거 경로 / Verification target and evidence paths]
// 결과와 화면은 실행마다 같은 디렉터리에 함께 저장합니다.
// Keep the current run report and screenshots together.
const root = path.resolve(__dirname, "../..");
const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v4/index.html";
const origin = new URL(base).origin;
const versionRoot = new URL("./", base).pathname;
const artifactDirectory = path.join(root, "v4", ".lemonade", "site-interactions");
const selectedChecks = process.env.SEJONG_SITE_CHECKS;
const reportPath = path.join(artifactDirectory, selectedChecks ? "browser-recheck-results.json" : "browser-results.json");
const report = {
    startedAt: new Date().toISOString(),
    target: base,
    status: "running",
    checks: [],
    routes: [],
    homeWidths: [],
    screenshots: [],
    browserErrors: [],
    consoleErrors: [],
    failedRequests: [],
    failedResponses: [],
};
fs.mkdirSync(artifactDirectory, { recursive: true });

function saveReport() {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
}

// [실제 브라우저 오류 수집 / Collect real browser failures]
// 화면 오류와 실패한 로컬 자원 요청을 페이지 주소와 함께 기록합니다.
// Associate runtime and local resource failures with the current page.
function observe(page) {
    page.setDefaultTimeout(10000);
    page.on("dialog", (dialog) => dialog.dismiss().catch(() => {}));
    page.on("pageerror", (error) => {
        report.browserErrors.push({ page: page.url(), message: error.message });
    });
    page.on("console", (message) => {
        if (message.type() === "error") {
            report.consoleErrors.push({ page: page.url(), message: message.text() });
        }
    });
    page.on("requestfailed", (request) => {
        const message = request.failure()?.errorText || "Unknown request failure";
        if (new URL(request.url()).origin === origin && !message.includes("ERR_ABORTED")) {
            report.failedRequests.push({ page: page.url(), url: request.url(), message });
        }
    });
    page.on("response", (response) => {
        if (new URL(response.url()).origin === origin && response.status() >= 400) {
            report.failedResponses.push({ page: page.url(), url: response.url(), status: response.status() });
        }
    });
}

async function check(name, run) {
    if (selectedChecks && !new RegExp(selectedChecks).test(name)) return;
    const result = { name, status: "running" };
    report.checks.push(result);
    const started = Date.now();
    try {
        const detail = await run();
        result.status = "passed";
        if (detail !== undefined) result.detail = detail;
        console.log(`PASS ${name}`);
    } catch (error) {
        result.status = "failed";
        result.error = error.stack || String(error);
        console.error(`FAIL ${name}: ${error.message}`);
    } finally {
        result.durationMs = Date.now() - started;
        saveReport();
    }
}

async function visit(page, route) {
    await page.evaluate((value) => { location.hash = "#" + value; }, route);
    await page.waitForFunction(
        (value) => document.body.dataset.page === value.split("?")[0],
        route,
    );
    await page.locator("main h1").waitFor({ state: "attached" });
}

// [지연 이미지까지 실제로 확인 / Inspect lazy images after loading]
// 이미지를 스크롤하고 디코딩하여 요청되지 않은 누락 자원도 발견합니다.
// Scroll and decode images so unrequested assets cannot escape verification.
async function loadImages(page) {
    return page.evaluate(async () => {
        for (const image of document.images) {
            // Hidden mobile previews still need asset validation; scrolling cannot trigger their lazy load.
            image.loading = "eager";
            if (!image.complete) {
                image.scrollIntoView({ block: "center", behavior: "instant" });
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                if (!image.complete) {
                    await new Promise((resolve) => {
                        const timer = setTimeout(done, 5000);
                        function done() {
                            clearTimeout(timer);
                            image.removeEventListener("load", done);
                            image.removeEventListener("error", done);
                            resolve();
                        }
                        image.addEventListener("load", done, { once: true });
                        image.addEventListener("error", done, { once: true });
                    });
                }
            }
            if (image.complete && image.naturalWidth) {
                await image.decode().catch(() => {});
            }
        }
        scrollTo({ top: 0, behavior: "instant" });
        return [...document.images]
            .filter((image) => !image.complete || !image.naturalWidth)
            .map((image) => ({ source: image.currentSrc || image.src, complete: image.complete }));
    });
}

// [모든 공개 경로의 동작 계약 / Behavioral contracts for every published route]
// 제목·링크·이미지·너비와 v4 내부 자원 경로를 함께 확인합니다.
// Check headings, links, media, width and resources within the version directory.
async function inspectRoute(page, route, width, publishedRoutes) {
    const outcome = { route, viewport: width, status: "running" };
    report.routes.push(outcome);
    try {
        await visit(page, route);
        const badImages = await loadImages(page);
        const info = await page.evaluate(() => ({
            heading: document.querySelector("main h1")?.textContent.trim(),
            headingCount: document.querySelectorAll("main h1").length,
            text: document.querySelector("main").innerText,
            scrollWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
            duplicateIds: [...document.querySelectorAll("[id]")].map(element => element.id)
                .filter((id, index, ids) => ids.indexOf(id) !== index),
            missingLabelTargets: [...document.querySelectorAll("label[for]")]
                .map(element => element.htmlFor).filter(id => !document.getElementById(id)),
            nestedControls: [...document.querySelectorAll("a a, a button, button a, button button")]
                .map(element => element.outerHTML.slice(0, 160)),
            links: [...document.querySelectorAll('main a[href^="#/"]')]
                .map((link) => link.getAttribute("href").slice(1).split("?")[0]),
            resources: [
                ...[...document.images].map((image) => image.currentSrc || image.src),
                ...[...document.querySelectorAll("svg use[href]")]
                    .map((use) => new URL(use.getAttribute("href"), location.href).href),
            ],
        }));
        outcome.heading = info.heading;
        outcome.scrollWidth = info.scrollWidth;
        outcome.badImages = badImages;
        outcome.brokenLinks = [...new Set(info.links.filter((link) =>
            !publishedRoutes.has(link) && !link.startsWith("/booking/") && !link.startsWith("/apply/"),
        ))];
        outcome.outsideVersion = [...new Set(info.resources.filter((resource) => {
            const url = new URL(resource);
            return url.origin === origin && !url.pathname.startsWith(versionRoot);
        }))];
        assert(info.heading, `${route}: missing heading`);
        assert.equal(info.headingCount, 1, `${route}: needs exactly one main heading`);
        assert.deepEqual(info.duplicateIds, [], `${route}: duplicate IDs`);
        assert.deepEqual(info.missingLabelTargets, [], `${route}: missing label targets`);
        assert.deepEqual(info.nestedControls, [], `${route}: nested interactive controls`);
        assert(!/페이지를 (?:불러오지 못했|찾을 수 없)/.test(info.text), `${route}: fallback content`);
        assert(info.scrollWidth <= info.viewportWidth, `${route}: ${info.scrollWidth}px content exceeds ${info.viewportWidth}px viewport`);
        assert.deepEqual(badImages, [], `${route}: failed or unloaded images`);
        assert.deepEqual(outcome.brokenLinks, [], `${route}: unknown internal link`);
        assert.deepEqual(outcome.outsideVersion, [], `${route}: image or icon escapes v4`);
        outcome.status = "passed";
    } catch (error) {
        outcome.status = "failed";
        outcome.error = error.message;
    }
}

(async () => {
    let browser;
    try {
        browser = await chromium.launch({
            executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
            headless: true,
            args: ["--no-sandbox"],
        });
        const desktop = await browser.newContext({
            viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce",
        });
        const mobile = await browser.newContext({
            viewport: { width: 390, height: 844 }, reducedMotion: "reduce",
            isMobile: true, hasTouch: true,
        });
        const page = await desktop.newPage();
        const phone = await mobile.newPage();
        observe(page);
        observe(phone);

        // [진입과 콘텐츠 보존 / Entry and content preservation]
        // 이전 버전 선택과 공개 콘텐츠의 보존을 먼저 확인합니다.
        // Verify access to previous versions and preservation of published content.
        await check("entry offers all four versions", async () => {
            await page.goto(origin + "/", { waitUntil: "networkidle" });
            const destinations = await page.locator("a[href]").evaluateAll((links) =>
                links.map((link) => ({ path: new URL(link.href).pathname, visible: link.checkVisibility() })),
            );
            for (const destination of ["/legacy.html", "/v2/index.html", "/v3/index.html", "/v4/index.html"]) {
                assert(destinations.some((link) => link.path === destination && link.visible), destination);
            }
            return { destinations: destinations.filter((link) => link.visible).map((link) => link.path) };
        });

        await page.goto(base, { waitUntil: "networkidle" });
        await page.locator(".season-hero").waitFor();
        const routes = await page.evaluate(async () => {
            const catalog = await import(new URL("src/data/catalog.js", location.href).href);
            return catalog.PAGES.map((item) => item.path);
        });
        const originals = await import(pathToFileURL(path.join(root, "v3", "src", "data", "catalog.js")).href);
        await check("v4 preserves existing routes and includes the completed services", async () => {
            assert.equal(new Set(routes).size, routes.length, "published routes are unique");
            for (const item of originals.PAGES) assert(routes.includes(item.path), item.path + " is preserved");
            for (const route of ["/visit/plan", "/rental/compare", "/news/notices/recruit/apply", "/news/goods/art-postcards", "/news/goods/canvas-bag", "/news/goods/viewing-journal", "/news/goods/cart", "/news/goods/orders"]) {
                assert(routes.includes(route), route + " is registered");
            }
            const programs = await page.evaluate(async () => {
                const catalog = await import(new URL("src/data/catalog.js", location.href).href);
                return catalog.PROGRAMS.map((item) => item.id);
            });
            assert.equal(programs.length, 15);
            assert.deepEqual(programs, originals.PROGRAMS.map((item) => item.id));
            report.publishedRouteCount = routes.length;
            return { routes: routes.length, programs: programs.length };
        });

        await check("local Pretendard font loads from v4", async () => {
            await page.evaluate(() => document.fonts.ready);
            const font = await page.evaluate(async () => {
                await document.fonts.load('18px "Pretendard Variable"', "세종문화회관");
                return {
                    loaded: [...document.fonts].some((item) => item.family.replaceAll('"', "") === "Pretendard Variable" && item.status === "loaded"),
                    resources: performance.getEntriesByType("resource").filter((item) => item.name.endsWith(".woff2")).map((item) => item.name),
                };
            });
            assert(font.loaded, "Pretendard face must finish loading");
            assert(font.resources.some((resource) => new URL(resource).pathname === versionRoot + "assets/fonts/PretendardVariable.woff2"));
            return font;
        });

        await phone.goto(base, { waitUntil: "networkidle" });
        await phone.locator(".season-hero").waitFor();
        const published = new Set(routes);
        for (const [target, width] of [[page, 1440], [phone, 390], [phone, 320]]) {
            await target.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
            await check(`${routes.length} routes at ${width}px`, async () => {
                for (const route of routes) await inspectRoute(target, route, width, published);
                const failed = report.routes.filter((item) => item.viewport === width && item.status === "failed");
                assert.deepEqual(failed, [], `route regressions at ${width}px`);
                return { executed: routes.length, passed: routes.length - failed.length };
            });
        }

        // [반응형 구성 / Responsive layout]
        // 전체 경로 검증 외에 작은 휴대폰과 중간 너비의 홈도 확인합니다.
        // Add compact-phone and intermediate homepage widths to the route sweeps.
        await check("homepage at 320, 768 and 1024px", async () => {
            for (const width of [320, 768, 1024]) {
                await phone.setViewportSize({ width, height: 1000 });
                await visit(phone, "/");
                const images = await loadImages(phone);
                const info = await phone.evaluate(() => ({
                    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
                    membership: !!document.querySelector(".home-news-layout aside.membership-feature"),
                    hero: document.querySelector(".season-stage").getBoundingClientRect().width,
                }));
                report.homeWidths.push({ ...info, badImages: images });
                assert(info.scrollWidth <= info.width, `${width}px: horizontal overflow`);
                assert.deepEqual(images, [], `${width}px: unloaded images`);
                assert(info.membership, `${width}px: membership aside is present with news`);
                assert(info.hero > 0, `${width}px: hero is visible`);
            }
            await phone.setViewportSize({ width: 390, height: 844 });
            return report.homeWidths;
        });

        // [확대된 글자와 새 이용 흐름 / Enlarged text in completed experiences]
        // 실제 조작 버튼과 입력을 유지한 채 좁은 화면에서 200% 글자를 확인합니다.
        // Preserve controls and fields while testing 200% text on a narrow viewport.
        await check("new services reflow at 320px with 200% text", async () => {
            await page.setViewportSize({ width: 320, height: 1000 });
            await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
            try {
                for (const route of ["/visit/plan", "/rental/compare", "/about", "/search?q=세종", "/news/goods/art-postcards", "/news/goods/cart", "/visit/directions", "/about/disclosure", "/news/notices/recruit/apply", "/visit/support/faq"]) {
                    await visit(page, route);
                    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: enlarged text overflows`);
                }
                await page.locator('[data-open-dialog="menu-dialog"]').click();
                const close = page.locator('#menu-dialog [data-close-dialog]');
                await close.focus();
                assert(await close.evaluate(element => element === document.activeElement));
                await page.keyboard.press("Escape");
                await page.locator("#menu-dialog").waitFor({ state: "hidden" });
            } finally {
                await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
                await page.setViewportSize({ width: 1440, height: 1000 });
            }
        });

        // [실제 사용자 조작 / Real user interactions]
        // 필터·저장·검색·메뉴·예매 흐름을 실제 화면에서 진행합니다.
        // Exercise filters, persistence, search, menus and booking in the rendered UI.
        await check("home filters preserve program counts", async () => {
            await page.setViewportSize({ width: 1440, height: 1000 });
            await visit(page, "/");
            const counts = {};
            for (const [category, expected] of [["전체", 4], ["공연", 4], ["전시", 2], ["교육", 3]]) {
                const control = page.locator(`[data-home-category="${category}"]`);
                await control.click();
                counts[category] = await page.locator("#home-program-results .program-card").count();
                assert.equal(counts[category], expected);
                assert.equal(await control.getAttribute("aria-pressed"), "true");
                assert.equal(await page.locator('[data-home-category][aria-pressed="true"]').count(), 1);
            }
            await page.locator('[data-home-category="전체"]').click();
            return counts;
        });

        await check("favorites persist and leave legacy and v2 storage intact", async () => {
            await visit(page, "/");
            const preserved = {
                "sejong:favorites": '["legacy-visitor"]',
                "sejong-v2:favorites": '["renewal-visitor"]',
                "sejong-v3:favorites": '["v3-visitor"]',
                "sejong:bookings": '[{"id":"legacy-record"}]',
                "sejong-v2:bookings": '[{"id":"v2-record"}]',
                "sejong-v3:bookings": '[{"id":"v3-record"}]',
            };
            await page.evaluate((values) => {
                for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
            }, preserved);
            let card = page.locator("#home-program-results .program-card").first();
            let favorite = card.locator("[data-favorite]");
            const id = await favorite.getAttribute("data-favorite");
            await card.hover();
            await favorite.click();
            assert.equal(await favorite.getAttribute("aria-pressed"), "true");
            assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("sejong-v4:favorites"))), [id]);
            await page.reload({ waitUntil: "networkidle" });
            card = page.locator("#home-program-results .program-card").first();
            favorite = card.locator("[data-favorite]");
            assert.equal(await favorite.getAttribute("aria-pressed"), "true");
            await card.hover();
            await favorite.click();
            assert.equal(await favorite.getAttribute("aria-pressed"), "false");
            assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("sejong-v4:favorites"))), []);
            assert.deepEqual(await page.evaluate((values) => Object.fromEntries(Object.keys(values).map((key) => [key, localStorage.getItem(key)])), preserved), preserved);
            await phone.setViewportSize({ width: 390, height: 844 });
            await visit(phone, "/");
            assert.equal(await phone.locator(".card--poster .favorite-button").first().evaluate((element) => getComputedStyle(element).opacity), "1", "touch favorites remain visible");
            return { program: id, namespace: "sejong-v4:", otherVersionKeysPreserved: Object.keys(preserved) };
        });

        await check("search submits and menu Escape restores focus", async () => {
            await visit(page, "/");
            await page.locator('[data-open-dialog="search-dialog"]').click();
            await page.locator("#global-query").fill("카르멘");
            await page.locator("#global-query").press("Enter");
            await page.waitForFunction(() => document.body.dataset.page === "/search");
            assert((await page.locator("main").innerText()).includes("카르멘"));
            assert(await page.locator(".search-result").count() > 0);
            assert.equal(await page.locator("#search-dialog").isVisible(), false);
            for (const target of [page, phone]) {
                const opener = target.locator('[data-open-dialog="menu-dialog"]');
                await opener.click();
                await target.locator("#menu-dialog").waitFor({ state: "visible" });
                await target.keyboard.press("Escape");
                await target.locator("#menu-dialog").waitFor({ state: "hidden" });
                assert(await opener.evaluate((element) => element === document.activeElement));
            }
        });

        await check("reduced motion starts paused and supports carousel controls", async () => {
            await page.goto(base, { waitUntil: "networkidle" });
            const current = page.locator("[data-season-current]");
            const pause = page.locator('[data-hero="pause"]');
            assert.equal(await current.textContent(), "01");
            assert.equal(await pause.getAttribute("aria-pressed"), "true");
            await page.locator('[data-hero="next"]').click();
            assert.equal(await current.textContent(), "02");
            await page.locator('[data-hero="previous"]').click();
            assert.equal(await current.textContent(), "01");
            await page.locator('[data-hero="next"]').focus();
            await page.keyboard.press("ArrowRight");
            assert.equal(await current.textContent(), "02");
            await page.keyboard.press("ArrowLeft");
            assert.equal(await current.textContent(), "01");
            assert.equal(await page.locator(".season-track.is-moving").count(), 0);
            await pause.click();
            assert.equal(await pause.getAttribute("aria-pressed"), "false");
            assert.equal(await pause.getAttribute("aria-label"), "자동 재생 일시정지");
            await pause.click();
            assert.equal(await pause.getAttribute("aria-pressed"), "true");
            assert.equal(await page.locator(".season-slide.is-active").count(), 1);
        });

        await check("booking completes, persists and cancels in v4", async () => {
            await phone.setViewportSize({ width: 390, height: 844 });
            await visit(phone, "/booking/carmen?date=2026-10-16");
            assert.equal(await phone.locator("[name=date]").inputValue(), "2026-10-16");
            await phone.locator("[data-booking-date] button[type=submit]").click();
            await phone.locator("[data-seat]:not(:disabled)").first().click();
            await phone.locator("[data-booking-next]").click();
            await phone.selectOption("[name=discount]", "membership");
            assert.equal(await phone.locator("[data-review-total]").innerText(), "72,000원");
            await phone.fill("[name=name]", "기능 검증 관람객");
            await phone.fill("[name=email]", "visitor@example.com");
            await phone.fill("[name=phone]", "01012345678");
            await phone.check("[name=consent]");
            await phone.locator("[data-booking-review] button[type=submit]").click();
            await phone.locator(".flow-receipt").waitFor();
            const saved = await phone.evaluate(() => JSON.parse(localStorage.getItem("sejong-v4:bookings")));
            assert.equal(saved.length, 1);
            assert.equal(saved[0].programId, "carmen");
            assert.equal(saved[0].total, 72000);
            assert.equal(saved[0].status, "confirmed");
            assert.equal(saved[0].seats.length, 1);
            await phone.reload({ waitUntil: "networkidle" });
            await visit(phone, "/account/bookings");
            await phone.locator("[data-cancel-booking]").first().click();
            await phone.locator('[role="alertdialog"]').waitFor();
            await phone.locator("[data-cancel-confirm]").click();
            assert((await phone.locator(".account-booking").innerText()).includes("취소 완료"));
            const cancelled = await phone.evaluate(() => JSON.parse(localStorage.getItem("sejong-v4:bookings"))[0]);
            assert.equal(cancelled.id, saved[0].id);
            assert.equal(cancelled.status, "cancelled");
            assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            return { program: "carmen", total: saved[0].total, status: cancelled.status };
        });

        await check("membership destination and neutral homepage controls", async () => {
            await visit(page, "/");
            const membership = page.locator(".home-news-layout aside.membership-feature");
            await membership.waitFor({ state: "attached" });
            const link = membership.locator('a[href="#/news/membership"]');
            assert(await link.count() > 0);
            const colors = await page.evaluate(() => ({
                heroAction: getComputedStyle(document.querySelector(".season-slide.is-active .button")).backgroundColor,
                currentTag: [...document.querySelectorAll(".poster-tag.today")].map((element) => getComputedStyle(element).backgroundColor),
            }));
            for (const [name, color] of Object.entries(colors)) {
                for (const value of Array.isArray(color) ? color : [color]) {
                    assert.notEqual(value, "rgb(255, 232, 0)", `${name}: yellow fill should be neutral`);
                }
            }
            await link.first().click();
            await page.waitForFunction(() => document.body.dataset.page === "/news/membership");
            assert(await page.locator("main h1").innerText());
            return colors;
        });

        // [현재 실행의 시각적 증거 / Visual evidence from this run]
        // 글꼴과 이미지 준비 후 데스크톱·모바일 전체 화면을 저장합니다.
        // Capture complete desktop and mobile pages after fonts and images are ready.
        await check("desktop and mobile homepage screenshots", async () => {
            for (const [target, name, width, height] of [[page, "desktop", 1440, 1000], [phone, "mobile", 390, 844]]) {
                await target.setViewportSize({ width, height });
                await target.goto(base, { waitUntil: "networkidle" });
                await target.evaluate(() => document.fonts.ready);
                assert.deepEqual(await loadImages(target), []);
                const screenshot = path.join(artifactDirectory, `${name}.png`);
                await target.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
                report.screenshots.push({ name, path: path.relative(root, screenshot), width, height });
            }
            return report.screenshots;
        });

        await check("no browser errors, failed local requests or HTTP errors", async () => {
            for (const name of ["browserErrors", "consoleErrors", "failedRequests", "failedResponses"]) {
                assert.deepEqual(report[name], [], name);
            }
        });
        report.status = report.checks.every((item) => item.status === "passed") ? "passed" : "failed";
        report.completedAt = new Date().toISOString();
        saveReport();
        const failed = report.checks.filter((item) => item.status === "failed");
        console.log(`${report.routes.length} route/viewport checks; ${report.checks.length - failed.length}/${report.checks.length} groups passed. Report: ${reportPath}`);
        assert.deepEqual(failed.map((item) => item.name), [], "v4 browser regression failures");
    } catch (error) {
        report.status = "failed";
        report.fatalError = error.stack || String(error);
        report.completedAt = new Date().toISOString();
        saveReport();
        console.error(error);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
    }
})();
