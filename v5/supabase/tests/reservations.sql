-- Rollback-contained integration checks. Run after member/content migrations + catalog seed.
begin;
create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$ begin if value is not true then raise exception 'Assertion failed: %',message; end if; end $$;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222') on conflict do nothing;
insert into public.sejong_programs(id,title,venue_id,starts_on,ends_on,price,source_state,payload) values('test-reservation-fixture','예약 격리 검증','grand','2099-01-01','2099-01-01',null,'verified','{}');
insert into public.sejong_program_sessions(id,program_id,venue_id,starts_at,booking_enabled,source_state) values('test-reservation-session','test-reservation-fixture','grand','2099-01-01 19:30:00+09',true,'verified');
insert into public.sejong_seat_plans(id,venue_id,name,source_state,booking_enabled) values('test-reservation-plan','grand','테스트 전용','verified',true);
insert into public.sejong_venue_seats(id,seat_plan_id,label,row_label,seat_number) select 'test-seat-'||n,'test-reservation-plan','T'||n,'T',n from generate_series(1,8) n;
insert into public.sejong_session_seats(session_id,seat_id,price) select 'test-reservation-session','test-seat-'||n,1000*n from generate_series(1,8) n;
select pg_temp.assert_true(not has_table_privilege('authenticated','public.sejong_bookings','INSERT'),'direct INSERT blocked');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.sejong_bookings','UPDATE'),'direct UPDATE blocked');
select pg_temp.assert_true(not has_function_privilege('anon','public.hold_seats(text,text[],uuid)','EXECUTE'),'anonymous hold blocked');
select pg_temp.assert_true(not has_function_privilege('authenticated','sejong_private.expire_session(text,timestamptz)','EXECUTE'),'cleanup helper is private');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ declare a jsonb; retry jsonb; b jsonb; rid uuid; expiry text; begin
 a:=public.hold_seats('test-reservation-session',array['test-seat-1','test-seat-2'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 perform pg_temp.assert_true(a->>'kind'='reservation','hold succeeds');
 perform pg_temp.assert_true((a#>>'{reservation,total}')::int=3000,'price comes from inventory');
 rid:=(a#>>'{reservation,id}')::uuid;expiry:=a#>>'{reservation,expiresAt}';
 retry:=public.hold_seats('test-reservation-session',array['test-seat-2','test-seat-1'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 perform pg_temp.assert_true(retry#>>'{reservation,id}'=rid::text and retry#>>'{reservation,expiresAt}'=expiry,'idempotent hold has stable ID and expiry');
 b:=public.hold_seats('test-reservation-session',array['test-seat-3'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 perform pg_temp.assert_true(b->>'code'='IDEMPOTENCY_CONFLICT','changed payload rejected');
 b:=public.hold_seats('test-reservation-session',array['test-seat-3','test-seat-4','test-seat-5'],'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 perform pg_temp.assert_true(b->>'code'='MEMBER_LIMIT','cumulative member limit');
 b:=public.confirm_reservation(rid,'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
 perform pg_temp.assert_true(b#>>'{reservation,status}'='reserved_unpaid','confirmation is unpaid reservation');
 retry:=public.confirm_reservation(rid,'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
 perform pg_temp.assert_true(retry#>>'{reservation,expiresAt}'=b#>>'{reservation,expiresAt}','confirmation retry does not extend expiry');
 perform pg_temp.assert_true((public.get_session_seats('test-reservation-session')::text not like '%user_id%'),'inventory strips owners');
end $$;
reset role;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
set local role authenticated;
do $$ declare b jsonb; begin
 perform pg_temp.assert_true((select count(*)=0 from public.sejong_bookings),'other member cannot read reservation');
 b:=public.hold_seats('test-reservation-session',array['test-seat-1','test-seat-3'],'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
 perform pg_temp.assert_true(b->>'code'='SEATS_UNAVAILABLE','overlap rejects whole hold');
 perform pg_temp.assert_true((public.get_session_seats('test-reservation-session')#>'{seats}') @> '[{"id":"test-seat-3","available":true}]','non-overlapping seat not partially held');
end $$;
reset role;
update public.sejong_bookings set expires_at=clock_timestamp()-interval '1 second' where session_id='test-reservation-session';
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ declare b jsonb; begin
 b:=public.hold_seats('test-reservation-session',array['test-seat-1','test-seat-2'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 perform pg_temp.assert_true(b#>>'{reservation,status}'='expired','expired retry returns current state');
 perform pg_temp.assert_true((public.get_session_seats('test-reservation-session')#>'{seats}') @> '[{"id":"test-seat-1","available":true}]','read releases expired inventory');
end $$;
reset role;
create function pg_temp.fail_booking_item() returns trigger language plpgsql as $$ begin raise exception 'injected downstream write failure'; end $$;
create trigger test_booking_item_failure before insert on public.sejong_booking_items for each row execute function pg_temp.fail_booking_item();
set local role authenticated;
do $$ declare failed boolean:=false; begin
 begin
  perform public.hold_seats('test-reservation-session',array['test-seat-7','test-seat-8'],'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
 exception when others then failed:=true;
 end;
 perform pg_temp.assert_true(failed,'injected write error reached caller');
 perform pg_temp.assert_true(not exists(select 1 from public.sejong_bookings where hold_request_key='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),'booking header rolled back with item failure');
 perform pg_temp.assert_true((public.get_session_seats('test-reservation-session')#>'{seats}') @> '[{"id":"test-seat-7","available":true},{"id":"test-seat-8","available":true}]','inventory rolled back with item failure');
end $$;
reset role;
rollback;
