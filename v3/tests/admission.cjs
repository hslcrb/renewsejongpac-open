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
      (process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v3") + "/#" + path,
    );
    await page.waitForSelector(".flow-page");
  };
  await visit(
    "/visit/support/inquiry?subject=" +
      encodeURIComponent("분실물 문의: 검정 우산"),
  );
  assert.equal(
    await page.inputValue("[name=subject]"),
    "분실물 문의: 검정 우산",
  );
  await visit(
    "/visit/support/inquiry?subject=" + encodeURIComponent("수정된 제목"),
  );
  assert.equal(await page.inputValue("[name=subject]"), "수정된 제목");
  await visit("/visit/support/inquiry?subject=" + "a".repeat(201));
  assert.equal(await page.inputValue("[name=subject]"), "");
  assert(await page.locator("#flow-error").isVisible());
  console.log("Subject prefill, changed query and length validation passed.");
  await visit("/booking/academy");
  assert.equal(await page.locator("[data-booking-date]").count(), 0);
  assert.equal(await page.locator("[data-seat]").count(), 0);
  assert.equal(
    await page.locator('a[href="#/apply/education?program=academy"]').count(),
    1,
  );
  await page.locator('a[href="#/apply/education?program=academy"]').click();
  await page.waitForSelector("[data-application-form]");
  assert.equal(await page.inputValue("[name=program]"), "academy");
  console.log("Education booking guard and course application CTA passed.");
  await visit("/booking/light?date=2026-10-20");
  await page.locator("[data-booking-date] button[type=submit]").click();
  assert.equal(await page.locator("[data-seat]").count(), 0);
  assert.equal(await page.locator("[name=quantity]").count(), 4);
  await page.check('[name=quantity][value="3"]');
  assert.equal(
    await page.locator("[data-booking-total]").innerText(),
    "45,000원",
  );
  assert(
    (await page.locator("[data-seat-summary]").innerText()).includes(
      "입장권 3매",
    ),
  );
  await page.evaluate(() => {
    document.querySelector("[name=quantity]:checked").value = "5";
    document.querySelector("[data-booking-next]").click();
  });
  assert((await page.locator("#flow-error").innerText()).includes("1~4명"));
  await page.evaluate(() => {
    document.querySelector("[name=quantity]:checked").value = "3";
  });
  await page.locator("[data-booking-next]").click();
  assert(
    (
      await page.locator("[data-booking-review] .flow-info-box").innerText()
    ).includes("입장권 3매"),
  );
  await page.selectOption("[name=discount]", "membership");
  assert.equal(
    await page.locator("[data-review-total]").innerText(),
    "40,500원",
  );
  await page.fill("[name=name]", "전시 관람객");
  await page.fill("[name=email]", "exhibition@example.com");
  await page.fill("[name=phone]", "010-1234-5678");
  await page.check("[name=consent]");
  await page.locator("[data-booking-back]").click();
  assert(await page.locator('[name=quantity][value="3"]').isChecked());
  await page.check('[name=quantity][value="4"]');
  await page.locator("[data-booking-next]").click();
  assert.equal(
    await page.locator("[data-review-total]").innerText(),
    "54,000원",
  );
  await page.locator("[data-booking-review] button[type=submit]").click();
  assert(
    (await page.locator(".flow-receipt").innerText()).includes("입장권 4매"),
  );
  assert(
    (await page.locator(".flow-receipt").innerText()).includes("54,000원"),
  );
  let booking = await page.evaluate(
    () => JSON.parse(localStorage.getItem("sejong-v3:bookings"))[0],
  );
  assert.equal(booking.quantity, 4);
  assert.equal(booking.ticketType, "admission");
  assert.deepEqual(booking.seats, []);
  assert.equal(booking.total, 54000);
  assert.equal(booking.subtotal, 60000);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await visit("/account/bookings");
  assert(
    (await page.locator(".account-booking").innerText()).includes("입장권 4매"),
  );
  assert(
    !(await page.locator(".account-booking").innerText()).includes("좌석"),
  );
  await page.locator("[data-cancel-booking]").click();
  assert(
    (await page.locator("[role=alertdialog]").innerText()).includes("입장권"),
  );
  await page.locator("[data-cancel-confirm]").click();
  assert(
    (await page.locator(".account-booking").innerText()).includes("취소 완료"),
  );
  booking = await page.evaluate(
    () => JSON.parse(localStorage.getItem("sejong-v3:bookings"))[0],
  );
  assert.equal(booking.status, "cancelled");
  await visit("/booking/light");
  assert(await page.locator("[data-booking-date]").isVisible());
  assert.deepEqual(errors, []);
  console.log(
    "Exhibition quantity limits, discount, edits, receipt/storage/history/cancellation and mobile width passed with no page errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
