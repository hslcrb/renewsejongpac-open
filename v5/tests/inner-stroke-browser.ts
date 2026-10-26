import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import type { Locator } from "playwright";
import { expect } from "playwright/test";

// [실제 조작과 비율 배치 검증 / Verify live controls and proportional layout]
// 외부 회원 요청은 가로채고 독립 브라우저에서 제품과 가이드의 같은 규격을 대조합니다.
// Stub member requests and compare matching product and guide variants in an isolated browser.
const base = (process.argv.find(argument => /^https?:\/\//.test(argument)) || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const focusOnly = process.argv.includes("--focus-only");
const evidence = path.resolve(".lemonade/inner-stroke");
mkdirSync(evidence, { recursive: true });
const beforeFile = path.join(evidence, "before-report.json");
const before = existsSync(beforeFile) ? JSON.parse(readFileSync(beforeFile, "utf8")) : null;
const widths = [320, 390, 768, 1024, 1440];
const items = [
    ["공간안내", "visit/spaces/"],
    ["오시는 길·주차", "visit/directions/"],
    ["편의시설", "visit/amenities/"],
    ["장애인 이용안내", "visit/accessibility/"],
    ["관람 유의사항", "visit/etiquette/"],
    ["고객지원", "visit/support/"],
];
type Check = { name: string; passed: boolean; error?: string; data?: unknown };
const checks: Check[] = [];
const browserErrors: string[] = [];
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: "reduce", timezoneId: "Asia/Seoul" });
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.on("pageerror", error => browserErrors.push(error.message));
let releaseOtp: (() => void) | undefined;
let otpRequested = false;
const otpGate = new Promise<void>(resolve => { releaseOtp = resolve; });

await context.route(url => url.origin !== new URL(base).origin, async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/auth/v1/settings") return route.fulfill({ json: { external: { google: false } } });
    if (url.pathname === "/auth/v1/otp") {
        otpRequested = true;
        await otpGate;
        return route.fulfill({ status: 503, json: { msg: "검증 중에는 이메일을 전송하지 않습니다." } });
    }
    return route.abort();
});

