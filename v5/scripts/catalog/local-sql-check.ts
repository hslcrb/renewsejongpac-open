import {execFile,spawn} from "node:child_process";
import {promisify} from "node:util";
import {mkdir,readFile,writeFile,access} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
const exec=promisify(execFile);
const root=fileURLToPath(new URL("../../",import.meta.url));
const base=path.join(root,".lemonade/postgres"),bin=path.join(base,"portable/pgsql/bin"),data=path.join(base,"data");
const port="55439",database=`sejong_check_${Date.now()}`;
const command=(name:string,args:string[])=>exec(path.join(bin,`${name}.exe`),args,{windowsHide:true,maxBuffer:1024*1024*10});
await mkdir(base,{recursive:true});
try{await access(path.join(data,"PG_VERSION"));}catch{await command("initdb",["-D",data,"-U","postgres","--auth=trust","--encoding=UTF8","--locale=C"]);}
let started=false;
try{await command("pg_ctl",["-D",data,"status"]);}catch{
 await new Promise<void>((resolve,reject)=>{const child=spawn(path.join(bin,"pg_ctl.exe"),["-D",data,"-l",path.join(base,"server.log"),"-o",`-h 127.0.0.1 -p ${port} -c max_connections=220`,"-w","start"],{windowsHide:true,stdio:"ignore"});child.on("error",reject);child.on("exit",code=>code===0?resolve():reject(new Error(`pg_ctl start exited ${code}`)));});started=true;
}
const args=["-X","-qAt","-v","ON_ERROR_STOP=1","-h","127.0.0.1","-p",port,"-U","postgres"];
const sql=async(query:string,db=database)=>(await command("psql",[...args,"-d",db,"-c",query])).stdout.trim();
const file=async(relative:string)=>(await command("psql",[...args,"-d",database,"-f",path.join(root,relative)])).stdout;
try{
 await sql(`create database ${database}` ,"postgres");
 await sql("do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;");
 await file("supabase/migrations/20261021075737_v5_member_data.sql");
 await file("supabase/migrations/20261023013321_catalog_reservations.sql");
 await file("supabase/migrations/20261023015030_catalog_reservation_indexes.sql");
 await file("supabase/catalog-seed.sql");
 const checksum=await sql("select md5(string_agg(entity_table||entity_id||revision||raw_source::text,'' order by entity_table,entity_id,revision)) from sejong_private.content_revisions");
 await file("supabase/catalog-seed.sql");
 assert.equal(await sql("select md5(string_agg(entity_table||entity_id||revision||raw_source::text,'' order by entity_table,entity_id,revision)) from sejong_private.content_revisions"),checksum,"Repeated import must preserve revisions and checksum");
 const count=JSON.parse(await sql("set role anon;select public.sejong_catalog_snapshot();"));
 assert.equal(count.programs.length,15);assert.equal(count.pages.length,98);
 await file("supabase/tests/reservations.sql");
 await file("supabase/tests/reservations-live-rollback.sql");
 console.log("SQL migration, published catalog, privileges, ownership, idempotency, expiry, and all-or-nothing tests passed.");
 const test=await readFile(path.join(root,"supabase/tests/reservations.sql"),"utf8");
 await writeFile(path.join(base,"concurrency-fixture.sql"),test.split("select pg_temp.assert_true(")[0]+"commit;","utf8");
 await file(".lemonade/postgres/concurrency-fixture.sql");
 const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
 const call=async(user:string,query:string)=>{
  const output=await sql(`begin;set local role authenticated;select set_config('request.jwt.claim.sub','${user}',true);select ${query};commit;`);
  return JSON.parse(output.split("\n").find(line=>line.startsWith("{"))!);
 };
 const results=await Promise.all(Array.from({length:100},async(_,index)=>({index,result:await call(index%2?a:b,`public.hold_seats('test-reservation-session',array['test-seat-1'],'${crypto.randomUUID()}')`)})));
 const winners=results.filter(({result})=>result.kind==="reservation");
 assert.equal(winners.length,1,"100 independent database connections must produce exactly one winner");
 assert.ok(results.filter(({result})=>result.kind==="error").every(({result})=>result.code==="SEATS_UNAVAILABLE"));
 const winner=winners[0],user=winner.index%2?a:b,id=winner.result.reservation.id,key=crypto.randomUUID();
 const confirmations=await Promise.all(Array.from({length:100},()=>call(user,`public.confirm_reservation('${id}','${key}')`)));
 assert.ok(confirmations.every(result=>result.reservation.status==="reserved_unpaid"));
 assert.equal(new Set(confirmations.map(result=>result.reservation.expiresAt)).size,1);
 assert.equal((await call(user===a?b:a,`public.cancel_reservation('${id}')`)).code,"RESERVATION_NOT_FOUND");
 await call(user,`public.cancel_reservation('${id}')`);
 assert.equal(await sql("select count(*) from public.sejong_session_seats where booking_id is not null"),"0");
 console.log(JSON.stringify({independentHoldConnections:100,winners:1,independentConfirmConnections:100,distinctExpiry:1,ownerIsolation:true,remainingOccupiedSeats:0}));
}finally{
 await sql(`drop database if exists ${database} with (force)`,"postgres");
 if(started) await command("pg_ctl",["-D",data,"-m","fast","-w","stop"]);
}
