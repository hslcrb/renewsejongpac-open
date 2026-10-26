-- Published content and transactional, unpaid seat reservations. Asia/Seoul is explicit.
begin;
create schema if not exists sejong_private;
revoke all on schema sejong_private from public, anon, authenticated;
grant usage on schema sejong_private to anon, authenticated;
create table sejong_private.content_revisions (
 id bigint generated always as identity primary key, entity_table text not null, entity_id text not null,
 revision integer not null, raw_source jsonb not null, source_path text not null, recorded_at timestamptz not null default clock_timestamp()
);
alter table sejong_private.content_revisions enable row level security;
create table public.sejong_media (id text primary key, payload jsonb not null, source_url text not null, source_state text not null default 'verified' check(source_state in ('verified','unverified')), published boolean not null default true, revision integer not null default 1);
create table public.sejong_venues (id text primary key, name text not null, media_id text references public.sejong_media, payload jsonb not null, published boolean not null default true, revision integer not null default 1);
create table public.sejong_programs (id text primary key, title text not null, venue_id text references public.sejong_venues, media_id text references public.sejong_media, starts_on date, ends_on date, price integer check(price >= 0), source_state text not null default 'unverified' check(source_state in ('verified','unverified')), payload jsonb not null, published boolean not null default true, revision integer not null default 1, check(ends_on >= starts_on));
create table public.sejong_program_sessions (id text primary key, program_id text not null references public.sejong_programs, venue_id text references public.sejong_venues, starts_at timestamptz not null, booking_enabled boolean not null default false, source_state text not null default 'unverified' check(source_state in ('verified','unverified')), payload jsonb not null default '{}', published boolean not null default true, revision integer not null default 1, check(not booking_enabled or (source_state='verified' and venue_id is not null)));
create table public.sejong_companies (id text primary key, payload jsonb not null, published boolean not null default true, revision integer not null default 1);
create table public.sejong_notices (id text primary key, published_on date not null, payload jsonb not null, published boolean not null default true, revision integer not null default 1);
create table public.sejong_ticket_openings (id text primary key, program_id text references public.sejong_programs, opens_at timestamptz not null, payload jsonb not null, published boolean not null default true, revision integer not null default 1);
create table public.sejong_home_features (id text primary key, program_id text not null references public.sejong_programs, media_id text references public.sejong_media, sort_order integer not null default 0, payload jsonb not null, published boolean not null default true, revision integer not null default 1);
create table public.sejong_pages (id text primary key check(left(id,1)='/'), payload jsonb not null, published boolean not null default true, revision integer not null default 1);
do $$ declare t text; begin
 foreach t in array array['media','venues','programs','program_sessions','companies','notices','ticket_openings','home_features','pages'] loop
 execute format('alter table public.sejong_%I enable row level security',t);
 execute format('revoke all on public.sejong_%I from public, anon, authenticated',t);
 execute format('grant select on public.sejong_%I to anon, authenticated',t);
 execute format('create policy published_read on public.sejong_%I for select to anon, authenticated using (published)',t);
 end loop;
end $$;

create function sejong_private.record_content_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.revision := old.revision + 1;
 insert into sejong_private.content_revisions(entity_table,entity_id,revision,raw_source,source_path) values(tg_table_name,new.id,new.revision,to_jsonb(new),'database:' || tg_table_name);
 return new;
end $$;
revoke all on function sejong_private.record_content_revision() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['media','venues','programs','program_sessions','companies','notices','ticket_openings','home_features','pages'] loop
 execute format('create trigger content_revision before update on public.sejong_%I for each row execute function sejong_private.record_content_revision()',t);
 end loop;
