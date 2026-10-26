import test from "node:test";
import assert from "node:assert/strict";
import { TICKET_OPENINGS } from "../src/data/ticket-openings.ts";
import { upcomingTicketOpenings, openingDayLabel, seoulClock } from "../src/lib/ticket-openings.ts";

test("next ticket opening is chronological and advances exactly at the announced Seoul time", () => {
    const entries = [...TICKET_OPENINGS].reverse();
    assert.deepEqual(upcomingTicketOpenings(entries, Date.parse("2026-10-28T11:59:59+09:00")).map(item => item.id), ["monster-farm", "health"]);
    assert.deepEqual(upcomingTicketOpenings(entries, Date.parse("2026-10-28T12:00:00+09:00")).map(item => item.id), ["health"]);
    assert.deepEqual(upcomingTicketOpenings(entries, Date.parse("2026-10-28T14:00:00+09:00")), []);
    assert.deepEqual(upcomingTicketOpenings(entries, Number.NaN), []);
});

test("opening day labels use Seoul calendar days rather than rounded remaining hours", () => {
    const opensAt = "2026-10-28T12:00:00+09:00";
    assert.equal(openingDayLabel(opensAt, Date.parse("2026-10-21T23:59:59+09:00")), "D-7");
    assert.equal(openingDayLabel(opensAt, Date.parse("2026-10-28T00:01:00+09:00")), "오늘 오픈");
    assert.equal(openingDayLabel(opensAt, Date.parse(opensAt)), "예매 오픈");
    assert.equal(seoulClock(Date.parse("2026-10-20T15:05:09Z")), "00:05:09");
});

test("ticket opening records identify their official announcement and unambiguous timezone", () => {
    for (const item of TICKET_OPENINGS) {
        assert.match(item.href, /^https:\/\/www\.sejongpac\.or\.kr\/portal\/bbs\/B0000049\/view\.do\?/);
        assert.match(item.opensAt, /(?:Z|[+-]\d{2}:\d{2})$/);
        assert.ok(Number.isFinite(Date.parse(item.opensAt)));
    }
});
