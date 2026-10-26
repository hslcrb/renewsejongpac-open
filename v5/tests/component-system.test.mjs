import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = new URL("../scripts/audit-component-system.ts", import.meta.url);
const chapters = [{ id: "components", sections: [["registry", "Registry"], ["buttons", "Buttons"]] }];
const entry = (id, source, exportName = "default", extra = {}) => ({ id, name: id, source, exportName, kind: "ui", guide: "components/registry", purpose: "Fixture component", ...extra });

test("the real active registry has no guide-only or unused product implementations", async () => {
    const { auditComponentSystem } = await import(script.href);
    const { COMPONENT_REGISTRY, CONTROL_EXCEPTIONS } = await import("../src/data/component-registry.ts");
    const { DOCUMENTATION_TOOLS } = await import("../app/design-rules/_documentation/tools.ts");
    const { CHAPTERS } = await import("../src/data/design-system.ts");
    const { DESIGN_TOKEN_VALUES } = await import("../src/data/design-tokens.ts");
    const result = auditComponentSystem({ root: fileURLToPath(new URL("..", import.meta.url)),
        registry: COMPONENT_REGISTRY, documentationTools: DOCUMENTATION_TOOLS, exceptions: CONTROL_EXCEPTIONS,
        chapters: CHAPTERS, canonicalTokens: Object.keys(DESIGN_TOKEN_VALUES), enforceIdentity: true, requireProductUsage: true });
    assert.deepEqual(result.issues, []);
    assert.equal(result.counts.total, result.counts.product);
    assert.equal(result.counts.documentationOnly, 0);
    assert.equal(result.counts.unused, 0);
    assert.ok(COMPONENT_REGISTRY.every(record => !["demo"].includes(record.kind) && record.lifecycle !== "deprecated"));
});

// [활성 등록은 실제 제품에 연결 / Every active registration must reach the product]
test("strict product registry rejects guide-only and unused implementations", async () => {
    await fixture({
        "components/Kit.tsx": `export function GuideOnly() { return <p />; } export function Unused() { return <p />; }`,
        "app/design-rules/page.tsx": `import { GuideOnly } from "../../components/Kit"; export default function Guide() { return <GuideOnly />; }`,
        "app/page.tsx": `export default function Page() { return <main />; }`,
    }, [entry("guide", "components/Kit.tsx", "GuideOnly"), entry("unused", "components/Kit.tsx", "Unused")], result => {
        assert.equal(result.issues.filter(issue => issue.code === "missing-product-use").length, 2);
        assert.equal(result.counts.product, 0);
    }, { requireProductUsage: true });
});

test("explicit guide tools are audited separately and never inflate the product registry", async () => {
    await fixture({
        "components/Panel.tsx": `export default function Panel() { return <p />; }`,
        "app/design-rules/_documentation/Catalog.tsx": `import Panel from "../../../components/Panel"; export default function Catalog() { return <Panel />; }`,
        "app/design-rules/page.tsx": `import Catalog from "./_documentation/Catalog"; export default function Guide() { return <Catalog />; }`,
        "app/page.tsx": `import Panel from "../components/Panel"; export default function Page() { return <Panel />; }`,
    }, [entry("panel", "components/Panel.tsx")], result => {
        assert.deepEqual(result.issues, []);
        assert.deepEqual(result.counts, { total: 1, product: 1, documentationOnly: 0, unused: 0 });
        assert.deepEqual(Object.keys(result.usage), ["panel"]);
        assert.ok(result.usage.panel.guideUses.some(source => source.includes("_documentation/Catalog.tsx")));
    }, { requireProductUsage: true, documentationTools: [{ id: "catalog", source: "app/design-rules/_documentation/Catalog.tsx", exportName: "default" }] });
});

