const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", dialog => dialog.dismiss());
  const visit = async (path) => {
    await page.goto(
      (process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v4") + "/#" + path,
    );
    await page.waitForSelector(".flow-page");
  };
  await visit("/rental/apply?venue=chamber&date=2026-10-20");
  assert.equal(await page.inputValue("[name=venue]"), "chamber");
  assert.equal(await page.inputValue("[name=date]"), "2026-10-20");
  await visit("/rental/apply?venue=grand&date=2026-11-01");
  assert.equal(await page.inputValue("[name=venue]"), "grand");
  assert.equal(await page.inputValue("[name=date]"), "2026-11-01");
  await visit("/rental/apply?venue=missing&date=2026-02-30");
  assert.equal(await page.inputValue("[name=venue]"), "");
  assert.equal(await page.inputValue("[name=date]"), "");
  assert(await page.locator("#flow-error").isVisible());
  await visit("/apply/education?program=nonexistent");
  assert.equal(await page.locator("[data-application-form]").count(), 0);
  assert(
    (await page.locator("main").innerText()).includes(
      "신청할 교육 프로그램을 찾을 수 없습니다.",
    ),
  );
  await visit("/apply/education?program=academy");
  assert.equal(await page.inputValue("[name=program]"), "academy");
  console.log(
    "Rental prefills, query changes, invalid fallback and education guard passed in browser.",
  );
  await visit("/booking/carmen?date=2026-10-17");
  await page.locator("[data-booking-date] button[type=submit]").click();
  await page.locator('[data-seat="A1"]').click();
  await page.locator('[data-seat="A2"]').click();
  await page.locator("[data-booking-next]").click();
  assert.equal(await page.inputValue("[name=discount]"), "general");
  assert.equal(
    await page.locator("[data-booking-total]").innerText(),
    "160,000원",
  );
  for (const [discount, total] of [
    ["membership", "144,000원"],
    ["youth", "128,000원"],
  ]) {
    await page.selectOption("[name=discount]", discount);
    assert.equal(await page.locator("[data-booking-total]").innerText(), total);
    assert.equal(await page.locator("[data-review-total]").innerText(), total);
  }
  await page.evaluate(() => {
    const el = document.querySelector("[name=discount]");
    el.add(new Option("invalid", "invalid"));
    el.value = "invalid";
    document.querySelector("[data-booking-review]").requestSubmit();
  });
  assert((await page.locator("#flow-error").innerText()).includes("할인 종류"));
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("sejong-v4:bookings") || "[]").length,
    ),
    0,
  );
  await page.selectOption("[name=discount]", "youth");
  await page.fill("[name=name]", "할인 체험");
  await page.fill("[name=email]", "discount@example.com");
  await page.fill("[name=phone]", "010-1234-5678");
  await page.check("[name=consent]");
  await page.locator("[data-booking-back]").click();
  await page.locator('[data-seat="A5"]').click();
  assert.equal(
    await page.locator("[data-booking-total]").innerText(),
    "192,000원",
  );
  await page.locator("[data-booking-next]").click();
  assert.equal(await page.inputValue("[name=discount]"), "youth");
  assert.equal(
    await page.locator("[data-review-total]").innerText(),
    "192,000원",
  );
  await page.locator("[data-booking-review] button[type=submit]").click();
  assert(
    (await page.locator(".flow-receipt").innerText()).includes("192,000원"),
  );
  let bookings = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sejong-v4:bookings")),
  );
  assert.equal(bookings[0].total, 192000);
  assert.equal(bookings[0].subtotal, 240000);
  assert.equal(bookings[0].discount, "youth");
  assert.equal(bookings[0].discountRate, 20);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await visit("/booking/carmen?date=2026-10-18");
  assert.equal(await page.inputValue("[name=date]"), "2026-10-18");
  assert.equal(
    await page.locator("[data-discount-summary]").innerText(),
    "일반 · 0%",
  );
  console.log(
    "General/member/youth totals, invalid discount rejection, seat edits, receipt, persisted pricing and new-date reset passed.",
  );
  for (const path of [
    "/news/events/autumn-walk/apply",
    "/news/events/review/apply",
  ]) {
    await visit(path);
    assert.equal(await page.locator("[name=phone]").count(), 0);
    await page.locator("[data-application-form] button[type=submit]").click();
    assert(await page.locator("#flow-error").isVisible());
    await page.fill("[name=name]", "이벤트 체험");
    await page.fill("[name=email]", "event@example.com");
    await page.selectOption("[name=program]", "carmen");
    await page.fill(
      "[name=message]",
      "카르멘의 선율과 무대가 기대됩니다. 시연용 응모 후기입니다.",
    );
    await page.check("[name=consent]");
    await page.locator("[data-application-form] button[type=submit]").click();
    await page.locator("[data-application-back]").click();
    assert.equal(await page.inputValue("[name=program]"), "carmen");
    await page.locator("[data-application-form] button[type=submit]").click();
    await page.locator("[data-application-submit]").click();
    assert(await page.locator(".flow-receipt").isVisible());
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      390,
    );
  }
  await visit("/account/applications");
  assert.equal(await page.locator(".application-record").count(), 2);
  assert((await page.locator("main").innerText()).includes("이벤트 응모"));
  assert.deepEqual(errors, []);
  console.log(
    "Both event entry validation, edit, receipt/history and mobile overflow checks passed; no page errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
