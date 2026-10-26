const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [],
    failed = [],
    overflows = [],
    badImages = [],
    broken = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(base);
  await page.waitForSelector(".home-hero");
  const paths = await page.evaluate(async () => {
    const d = await import("./js/data.js");
    return d.PAGES.map((p) => p.path);
  });
  await page.screenshot({
    path: "/tmp/sejong-home-desktop.png",
    fullPage: true,
  });
  for (const path of paths) {
    await page.evaluate((path) => (location.hash = "#" + path), path);
    await page.waitForFunction(
      (path) => document.body.dataset.page === path,
      path,
    );
    const info = await page.evaluate(() => ({
      heading: document.querySelector("main h1")?.textContent,
      body: document.querySelector("main").innerText,
      images: [...document.querySelectorAll("main img")]
        .filter((i) => i.complete && !i.naturalWidth)
        .map((i) => i.src),
      width: document.documentElement.scrollWidth,
      links: [...document.querySelectorAll('main a[href^="#/"]')].map((a) =>
        a.getAttribute("href").split("?")[0].slice(1),
      ),
    }));
    if (
      !info.heading ||
      info.body.includes("페이지를 불러오지 못했습니다") ||
      info.body.includes("페이지를 찾을 수 없습니다")
    )
      failed.push(path);
    if (info.width > 1441) overflows.push([path, info.width]);
    badImages.push(...info.images);
    for (const link of info.links) {
      if (
        !paths.includes(link) &&
        !link.startsWith("/booking/") &&
        !link.startsWith("/apply/")
      )
        broken.push([path, link]);
    }
  }
  console.log("Desktop route sweep:", paths.length, "routes", {
    failed,
    overflows,
    badImages: [...new Set(badImages)],
    broken: [...new Set(broken.map((x) => x.join(" → ")))],
  });
  assert.equal(failed.length, 0, "failed page render");
  assert.equal(broken.length, 0, "broken internal links");
  await page.evaluate(() => (location.hash = "#/"));
  await page.waitForSelector(".home-hero");
  await page.locator('[data-category="전시"]').click();
  assert.equal(await page.locator("#home-programs .program-card").count(), 2);
  await page.locator('[data-category="전체"]').click();
  await page.locator("#home-programs [data-favorite]").first().click();
  assert.equal(
    await page
      .locator("#home-programs [data-favorite]")
      .first()
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.locator(".search-toggle").click();
  await page.locator("#global-search").fill("카르멘");
  await page.locator("#header-search").evaluate((el) => el.requestSubmit());
  await page.waitForSelector(".search-result");
  assert.ok((await page.locator("main").innerText()).includes("카르멘"));
  await page.evaluate(
    () => (location.hash = "#/booking/carmen?date=2026-10-16"),
  );
  await page.waitForSelector("[data-booking-date]");
  assert.equal(await page.locator("[name=date]").inputValue(), "2026-10-16");
  await page
    .locator("[data-booking-date]")
    .evaluate((el) => el.requestSubmit());
  await page.locator("[data-seat]:not(:disabled)").first().click();
  await page.locator("[data-booking-next]").click();
  await page.locator("[name=name]").fill("테스트 관람객");
  await page.locator("[name=email]").fill("visitor@example.com");
  await page.locator("[name=phone]").fill("01012345678");
  await page.locator("[name=consent]").check();
  await page
    .locator("[data-booking-review]")
    .evaluate((el) => el.requestSubmit());
  await page.waitForSelector(".flow-receipt");
  await page.evaluate(() => (location.hash = "#/account/bookings"));
  await page.waitForSelector("[data-cancel-booking]");
  await page.locator("[data-cancel-booking]").first().click();
  await page.locator("[data-cancel-confirm]").click();
  assert.ok((await page.locator("main").innerText()).includes("취소"));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of paths) {
    await page.evaluate((path) => (location.hash = "#" + path), path);
    await page.waitForFunction(
      (path) => document.body.dataset.page === path,
      path,
    );
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    if (width > 391) overflows.push([path, "mobile", width]);
  }
  await page.evaluate(() => (location.hash = "#/"));
  await page.waitForSelector(".home-hero");
  await page.screenshot({
    path: "/tmp/sejong-home-mobile.png",
    fullPage: true,
  });
  await page.locator(".menu-toggle").click();
  assert.equal(await page.locator(".all-menu").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".all-menu").isVisible(), false);
  await page.evaluate(() => (location.hash = "#/no-such-page"));
  await page.waitForFunction(
    () => document.body.dataset.page === "/no-such-page",
  );
  assert.ok(
    (await page.locator("main").innerText()).includes(
      "페이지를 찾을 수 없습니다",
    ),
  );
  console.log(
    "Interaction checks: home filter, favorites, search, booking deep link, booking completion/cancellation, mobile menu and 404 passed.",
  );
  console.log("Errors:", errors);
  console.log("Overflow:", overflows);
  fs.writeFileSync(
    "/tmp/sejong-browser-results.json",
    JSON.stringify(
      {
        routes: paths.length,
        errors,
        failed,
        overflows,
        badImages: [...new Set(badImages)],
        broken,
      },
      null,
      2,
    ),
  );
  await browser.close();
  assert.equal(errors.length, 0, "browser errors");
  assert.equal(overflows.length, 0, "horizontal overflow");
  assert.equal(badImages.length, 0, "missing images");
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
