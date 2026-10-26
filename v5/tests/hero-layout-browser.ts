import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

// [인접 작품과 넓은 지면의 실제 동작 / Real neighbour navigation and wide-layout behaviour]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: "reduce" });
const page = await context.newPage();
const directory = ".lemonade/hero-layout";
fs.mkdirSync(directory, { recursive: true });
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
page.setDefaultTimeout(10000);
const active = () => page.locator(".season-slide.is-active").getAttribute("data-feature");
const go = (route = "") => page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
const settleViewport = async () => {
    // [컨테이너 쿼리의 실제 재배치 완료 확인 / Wait for actual container-query reflow]
    await page.waitForFunction(() => {
        const stage = document.querySelector(".season-stage")?.getBoundingClientRect();
        const card = document.querySelector(".season-slide.is-active")?.getBoundingClientRect();
        if (!stage || !card) return true;
        return card.width <= stage.width && card.left >= stage.left - 1 && card.right <= stage.right + 1
            && Math.abs(card.left + card.width / 2 - stage.left - stage.width / 2) < 1;
    }, undefined, { timeout: 2000 });
};
const tokenColor = (token: string) => page.evaluate(token => {
    const sample = document.createElement("span");
    sample.style.color = `var(${token})`;
    document.body.append(sample);
    const color = getComputedStyle(sample).color;
    sample.remove();
    return color;
}, token);
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) { results.push({ name, passed: false, error: String(error) }); console.error("FAIL", name, String(error)); await page.screenshot({ path: `${directory}/failure-${results.length}.png` }); }
}
try {
    await go();
    await check("both neighbouring works remain visible with readable program titles", async () => {
        assert.equal(await active(), "dance");
        assert.equal(await page.locator('[data-preview="previous"] .season-peer-title strong').innerText(), "빛이 머무는 자리");
        assert.equal(await page.locator('[data-preview="next"] .season-peer-title strong').innerText(), "카르멘");
        const metrics = await page.evaluate(() => {
            const main = document.querySelector(".season-slide.is-active")!.getBoundingClientRect();
            const stage = document.querySelector(".season-stage")!.getBoundingClientRect();
            return { main: { left: main.left, right: main.right, width: main.width }, stage: { width: stage.width }, peers: [...document.querySelectorAll<HTMLElement>(".season-peer-title")].map(element => {
                const rect = element.getBoundingClientRect();
                return { left: rect.left, right: rect.right, color: getComputedStyle(element).color, font: parseFloat(getComputedStyle(element.querySelector("strong")!).fontSize) };
            }) };
        });
        assert.ok(metrics.main.left > 100 && metrics.main.right < metrics.stage.width - 100);
        assert.ok(metrics.main.width >= 1400 && metrics.main.width <= 1441);
        const white = await tokenColor("--color-white");
        for (const peer of metrics.peers) {
            assert.ok(peer.left >= 0 && peer.right <= metrics.stage.width + 1, JSON.stringify(peer));
            assert.equal(peer.color, white);
            assert.ok(peer.font >= 16);
        }
        await page.screenshot({ path: `${directory}/verified-hero-1920.png` });
    });
    await check("peer clicks, keyboard activation and wraparound keep names, images and destinations together", async () => {
        await page.locator('[data-preview="next"] .season-peer-title').click();
        assert.equal(await active(), "carmen");
        assert.equal(await page.locator('.season-slide.is-active .season-actions a').last().getAttribute("href"), "/v5/booking/carmen/");
        const previous = page.locator('[data-preview="previous"] .season-peer-title');
        await previous.focus(); await page.keyboard.press("Enter");
        assert.equal(await active(), "dance");
        await page.getByRole("button", { name: "이전 프로그램", exact: true }).click();
        assert.equal(await active(), "light");
        assert.equal(await page.locator('[data-preview="next"] .season-peer-title strong').innerText(), "일무");
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    });
    await check("phone peeks keep both titles in reachable navigation and both primary actions inside the card", async () => {
        await page.setViewportSize({ width: 320, height: 1000 });
        await settleViewport();
        assert.equal(await page.locator(".hero-neighbor-navigation button:visible").count(), 2);
        assert.equal(await page.locator(".season-peer-title:visible").count(), 0);
        const geometry = await page.locator(".season-slide.is-active").evaluate(element => {
            const frame = element.getBoundingClientRect();
            const actions = element.querySelector(".season-actions")!.getBoundingClientRect();
            return { frame: { left: frame.left, right: frame.right }, actions: { left: actions.left, right: actions.right } };
        });
        assert.ok(geometry.frame.left >= 19 && geometry.frame.right <= 301, JSON.stringify(geometry));
        assert.ok(geometry.actions.left >= geometry.frame.left && geometry.actions.right <= geometry.frame.right + 1);
        await page.locator(".hero-neighbor-navigation button").last().click();
        assert.equal(await active(), "dance");
        await page.screenshot({ path: `${directory}/verified-hero-320.png` });
    });
    await check("horizontal dragging advances exactly one work and cancelled gestures return without navigation", async () => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await settleViewport();
        await page.getByRole("button", { name: "자동 재생 일시정지", exact: true }).click();
        const frame = (await page.locator(".season-slide.is-active").boundingBox())!;
        const x = frame.x + frame.width * 0.55;
        const y = frame.y + 140;
        await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x - 220, y + 3, { steps: 12 }); await page.mouse.up();
        await page.waitForFunction(() => document.querySelector(".season-slide.is-active")?.getAttribute("data-feature") === "carmen");
        const current = (await page.locator(".season-slide.is-active").boundingBox())!;
        await page.mouse.move(current.x + current.width * 0.5, y); await page.mouse.down(); await page.mouse.move(current.x + current.width * 0.5 + 25, y, { steps: 3 });
        await page.locator(".season-stage").dispatchEvent("pointercancel", { pointerId: 1, clientX: current.x + current.width * 0.5 + 25, clientY: y });
        await page.mouse.up();
        await page.waitForFunction(() => !document.querySelector(".season-track")?.classList.contains("is-returning"));
        assert.equal(await active(), "carmen");
        assert.equal(new URL(page.url()).pathname, "/v5/");
        const center = (await page.locator(".season-slide.is-active").boundingBox())!;
        assert.ok(Math.abs(center.x - (await page.locator(".season-stage").evaluate(element => element.clientWidth) - center.width) / 2) < 1);
    });
    await check("explicit playback resumes while the play button retains keyboard focus", async () => {
        await go();
        const playback = page.locator("#home-feature-playback");
        if (await playback.getAttribute("aria-pressed") === "false") await playback.click();
        const before = await active();
        await playback.click();
        await page.mouse.move(5, 5);
        assert.equal(await playback.evaluate(element => element === document.activeElement), true);
        await page.waitForFunction(before => document.querySelector(".season-slide.is-active")?.getAttribute("data-feature") !== before, before, { timeout: 6500 });
        await playback.click();
    });
    await check("releasing a gesture outside the stage before capture does not block playback", async () => {
        await go();
        const playback = page.locator("#home-feature-playback");
        if (await playback.getAttribute("aria-pressed") === "false") await playback.click();
        await playback.evaluate(element => (element as HTMLElement).blur());
        const stage = (await page.locator(".season-stage").boundingBox())!;
        const x = stage.x + stage.width / 2;
        await page.mouse.move(x, stage.y + stage.height - 2);
        await page.mouse.down();
        await page.mouse.move(x, stage.y + stage.height + 24);
        await page.mouse.up();
        const before = await active();
        await playback.click();
        await playback.evaluate(element => (element as HTMLElement).blur());
        await page.mouse.move(5, 5);
        await page.waitForFunction(before => document.querySelector(".season-slide.is-active")?.getAttribute("data-feature") !== before, before, { timeout: 6500 });
        await playback.click();
        await page.emulateMedia({ reducedMotion: "reduce" });
    });
    await check("registered inverse-quiet example matches the actual photo-overlay controls", async () => {
        await go("design-rules/#components/buttons");
        const sample = page.locator(".ds-overlay-controls .ds-button-inverse-quiet");
        await sample.waitFor();
        const style = await sample.evaluate(element => { const css = getComputedStyle(element); return { color: css.color, radius: css.borderRadius, minHeight: css.minHeight }; });
        assert.deepEqual(style, { color: await tokenColor("--color-white"), radius: "8px", minHeight: "48px" });
    });
    for (const route of ["", "programs/", "programs/dance/", "booking/dance/", "visit/directions/", "news/notices/", "account/", "account/login/", "design-rules/"]) {
        await check(`intrinsic layout, readable type and neutral copy across seven widths: ${route || "home"}`, async () => {
            await go(route);
            for (const width of [320, 390, 768, 1024, 1440, 1920, 2560]) {
                await page.setViewportSize({ width, height: 1080 });
                // [뷰포트 변경 뒤 컨테이너 쿼리 확정 / Settle container queries after viewport changes]
                await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                const metrics = await page.evaluate(() => {
                    const visible = (element: Element) => { const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return rect.width > 2 && rect.height > 2 && style.visibility !== "hidden"; };
                    return { scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth, frame: document.querySelector(".masthead.container")?.getBoundingClientRect().width, small: [...document.querySelectorAll("main p,main a,main button,main label,main input,main select,main textarea,main time")].filter(element => visible(element) && parseFloat(getComputedStyle(element).fontSize) < 15.9).map(element => ({ tag: element.tagName, text: element.textContent?.slice(0,50), size: getComputedStyle(element).fontSize })) };
                });
                assert.ok(metrics.scroll <= metrics.width + 1, `${route} ${width}px: ${JSON.stringify(metrics)}`);
                assert.deepEqual(metrics.small, [], `${route} ${width}px`);
                if (width >= 1920 && route !== "design-rules/") assert.ok(metrics.frame && Math.abs(metrics.frame - 1728) < 1, JSON.stringify(metrics));
                if ([390, 1920].includes(width)) await page.screenshot({ path: `${directory}/route-${route.replaceAll("/", "-") || "home"}-${width}.png` });
            }
            assert.doesNotMatch(await page.locator("body").innerText(), /체험\s?(계정|예매|프로필)|리뉴얼\s*시연|공식\s*사이트가\s*아닙|비공식|UNOFFICIAL/i);
        });
    }
    await check("mobile seats retain their spatial controls and guests must log in before saving", async () => {
        for (const width of [320, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            await go("booking/dance/");
            await page.getByRole("button", { name: /다음: 좌석 선택하기/ }).click();
            const map = page.getByRole("region", { name: "좌석 배치도" });
            assert.equal(await map.getAttribute("tabindex"), "0");
            assert.ok(await map.evaluate(element => element.scrollWidth > element.clientWidth));
            const first = page.getByRole("button", { name: "A8 좌석", exact: true });
            await first.click();
            const size = await first.boundingBox();
            assert.ok(size && size.width >= 48 && size.height >= 48);
            for (const seat of ["B1", "C8", "D1", "E1"]) await page.getByRole("button", { name: `${seat} 좌석`, exact: true }).click();
            assert.equal(await page.locator('[data-system-part="seat"][aria-pressed="true"]').count(), 4);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
            await page.getByRole("button", { name: "선택 내용 확인", exact: true }).click();
            assert.match(await page.locator(".booking-page-review").innerText(), /A8, B1, C8, D1/);
            await page.getByRole("button", { name: "예매 기록 저장", exact: true }).click();
            await page.locator('.ds-notice[role="alert"]').waitFor();
            assert.match(await page.locator('.ds-notice[role="alert"]').innerText(), /로그인한 뒤/);
            assert.equal(await page.locator("#booking-complete-heading").count(), 0);
            assert.equal(await page.evaluate(() => localStorage.getItem("sejong-v4:bookings")), null);
            assert.match(await page.locator(".booking-page-review").innerText(), /A8, B1, C8, D1/);
        }
    });
    await check("content reflows with 200 percent text without a page-wide horizontal scroll", async () => {
        await page.setViewportSize({ width: 390, height: 1000 });
        for (const route of ["", "programs/", "programs/dance/", "booking/dance/", "account/"]) {
            await go(route);
            await page.evaluate(async () => {
                document.documentElement.style.fontSize = "200%";
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            });
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), route || "home");
        }
    });
    await check("no browser runtime errors", async () => assert.deepEqual(errors, []));
} finally {
    fs.writeFileSync(`${directory}/report.json`, JSON.stringify({ base, verifiedAt: new Date().toISOString(), results, errors }, null, 2));
    await context.close(); await browser.close();
}
if (results.some(result => !result.passed)) process.exitCode = 1;
