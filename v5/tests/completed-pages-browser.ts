import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { expect } from "playwright/test";
import type { BrowserContext, Page } from "playwright";
import { COMPLETION_PATHS } from "../src/page-completion/manifest.ts";
import { PAGES } from "../src/data/catalog.ts";
import type { CatalogSnapshot } from "../src/catalog/types.ts";
import type { CompletionPage } from "../src/page-completion/types.ts";

// [실제 89개 경로의 읽기 전용 브라우저 검증 / Read-only browser verification of the 89 real routes]
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const directory = fileURLToPath(new URL("../../.lemonade/site-completion/", import.meta.url));
const base = (process.argv.find(argument => /^https?:/.test(argument)) || "http://127.0.0.1:4174/v5/").replace(/\/?$/, "/");
const smoke = process.argv.includes("--smoke");
const runLabel = (process.argv.find(argument => argument.startsWith("--label="))?.slice(8) || (new URL(base).port === "4174" ? "dev" : "static")).replace(/[^a-z0-9-]/gi, "-");
fs.mkdirSync(directory, { recursive: true });
const snapshot = JSON.parse(fs.readFileSync(path.join(projectRoot, "src/generated/catalog-snapshot.json"), "utf8")) as CatalogSnapshot;
const expected = new Map(snapshot.pages.filter(page => (page as { completion?: CompletionPage }).completion).map(page => [page.path, (page as { completion: CompletionPage }).completion]));
assert.equal(expected.size, 89, "The database export must contain all 89 completion payloads.");
const environment = fs.readFileSync(path.join(projectRoot, ".env.local"), "utf8");
const backend = environment.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^\r\n"']+)/m)?.[1];
const backendOrigin = backend ? new URL(backend).origin : undefined;
const representatives = ["/about/esg", "/visit/directions", "/rental/compare", "/rental/schedule", "/visit/support/faq", "/news/goods", "/visit/support/inquiry", "/sitemap"];
const results: Record<string, unknown>[] = [];
const failures: { name: string; error: string }[] = [];
const runtimeErrors: { route: string; width: number; message: string; stack?: string; source?: string }[] = [];
const blockedWrites: { method: string; endpoint: string }[] = [];
const requestCounts = { publicCatalogReads: 0, publicGoodsReads: 0 };
const browser = await chromium.launch();
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
const filename = (route: string) => route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-");

// [접수·인증 쓰기를 차단하고 공개 자료만 읽기 / Block authentication and service writes while allowing public reads]
async function readonlyContext(width: number): Promise<BrowserContext> {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, timezoneId: "Asia/Seoul", reducedMotion: "reduce" });
    if (backendOrigin) await context.route(url => url.origin === backendOrigin, async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (request.method() === "POST" && url.pathname === "/rest/v1/rpc/sejong_catalog_snapshot") {
            requestCounts.publicCatalogReads += 1;
            return route.continue();
        }
        if (["GET", "HEAD", "OPTIONS"].includes(request.method())) {
            if (url.pathname === "/rest/v1/sejong_service_goods") requestCounts.publicGoodsReads += 1;
            return route.continue();
        }
        blockedWrites.push({ method: request.method(), endpoint: url.pathname });
        return route.abort("blockedbyclient");
    });
    return context;
}

function track(page: Page) {
    page.on("pageerror", error => runtimeErrors.push({ route: new URL(page.url()).pathname, width: page.viewportSize()?.width || 0, message: error.message, stack: error.stack }));
    page.on("console", message => {
        if (message.type() === "error" && /hydration|did not match|uncaught|cannot.*contain|validateDOMNesting/i.test(message.text())) runtimeErrors.push({ route: new URL(page.url()).pathname, width: page.viewportSize()?.width || 0, message: message.text(), source: message.location().url });
    });
    page.setDefaultTimeout(15000);
}

