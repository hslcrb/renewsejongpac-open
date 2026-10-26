import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PROGRAMS, VENUES } from "../src/data/catalog.ts";
import * as journeys from "../src/features/journeys.ts";

// [방문 준비와 공간 비교의 입력 계약 / Input contracts for visits and venue comparisons]
// 주소의 잘못된 값이 실제 일정이나 대관 가능 상태로 오인되지 않도록 검사합니다.
// Verify that malformed links cannot become invented schedules or confirmed rental availability.
test("journey tools expose their two routes without claiming other pages", () => {
    assert.ok(journeys, "journeys feature is implemented");
    assert.deepEqual(journeys.JOURNEY_PAGES.map(page => page.path), ["/visit/plan", "/rental/compare"]);
    assert.equal(journeys.renderJourneys("/programs", new URLSearchParams()), null);
});

test("an empty visit plan asks for a date and space without inventing a program", () => {
    assert.ok(journeys, "journeys feature is implemented");
    const plan = journeys.getVisitPlan(new URLSearchParams());
    assert.equal(plan.program, null);
    assert.equal(plan.venue, null);
    assert.equal(plan.date, "");
    assert.equal(plan.ready, false);
    assert.deepEqual(plan.issues, []);
});

test("selected performances retain date and venue without inventing unverified sessions", () => {
    assert.ok(journeys, "journeys feature is implemented");
    const program = PROGRAMS.find(item => item.id === "dance");
    const plan = journeys.getVisitPlan(new URLSearchParams({
        program: "dance", date: program.start, time: "19:30",
        transport: "gyeongbokgung", access: "wheelchair",
    }));
    assert.deepEqual(program.times, [], "the snapshot has no verified session for this program");
    assert.equal(plan.ready, false);
    assert.equal(plan.venue.id, "grand");
    assert.equal(plan.time, "");
    assert.ok(plan.issues.some(issue => issue.includes("회차")));
    assert.equal(plan.access, "wheelchair");
    const restored = journeys.getVisitPlan(new URLSearchParams(plan.query));
    assert.equal(restored.date, program.start);
    assert.equal(restored.transport, "gyeongbokgung");
    assert.deepEqual(restored.issues, []);
});

test("invalid dates, missing programs, unknown sessions and conflicting venues need correction", () => {
    assert.ok(journeys, "journeys feature is implemented");
    const invalid = journeys.getVisitPlan(new URLSearchParams("program=missing&venue=elsewhere&date=2026-02-30&time=99:99&transport=flight&access=bad"));
    assert.equal(invalid.ready, false);
    assert.equal(invalid.date, "");
    assert.equal(invalid.venue, null);
    assert.ok(invalid.issues.length >= 3);
    const conflict = journeys.getVisitPlan(new URLSearchParams("program=dance&venue=gallery&date=2026-01-01&time=02:00"));
    assert.equal(conflict.venue.id, "grand");
    assert.equal(conflict.date, "");
    assert.equal(conflict.time, "");
    assert.equal(conflict.ready, false);
});

test("a space-only visit is valid while a program visit requires a session", () => {
    assert.ok(journeys, "journeys feature is implemented");
    assert.equal(journeys.getVisitPlan(new URLSearchParams("venue=gallery&date=2026-10-20&transport=car")).ready, true);
    const program = PROGRAMS.find(item => item.id === "dance");
    assert.equal(journeys.getVisitPlan(new URLSearchParams({ program: "dance", date: program.start })).ready, false);
});

test("unverified education sessions do not invent arrival routes and bus travel uses general guidance", () => {
    for (const id of ["academy", "art-class"]) {
        const program = PROGRAMS.find(item => item.id === id);
        assert.deepEqual(program.times, []);
        const query = new URLSearchParams({ program: id, date: program.start });
        assert.equal(journeys.getVisitPlan(query).ready, false);
        const html = journeys.renderJourneys("/visit/plan", query);
        assert.ok(!html.includes('href="#/visit/directions?origin='), id);
    }
    const bus = journeys.renderJourneys("/visit/plan", new URLSearchParams("venue=grand&date=2026-10-20&transport=bus"));
    assert.ok(bus.includes('href="#/visit/directions?overview=1"'));
    assert.ok(!bus.includes('href="#/visit/directions?venue=grand"'));
    const subway = journeys.renderJourneys("/visit/plan", new URLSearchParams("venue=grand&date=2026-10-20&transport=gyeongbokgung"));
    assert.ok(subway.includes('href="#/visit/directions?origin=gyeongbokgung&amp;venue=grand"'));
    const car = journeys.renderJourneys("/visit/plan", new URLSearchParams("venue=grand&date=2026-10-20&transport=car"));
    assert.ok(car.includes('href="#/visit/directions?origin=parking&amp;venue=grand"'));
});

