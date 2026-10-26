import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, expect } from "playwright/test";
import { COMPONENT_REGISTRY } from "../src/data/component-registry.ts";
import { COMPONENT_COUNTS } from "../src/data/component-usage.ts";

// [제품과 가이드의 동일 구현 검증 / Verify shared implementations in product and guide]
const base = (process.argv[2] || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const directory = path.resolve(".lemonade/component-unification");
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "Asia/Seoul" });
const page = await context.newPage();
const results: { name: string; passed: boolean; error?: string }[] = [];
const errors: string[] = [];
// [실제 이메일 발송을 막는 OTP 제공자 / OTP provider that cannot send real email]
const environment = fs.readFileSync(".env.local", "utf8");
const backend = environment.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^\r\n"']+)/m)?.[1];
if (!backend) throw new Error("The public Supabase URL is required to mock email authentication.");
const otpRequests: Record<string, unknown>[] = [];
const catalogFixture = JSON.parse(fs.readFileSync("src/generated/catalog-snapshot.json", "utf8"));
let otpGate = Promise.resolve();
const holdOtp = () => {
    let release!: () => void;
    otpGate = new Promise<void>(resolve => { release = resolve; });
    return release;
};
await context.route(url => url.origin === new URL(backend).origin, async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/auth/v1/settings") return route.fulfill({ json: { external: { google: false } } });
    if (url.pathname === "/rest/v1/rpc/sejong_catalog_snapshot" && route.request().method() === "POST") return route.fulfill({ json: catalogFixture });
    if (url.pathname === "/auth/v1/otp") {
        otpRequests.push(route.request().postDataJSON());
        await otpGate;
        return route.fulfill({ json: {} });
    }
    errors.push(`Unexpected backend request: ${url.pathname}`);
    return route.fulfill({ status: 500, json: { message: "Unexpected fixture endpoint" } });
});
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
    if (message.type() === "error" && /hydration|uncaught|invalid.*prop|cannot.*contain/i.test(message.text())) errors.push(message.text());
});
page.setDefaultTimeout(10000);
const go = (route = "") => page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
async function metrics(selector: string) {
    return page.locator(selector).first().evaluate(element => {
        const style = getComputedStyle(element);
        return { height: element.getBoundingClientRect().height, minHeight: style.minHeight, radius: style.borderRadius, fontSize: style.fontSize };
    });
}
async function fieldStates(selector: string) {
    return page.locator(selector).evaluate(async (element: HTMLInputElement) => {
        const disabled = element.disabled;
        const invalid = element.getAttribute("aria-invalid");
        const sample = () => {
            const style = getComputedStyle(element);
            return { background: style.backgroundColor, color: style.color, border: style.border, outline: style.outline, offset: style.outlineOffset, shadow: style.boxShadow, radius: style.borderRadius, transition: style.transition };
        };
        const settle = async () => {
            getComputedStyle(element).backgroundColor;
            await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
        };
        element.focus();
        await settle();
        const focused = sample();
        element.setAttribute("aria-invalid", "true");
        await settle();
        const error = sample();
        element.removeAttribute("aria-invalid");
        element.disabled = true;
        await settle();
        const inactive = sample();
        element.disabled = disabled;
        if (invalid != null) element.setAttribute("aria-invalid", invalid);
        await settle();
        return { focused, error, inactive };
    });
}
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
        console.error("FAIL", name, String(error));
        await page.screenshot({ path: path.join(directory, `failure-${results.length}.png`) });
    }
}
try {
    await go("design-rules/#components/registry");
    await check("the real registry lists every implementation, computed usage and the missing production patterns", async () => {
        await page.locator("[data-component-record]").first().waitFor();
        assert.equal(await page.locator("[data-component-record]").count(), COMPONENT_REGISTRY.length);
        assert.equal(Number(await page.locator('[data-count="total"]').innerText()), COMPONENT_COUNTS.total);
        assert.equal(Number(await page.locator('[data-count="product"]').innerText()), COMPONENT_COUNTS.total);
        assert.equal(Number(await page.locator('[data-count="guide-only"]').innerText()), 0);
        assert.equal(Number(await page.locator('[data-count="unused"]').innerText()), 0);
        for (const id of ["hero-companion", "header", "footer", "context-menu", "return-top", "introduction"]) {
            assert.match(await page.locator(`[data-component-record="${id}"]`).innerText(), /제품 연결/);
        }
        for (const id of ["booking-invitation", "component-catalog", "glass-demo"])
            assert.equal(await page.locator(`[data-component-record="${id}"]`).count(), 0);
        assert.equal(await page.locator('[data-documentation-tool="component-catalog"]').count(), 1);
        assert.equal(await page.locator('[data-documentation-tool="glass-demo"]').count(), 1);
        assert.equal(await page.locator('.booking-invitation-letter').count(), 0);
        await go("design-rules/#motion/scroll");
        assert.match(await page.locator('[data-lifecycle="deprecated"]').innerText(), /BookingInvitation · Deprecated/);
        assert.equal(await page.locator('.booking-invitation-letter').count(), 0);
        await go("design-rules/#components/registry");
        await page.getByLabel("컴포넌트 검색", { exact: true }).fill("HeroCompanion");
        assert.equal(await page.locator("[data-component-record]").count(), 1);
        await page.getByLabel("컴포넌트 검색", { exact: true }).fill("");
    });

    for (const width of [320, 390, 768, 1024, 1440]) {
        await check(`guide and product share default/flow dimensions and field states at ${width}px`, async () => {
            await page.setViewportSize({ width, height: 1000 });
            await go("design-rules/#components/fields");
            await page.locator("#demo-field-flow").waitFor();
            const standard = await metrics("#demo-field-default");
            const flow = await metrics("#demo-field-flow");
            const flowButton = await metrics('[aria-label="flow 버튼 규격"]');
            const standardStates = await fieldStates("#demo-field-default");
            const states = await fieldStates("#demo-field-flow");
            assert.deepEqual([standard.minHeight, standard.radius, standard.fontSize], ["48px", "12px", "16px"]);
            assert.deepEqual([flow.minHeight, flow.radius, flow.fontSize], ["54px", "14px", "16px"]);
            assert.deepEqual([flowButton.minHeight, flowButton.radius], ["50px", "14px"]);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
            await go("account/signup/");
            assert.deepEqual(await metrics("#flow-name"), flow);
            assert.deepEqual(await fieldStates("#flow-name"), states);
            assert.deepEqual(await metrics('main form button[type="submit"]'), flowButton);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
            if ([390, 1440].includes(width)) await page.screenshot({ path: path.join(directory, `after-signup-${width}.png`) });
            await go("programs/");
            assert.deepEqual(await metrics("#program-query"), standard);
            assert.deepEqual(await fieldStates("#program-query"), standardStates);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
            await page.getByRole("button", { name: "전시", exact: true }).click();
            assert.equal(await page.getByRole("button", { name: "전시", exact: true }).getAttribute("aria-pressed"), "true");
            await page.locator("#program-query").fill("빛");
            assert.ok(await page.locator(".program-card").count() > 0);
        });
    }
    await check("home patterns retain their anchors and the booking heading is static shared text", async () => {
        await go();
        assert.equal(await page.locator('[data-component="HeroSlide"]').count(), 5);
        assert.equal(await page.locator('[data-component="BookingCalendar"]').count(), 1);
        assert.equal(await page.locator('[data-component="SeasonBanner"]').count(), 1);
        assert.equal(await page.locator("#quick-booking-heading").innerText(), "관람 예약");
        assert.equal(await page.locator("#quick-booking-heading").getAttribute("data-text"), "heading");
        assert.equal(await page.locator("#quick-booking-heading .booking-invitation-letter").count(), 0);
        assert.equal(await page.locator("#quick-booking-heading").evaluate(element => element.getAnimations({ subtree: true }).length), 0);
        assert.deepEqual((({ minHeight, radius }) => [minHeight, radius])(await metrics("#home-booking-today")), ["48px", "12px"]);
        assert.equal(await page.locator('.hero-time-glass[data-glass-variant="hero"]').count(), 1);
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.evaluate(() => scrollTo(0, 0));
            await page.screenshot({ path: path.join(directory, `after-home-${width}.png`) });
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        }
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(() => document.querySelector("#quick-booking-heading")?.getAnimations({ subtree: true }).length === 0);
        assert.equal(await page.locator("#quick-booking-heading").evaluate(element => element.getAnimations({ subtree: true }).length), 0);
        await page.emulateMedia({ reducedMotion: "no-preference" });
    });
    await check("search uses the shared modal with input focus, Escape return and keyboard containment", async () => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await go();
        const trigger = page.locator("#header").getByRole("button", { name: "통합검색 열기", exact: true });
        await trigger.click();
        const dialog = page.locator('#search-dialog[data-component="dialog"]');
        await dialog.waitFor();
        assert.ok(await dialog.evaluate(element => element.matches(":modal")));
        assert.equal(await dialog.locator('input[type="search"]').evaluate(element => document.activeElement === element), true);
        await page.keyboard.press("Shift+Tab");
        assert.ok(await page.evaluate(() => Boolean(document.activeElement?.closest("#search-dialog"))));
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => document.body.style.overflow === "");
        assert.ok(await trigger.evaluate(element => document.activeElement === element));
    });
    await check("signup validates shared fields and awaits an OTP request that allows account creation", async () => {
        await go("account/signup/");
        const submit = page.locator('main form button[type="submit"]');
        await submit.click();
        assert.match(await page.locator('#flow-error[role="alert"]').innerText(), /이름/);
        await page.locator("#flow-name").fill("컴포넌트 검증");
        await page.locator("#flow-email").fill("component@example.com");
        await page.locator('main form input[type="checkbox"]').check();
        const before = otpRequests.length;
        const release = holdOtp();
        try {
            await submit.click();
            await expect.poll(() => otpRequests.length).toBe(before + 1);
            await expect(submit).toBeDisabled();
            await expect(page.locator('.flow-info-box[role="status"]')).toHaveCount(0);
            assert.equal(otpRequests.at(-1)?.create_user, true);
            assert.equal(otpRequests.at(-1)?.email, "component@example.com");
        } finally { release(); }
        await expect(page.locator('.flow-info-box[role="status"]')).toContainText("이메일로 로그인 링크를 보냈습니다.");
        assert.ok(new URL(page.url()).pathname.endsWith("/account/signup/"));
        assert.equal(await page.evaluate(() => localStorage.getItem("sejong-v4:profile")), null);
        assert.equal(await page.evaluate(() => localStorage.getItem("sejong-v4:session")), null);
    });
    await check("recovery retains its accessible result and flow field", async () => {
        await go("account/recovery/");
        await page.locator("#flow-email").fill("component@example.com");
        const submit = page.locator('main form button[type="submit"]');
        const before = otpRequests.length;
        const release = holdOtp();
        try {
            await submit.click();
            await expect.poll(() => otpRequests.length).toBe(before + 1);
            await expect(submit).toBeDisabled();
            await expect(page.locator('.flow-info-box[role="status"]')).toHaveCount(0);
            assert.equal(otpRequests.at(-1)?.create_user, false);
        } finally { release(); }
        await expect(page.locator('[role="status"].flow-info-box')).toContainText("이메일로 로그인 링크를 보냈습니다.");
        assert.equal((await metrics("#flow-email")).minHeight, "54px");
    });
    await check("booking does not invent sessions or seats before verified inventory is published", async () => {
        await go("booking/winter/");
        assert.equal(catalogFixture.sessions.filter((session: { programId: string }) => session.programId === "winter").length, 0);
        await page.getByText("예약 가능한 회차를 준비하고 있습니다", { exact: true }).waitFor();
        assert.equal(await page.locator("#booking-session").count(), 0);
        assert.equal(await page.locator("#booking-date, #booking-time, button[data-system-part='seat']").count(), 0);
    });
    await check("no hydration or runtime errors occurred", async () => assert.deepEqual(errors, []));
} finally {
    fs.writeFileSync(path.join(directory, "report.json"), JSON.stringify({ base, verifiedAt: new Date().toISOString(), components: COMPONENT_COUNTS, widths: [320, 390, 768, 1024, 1440], results, errors }, null, 2));
    await context.close();
    await browser.close();
}
if (results.some(result => !result.passed)) process.exitCode = 1;
