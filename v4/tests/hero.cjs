const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(),
    headless: true,
  });
  const screenshots = path.join(os.tmpdir(), "sejong-hero-qa");
  fs.mkdirSync(screenshots, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const start = new Date("2026-10-14T00:00:00Z");
    await page.clock.install({ time: start });
    await page.clock.pauseAt(new Date(start.getTime() + 1000));
    await page.goto(process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000");
    await page.waitForSelector(".hero-card.is-active");
    await page.clock.runFor(32);
    const geometry = await page.locator(".hero-card").evaluateAll((cards) =>
      cards.map((card) => ({ width: card.getBoundingClientRect().width, active: card.classList.contains("is-active") })),
    );
    assert.equal(geometry.length, 3, "carousel recycles three full-size banners");
    assert.ok(geometry.every((card) => Math.abs(card.width - geometry[1].width) < 1), "neighbor banners keep the full main banner width");
    await page.waitForTimeout(1250);
    await page.locator(".home-hero").screenshot({ path: path.join(screenshots, "desktop.png") });
    assert.equal(await page.locator(".hero-progress").count(), 1, "carousel has a single progress bar");
    assert.equal(await page.locator(".slide-current, .slide-total").count(), 0, "slide counters are removed");
    assert.equal(await page.locator(".hero-track").evaluate((track) => parseFloat(getComputedStyle(track).transitionDuration)), 0.7, "banners transition gently in 700ms");
    const progress = () => page.locator(".hero-progress i").evaluate((bar) =>
      Number(getComputedStyle(bar).transform.match(/matrix\(([^,]+)/)?.[1] || 0),
    );
    const active = () => page.locator(".hero-card.is-active").getAttribute("data-hero-card");
    // Hovering does not stop the uniform autoplay cycle.
    await page.locator(".home-hero").hover();
    for (let index = 0; index < 3; index++) {
      await page.clock.runFor(1500);
      const half = await progress();
      assert.ok(Math.abs(half - 0.5) < 0.02, `slide ${index + 1} fills halfway after 1.5 seconds`);
      await page.clock.runFor(1532);
      assert.equal(await active(), String((index + 1) % 3), "the next banner becomes active after three seconds");
      assert.ok(await progress() < 0.02, "the single progress bar resets for the next banner");
      const incoming = page.locator(".hero-card.is-active h1");
      assert.ok(Number(await incoming.evaluate((title) => getComputedStyle(title).opacity)) < 0.2, "incoming title starts transparent");
      const before = await page.locator(".hero-track").evaluate((track) => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41);
      await page.waitForTimeout(250);
      const middle = await page.locator(".hero-track").evaluate((track) => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41);
      assert.ok(middle > before, "every banner enters from the left and moves to the right, including the wrap");
      assert.equal(Number(await incoming.evaluate((title) => getComputedStyle(title).opacity)), 0, "incoming text waits until the banner is near the center");
      assert.ok(Number(await page.locator(`.hero-card.is-after[data-hero-card="${index}"] h1`).evaluate((title) => getComputedStyle(title).opacity)) > 0.98, "outgoing text stays visible on its banner");
      await page.waitForTimeout(350);
      const fading = Number(await incoming.evaluate((title) => getComputedStyle(title).opacity));
      assert.ok(fading > 0 && fading < 1, "text fades in gradually as the banner approaches the center");
      const incomingBox = await page.locator(".hero-card.is-active").boundingBox();
      const stageBox = await page.locator(".home-hero").boundingBox();
      assert.ok(Math.abs(incomingBox.x + incomingBox.width / 2 - stageBox.x - stageBox.width / 2) < incomingBox.width * 0.2, "the banner is near the center when its text becomes visible");
      await page.waitForTimeout(600);
      assert.ok(Number(await incoming.evaluate((title) => getComputedStyle(title).opacity)) > 0.98, "incoming title fades into view");
      assert.equal(await incoming.evaluate((title) => getComputedStyle(title).animationName), "hero-copy-in", "recycling does not interrupt the text animation");
      await page.clock.runFor(32);
    }
    assert.equal(await page.locator(".hero-track").evaluate((track) => track.style.getPropertyValue("--hero-position")), "1", "recycling restores the incoming card to the central slot");
    await page.locator("#hero-pause").click();
    const stopped = await progress();
    await page.clock.runFor(12000);
    assert.deepEqual(await progress(), stopped, "pause freezes the progress bar");
    const manualMove = async (selector) => {
      const before = await page.locator(".hero-track").evaluate((track) => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41);
      await page.locator(selector).click();
      await page.waitForTimeout(150);
      const middle = await page.locator(".hero-track").evaluate((track) => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41);
      assert.ok(middle > before, "manual selection also moves banners from left to right");
      await page.waitForTimeout(950);
    };
    await manualMove('[data-slide="-1"]');
    assert.equal(await active(), "2", "previous control wraps from first to last");
    await manualMove('[data-slide="1"]');
    assert.equal(await active(), "0", "next control wraps from last to first");
    await manualMove(".hero-card.is-after");
    assert.equal(await active(), "2", "right-side banner selection also enters from the left");
    await manualMove(".hero-card.is-before");
    assert.equal(await active(), "0", "left-side banner selection keeps the same movement direction");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    const mobile = await page.locator(".hero-card.is-active").boundingBox();
    assert.ok(mobile.x > 0 && mobile.x + mobile.width < 390, "mobile keeps both neighboring banner edges visible");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "carousel does not cause horizontal page overflow");
    await page.locator(".home-hero").screenshot({ path: path.join(screenshots, "mobile.png") });
    const reduced = await browser.newPage({ reducedMotion: "reduce" });
    reduced.on("pageerror", (error) => errors.push(error.message));
    await reduced.goto(process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000");
    assert.equal(await reduced.locator("#hero-pause").getAttribute("aria-pressed"), "true", "reduced motion starts with autoplay paused");
    await reduced.locator('[data-slide="1"]').focus();
    await reduced.keyboard.press("Enter");
    assert.equal(await reduced.locator(".hero-card.is-active").getAttribute("data-hero-card"), "1", "reduced motion changes slides immediately");
    assert.equal(await reduced.evaluate(() => document.activeElement.dataset.slide), "1", "navigation retains keyboard focus");
    const reducedDuration = await reduced.locator(".hero-track").evaluate((track) => parseFloat(getComputedStyle(track).transitionDuration));
    assert.ok(reducedDuration < 0.001, "reduced motion eliminates perceptible transition time");
    assert.equal(await reduced.locator(".hero-card.is-active h1").evaluate((title) => getComputedStyle(title).opacity), "1");
    assert.deepEqual(errors, [], "carousel raises no browser errors");
    console.log({ result: "passed", direction: "left to right for every transition", duration: "3 seconds per banner", transition: "700ms", text: "fades in near the center; stays with outgoing banner", screenshots });
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
