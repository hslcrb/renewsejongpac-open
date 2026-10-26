const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:8000");
    await page.waitForSelector(".benefit-card");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const r = await page.evaluate(() => {
        const card = document
            .querySelector(".benefit-card")
            .getBoundingClientRect(),
          news = document
            .querySelector(".news-section")
            .getBoundingClientRect(),
          image = document
            .querySelector(".program-art img")
            .getBoundingClientRect();
        return {
          cardTop: card.top,
          newsTop: news.top,
          ratio: image.width / image.height,
        };
      });
      assert.ok(
        r.cardTop >= r.newsTop,
        "membership card stays in news section",
      );
      assert.ok(Math.abs(r.ratio - 0.75) < 0.01, "poster maintains 3:4 ratio");
    }
    console.log(
      "Desktop/mobile poster aspect ratio and home card containment passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
