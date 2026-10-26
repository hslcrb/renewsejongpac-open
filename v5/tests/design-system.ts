import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import type { Page } from "playwright";
import { CHAPTERS, DESIGN_COLORS } from "../src/data/design-system.ts";

// [실제 브라우저의 디자인 가이드와 스크롤 / Design guide and scroll behavior in a real browser]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const guide = new URL("design-rules/", base).href;
const directory = path.resolve(".lemonade/design-system");
fs.mkdirSync(directory, { recursive: true });
const connected = Boolean(process.env.SEJONG_TEST_CDP);
const browser = connected
    ? await chromium.connectOverCDP(process.env.SEJONG_TEST_CDP!)
    : await chromium.launch();
const context = connected
    ? browser
          .contexts()
          .find((context) =>
              context.pages().some((page) => page.url().includes("/design-rules")),
          ) || browser.contexts()[0]
    : await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
const page = connected
    ? context.pages().find((page) => page.url().includes("/design-rules")) ||
      (await context.newPage())
    : await context.newPage();
const errors: string[] = [];
const results: { name: string; passed: boolean; error?: string }[] = [];
page.setDefaultTimeout(8000);
page.on("pageerror", (error) => errors.push(error.message));

async function check(name: string, run: () => Promise<void>) {
    try {
        await run();
        results.push({ name, passed: true });
        console.log(`PASS ${name}`);
    } catch (error) {
        const message = error instanceof Error ? error.stack || error.message : String(error);
        results.push({ name, passed: false, error: message });
        console.error(`FAIL ${name}: ${message}`);
    }
}
async function goChapter(id: string) {
    await page.goto(guide + "#" + id, { waitUntil: "networkidle" });
    await page.waitForFunction(
        (chapter) =>
            document.querySelector(`.ds-nav-group a[aria-current="page"]`)?.getAttribute("href") ===
            "#" + chapter,
        id.split("/")[0],
    );
    await page.evaluate(() => document.fonts.ready);
}
async function readable(target: Page) {
    const state = await target.evaluate(() => {
        const root = document.querySelector(".design-system-page")!;
        const small = [
            ...root.querySelectorAll("p,a,button,input,select,label,span,code,td,th,summary,kbd"),
        ]
            .filter((element) => {
                const bounds = element.getBoundingClientRect();
                const style = getComputedStyle(element);
                return (
                    bounds.width > 0 &&
                    bounds.height > 0 &&
                    !element.closest("dialog:not([open])") &&
                    style.visibility !== "hidden" &&
                    style.display !== "none" &&
                    parseFloat(style.fontSize) < 16
                );
            })
            .map(
                (element) =>
                    `${element.tagName}.${element.className}: ${getComputedStyle(element).fontSize} ${element.textContent?.slice(0, 40)}`,
            );
        return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            body: getComputedStyle(document.body).fontSize,
            small,
        };
    });
    assert.equal(state.overflow, false, "Document should fit the viewport");
    assert.equal(state.body, "16px");
    assert.deepEqual(state.small, []);
}

