-- DDL-free production RPC verification. All fixture rows and changes roll back.
-- Abort on any pre-existing fixture identity; never reuse a real account.
begin;
do $$ begin
 assert not exists(select 1 from auth.users where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')),'Fixture identity already exists; choose new UUIDs before proceeding';
 assert not exists(select 1 from public.sejong_programs where id='test-reservation-fixture'),'Fixture program already exists';
 assert not exists(select 1 from public.sejong_program_sessions where id='test-reservation-session'),'Fixture session already exists';
 assert not has_table_privilege('authenticated','public.sejong_bookings','INSERT'),'Direct INSERT must be blocked';
 assert not has_table_privilege('authenticated','public.sejong_bookings','UPDATE'),'Direct UPDATE must be blocked';
 assert not has_table_privilege('authenticated','public.sejong_session_seats','SELECT'),'Raw occupancy must be private';
 assert not has_function_privilege('anon','public.hold_seats(text,text[],uuid)','EXECUTE'),'Anonymous hold must be blocked';
 assert not has_function_privilege('authenticated','sejong_private.expire_session(text,timestamptz)','EXECUTE'),'Cleanup helper must be private';
end $$;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
insert into public.sejong_programs(id,title,venue_id,starts_on,ends_on,price,source_state,payload) values('test-reservation-fixture','예약 격리 검증','grand','2099-01-01','2099-01-01',null,'verified','{}');
insert into public.sejong_program_sessions(id,program_id,venue_id,starts_at,booking_enabled,source_state) values('test-reservation-session','test-reservation-fixture','grand','2099-01-01 19:30:00+09',true,'verified');
insert into public.sejong_seat_plans(id,venue_id,name,source_state,booking_enabled) values('test-reservation-plan','grand','테스트 전용','verified',true);
insert into public.sejong_venue_seats(id,seat_plan_id,label,row_label,seat_number) select 'test-seat-'||n,'test-reservation-plan','T'||n,'T',n from generate_series(1,8) n;
insert into public.sejong_session_seats(session_id,seat_id,price) select 'test-reservation-session','test-seat-'||n,1000*n from generate_series(1,8) n;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ declare a jsonb; b jsonb; retry jsonb; rid uuid; expiry text; begin
 a:=public.hold_seats('test-reservation-session',array['test-seat-1','test-seat-2'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 assert a->>'kind'='reservation','Hold must succeed';
 assert (a#>>'{reservation,total}')::int=3000,'Price must be derived from inventory';
 assert a#>>'{reservation,date}'='2099-01-01' and a#>>'{reservation,time}'='19:30','Dates must use Asia/Seoul';
 rid:=(a#>>'{reservation,id}')::uuid; expiry:=a#>>'{reservation,expiresAt}';
 perform set_config('sejong_test.reservation_id',rid::text,true);
 retry:=public.hold_seats('test-reservation-session',array['test-seat-2','test-seat-1'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 assert retry#>>'{reservation,id}'=rid::text and retry#>>'{reservation,expiresAt}'=expiry,'Retry must preserve ID and expiry';
 b:=public.hold_seats('test-reservation-session',array['test-seat-3'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 assert b->>'code'='IDEMPOTENCY_CONFLICT','Changed selection must reject same key';
 b:=public.hold_seats('test-reservation-session',array['test-seat-3','test-seat-4','test-seat-5'],'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 assert b->>'code'='MEMBER_LIMIT','Active session total must stay at most four';
 b:=public.confirm_reservation(rid,'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
 assert b#>>'{reservation,status}'='reserved_unpaid','Confirmed reservation must remain unpaid';
 retry:=public.confirm_reservation(rid,'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
 assert retry#>>'{reservation,expiresAt}'=b#>>'{reservation,expiresAt}','Confirmation retry must not extend expiry';
 assert public.get_session_seats('test-reservation-session')::text not like '%user_id%','Inventory must not disclose owners';
 assert public.get_session_seats('test-reservation-session')::text not like '%booking_id%','Inventory must not disclose booking IDs';
end $$;
reset role;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
set local role authenticated;
do $$ declare b jsonb; begin
 assert not exists(select 1 from public.sejong_bookings where session_id='test-reservation-session'),'Another member must not read owner rows';
 b:=public.cancel_reservation(current_setting('sejong_test.reservation_id')::uuid);
 assert b->>'code'='RESERVATION_NOT_FOUND','Another member must not cancel reservation';
 b:=public.hold_seats('test-reservation-session',array['test-seat-1','test-seat-3'],'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
 assert b->>'code'='SEATS_UNAVAILABLE','Conflicting multi-seat hold must fail';
 assert (public.get_session_seats('test-reservation-session')#>'{seats}') @> '[{"id":"test-seat-3","available":true}]','Nonconflicting part must remain free';
end $$;
reset role;
update public.sejong_bookings set expires_at=clock_timestamp()-interval '1 second' where id=current_setting('sejong_test.reservation_id')::uuid and session_id='test-reservation-session';
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ declare b jsonb; begin
 b:=public.hold_seats('test-reservation-session',array['test-seat-1','test-seat-2'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 assert b#>>'{reservation,status}'='expired','Expired retry must return current state';
 assert (public.get_session_seats('test-reservation-session')#>'{seats}') @> '[{"id":"test-seat-1","available":true},{"id":"test-seat-2","available":true}]','Read must release expired inventory';
 b:=public.hold_seats('test-reservation-session',array['test-seat-7','test-seat-8'],'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
 assert b#>>'{reservation,status}'='held','New request after expiry may hold free seats';
 b:=public.cancel_reservation((b#>>'{reservation,id}')::uuid);
 assert b#>>'{reservation,status}'='cancelled','Owner can cancel';
 assert (public.get_session_seats('test-reservation-session')#>'{seats}') @> '[{"id":"test-seat-7","available":true},{"id":"test-seat-8","available":true}]','Cancellation must release all seats';
end $$;
reset role;
update public.sejong_programs set source_state='unverified' where id='test-reservation-fixture';
set local role authenticated;
do $$ declare b jsonb; begin
 b:=public.get_session_seats('test-reservation-session');
 assert b->>'bookingEnabled'='false' and b->'seats'='[]'::jsonb,'Unverified program inventory must be disabled';
 b:=public.hold_seats('test-reservation-session',array['test-seat-1'],'ffffffff-ffff-4fff-8fff-ffffffffffff');
 assert b->>'code'='BOOKING_DISABLED','Unverified program must reject holds';
end $$;
reset role;
rollback;
