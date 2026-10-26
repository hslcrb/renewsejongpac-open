const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v2/index.html";

// [실제 화면의 가독성 계약 / Readability contract in the rendered UI]
// 글자를 줄이는 회귀와 터치 영역·넘침 문제를 실제 브라우저에서 확인합니다.
// Catch small-text regressions, insufficient targets and overflow in the browser.
async function readableText(page) {
  const small = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const failed = [];
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent.trim();
      const element = walker.currentNode.parentElement;
      if (!text || element.closest("script, style, svg, noscript, .sr-only, [inert], [hidden]")) continue;
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const size = parseFloat(getComputedStyle(element).fontSize);
      if (size < 16) failed.push({ text: text.slice(0, 50), size });
    }
    return failed;
  });
  assert.deepEqual(small, [], "visible interface text must be at least 16px");
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("dialog", dialog => dialog.dismiss());
    await page.goto(base);
    const nav = page.getByRole("navigation", { name: "빠른 서비스" });
    await nav.waitFor();
    assert.equal(await page.locator(".visit-photograph figcaption").count(), 0);
    assert.equal(await page.getByText("SEOUL · SINCE 1978", { exact: true }).count(), 0);

    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1100 });
      await nav.scrollIntoViewIfNeeded();
      await readableText(page);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow`);
      assert.equal(await page.locator("body").evaluate(el => parseFloat(getComputedStyle(el).fontSize)), 18);
      assert.equal(await nav.locator(".quick-access-label").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)), 16);
      assert.equal(await page.locator(".season-toolbar > p").evaluate(el => parseFloat(getComputedStyle(el).fontSize)), 20);
      const links = await nav.getByRole("link").evaluateAll(links => links.map(link => ({
        size: parseFloat(getComputedStyle(link).fontSize),
        height: link.getBoundingClientRect().height,
        right: link.getBoundingClientRect().right,
      })));
      assert.equal(links.length, 4);
      for (const link of links) {
        assert.equal(link.size, width <= 600 ? 20 : 22);
        assert(link.height >= 64);
        assert(link.right <= width);
      }
      if (width === 390) await nav.screenshot({ path: "/tmp/sejong-readable-mobile.png" });
      if (width === 1440) {
        const start = await page.locator(".season-toolbar").boundingBox();
        const end = await nav.boundingBox();
        await page.screenshot({ path: "/tmp/sejong-readable-desktop.png", clip: { x: 0, y: start.y, width, height: end.y + end.height - start.y + 12 } });
      }
      console.log(`${width}px: text scale, targets and width passed`);
    }

    // [링크의 상태와 목적지 / Link feedback and destinations]
    const link = nav.getByRole("link").first();
    const rest = await link.boundingBox();
    await link.focus();
    assert.equal(await link.evaluate(el => getComputedStyle(el).outlineStyle), "solid");
    await link.hover();
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".quick-access a")).backgroundColor === "rgb(240, 242, 244)");
    assert.equal((await link.boundingBox()).y, rest.y, "hover must not move the link");
    await page.mouse.down();
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".quick-access a")).backgroundColor === "rgb(225, 229, 233)");
    await page.mouse.move(0, 0);
    await page.mouse.up();
    for (const [title, hash] of [["공연 일정", "#/programs?view=calendar"], ["예매 확인", "#/account/bookings"], ["오시는 길", "#/visit/directions"], ["관람 안내", "#/visit/accessibility"]]) {
      await nav.getByRole("link", { name: title, exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(hash => location.hash === hash, hash);
      await page.locator("main h1").waitFor();
      await readableText(page);
      await page.goto(base);
      await nav.waitFor();
    }

    // [배너의 순서와 재생 상태 / Carousel position and playback]
    const current = page.locator("[data-season-current]");
    assert.equal(await current.textContent(), "01");
    const pause = page.locator('[data-hero="pause"]');
    assert.equal(await pause.getAttribute("aria-pressed"), "true");
    await page.locator('[data-hero="next"]').click();
    assert.equal(await current.textContent(), "02");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await current.textContent(), "01");
    await pause.click();
    assert.equal(await pause.getAttribute("aria-label"), "자동 재생 일시정지");
    assert.equal(await pause.getAttribute("aria-pressed"), "false");
    await pause.click();
    const animated = await browser.newPage({ reducedMotion: "no-preference" });
    animated.on("dialog", dialog => dialog.dismiss());
    await animated.goto(base);
    await animated.locator('[data-hero="pause"]').click();
    await animated.locator('[data-hero="next"]').click();
    await animated.waitForFunction(() => document.querySelector("[data-season-current]").textContent === "02");
    await animated.close();
    assert.deepEqual(errors, []);
    console.log("Link states, keyboard navigation, destinations, carousel and reduced motion passed.");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