end $$;
create function public.sejong_catalog_snapshot() returns jsonb language sql stable security invoker set search_path='' as $$
select jsonb_build_object('version',1,'generatedAt',clock_timestamp(),
 'media',(select coalesce(jsonb_agg(payload || jsonb_build_object('id',id) order by id),'[]') from public.sejong_media where published),
 'venues',(select coalesce(jsonb_agg(v.payload || jsonb_build_object('id',v.id,'name',v.name,'image',case when m.id is not null then 'assets/images/official/' || (m.payload->>'file') else '' end) order by v.id),'[]') from public.sejong_venues v left join public.sejong_media m on m.id=v.media_id and m.published where v.published),
 'programs',(select coalesce(jsonb_agg(p.payload || jsonb_build_object('id',p.id,'title',p.title,'start',p.starts_on,'end',p.ends_on,'price',p.price,'sourceState',p.source_state,'revision',p.revision,'venue',coalesce(v.name,p.payload->>'venue'),'image',case when m.id is not null then 'assets/images/official/' || (m.payload->>'file') else '' end,'imageAlt',coalesce(m.payload->>'alt','')) order by p.id),'[]') from public.sejong_programs p left join public.sejong_venues v on v.id=p.venue_id and v.published left join public.sejong_media m on m.id=p.media_id and m.published where p.published),
 'sessions',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'programId',program_id,'venueId',venue_id,'startsAt',starts_at,'bookingEnabled',booking_enabled,'sourceState',source_state) order by starts_at,id),'[]') from public.sejong_program_sessions where published),
 'companies',(select coalesce(jsonb_agg(payload || jsonb_build_object('id',id) order by id),'[]') from public.sejong_companies where published),
 'notices',(select coalesce(jsonb_agg(payload || jsonb_build_object('id',id,'date',published_on) order by published_on desc,id),'[]') from public.sejong_notices where published),
 'ticketOpenings',(select coalesce(jsonb_agg(payload || jsonb_build_object('id',id,'opensAt',opens_at) order by opens_at,id),'[]') from public.sejong_ticket_openings where published),
 'homeFeatures',(select coalesce(jsonb_agg(f.payload || jsonb_build_object('id',f.id,'image',case when m.id is not null then 'official/' || (m.payload->>'file') else '' end,'alt',coalesce(m.payload->>'alt','')) order by f.sort_order,f.id),'[]') from public.sejong_home_features f left join public.sejong_media m on m.id=f.media_id and m.published where f.published),
 'pages',(select coalesce(jsonb_agg(payload || jsonb_build_object('path',id,'status','published','revision',revision) order by id),'[]') from public.sejong_pages where published));
$$;
revoke all on function public.sejong_catalog_snapshot() from public;
grant execute on function public.sejong_catalog_snapshot() to anon,authenticated;

create table public.sejong_seat_plans (id text primary key, venue_id text not null references public.sejong_venues, name text not null, source_state text not null check(source_state in ('verified','unverified')), booking_enabled boolean not null default false, check(not booking_enabled or source_state='verified'));
create table public.sejong_venue_seats (id text primary key, seat_plan_id text not null references public.sejong_seat_plans, label text not null, row_label text not null, seat_number integer not null, unique(seat_plan_id,label));
alter table public.sejong_bookings drop constraint sejong_bookings_status_check;
alter table public.sejong_bookings alter column status set default 'held';
alter table public.sejong_bookings add constraint sejong_bookings_status_check check(status in ('held','reserved_unpaid','expired','cancelled','released'));
alter table public.sejong_bookings add column session_id text references public.sejong_program_sessions;
alter table public.sejong_bookings add column expires_at timestamptz;
alter table public.sejong_bookings add column hold_request_key uuid;
alter table public.sejong_bookings add column hold_fingerprint text;
alter table public.sejong_bookings add column confirm_request_key uuid;
alter table public.sejong_bookings add column confirm_fingerprint text;
alter table public.sejong_bookings add constraint unique_member_hold unique(user_id,hold_request_key);
alter table public.sejong_bookings add constraint unique_member_confirm unique(user_id,confirm_request_key);
alter table public.sejong_bookings add constraint booking_program_fk foreign key(program_id) references public.sejong_programs;
create table public.sejong_session_seats (session_id text not null references public.sejong_program_sessions, seat_id text not null references public.sejong_venue_seats, price integer not null check(price>=0), booking_id uuid references public.sejong_bookings, primary key(session_id,seat_id));
create table public.sejong_booking_items (booking_id uuid not null references public.sejong_bookings, session_id text not null, seat_id text not null, unit_price integer not null check(unit_price>=0), primary key(booking_id,seat_id), foreign key(session_id,seat_id) references public.sejong_session_seats);
create index booking_active_session on public.sejong_bookings(session_id,user_id,status,expires_at);
create index seat_booking on public.sejong_session_seats(booking_id);
revoke insert,update,delete on public.sejong_bookings from authenticated;
drop policy bookings_member_insert on public.sejong_bookings;
drop policy bookings_member_update on public.sejong_bookings;
do $$ declare t text; begin
 foreach t in array array['seat_plans','venue_seats','session_seats','booking_items'] loop
 execute format('alter table public.sejong_%I enable row level security',t);
 execute format('revoke all on public.sejong_%I from public, anon, authenticated',t);
 end loop;
end $$;
grant select on public.sejong_booking_items to authenticated;
create policy booking_items_owner_read on public.sejong_booking_items for select to authenticated using(exists(select 1 from public.sejong_bookings b where b.id=booking_id and b.user_id=(select auth.uid())));

-- Internal helpers can only be invoked through the bounded public operations below.
create function sejong_private.expire_session(p_session text,p_now timestamptz) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.sejong_bookings set status='expired' where session_id=p_session and status in ('held','reserved_unpaid') and expires_at<=p_now;
 update public.sejong_session_seats s set booking_id=null from public.sejong_bookings b where s.session_id=p_session and s.booking_id=b.id and b.status in ('expired','cancelled','released');
