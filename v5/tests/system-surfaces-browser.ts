import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "playwright";
import ts from "typescript";
import { GLASS_MATERIALS, renderDesignTokensCss } from "../src/data/design-tokens.ts";

// [실제 표면과 비차단 유리 알림 / Actual surfaces and nonblocking glass feedback]
// 별도 브라우저에서 네이티브 의미·광학·초점·연속 알림을 검증합니다.
// Verify native semantics, optics, focus and renewed feedback in an isolated browser.
const require = createRequire(import.meta.url);
const browser = await chromium.launch();
const page = await browser.newPage();
const errors: string[] = [];
const evidence = path.resolve(".lemonade/system-surfaces");
mkdirSync(evidence, { recursive: true });
page.on("pageerror", error => errors.push(error.message));

try {
    await page.setContent("<!doctype html><html lang='ko'><body><div id='root'></div></body></html>");
    const styles = ["compat/shared", "defaults", "motion", "liquid-glass", "small-notification-modal", "system-surface", "typography"];
    await page.addStyleTag({ content: renderDesignTokensCss() + styles.map(name => readFileSync(new URL(`../styles/${name}.css`, import.meta.url), "utf8")).join("\n") });
    await page.addStyleTag({ content: `
        body { margin: 0; padding: var(--space-4); background: var(--surface-subtle); }
        main { display: grid; gap: var(--space-4); }
        h2, p { margin: 0; }
        #glass-stage { padding: var(--space-8); background: repeating-linear-gradient(110deg, var(--color-sky) 0 24px, var(--color-white) 24px 48px); }
        #black-glass { padding: var(--space-6); }
    ` });
    await page.addScriptTag({ path: path.join(path.dirname(require.resolve("react")), "umd/react.development.js") });
    await page.addScriptTag({ path: path.join(path.dirname(require.resolve("react-dom")), "umd/react-dom.development.js") });

    const modules = [
        ["design-tokens", "../src/data/design-tokens.ts"],
        ["liquid-glass", "../src/lib/liquid-glass.ts"],
        ...["SystemText", "SystemSurface", "GlassRefraction", "LiquidGlass", "SmallNotificationModal"].map(name => [name, `../components/${name}.tsx`]),
    ];
    for (const [name, file] of modules) {
        const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
            compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
        }).outputText;
        await page.addScriptTag({ content: `(() => {
            const exports = {};
            const React = window.React;
            const runtime = { jsx: (type, props, key) => React.createElement(type, {...props, key}), jsxs: (type, props, key) => React.createElement(type, {...props, key}) };
            const require = name => name === 'react' ? React : name === 'react-dom' ? window.ReactDOM : name === 'react/jsx-runtime' ? runtime : window.surfaceModules[name.split('/').pop().replace(/\\.ts$/, '')];
            ${source}
            window.surfaceModules = window.surfaceModules || {};
            window.surfaceModules[${JSON.stringify(name)}] = exports;
        })();` });
    }

    await page.addScriptTag({ content: `
        const h = React.createElement;
        const Surface = surfaceModules.SystemSurface.SystemSurface;
        const Glass = surfaceModules.LiquidGlass.default;
        const { SmallNotificationModalHost, showSmallNotification } = surfaceModules.SmallNotificationModal;
        window.showSurfaceNotice = showSmallNotification;
        ReactDOM.createRoot(document.getElementById('root')).render(h(React.Fragment, null,
            h('main', null,
                h(Surface, {as:'section', id:'panel', padding:'lg', 'aria-labelledby':'panel-title'},
                    h('h2', {id:'panel-title'}, '예매가 완료되었습니다.'),
                    h('button', {id:'notice-trigger', onClick:() => showSmallNotification('관심 프로그램에 저장했어요.')}, '알림 보기')),
                h(Surface, {as:'form', id:'surface-form', action:'/booking', method:'post', variant:'inset', radius:'compact'},
                    h('label', {htmlFor:'surface-input'}, '예매번호'), h('input', {id:'surface-input', name:'bookingId'})),
                ...['subtle','banner','elevated'].map(variant => h(Surface, {key:variant, id:'surface-'+variant, variant, padding:'sm'}, variant)),
                h('div', {id:'glass-stage'}, h(Glass, {id:'black-glass', variant:'black'}, h('p', null, '브랜드 블랙 리퀴드 글래스')))),
            h(SmallNotificationModalHost)));
    ` });

    await page.locator("#panel").waitFor();
    assert.equal(await page.locator("#panel").evaluate(element => element.tagName), "SECTION");
    assert.equal(await page.locator("#surface-form").evaluate(element => element.tagName), "FORM");
    assert.equal(await page.locator("#surface-form").getAttribute("method"), "post");
    assert.equal(await page.locator("#surface-input").getAttribute("name"), "bookingId");
    assert.equal(await page.getByRole("region", { name: "예매가 완료되었습니다." }).count(), 1);

    for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        const surface = await page.locator("#panel").evaluate(element => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            return { radius: parseFloat(style.borderRadius), border: parseFloat(style.borderWidth), shadow: style.boxShadow, padding: parseFloat(style.padding), overflow: style.overflow, inside: box.x >= 0 && box.right <= innerWidth };
        });
        assert.deepEqual({ radius: surface.radius, border: surface.border, overflow: surface.overflow, inside: surface.inside }, { radius: 20, border: 0, overflow: "visible", inside: true });
        assert.match(surface.shadow, /inset/);
        assert.match(surface.shadow, /0px 0px 0px 1px/);
        assert.ok(surface.padding >= 24 && surface.padding <= 32);
        await page.locator("#notice-trigger").click();
        await page.waitForFunction(() => getComputedStyle(document.getElementById("toast")!).opacity === "1");
        const notice = page.locator('#toast[role="status"][aria-live="polite"]');
        assert.equal(await notice.getAttribute("data-glass-variant"), "black");
        assert.equal(await notice.locator(".liquid-glass-optics").count(), 1);
        assert.equal(await notice.locator('[data-text="body"]').innerText(), "관심 프로그램에 저장했어요.");
        const capsule = await notice.evaluate(element => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            return { radius: parseFloat(style.borderRadius), font: parseFloat(style.fontSize), inside: box.x >= 0 && box.right <= innerWidth && box.bottom <= innerHeight, pointer: style.pointerEvents, focus: document.activeElement?.id };
        });
        assert.ok(capsule.radius >= 999 && capsule.font >= 16 && capsule.inside);
        assert.equal(capsule.pointer, "none");
        assert.equal(capsule.focus, "notice-trigger");
        await page.screenshot({ path: path.join(evidence, `surface-and-glass-${width}.png`) });
    }

    await page.waitForFunction(() => document.getElementById("black-glass")!.style.getPropertyValue("--glass-filter").startsWith("url("));
    assert.equal(Number(await page.locator("#black-glass feDisplacementMap").getAttribute("scale")), GLASS_MATERIALS.black.refraction);
    assert.equal(Number(await page.locator("#black-glass feGaussianBlur").getAttribute("stdDeviation")), GLASS_MATERIALS.black.blur);
    assert.ok((await page.locator("#black-glass feImage").getAttribute("href"))!.startsWith("data:image/png"));
    assert.match(await page.locator("#black-glass .liquid-glass-optics").evaluate(element => getComputedStyle(element).backdropFilter), /url\(/);

    // [긴 알림·연속 갱신·퇴장과 모션 감소 / Long feedback, renewal, exit and reduced motion]
    await page.clock.install();
    await page.evaluate(() => (window as unknown as { showSurfaceNotice: (message: string) => void }).showSurfaceNotice("긴 공연명과 예매 상태가 여러 줄로 표시되어도 알림은 화면 안에서 읽을 수 있어요."));
    const longNotice = await page.locator("#toast").boundingBox();
    assert.ok(longNotice && longNotice.x >= 0 && longNotice.x + longNotice.width <= 320);
    await page.clock.runFor(3000);
    await page.evaluate(() => (window as unknown as { showSurfaceNotice: (message: string) => void }).showSurfaceNotice("연속 알림을 갱신했어요."));
    await page.clock.runFor(3000);
    assert.equal(await page.locator("#toast").getAttribute("aria-hidden"), null);
    await page.clock.runFor(750);
    assert.equal(await page.locator("#toast").getAttribute("aria-hidden"), "true");
    await page.waitForFunction(() => getComputedStyle(document.getElementById("toast")!).visibility === "hidden");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "notice-trigger");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => (window as unknown as { showSurfaceNotice: (message: string) => void }).showSurfaceNotice("모션을 줄여도 안내가 표시돼요."));
    await page.clock.runFor(250);
    assert.equal(await page.locator("#toast").evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42), 0);
    assert.deepEqual(errors, []);
    console.log("PASS semantic surfaces, native form props, shared black refraction, responsive capsules, focus, renewed timer and reduced motion");
} finally {
    await browser.close();
}
