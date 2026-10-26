const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v2/index.html";

// [카드와 캐러셀의 실제 동작 / Real card and carousel behavior]
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"], headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "no-preference" });
    page.setDefaultTimeout(10000);
    page.on("dialog", d => d.dismiss());
    await page.goto(base);
    await page.locator(".program-card").first().waitFor();
    assert(await page.locator(".card--poster").count() > 0, "poster cards must use the shared card component");
    assert.equal(await page.locator(".card--banner").count(), 1);
    const card = page.locator(".card--poster").first();
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const heart = card.locator(".favorite-button");
    assert.equal(await heart.evaluate(el => getComputedStyle(el).opacity), "0");
    const media = await card.locator(".program-art img").evaluate(el => ({
      fit: getComputedStyle(el).objectFit, padding: getComputedStyle(el).padding,
      width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height,
      parentWidth: el.parentElement.getBoundingClientRect().width, parentHeight: el.parentElement.getBoundingClientRect().height,
    }));
    assert.equal(media.fit, "cover"); assert.equal(media.padding, "0px");
    assert(Math.abs(media.width - media.parentWidth) < 1 && Math.abs(media.height - media.parentHeight) < 1);
    await card.locator(".program-card-venue").hover();
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".card--poster .favorite-button")).opacity === "1");
    assert.equal(await heart.evaluate(el => getComputedStyle(el).transform), "none");
    await page.mouse.move(0, 0);
    await card.locator(".card-poster-link").focus();
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".card--poster .favorite-button")).opacity === "1");
    assert.equal(await card.locator("h3").evaluate(el => parseFloat(getComputedStyle(el).fontSize)), 20);
    assert.equal(await page.locator(".visit-link-list strong").first().evaluate(el => getComputedStyle(el).fontWeight), "650");
    assert.equal(await page.locator(".visit-link-list strong").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)), 20);

    await page.locator(".season-stage").scrollIntoViewIfNeeded();
    const pause = page.locator('[data-hero="pause"]');
    if (await pause.getAttribute("aria-pressed") === "false") await pause.click();
    const current = page.locator("[data-season-current]");
    const initial = await current.textContent();
    await page.locator('[data-hero="next"]').click();
    assert.equal(await page.locator(".season-track").getAttribute("data-direction"), "next");
    await page.waitForFunction(() => !document.querySelector(".season-track").classList.contains("is-moving"));
    assert.notEqual(await current.textContent(), initial);
    assert.equal(await page.locator(".season-slide.is-active").count(), 1);
    const box = await page.locator(".season-stage").boundingBox();
    async function drag(dx) {
      const x = box.x + box.width * 0.5, y = box.y + box.height * 0.45;
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(x + dx, y, { steps: 10 });
      assert.equal(await page.locator(".season-stage").getAttribute("data-dragging"), "true");
      await page.mouse.up();
      await page.waitForFunction(() => !document.querySelector(".season-track").classList.contains("is-moving"));
    }
    const beforeDrag = await current.textContent();
    await drag(-240); assert.notEqual(await current.textContent(), beforeDrag);
    await drag(240); assert.equal(await current.textContent(), beforeDrag);
    assert.equal(new URL(page.url()).hash, "", "drag must not navigate a card link");
    const dragPolicy = await page.locator(".card--hero.is-active").evaluate(el => ({
      select: getComputedStyle(el).userSelect,
      image: el.querySelector("img").draggable,
      link: el.querySelector("a").draggable,
      nativeDragPrevented: !el.querySelector("img").dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true })),
      contextAllowed: el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })),
    }));
    assert.equal(dragPolicy.select, "none"); assert(!dragPolicy.image && !dragPolicy.link);
    assert(dragPolicy.nativeDragPrevented && dragPolicy.contextAllowed);
    assert.equal(await page.locator(".card--banner").evaluate(el => getComputedStyle(el).userSelect), "none");

    // [2.7초 주기 / 2.7 second start-to-start interval]
    const timed = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "no-preference" });
    timed.on("dialog", d => d.dismiss());
    await timed.clock.install({ time: new Date("2026-10-15T00:00:00Z") });
    await timed.clock.pauseAt(new Date("2026-10-15T00:00:01Z"));
    await timed.goto(base);
    await timed.clock.runFor(100);
    assert.equal(await timed.locator("[data-season-current]").textContent(), "01");
    await timed.clock.runFor(2500);
    assert.equal(await timed.locator("[data-season-current]").textContent(), "01");
    await timed.clock.runFor(200);
    assert.equal(await timed.locator("[data-season-current]").textContent(), "02");
    const shade = await timed.locator(".card--hero.is-active").evaluate(el => Number(getComputedStyle(el, "::before").opacity));
    assert(shade > 0 && shade < 0.32, "persistent shade must interpolate instead of blinking");
    await timed.clock.runFor(2700);
    assert.equal(await timed.locator("[data-season-current]").textContent(), "03");
    await timed.close();

    // [터치에서 숨지 않는 관심과 양방향 스와이프 / Touch favorites and two-way swipe]
    const touch = await browser.newPage({ viewport: { width: 390, height: 900 }, hasTouch: true, isMobile: true, reducedMotion: "no-preference" });
    touch.on("dialog", d => d.dismiss());
    await touch.goto(base);
    assert.equal(await touch.locator(".card--poster .favorite-button").first().evaluate(el => getComputedStyle(el).opacity), "1");
    await touch.locator('[data-hero="pause"]').click();
    const touchBox = await touch.locator(".season-stage").boundingBox();
    const session = await touch.context().newCDPSession(touch);
    async function swipe(dx) {
      const x = touchBox.x + touchBox.width / 2, y = touchBox.y + touchBox.height / 2;
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= 8; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * i / 8, y }] });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await touch.waitForFunction(() => !document.querySelector(".season-track").classList.contains("is-moving"));
    }
    await swipe(-150); assert.equal(await touch.locator("[data-season-current]").textContent(), "02");
    await swipe(150); assert.equal(await touch.locator("[data-season-current]").textContent(), "01");
    assert.equal(new URL(touch.url()).hash, "");
    await touch.close();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(base + "#/programs/dance");
      const detail = page.locator(".program-detail-poster");
      assert.equal(await detail.evaluate(el => getComputedStyle(el).padding), "0px");
      assert.equal(await detail.locator("img").evaluate(el => getComputedStyle(el).objectFit), "cover");
      assert.equal(await page.locator(".program-artwork-caption").count(), 0);
    }
    console.log("Shared card media/hover/focus, title hierarchy, bidirectional drag, no native drag, context menu and 2.7s autoplay passed.");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