end $$;
create function sejong_private.reservation_result(p_id uuid) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('kind','reservation','reservation',jsonb_build_object('id',id,'programId',program_id,'sessionId',session_id,'title',title,'date',event_date,'time',to_char(event_time,'HH24:MI'),'venue',venue,'seats',seats,'total',total,'reference',id,'status',status,'expiresAt',expires_at,'createdAt',created_at),'serverNow',clock_timestamp()) from public.sejong_bookings where id=p_id and user_id=auth.uid();
$$;
create function sejong_private.get_session_seats(p_session_id text) returns jsonb language plpgsql security definer set search_path='' as $$
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
create function sejong_private.hold_seats(p_session_id text,p_seat_ids text[],p_request_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); s public.sejong_program_sessions; b public.sejong_bookings; t timestamptz; ids text[]; fingerprint text; n integer; occupied integer; amount integer; labels text[]; bid uuid;
begin
 if u is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if p_request_key is null or p_seat_ids is null or cardinality(p_seat_ids) not between 1 and 4 then return jsonb_build_object('kind','error','code','INVALID_SELECTION'); end if;
 select array_agg(distinct x order by x) into ids from unnest(p_seat_ids) x where x is not null;
 if ids is null or cardinality(ids)<>cardinality(p_seat_ids) then return jsonb_build_object('kind','error','code','INVALID_SELECTION'); end if;
 select * into s from public.sejong_program_sessions where id=p_session_id for update;
 if not found then return jsonb_build_object('kind','error','code','SESSION_NOT_FOUND'); end if;
 t:=clock_timestamp(); perform sejong_private.expire_session(s.id,t);
 fingerprint:=jsonb_build_array(p_session_id,to_jsonb(ids))::text;
 select * into b from public.sejong_bookings where user_id=u and hold_request_key=p_request_key;
 if found then
  if b.hold_fingerprint<>fingerprint then return jsonb_build_object('kind','error','code','IDEMPOTENCY_CONFLICT'); end if;
  return sejong_private.reservation_result(b.id);
 end if;
 if not s.published or not s.booking_enabled or s.source_state<>'verified' or s.starts_at<=t then return jsonb_build_object('kind','error','code','BOOKING_DISABLED'); end if;
 if not exists(select 1 from public.sejong_programs where id=s.program_id and published and source_state='verified') then return jsonb_build_object('kind','error','code','BOOKING_DISABLED'); end if;
 select coalesce(sum(cardinality(seats)),0) into n from public.sejong_bookings where user_id=u and session_id=s.id and status in ('held','reserved_unpaid') and expires_at>t;
 if n+cardinality(ids)>4 then return jsonb_build_object('kind','error','code','MEMBER_LIMIT'); end if;
 perform 1 from public.sejong_session_seats where session_id=s.id and seat_id=any(ids) order by seat_id for update;
 select count(*),count(*) filter(where ss.booking_id is not null),sum(ss.price),array_agg(vs.label order by ss.seat_id) into n,occupied,amount,labels
 from public.sejong_session_seats ss join public.sejong_venue_seats vs on vs.id=ss.seat_id join public.sejong_seat_plans sp on sp.id=vs.seat_plan_id
 where ss.session_id=s.id and ss.seat_id=any(ids) and sp.booking_enabled and sp.source_state='verified' and sp.venue_id=s.venue_id;
 if n<>cardinality(ids) then return jsonb_build_object('kind','error','code','INVALID_SELECTION'); end if;
 if occupied>0 then return jsonb_build_object('kind','error','code','SEATS_UNAVAILABLE'); end if;
 insert into public.sejong_bookings(user_id,program_id,session_id,title,event_date,event_time,venue,seats,total,status,expires_at,hold_request_key,hold_fingerprint)
 select u,p.id,s.id,p.title,(s.starts_at at time zone 'Asia/Seoul')::date,(s.starts_at at time zone 'Asia/Seoul')::time,v.name,labels,amount,'held',t+interval '5 minutes',p_request_key,fingerprint from public.sejong_programs p join public.sejong_venues v on v.id=s.venue_id where p.id=s.program_id returning id into bid;
 insert into public.sejong_booking_items(booking_id,session_id,seat_id,unit_price) select bid,s.id,seat_id,price from public.sejong_session_seats where session_id=s.id and seat_id=any(ids);
 update public.sejong_session_seats set booking_id=bid where session_id=s.id and seat_id=any(ids);
 return sejong_private.reservation_result(bid);
exception when unique_violation then
 return jsonb_build_object('kind','error','code','IDEMPOTENCY_CONFLICT');