const near = (actual: number, expected: number, message: string, tolerance = 1) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} (expected ${expected})`);
async function check(name: string, run: () => Promise<unknown>) {
    try {
        checks.push({ name, passed: true, data: await run() });
        console.log(`PASS ${name}`);
    } catch (error) {
        const message = error instanceof Error ? error.stack || error.message : String(error);
        checks.push({ name, passed: false, error: message });
        console.error(`FAIL ${name}: ${message}`);
        await page.screenshot({ path: path.join(evidence, `after-failure-${checks.length}.png`), fullPage: true }).catch(() => {});
    }
}
async function go(route: string, width: number) {
    await page.setViewportSize({ width, height: 1000 });
    const target = new URL(route, base);
    const previous = new URL(page.url());
    const response = await page.goto(target.href, { waitUntil: "networkidle" });
    if (response) assert.equal(response.status(), 200, route);
    else assert.equal(target.origin + target.pathname + target.search, previous.origin + previous.pathname + previous.search,
        "A null navigation response is allowed only for a same-document fragment change");
    await page.evaluate(() => document.fonts.ready);
}
async function metrics(locator: Locator) {
    return locator.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const css = getComputedStyle(element);
        return {
            x: rect.x, y: rect.y, width: rect.width, height: rect.height,
            font: Number.parseFloat(css.fontSize), radius: Number.parseFloat(css.borderTopLeftRadius),
            border: [css.borderTopWidth, css.borderRightWidth, css.borderBottomWidth, css.borderLeftWidth],
            shadow: css.boxShadow, background: css.backgroundColor, color: css.color,
            minHeight: Number.parseFloat(css.minHeight), padding: css.padding,
            outlineWidth: css.outlineWidth, outlineOffset: css.outlineOffset, outlineColor: css.outlineColor,
            outlineStyle: css.outlineStyle, stroke: element.getAttribute("data-stroke"),
            focusVisible: element.matches(":focus-visible"),
        };
    });
}
type Metrics = Awaited<ReturnType<typeof metrics>>;
function sameSize(actual: Metrics, expected: Metrics, label: string) {
    near(actual.width, expected.width, `${label} width`, 0.1);
    near(actual.height, expected.height, `${label} height`, 0.1);
}
function innerStroke(value: Metrics, radius: number, color?: string) {
    assert.equal(value.stroke, "inner");
    assert.deepEqual(value.border, ["0px", "0px", "0px", "0px"]);
    assert.match(value.shadow, /inset/);
    assert.match(value.shadow, /0px 0px 0px 1px/);
    if (color) assert.ok(value.shadow.includes(color), `Expected ${color} in ${value.shadow}`);
    near(value.radius, radius, "radius", 0.1);
    assert.ok(value.font >= 16, `Text is ${value.font}px`);
}
async function noOverflow() {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `Document overflows by ${overflow}px`);
}
async function groupGeometry(group: Locator, columns: number, minimumFont = 16) {
    const data = await group.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const css = getComputedStyle(element);
        const children = [...element.querySelectorAll(".system-control-group-item > a")].map(link => {
            const box = link.getBoundingClientRect();
            const style = getComputedStyle(link);
            return {
                text: link.textContent?.trim(), href: link.getAttribute("href"), x: box.x, y: box.y,
                width: box.width, height: box.height, right: box.right,
                font: Number.parseFloat(style.fontSize), scrollWidth: link.scrollWidth, clientWidth: link.clientWidth,
            };
        });
        return { x: rect.x, width: rect.width, height: rect.height, gap: Number.parseFloat(css.columnGap), children };
    });
    assert.equal(data.children.length, 6);
    const rows: typeof data.children[] = [];
    for (const child of data.children) {
        const row = rows.find(row => Math.abs(row[0].y - child.y) < 1);
        if (row) row.push(child); else rows.push([child]);
        assert.ok(child.font >= minimumFont, `Text ${child.text} is ${child.font}px`);
        assert.ok(child.height >= 48, `Target ${child.text} is ${child.height}px`);
        assert.ok(child.scrollWidth <= child.clientWidth + 1, `Text clips in ${child.text}`);
    }
    assert.equal(rows.length, 6 / columns);
    const expectedWidth = (data.width - data.gap * (columns - 1)) / columns;
    for (const row of rows) {
        assert.equal(row.length, columns);
        near(row[0].x, data.x, "First item meets group left");
        near(row.at(-1)!.right, data.x + data.width, "Last item meets group right");
        for (const child of row) {
            near(child.width, expectedWidth, "Percentage share after gaps");
            near(child.height, row[0].height, "Same row target height", 0.1);
        }
    }
    for (const [index, [label, route]] of items.entries()) {
        assert.equal(data.children[index].text, label);
        assert.equal(new URL(data.children[index].href!, base).href, new URL(route, base).href);
    }
    await noOverflow();
    return { ...data, columns, rows: rows.length, percentagePerItem: 100 / columns };
}
async function keyboardFocus(locator: Locator) {
    await page.keyboard.press("Tab");
    await locator.focus();
    const value = await metrics(locator);
    assert.ok(value.focusVisible, "The control has a keyboard focus indicator");
    assert.equal(value.outlineStyle, "solid");
    assert.equal(value.outlineWidth, "3px");
    assert.equal(value.outlineOffset, "-3px");
    assert.notEqual(value.outlineColor, "rgb(33, 31, 28)", "Focus uses a soft color instead of brand black");
    return value;
}

// [반투명 초점선의 실제 대비 / Actual contrast of a translucent focus ring]
// CSS Color 4의 color-mix도 캔버스에서 해석하고, 안쪽 선이 덮는 배경에 합성합니다.
// Resolve CSS Color 4 through canvas and composite the inner ring over its actual background.
async function focusContrast(locator: Locator) {
    return locator.evaluate(element => {
        type Rgba = [number, number, number, number];
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("A canvas color parser is unavailable.");
        const parse = (color: string): Rgba => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            const pixel = context.getImageData(0, 0, 1, 1).data;
            return [pixel[0], pixel[1], pixel[2], pixel[3] / 255];
        };
        const over = (foreground: Rgba, background: Rgba): Rgba => {
            const alpha = foreground[3] + background[3] * (1 - foreground[3]);
            return [0, 1, 2].map(channel => alpha ?
                (foreground[channel] * foreground[3] + background[channel] * background[3] * (1 - foreground[3])) / alpha : 0
            ).concat(alpha) as Rgba;
        };
        const layers: { color: string; image: string; rgba: Rgba }[] = [];
        for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            layers.push({ color: style.backgroundColor, image: style.backgroundImage, rgba: parse(style.backgroundColor) });
        }
        let background: Rgba = [255, 255, 255, 1];
        for (const layer of [...layers].reverse()) background = over(layer.rgba, background);
        const css = getComputedStyle(element);
        const foreground = parse(css.outlineColor);
        const painted = over(foreground, background);
        const luminance = (color: Rgba) => color.slice(0, 3).map(value => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
        const foregroundLuminance = luminance(painted);
        const backgroundLuminance = luminance(background);
        return {
            outlineColor: css.outlineColor, outlineRgba: foreground,
            controlBackground: css.backgroundColor, background, painted,
            contrast: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
                (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
            opaqueControl: layers[0].rgba[3] === 1,
            controlBackgroundImage: layers[0].image,
        };
    });
}

const productExamples = new Map<number, Metrics>();
try {
    if (!focusOnly) {
    for (const width of widths) {
        const columns = width < 768 ? 2 : width < 1024 ? 3 : 6;
        await check(`Visit navigation fills ${columns} equal columns at ${width}px`, async () => {
            await go("visit/", width);
            const group = page.locator(".catalog-page-navigation[data-component='control-group']");
            const geometry = await groupGeometry(group, columns);
            const links = group.locator("a");
            for (let i = 0; i < 6; i++) innerStroke(await metrics(links.nth(i)), 12, "rgb(217, 215, 207)");
            productExamples.set(width, await metrics(links.first()));
            await page.screenshot({ path: path.join(evidence, `after-visit-${width}.png`), fullPage: true });
            await group.screenshot({ path: path.join(evidence, `after-visit-navigation-${width}.png`) });
            return geometry;
        });
        await check(`Hover, keyboard focus and press preserve target geometry at ${width}px`, async () => {
            const link = page.locator(".catalog-page-navigation a").first();
            await link.scrollIntoViewIfNeeded();
            const resting = await metrics(link);
            await link.hover();
            const hovering = await metrics(link);
            sameSize(hovering, resting, "Hover");
            const focused = await keyboardFocus(link);
            sameSize(focused, resting, "Keyboard focus");
            assert.notEqual(hovering.background, resting.background, "Hover has visible surface feedback");
            const center = await link.boundingBox();
            assert.ok(center);
            await page.mouse.move(center.x + center.width / 2, center.y + center.height / 2);
            await page.mouse.down();
            const pressed = await metrics(link);
            sameSize(pressed, resting, "Pointer press");
            near(pressed.x, resting.x, "Press does not shift x", 0.1);
            near(pressed.y, resting.y, "Press does not shift y", 0.1);
            await page.mouse.move(1, 1);
            await page.mouse.up();
            return { resting, hovering, focused, pressed };
        });
        await check(`Selected navigation retains the dark fill with an inner transparent stroke at ${width}px`, async () => {
            await go("visit/directions/", width);
            const group = page.locator(".catalog-page-navigation[data-component='control-group']");
            await groupGeometry(group, columns);
            const current = group.locator("a[aria-current='page']");
            const value = await metrics(current);
            innerStroke(value, 12);
            assert.match(value.shadow, /rgba\([^)]*, 0\)/, "The selected fill has a fully transparent stroke");
            assert.equal(value.background, "rgb(33, 31, 28)");
            assert.equal(value.color, "rgb(255, 254, 250)");
            assert.equal(await current.textContent(), "오시는 길·주차");
            return value;
        });
        await check(`Two hundred percent text stays readable within the proportional group at ${width}px`, async () => {
            await go("visit/", width);
            const group = page.locator(".catalog-page-navigation[data-component='control-group']");
            const normal = await groupGeometry(group, columns);
            await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
            const enlarged = await groupGeometry(group, columns, 32);
            assert.ok(enlarged.height > normal.height, "The group grows vertically for enlarged text");
            await group.screenshot({ path: path.join(evidence, `after-visit-text-200-${width}.png`) });
            return { normalHeight: normal.height, enlarged };
        });
    }

    for (const width of [390, 1440]) {
        await check(`Guide navigation uses the same component variant as the product at ${width}px`, async () => {
            await go("design-rules/#components/navigation", width);
            const group = page.locator("#demo-visit-navigation");
            await group.waitFor({ state: "visible" });
            const geometry = await groupGeometry(group, width < 768 ? 2 : 6);
            const guide = await metrics(group.locator("a").first());
            const product = productExamples.get(width)!;
            for (const key of ["font", "radius", "minHeight", "padding", "shadow", "background", "stroke"] as const) {
                assert.deepEqual(guide[key], product[key], `Guide/product ${key}`);
            }
            innerStroke(guide, 12, "rgb(217, 215, 207)");
            await group.screenshot({ path: path.join(evidence, `after-guide-navigation-${width}.png`) });
            return { geometry, guide, product };
        });
        await check(`Guide default and flow fields keep distinct registered sizes at ${width}px`, async () => {
            await go("design-rules/#components/fields", width);
            const normal = page.locator("#demo-field-default");
            const flow = page.locator("#demo-field-flow");
            await normal.waitFor({ state: "visible" });
            await normal.scrollIntoViewIfNeeded();
            const resting = await metrics(normal);
            const flowValue = await metrics(flow);
            innerStroke(resting, 12, "rgb(217, 215, 207)");
            innerStroke(flowValue, 14, "rgb(217, 215, 207)");
            assert.ok(resting.height >= 48 && flowValue.height >= 54);
            const focused = await keyboardFocus(normal);
            sameSize(focused, resting, "Input focus");
            await normal.fill("입력 상태 검증");
            sameSize(await metrics(normal), resting, "Populated input");
            const error = page.locator("#demo-error");
            assert.equal(await error.getAttribute("aria-invalid"), "true");
            await error.scrollIntoViewIfNeeded();
            const errorValue = await metrics(error);
            innerStroke(errorValue, 12);
            const validErrorValue = await error.evaluate(element => {
                element.removeAttribute("aria-invalid");
                const rect = element.getBoundingClientRect();
                element.setAttribute("aria-invalid", "true");
                return { width: rect.width, height: rect.height };
            });
            near(errorValue.width, validErrorValue.width, "Validation does not resize width", 0.1);
            near(errorValue.height, validErrorValue.height, "Validation does not resize height", 0.1);
            const disabled = page.locator("#demo-disabled");
            assert.equal(await disabled.isDisabled(), true);
            const disabledValue = await metrics(disabled);
            const enabledValue = await disabled.evaluate(element => {
                const control = element as HTMLInputElement;
                control.disabled = false;
                const rect = control.getBoundingClientRect();
                control.disabled = true;
                return { width: rect.width, height: rect.height };
            });
            near(disabledValue.width, enabledValue.width, "Disabled input width", 0.1);
            near(disabledValue.height, enabledValue.height, "Disabled input height", 0.1);
            await noOverflow();
            await page.locator("#components-fields").screenshot({ path: path.join(evidence, `after-guide-fields-${width}.png`) });
            return { resting, focused, flow: flowValue, error: errorValue, disabled: disabledValue };
        });
        await check(`Shared surfaces follow panel, compact and dialog radii at ${width}px`, async () => {
            await go("design-rules/#layout/shape", width);
            const panel = page.locator(".system-surface").filter({ has: page.locator("#surface-demo-heading") }).first();
            await panel.waitFor({ state: "visible" });
            const panelValue = await metrics(panel);
            const compactValue = await metrics(panel.locator(".system-surface[data-surface-radius='compact']"));
            innerStroke(panelValue, 20);
            innerStroke(compactValue, 16);
            await panel.screenshot({ path: path.join(evidence, `after-guide-surface-${width}.png`) });
            await go("design-rules/#components/feedback", width);
            const opener = page.getByRole("button", { name: "날짜 선택 대화상자 열기" });
            await opener.click();
            const dialog = page.locator("dialog[aria-labelledby='sample-dialog-title']");
            await dialog.waitFor({ state: "visible" });
            const dialogValue = await metrics(dialog);
            innerStroke(dialogValue, 28);
            await dialog.screenshot({ path: path.join(evidence, `after-guide-dialog-${width}.png`) });
            await page.keyboard.press("Escape");
            assert.equal(await dialog.isVisible(), false);
            assert.ok(await opener.evaluate(element => element === document.activeElement), "Dialog restores focus to its opener");
            await noOverflow();
            return { panel: panelValue, compact: compactValue, dialog: dialogValue };
        });
        await check(`Signup uses the registered flow field and button variant at ${width}px`, async () => {
            await go("account/signup/", width);
            const input = page.locator("#flow-name");
            const button = page.locator("[data-account-auth='signup'] button[type='submit']");
            const inputValue = await metrics(input);
            const buttonValue = await metrics(button);
            innerStroke(inputValue, 14, "rgb(217, 215, 207)");
            innerStroke(buttonValue, 14);
            assert.ok(inputValue.height >= 54 && buttonValue.height >= 50);
            const focused = await keyboardFocus(input);
            sameSize(focused, inputValue, "Flow focus");
            const formSurface = await metrics(page.locator("[data-account-auth='signup']"));
            innerStroke(formSurface, 20);
            await noOverflow();
            await page.locator("[data-account-auth='signup']").screenshot({ path: path.join(evidence, `after-signup-flow-${width}.png`) });
            return { input: inputValue, button: buttonValue, focused, surface: formSurface };
        });
    }

    await check("Actual signup pending and rejected states keep control sizes and preserve input", async () => {
        await go("account/signup/", 390);
        await page.locator("#flow-name").fill("규격 검증");
        await page.locator("#flow-email").fill("geometry-check@example.invalid");
        await page.locator("input[name='consent']").check();
        const input = page.locator("#flow-name");
        const button = page.locator("[data-account-auth='signup'] button[type='submit']");
        const initialInput = await metrics(input);
        const initialButton = await metrics(button);
        await button.click();
        await page.waitForFunction(() => Boolean(document.querySelector("[data-account-auth='signup'] button[type='submit']:disabled")));
        await expect.poll(() => otpRequested, { message: "The actual submit handler reaches the stubbed OTP endpoint" }).toBe(true);
        assert.ok(await input.isDisabled());
        const pendingInput = await metrics(input);
        const pendingButton = await metrics(button);
        sameSize(pendingInput, initialInput, "Pending field");
        sameSize(pendingButton, initialButton, "Pending button");
        releaseOtp?.();
        await page.locator("#flow-error").waitFor({ state: "visible" });
        assert.equal(await input.isDisabled(), false);
        assert.equal(await input.inputValue(), "규격 검증");
        const failedInput = await metrics(input);
        const failedButton = await metrics(button);
        sameSize(failedInput, initialInput, "Rejected field");
        sameSize(failedButton, initialButton, "Rejected button");
        await noOverflow();
        await page.locator("[data-account-auth='signup']").screenshot({ path: path.join(evidence, "after-signup-error-390.png") });
        return { initialInput, initialButton, pendingInput, pendingButton, failedInput, failedButton };
    });
    }
    await check("Guide keyboard focus contrasts with primary, accent, highlight and inverse backgrounds by at least 3:1", async () => {
        await go("design-rules/#components/buttons", 1440);
        await page.locator("#components-buttons").waitFor({ state: "visible" });
        const variants = ["primary", "accent", "highlight", "inverse"];
        const results = [];
        for (const variant of variants) {
            const button = page.locator(`#components-buttons .ds-button-${variant}[data-context='default']`).first();
            await button.scrollIntoViewIfNeeded();
            await page.mouse.move(1, 1);
            const resting = await metrics(button);
            const focused = await keyboardFocus(button);
            sameSize(focused, resting, `${variant} focus`);
            assert.deepEqual(focused.border, ["0px", "0px", "0px", "0px"]);
            assert.equal(focused.shadow, resting.shadow, "Keyboard focus preserves the resting inner stroke");
            const contrast = await focusContrast(button);
            assert.ok(contrast.opaqueControl, `${variant} has an actual opaque control surface`);
            assert.equal(contrast.controlBackgroundImage, "none", "Contrast is measured on the actual flat control background");
            assert.ok(contrast.contrast >= 3, `${variant} focus contrast ${contrast.contrast.toFixed(3)}:1 is below 3:1`);
            results.push({ variant, resting, focused, ...contrast });
            await button.screenshot({ path: path.join(evidence, `after-focus-${variant}-1440.png`) });
        }
        return results;
    });
    await check("Browser reports no runtime errors", async () => { assert.deepEqual(browserErrors, []); });
} finally {
    releaseOtp?.();
    await context.close();
    await browser.close();
    const report = {
        capturedAt: new Date().toISOString(), base, widths: focusOnly ? [1440] : widths, focusOnly,
        mode: "Real product and guide DOM; isolated Chromium; member requests stubbed without sending email",
        before: before ? { base: before.base, capturedAt: before.capturedAt, cases: before.cases.map((entry: any) => ({
            width: entry.viewport.width, url: entry.url, groupWidth: entry.nav.rect.width,
            firstLink: entry.links[0], screenshots: entry.screenshots,
        })) } : null,
        checks, browserErrors,
        totals: { passed: checks.filter(check => check.passed).length, failed: checks.filter(check => !check.passed).length },
    };
    writeFileSync(path.join(evidence, focusOnly ? "focus-contrast-report.json" : "after-report.json"), JSON.stringify(report, null, 2) + "\n");
    if (report.totals.failed) process.exitCode = 1;
    console.log(JSON.stringify(report.totals));
}
