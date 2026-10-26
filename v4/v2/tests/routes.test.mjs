import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { PAGES as ORIGINAL_PAGES, PROGRAMS as ORIGINAL_PROGRAMS } from "../../js/data.js";
import { PAGES, PROGRAMS, VENUES } from "../src/data/catalog.js";
import { renderHome } from "../src/features/home.js";
import { renderPrograms } from "../src/features/programs.js";
import { renderPages } from "../src/features/pages.js";
import { renderFlows } from "../src/features/flows.js";
import { renderUtilities } from "../src/features/utilities.js";
import { readStore, writeStore } from "../src/lib/core.js";

test("the renewal preserves every published page and program", () => {
    assert.deepEqual(PAGES.map((page) => page.path), ORIGINAL_PAGES.map((page) => page.path));
    assert.deepEqual(PROGRAMS.map((program) => program.id), ORIGINAL_PROGRAMS.map((program) => program.id));
    for (const page of PAGES) {
        const html = page.path === "/" ? renderHome() : [renderFlows, renderPrograms, renderPages, renderUtilities]
            .map((render) => render(page.path, new URLSearchParams()))
            .find((result) => result != null);
        assert.ok(html?.length > 150, `${page.path} must render content`);
        assert.ok(!html.includes("undefined"), `${page.path} must not expose undefined values`);
    }
});

test("shared images resolve from the new version directory", async () => {
    const document = new URL("../index.html", import.meta.url);
    for (const item of [...PROGRAMS, ...VENUES]) {
        await access(new URL(item.image, document));
    }
});

test("version entry points and their local resources exist", async () => {
    for (const path of ["../../index.html", "../../legacy.html", "../index.html"]) {
        const document = new URL(path, import.meta.url);
        const html = await readFile(document, "utf8");
        for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
            if (!/^(https?:|mailto:|tel:)/.test(match[1])) await access(new URL(match[1], document));
        }
    }
});

test("calendar rendering handles leap years and four to six week months", () => {
    for (const [month, days] of [["2026-02", 28], ["2028-02", 29], ["2026-08", 31]]) {
        const html = renderPrograms("/programs", new URLSearchParams({ view: "calendar", month }));
        const dates = [...html.matchAll(/data-calendar-date="([^"]+)"/g)].map((match) => match[1]);
        assert.equal(dates.length, days, month);
        assert.equal(dates[0], `${month}-01`);
        assert.equal(dates.at(-1), `${month}-${days}`);
        assert.equal(new Set(dates).size, days);
    }
});

test("renewal storage does not overwrite legacy visitor data", () => {
    const values = new Map([["sejong:version-check", JSON.stringify("legacy")]]);
    const originalStorage = globalThis.localStorage;
    globalThis.localStorage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value)
    };
    try {
        assert.equal(readStore("version-check", "empty"), "empty");
        writeStore("version-check", "renewal");
        assert.equal(values.get("sejong:version-check"), JSON.stringify("legacy"));
        assert.equal(values.get("sejong-v2:version-check"), JSON.stringify("renewal"));
    } finally {
        if (originalStorage === undefined) delete globalThis.localStorage;
        else globalThis.localStorage = originalStorage;
    }
});
