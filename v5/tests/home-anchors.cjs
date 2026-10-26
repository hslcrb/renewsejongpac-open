const { chromium, expect } = require('playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const base = process.env.SEJONG_TEST_URL || process.env.BASE_URL || 'http://127.0.0.1:8765/v5/';
const directory = path.resolve(process.env.SEJONG_ANCHOR_REPORT_DIR || path.join(__dirname, '../.lemonade/home-anchors'));
const report = { target: base, startedAt: new Date().toISOString(), checks: [], browserErrors: [], httpErrors: [], screenshots: [] };
fs.mkdirSync(directory, { recursive: true });
const save = () => fs.writeFileSync(path.join(directory, 'home-anchor-results.json'), JSON.stringify(report, null, 2));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

async function check(name, run) {
    const result = { name, status: 'running' };
    report.checks.push(result);
    try {
        result.details = await run();
        result.status = 'passed';
        console.log(`PASS ${name}`);
    } catch (error) {
        result.status = 'failed';
        result.error = error.stack || String(error);
        console.error(`FAIL ${name}: ${error.message}`);
    } finally { save(); }
}

function observe(page, label) {
    page.setDefaultTimeout(6000);
    page.setDefaultNavigationTimeout(30000);
    page.on('pageerror', error => report.browserErrors.push({ label, kind: 'page', message: error.message }));
    page.on('console', message => {
        if (message.type() === 'error') report.browserErrors.push({ label, kind: 'console', message: message.text() });
    });
    page.on('response', response => {
        if (response.status() >= 400) report.httpErrors.push({ label, status: response.status(), url: response.url() });
    });
}

async function initial(page, id = '') {
    // A blank document ensures this is a real initial URL, not same-document navigation.
    await page.goto('about:blank');
    const url = new URL(base);
    url.hash = id;
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200, 'Production homepage must load successfully');
    await expect(page.locator('#home')).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
}

async function placement(page, id) {
    let result;
    await expect(async () => {
        result = await page.evaluate(targetId => {
            const target = document.getElementById(targetId);
            const header = document.getElementById('header');
            if (!target || !header) return null;
            const rect = target.getBoundingClientRect();
            const active = document.activeElement;
            const headerBottom = header.getBoundingClientRect().bottom;
            return {
                id: targetId, top: rect.top, bottom: rect.bottom, headerBottom,
                gap: rect.top - headerBottom, focus: active?.id || active?.tagName,
                ownsFocus: active === target || target.contains(active) || (active?.matches('a[href]') && active.contains(target)),
                hidden: !!target.closest('[hidden], [inert], [aria-hidden="true"]'),
                scrollX, scrollY, atBottom: scrollY >= document.documentElement.scrollHeight - innerHeight - 2,
                viewportHeight: innerHeight,
            };
        }, id);
        assert.ok(result, `${id} must be rendered`);
        assert.equal(result.hidden, false, `${id} must be exposed to accessibility`);
        assert.equal(result.ownsFocus, true, `${id} must own the focused heading or control`);
        assert.ok(result.gap >= -1, `${id} is obscured by the sticky header (${result.gap}px)`);
        assert.ok(result.top < result.viewportHeight, `${id} must be inside the viewport`);
        if (result.scrollY > 35 && !result.atBottom) assert.ok(Math.abs(result.gap - 16) <= 3, `${id} should have a 16px header gap (observed ${result.gap}px)`);
        assert.equal(result.scrollX, 0, 'Fragment navigation must not move a carousel sideways');
    }).toPass({ timeout: 6000, intervals: [30, 60, 120] });
    return result;
}

async function hash(page, id) {
    await page.evaluate(value => { window.location.hash = value; }, id);
    await expect.poll(() => new URL(page.url()).hash).toBe(`#${id}`);
    return placement(page, id);
}

async function uniqueIds(page) {
    const result = await page.evaluate(() => {
        const counts = new Map();
        document.querySelectorAll('[id]').forEach(element => counts.set(element.id, (counts.get(element.id) || 0) + 1));
        return {
            duplicates: [...counts].filter(([id, count]) => id && count > 1),
            activeSlideIds: [...document.querySelectorAll('.season-slide[id]')].map(element => element.id),
            hiddenSlideIds: [...document.querySelectorAll('.season-slide[aria-hidden="true"][id]')].map(element => element.id),
            tabbableClones: document.querySelectorAll('.season-slide[aria-hidden="true"] a:not([tabindex="-1"])').length,
        };
    });
    assert.deepEqual(result.duplicates, []);
    assert.equal(result.activeSlideIds.length, 1);
    assert.deepEqual(result.hiddenSlideIds, []);
    assert.equal(result.tabbableClones, 0);
    return result;
}