test("venue comparison keeps zero or one selection and caps distinct valid selections at three", () => {
    assert.ok(journeys, "journeys feature is implemented");
    assert.deepEqual(journeys.getComparison(new URLSearchParams()).ids, []);
    assert.deepEqual(journeys.getComparison(new URLSearchParams("ids=gallery")).ids, ["gallery"]);
    const result = journeys.getComparison(new URLSearchParams("ids=grand,grand,bogus,m-theater,s-theater,chamber"));
    assert.deepEqual(result.ids, ["grand", "m-theater", "s-theater"]);
    assert.equal(result.venues.length, 3);
    assert.ok(result.issues.length >= 2);
    assert.deepEqual(journeys.getComparison(new URLSearchParams(result.query)).ids, result.ids);
});

test("comparison destinations pass each selected venue ID to existing rental flows", () => {
    assert.ok(journeys, "journeys feature is implemented");
    const html = journeys.renderJourneys("/rental/compare", new URLSearchParams("ids=grand,gallery"));
    for (const id of ["grand", "gallery"]) {
        assert.ok(html.includes(`#/rental/schedule?venue=${id}`));
        assert.ok(html.includes(`#/rental/apply?venue=${id}`));
        assert.ok(html.includes(`#/rental/contact?venue=${id}`));
        assert.ok(html.includes(VENUES.find(venue => venue.id === id).capacity));
    }
    assert.ok(html.includes("실제 사용 가능 여부"));
    assert.ok(!html.includes("undefined"));
});

test("empty and malformed tool screens retain labels, useful next actions and escaped content", () => {
    assert.ok(journeys, "journeys feature is implemented");
    for (const path of ["/visit/plan", "/rental/compare"]) {
        const html = journeys.renderJourneys(path, new URLSearchParams("program=%3Cscript%3E&ids=%3Cimg%20onerror%3D1%3E"));
        assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
        assert.ok(html.includes("<label"));
        assert.ok(!html.includes("<script>"));
        assert.ok(!html.includes("<img onerror"));
        assert.ok(!html.includes("undefined"));
    }
});

