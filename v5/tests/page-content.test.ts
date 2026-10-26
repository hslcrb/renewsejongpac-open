import test from "node:test";
import assert from "node:assert/strict";
import { PAGE_CONTENT, pageContentFor } from "../src/catalog/page-content.ts";

// [등록 경로에 실제 정보 연결 / Registered routes carry useful information]
test("information pages have unique paths, useful blocks and a verified handoff", () => {
    assert.ok(PAGE_CONTENT.length >= 97);
    assert.equal(new Set(PAGE_CONTENT.map(page => page.path)).size, PAGE_CONTENT.length);
    for (const page of PAGE_CONTENT) {
        assert.ok(page.description.length >= 15, page.path);
        assert.ok(page.blocks.length >= 2, page.path);
        assert.ok(page.blocks.some(block => block.type === "actions"), page.path);
        assert.doesNotMatch(JSON.stringify(page), /서비스 및 공간 안내|페이지별로 정리한 안내|href":"#"/);
        assert.match(page.sourceUrl || "", /^https:\/\/(?:www\.)?(?:sejongpac\.or\.kr|sejongstory\.or\.kr)/);
    }
});

test("directions contain actual transport and parking destinations", () => {
    const page = pageContentFor("/visit/directions")!;
    const source = JSON.stringify(page);
    assert.match(source, /광화문역/);
    assert.match(source, /경복궁역/);
    assert.match(source, /200352/);
    assert.match(source, /200390/);
});

test("lost property and application routes never invent availability or submission", () => {
    assert.match(JSON.stringify(pageContentFor("/visit/support/lost/umbrella")), /습득 여부/);
    assert.match(JSON.stringify(pageContentFor("/rental/apply")), /접수/);
    assert.doesNotMatch(JSON.stringify(PAGE_CONTENT), /접수되었습니다|신청이 완료|예약이 확정|가상의 습득물/);
});

test("policy and English pages link their exact service rather than a program fallback", () => {
    assert.match(JSON.stringify(pageContentFor("/policy/privacy")), /개인정보/);
    assert.match(JSON.stringify(pageContentFor("/english")), /Visitor|Sejong/);
    assert.equal(pageContentFor("/not-a-real-page"), undefined);
});
