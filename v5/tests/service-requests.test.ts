import test from "node:test";
import assert from "node:assert/strict";

// [신청 데이터의 경계 / Request-data boundaries]
test("service forms validate consent, field ownership and rental dates", async () => {
    const { defineServiceForm, validateServiceValues } = await import("../src/page-completion/requests.ts");
    const form = defineServiceForm({ path: "/rental/apply", title: "대관신청", summary: "", sections: [], sources: [], form: { kind: "rental", title: "대관 신청" } });
    assert.ok(form);
    const valid = { name: "김관람", email: "visitor@example.com", phone: "010-1234-5678", organization: "관람 단체", venue: "grand", date: "2027-04-01", endDate: "2027-04-02", attendees: "200", subject: "봄 정기공연", message: "행사 내용과 필요한 무대 조건을 문의합니다.", consent: true };
    assert.deepEqual(validateServiceValues(form, valid), {});
    assert.deepEqual(validateServiceValues(form, { ...valid, venue: "m-theater" }), {});
    assert.deepEqual(validateServiceValues(form, { ...valid, venue: "s-theater" }), {});
    assert.ok(validateServiceValues(form, { ...valid, consent: false }).consent);
    assert.ok(validateServiceValues(form, { ...valid, admin: true })._form);
    assert.ok(validateServiceValues(form, { ...valid, email: "wrong" }).email);
    assert.ok(validateServiceValues(form, { ...valid, date: "2027-02-30" }).date);
    assert.ok(validateServiceValues(form, { ...valid, endDate: "2027-03-01" }).endDate);
    assert.ok(validateServiceValues(form, { ...valid, attendees: "-1" }).attendees);
});

test("closed request definitions stay closed and purchase requests never accept client prices", async () => {
    const { defineServiceForm, validateServiceValues } = await import("../src/page-completion/requests.ts");
    const closed = defineServiceForm({ path: "/news/events/review/apply", title: "후기", summary: "", sections: [], sources: [], form: { kind: "event", title: "참여", closed: true, closedReason: "모집이 종료되었습니다." } });
    assert.equal(closed?.enabled, false);
    const order = defineServiceForm({ path: "/news/goods/cart", title: "장바구니", summary: "", sections: [], sources: [], form: { kind: "order", title: "구매 요청" } });
    assert.ok(order);
    assert.ok(validateServiceValues(order, { price: 1, total: 1, consent: true })._form);
});
