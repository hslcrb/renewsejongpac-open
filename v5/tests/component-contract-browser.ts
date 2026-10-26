import assert from "node:assert/strict";
import { chromium } from "playwright";
import { COMPONENT_REGISTRY } from "../src/data/component-registry.ts";

// [등록부에서 실제 DOM까지 연결되는 예시 / Examples connected from registry to the actual DOM]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
try {
    await page.goto(`${base}design-rules/#components/registry`, { waitUntil: "domcontentloaded" });
    await page.locator("[data-documentation-tool='component-catalog']").waitFor();
    let count = 0;
    for (const entry of COMPONENT_REGISTRY) for (const example of entry.examples || []) {
        const specimen = page.locator(`[id="${example.id}"]`);
        assert.equal(await specimen.count(), 1, `${example.id} is a unique live anchor`);
        assert.equal(await specimen.getAttribute("data-component-example"), entry.id);
        assert.equal(await specimen.getAttribute("data-example-axis"), example.axis || null);
        assert.equal(await specimen.getAttribute("data-example-value"), example.value || null);
        if (entry.id === "header") {
            await specimen.locator("button").click();
            const header = specimen.frameLocator("iframe").locator("[data-component-id='header']");
            await header.waitFor();
            assert.equal(await header.getAttribute("data-header-variant"), example.value);
            await specimen.locator("button").click();
        } else if (entry.id === "floating-panel") {
            await specimen.locator("button").click();
            await page.locator("[data-component-id='floating-panel']").waitFor();
            await page.keyboard.press("Escape");
        } else {
            assert.ok(await specimen.locator(`[data-component-id="${entry.id}"]`).count(), `${example.id} renders its actual implementation`);
        }
        if (entry.id === "text" || entry.id === "surface") assert.equal(await specimen.locator("[data-ref-forwarded='true']").count(), 1, `${example.id} forwards the native ref`);
        count++;
    }

    // [입력·탭·필터와 공유 크기 검증 / Verify fields, tabs, filters and shared sizes]
    const filter = page.locator("#example-filter-button-selected-false button");
    await filter.click();
    assert.equal(await filter.getAttribute("aria-pressed"), "true");
    const verticalTabs = page.locator("#example-tabs-orientation-vertical [role='tab']");
    await verticalTabs.first().focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(await verticalTabs.nth(1).getAttribute("aria-selected"), "true");
    assert.equal(await page.locator("#example-field-as-select select").count(), 1);
    assert.equal(await page.locator("#example-field-as-textarea textarea").count(), 1);
    assert.equal(await page.locator("#example-account-ticket-state-cancelled [data-cancelled='true']").count(), 1);
    for (const selector of ["#example-button-variant-primary button", "#example-field-as-input input"]) {
        assert.equal(await page.locator(selector).evaluate(element => getComputedStyle(element).fontSize), "16px");
    }
    const controlExample = page.locator("#example-text-size-control [data-component-id='text']");
    assert.equal(await controlExample.evaluate(element => getComputedStyle(element).fontSize), "16px");
    for (const [selector, radius] of [
        ["#example-button-context-default button", "12px"],
        ["#example-button-context-flow button", "14px"],
        ["#example-field-variant-default input", "12px"],
        ["#example-field-variant-flow input", "14px"],
        ["#example-surface-radius-panel [data-component-id='surface']", "20px"],
        ["#example-surface-radius-compact [data-component-id='surface']", "16px"],
        ["#example-surface-radius-dialog [data-component-id='surface']", "28px"],
    ]) assert.equal(await page.locator(selector).evaluate(element => getComputedStyle(element).borderRadius), radius, selector);
    const nativeSize = await page.locator("#example-text-variant-body [data-component-id='text']").evaluate(element => {
        const native = document.createElement("p");
        native.setAttribute("data-text", "body");
        element.parentElement!.append(native);
        const result = [getComputedStyle(element).fontSize, getComputedStyle(native).fontSize];
        native.remove();
        return result;
    });
    assert.equal(nativeSize[0], nativeSize[1], "native annotations and SystemText use the same role size");
    await page.goto(`${base}design-rules/#components/registry/example-surface-variant-panel`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => { const target = document.getElementById("example-surface-variant-panel"); if (!target) return false; const rect = target.getBoundingClientRect(); return rect.top >= 0 && rect.top < innerHeight; });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator("#example-text-size-quick-action [data-component-id='text']").evaluate(element => getComputedStyle(element).fontSize), "16px");
    assert.equal(await page.locator("#example-button-context-flow button").evaluate(element => getComputedStyle(element).borderRadius), "14px");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "mobile guide does not overflow horizontally");
    assert.deepEqual(errors, []);
    console.log(`Component contracts: ${count} live examples; filtering, vertical keyboard tabs, fields, ticket states and typography verified.`);
} finally {
    await browser.close();
}
