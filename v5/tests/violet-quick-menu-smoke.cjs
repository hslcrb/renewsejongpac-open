const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const baseURL = process.env.SEJONG_TEST_URL || 'http://127.0.0.1:3000/v5/';
const reportDir = process.env.SEJONG_VIOLET_REPORT_DIR || path.resolve(__dirname, '../.lemonade/violet-quick-menu');
const executablePath = process.env.CHROMIUM_PATH;
const output = { baseURL, checks: [], browserErrors: [], requests: [] };
const menuSelector = '[data-violet-menu]';
const toggleSelector = '[data-violet-toggle]';
const wheelSelector = '[data-violet-wheel]';

async function check(name, fn) {
  try {
    const detail = await fn();
    output.checks.push({ name, status: 'PASS', detail });
    console.log(`PASS ${name}: ${JSON.stringify(detail)}`);
  } catch (error) {
    output.checks.push({ name, status: 'FAIL', error: error.stack || String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function instrument(context, label) {
  context.on('page', page => {
    page.on('pageerror', error => output.browserErrors.push({ label, type: 'pageerror', message: error.message }));
    page.on('console', message => {
      if (message.type() === 'error') output.browserErrors.push({ label, type: 'console', message: message.text() });
    });
    page.on('response', response => {
      if (response.status() >= 400) output.requests.push({ label, status: response.status(), url: response.url() });
    });
  });
  await context.addInitScript(() => {
    const measurement = window.__violetCanvasQA = { frame: 0, recording: false, calls: [] };
    const request = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => request.call(window, timestamp => {
      measurement.frame = timestamp;
      callback(timestamp);
    });
    for (const name of ['drawImage', 'moveTo', 'bezierCurveTo', 'fill', 'stroke', 'createRadialGradient', 'createLinearGradient']) {
      const method = CanvasRenderingContext2D.prototype[name];
      CanvasRenderingContext2D.prototype[name] = function (...args) {
        if (measurement.recording && measurement.calls.length < 50000) measurement.calls.push({
          name, frame: measurement.frame, connected: this.canvas.isConnected,
          violet: !!this.canvas.closest?.('[data-violet-menu]'),
          ...(['moveTo', 'bezierCurveTo'].includes(name) ? { point: args } : {}),
          ...(name === 'drawImage' ? { origin: args.slice(1, 3), matrix: [this.getTransform().b, this.getTransform().c, this.getTransform().e, this.getTransform().f] } : {}),
        });
        return method.apply(this, args);
      };
    }
  });
}

async function load(page) {
  const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  await page.locator(toggleSelector).waitFor({ state: 'visible' });
  await page.waitForTimeout(650);
}

async function open(page, touch = false) {
  if (await page.locator(menuSelector).getAttribute('data-state') === 'open') return;
  if (touch) await page.locator(toggleSelector).tap();
  else await page.locator(toggleSelector).click();
  await page.waitForFunction(() => document.querySelector('[data-violet-menu]')?.dataset.state === 'open');
  await page.waitForTimeout(700);
}

async function sampleFade(page, top, expectedOpacity, duration = 350) {
  return page.evaluate(async ({ target, expectedOpacity, duration }) => {
    const root = document.querySelector('[data-violet-menu]');
    const readings = [];
    const started = performance.now();
    let settledFrames = 0;
    window.scrollTo({ top: target, behavior: 'instant' });
    // Keep the intermediate frames, but finish on the actual transition endpoint.
    // The bounded wait accommodates browser scheduling; CSS still must be 180ms.
    while (performance.now() - started < 2000) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const style = getComputedStyle(root);
      const opacity = Number(style.opacity);
      const appliedOpacity = Number(style.getPropertyValue('--hero-opacity'));
      const transitioning = root.getAnimations().some(animation => animation instanceof CSSTransition && animation.transitionProperty === 'opacity' && (animation.playState === 'running' || animation.pending));
      const elapsed = performance.now() - started;
      readings.push({ elapsed: Math.round(elapsed), opacity, appliedOpacity, transitioning, display: style.display, visibility: style.visibility, visible: root.dataset.visible, ariaHidden: root.getAttribute('aria-hidden'), inert: root.inert, state: root.dataset.state });
      const matchesExpected = Array.isArray(expectedOpacity) ? opacity >= expectedOpacity[0] && opacity <= expectedOpacity[1] : opacity === expectedOpacity;
      settledFrames = elapsed >= duration && matchesExpected && opacity === appliedOpacity && !transitioning ? settledFrames + 1 : 0;
      if (settledFrames >= 2) break;
    }
    return readings;
  }, { target: top, expectedOpacity, duration });
}

async function main() {
  await fs.mkdir(reportDir, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    output.browser = browser.version();
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await instrument(desktop, 'desktop');
    const page = await desktop.newPage();
    await load(page);
    await open(page);
    await check('desktop fluid changes contours within a small painting budget', async () => {
      await page.evaluate(() => { window.__violetCanvasQA.calls = []; window.__violetCanvasQA.recording = true; });
      await page.waitForTimeout(650);
      const calls = await page.evaluate(() => { window.__violetCanvasQA.recording = false; return window.__violetCanvasQA.calls; });
      const visibleCalls = calls.filter(call => call.violet);
      const curves = visibleCalls.filter(call => call.name === 'bezierCurveTo');
      const perFrame = new Map();
      for (const call of curves) {
        if (!perFrame.has(call.frame)) perFrame.set(call.frame, []);
        perFrame.get(call.frame).push(call.point);
      }
      const frames = [...perFrame.values()];
      assert.ok(frames.length > 3 && frames.length <= 22, 'Visible fluid should paint within its 30fps cap');
      assert.ok(frames.every(frame => frame.length === 6), 'Each frame uses six broad curves');
      assert.notDeepEqual(frames[0], frames.at(-1), 'Interior contours must flow rather than move a cached bitmap');
      assert.equal(visibleCalls.filter(call => /Gradient|drawImage|stroke/.test(call.name)).length, 0, 'Steady frames reuse their gradient palette');
      assert.equal(await page.locator('[data-violet-fur]').count(), 0, 'No furry layer remains');
      await page.screenshot({ path: path.join(reportDir, 'desktop-open.png') });
      return { drawnFrames: frames.length, curvesPerFrame: frames[0].length };
    });
    await check('desktop quick scroll fades out and back in', async () => {
      await page.mouse.move(16, 16);
      const opacityTransition = await page.locator(menuSelector).evaluate(root => {
        const style = getComputedStyle(root);
        const properties = style.transitionProperty.split(',').map(value => value.trim());
        const durations = style.transitionDuration.split(',').map(value => value.trim());
        return durations[properties.indexOf('opacity') % durations.length];
      });
      assert.equal(opacityTransition, '0.18s', 'The product fade remains a quick 180ms transition');
      const geometry = await page.locator('#featured-season').evaluate(hero => {
        const rect = hero.getBoundingClientRect();
        const headerHeight = document.querySelector('.renewal-header')?.getBoundingClientRect().height || 0;
        const distance = Math.min(180, Math.max(120, rect.height * .25));
        return { top: rect.top + scrollY, height: rect.height, headerHeight, distance, midpoint: rect.top + scrollY - headerHeight + distance / 2, fullOut: rect.top + scrollY - headerHeight + distance + 25 };
      });
      const toMidpoint = await sampleFade(page, geometry.midpoint, [.48, .52]);
      const midpointOpacity = toMidpoint.at(-1).opacity;
      assert.ok(midpointOpacity >= .48 && midpointOpacity <= .52, `Expected spatial fade midpoint, observed ${midpointOpacity}`);
      await page.screenshot({ path: path.join(reportDir, 'desktop-fade-midpoint.png') });
      const out = await sampleFade(page, geometry.fullOut, 0);
      const midOut = out.find(frame => frame.opacity > 0 && frame.opacity < 1 && frame.display !== 'none');
      const finalOut = out.at(-1);
      const fadedOut = finalOut.opacity === 0 || finalOut.display === 'none' || finalOut.visibility === 'hidden';
      const input = await page.locator(menuSelector).evaluate(root => {
        const toggle = root.querySelector('[data-violet-toggle]');
        const rect = toggle.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        toggle.focus({ preventScroll: true });
        return { inert: root.inert, ariaHidden: root.getAttribute('aria-hidden'), visible: root.dataset.visible, interceptsPointer: !!hit && root.contains(hit), ownsFocus: root.contains(document.activeElement), heroStillInView: document.getElementById('featured-season').getBoundingClientRect().bottom > document.querySelector('.renewal-header').getBoundingClientRect().height };
      });
      const backToMidpoint = await sampleFade(page, geometry.midpoint, [.48, .52]);
      const inwardMidpointOpacity = backToMidpoint.at(-1).opacity;
      const inward = await sampleFade(page, 0, 1);
      const midIn = inward.find(frame => frame.opacity > 0 && frame.opacity < 1 && frame.display !== 'none');
      const finalIn = inward.at(-1);
      await fs.writeFile(path.join(reportDir, 'desktop-fade.json'), JSON.stringify({ geometry, toMidpoint, out, backToMidpoint, inward, input }, null, 2));
      assert.ok(midOut, 'Quick scroll should retain a visible intermediate fade-out frame');
      assert.ok(fadedOut, 'Menu should fully fade out after leaving the hero');
      assert.equal(input.inert, true);
      assert.equal(input.ariaHidden, 'true');
      assert.equal(input.visible, 'false');
      assert.equal(input.interceptsPointer, false);
      assert.equal(input.ownsFocus, false);
      assert.equal(input.heroStillInView, true, 'Menu should finish fading while hero remains in view');
      assert.ok(inwardMidpointOpacity >= .48 && inwardMidpointOpacity <= .52, 'Return scroll should restore spatial midpoint');
      assert.ok(midIn, 'Return to hero should show an intermediate fade-in frame');
      assert.equal(finalIn.opacity, 1);
      assert.equal(finalIn.visible, 'true');
      assert.equal(finalIn.inert, false);
      assert.notEqual(finalIn.visibility, 'hidden');
      return { opacityTransition, geometry, midpointOpacity, midOut, finalOut, input, inwardMidpointOpacity, midIn, finalIn };
    });
    await check('reduced motion stops fluid and menu animations', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page);
      await page.waitForTimeout(100);
      await page.evaluate(() => { window.__violetCanvasQA.calls = []; window.__violetCanvasQA.recording = true; });
      await page.waitForTimeout(350);
      const detail = await page.evaluate(() => ({
        fluidDraws: window.__violetCanvasQA.calls.filter(call => call.violet).length,
        rootTransition: getComputedStyle(document.querySelector('[data-violet-menu]')).transitionDuration,
        runningAnimations: document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect?.target?.closest?.('[data-violet-menu]')).map(animation => animation.animationName || 'transition'),
      }));
      await page.evaluate(() => window.__violetCanvasQA.recording = false);
      assert.equal(detail.fluidDraws, 0);
      assert.equal(detail.rootTransition, '0s');
      assert.deepEqual(detail.runningAnimations, []);
      return detail;
    });
    await desktop.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    await instrument(mobile, 'mobile390');
    const phone = await mobile.newPage();
    await load(phone);
    await check('390 mobile touch open, spin and native booking', async () => {
      const beforeURL = phone.url();
      await open(phone, true);
      assert.equal(await phone.locator(toggleSelector).getAttribute('aria-expanded'), 'true');
      const bounds = await phone.locator(wheelSelector).boundingBox();
      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390, 'Mobile wheel fits viewport');
      const initial = Number(await phone.locator(wheelSelector).getAttribute('data-rotation'));
      const cdp = await mobile.newCDPSession(phone);
      const touchAt = degrees => {
        const angle = degrees * Math.PI / 180;
        return { x: bounds.x + bounds.width / 2 + Math.cos(angle) * bounds.width * .37, y: bounds.y + bounds.height / 2 + Math.sin(angle) * bounds.height * .37, id: 1, radiusX: 4, radiusY: 4, force: 1 };
      };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchAt(-160)] });
      for (let angle = -150; angle <= -30; angle += 10) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touchAt(angle)] });
        await phone.waitForTimeout(15);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
      await phone.waitForTimeout(750);
      const rotation = Number(await phone.locator(wheelSelector).getAttribute('data-rotation'));
      assert.ok(Number.isFinite(rotation) && Math.abs(rotation - initial) >= 60);
      assert.equal(rotation % 60, 0);
      assert.equal(phone.url(), beforeURL, 'Spin must not navigate');
      assert.equal(await phone.locator(wheelSelector).getAttribute('data-dragging'), 'false');
      await phone.screenshot({ path: path.join(reportDir, 'mobile390-spun.png') });
      const booking = phone.locator('[data-violet-link="booking"]');
      assert.equal(await booking.evaluate(link => link.tagName), 'A');
      assert.equal(await booking.getAttribute('href'), '#quick-booking');
      await booking.tap();
      await phone.waitForFunction(() => location.hash === '#quick-booking' && document.activeElement?.id === 'quick-booking-heading');
      await phone.waitForTimeout(800);
      const result = await phone.locator(menuSelector).evaluate(root => ({ opacity: Number(getComputedStyle(root).opacity), visibility: getComputedStyle(root).visibility, display: getComputedStyle(root).display, state: root.dataset.state, hidden: root.hidden, focus: document.activeElement?.id, scrollY }));
      assert.equal(result.state, 'closed');
      assert.ok(result.opacity === 0 || result.visibility === 'hidden' || result.display === 'none');
      assert.equal(result.focus, 'quick-booking-heading');
      return { initial, snappedRotation: rotation, ...result };
    });
    await check('390 mobile scroll return fades in without overflow', async () => {
      const frames = await sampleFade(phone, 0, 1);
      const middle = frames.find(frame => frame.opacity > 0 && frame.opacity < 1 && frame.display !== 'none');
      const end = frames.at(-1);
      const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      await fs.writeFile(path.join(reportDir, 'mobile390-fade.json'), JSON.stringify(frames, null, 2));
      assert.ok(middle, 'Mobile return should have a visible fade midpoint');
      assert.equal(end.opacity, 1);
      assert.equal(end.visible, 'true');
      assert.equal(end.inert, false);
      assert.ok(overflow <= 1);
      await open(phone, true);
      await phone.screenshot({ path: path.join(reportDir, 'mobile390-open.png') });
      return { middle, end, overflow };
    });
    await mobile.close();
  } finally {
    await browser.close();
    await fs.writeFile(path.join(reportDir, 'smoke-results.json'), JSON.stringify(output, null, 2));
  }
  console.log(JSON.stringify({ checks: output.checks.map(({ name, status }) => ({ name, status })), browserErrors: output.browserErrors, requests: output.requests, reportDir }, null, 2));
  if (output.checks.some(check => check.status === 'FAIL')) process.exitCode = 1;
}

main().catch(async error => {
  console.error(error);
  output.fatal = error.stack || String(error);
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(path.join(reportDir, 'smoke-results.json'), JSON.stringify(output, null, 2));
  process.exitCode = 1;
});
