import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import snapshot from '../src/generated/catalog-snapshot.json' with { type: 'json' };

let browser: Browser;
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:4174';
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser.close(); });

test('missing hero artwork immediately uses a neutral venue image without requesting an image directory', async () => {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const directories: string[] = [];
    page.on('request', request => { if (/\/assets\/images\/?(?:\?|$)/.test(request.url())) directories.push(request.url()); });
    await page.route('**/rest/v1/rpc/sejong_catalog_snapshot', route => route.fulfill({ json: snapshot }));
    await page.goto(origin + '/v5/');
    await page.locator('.season-slide[data-feature="carmen"] img').first().waitFor();
    assert.deepEqual(directories, []);
    const image = page.locator('.season-slide[data-feature="carmen"] img').first();
    assert.match(await image.getAttribute('src') || '', /sejong-grand-interior\.png$/);
    assert.equal(await image.getAttribute('alt'), '세종문화회관 공간 사진');
    await page.close();
});

test('a refreshed empty hero collection remains usable without a render crash', async () => {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/rest/v1/rpc/sejong_catalog_snapshot', route => route.fulfill({ json: { ...snapshot, homeFeatures: [] } }));
    await page.goto(origin + '/v5/');
    await page.waitForTimeout(700);
    assert.deepEqual(errors, []);
    assert.equal(await page.locator('[data-component-id="hero-carousel"]').count(), 1);
    assert.match(await page.locator('[data-component-id="hero-carousel"]').innerText(), /공개된 주요 프로그램이 없습니다/);
    await page.locator('#header').getByRole('link', { name: '세종문화회관 홈', exact: true }).waitFor();
    await page.close();
});

test('shrinking a live hero list clamps the active index and removes obsolete navigation', async () => {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    let release!: () => void;
    const ready = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/rest/v1/rpc/sejong_catalog_snapshot', async route => { await ready; await route.fulfill({ json: { ...snapshot, homeFeatures: [snapshot.homeFeatures[0]] } }); });
    await page.goto(origin + '/v5/');
    await page.locator('#home-feature-next').click();
    await page.locator('#home-feature-next').click();
    assert.match(await page.locator('.season-pagination').innerText(), /03\s*\/\s*03/);
    release();
    await page.waitForFunction(() => document.querySelector('.season-pagination')?.textContent?.replace(/\s/g, '') === '01/01');
    assert.equal(await page.locator('#home-feature-next').isDisabled(), true);
    assert.deepEqual(errors, []);
    await page.close();
});
