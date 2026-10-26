import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Deep Chat is attached to every active search entry", () => {
    const header = read("../components/Header.tsx");
    const page = read("../components/CatalogPage.tsx");
    const entry = read("../../index.html");
    const script = read("../../assets/entry.js");
    assert.match(header, /<DeepSearch compact \/>/);
    assert.match(page, /<DeepSearch initialQuery=\{query\} \/>/);
    assert.match(entry, /id="design-conversational-search"/);
    assert.match(script, /chat\.connect\s*=/);
    assert.doesNotMatch(header, /handleSearchSubmit/);
});
test("search stays local and offers a GET fallback without API keys", () => {
    const search = read("../components/DeepSearch.tsx");
    assert.match(search, /searchContent\(term\)/);
    assert.match(search, /connect\s*=\s*\{/);
    assert.match(search, /method="get"/);
    assert.match(search, /onError=\{\(\) => setFailed\(true\)\}/);
    assert.doesNotMatch(search, /GROQ_API_KEY|MISTRAL_API_KEY|directConnection/);
});
test("entry JavaScript is parseable", () => {
    assert.doesNotThrow(() => new Script(read("../../assets/entry.js"), { filename: "assets/entry.js" }));
});
test("AI widget and layout have no literal escaped newline tokens", () => {
    for (const file of ["../app/layout.tsx", "../components/SiteShell.tsx", "../components/AiChatWidget.tsx"]) {
        assert.ok(!read(file).includes(String.raw`\n`), file);
    }
    assert.doesNotMatch(read("../app/layout.tsx"), /ChatAssistant/);
});


test("every current v5 search surface exposes Deep Chat search", () => {
    for (const file of [
        "../app/programs/page.tsx",
        "../components/ServiceGoods.tsx",
        "../components/CompletedPage.tsx",
        "../app/design-rules/page.tsx",
        "../app/design-rules/_documentation/ComponentCatalog.tsx",
    ]) {
        assert.match(read(file), /DeepSearchDisclosure/, file);
    }
    assert.match(read("../components/DeepSearch.tsx"), /contextSearchReply/);
});
test("contextual Deep Chat stays opt-in and retains original filters", () => {
    const disclosure = read("../components/DeepSearchDisclosure.tsx");
    assert.match(disclosure, /<details/);
    assert.match(disclosure, /open && <DeepSearch compact/);
    assert.match(read("../components/CompletedPage.tsx"), /<SystemField type="search"/);
    assert.match(read("../components/ServiceGoods.tsx"), /<SystemField type="search"/);
});
