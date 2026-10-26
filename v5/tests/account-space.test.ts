import assert from "node:assert/strict";
import test from "node:test";
import { parseAccountSpace, parseAccountNotes, accountStorageKey, validateAccountNote, accountBookingSummary } from "../src/lib/account-space.ts";

test("personal spaces recover damaged storage and isolate each identity", () => {
    assert.equal(parseAccountSpace("broken").theme, "paper");
    assert.equal(parseAccountSpace('{"theme":"sky","nickname":"  이호  ","lightOn":false}').nickname, "이호");
    assert.equal(parseAccountSpace('{"theme":"unregistered","message":22}').theme, "paper");
    assert.notEqual(accountStorageKey("oauth/a"), accountStorageKey("oauth/b"));
    assert.notEqual(accountStorageKey("guest"), accountStorageKey("demo"));
});
test("notes retain real text and reject malformed dates, future dates and empty content", () => {
    const programs = new Set(["dance"]);
    assert.equal(validateAccountNote({programId:"dance",date:"2026-02-30",body:"감상"}, programs, "2026-10-21"), null);
    assert.equal(validateAccountNote({programId:"dance",date:"2026-10-22",body:"감상"}, programs, "2026-10-21"), null);
    assert.equal(validateAccountNote({programId:"missing",date:"2026-10-20",body:"감상"}, programs, "2026-10-21"), null);
    assert.equal(validateAccountNote({programId:"dance",date:"2026-10-20",body:"  "}, programs, "2026-10-21"), null);
    assert.equal(validateAccountNote({programId:"dance",date:"2026-10-20",body:" <script>한 줄</script> "}, programs, "2026-10-21")?.body, "<script>한 줄</script>");
    assert.deepEqual(parseAccountNotes('{"not":"an array"}'), []);
    assert.equal(parseAccountNotes('[{"id":"note-1","programId":"dance","date":"2026-10-20","body":"여운"},null]').length, 1);
});
test("the next ticket and counts ignore cancellations and sort by actual performance time", () => {
    const bookings = [
        {id:"later",date:"2026-11-20",time:"19:30",status:"reserved_unpaid"},
        {id:"cancelled",date:"2026-10-22",time:"14:00",status:"cancelled"},
        {id:"earlier",date:"2026-10-23",time:"14:00",status:"held"},
        {id:"past",date:"2026-10-20",time:"19:00",status:"reserved_unpaid"},
        {id:"expired",date:"2026-11-20",time:"19:30",status:"expired"},
        {id:"released",date:"2026-11-20",time:"19:30",status:"released"},
    ];
    const result = accountBookingSummary(bookings, "2026-10-21");
    assert.equal(result.next?.id, "earlier");
    assert.equal(result.upcoming, 2);
    assert.equal(result.cancelled, 1);
    assert.equal(result.visited, 1);
});
