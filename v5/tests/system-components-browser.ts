import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "playwright";
import ts from "typescript";

// [브라우저에서 공통 동작 검증 / Shared behavior in a real browser]
// 애플리케이션 서버 없이 실제 React와 네이티브 dialog의 동작을 검증합니다.
// Exercise real React, browser focus, native form elements and dialog lifecycle.
const require = createRequire(import.meta.url);
const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
    await page.setContent("<!doctype html><html><body><div id='root'></div></body></html>");
    await page.addStyleTag({ content: readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8") + readFileSync(new URL("../styles/defaults.css", import.meta.url), "utf8") + readFileSync(new URL("../styles/system-primitives.css", import.meta.url), "utf8") });
    await page.addScriptTag({ path: path.join(path.dirname(require.resolve("react")), "umd/react.development.js") });
    await page.addScriptTag({ path: path.join(path.dirname(require.resolve("react-dom")), "umd/react-dom.development.js") });
    for (const name of ["Icon", "SystemPrimitives", "SystemDialog", "SystemNavigation"]) {
        const source = ts.transpileModule(readFileSync(new URL(`../components/${name}.tsx`, import.meta.url), "utf8"), {
            compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
        }).outputText;
        await page.addScriptTag({ content: `(() => { const exports = {}; const React = window.React; const runtime = { jsx: (type, props, key) => React.createElement(type, {...props, key}), jsxs: (type, props, key) => React.createElement(type, {...props, key}) }; const require = (name) => name === 'react' ? React : name === './Icon' ? window.Icon : name === 'next/link' ? {} : runtime; ${source}\nwindow.${name} = exports; })();` });
    }
    await page.addScriptTag({ content: `
        const { createElement: h, useState, useRef } = React;
        function Harness() {
            const [open, setOpen] = useState(false);
            const [mounted, setMounted] = useState(true);
            const [tab, setTab] = useState('one');
            const trigger = useRef(null); const field = useRef(null); const dialog = useRef(null); const autofocusDialog = useRef(null);
            window.testDialogRef = dialog;
            return h('main', null,
                h(SystemPrimitives.SystemButton, {id:'highlight', variant:'highlight'}, 'Highlighted action'),
                h('button', {id:'controlled-trigger', ref:trigger, onClick:() => setOpen(true)}, 'Open controlled'),
                h('button', {id:'imperative-trigger', onClick:() => dialog.current.showModal()}, 'Open imperative'),
                h('button', {id:'autofocus-trigger', onClick:() => autofocusDialog.current.showModal()}, 'Open autofocus example'),
                h('button', {id:'unmount', onClick:() => setMounted(false)}, 'Unmount'),
                mounted && h(SystemDialog.SystemDialog, {id:'modal', ref:dialog, open, onClose:() => setOpen(false), triggerRef:trigger, initialFocusRef:field, 'aria-labelledby':'heading'},
                    h('h2', {id:'heading'}, 'Dialog'), h(SystemPrimitives.SystemField, {id:'initial-focus', ref:field, 'aria-label':'Name'}),
                    h('button', {id:'close', onClick:() => dialog.current.close()}, 'Close')),
                h(SystemDialog.SystemDialog, {id:'autofocus-modal', ref:autofocusDialog, 'aria-labelledby':'autofocus-heading'},
                    h('h2', {id:'autofocus-heading'}, 'Autofocus example'),
                    h('button', {id:'autofocus-close', onClick:() => autofocusDialog.current.close()}, 'Close autofocus example'),
                    h(SystemPrimitives.SystemField, {id:'autofocus-field', label:'Search', autoFocus:true})),
                h(SystemNavigation.SystemTabs, {value:tab, onValueChange:setTab, 'aria-label':'Examples', items:[
                    {id:'one',label:'First',content:'First panel'}, {id:'disabled',label:'Disabled',content:'Disabled panel',disabled:true}, {id:'three',label:'Third',content:'Third panel'}]}),
                h(SystemNavigation.SystemDisclosure, {summary:'Details'}, h('p', null, 'Native details content'))
            );
        }
        ReactDOM.createRoot(document.getElementById('root')).render(h(Harness));
    ` });
    assert.equal(await page.locator("#highlight").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(247, 213, 73)");
    await page.locator("#controlled-trigger").click();
    await page.waitForFunction(() => document.querySelector("dialog")?.open && document.activeElement?.id === "initial-focus");
    assert.deepEqual(await page.locator("#initial-focus").evaluate((element) => { const style = getComputedStyle(element); return [style.outlineWidth, style.outlineOffset]; }), ["3px", "4px"]);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "close");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog")?.open && document.body.style.overflow === "");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "controlled-trigger");

    await page.locator("#imperative-trigger").click();
    await page.waitForFunction(() => document.activeElement?.id === "initial-focus");
    assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
    await page.locator("#close").click();
    await page.waitForFunction(() => document.body.style.overflow === "");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "controlled-trigger");

    await page.locator("#controlled-trigger").click();
    await page.mouse.click(2, 2);
    await page.waitForFunction(() => !document.querySelector("dialog")?.open);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    await page.locator("#autofocus-trigger").click();
    await page.waitForFunction(() => document.querySelector<HTMLDialogElement>("#autofocus-modal")?.open);
    const autofocusState = await page.locator("#autofocus-field").evaluate((element: HTMLInputElement) => ({ active: document.activeElement?.id, autofocus: element.autofocus, markup: element.outerHTML }));
    assert.equal(autofocusState.active, "autofocus-field", `An autofocus field must take priority over the earlier close button: ${JSON.stringify(autofocusState)}`);
    await page.locator("#autofocus-close").click();
    await page.waitForFunction(() => document.body.style.overflow === "");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "autofocus-trigger");
    const first = page.getByRole("tab", { name: "First", exact: true });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.activeElement?.textContent === "Third");
    assert.equal(await page.getByRole("tabpanel").innerText(), "Third panel");
    assert.equal(await page.getByRole("tab", { name: "Third", exact: true }).getAttribute("aria-selected"), "true");
    await page.keyboard.press("Home");
    assert.equal(await first.getAttribute("aria-selected"), "true");
    await page.keyboard.press("End");
    assert.equal(await page.getByRole("tab", { name: "Third", exact: true }).getAttribute("aria-selected"), "true");
    await page.locator("summary").focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("details").evaluate((element: HTMLDetailsElement) => element.open), true);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("details").evaluate((element: HTMLDetailsElement) => element.open), false);
    await page.locator("#controlled-trigger").click();
    assert.equal(await page.locator("#modal").evaluate((element) => getComputedStyle(element).animationName), "none");
    await page.evaluate(() => document.getElementById("unmount")!.click());
    await page.waitForFunction(() => !document.querySelector("#modal") && document.body.style.overflow === "");
    assert.deepEqual(errors, []);
    console.log("PASS shared dialog controlled/imperative focus, Escape, backdrop, scroll cleanup, reduced motion, keyboard tabs and native disclosure");
} finally {
    await browser.close();
}