try {
    await page.goto("about:blank");
    await page.setViewportSize({ width: 1600, height: 1000 });
    for (const chapter of CHAPTERS)
        await check(`desktop chapter: ${chapter.label}`, async () => {
            await goChapter(chapter.id);
            assert.equal(await page.locator("h1").count(), 1);
            assert.equal(
                await page.locator(".ds-document [data-doc-section]").count(),
                chapter.sections.length,
            );
            assert.equal(await page.locator(".renewal-header").count(), 0);
            await readable(page);
            const broken = await page
                .locator(".ds-document img")
                .evaluateAll((images) =>
                    images
                        .filter(
                            (image) =>
                                (image as HTMLImageElement).complete &&
                                !(image as HTMLImageElement).naturalWidth,
                        )
                        .map((image) => (image as HTMLImageElement).src),
                );
            assert.deepEqual(broken, []);
            await page.screenshot({ path: path.join(directory, `${chapter.id}-desktop.png`) });
        });

    await check("actual palette and 16px foundation match the documented system", async () => {
        const actual = await page.evaluate(
            (colors) =>
                colors.map((color) => {
                    const value = getComputedStyle(document.documentElement)
                        .getPropertyValue("--" + color.token)
                        .trim()
                        .toUpperCase();
                    return /^#[0-9A-F]{3}$/.test(value)
                        ? "#" + [...value.slice(1)].map((digit) => digit + digit).join("")
                        : value;
                }),
            DESIGN_COLORS,
        );
        assert.deepEqual(
            actual,
            DESIGN_COLORS.map((color) => color.hex),
        );
    });
    await check("search, keyboard shortcut, empty state and focus restoration", async () => {
        await goChapter("overview");
        await page.getByRole("button", { name: "디자인 가이드 검색" }).click();
        assert.equal(
            await page
                .locator("#doc-search")
                .evaluate((element) => document.activeElement === element),
            true,
        );
        assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
        await page.locator("#doc-search").fill("color-yellow");
        assert.equal(await page.locator(".ds-search-results a").count(), 1);
        assert.match(await page.locator(".ds-search-results").innerText(), /F7D549/);
        await page.locator("#doc-search").fill("없는검색어123");
        assert.match(await page.locator(".ds-search-results").innerText(), /찾는 기준이 없습니다/);
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => document.body.style.overflow === "");
        assert.equal(
            await page
                .getByRole("button", { name: "디자인 가이드 검색" })
                .evaluate((element) => document.activeElement === element),
            true,
        );
        assert.equal(await page.evaluate(() => document.body.style.overflow), "");
        await page.keyboard.press("Control+k");
        await page.locator("#doc-search").fill("16px");
        await page.locator('.ds-search-results a[href="#typography"]').click();
        await page.waitForFunction(
            () => document.querySelector("h1")?.textContent === "타이포그래피",
        );
        assert.equal(await page.locator("dialog[open]").count(), 0);
    });
    await check("shareable section URLs, chapter links and browser history", async () => {
        await goChapter("color/contrast");
        await page.waitForFunction(
            () => document.activeElement === document.querySelector("#color-contrast h2"),
        );
        await page
            .locator(".ds-sidebar")
            .getByRole("link", { name: "브랜드와 로고", exact: true })
            .click();
        await page.waitForFunction(
            () => document.querySelector("h1")?.textContent === "브랜드와 로고",
        );
        await page.goBack();
        await page.waitForFunction(() => document.querySelector("h1")?.textContent === "컬러");
    });
    await check("color copy, type specimen and real computed font values", async () => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(base).origin });
        await goChapter("color");
        await page.getByRole("button", { name: "노랑 #F7D549 복사" }).click();
        await page.waitForFunction(() =>
            document.querySelector(".ds-feedback-line")?.textContent?.includes("노랑을 복사"),
        );
        assert.match(
            await page.getByRole("button", { name: "노랑 #F7D549 복사" }).innerText(),
            /복사됨/,
        );
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "#F7D549");
        await goChapter("typography");
        await page.locator("#type-specimen-text").fill("세종 Sejong 2026");
        await page.locator("#type-size").selectOption("16");
        await page.locator("#type-weight").selectOption("700");
        assert.deepEqual(
            await page.locator("[data-type-specimen]").evaluate((element) => ({
                text: element.textContent,
                size: getComputedStyle(element).fontSize,
                weight: getComputedStyle(element).fontWeight,
            })),
            { text: "세종 Sejong 2026", size: "16px", weight: "700" },
        );
    });
    await check(
        "component examples: field semantics, tabs, disclosure and modal lifecycle",
        async () => {
            await goChapter("components");
            await page.locator("#demo-name").fill("예제 관람객");
            assert.equal(await page.locator("#demo-error").getAttribute("aria-invalid"), "true");
            assert.equal(
                await page.locator("#demo-error").getAttribute("aria-describedby"),
                "demo-error-message",
            );
            await page.locator("#sample-tab-0").focus();
            await page.keyboard.press("End");
            assert.equal(await page.locator("#sample-tab-2").getAttribute("aria-selected"), "true");
            await page.keyboard.press("ArrowLeft");
            assert.equal(await page.locator("#sample-tab-1").getAttribute("aria-selected"), "true");
            await page.locator(".ds-disclosure summary").click();
            assert.equal(await page.locator(".ds-disclosure").getAttribute("open"), "");
            const trigger = page.getByRole("button", { name: "날짜 선택 대화상자 열기" });
            await trigger.click();
            await page.locator('dialog[open] input[type="date"]').fill("2026-11-05");
            await page.keyboard.press("Tab");
            await page.keyboard.press("Tab");
            await page.keyboard.press("Tab");
            assert.equal(
                await page.evaluate(() => Boolean(document.activeElement?.closest("dialog[open]"))),
                true,
            );
            await page.keyboard.press("Escape");
            await page.waitForFunction(() => document.body.style.overflow === "");
            assert.equal(
                await trigger.evaluate((element) => document.activeElement === element),
                true,
            );
            assert.equal(await page.evaluate(() => document.body.style.overflow), "");
            await trigger.click();
            await page.getByRole("button", { name: "선택 적용", exact: true }).click();
            assert.match(await page.locator(".ds-feedback-line").innerText(), /2026-11-05/);
        },
    );
    await check(
        "the real poster card separates navigation, favorite state and visible feedback",
        async () => {
            await goChapter("components/cards");
            const card = page.locator(".ds-card-example .program-card");
            await card.hover();
            const button = card.locator(".favorite-button");
            const previous = await button.getAttribute("aria-pressed");
            await button.click();
            assert.notEqual(await button.getAttribute("aria-pressed"), previous);
            await page.waitForFunction(
                () => Number(getComputedStyle(document.querySelector("#toast")!).opacity) > 0.99,
            );
            assert.match(await page.locator("#toast").innerText(), /관심 프로그램/);
            await button.click();
            assert.equal(await button.getAttribute("aria-pressed"), previous);
            assert.equal(new URL(page.url()).pathname, new URL(guide).pathname);
        },
    );
    await check("token download contains the documented production foundations", async () => {
        // CDP cannot transfer download artifacts owned by a different Playwright client.
        const downloadBrowser = connected ? await chromium.launch() : null;
        const targetPage = downloadBrowser
            ? await downloadBrowser.newPage({ acceptDownloads: true })
            : page;
        try {
            await targetPage.goto(guide + "#resources", { waitUntil: "networkidle" });
            await targetPage.getByRole("heading", { name: "토큰과 자료", exact: true }).waitFor();
            const pending = targetPage.waitForEvent("download");
            await targetPage.getByRole("button", { name: "토큰 CSS 다운로드" }).click();
            const download = await pending;
            assert.equal(download.suggestedFilename(), "sejong-v5-tokens.css");
            const target = path.join(directory, "sejong-v5-tokens.css");
            await download.saveAs(target);
            const css = fs.readFileSync(target, "utf8");
            assert.match(css, /--color-yellow: #F7D549/);
            assert.match(css, /--text-body: 1rem/);
            assert.match(css, /--space-24: 6rem/);
        } finally {
            await downloadBrowser?.close();
        }
    });
    for (const width of [320, 390, 768])
        await check(`all chapters are readable and fit ${width}px`, async () => {
            await page.setViewportSize({ width, height: 900 });
            for (const chapter of CHAPTERS) {
                await goChapter(chapter.id);
                await readable(page);
            }
            await goChapter("color");
            await page.screenshot({ path: path.join(directory, `color-${width}.png`) });
            if (width < 980) {
                await page.getByRole("button", { name: "디자인 시스템 목차 열기" }).click();
                await page
                    .locator("dialog[open]")
                    .getByRole("link", { name: "컴포넌트", exact: true })
                    .click();
                await page.waitForFunction(
                    () => document.querySelector("h1")?.textContent === "컴포넌트",
                );
                assert.equal(await page.locator("dialog[open]").count(), 0);
            }
        });
    await check(
        "nested scroll motion is gradual, paused with input, and masked without collisions",
        async () => {
            await page.setViewportSize({ width: 1440, height: 1000 });
            await goChapter("motion/scroll");
            const scene = page.locator("[data-scroll-scene]");
            for (const top of [0, 60, 120, 180, 240, 320]) {
                await scene.evaluate((element, top) => {
                    element.scrollTop = top;
                }, top);
                await page.waitForTimeout(60);
                const overlaps = await scene.evaluate((element) => {
                    const slots = [...element.querySelectorAll(".booking-invitation-letter-slot")];
                    return slots.some((slot, index) => {
                        const a = slot.getBoundingClientRect();
                        return slots.slice(index + 1).some((next) => {
                            const b = next.getBoundingClientRect();
                            return (
                                Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 &&
                                Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5
                            );
                        });
                    });
                });
                assert.equal(overlaps, false);
                assert.equal(
                    await scene
                        .locator(".booking-invitation-letter-slot")
                        .first()
                        .evaluate((element) => getComputedStyle(element).overflowX),
                    "clip",
                );
            }
            await scene.evaluate((element) => {
                element.scrollTop = 150;
            });
            await page.waitForTimeout(80);
            const first = await scene
                .locator(".booking-invitation-letter")
                .evaluateAll((letters) =>
                    letters.map((letter) => letter.getAnimations()[0]?.currentTime),
                );
            await page.waitForTimeout(350);
            const held = await scene
                .locator(".booking-invitation-letter")
                .evaluateAll((letters) =>
                    letters.map((letter) => letter.getAnimations()[0]?.currentTime),
                );
            assert.deepEqual(first, held);
            assert.ok(first[0] !== first.at(-1));
            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.waitForFunction(
                () =>
                    document.querySelector("#design-scroll-title")!.getAnimations({ subtree: true })
                        .length === 0,
            );
            assert.equal(
                await scene
                    .locator(".booking-invitation-letter")
                    .evaluateAll((letters) =>
                        letters.every((letter) => getComputedStyle(letter).opacity === "1"),
                    ),
                true,
            );
            await page.emulateMedia({ reducedMotion: "no-preference" });
        },
    );
    await check(
        "home uses the shared scroll heading without changing its wording and preserves filled participation cards",
        async () => {
            await page.goto(base, { waitUntil: "networkidle" });
            await page.evaluate(() => document.fonts.ready);
            const heading = page.locator("#quick-booking-heading");
            assert.equal(await heading.textContent(), "관람 예약");
            assert.equal(await page.locator("#discover-heading").textContent(), "관람 일정");
            assert.equal(await page.locator("#visit-heading").textContent(), "오시는 길");
            await heading.scrollIntoViewIfNeeded();
            assert.equal(await heading.getAttribute("aria-label"), "관람 예약");
            assert.equal(await heading.locator(".booking-invitation-letter").count(), 4);
            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.waitForFunction(() => document.querySelector("#quick-booking-heading")?.getAnimations({ subtree: true }).length === 0);
            assert.equal(await heading.evaluate(element => element.getAnimations({ subtree: true }).length), 0);
            await page.emulateMedia({ reducedMotion: "no-preference" });
            const cards = await page.locator(".home-participation > a").evaluateAll(elements => elements.map(element => {
                const style = getComputedStyle(element);
                return { background: style.backgroundColor, border: style.borderTopWidth };
            }));
            assert.equal(cards.length, 3);
            assert.ok(cards.every(card => card.background !== "rgba(0, 0, 0, 0)" && card.border === "0px"));
            assert.equal(await page.locator(".home-participation").evaluate(element => getComputedStyle(element).borderTopWidth), "0px");
            for (const width of [320, 390]) {
                await page.setViewportSize({ width, height: 900 });
                await heading.scrollIntoViewIfNeeded();
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth <= innerWidth + 1,
                    ),
                    true,
                );
            }
        },
    );
    await check("no browser runtime errors", async () => {
        assert.deepEqual(errors, []);
    });
} finally {
    fs.writeFileSync(
        path.join(directory, "report.json"),
        JSON.stringify({ base, results, errors }, null, 2),
    );
    if (connected) {
        await page.setViewportSize({ width: 1600, height: 940 });
        await page.goto(guide, { waitUntil: "networkidle" });
    }
    await browser.close();
}
if (results.some((result) => !result.passed)) process.exitCode = 1;
