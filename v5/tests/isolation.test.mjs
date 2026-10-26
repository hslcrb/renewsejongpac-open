import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readStore, writeStore } from "../src/lib/core.ts";

test("v4 keeps favorites separate from v3 data", () => {
    const store = new Map([["sejong-v3:version-isolation", JSON.stringify(["carmen"])]]);
    globalThis.localStorage = {
        getItem: key => store.get(key) || null,
        setItem: (key, value) => store.set(key, value),
    };
    assert.deepEqual(readStore("version-isolation", []), []);
    writeStore("version-isolation", ["dance"]);
    assert.deepEqual(JSON.parse(store.get("sejong-v4:version-isolation")), ["dance"]);
    assert.deepEqual(JSON.parse(store.get("sejong-v3:version-isolation")), ["carmen"]);
    delete globalThis.localStorage;
});

test("root selection exposes v4 and the live build loads its visual system", async () => {
    const selector = await readFile(new URL("../../index.html", import.meta.url), "utf8");
    const entry = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(selector, /href="v4\/index.html"/);
    assert.match(entry, /_next\/static/);
    assert.match(entry, /v5/);
});
