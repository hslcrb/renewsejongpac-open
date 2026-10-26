const { chromium } = require("playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const widths = (process.env.SEJONG_TEST_WIDTHS || "1440,390,320").split(",").map(Number);
const origin = process.env.SEJONG_TEST_ORIGIN || "http://127.0.0.1:8000";

// [장식·평문 안내·제목 위계 전수 조사 / Audit decorative labels, notices and heading roles]
// 남은 분류·날짜·영문 안내도 기록하여 무차별 삭제를 피합니다.
// Record retained categories, dates and English guide content for review.
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
    const report = { timestamp: new Date().toISOString(), origin, routes: [], banned: [], boxes: [], smallHeadings: [] };
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
        page.on("dialog", dialog => dialog.dismiss());
        await page.goto(origin + "/v2/index.html");
        const paths = await page.evaluate(async () => (await import("./src/data/catalog.js")).PAGES.map(page => page.path));
        assert(paths.length > 0);
        assert(widths.length && widths.every(width => Number.isInteger(width) && width >= 240 && width <= 7680));
        for (const width of widths) {
            await page.setViewportSize({ width, height: 1100 });
            for (const route of paths) {
                await page.evaluate(route => location.hash = "#" + route, route);
                await page.waitForFunction(route => document.body.dataset.page === route, route);
                const state = await page.evaluate(() => ({
                    eyebrows: [...document.querySelectorAll("main .eyebrow,main .flow-kicker")].map(el => el.textContent.trim()),
                    banned: /PLAN YOUR VISIT|SINCE 1978 · GWANGHWAMUN, SEOUL|A PLACE FOR EVERYONE|DEMO INFORMATION|CURATED PROGRAMS|CHOOSE YOUR PROGRAM/.test(document.querySelector("main").innerText),
                    boxes: [...document.querySelectorAll("main .info-note,main .flow-demo,main .demo-note")].map(el => ({
                        background: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderLeftWidth, padding: getComputedStyle(el).padding,
                    })),
                    small: [...document.querySelectorAll("main h2,main h3,main h4")].filter(el => parseFloat(getComputedStyle(el).fontSize) < 20).map(el => ({ text: el.textContent.trim(), size: getComputedStyle(el).fontSize })),
                }));
                report.routes.push({ width, route, eyebrows: state.eyebrows });
                if (state.banned) report.banned.push(route);
                if (state.boxes.some(box => box.background !== "rgba(0, 0, 0, 0)" || box.border !== "0px" || box.padding !== "0px")) report.boxes.push({ route, boxes: state.boxes });
                if (state.small.length) report.smallHeadings.push({ width, route, items: state.small });
            }
        }
        assert.deepEqual(report.banned, []);
        assert.deepEqual(report.boxes, []);
        assert.deepEqual(report.smallHeadings, []);
        console.log(`${paths.length} routes × ${widths.join("/")}px: rejected decoration absent; notices are plain text; item headings >=20px.`);
        console.log("Retained labels: " + JSON.stringify(report.routes.filter(route => route.eyebrows.length && route.width === widths[0])));
    } finally {
        fs.writeFileSync("/tmp/sejong-decoration-audit.json", JSON.stringify(report, null, 2) + "\n");
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
