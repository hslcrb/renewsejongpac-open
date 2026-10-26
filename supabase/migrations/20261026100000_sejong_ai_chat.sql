-- 2026-10-26 · 세종 AI 상담: 암호문 보관 및 원자적 사용량 제한
-- Only the Edge Function's service role may access these tables or the quota RPC.
-- Logged-out history is never stored in Postgres.

create table if not exists public.sejong_chat_threads (
    user_id uuid primary key references auth.users(id) on delete cascade,
    iv text not null check (length(iv) between 12 and 64),
    ciphertext text not null check (length(ciphertext) between 1 and 200000),
    updated_at timestamptz not null default now()
);
alter table public.sejong_chat_threads enable row level security;
revoke all on public.sejong_chat_threads from public, anon, authenticated;
grant select, insert, update, delete on public.sejong_chat_threads to service_role;

create table if not exists public.sejong_chat_quota (
    fingerprint text not null check (length(fingerprint) = 64),
    bucket timestamptz not null,
    calls integer not null default 0 check (calls >= 0),
    primary key (fingerprint, bucket)
);
alter table public.sejong_chat_quota enable row level security;
revoke all on public.sejong_chat_quota from public, anon, authenticated;
grant select, insert, update, delete on public.sejong_chat_quota to service_role;

create or replace function public.sejong_chat_take_quota(p_key text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    accepted boolean := false;
begin
    if p_key is null or length(p_key) <> 64 or p_limit is null or p_limit < 1 or p_limit > 100 then
        return false;
    end if;

    insert into public.sejong_chat_quota (fingerprint, bucket, calls)
    values (p_key, date_trunc('hour', now()), 1)
    on conflict (fingerprint, bucket)
    do update set calls = public.sejong_chat_quota.calls + 1
    where public.sejong_chat_quota.calls < p_limit
    returning true into accepted;

    return coalesce(accepted, false);
end;
$$;

revoke all on function public.sejong_chat_take_quota(text, integer)
    from public, anon, authenticated;
grant execute on function public.sejong_chat_take_quota(text, integer) to service_role;

comment on table public.sejong_chat_threads is 'AES-256-GCM ciphertext; decrypted only inside the authenticated Edge Function.';
comment on table public.sejong_chat_quota is 'Hashed caller quota per UTC timestamp hour; no plaintext IP addresses.';
