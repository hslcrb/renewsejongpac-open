-- [인증한 회원의 데이터와 소유권 / Authenticated member data and ownership]
begin;
create table public.sejong_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    name text not null default '' check (char_length(name) <= 80),
    email text not null default '',
    phone text not null default '' check (char_length(phone) <= 40),
    updated_at timestamptz not null default now()
);
create table public.sejong_spaces (
    user_id uuid primary key references auth.users(id) on delete cascade,
    nickname text not null default '' check (char_length(nickname) <= 24),
    message text not null default '' check (char_length(message) <= 100),
    theme text not null default 'paper' check (theme in ('paper', 'sky', 'sun')),
    light_on boolean not null default true,
    updated_at timestamptz not null default now()
);
create table public.sejong_favorites (
    user_id uuid not null references auth.users(id) on delete cascade,
    program_id text not null check (char_length(program_id) between 1 and 128),
    created_at timestamptz not null default now(),
    primary key (user_id, program_id)
);
create table public.sejong_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    program_id text not null check (char_length(program_id) between 1 and 128),
    event_date date not null,
    body text not null check (char_length(trim(body)) between 1 and 500),
    created_at timestamptz not null default now()
);
create index sejong_notes_member_created on public.sejong_notes (user_id, created_at desc);
create table public.sejong_bookings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    program_id text not null check (char_length(program_id) between 1 and 128),
    title text not null check (char_length(title) between 1 and 300),
    event_date date not null,
    event_time time not null,
    venue text not null check (char_length(venue) between 1 and 200),
    seats text[] not null check (cardinality(seats) between 1 and 4),
    total integer not null check (total >= 0),
    status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
    created_at timestamptz not null default now()
);
create index sejong_bookings_member_created on public.sejong_bookings (user_id, created_at desc);

-- [공개 역할에는 접근을 주지 않고 회원별 행만 허용 / Only own rows, no anonymous grants]
alter table public.sejong_profiles enable row level security;
alter table public.sejong_spaces enable row level security;
alter table public.sejong_favorites enable row level security;
alter table public.sejong_notes enable row level security;
alter table public.sejong_bookings enable row level security;
revoke all on public.sejong_profiles, public.sejong_spaces, public.sejong_favorites, public.sejong_notes, public.sejong_bookings from public, anon, authenticated;
grant select, insert, update on public.sejong_profiles, public.sejong_spaces, public.sejong_bookings to authenticated;
grant select, insert, update, delete on public.sejong_favorites, public.sejong_notes to authenticated;

create policy profiles_member_select on public.sejong_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_member_insert on public.sejong_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_member_update on public.sejong_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy spaces_member_select on public.sejong_spaces for select to authenticated using ((select auth.uid()) = user_id);
create policy spaces_member_insert on public.sejong_spaces for insert to authenticated with check ((select auth.uid()) = user_id);
create policy spaces_member_update on public.sejong_spaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy favorites_member_select on public.sejong_favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy favorites_member_insert on public.sejong_favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy favorites_member_update on public.sejong_favorites for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy favorites_member_delete on public.sejong_favorites for delete to authenticated using ((select auth.uid()) = user_id);
create policy notes_member_select on public.sejong_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy notes_member_insert on public.sejong_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notes_member_update on public.sejong_notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy notes_member_delete on public.sejong_notes for delete to authenticated using ((select auth.uid()) = user_id);
create policy bookings_member_select on public.sejong_bookings for select to authenticated using ((select auth.uid()) = user_id);
create policy bookings_member_insert on public.sejong_bookings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy bookings_member_update on public.sejong_bookings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;
