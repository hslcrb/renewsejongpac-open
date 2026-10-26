import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("Swiper and AOS store their JS, CSS and MIT licenses", () => {
    assert.match(read("../../plugins/swiper/swiper-bundle.min.js"), /Swiper 12\.2\.0/);
    assert.match(read("../../plugins/swiper/swiper-bundle.min.css"), /Swiper 12\.2\.0/);
    assert.ok(read("../../plugins/aos/aos.js").length > 12000);
    assert.ok(read("../../plugins/aos/aos.css").length > 20000);
    assert.match(read("../../plugins/swiper/LICENSE"), /MIT License/);
    assert.match(read("../../plugins/aos/LICENSE"), /MIT License/);
});
test("vendored plugins remain disconnected from active entrypoints", () => {
    for (const path of ["../app/layout.tsx", "../../index.html", "../../assets/entry.js"]) {
        assert.doesNotMatch(read(path), /plugins\/(swiper|aos)\//);
    }
});
