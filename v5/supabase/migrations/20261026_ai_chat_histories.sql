-- Managed only by the server-side service role. All contents are AES-256-GCM ciphertext.
create table if not exists public.ai_chat_histories (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ciphertext text not null,
  updated_at timestamptz not null default now()
);
alter table public.ai_chat_histories enable row level security;
-- No public/anon/authenticated policy: only backend service role may access rows.
revoke all on public.ai_chat_histories from anon, authenticated;
create index if not exists ai_chat_histories_updated_at_idx on public.ai_chat_histories(updated_at);
