-- [트랜잭션 안에서만 존재하는 소유권 검증 / Ownership fixtures exist only inside this transaction]
begin;
create temporary table sejong_rls_fixture (owner_id uuid, other_id uuid, reassigned_id uuid);
insert into sejong_rls_fixture values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid());
insert into auth.users (id, email, raw_user_meta_data) select id, 'rls-' || id::text || '@example.invalid', jsonb_build_object('name', '트랜잭션 검증', 'full_name', '트랜잭션 검증') from (select owner_id as id from sejong_rls_fixture union all select other_id from sejong_rls_fixture union all select reassigned_id from sejong_rls_fixture) fixture_ids;
insert into public.sejong_profiles (user_id, name) select owner_id, '소유권 검사' from sejong_rls_fixture union all select other_id, '다른 회원' from sejong_rls_fixture;
grant select on sejong_rls_fixture to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select owner_id::text from sejong_rls_fixture), true);
do $verify$
begin
    if (select count(*) from public.sejong_profiles) <> 1 then raise exception 'RLS exposed another member profile'; end if;
    if exists (select 1 from public.sejong_profiles where name = '다른 회원') then raise exception 'RLS exposed another member row'; end if;
    update public.sejong_profiles set name = '접근 차단 검사' where user_id = (select other_id from sejong_rls_fixture);
    if found then raise exception 'RLS allowed cross-member update'; end if;
    begin
        update public.sejong_profiles set user_id = (select reassigned_id from sejong_rls_fixture);
        raise exception 'RLS allowed ownership reassignment';
    exception when insufficient_privilege then null;
    end;
    insert into public.sejong_spaces (user_id, nickname) select owner_id, '저장 검사' from sejong_rls_fixture;
    update public.sejong_spaces set theme = 'sky', light_on = false;
    if not exists (select 1 from public.sejong_spaces where theme = 'sky' and light_on = false) then raise exception 'Own room update failed'; end if;
    insert into public.sejong_favorites (user_id, program_id) select owner_id, 'dance' from sejong_rls_fixture;
    delete from public.sejong_favorites where program_id = 'dance';
    if not found then raise exception 'Own favorite delete failed'; end if;
    insert into public.sejong_notes (user_id, program_id, event_date, body) select owner_id, 'dance', current_date, '트랜잭션 검증용 기록' from sejong_rls_fixture;
    delete from public.sejong_notes where body = '트랜잭션 검증용 기록';
    if not found then raise exception 'Own note delete failed'; end if;
    insert into public.sejong_bookings (user_id, program_id, title, event_date, event_time, venue, seats, total) select owner_id, 'dance', '트랜잭션 검증', current_date, '19:30'::time, '검증용 공간', array['A1'], 70000 from sejong_rls_fixture;
    update public.sejong_bookings set status = 'cancelled';
    if not exists (select 1 from public.sejong_bookings where status = 'cancelled') then raise exception 'Own booking cancellation failed'; end if;
    begin
        insert into public.sejong_favorites (user_id, program_id) select other_id, 'dance' from sejong_rls_fixture;
        raise exception 'RLS allowed cross-member insert';
    exception when insufficient_privilege then null;
    end;
end;
$verify$;
reset role;
do $verify$
declare table_name text;
begin
    foreach table_name in array array['sejong_profiles','sejong_spaces','sejong_favorites','sejong_notes','sejong_bookings'] loop
        if has_table_privilege('anon', 'public.' || table_name, 'select') then raise exception 'Anonymous read grant on %', table_name; end if;
        if has_table_privilege('authenticated', 'public.' || table_name, 'truncate') then raise exception 'Unexpected member truncate grant on %', table_name; end if;
        if not exists (select 1 from pg_class where oid = ('public.' || table_name)::regclass and relrowsecurity) then raise exception 'Missing RLS on %', table_name; end if;
    end loop;
end;
$verify$;
rollback;
select 'PASS: member CRUD, cross-member isolation, ownership reassignment prevention, RLS and no anonymous grants; fixtures rolled back' as verification;