end $$;
create function sejong_private.confirm_reservation(p_reservation_id uuid,p_request_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); sid text; b public.sejong_bookings; t timestamptz; existing uuid;
begin
 if u is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if p_request_key is null then return jsonb_build_object('kind','error','code','INVALID_REQUEST'); end if;
 select session_id into sid from public.sejong_bookings where id=p_reservation_id and user_id=u;
 if sid is null then return jsonb_build_object('kind','error','code','RESERVATION_NOT_FOUND'); end if;
 perform 1 from public.sejong_program_sessions where id=sid for update;
 t:=clock_timestamp(); perform sejong_private.expire_session(sid,t);
 select * into b from public.sejong_bookings where id=p_reservation_id and user_id=u for update;
 select id into existing from public.sejong_bookings where user_id=u and confirm_request_key=p_request_key;
 if existing is not null and existing<>b.id then return jsonb_build_object('kind','error','code','IDEMPOTENCY_CONFLICT'); end if;
 if b.confirm_request_key is not null then
  if b.confirm_request_key<>p_request_key then return jsonb_build_object('kind','error','code','IDEMPOTENCY_CONFLICT'); end if;
  return sejong_private.reservation_result(b.id);
 end if;
 if b.status<>'held' then return sejong_private.reservation_result(b.id); end if;
 update public.sejong_bookings set status='reserved_unpaid',expires_at=t+interval '30 minutes',confirm_request_key=p_request_key,confirm_fingerprint=p_reservation_id::text where id=b.id;
 return sejong_private.reservation_result(b.id);
exception when unique_violation then
 return jsonb_build_object('kind','error','code','IDEMPOTENCY_CONFLICT');
end $$;
create function sejong_private.cancel_reservation(p_reservation_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); sid text; t timestamptz;
begin
 if u is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 select session_id into sid from public.sejong_bookings where id=p_reservation_id and user_id=u;
 if sid is null then return jsonb_build_object('kind','error','code','RESERVATION_NOT_FOUND'); end if;
 perform 1 from public.sejong_program_sessions where id=sid for update;
 t:=clock_timestamp(); perform sejong_private.expire_session(sid,t);
 update public.sejong_bookings set status='cancelled' where id=p_reservation_id and user_id=u and status in ('held','reserved_unpaid');
 update public.sejong_session_seats set booking_id=null where session_id=sid and booking_id=p_reservation_id;
 return sejong_private.reservation_result(p_reservation_id);
end $$;
revoke all on all functions in schema sejong_private from public,anon,authenticated;
grant execute on function sejong_private.get_session_seats(text) to anon,authenticated;
grant execute on function sejong_private.hold_seats(text,text[],uuid),sejong_private.confirm_reservation(uuid,uuid),sejong_private.cancel_reservation(uuid) to authenticated;
create function public.get_session_seats(p_session_id text) returns jsonb language sql security invoker set search_path='' as $$ select sejong_private.get_session_seats(p_session_id) $$;
create function public.hold_seats(p_session_id text,p_seat_ids text[],p_request_key uuid) returns jsonb language sql security invoker set search_path='' as $$ select sejong_private.hold_seats(p_session_id,p_seat_ids,p_request_key) $$;
create function public.confirm_reservation(p_reservation_id uuid,p_request_key uuid) returns jsonb language sql security invoker set search_path='' as $$ select sejong_private.confirm_reservation(p_reservation_id,p_request_key) $$;
create function public.cancel_reservation(p_reservation_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select sejong_private.cancel_reservation(p_reservation_id) $$;
revoke all on function public.get_session_seats(text),public.hold_seats(text,text[],uuid),public.confirm_reservation(uuid,uuid),public.cancel_reservation(uuid) from public,anon,authenticated;
grant execute on function public.get_session_seats(text) to anon,authenticated;
grant execute on function public.hold_seats(text,text[],uuid),public.confirm_reservation(uuid,uuid),public.cancel_reservation(uuid) to authenticated;
create function sejong_private.member_reservations() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); sid text; t timestamptz; result jsonb;
begin
 if u is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 for sid in select distinct session_id from public.sejong_bookings where user_id=u and status in ('held','reserved_unpaid') order by session_id loop
  perform 1 from public.sejong_program_sessions where id=sid for update;
  t:=clock_timestamp(); perform sejong_private.expire_session(sid,t);
 end loop;
 select coalesce(jsonb_agg(to_jsonb(b) - 'user_id' - 'hold_request_key' - 'hold_fingerprint' - 'confirm_request_key' - 'confirm_fingerprint'),'[]') into result from (select * from public.sejong_bookings where user_id=u order by created_at desc limit 100) b;
 return result;
end $$;
revoke all on function sejong_private.member_reservations() from public,anon,authenticated;
grant execute on function sejong_private.member_reservations() to authenticated;
create function public.get_member_reservations() returns jsonb language sql security invoker set search_path='' as $$ select sejong_private.member_reservations() $$;
revoke all on function public.get_member_reservations() from public,anon;
grant execute on function public.get_member_reservations() to authenticated;
commit;
