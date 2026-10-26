/* 기관소개 실제 브라우저 계약 / Browser acceptance, not source-string checks. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, '../test-results/introduction');
fs.mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [], errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  const check = async (name, action) => {
    try { await action(); results.push({ name, passed: true }); }
    catch (e) { results.push({ name, passed: false, error: e.message }); }
  };
  await page.goto(base + '/v5/about/introduction/', { waitUntil: 'networkidle' });
  await check('dedicated institution experience replaces placeholder', async () => {
    assert.equal(await page.locator('[data-intro-experience]').count(), 1);
    assert.equal(await page.locator('main').count(), 1);
    assert.match(await page.locator('h1').innerText(), /오래된 멋/);
  });
  await check('real video, accessible pause control, muted inline playback', async () => {
    const video = page.locator('.intro-film video');
    assert.equal(await video.count(), 1);
    assert.ok(await video.evaluate(v => v.muted && v.playsInline));
    assert.equal(await page.getByRole('button', { name: '움직임 멈추기' }).count(), 1);
    await page.getByRole('button', { name: '움직임 멈추기' }).click();
    assert.ok(await video.evaluate(v => v.paused));
    await page.getByRole('button', { name: '움직임 재생하기' }).click();
  });
  await page.screenshot({ path: path.join(out, 'desktop-top.png') });
  await check('header hides while scrolling, footer remains hidden', async () => {
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(400);
    assert.equal(await page.locator('#header').evaluate(e => getComputedStyle(e).opacity), '0');
    assert.equal(await page.locator('#footer').evaluate(e => getComputedStyle(e).opacity), '0');
  });
  await check('chapter buttons navigate and reflect current chapter', async () => {
    await page.getByRole('button', { name: '결: 한국의 색과 리듬' }).click();
    await page.waitForTimeout(1000);
    assert.equal(await page.getByRole('button', { name: '결: 한국의 색과 리듬' }).getAttribute('aria-current'), 'step');
  });
  await page.screenshot({ path: path.join(out, 'desktop-rhythm.png') });
  await check('footer appears at end and fades rapidly on upward scroll', async () => {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(650);
    assert.equal(await page.locator('#footer').evaluate(e => getComputedStyle(e).opacity), '1');
    await page.screenshot({ path: path.join(out, 'desktop-end.png') });
    await page.evaluate(() => window.scrollBy(0, -100));
    await page.waitForTimeout(220);
    assert.equal(await page.locator('#footer').evaluate(e => getComputedStyle(e).opacity), '0');
  });
  await check('hidden footer is revealed by keyboard focus', async () => {
    await page.locator('#footer a').first().focus();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('#footer').evaluate(e => getComputedStyle(e).opacity), '1');
  });
  await check('global transparent selection does not disable copying', async () => {
    await page.goto(base + '/v5/programs/', { waitUntil: 'networkidle' });
    const selection = await page.locator('h1').first().evaluate(e => {
      const range = document.createRange(); range.selectNodeContents(e);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      return { background: getComputedStyle(e, '::selection').backgroundColor, text: selection.toString() };
    });
    assert.equal(selection.background, 'rgba(0, 0, 0, 0)');
    assert.ok(selection.text.length > 0);
    assert.equal(await page.locator('body').evaluate(e => e.classList.contains('sejong-intro-active')), false);
  });
  for (const width of [360, 390, 768, 1440]) await check(`responsive viewport ${width}`, async () => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(base + '/v5/about/introduction/', { waitUntil: 'networkidle' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.ok(await page.locator('.intro-description').first().evaluate(e => parseFloat(getComputedStyle(e).fontSize) >= 18));
    await page.screenshot({ path: path.join(out, `viewport-${width}.png`) });
  });
  await check('reduced-motion visitors receive a still, readable experience', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'networkidle' });
    assert.ok(await page.locator('.intro-film video').evaluate(v => v.paused));
    assert.equal(await page.locator('[data-intro-experience]').getAttribute('data-motion'), 'paused');
  });
  await check('SSR remains useful without JavaScript', async () => {
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const p = await noJS.newPage();
    await p.goto(base + '/v5/about/introduction/');
    assert.match(await p.locator('h1').innerText(), /오래된 멋/);
    assert.ok(await p.locator('a[href="/v5/programs/"]').count());
    await noJS.close();
  });
  await check('no browser exceptions', async () => assert.deepEqual(errors, []));
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, errors }, null, 2));
  console.table(results);
  await browser.close();
  if (results.some(r => !r.passed)) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
