const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const origin = process.env.SEJONG_TEST_ORIGIN || "http://127.0.0.1:8000";

// [장식 제거와 알림 형태의 회귀 검사 / Decorative-content and feedback-shape regression]
// 사용자가 지적한 실제 화면과 관심 프로그램 동작을 검사합니다.
// Exercise the affected screens and real favorite interactions.
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
    headless: true,
  });
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    page.setDefaultTimeout(10000);
    page.on("dialog", dialog => dialog.dismiss());
    for (const route of ["/about", "/about/introduction"]) {
      await page.goto(`${origin}/v2/index.html#${route}`);
      await page.locator(".institution-story").waitFor();
      const text = await page.locator("main").innerText();
      for (const rejected of ["SINCE 1978 · GWANGHWAMUN, SEOUL", "A PLACE FOR EVERYONE", "HEAVEN · EARTH · HUMAN", "OUR RESPONSIBILITY"]) {
        assert(!text.includes(rejected), `${route}: decorative label remains: ${rejected}`);
      }
      assert.equal(await page.locator("main .eyebrow").count(), 0, "about headings do not need duplicate category labels");
      assert.equal(await page.locator(".institution-story figcaption").count(), 0);
      assert(await page.locator(".institution-story img").getAttribute("alt"));
      assert.equal(await page.locator(".identity-story-channels .identity-shape").count(), 3, "latest request preserves only the lower identity diagram");
      assert.equal(await page.locator(".page-title-row .identity-marks").count(), 0, "header decoration remains removed");
      assert.equal(await page.locator("main .overview-service-number").count(), 0, "plain about navigation needs no decorative English tags or counters");
      assert.equal(await page.getByRole("link", { name: "천지인 아이덴티티", exact: true }).count(), 1, "useful identity navigation remains");
    }

    // [구·신버전의 일관된 캡슐 알림 / Consistent capsule feedback in both versions]
    for (const entry of ["/v2/index.html", "/legacy.html"]) {
      for (const width of [1280, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(origin + entry);
        const favorite = page.locator("[data-favorite]").first();
        if (entry.includes("v2")) await page.locator(".card--poster").first().hover();
        await favorite.click();
        await favorite.click();
        const toast = page.locator("#toast");
        await toast.waitFor({ state: "visible" });
        assert.match(await toast.innerText(), /삭제/);
        assert.equal(await toast.getAttribute("role"), "status");
        assert.equal(await toast.getAttribute("aria-live"), "polite");
        const dimensions = await toast.evaluate(el => ({
          radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
          height: el.getBoundingClientRect().height,
          fontSize: parseFloat(getComputedStyle(el).fontSize),
        }));
        assert(dimensions.radius >= dimensions.height / 2, `${entry}: toast ends must be fully rounded`);
        assert(dimensions.fontSize >= 16);
        assert.equal(await page.locator("dialog[open]").count(), 0, "favorite feedback must not block the page");
        assert.equal(await favorite.getAttribute("aria-pressed"), "false");
        assert(await favorite.evaluate(el => el === document.activeElement), "toast must preserve focus");
        await toast.waitFor({ state: "hidden", timeout: 5000 });
      }
    }

    // [실제 모달의 모서리·닫기·초점 / Actual dialog corners, dismissal and focus]
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin + "/v2/index.html");
      for (const id of ["search-dialog", "menu-dialog"]) {
        const opener = page.locator(`[data-open-dialog="${id}"]`);
        await opener.click();
        const dialog = page.locator(`#${id}`);
        await dialog.waitFor({ state: "visible" });
        assert.equal(await dialog.evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius)), 24);
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        assert(await opener.evaluate(el => el === document.activeElement), "dialog must restore opener focus");
      }
    }
    console.log("About cleanup; desktop/mobile capsule toasts in both versions; 24px dialog corners, Escape and restored focus passed.");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