test("guide tool exemptions cannot hide product reachability, missing exports or unlisted helpers", async () => {
    await fixture({
        "app/design-rules/_documentation/Catalog.tsx": `export default function Catalog() { return <p />; } export function Unlisted() { return <p />; }`,
        "app/design-rules/page.tsx": `import Catalog from "./_documentation/Catalog"; export default function Guide() { return <Catalog />; }`,
        "app/page.tsx": `import Catalog from "./design-rules/_documentation/Catalog"; export default function Page() { return <Catalog />; }`,
    }, [], result => {
        const codes = result.issues.map(issue => issue.code);
        for (const expected of ["documentation-tool-product-use", "unregistered-component", "missing-documentation-export"])
            assert.ok(codes.includes(expected), expected);
    }, { requireProductUsage: true, documentationTools: [
        { id: "catalog", source: "app/design-rules/_documentation/Catalog.tsx", exportName: "default" },
        { id: "missing", source: "app/design-rules/_documentation/Catalog.tsx", exportName: "Missing" },
    ] });
});

// [제품의 조작 아이콘 우회 방지 / Prevent product glyphs from bypassing the shared icon]
test("native material glyphs use the registered Icon while authored SVG scenes remain valid", async () => {
    await fixture({
        "components/Icon.tsx": `export default function Icon() { return <svg data-component-id="icon" className="material-icon"><path d="M1 1" /></svg>; }`,
        "app/page.tsx": `import Icon from "../components/Icon";
            export default function Page() { return <main><svg className="material-icon"><path d="M1 1" /></svg><img src="/v5/assets/icons/rounded/lightbulb.svg" /><Icon /><svg className="room-scene"><path d="M2 2" /></svg></main>; }`,
    }, [entry("icon", "components/Icon.tsx")], result => {
        const issues = result.issues.filter(issue => issue.code === "raw-control-icon");
        assert.equal(issues.length, 2);
        assert.equal(issues[0].source, "app/page.tsx");
    });
});

