import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement, Fragment } from "react";
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// [실제 TSX와 React 서버 렌더링 / Actual TSX with React server rendering]
// 기존 브라우저 fixture와 같은 변환으로 의존성을 추가하지 않고 구현을 실행합니다.
// Use the existing browser-fixture transform to execute the implementation without a new runtime.
const require = createRequire(import.meta.url);
const compiledModule = { exports: {} as Record<string, any> };
const compiledSource = ts.transpileModule(readFileSync(new URL("../components/SystemControlGroup.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
new Function("require", "module", "exports", compiledSource)(require, compiledModule, compiledModule.exports);
const { SystemControlGroup } = compiledModule.exports;

const link = (id: string) => createElement("a", { key: id, href: `/visit/${id}`, "data-text": "action" }, id);
const render = (children: ReactNode, props = {}) => renderToStaticMarkup(createElement(SystemControlGroup, { as: "nav", ...props }, children));
const wrapperKeys = (children: ReactNode) => {
    const output = SystemControlGroup({ children }) as ReactElement<{ children: ReactElement[] }>;
    return Object.fromEntries(output.props.children.map(item => [((item.props as { children: ReactElement }).children.props as { href: string }).href, item.key]));
};

// [프래그먼트와 네이티브 의미 회귀 / Fragment and native-semantics regressions]
test("three nested fragments expose six controls and the normal responsive column counts", () => {
    const nested = createElement(Fragment, { key: "outer" }, null, false,
        createElement(Fragment, { key: "middle" }, [link("spaces"), null, true, link("directions")],
            createElement(Fragment, { key: "inner" }, [link("amenities"), [link("accessibility"), false]], link("etiquette"))),
        link("support"));
    const html = render(nested, { "aria-label": "Visit navigation" });
    assert.match(html, /^<nav[^>]*aria-label="Visit navigation"/);
    assert.match(html, /data-control-count="6"/);
    assert.match(html, /--control-group-columns-compact:2/);
    assert.match(html, /--control-group-columns-medium:3/);
    assert.match(html, /--control-group-columns-wide:6/);
    assert.equal((html.match(/class="system-control-group-item"/g) || []).length, 6);
    assert.equal((html.match(/<a /g) || []).length, 6);
});

test("list groups preserve list semantics and limit configured columns by the actual item count", () => {
    const children = createElement(Fragment, {}, [link("one"), link("two"), link("three")]);
    const html = render(children, { as: "ul", columns: { compact: 6, medium: 5, wide: 4 }, maxColumns: 4 });
    assert.match(html, /^<ul /);
    assert.match(html, /data-control-count="3"/);
    assert.match(html, /--control-group-columns-compact:3/);
    assert.match(html, /--control-group-columns-medium:3/);
    assert.match(html, /--control-group-columns-wide:3/);
    assert.equal((html.match(/<li class="system-control-group-item">/g) || []).length, 3);
    assert.doesNotMatch(html, /<div/);
    const limited = render(children, { maxColumns: 2 });
    assert.match(limited, /--control-group-columns-wide:2/);
});

test("null, booleans and empty nested fragments keep safe one-column geometry", () => {
    const html = render([null, false, true, undefined, createElement(Fragment, { key: "empty" }, createElement(Fragment, {}, null))]);
    assert.match(html, /data-control-count="0"/);
    assert.match(html, /--control-group-columns-compact:1/);
    assert.match(html, /--control-group-columns-medium:1/);
    assert.match(html, /--control-group-columns-wide:1/);
    assert.doesNotMatch(html, /NaN|Infinity|system-control-group-item/);
});

test("keyed controls retain wrapper identities when controls and fragment groups reorder", () => {
    const first = [createElement(Fragment, { key: "first" }, [link("one"), link("two")]), createElement(Fragment, { key: "second" }, link("three"))];
    const second = [createElement(Fragment, { key: "second" }, link("three")), createElement(Fragment, { key: "first" }, [link("two"), link("one")])];
    assert.deepEqual(wrapperKeys(first), wrapperKeys(second));
    assert.equal(new Set(Object.values(wrapperKeys(first))).size, 3);
});
