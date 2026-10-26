-- Cover content/inventory foreign keys without widening client grants.
begin;
create index sejong_venues_media on public.sejong_venues(media_id);
create index sejong_programs_venue on public.sejong_programs(venue_id);
create index sejong_programs_media on public.sejong_programs(media_id);
create index sejong_sessions_program on public.sejong_program_sessions(program_id);
create index sejong_sessions_venue on public.sejong_program_sessions(venue_id);
create index sejong_openings_program on public.sejong_ticket_openings(program_id);
create index sejong_features_program on public.sejong_home_features(program_id);
create index sejong_features_media on public.sejong_home_features(media_id);
create index sejong_plans_venue on public.sejong_seat_plans(venue_id);
create index sejong_bookings_program on public.sejong_bookings(program_id);
create index sejong_session_seats_seat on public.sejong_session_seats(seat_id);
create index sejong_items_session_seat on public.sejong_booking_items(session_id,seat_id);

-- A published/verified session cannot expose sellable seats for an unpublished/unverified program.
create or replace function sejong_private.get_session_seats(p_session_id text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.sejong_program_sessions; t timestamptz; inventory jsonb;
begin
 select * into s from public.sejong_program_sessions where id=p_session_id and published for update;
 if not found then return jsonb_build_object('kind','error','code','SESSION_NOT_FOUND'); end if;
 t:=clock_timestamp(); perform sejong_private.expire_session(s.id,t);
 if not s.booking_enabled or s.starts_at<=t or not exists(select 1 from public.sejong_programs p where p.id=s.program_id and p.published and p.source_state='verified') then return jsonb_build_object('kind','inventory','sessionId',s.id,'bookingEnabled',false,'seats','[]'::jsonb,'serverNow',t); end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',ss.seat_id,'label',vs.label,'row',vs.row_label,'number',vs.seat_number,'price',ss.price,'available',ss.booking_id is null) order by vs.row_label,vs.seat_number),'[]') into inventory
 from public.sejong_session_seats ss join public.sejong_venue_seats vs on vs.id=ss.seat_id join public.sejong_seat_plans sp on sp.id=vs.seat_plan_id
 where ss.session_id=s.id and sp.booking_enabled and sp.source_state='verified' and sp.venue_id=s.venue_id;
 return jsonb_build_object('kind','inventory','sessionId',s.id,'bookingEnabled',true,'seats',inventory,'serverNow',t);
end $$;
revoke all on function sejong_private.get_session_seats(text) from public;
grant execute on function sejong_private.get_session_seats(text) to anon,authenticated;
commit;
