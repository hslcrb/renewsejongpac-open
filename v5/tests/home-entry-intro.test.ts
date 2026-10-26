import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
    HOME_ENTRY_COPY,
    HOME_ENTRY_TIMING,
    homeEntryTimeline,
    isV5HomeEntry,
} from "../src/lib/home-entry-intro.ts";

test("v5 홈 첫 진입만 인트로 대상으로 삼는다", () => {
    assert.equal(isV5HomeEntry("/"), true);
    assert.equal(isV5HomeEntry("/v5/"), true);
    assert.equal(isV5HomeEntry("/v5"), true);
    assert.equal(isV5HomeEntry("/about"), false);
    assert.equal(isV5HomeEntry("/v5/programs/"), false);
    assert.equal(isV5HomeEntry(null), false);
});

test("포트폴리오에 준하는 일정한 러닝타임과 실패 해제 상한", () => {
    const { typedAt, exitAt, finishAt } = homeEntryTimeline();
    assert.equal(typedAt, HOME_ENTRY_TIMING.copyStart + HOME_ENTRY_COPY.length * HOME_ENTRY_TIMING.typeCharacter);
    assert.equal(exitAt, typedAt + HOME_ENTRY_TIMING.copyHold);
    assert.equal(finishAt, exitAt + HOME_ENTRY_TIMING.exit);
    assert.ok(finishAt >= 6_500 && finishAt <= 8_000);
    assert.ok(finishAt < HOME_ENTRY_TIMING.watchdog);
    assert.ok(HOME_ENTRY_TIMING.artwork < HOME_ENTRY_TIMING.copyStart);
});

test("업로드 SVG 원본의 내용과 해시가 보존된다", () => {
    const svg = readFileSync(new URL("../public/assets/intro/scenartmv.svg", import.meta.url));
    const hash = createHash("sha256").update(svg).digest("hex");
    assert.equal(hash, "83d6625294ea8568139e04f590c6b09b3428c870ebaad669128a549223cdd99f");
    const text = svg.toString("utf8");
    assert.match(text, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(text, /<animate/);
    assert.doesNotMatch(text, /<script\b|<foreignObject\b|\bonload\s*=|javascript:/i);
});

test("인트로는 홈 셸을 가리지 않고 같은 렌더 트리에 추가한다", () => {
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    assert.match(layout, /<CatalogProvider><HomeEntryIntro\s*\/><SiteShell>/);
    assert.match(layout, /rel="preconnect"/);
    const css = readFileSync(new URL("../components/HomeEntryIntro.module.css", import.meta.url), "utf8");
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /v5EntryFailOpen/);
});
