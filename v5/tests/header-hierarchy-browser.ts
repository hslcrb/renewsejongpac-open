import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, expect } from "playwright/test";

// [실제 글자 기준선과 SVG 제약 검증 / Verify rendered text baselines and SVG constraints]
const base = (process.argv.find(argument => /^https?:/.test(argument)) || "http://127.0.0.1:4174/v5/").replace(/\/?$/, "/");
const label = new URL(base).hostname === "127.0.0.1" ? new URL(base).port : "production";
const directory = ".lemonade/header-hierarchy";
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await context.newPage();
const errors: string[] = [];
const results: Record<string, unknown>[] = [];
page.setDefaultTimeout(12000);
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error" && /hydration|did not match|uncaught/i.test(message.text())) errors.push(message.text()); });
const go = async (route: string) => {
    const response = await page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200);
    await page.evaluate(() => document.fonts.ready);
};

try {
    for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await go("");
        const metrics = await page.evaluate(() => {
            const links = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)].filter(element => element.getBoundingClientRect().width).map(element => {
                const marker = document.createElement("span");
                marker.style.cssText = "display:inline-block;width:0;height:0;padding:0;margin:0;vertical-align:baseline";
                element.append(marker);
                const baseline = marker.getBoundingClientRect().top;
                marker.remove();
                const style = getComputedStyle(element);
                return { text: element.textContent, font: Number.parseFloat(style.fontSize), weight: style.fontWeight, role: element.dataset.text, baseline };
            });
            const icons = [...document.querySelectorAll<HTMLElement>(".masthead-actions > .ds-icon-button")].map(button => {
                const svg = button.querySelector("svg")!;
                const outer = button.getBoundingClientRect(), inner = svg.getBoundingClientRect();
                return { outer: [outer.width, outer.height], inner: [inner.width, inner.height], radius: getComputedStyle(button).borderRadius, group: svg.dataset.iconGroup, ratio: svg.getAttribute("preserveAspectRatio"), offset: [(inner.left + inner.right - outer.left - outer.right) / 2, (inner.top + inner.bottom - outer.top - outer.bottom) / 2] };
            });
            return { nav: links(".desktop-nav a"), utility: links(".masthead-actions > a"), policy: links(".footer-policy a"), icons, documentWidth: document.documentElement.scrollWidth, width: innerWidth };
        });
        assert.ok(metrics.documentWidth <= width + 1, `No viewport overflow at ${width}`);
        assert.equal(metrics.policy.length, 5);
        for (const item of [...metrics.nav, ...metrics.policy]) { assert.equal(item.font, 18); assert.equal(item.weight, "500"); assert.equal(item.role, "navigation"); }
        for (const item of metrics.utility) { assert.equal(item.font, 16); assert.equal(item.weight, "500"); assert.equal(item.role, "utility"); }
        if (metrics.nav.length) {
            const baselines = [...metrics.nav, ...metrics.utility].map(item => item.baseline);
            assert.ok(Math.max(...baselines) - Math.min(...baselines) <= 0.5, `Shared text baseline at ${width}`);
        }
        assert.equal(metrics.icons.length, 2);
        for (const icon of metrics.icons) {
            assert.deepEqual(icon.outer, [48, 48]); assert.deepEqual(icon.inner, [28, 28]);
            assert.ok(icon.offset.every(value => Math.abs(value) <= 0.5));
            assert.equal(icon.radius, "50%"); assert.equal(icon.group, "header-action"); assert.equal(icon.ratio, "xMidYMid meet");
        }
        await page.locator("#header").screenshot({ path: `${directory}/${label}-header-${width}.png` });
        await page.locator("#footer").screenshot({ path: `${directory}/${label}-footer-${width}.png` });
        results.push({ name: `hierarchy and constraints at ${width}px`, passed: true, ...metrics });
        console.log("PASS", `hierarchy and constraints at ${width}px`);
    }

    // [제품과 가이드의 같은 축 / Identical production and guide axes]
    await page.setViewportSize({ width: 1440, height: 1000 });
    await go("design-rules/#components/registry");
    const navigation = page.locator('[id$="example-text-variant-navigation"] [data-text="navigation"]');
    const utility = page.locator('[id$="example-text-variant-utility"] [data-text="utility"]');
    await expect(navigation).toBeVisible(); await expect(utility).toBeVisible();
    assert.equal(await navigation.evaluate(element => getComputedStyle(element).fontSize), "18px");
    assert.equal(await utility.evaluate(element => getComputedStyle(element).fontSize), "16px");
    const general = page.locator('[id$="example-icon-group-general"] svg');
    const special = page.locator('[id$="example-icon-group-header-action"] svg');
    assert.equal(await general.count(), 1); assert.equal(await special.count(), 2);
    assert.equal(await general.evaluate(element => element.getBoundingClientRect().width), 24);
    assert.deepEqual(await special.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)), [28, 28]);
    results.push({ name: "guide uses the exact production text roles and icon groups", passed: true });
    console.log("PASS", "guide uses the exact production text roles and icon groups");

    // [어두운 헤더와 실제 조작 / Inverse header and live interactions]
    await go("about/introduction/");
    assert.equal(await page.locator("#header").getAttribute("data-header-variant"), "inverse");
    await page.locator("#header").screenshot({ path: `${directory}/${label}-header-inverse.png` });
    await page.getByRole("button", { name: "통합검색 열기", exact: true }).click();
    await expect(page.locator("#search-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "통합검색 열기", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "전체 메뉴 열기", exact: true }).click();
    await expect(page.locator("#menu-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#menu-dialog")).not.toBeVisible();
    results.push({ name: "inverse header keeps search focus return and menu open/close", passed: true });
    console.log("PASS", "inverse header keeps search focus return and menu open/close");
    assert.deepEqual(errors, []);
} finally {
    fs.writeFileSync(`${directory}/browser-${label}.json`, JSON.stringify({ base, results, errors }, null, 2));
    await browser.close();
}
