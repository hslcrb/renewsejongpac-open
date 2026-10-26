const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const failures = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:8000");
    await page.waitForSelector(".home-hero");
    await page.locator(".skip-link").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(80);
    if (
      (await page.locator(".home-hero").count()) !== 1 ||
      (await page.evaluate(() => document.activeElement.id)) !== "main"
    )
      failures.push("skip link must focus main without changing route");
    await page.evaluate(() => (location.hash = "#/"));
    await page.waitForSelector(".home-hero");
    await page.locator('[data-slide="1"]').focus();
    await page.keyboard.press("Enter");
    if (
      (await page.evaluate(() =>
        document.activeElement.getAttribute("data-slide"),
      )) !== "1"
    )
      failures.push("hero controls preserve keyboard focus");
    const link = page
      .locator(".nav-item")
      .first()
      .locator(".mega-links a")
      .first();
    await page.locator(".nav-item").first().hover();
    await link.focus();
    await page.keyboard.press("Escape");
    if (await page.locator(".mega-panel").first().isVisible())
      failures.push("Escape closes mega menu");
    await page.locator(".home-hero").hover();
    await page.locator('#quick-calendar [data-month="1"]').click();
    await page.locator('[data-date="2026-11-09"]').click();
    if (!(await page.locator("#daily-programs").innerText()).includes("10:00"))
      failures.push("exhibition uses its actual example time");
    await page.locator('[data-date="2026-11-16"]').click();
    const actions = await page
      .locator(".daily-book")
      .evaluateAll((els) => els.map((a) => a.getAttribute("href")));
    if (!actions.every((a) => a.startsWith("#/apply/education?")))
      failures.push("education links to application");
    console.log({ failures });
    assert.deepEqual(failures, []);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
