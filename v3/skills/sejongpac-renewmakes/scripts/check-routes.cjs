const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const origin = process.env.SEJONG_TEST_ORIGIN || "http://127.0.0.1:8000";
const widths = (process.env.SEJONG_TEST_WIDTHS || "1440,390,320").split(",").map(Number);

// [경로·반응형 회귀 검사 / Route and responsive regression]
// 현재 실행의 대상과 결과를 남기며 렌더 오류와 문서 넘침을 검사합니다.
// Record this run's target and detect rendering errors and document overflow.
(async () => {
  assert(widths.length && widths.every(width => Number.isInteger(width) && width >= 240 && width <= 7680));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const report = { timestamp: new Date().toISOString(), origin, widths: [], errors: [], failedResponses: [] };
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    page.setDefaultTimeout(10000);
    page.on("dialog", dialog => dialog.dismiss());
    page.on("pageerror", error => report.errors.push(error.message));
    page.on("response", response => {
      if (response.status() >= 400) report.failedResponses.push({ status: response.status(), url: response.url() });
    });
    await page.goto(origin + "/v2/index.html");
    const paths = await page.evaluate(async () => (await import("./src/data/catalog.js")).PAGES.map(page => page.path));
    assert(paths.length > 0, "zero routes does not validate the application");
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1100 });
      const result = { width, count: paths.length, failed: [], overflow: [] };
      for (const path of paths) {
        await page.evaluate(path => { location.hash = "#" + path; }, path);
        await page.waitForFunction(path => document.body.dataset.page === path, path);
        const state = await page.evaluate(() => ({
          title: document.querySelector("main h1")?.textContent,
          error: /페이지를 (찾을 수 없어요|불러오지 못했어요)/.test(document.querySelector("main").innerText),
          wide: document.documentElement.scrollWidth > innerWidth,
        }));
        if (!state.title || state.error) result.failed.push(path);
        if (state.wide) result.overflow.push(path);
      }
      report.widths.push(result);
      console.log(JSON.stringify(result));
    }
    assert(report.widths.every(result => result.failed.length === 0 && result.overflow.length === 0));
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.failedResponses, []);
  } finally {
    fs.writeFileSync("/tmp/sejongpac-route-check.json", JSON.stringify(report, null, 2) + "\n");
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
