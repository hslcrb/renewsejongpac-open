const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8000/v3/index.html";
const destinations = [
    ["오시는 길과 주차", "sejong-grand-facade.png", "/visit/directions"],
    ["공간과 좌석", "sejong-grand-auditorium.png", "/visit/spaces"],
    ["모두를 위한 관람", "visit-guide-access.png", "/visit/accessibility"],
    ["관람 전 알아두세요", "visit-guide-etiquette.png", "/visit/etiquette"],
];

// [방문 안내 이미지 전환 / Visitor guide image previews]
// 실제 hover·키보드·터치로 이미지 대응과 기존 목적지 이동을 검증합니다.
// Verify matching images and native navigation through pointer, keyboard and touch input.
(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
        headless: true,
        args: ["--no-sandbox"],
    });
    const errors = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        page.on("dialog", dialog => dialog.dismiss());
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(base);
        const section = page.locator("#plan-your-visit");
        const links = section.locator(".visit-link-list a");
        await section.scrollIntoViewIfNeeded();
        const originalSize = await section.locator("figure").boundingBox();
        const sharedPreview = section.locator(".visit-hover-preview");
        assert.equal(await sharedPreview.count(), 1, "all links share one preview frame");
        assert.equal(await links.locator("img").count(), 0, "links must not own separate popups");
        assert.equal(await sharedPreview.evaluate(element => getComputedStyle(element).opacity), "1", "the reference keeps its shared preview visible");
        const sharedElement = await sharedPreview.elementHandle();
        const sharedBounds = await sharedPreview.boundingBox();
        const listBounds = await section.locator(".visit-link-list").boundingBox();
        assert(sharedBounds.x >= listBounds.x + listBounds.width, "the shared preview is to the right of the text");

        async function expectImage(filename) {
            await page.waitForFunction(filename => {
                const images = [...document.querySelectorAll("#plan-your-visit figure img")];
                return images.some(image => image.src.endsWith(filename)
                    && image.complete && image.naturalWidth > 0
                    && getComputedStyle(image).opacity === "1"
                    && image.getAttribute("aria-hidden") !== "true");
            }, filename, { timeout: 5000 });
        }

        for (const [title, filename, path] of destinations.slice(1).concat([destinations[0]])) {
            const link = links.filter({ hasText: title });
            assert.equal(await link.getAttribute("href"), "#" + path);
            await link.hover();
            await expectImage(filename);
            assert(await sharedPreview.evaluate((element, original) => element === original, sharedElement), "hover must reuse the same frame");
            assert((await sharedPreview.locator("img.is-active").getAttribute("src")).endsWith(filename));
            const frame = await sharedPreview.boundingBox();
            const activeImage = await sharedPreview.locator("img.is-active").boundingBox();
            assert(Math.abs(activeImage.height - frame.height) < 1 && Math.abs(activeImage.width - frame.width) < 1,
                "image bounds must match the frame so square illustrations are not clipped");
            const size = await section.locator("figure").boundingBox();
            assert(Math.abs(size.height - originalSize.height) < 1);
            assert(Math.abs(size.width - originalSize.width) < 1);
            assert.equal(new URL(page.url()).hash, "", "preview must not navigate");
        }

        // [포인터를 고정한 스크롤과 목록 경계 / Stationary-pointer scrolling and list bounds]
        // 텍스트가 포인터 아래로 지나가면 같은 프레임에서 전환하고 목록 끝에서는 함께 이동합니다.
        // Switch within the same frame as rows pass the pointer; follow the rail at its end.
        await page.evaluate(() => {
            const list = document.querySelector(".visit-link-list");
            window.scrollTo({ top: scrollY + list.getBoundingClientRect().top - 340, behavior: "instant" });
        });
        await links.first().hover();
        await expectImage(destinations[0][1]);
        const beforeScroll = await sharedPreview.boundingBox();
        const firstRow = await links.first().boundingBox();
        assert(Math.abs(beforeScroll.y + beforeScroll.height / 2 - 500) < 1,
            "the shared preview stays at viewport center while there is room in the list");
        await page.mouse.wheel(0, firstRow.height);
        await expectImage(destinations[1][1]);
        const afterScroll = await sharedPreview.boundingBox();
        assert(Math.abs(afterScroll.y - beforeScroll.y) < 1, "scrolling must keep the common frame centered");
        assert(await sharedPreview.evaluate((element, original) => element === original, sharedElement));
        assert((await sharedPreview.locator("img.is-active").getAttribute("src")).endsWith(destinations[1][1]),
            "stationary-pointer scrolling updates the right-hand image");
        assert.equal(await sharedPreview.locator("img").first().evaluate(image => getComputedStyle(image).transitionDuration), "0.24s");
        await page.mouse.move(0, 0);
        await page.evaluate(() => window.scrollBy({ top: 200, behavior: "instant" }));
        const atEnd = await sharedPreview.boundingBox();
        const rail = await section.locator(".visit-hover-rail").boundingBox();
        assert(atEnd.y < beforeScroll.y, "at the list end the preview moves with its parent");
        assert(atEnd.y >= rail.y - 1 && atEnd.y + atEnd.height <= rail.y + rail.height + 1,
            "the preview must remain inside the list rail");

        await page.mouse.move(0, 0);
        await links.first().focus();
        for (let index = 0; index < destinations.length; index++) {
            if (index) await page.keyboard.press("Tab");
            assert(await links.nth(index).evaluate(link => link === document.activeElement));
            await expectImage(destinations[index][1]);
        }

        // [연속 입력과 모션 감소 / Rapid input and reduced motion]
        // 빠르게 항목을 바꾸어도 마지막 항목이 남고 모션 감소 설정을 따릅니다.
        // The latest choice wins even while images load; reduced motion suppresses fading.
        await links.nth(1).hover();
        await links.nth(2).hover();
        await links.nth(3).hover();
        await expectImage(destinations[3][1]);
        await page.mouse.move(0, 0);
        assert.equal(await sharedPreview.evaluate(element => getComputedStyle(element).opacity), "1", "leaving the list retains the last preview");
        assert((await sharedPreview.locator("img.is-active").getAttribute("src")).endsWith(destinations[3][1]));
        await page.emulateMedia({ reducedMotion: "reduce" });
        const transition = await section.locator("figure img").first().evaluate(image =>
            getComputedStyle(image).transitionDuration.split(",").every(value => parseFloat(value) <= 0.01));
        assert(transition, "reduced motion disables image fading");

        for (const width of [320, 390, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            // 화면 폭과 media emulation 변경 뒤 실제 CSS 레이아웃이 반영될 때까지 기다립니다.
            // Wait for CSS layout after viewport and media-emulation changes.
            await page.waitForFunction(width => innerWidth === width
                && document.documentElement.scrollWidth <= width, width, { timeout: 5000 });
            await links.nth(1).focus();
            await expectImage(destinations[1][1]);
        }
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => location.hash === "#/visit/spaces");
        await page.goto(base);
        await page.locator("#plan-your-visit .visit-link-list a").nth(2).hover();
        await expectImage(destinations[2][1]);

        const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
        touch.on("dialog", dialog => dialog.dismiss());
        touch.on("pageerror", error => errors.push(error.message));
        await touch.goto(base);
        await touch.locator("#plan-your-visit .visit-link-list a").nth(2).tap();
        await touch.waitForFunction(() => location.hash === "#/visit/accessibility");
        assert.deepEqual(errors, []);
        console.log("Visitor preview: one shared right-hand frame, no per-link popups, four matching images, stationary-pointer scrolling, viewport centering and list bounds, hover, Tab/Enter, rapid input, stable sizing at five widths, reduced motion, route re-entry and one-tap touch navigation passed.");
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