async function go(page: Page, route: string) {
    const response = await page.goto(new URL(route.replace(/^\//, "") + "/", base).href, { waitUntil: "domcontentloaded", timeout: 60000 });
    assert.equal(response?.status(), 200, `${route}: HTTP 200`);
    await page.locator('[data-component-id="completed-page"] .completed-main').waitFor({ state: "visible" });
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    return response?.status();
}

async function check(name: string, run: () => Promise<Record<string, unknown> | void>, page?: Page) {
    try {
        const evidence = await run();
        results.push({ name, passed: true, ...(evidence || {}) });
    } catch (error) {
        failures.push({ name, error: String(error) });
        results.push({ name, passed: false, error: String(error) });
        if (page && !page.isClosed()) await page.screenshot({ path: path.join(directory, `browser-${runLabel}-failure-${filename(name)}.png`), fullPage: true }).catch(() => {});
        console.error("FAIL", name, String(error));
    }
}

// [본문·이미지·가독성·폭·목차의 실제 DOM 검사 / Inspect the rendered content, media, type, width and outline]
async function inspect(page: Page, route: string, width: number) {
    const status = await go(page, route);
    const data = expected.get(route)!;
    if (data.special === "goods") await page.locator(".service-goods-grid").waitFor({ state: "visible" });
    assert.equal(await page.locator('[data-component-id="completed-page"]').count(), 1);
    assert.equal(await page.locator("h1").count(), 1, "Exactly one document h1");
    assert.equal(normalize(await page.locator("h1").innerText()), normalize(data.title));
    assert.equal(normalize(await page.locator(".completed-heading > p").innerText()), normalize(data.summary));
    for (let index = 0; index < data.sections.length; index += 1) assert.equal(normalize(await page.locator(`#completed-section-title-${index}`).innerText()), normalize(data.sections[index].title));
    const body = normalize(await page.locator(".completed-main").innerText());
    assert.ok(body.length >= 100, `Substantive body: ${body.length} characters`);
    const media = await page.locator(".completed-page").evaluate(async root => {
        const images = Array.from(root.querySelectorAll("img"));
        await Promise.all(images.map(image => {
            image.loading = "eager";
            if (image.complete) return Promise.resolve();
            return new Promise<void>(resolve => { const timer = setTimeout(resolve, 18000); const done = () => { clearTimeout(timer); resolve(); }; image.addEventListener("load", done, { once: true }); image.addEventListener("error", done, { once: true }); });
        }));
        return images.map(image => ({ src: image.currentSrc || image.src, complete: image.complete, width: image.naturalWidth }));
    });
    assert.deepEqual(media.filter(image => !image.complete || image.width === 0), [], "Every content image must load");
    const layout = await page.locator(".completed-page").evaluate(root => {
        const small: { text: string; size: number; tag: string }[] = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const element = node.parentElement;
            if (!element || !node.textContent?.trim() || element.closest(".completed-sr-only,[hidden],[aria-hidden=true],svg,option")) continue;
            const style = getComputedStyle(element);
            const range = document.createRange(); range.selectNodeContents(node);
            if (!range.getBoundingClientRect().width || style.visibility === "hidden" || style.display === "none") continue;
            const size = parseFloat(style.fontSize);
            if (size < 16) small.push({ text: node.textContent.trim().slice(0, 70), size, tag: element.tagName });
        }
        const missingAnchors = Array.from(root.querySelectorAll<HTMLAnchorElement>('.completed-outline a[href^="#"]')).map(link => link.hash.slice(1)).filter(id => !root.querySelector(`[id="${id}"]`));
        return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, rootWidth: root.getBoundingClientRect().width, small, missingAnchors };
    });
    assert.ok(layout.documentWidth <= width + 1, `Document overflow: ${layout.documentWidth}px > ${width}px`);
    assert.deepEqual(layout.small, [], "Visible interface text must be at least 16px");
    assert.deepEqual(layout.missingAnchors, [], "Every outline link must have a target");
    if (representatives.includes(route)) await page.screenshot({ path: path.join(directory, `browser-${runLabel}-${filename(route)}-${width}.png`), fullPage: true });
    return { route, width, status, title: data.title, sectionCount: data.sections.length, bodyCharacters: body.length, contentHash: hash(`${data.title}\n${data.summary}\n${body}`), bodyHash: hash(body), layout, imageCount: media.length, images: media };
}

try {
    for (const width of smoke ? [320] : [1440, 320]) {
        const context = await readonlyContext(width);
        const page = await context.newPage(); track(page);
        const paths = smoke ? ["/about/esg", "/rental/compare", "/visit/support/faq", "/news/goods"] : [...COMPLETION_PATHS];
        for (let index = 0; index < paths.length; index += 1) {
            const route = paths[index];
            await check(`route ${route} at ${width}`, () => inspect(page, route, width), page);
            if ((index + 1) % 10 === 0 || index === paths.length - 1) console.log(`ROUTES ${width}: ${index + 1}/${paths.length}`);
        }
        await context.close();
    }
    if (!smoke) for (const width of [390, 768, 1024]) {
        const context = await readonlyContext(width); const page = await context.newPage(); track(page);
        for (const route of representatives) await check(`representative ${route} at ${width}`, () => inspect(page, route, width), page);
        console.log(`REPRESENTATIVES ${width}: ${representatives.length}`); await context.close();
    }

    // [저장하지 않는 실제 상호작용 / Real interactions that never submit or authenticate]
    const context = await readonlyContext(390); const page = await context.newPage(); track(page);
    await check("FAQ opens and closes with its native summary", async () => {
        await go(page, "/visit/support/faq"); const details = page.locator(".completed-faq details").first();
        await details.locator("summary").click(); assert.equal(await details.getAttribute("open"), ""); assert.ok(await details.locator("p").isVisible());
        await details.locator("summary").click(); assert.equal(await details.getAttribute("open"), null);
    }, page);
    await check("venue comparison enforces max3, shows real data, clears and links the chosen venue", async () => {
        await go(page, "/rental/compare"); const checks = page.locator(".completed-venue-options input[type=checkbox]"); assert.ok(await checks.count() >= 4);
        for (let index = 0; index < 3; index += 1) await checks.nth(index).check();
        assert.equal(await page.locator(".completed-venue-options input:checked").count(), 3);
        assert.equal(await checks.nth(3).isDisabled(), true); assert.equal(await page.locator(".completed-compare-table thead th").count(), 4);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
        await page.screenshot({ path: path.join(directory, `browser-${runLabel}-rental-compare-selected-390.png`), fullPage: true });
        const apply = page.locator('.completed-compare-table a[href*="/rental/apply"]').first(); const href = await apply.getAttribute("href"); assert.ok(href?.includes("venue="));
        await page.getByRole("button", { name: "선택 초기화", exact: true }).click(); assert.equal(await page.locator(".completed-venue-options input:checked").count(), 0); assert.equal(await checks.nth(3).isEnabled(), true);
        await checks.first().check(); await page.locator('.completed-compare-table a[href*="/rental/apply"]').first().click(); await page.waitForURL(/\/rental\/apply\/?\?venue=/); assert.equal(await page.locator('[data-component-id="service-request"]').count(), 1);
    }, page);
    await check("rental calendar filters published notices and labels publication dates", async () => {
        await go(page, "/rental/schedule"); const selector = page.getByLabel("공고 게시 월", { exact: true }); const options = await selector.locator("option").allTextContents(); assert.ok(options.length >= 2);
        const value = await selector.locator("option").nth(1).getAttribute("value"); await selector.selectOption(value!);
        assert.equal(await page.locator(".completed-notice-month").count(), 1); assert.match(await page.locator(".completed-notice-list").innerText(), /공고 게시일/); assert.equal(await page.locator(".completed-page [data-available]").count(), 0); await selector.selectOption("");
    }, page);
    await check("published card search and category filtering use real items", async () => {
        const target = [...expected.values()].find(item => item.sections.some(section => section.type === "cards" && section.searchable && new Set(section.items.map(card => card.category).filter(Boolean)).size > 1)) || expected.get("/programs/history")!;
        await go(page, target.path); const tools = page.locator(".completed-list-tools").first(); const section = tools.locator(".."); const before = await section.locator(".completed-card-list > li").count(); assert.ok(before > 0);
        await tools.locator('input[type="search"]').fill("zz-no-matching-published-item"); await expect(section.locator(".completed-card-list > li")).toHaveCount(0); await tools.getByRole("button", { name: "검색 초기화" }).click(); await expect(section.locator(".completed-card-list > li")).toHaveCount(before);
        const filters = tools.locator(".completed-filters button"); if (await filters.count() > 1) { await filters.nth(1).click(); assert.equal(await filters.nth(1).getAttribute("aria-pressed"), "true"); assert.ok(await section.locator(".completed-card-list > li").count() > 0); await filters.first().click(); assert.equal(await section.locator(".completed-card-list > li").count(), before); }
        return { path: target.path, originalItems: before, categoryButtons: await filters.count() };
    }, page);
    await check("goods search changes the published list without writing", async () => {
        await go(page, "/news/goods"); await page.locator(".service-goods-grid").waitFor(); const before = await page.locator(".service-goods-card").count(); assert.ok(before > 0);
        await page.getByLabel("상품 검색", { exact: true }).fill("zz-no-such-good"); assert.equal(await page.locator(".service-goods-card").count(), 0); await page.getByLabel("상품 검색", { exact: true }).fill(""); assert.equal(await page.locator(".service-goods-card").count(), before); return { publishedGoods: before };
    }, page);
    await check("sitemap searches actual links and navigates to the selected route", async () => {
        await go(page, "/sitemap"); const tree = page.locator(".completed-sitemap-tree"); const before = await tree.locator("a").count(); assert.ok(before >= PAGES.length - 1);
        await page.getByLabel("메뉴 찾기", { exact: true }).fill("zz-no-such-route"); assert.equal(await page.locator(".completed-sitemap-tree").count(), 0); await page.getByLabel("메뉴 찾기", { exact: true }).fill(""); await tree.locator('a[href*="/rental/compare"]').first().click(); await page.waitForURL(/\/rental\/compare\/?$/); assert.equal(await page.locator("h1").innerText(), expected.get("/rental/compare")!.title); return { publishedMenuLinks: before };
    }, page);
    await check("guest form exposes its real account gate without submitting", async () => {
        await go(page, "/visit/support/inquiry"); const form = page.locator('[data-component-id="service-request"]'); await form.getByRole("link", { name: "로그인하기 · 새 창" }).waitFor(); assert.match(await form.innerText(), /로그인 후 신청할 수 있습니다/); assert.equal(await form.locator('button[type="submit"]').count(), 0);
    }, page);
    await context.close();
    await check("no runtime or hydration errors and no attempted writes", async () => { assert.deepEqual(runtimeErrors, []); assert.deepEqual(blockedWrites, []); });
    await check("every page has its own identified content", async () => { const routes = results.filter(result => result.passed && result.width === (smoke ? 320 : 1440)); const identified = routes.map(result => result.contentHash); assert.equal(new Set(identified).size, identified.length); });
} finally {
    await browser.close();
    const mainBodies = new Map<string, string[]>();
    results.filter(result => result.passed && result.width === (smoke ? 320 : 1440)).forEach(result => { const key = String(result.bodyHash); mainBodies.set(key, [...(mainBodies.get(key) || []), String(result.route)]); });
    const report = { generatedAt: new Date().toISOString(), base, runLabel, mode: smoke ? "smoke" : "full", expectedRoutes: 89, passed: results.filter(result => result.passed).length, failed: failures.length, requestCounts, blockedWrites, runtimeErrors, duplicateMainBodies: [...mainBodies.values()].filter(routes => routes.length > 1), results, failures };
    fs.writeFileSync(path.join(directory, `browser-${runLabel}${smoke ? "-smoke" : ""}-results.json`), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: report.passed, failed: report.failed, runtimeErrors: runtimeErrors.length, blockedWrites: blockedWrites.length, duplicateMainBodyGroups: report.duplicateMainBodies.length }));
}
if (failures.length) process.exitCode = 1;