async function statefulTarget(page, item) {
    const position = await placement(page, item.id);
    if (item.kind === 'hero') {
        await expect(page.locator(`#${item.id}`)).toHaveAttribute('aria-hidden', 'false');
        await expect(page.locator('#home-feature-playback')).toHaveAttribute('aria-pressed', 'true');
    }
    if (item.kind === 'program') {
        const count = await page.locator('#home-program-results .home-program-anchor').count();
        assert.ok(count >= 1 && count <= 4, 'Revealing a program must retain the four-card limit');
        await expect(page.locator(`#${item.id} .card-poster-link`)).toHaveAttribute('href', new RegExp(`/programs/${item.programId}/?$`));
    }
    if (item.kind === 'notice') await expect(page.locator(`#${item.id}`)).toHaveAttribute('href', /\/news\/notices\/access\/?$/);
    if (item.kind === 'date') {
        await expect(page.locator('#quick-month')).toHaveText('2026. 11');
        await expect(page.locator(`#${item.id}`)).toHaveAttribute('aria-pressed', 'true');
    }
    if (item.kind === 'visit') {
        await expect(page.locator('[data-visit-image="accessibility"]')).toHaveAttribute('aria-hidden', 'false');
        await expect(page.locator(`#${item.id}`)).toHaveClass(/is-previewed/);
    }
    return { ...position, ids: await uniqueIds(page) };
}

async function screenshot(page, filename) {
    const file = path.join(directory, filename);
    await page.screenshot({ path: file });
    report.screenshots.push(file);
}

