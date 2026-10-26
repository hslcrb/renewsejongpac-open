import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright/test";

/**
 * Run after exporting v5 and serving the repository root:
 *   python3 -m http.server 4173
 *   node v5/tests/scroll-chrome-browser.ts
 *
 * Checks the real rendered sticky header and the native document/nested scrollbars.
 */
const base = process.argv.find(argument => /^https?:\/\//.test(argument)) || "http://127.0.0.1:4173/v5/";
const browser = await chromium.launch({ headless: true });
const evidence: Record<string, unknown>[] = [];
mkdirSync("test-results/scroll-chrome", { recursive: true });

try {
    for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 800 } });
        try {
            const response = await page.goto(base, { waitUntil: "domcontentloaded" });
            assert.equal(response?.status(), 200, `v5 home should load at ${width}px`);
            await page.locator("#header").waitFor();
            const initial = await page.locator("#header").evaluate(element => element.getBoundingClientRect().top);
            assert.ok(Math.abs(initial) <= 1, `header starts at viewport top: ${initial}`);

            const metrics = await page.evaluate(async () => {
                document.documentElement.style.scrollBehavior = "auto";
                window.scrollTo(0, 600);
                await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
                const header = document.getElementById("header");
                if (!header) throw new Error("Site header is missing");
                const probe = document.createElement("div");
                probe.style.cssText = "width: 120px; height: 40px; overflow: auto";
                const content = document.createElement("div");
                content.style.height = "240px";
                probe.append(content);
                document.body.append(probe);
                const nestedWidth = getComputedStyle(probe).scrollbarWidth;
                const rootWidth = getComputedStyle(document.documentElement).scrollbarWidth;
                probe.remove();
                return {
                    y: window.scrollY,
                    top: header.getBoundingClientRect().top,
                    position: getComputedStyle(header).position,
                    offset: getComputedStyle(header).top,
                    rootWidth,
                    nestedWidth,
                    globalStyleCount: document.querySelectorAll('style[data-component-id="global-scrollbar"]').length,
                };
            });
            assert.ok(metrics.y >= 200, `document scrolls at ${width}px: ${metrics.y}`);
            assert.equal(metrics.position, "sticky");
            assert.equal(metrics.offset, "0px");
            assert.ok(Math.abs(metrics.top) <= 1, `sticky header is not clipped at ${width}px: ${metrics.top}`);
            assert.equal(metrics.globalStyleCount, 1, "global scrollbar style exists once");
            assert.equal(metrics.rootWidth, "thin");
            assert.equal(metrics.nestedWidth, "thin");
            await page.screenshot({ path: `test-results/scroll-chrome/${width}-scrolled.png` });
            evidence.push({ width, ...metrics });
            console.log(`PASS ${width}px`, metrics);
        } finally {
            await page.close();
        }
    }
} finally {
    writeFileSync("test-results/scroll-chrome/results.json", JSON.stringify(evidence, null, 2) + "\n");
    await browser.close();
}
