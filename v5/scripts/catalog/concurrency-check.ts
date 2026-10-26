// 100 independent HTTP transactions against an explicitly configured disposable fixture.
// Required: RESERVATION_TEST_URL, RESERVATION_TEST_PUBLIC_KEY, RESERVATION_TEST_TOKEN_A/B,
// RESERVATION_TEST_SESSION (must start test-), RESERVATION_TEST_SEAT (must start test-).
// Tokens remain in process memory and are never printed. No auth users are created here.
import assert from "node:assert/strict";
const env=process.env;
const url=env.RESERVATION_TEST_URL||"", key=env.RESERVATION_TEST_PUBLIC_KEY||"";
const tokens=[env.RESERVATION_TEST_TOKEN_A,env.RESERVATION_TEST_TOKEN_B];
const session=env.RESERVATION_TEST_SESSION||"",seat=env.RESERVATION_TEST_SEAT||"";
assert.ok(url&&key&&tokens.every(Boolean)&&session.startsWith("test-")&&seat.startsWith("test-"),"Explicit isolated test fixture and two user tokens are required.");
async function rpc(name:string,body:unknown,token:string) {
 const response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
 assert.ok(response.ok,`RPC ${name} returned HTTP ${response.status}`);return response.json();
}
const started=Date.now();
const results=await Promise.all(Array.from({length:100},async(_,index)=>({index,result:await rpc("hold_seats",{p_session_id:session,p_seat_ids:[seat],p_request_key:crypto.randomUUID()},tokens[index%2]!)})));
const winners=results.filter(({result})=>result.kind==="reservation");
assert.equal(winners.length,1,"Exactly one of 100 overlapping holds must win.");
assert.ok(results.filter(({result})=>result.kind==="error").every(({result})=>result.code==="SEATS_UNAVAILABLE"));
const winner=winners[0],id=winner.result.reservation.id,token=tokens[winner.index%2]!;
try {
 const confirmKey=crypto.randomUUID();
 const confirms=await Promise.all(Array.from({length:100},()=>rpc("confirm_reservation",{p_reservation_id:id,p_request_key:confirmKey},token)));
 assert.ok(confirms.every(result=>result.kind==="reservation"&&result.reservation.status==="reserved_unpaid"));
 assert.equal(new Set(confirms.map(result=>result.reservation.expiresAt)).size,1,"Concurrent retries cannot extend expiry.");
 const intrusion=await rpc("cancel_reservation",{p_reservation_id:id},tokens[(winner.index+1)%2]!);
 assert.equal(intrusion.code,"RESERVATION_NOT_FOUND","Other owner cannot cancel.");
 console.log(JSON.stringify({holdRequests:100,winners:winners.length,confirmRequests:100,distinctConfirmExpiry:1,ownerIsolation:true,elapsedMs:Date.now()-started}));
} finally {await rpc("cancel_reservation",{p_reservation_id:id},token);}
