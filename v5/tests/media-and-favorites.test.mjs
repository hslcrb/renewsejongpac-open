import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { parseFavorites, serverFavorites } from "../src/lib/favorites.ts";
import { mediaPath } from "../src/lib/media.ts";
import { OFFICIAL_MEDIA } from "../src/data/official-media.ts";
import { PROGRAMS, VENUES } from "../src/data/catalog.ts";

// [저장 복구·실제 원본·경로 검증 / Storage recovery, original media and canonical paths]
test("favorites recover malformed values and deduplicate valid ids", () => {
    for (const value of [null, "{", "{}", "null", "42"]) assert.deepEqual(parseFavorites(value), []);
    assert.deepEqual(parseFavorites('["dance"," dance ",null,42,"", "carmen"]'), ["dance", "carmen"]);
    assert.equal(serverFavorites(), serverFavorites());
});
test("media paths remain inside v5 without duplicating the images directory", () => {
    const path = "assets/images/official/ilmu-poster.jpg";
    for (const value of [path, "/" + path, "v5/" + path, "/v5/" + path])
        assert.equal(mediaPath(value), "/v5/" + path);
    assert.equal(mediaPath(), "/v5/assets/images/sejong-grand-interior.png");
});
test("every vendored media file matches its recorded official original", () => {
    for (const media of Object.values(OFFICIAL_MEDIA)) {
        assert.ok(new URL(media.source).hostname.endsWith(".sejongpac.or.kr"));
        const bytes = fs.readFileSync(new URL("../public/assets/images/official/" + media.file, import.meta.url));
        assert.equal(createHash("sha256").update(bytes).digest("hex"), media.sha256);
        assert.ok(media.alt && media.sourcePage);
    }
});
test("every program and venue uses an available official image", () => {
    for (const item of [...PROGRAMS, ...VENUES]) {
        assert.doesNotMatch(item.image, /concept|poster-.*\.svg|venue-.*\.svg/);
        assert.ok(fs.existsSync(new URL("../public/" + item.image, import.meta.url)), item.image);
    }
});
