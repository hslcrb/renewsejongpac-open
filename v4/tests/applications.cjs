const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v4/index.html",
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const routes = [
      "/news/notices/recruit/apply",
      "/rental/apply",
      "/rental/contact",
      "/visit/support/inquiry",
      "/visit/group",
      "/apply/education?program=academy",
      "/news/membership/join",
      "/about/donation/apply",
      "/about/partners/apply",
      "/about/disclosure/request",
      "/about/disclosure/ethics",
      "/news/events/autumn-walk/apply",
      "/news/events/review/apply",
    ];
    page.on("dialog", dialog => dialog.dismiss());
    await page.goto(base);
    await page.waitForSelector(".season-hero");
    for (const path of routes) {
      await page.evaluate((p) => (location.hash = "#" + p), path);
      await page.waitForSelector("[data-application-form]");
      await page
        .locator("[data-application-form]")
        .evaluate((f) => f.requestSubmit());
      assert.equal(
        await page.locator("#flow-error").isVisible(),
        true,
        path + " validates required fields",
      );
      await page.locator("[data-application-form]").evaluate((f) => {
        for (const el of f.querySelectorAll("input,select,textarea")) {
          if (el.type === "checkbox") el.checked = true;
          else if (el.type === "email") el.value = "visitor@example.com";
          else if (el.type === "tel") el.value = "01012345678";
          else if (el.type === "number") el.value = el.min || "1";
          else if (el.type === "date") el.value = "2026-10-20";
          else if (el.tagName === "SELECT") el.value = el.options[1].value;
          else
            el.value =
              el.name === "name"
                ? "체험 방문객"
                : "프런트엔드 기능 검증용 예시 내용입니다.";
        }
      });
      await page
        .locator("[data-application-form]")
        .evaluate((f) => f.requestSubmit());
      await page.waitForSelector("[data-application-submit]");
      await page.locator("[data-application-back]").click();
      assert.equal(
        await page.locator("[name=name]").inputValue(),
        "체험 방문객",
      );
      await page
        .locator("[data-application-form]")
        .evaluate((f) => f.requestSubmit());
      await page.locator("[data-application-submit]").evaluate((b) => {
        b.click();
        b.click();
      });
      await page.waitForSelector(".flow-receipt");
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= 390),
        path + " mobile overflow",
      );
    }
    await page.evaluate(() => (location.hash = "#/account/applications"));
    await page.waitForSelector(".application-record");
    assert.equal(await page.locator(".application-record").count(), routes.length);
    assert.deepEqual(errors, []);
    console.log(
      "All 13 application forms: required validation, edit persistence, completion, duplicate prevention, history, mobile layout passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