async function fixture(files, registry, run, extra = {}) {
    assert.ok(existsSync(script), "the component governance analyzer must exist");
    const { auditComponentSystem } = await import(script.href);
    const root = mkdtempSync(join(tmpdir(), "sejong-component-system-"));
    try {
        for (const [source, content] of Object.entries(files)) {
            const target = join(root, source);
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, content, "utf8");
        }
        const result = auditComponentSystem({ root, registry, exceptions: [], chapters, canonicalTokens: ["--radius-control"], ...extra });
        await run(result, root);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

// [컴포넌트 단위의 실제 도달 경로 / Real reachability at component scope]
test("Next error and loading entry points reuse registered UI without being counted as shared components", async () => {
    await fixture({
        "components/Copy.tsx": "export default function Copy() { return <p>Readable content</p>; }",
        "app/not-found.tsx": "import Copy from '../components/Copy'; export default function NotFound() { return <Copy />; }",
        "app/loading.tsx": "import Copy from '../components/Copy'; export default function Loading() { return <Copy />; }",
    }, [entry("copy", "components/Copy.tsx")], result => {
        assert.deepEqual(result.issues, []);
        assert.equal(result.usage.copy.status, "product");
        assert.equal(result.counts.total, 1);
    });
});

test("usage follows named exports, local render helpers and notification hosts without marking unused siblings", async () => {
    const files = {
        "components/Kit.tsx": `import { forwardRef, memo } from "react";
            export const Button = forwardRef(function Button(props, ref) { return <button ref={ref} />; });
            export default Button;
            export const GuideOnly = memo(function GuideOnly() { return <span />; });
            export function Unused() { return <div />; }
            export const UPPERCASE_VALUES = [1, 2];
            export const Configuration = { value: true };
            export function helper() { return 1; }`,
        "components/Container.tsx": `import { Button, GuideOnly } from "./Kit";
            function LocalRender() { return <Button />; }
            export default function Container() { return <LocalRender />; }
            export function UnusedSibling() { return <GuideOnly />; }`,
        "components/Notification.tsx": `export default function Notification() { return <div role="status" />; }
            export function Host() { return <Notification />; }`,
        "components/Toast.tsx": `export { Host as default } from "./Notification";`,
        "components/Effects.tsx": `export default function Effects() { return null; }`,
        "app/page.tsx": `import Container from "../components/Container";
            import Toast from "../components/Toast";
            export default function Page() { return <><Container /><Toast /></>; }`,
        "app/design-rules/page.tsx": `import { GuideOnly } from "../../components/Kit";
            export default function Guide() { return <GuideOnly />; }`,
    };
    const registry = [entry("button", "components/Kit.tsx", "default", { nativeControls: ["button"] }), entry("guide", "components/Kit.tsx", "GuideOnly"),
        entry("unused", "components/Kit.tsx", "Unused"), entry("container", "components/Container.tsx"),
        entry("sibling", "components/Container.tsx", "UnusedSibling"), entry("notice", "components/Notification.tsx"),
        entry("host", "components/Notification.tsx", "Host"), entry("effects", "components/Effects.tsx")];
    await fixture(files, registry, (result) => {
        assert.deepEqual(result.issues, []);
        assert.equal(result.usage.button.status, "product");
        assert.deepEqual(result.usage.button.productUses, ["components/Container.tsx#LocalRender"]);
        assert.equal(result.usage.guide.status, "guide-only");
        assert.deepEqual(result.usage.guide.guideUses, ["app/design-rules/page.tsx#Guide"]);
        assert.equal(result.usage.sibling.status, "unused");
        assert.equal(result.usage.unused.status, "unused");
        assert.equal(result.usage.effects.status, "unused");
        assert.equal(result.usage.notice.status, "product");
        assert.deepEqual(result.usage.notice.productUses, ["components/Notification.tsx#Host"]);
        assert.deepEqual(result.counts, { total: 8, product: 4, documentationOnly: 1, unused: 3 });
    });
});

test("missing registrations, nonexistent exports, duplicate aliases and invalid guide paths fail governance", async () => {
    await fixture({
        "components/Kit.tsx": `export function Button() { return <button />; } export default Button;
            export function Forgotten() { return <div />; }`,
        "app/page.tsx": `export default function Page() { return <div />; }`,
    }, [entry("button", "components/Kit.tsx"), entry("alias", "components/Kit.tsx", "Button"),
        entry("missing", "components/Kit.tsx", "DoesNotExist"), entry("bad-guide", "components/Missing.tsx", "default", { guide: "components/unknown" })], (result) => {
        const codes = result.issues.map((issue) => issue.code);
        for (const expected of ["unregistered-component", "missing-export", "duplicate-component", "missing-source", "invalid-guide"]) {
            assert.ok(codes.includes(expected), expected);
        }
    });
});

test("raw page controls and raw CTA links cannot bypass the shared library while guide examples are allowed", async () => {
    await fixture({
        "app/page.tsx": `import Link from "next/link";
            export default function Page() { return <><button /><input /><select /><textarea /><Link href="/" className={\`button button--dark\`}>Go</Link></>; }`,
        "app/design-rules/page.tsx": `export default function Guide() { return <button>Example</button>; }`,
    }, [], (result) => {
        assert.equal(result.issues.filter((issue) => issue.code === "raw-control").length, 4);
        assert.equal(result.issues.filter((issue) => issue.code === "raw-cta-link").length, 1);
        assert.ok(result.issues.every((issue) => issue.source === "app/page.tsx"));
    });
});

test("specialized controls require an exact source, tag and marker and exceptions cannot dangle", async () => {
    const exceptions = [
        { source: "app/page.tsx", tag: "button", part: "seat", reason: "Spatial seat interaction", owner: "Page" },
        { source: "app/page.tsx", tag: "button", part: "removed", reason: "Old exception", owner: "Page" },
    ];
    await fixture({ "app/page.tsx": `export default function Page() { return <><button data-system-part="seat" /><button /><input data-system-part="seat" /></>; }` }, [], (result) => {
        assert.equal(result.issues.filter((issue) => issue.code === "raw-control").length, 2);
        assert.equal(result.issues.filter((issue) => issue.code === "dangling-exception").length, 1);
    }, { exceptions });
});

test("glass material overrides are limited to the definition and documented demo, including aliased imports", async () => {
    await fixture({
        "components/LiquidGlass.tsx": `export default function LiquidGlass(props) { return <div />; }`,
        "app/design-rules/_documentation/LiquidGlassDemo.tsx": `import Glass from "../../../components/LiquidGlass";
            export default function LiquidGlassDemo() { return <Glass opacity={0.9} refraction={80} />; }`,
        "app/page.tsx": `import Glass from "../components/LiquidGlass";
            export default function Page() { return <Glass thickness={36} />; }`,
        "app/design-rules/page.tsx": `import Demo from "./_documentation/LiquidGlassDemo"; export default function Guide() { return <Demo />; }`,
    }, [entry("glass", "components/LiquidGlass.tsx")], (result) => {
        assert.equal(result.issues.filter((issue) => issue.code === "glass-override").length, 1);
        assert.equal(result.issues.find((issue) => issue.code === "glass-override").source, "app/page.tsx");
    }, { documentationTools: [{ id: "glass-demo", source: "app/design-rules/_documentation/LiquidGlassDemo.tsx", exportName: "default" }] });
});

test("active global token redeclarations fail while scoped variants and the frozen compatibility baseline remain valid", async () => {
    await fixture({
        "app/layout.tsx": `import "../styles/compat/shared.css"; import "../styles/tokens.css"; import "../styles/active.css";
            export default function Layout({ children }) { return <main>{children}</main>; }`,
        "styles/compat/shared.css": `:root { --radius-control: 2px; }`,
        "styles/tokens.css": `:root { --radius-control: 8px; }`,
        "styles/active.css": `.variant { --radius-control: 12px; }
            @media (max-width: 600px) { :root { --radius-control: 4px; } }`,
        "styles/unused.css": `:root { --radius-control: 90px; }`,
    }, [], (result) => {
        const issues = result.issues.filter((issue) => issue.code === "duplicate-global-token");
        assert.equal(issues.length, 1);
        assert.equal(issues[0].source, "styles/active.css");
        assert.match(issues[0].message, /--radius-control/);
    });
});

test("usage generation is deterministic and check rejects stale metadata without rewriting it", async () => {
    await fixture({
        "components/Button.tsx": `export default function Button() { return <button />; }`,
        "app/page.tsx": `import Button from "../components/Button"; export default function Page() { return <Button />; }`,
    }, [entry("button", "components/Button.tsx", "default", { nativeControls: ["button"] })], async (result, root) => {
        const { renderComponentUsage, syncComponentUsage } = await import(script.href);
        const rendered = renderComponentUsage(result);
        assert.equal(rendered, renderComponentUsage(result));
        assert.match(rendered, /export const COMPONENT_USAGE/);
        assert.match(rendered, /export const COMPONENT_COUNTS/);
        assert.doesNotMatch(rendered, /Generated at|timestamp|20\d{2}-\d{2}-\d{2}/);
        const target = join(root, "usage.ts");
        assert.equal(syncComponentUsage(result, target, { check: true }), false);
        assert.equal(existsSync(target), false);
        writeFileSync(target, "stale\n", "utf8");
        assert.equal(syncComponentUsage(result, target, { check: true }), false);
        assert.equal(readFileSync(target, "utf8"), "stale\n");
        assert.equal(syncComponentUsage(result, target), true);
        assert.equal(readFileSync(target, "utf8"), rendered);
        writeFileSync(target, rendered.replace(/\n/g, "\r\n"), "utf8");
        assert.equal(syncComponentUsage(result, target, { check: true }), true);
    });
});

test("conditional CTA classes, optics spreads and themed global tokens cannot bypass governance", async () => {
    await fixture({
        "components/LiquidGlass.tsx": `export default function LiquidGlass(props) { return <div />; }`,
        "components/Unused.tsx": `import "../styles/inactive.css"; export default function Unused() { return <div />; }`,
        "app/layout.tsx": `import "../styles/active.css"; export default function Layout({ children }) { return <main>{children}</main>; }`,
        "app/page.tsx": `import Link from "next/link"; import * as Glass from "../components/LiquidGlass";
            const optics = { opacity: 0.5 };
            export default function Page() { return <><Link href="/" className={true ? "button" : "ordinary"}>Go</Link><Glass.default {...optics} /></>; }`,
        "styles/active.css": `:root[data-theme="dark"] { --radius-control: 4px; }`,
        "styles/inactive.css": `:root { --radius-control: 90px; }`,
    }, [entry("glass", "components/LiquidGlass.tsx"), entry("unused", "components/Unused.tsx")], (result) => {
        assert.equal(result.issues.filter((issue) => issue.code === "raw-cta-link").length, 1);
        assert.equal(result.issues.filter((issue) => issue.code === "glass-override").length, 1);
        const globals = result.issues.filter((issue) => issue.code === "duplicate-global-token");
        assert.deepEqual(globals.map((issue) => issue.source), ["styles/active.css"]);
    });
});

test("memo wrappers around local implementations and createElement components remain discoverable", async () => {
    await fixture({
        "components/Card.tsx": `import React, { memo } from "react";
            function Inner() { return <article />; }
            export const Card = memo(Inner); export default Card;
            export function SymbolOnly() { return React.createElement("span"); }`,
        "app/page.tsx": `import Card, { SymbolOnly } from "../components/Card";
            export default function Page() { return <><Card /><SymbolOnly /></>; }`,
    }, [entry("card", "components/Card.tsx"), entry("symbol-only", "components/Card.tsx", "SymbolOnly")], (result) => {
        assert.deepEqual(result.issues, []);
        assert.equal(result.usage.card.status, "product");
        assert.equal(result.usage["symbol-only"].status, "product");
    });
});

test("a Next route that directly reexports a client is a real product entry point", async () => {
    await fixture({
        "app/sample/ExampleClient.tsx": `export default function ExampleClient() { return <main />; }`,
        "app/sample/page.tsx": `export { default } from "./ExampleClient";`,
    }, [entry("client", "app/sample/ExampleClient.tsx", "default", { kind: "structure" })], (result) => {
        assert.deepEqual(result.issues, []);
        assert.equal(result.usage.client.status, "product");
        assert.deepEqual(result.usage.client.productUses, ["app/sample/page.tsx#default"]);
    });
});

test("product helpers cannot borrow a fundamental component's native ownership from a sibling export", async () => {
    await fixture({
        "components/Controls.tsx": `export function SystemButton() { return <button />; }
            function LocalInput() { return <input />; }
            export function ProductPanel() { return <><SystemButton /><LocalInput /><button data-system-part="special-dial" /></>; }
            export function GuidePanel() { return <textarea />; }`,
        "app/page.tsx": `import { ProductPanel } from "../components/Controls"; export default function Page() { return <ProductPanel />; }`,
        "app/design-rules/page.tsx": `import { GuidePanel } from "../../components/Controls"; export default function Guide() { return <GuidePanel />; }`,
    }, [entry("button", "components/Controls.tsx", "SystemButton", { nativeControls: ["button"] }),
        entry("product-panel", "components/Controls.tsx", "ProductPanel"), entry("guide-panel", "components/Controls.tsx", "GuidePanel", { kind: "demo" })], (result) => {
        const raw = result.issues.filter((issue) => issue.code === "raw-control");
        assert.equal(raw.length, 1);
        assert.match(raw[0].message, /input/);
        assert.equal(raw[0].source, "components/Controls.tsx");
        assert.ok(result.issues.every((issue) => issue.code === "raw-control"));
    }, { exceptions: [{ source: "components/Controls.tsx", tag: "button", part: "special-dial", reason: "Spatial dial", owner: "ProductPanel" }] });
});

test("shared product controls reject ad hoc geometry and colors while layout and guide specimens remain allowed", async () => {
    await fixture({
        "components/SystemPrimitives.tsx": `export function SystemButton() { return <button />; }`,
        "components/Consumer.tsx": `import { SystemButton as Action } from "./SystemPrimitives";
            function LocalActions() { const accidental = { height: 30, color: "red" }; return <Action style={accidental} />; }
            export default function Consumer() { return <><LocalActions /><Action style={{ marginTop: 10, width: 120 }} /></>; }`,
        "app/page.tsx": `import Consumer from "../components/Consumer"; export default function Page() { return <Consumer />; }`,
        "app/design-rules/page.tsx": `import { SystemButton } from "../../components/SystemPrimitives";
            export default function Guide() { return <SystemButton style={{ fontSize: 20, borderRadius: 12 }} />; }`,
    }, [entry("button", "components/SystemPrimitives.tsx", "SystemButton", { nativeControls: ["button"] }), entry("consumer", "components/Consumer.tsx")], (result) => {
        const overrides = result.issues.filter((issue) => issue.code === "control-style-override");
        assert.equal(overrides.length, 1);
        assert.equal(overrides[0].source, "components/Consumer.tsx");
        assert.match(overrides[0].message, /color.*height|height.*color/);
        assert.equal(result.issues.length, 1);
    });
});

// [반드시 살아 있는 계약과 상속 레이아웃 / Live contracts and inherited layouts]
test("guide reachability includes its ancestor layout and blocks documentation and deprecated components in products", async () => {
    await fixture({
        "components/Shell.tsx": "export default function Shell({children}) { return <main>{children}</main>; }",
        "components/Old.tsx": "export default function Old() { return <div />; }",
        "components/Demo.tsx": "export default function Demo() { return <div />; }",
        "app/layout.tsx": "import Shell from '../components/Shell'; export default function Layout({children}) { return <Shell>{children}</Shell>; }",
        "app/page.tsx": "import Old from '../components/Old'; import Demo from '../components/Demo'; export default function Page() { return <><Old /><Demo /></>; }",
        "app/design-rules/page.tsx": "export default function Guide() { return <p>Guide</p>; }",
    }, [entry("shell", "components/Shell.tsx", "default", {kind:"structure"}), entry("old", "components/Old.tsx", "default", {lifecycle:"deprecated"}), entry("demo", "components/Demo.tsx", "default", {kind:"demo"})], result => {
        assert.ok(result.usage.shell.guideUses.length, "shared ancestor layout belongs to the guide graph");
        assert.ok(result.issues.some(issue => issue.code === "deprecated-product-use"));
        assert.ok(result.issues.some(issue => issue.code === "demo-product-use"));
    });
});

// [생략되거나 잘못 복사한 계약 예시 / Missing or incorrectly copied contract examples]
test("axis and state specimens cover official values and product copy rejects glass experiments", async () => {
    const { auditCopiedComponentCode } = await import(script.href);
    const registry = [entry("glass", "components/LiquidGlass.tsx", "default", {axes:{variant:["surface", "hero"]}})];
    assert.ok(auditCopiedComponentCode('<LiquidGlass variant="unknown" />', registry).some(issue => issue.code === "copied-axis-value"));
    assert.ok(auditCopiedComponentCode('<LiquidGlass opacity={0.5} />', registry).some(issue => issue.code === "copied-glass-override"));
    assert.deepEqual(auditCopiedComponentCode('// DOCUMENTATION_ONLY\n<LiquidGlass opacity={0.5} />', registry), []);
    await fixture({"components/Kit.tsx":"export default function Kit() { return <div />; }"},
        [entry("kit","components/Kit.tsx","default",{axes:{variant:["one","two"]},states:["disabled"],examples:[{id:"example-kit-variant-one",axis:"variant",value:"one"}]})], result => {
        assert.ok(result.issues.some(issue => issue.code === "missing-axis-example"));
        assert.ok(result.issues.some(issue => issue.code === "missing-state-example"));
    });
});

test("polymorphic forwardRef casts keep canonical identity and source providers retain their layout owner", async () => {
    await fixture({
        "components/Copy.tsx": 'import {forwardRef} from "react"; export const Copy = forwardRef(function Copy(props, ref) { return <p ref={ref} data-component-id="copy" />; }) as (props: any) => any;',
        "src/Provider.tsx": 'export function Provider({children}) { return <>{children}</>; }',
        "app/layout.tsx": 'import {Copy} from "../components/Copy"; import {Provider} from "../src/Provider"; export default function Layout({children}) { return <Provider><Copy />{children}</Provider>; }',
        "app/design-rules/page.tsx": 'export default function Guide() { return <p />; }',
    }, [entry("copy","components/Copy.tsx","Copy"), entry("provider","src/Provider.tsx","Provider",{kind:"structure",layoutOwner:"app/layout.tsx"})], result => {
        assert.deepEqual(result.issues, []);
        assert.ok(result.usage.provider.guideUses.length);
    }, {enforceIdentity:true});
    await fixture({"components/Copy.tsx":"export default function Copy() { return <p />; }"}, [entry("copy","components/Copy.tsx")], result => {
        assert.ok(result.issues.some(issue => issue.code === "missing-component-id"));
    }, {enforceIdentity:true});
});
