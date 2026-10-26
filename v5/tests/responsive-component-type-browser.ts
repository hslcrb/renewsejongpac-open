import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

// [제품에서 관찰한 다섯 폭의 크기와 가이드 동등성 / Five-width observed product sizes and guide parity]
const base = (process.argv[2] || "http://127.0.0.1:4173/v5/").replace(/\/?$/, "/");
const expected = [
    { width: 320, companion: 30, standalone: 34 },
    { width: 390, companion: 30, standalone: 34 },
    { width: 768, companion: 40, standalone: 46 },
    { width: 1024, companion: 40, standalone: 44.032 },
    { width: 1440, companion: 53.28, standalone: 61.92 },
];
const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: "reduce" });
const results: unknown[] = [];
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
const measure = (selector: string) => page.locator(selector).first().evaluate(element => ({
    font: parseFloat(getComputedStyle(element).fontSize), size: element.getAttribute("data-text-size"),
}));
const equalSize = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 0.05, `${label}: expected ${expected}px, received ${actual}px`);
try {
    for (const item of expected) {
        await page.setViewportSize({ width: item.width, height: 1000 });
        await page.goto(base, { waitUntil: "domcontentloaded" });
        const productHero = await measure(".season-slide.is-active .season-copy h2");
        const productQuick = await measure("[data-violet-current] strong");
        assert.equal(productHero.size, "hero-with-companion");
        assert.equal(productQuick.size, "quick-action");
        equalSize(productHero.font, item.companion, `product hero at ${item.width}`);
        equalSize(productQuick.font, 16, `product quick-menu label at ${item.width}`);

        await page.goto(`${base}design-rules/#components/registry`, { waitUntil: "domcontentloaded" });
        const companionAxis = await measure("#example-text-size-hero-with-companion [data-component-id='text']");
        const standaloneAxis = await measure("#example-text-size-hero-standalone [data-component-id='text']");
        const quickAxis = await measure("#example-text-size-quick-action [data-component-id='text']");
        const guideCompanion = await measure("#example-hero-slide-layout-with-companion h2");
        const guideStandalone = await measure("#example-hero-slide-layout-standalone h2");
        assert.equal(guideCompanion.size, "hero-with-companion");
        assert.equal(guideStandalone.size, "hero-standalone");
        equalSize(companionAxis.font, productHero.font, `companion axis at ${item.width}`);
        equalSize(guideCompanion.font, productHero.font, `actual guide companion at ${item.width}`);
        equalSize(standaloneAxis.font, item.standalone, `standalone axis at ${item.width}`);
        equalSize(guideStandalone.font, standaloneAxis.font, `actual guide standalone at ${item.width}`);
        equalSize(quickAxis.font, productQuick.font, `quick-action axis at ${item.width}`);

        await page.goto(`${base}design-rules/#motion/quick-menu`, { waitUntil: "domcontentloaded" });
        const guideQuick = await measure(".ds-quick-menu [data-violet-current] strong");
        assert.equal(guideQuick.size, "quick-action");
        equalSize(guideQuick.font, productQuick.font, `actual guide quick-menu at ${item.width}`);
        results.push({ ...item, productHero, productQuick, companionAxis, standaloneAxis, quickAxis, guideCompanion, guideStandalone, guideQuick });
    }
    assert.deepEqual(errors, []);
    console.log("Responsive component type: product baseline preserved and native/guide size axes agree at 320, 390, 768, 1024 and 1440px.");
} finally {
    const directory = resolve(".lemonade/component-implementation");
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, "responsive-type-report.json"), `${JSON.stringify({ base, results, errors }, null, 2)}\n`);
    await browser.close();
}
