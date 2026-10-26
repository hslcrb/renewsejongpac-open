import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createCatalogRepository,assertCatalogSnapshot} from "../src/catalog/repository.ts";
import {loadPublishedCatalog} from "../src/catalog/snapshot.ts";
import {validateBookingPrefill,sessionLocalParts} from "../src/lib/reservations.ts";
import type {ProgramSession} from "../src/catalog/types.ts";

test("published snapshot preserves all stable imported records without selling unverified inventory",()=>{
 const data=loadPublishedCatalog();assertCatalogSnapshot(data);
 assert.deepEqual([data.programs.length,data.venues.length,data.companies.length,data.notices.length,data.homeFeatures.length,data.ticketOpenings.length,data.media.length],[15,5,7,6,3,2,16]);
 assert.ok(data.programs.filter(p=>p.sourceState==="unverified").every(p=>p.price===null&&!p.times?.length));
 assert.ok(data.sessions.every(s=>!s.bookingEnabled||s.sourceState==="verified"));
 assert.equal(data.programs.find(p=>p.id==="carmen")?.image,"");
});
test("repository fails closed on network/schema failures",async()=>{
 await assert.rejects(createCatalogRepository("https://example.invalid","public",async()=>new Response("",{status:503})).loadPublishedCatalog());
 await assert.rejects(createCatalogRepository("https://example.invalid","public",async()=>Response.json({programs:[]})).loadPublishedCatalog());
 const data=loadPublishedCatalog();assert.deepEqual(await createCatalogRepository("https://example.invalid","public",async()=>Response.json(data)).loadPublishedCatalog(),data);
});
test("home prefills use Seoul session dates and reject invalid count/time instead of substituting",()=>{
 const session:ProgramSession={id:"session",programId:"dance",venueId:"grand",startsAt:"2030-01-03T10:30:00Z",bookingEnabled:true,sourceState:"verified"};
 assert.deepEqual(sessionLocalParts(session),{date:"2030-01-03",time:"19:30"});
 assert.deepEqual(validateBookingPrefill(new URLSearchParams("date=2030-01-03&time=19%3A30&participants=3"),[session]),{sessionId:"session",participants:3,error:""});
 for(const params of ["date=2030-01-03&time=14%3A00&participants=3","date=2030-01-03&time=19%3A30&participants=5","date=2030-01-03&time=19%3A30&participants=0"])
  assert.ok(validateBookingPrefill(new URLSearchParams(params),[session]).error);
});
test("booking client cannot supply ownership, titles, or prices to writes",async()=>{
 const source=await readFile(new URL("../src/lib/reservations.ts",import.meta.url),"utf8");
 assert.ok(!source.includes("p_user_id"));assert.ok(!source.includes("p_price"));assert.ok(!source.includes("p_title"));
 const adapter=await readFile(new URL("../src/lib/account-db.ts",import.meta.url),"utf8");
 assert.ok(!/MEMBER_TABLES\.bookings\)\.(?:insert|upsert|update|delete)/.test(adapter));
});
