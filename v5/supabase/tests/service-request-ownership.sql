-- [롤백 격리 검증 / Rollback-contained ownership and validation checks]
begin;
create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$ begin if value is not true then raise exception 'Assertion failed: %',message; end if; end $$;
create function pg_temp.assert_sqlstate(query text, expected text, message text) returns void language plpgsql as $$
declare actual text;
begin
    begin execute query; exception when others then get stacked diagnostics actual=returned_sqlstate; end;
    perform pg_temp.assert_true(actual=expected,message||' (expected '||expected||', got '||coalesce(actual,'success')||')');
end $$;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222') on conflict do nothing;
insert into public.sejong_service_forms(id,kind,title,definition,enabled) values
('/__test/request','rental','Ownership test','{"fields":[{"name":"name","label":"Name","required":true,"maxLength":80,"type":"text"},{"name":"email","label":"Email","required":true,"type":"email"},{"name":"phone","label":"Phone","required":true,"type":"tel"},{"name":"date","label":"Date","required":true,"type":"date"},{"name":"endDate","label":"End date","type":"date"},{"name":"attendees","label":"Attendees","type":"number","min":1,"max":10000},{"name":"venue","label":"Venue","type":"select","options":[{"value":"grand"}]},{"name":"portfolio","label":"Portfolio","type":"text"}]}',true),
('/__test/closed','event','Closed test','{"fields":[]}',false),
('/__test/order','order','Order test','{"fields":[{"name":"name","label":"Name","required":true,"type":"text"}]}',true);
insert into public.sejong_service_goods(id,title,description,source_url,price,published) values
('__test/priced','Priced item','Fixture','https://www.sejongpac.or.kr/',7000,true),
('__test/stale','Expired cart fixture','Fixture','https://www.sejongpac.or.kr/',100,true),
('__test/unknown-price','Unpriced item','Fixture','https://www.sejongpac.or.kr/',null,true),
('__test/hidden','Hidden item','Fixture','https://www.sejongpac.or.kr/',100,false);
insert into public.sejong_service_cart(user_id,good_id,quantity,updated_at) values('11111111-1111-4111-8111-111111111111','__test/stale',19,now()-interval '91 days');
create temporary table service_test_state(name text primary key,request jsonb);
grant select,insert on service_test_state to authenticated;
select pg_temp.assert_true(not has_function_privilege('anon','public.submit_sejong_request(text,uuid,jsonb)','EXECUTE'),'anon submit is not granted');
select pg_temp.assert_true(not has_function_privilege('anon','public.cancel_sejong_request(uuid)','EXECUTE'),'anon cancellation is not granted');
select pg_temp.assert_true(not has_function_privilege('anon','public.set_sejong_cart_quantity(text,integer,boolean)','EXECUTE'),'anon cart mutation is not granted');
select pg_temp.assert_true(not has_function_privilege('authenticated','sejong_private.purge_service_data()','EXECUTE'),'retention helper is private');
select pg_temp.assert_true((select bool_and(not has_table_privilege(role_name,table_name,operation)) from unnest(array['anon','authenticated']) role_name cross join unnest(array['public.sejong_service_forms','public.sejong_service_goods','public.sejong_service_cart','public.sejong_service_requests']) table_name cross join unnest(array['INSERT','UPDATE','DELETE','TRUNCATE']) operation),'all client direct writes are denied');
select pg_temp.assert_true((select bool_and(prosecdef and proconfig @> array['search_path=""']) from pg_proc where oid in ('public.submit_sejong_request(text,uuid,jsonb)'::regprocedure,'public.cancel_sejong_request(uuid)'::regprocedure,'public.set_sejong_cart_quantity(text,integer,boolean)'::regprocedure,'sejong_private.purge_service_data()'::regprocedure)),'privileged functions pin empty search_path');
set local role anon;
select pg_temp.assert_sqlstate('select id from public.sejong_service_requests','42501','anon request read denied');
select pg_temp.assert_sqlstate('select * from public.sejong_service_cart','42501','anon cart read denied');
select pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/request',gen_random_uuid(),'{}')$q$,'42501','anon RPC denied');
select pg_temp.assert_true((select count(*)=0 from public.sejong_service_goods where id='__test/hidden'),'hidden goods are not public');
reset role;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$
declare payload jsonb:='{"name":"Member A","email":"a@example.test","phone":"010-1234-5678","date":"2028-02-29","endDate":"2028-03-01","attendees":"3","venue":"grand","consent":true}'; a jsonb; retry jsonb; key text; bad jsonb;
begin
    a:=public.submit_sejong_request('/__test/request','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload);
    insert into service_test_state values('owner-a',a);
    perform pg_temp.assert_true(a->>'status'='submitted' and a->>'reference' like 'SJ-%','valid leap-day request submitted');
    perform pg_temp.assert_true((select count(*)=8 from jsonb_object_keys(a)),'RPC exposes exactly eight allowed fields');
    retry:=public.submit_sejong_request('/__test/request','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload);
    perform pg_temp.assert_true(a=retry,'identical retry preserves ID, payload, and expiry');
    retry:=public.submit_sejong_request('/__test/request',gen_random_uuid(),payload||'{"endDate":"  "}');
    perform pg_temp.assert_true(retry->>'status'='submitted','optional whitespace-only date agrees with field validation');
    retry:=public.submit_sejong_request('/__test/request',gen_random_uuid(),payload||'{"date":" 2028-02-29 ","endDate":" 2028-03-01 "}');
    perform pg_temp.assert_true(retry->>'status'='submitted','date-order check uses the same trimmed values as date validation');
    perform pg_temp.assert_sqlstate(format('select public.submit_sejong_request(%L,%L,%L::jsonb)','/__test/request','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload||'{"name":"Changed"}'),'22023','same key changed payload conflicts');
    perform pg_temp.assert_sqlstate(format('select public.submit_sejong_request(NULL,%L,%L::jsonb)','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload),'22023','null form cannot bypass key matching');
    perform pg_temp.assert_sqlstate(format('select public.submit_sejong_request(%L,NULL,%L::jsonb)','/__test/request',payload),'22023','null request key denied');
    perform pg_temp.assert_sqlstate(format('select public.submit_sejong_request(%L,gen_random_uuid(),%L::jsonb)','/__test/request',payload-'consent'),'22023','missing consent denied');
    foreach key in array array['user_id','request_key','input_hash','status','expires_at','price','total','items','paymentStatus'] loop
        perform pg_temp.assert_sqlstate(format('select public.submit_sejong_request(%L,gen_random_uuid(),%L::jsonb)','/__test/request',payload||jsonb_build_object(key,'forged')),'22023','caller cannot forge '||key);
    end loop;
    foreach bad in array array['{}'::jsonb,'{"consent":false}'::jsonb,'{"consent":"true"}'::jsonb,'{"name":123}'::jsonb,'{"name":null}'::jsonb,'{"email":"invalid"}'::jsonb,'{"phone":"xxx"}'::jsonb,'{"date":"2027-02-29"}'::jsonb,'{"date":"2026-02-30"}'::jsonb,'{"date":"2026-13-01"}'::jsonb,'{"date":"2026-2-01"}'::jsonb,'{"endDate":"2027-01-01"}'::jsonb,'{"attendees":"0"}'::jsonb,'{"attendees":"10001"}'::jsonb,'{"attendees":"1.5"}'::jsonb,'{"venue":"forged"}'::jsonb,'{"portfolio":"javascript:alert(1)"}'::jsonb] loop
        if bad='{}'::jsonb then bad:='{"name":""}'; end if;
        perform pg_temp.assert_sqlstate(format('select public.submit_sejong_request(%L,gen_random_uuid(),%L::jsonb)','/__test/request',payload||bad),'22023','invalid field, date, range, type, or consent rejected: '||bad::text);
    end loop;
    perform pg_temp.assert_sqlstate(format('select public.submit_sejong_request(%L,gen_random_uuid(),%L::jsonb)','/__test/request',payload||jsonb_build_object('name',repeat('x',81))),'22023','field size enforced');
    perform pg_temp.assert_sqlstate(format('select public.submit_sejong_request(%L,gen_random_uuid(),%L::jsonb)','/__test/request',payload||jsonb_build_object('name',repeat('x',22000))),'22023','total payload size enforced');
    perform pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/request',gen_random_uuid(),'[]')$q$,'22023','array payload denied');
    perform pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/closed',gen_random_uuid(),'{"consent":true}')$q$,'22023','closed form denied');
    perform pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/missing',gen_random_uuid(),'{"consent":true}')$q$,'22023','unknown form denied');
    perform pg_temp.assert_sqlstate('select user_id from public.sejong_service_requests','42501','private request columns denied');
    perform pg_temp.assert_sqlstate($q$update public.sejong_service_requests set status='cancelled'$q$,'42501','direct update denied');
    perform pg_temp.assert_sqlstate('delete from public.sejong_service_requests','42501','direct delete denied');
    perform pg_temp.assert_sqlstate($q$insert into public.sejong_service_cart(user_id,good_id,quantity) values('22222222-2222-4222-8222-222222222222','__test/priced',1)$q$,'42501','direct forged cart insert denied');
    perform pg_temp.assert_sqlstate($q$select public.set_sejong_cart_quantity('__test/priced',21)$q$,'22023','quantity upper bound enforced');
    perform pg_temp.assert_sqlstate($q$select public.set_sejong_cart_quantity('__test/priced',-1)$q$,'22023','negative quantity denied');
    perform pg_temp.assert_sqlstate($q$select public.set_sejong_cart_quantity('__test/priced',NULL)$q$,'22023','null quantity denied');
    perform pg_temp.assert_sqlstate($q$select public.set_sejong_cart_quantity('__test/hidden',1)$q$,'22023','unpublished product denied');
    perform pg_temp.assert_sqlstate($q$select public.set_sejong_cart_quantity('__test/missing',1)$q$,'22023','unknown product denied');
    perform pg_temp.assert_sqlstate($q$select public.set_sejong_cart_quantity('__test/priced',1,NULL)$q$,'22023','null increment mode denied');
    perform public.set_sejong_cart_quantity('__test/stale',2,true);
    perform pg_temp.assert_true((select quantity=2 from public.sejong_service_cart where good_id='__test/stale'),'increment ignores expired quantity and renews cart line');
    perform public.set_sejong_cart_quantity('__test/stale',0);
    perform public.set_sejong_cart_quantity('__test/priced',2);
    perform public.set_sejong_cart_quantity('__test/priced',1,true);
    perform public.set_sejong_cart_quantity('__test/priced',0,true);
    perform pg_temp.assert_true((select quantity=3 from public.sejong_service_cart where good_id='__test/priced'),'increment adds and zero increment preserves active quantity');
    perform pg_temp.assert_sqlstate($q$select public.set_sejong_cart_quantity('__test/priced',18,true)$q$,'22023','increment cannot exceed quantity cap');
    perform pg_temp.assert_true((select quantity=3 from public.sejong_service_cart where good_id='__test/priced'),'rejected increment preserves previous quantity');
    perform public.set_sejong_cart_quantity('__test/priced',3);
    a:=public.submit_sejong_request('/__test/order','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{"name":"Member A","consent":true}');
    perform pg_temp.assert_true((a#>>'{values,total}')::bigint=21000 and (a#>>'{values,items,0,unitPrice}')::int=7000 and a#>>'{values,paymentStatus}'='unpaid','order total and unpaid status come from server goods');
    perform pg_temp.assert_true((select count(*)=0 from public.sejong_service_cart),'successful order clears cart');
    perform public.set_sejong_cart_quantity('__test/priced',2);
    retry:=public.submit_sejong_request('/__test/order','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{"name":"Member A","consent":true}');
    perform pg_temp.assert_true(a=retry and (select quantity=2 from public.sejong_service_cart where good_id='__test/priced'),'order retry preserves newly added cart');
    perform public.set_sejong_cart_quantity('__test/priced',0);
    perform public.set_sejong_cart_quantity('__test/unknown-price',1);
    a:=public.submit_sejong_request('/__test/order',gen_random_uuid(),'{"name":"Member A","consent":true}');
    perform pg_temp.assert_true(a#>'{values,total}'='null'::jsonb,'unknown price remains null');
    perform pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/order',gen_random_uuid(),'{"name":"Member A","consent":true}')$q$,'22023','empty order denied');
end $$;
reset role;
-- [후속 쓰기 실패와 상품 게시 변경의 원자성 / Atomicity on downstream failure and publication changes]
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
select public.set_sejong_cart_quantity('__test/priced',2);
reset role;
update public.sejong_service_goods set published=false where id='__test/priced';
set local role authenticated;
select pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/order','cccccccc-cccc-4ccc-8ccc-cccccccccccc','{"name":"Member A","consent":true}')$q$,'22023','goods unpublished after cart addition cannot be ordered');
select pg_temp.assert_true((select quantity=2 from public.sejong_service_cart where good_id='__test/priced'),'invalid order preserves cart');
reset role;
update public.sejong_service_goods set published=true where id='__test/priced';
create function pg_temp.fail_service_cart_delete() returns trigger language plpgsql as $$ begin raise exception 'injected cart failure'; end $$;
create trigger test_service_cart_failure before delete on public.sejong_service_cart for each row execute function pg_temp.fail_service_cart_delete();
set local role authenticated;
select pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/order','cccccccc-cccc-4ccc-8ccc-cccccccccccc','{"name":"Member A","consent":true}')$q$,'P0001','injected cart failure reaches caller');
select pg_temp.assert_true((select quantity=2 from public.sejong_service_cart where good_id='__test/priced'),'failed order preserves cart');
reset role;
select pg_temp.assert_true(not exists(select 1 from public.sejong_service_requests where request_key='cccccccc-cccc-4ccc-8ccc-cccccccccccc'),'failed cart deletion rolls back order insert');
drop trigger test_service_cart_failure on public.sejong_service_cart;
set local role authenticated;
select public.set_sejong_cart_quantity('__test/priced',0);
reset role;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
set local role authenticated;
select pg_temp.assert_true((select count(id)=0 from public.sejong_service_requests),'other owner cannot read requests');
select pg_temp.assert_true((select count(*)=0 from public.sejong_service_cart),'other owner cannot read cart');
select pg_temp.assert_sqlstate(format('select public.cancel_sejong_request(%L::uuid)',(select request->>'id' from service_test_state where name='owner-a')),'42501','other owner cannot cancel by known ID');
select public.submit_sejong_request('/__test/request','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"name":"Member B","email":"b@example.test","phone":"010-0000-0000","date":"2028-02-29","consent":true}');
reset role;
select pg_temp.assert_true((select count(*)=2 from public.sejong_service_requests where request_key='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'same key is scoped to each owner');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ declare a jsonb; b jsonb; begin
    a:=public.cancel_sejong_request((select (request->>'id')::uuid from service_test_state where name='owner-a'));
    b:=public.cancel_sejong_request((a->>'id')::uuid);
    perform pg_temp.assert_true(a=b and a->>'status'='cancelled','owner cancellation is idempotent');
end $$;
reset role;
update public.sejong_service_requests set expires_at=now()-interval '1 second' where id=(select (request->>'id')::uuid from service_test_state where name='owner-a');
insert into public.sejong_service_cart(user_id,good_id,quantity,updated_at) values('11111111-1111-4111-8111-111111111111','__test/priced',1,now()-interval '91 days');
set local role authenticated;
select pg_temp.assert_true((select count(id)=0 from public.sejong_service_requests where id=(select (request->>'id')::uuid from service_test_state where name='owner-a')),'expired request hidden');
select pg_temp.assert_true((select count(*)=0 from public.sejong_service_cart),'stale cart hidden');
select pg_temp.assert_sqlstate(format('select public.cancel_sejong_request(%L::uuid)',(select request->>'id' from service_test_state where name='owner-a')),'42501','expired cancellation denied');
select pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/request','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"name":"Member A","email":"a@example.test","phone":"010-1234-5678","date":"2028-02-29","endDate":"2028-03-01","attendees":"3","venue":"grand","consent":true}')$q$,'42501','expired retry cannot disclose retained payload');
select pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/order',gen_random_uuid(),'{"name":"Member A","consent":true}')$q$,'22023','stale cart cannot order');
reset role;
select sejong_private.purge_service_data();
select pg_temp.assert_true((select count(*)=0 from public.sejong_service_requests where expires_at<=now()),'retention purges expired requests');
select pg_temp.assert_true((select count(*)=0 from public.sejong_service_cart where updated_at<=now()-interval '90 days'),'retention purges stale carts');
select pg_temp.assert_true((select count(*)>0 from public.sejong_service_requests),'retention preserves current requests');
select set_config('request.jwt.claim.sub','',true);
set local role authenticated;
select pg_temp.assert_sqlstate($q$select public.submit_sejong_request('/__test/request',gen_random_uuid(),'{"consent":true}')$q$,'28000','missing identity fails closed');
select pg_temp.assert_sqlstate($q$select public.cancel_sejong_request(gen_random_uuid())$q$,'28000','missing identity cannot cancel');
select pg_temp.assert_sqlstate($q$select public.set_sejong_cart_quantity('__test/priced',1)$q$,'28000','missing identity cannot mutate cart');
reset role;
rollback;