async function main() {
    const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
    try {
        report.browser = browser.version();
        const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        const page = await desktop.newPage();
        observe(page, 'desktop');
        await initial(page);
        const initialPrograms = await page.locator('#home-program-results .home-program-anchor').evaluateAll(elements => elements.map(element => element.id));
        const programId = ['ballet', 'winter', 'carmen', 'academy', 'dance', 'hypnosis', 'art-class'].find(id => !initialPrograms.includes(`home-program-${id}`));
        assert.ok(programId, 'Choose a known program outside the initial four cards');
        assert.equal(await page.locator('#home-notice-access').count(), 0, 'The notice fixture starts outside the initial four');
        const targets = [
            { id: 'home-feature-carmen', kind: 'hero' },
            { id: `home-program-${programId}`, kind: 'program', programId },
            { id: 'home-notice-access', kind: 'notice' },
            { id: 'home-booking-date-2026-11-01', kind: 'date' },
            { id: 'home-visit-accessibility', kind: 'visit' },
        ];

        await check('initial fragment URLs reveal stateful content with accessible focus', async () => {
            const results = [];
            for (const item of targets) {
                await initial(page, item.id);
                results.push(await statefulTarget(page, item));
            }
            return results;
        });

        await check('hashchange reveals the same carousel, card, notice, date and visit targets', async () => {
            await initial(page);
            const results = [];
            for (const item of targets) {
                await hash(page, item.id);
                results.push(await statefulTarget(page, item));
            }
            return results;
        });

        await check('browser history restores anchors and carousel renders do not reset them', async () => {
            await hash(page, 'home-feature-carmen');
            const before = await page.evaluate(() => ({ url: location.href, length: history.length, scrollY }));
            await page.locator('#home-feature-next').click();
            await expect(page.locator('#home-feature-light')).toHaveCount(1);
            await expect(page.locator('#home-feature-carmen')).toHaveCount(0);
            const after = await page.evaluate(() => ({ url: location.href, length: history.length, scrollY }));
            assert.equal(after.url, before.url);
            assert.equal(after.length, before.length);
            assert.ok(Math.abs(after.scrollY - before.scrollY) <= 2, 'A carousel render must not jump the document');
            await uniqueIds(page);
            await hash(page, 'home-pathways');
            await hash(page, 'plan-your-visit');
            await hash(page, 'home-membership');
            await page.goBack();
            await expect.poll(() => new URL(page.url()).hash).toBe('#plan-your-visit');
            const back = await placement(page, 'plan-your-visit');
            await page.goForward();
            await expect.poll(() => new URL(page.url()).hash).toBe('#home-membership');
            const forward = await placement(page, 'home-membership');
            return { before, after, back, forward };
        });

        await check('unknown and malformed fragments preserve state without exceptions', async () => {
            await hash(page, 'home-booking-date-2026-11-01');
            const snapshot = () => page.evaluate(() => ({
                month: document.querySelector('#quick-month').textContent,
                date: document.querySelector('.quick-date[aria-pressed="true"]')?.id,
                scrollY, focus: document.activeElement?.id,
            }));
            const before = await snapshot();
            const invalid = ['missing-home-target', 'home-booking-date-not-a-date', 'home-booking-date-2026-13-01', 'home-booking-date-2026-02-30', 'home-booking-date-2026-11', 'home-booking-date-', '%E0%A4%A'];
            for (const id of invalid) {
                await page.evaluate(value => { location.hash = value; }, id);
                await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                assert.deepEqual(await snapshot(), before, `Malformed fragment ${id} must not reset booking or focus`);
            }
            await initial(page, 'home-booking-date-2026-99-99');
            assert.notEqual((await page.locator('#quick-month').textContent()).trim(), '2026. 99');
            await initial(page, '%E0%A4%A');
            await expect(page.locator('#home')).toBeVisible();
            return { checkedFragments: invalid, initialMalformedDates: true, initialMalformedEncoding: true };
        });

        await check('original Seoul SVG is served unchanged and the footer fits desktop and mobile', async () => {
            const original = fs.readFileSync(path.resolve(__dirname, '../../assets/logos/seoulmysoul-citybrand.svg'));
            const mirror = fs.readFileSync(path.resolve(__dirname, '../public/assets/logos/seoulmysoul-citybrand.svg'));
            assert.equal(digest(mirror), digest(original), 'The public mirror must preserve the uploaded SVG bytes');
            const response = await page.request.get(new URL('/v5/assets/logos/seoulmysoul-citybrand.svg', base).href);
            assert.equal(response.status(), 200);
            assert.equal(digest(await response.body()), digest(original), 'The production export must serve the original SVG');
            const results = [];
            for (const width of [1440, 390, 320]) {
                const context = width === 1440 ? desktop : await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
                const screen = width === 1440 ? page : await context.newPage();
                if (screen !== page) observe(screen, `mobile-${width}`);
                await initial(screen, 'footer-citybrand');
                await placement(screen, 'footer-citybrand');
                const logo = screen.locator('#footer-citybrand img');
                await expect(logo).toHaveAttribute('src', '/v5/assets/logos/seoulmysoul-citybrand.svg');
                await expect(logo).toHaveAttribute('alt', '서울시 로고 SEOUL MY SOUL');
                await expect(screen.locator('#footer-citybrand')).toHaveAttribute('href', 'https://www.seoul.go.kr/main/index.jsp');
                await expect.poll(() => logo.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
                const layout = await logo.evaluate(image => {
                    const rect = image.getBoundingClientRect();
                    const phone = document.getElementById('footer-phone').getBoundingClientRect();
                    const family = document.getElementById('family-site').getBoundingClientRect();
                    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, phoneBottom: phone.bottom, familyTop: family.top, overflow: document.documentElement.scrollWidth - innerWidth, viewport: innerWidth };
                });
                assert.ok(layout.width > 100 && layout.width <= 228);
                assert.ok(Math.abs(layout.width / layout.height - 624.55 / 101.21) < .02, 'The logo must preserve its original aspect ratio');
                assert.ok(layout.x >= 0 && layout.x + layout.width <= layout.viewport);
                assert.ok(layout.y >= layout.phoneBottom + 15, 'Logo needs separation beneath the phone');
                assert.ok(layout.y + layout.height <= layout.familyTop);
                assert.ok(layout.overflow <= 1, 'Footer must not introduce horizontal overflow');
                await uniqueIds(screen);
                await screenshot(screen, `footer-citybrand-${width}.png`);
                results.push({ viewport: width, ...layout });
                if (context !== desktop) await context.close();
            }
            return { sha256: digest(original), layouts: results };
        });

        await check('anchor navigation completes without browser or asset errors', async () => {
            assert.deepEqual(report.browserErrors, []);
            assert.deepEqual(report.httpErrors, []);
            return { browserErrors: 0, httpErrors: 0 };
        });
        await desktop.close();
    } finally {
        await browser.close();
        report.finishedAt = new Date().toISOString();
        save();
    }
    if (report.checks.some(result => result.status === 'failed')) process.exitCode = 1;
    console.log(`Anchor report: ${path.join(directory, 'home-anchor-results.json')}`);
}

main().catch(error => {
    report.fatal = error.stack || String(error);
    save();
    console.error(error);
    process.exitCode = 1;
});
