import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// [TSX 실행 지원 / TSX execution support]
// Node의 실제 React 서버 렌더러로 공통 컴포넌트의 HTML 계약을 검증합니다.
// Exercise the real React renderer without adding a test runtime dependency.
registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === "next/link") return nextResolve("next/link.js", context);
        if (specifier.startsWith(".") && context.parentURL) {
            for (const extension of [".tsx", ".ts"]) {
                const candidate = new URL(`${specifier}${extension}`, context.parentURL);
                if (existsSync(candidate)) return nextResolve(candidate.href, context);
            }
        }
        return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
        if (url.endsWith(".tsx")) {
            return {
                format: "module",
                shortCircuit: true,
                source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
                    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
                }).outputText,
            };
        }
        return nextLoad(url, context);
    },
});

const primitives = await import("../components/SystemPrimitives.tsx");
const render = (component, props) => renderToStaticMarkup(createElement(component, props));

// [오류·결과와 두 레이아웃의 공통 흰 유리 / Shared white glass across error, status and both layouts]
test("all notice contexts and states compose white LiquidGlass while preserving their semantics", () => {
    for (const variant of ["default", "flow"]) for (const error of [false, true]) {
        const html = render(primitives.SystemNotice, {
            id: "notice-result", variant, error, title: "처리 결과", children: "요청을 확인했습니다.",
            "aria-describedby": "notice-help", tabIndex: -1,
        });
        assert.match(html, /data-glass-variant="white"/);
        assert.match(html, /class="[^"]*liquid-glass[^"]*ds-notice/);
        assert.match(html, /class="liquid-glass-optics" aria-hidden="true"/);
        assert.match(html, /data-component-id="notice"/);
        assert.match(html, new RegExp(`role="${error ? "alert" : "status"}"`));
        assert.match(html, /id="notice-result"/);
        assert.match(html, /aria-describedby="notice-help"/);
        assert.match(html, /tabindex="-1"/);
        assert.match(html, /처리 결과/);
        assert.match(html, /요청을 확인했습니다\./);
    }
});

// [네이티브 조작과 폼 계약 / Native control and form contracts]
test("buttons preserve native submit and accessibility attributes and expose flow context", () => {
    const html = render(primitives.SystemButton, {
        children: "예매", type: "submit", name: "action", value: "reserve", form: "booking",
        context: "flow", variant: "inverse", disabled: true, "aria-describedby": "help",
    });
    assert.match(html, /data-component="button"/);
    assert.match(html, /data-context="flow"/);
    assert.match(html, /type="submit"/);
    assert.match(html, /form="booking"/);
    assert.match(html, /disabled=""/);
    assert.match(html, /aria-describedby="help"/);
});

test("input, select and textarea share explicit labels and merge error descriptions", () => {
    for (const as of ["input", "select", "textarea"]) {
        const html = render(primitives.SystemField, {
            as, id: `field-${as}`, name: "recipient", label: "연락처", required: true,
            error: "확인해 주세요", hint: "이 안내는 오류 뒤에 표시하지 않습니다",
            "aria-describedby": "outside-help", variant: "flow", outerClassName: "wide",
            ...(as === "select" ? { children: createElement("option", { value: "seoul" }, "서울") } : {}),
        });
        assert.match(html, new RegExp(`<${as}[^>]+id="field-${as}"`));
        assert.match(html, new RegExp(`for="field-${as}"`));
        assert.match(html, /aria-invalid="true"/);
        assert.match(html, new RegExp(`aria-describedby="outside-help field-${as}-message"`));
        assert.match(html, /data-variant="flow"/);
        assert.match(html, /class="ds-field wide"/);
        assert.doesNotMatch(html, /이 안내는 오류 뒤에 표시하지 않습니다/);
    }
});

test("compact fields and checkboxes preserve accessible names and native submission", () => {
    const field = render(primitives.SystemField, { "aria-label": "휴대전화", name: "phone", autoComplete: "tel", labelHidden: true, label: "휴대전화" });
    assert.match(field, /class="ds-visually-hidden"/);
    assert.match(field, /autoComplete="tel"/);
    const checkbox = render(primitives.SystemCheckbox, { name: "consent", value: "yes", required: true, defaultChecked: true, label: "동의합니다" });
    assert.match(checkbox, /type="checkbox"/);
    assert.match(checkbox, /name="consent"/);
    assert.match(checkbox, /checked=""/);
    assert.match(checkbox, /동의합니다/);
});

test("links protect new browsing contexts and retain internal Next hrefs", () => {
    const external = render(primitives.SystemLink, { href: "https://example.com/", target: "_blank", rel: "nofollow", children: "외부" });
    assert.match(external, /rel="nofollow noopener noreferrer"/);
    const internal = render(primitives.SystemLink, { href: "/booking/?id=1", children: "예매" });
    assert.match(internal, /href="\/booking\/?\?id=1"/);
});

test("badges, notices and filters retain caller semantics", () => {
    assert.match(render(primitives.SystemBadge, { children: "공지", "data-testid": "status", className: "compact" }), /data-testid="status"/);
    const notice = render(primitives.SystemNotice, { children: "입력을 확인해 주세요", error: true, id: "flow-error", tabIndex: -1, variant: "flow" });
    assert.match(notice, /role="alert"/);
    assert.match(notice, /id="flow-error"/);
    assert.match(notice, /tabindex="-1"/);
    assert.doesNotMatch(notice, /<strong/);
    assert.match(render(primitives.SystemFilterButton, { selected: true, children: "전체" }), /aria-pressed="true"/);
});