// [실제 입력과 모바일 회귀 / Real-input and mobile regression checks]
// 명시적으로 실행할 때 브라우저에서 공유·저장·선택 제한·작은 화면을 확인합니다.
// Run opt-in browser coverage for sharing, persistence, selection limits and narrow layouts.
test("journey controls preserve real input, isolated storage and mobile layouts", {
    skip: process.env.SEJONG_JOURNEYS_BROWSER !== "1",
    timeout: 120000,
}, async () => {
    const require = createRequire(import.meta.url);
    const { chromium } = require("playwright");
    const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
    const base = process.env.SEJONG_TEST_URL || "http://127.0.0.1:8764/v4/index.html";
    const artifacts = new URL("../.lemonade/journeys/", import.meta.url);
    await mkdir(artifacts, { recursive: true });
    try {
        const context = await browser.newContext({ reducedMotion: "reduce" });
        const page = await context.newPage();
        const errors = [];
        page.on("dialog", dialog => dialog.accept());
        page.on("pageerror", error => errors.push(error.message));
        const noOverflow = async () => {
            const dimensions = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
            assert.ok(dimensions.content <= dimensions.width, JSON.stringify(dimensions));
        };
        for (const width of [1440, 390, 320]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(base + "#/visit/plan");
            await page.locator("#visit-plan-form").waitFor();
            await noOverflow();
            await page.evaluate(() => localStorage.setItem("sejong-v3:visit-plan", JSON.stringify("preserved v3 plan")));
            await page.locator("#journey-program").selectOption("dance");
            assert.equal(await page.locator("#journey-date").inputValue(), "2026-10-20");
            await page.locator("#journey-time").selectOption("14:00");
            await page.locator("#journey-transport").focus();
            await page.locator("#journey-transport").selectOption("car");
            assert.equal(await page.evaluate(() => document.activeElement.id), "journey-transport");
            await page.locator("#journey-access").selectOption("wheelchair");
            assert.ok((await page.locator("[data-visit-result]").innerText()).includes("14:00"));
            assert.ok((await page.locator("[data-visit-result]").innerText()).includes("휠체어"));
            assert.ok(page.url().includes("transport=car"));
            await page.locator("[data-save-plan]").click();
            assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("sejong-v3:visit-plan"))), "preserved v3 plan");
            const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sejong-v4:visit-plan")));
            assert.equal(new URLSearchParams(saved).get("program"), "dance");
            await page.reload();
            await page.locator("#visit-plan-form").waitFor();
            assert.equal(await page.locator("#journey-transport").inputValue(), "car");
            assert.ok((await page.locator("[data-saved-plan]").innerText()).includes("2026.10.20"));
            await noOverflow();
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
            await page.screenshot({ path: fileURLToPath(new URL(`visit-${width}.png`, artifacts)), fullPage: true });

            await page.goto(base + "#/rental/compare");
            await page.locator("#venue-compare-form").waitFor();
            for (const id of ["grand", "m-theater", "s-theater"]) await page.locator(`input[value="${id}"]`).check();
            await page.locator('input[value="chamber"]').focus();
            await page.keyboard.press("Space");
            assert.equal(await page.locator("#venue-compare-form input:checked").count(), 3);
            assert.ok((await page.locator("[data-journey-status]").innerText()).includes("최대 세 공간"));
            await noOverflow();
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
            await page.screenshot({ path: fileURLToPath(new URL(`compare-${width}.png`, artifacts)), fullPage: true });
            await page.getByRole("link", { name: "이 공간으로 신청", exact: true }).first().click();
            await page.locator('select[name="venue"]').waitFor();
            assert.equal(await page.locator('select[name="venue"]').inputValue(), "grand");
            await page.goBack();
            await page.locator("#venue-compare-form").waitFor();
            await page.locator("[data-clear-comparison]").click();
            assert.equal(await page.locator("#venue-compare-form input:checked").count(), 0);
            assert.equal(await page.locator(".comparison-card").count(), 0);
            assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === "running" && Number(animation.effect?.getTiming().duration) > 1).length), 0);
        }
        await page.goto(base + "#/visit/plan?program=dance&date=2026-02-30&time=99:99");
        await page.locator("#visit-plan-form").waitFor();
        assert.equal(await page.locator("#journey-date").inputValue(), "");
        assert.equal(await page.locator("[data-save-plan]").isDisabled(), true);
        assert.ok((await page.locator("[data-journey-issues]").innerText()).includes("다시 선택"));
        await page.goto(base + "#/visit/plan");
        await page.locator("#visit-plan-form").waitFor();
        await page.locator("#journey-program").selectOption("dance");
        await page.locator("#journey-time").selectOption("14:00");
        await page.locator("#journey-program").selectOption("carmen");
        assert.equal(await page.locator("#journey-date").inputValue(), "2026-10-15");
        assert.equal(await page.locator("#journey-time").inputValue(), "");
        assert.equal(await page.locator("[data-save-plan]").isDisabled(), true);
        await page.locator("#journey-program").selectOption("");
        assert.equal(await page.locator("#journey-venue").inputValue(), "grand");
        assert.equal(await page.locator("#journey-time").isDisabled(), true);
        assert.equal(await page.locator("[data-save-plan]").isDisabled(), false);
        await page.locator("[data-clear-plan]").click();
        assert.equal(await page.locator("[data-saved-plan]").innerText(), "");
        assert.equal(await page.evaluate(() => document.activeElement.id), "journey-program");
        assert.deepEqual(errors, []);
        await context.close();
    } finally {
        await browser.close();
    }
});
