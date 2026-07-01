create table if not exists public.teamup_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.teamup_profiles (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.teamup_messages enable row level security;

drop policy if exists "teamup messages are public to read" on public.teamup_messages;
drop policy if exists "signed in users can write teamup messages" on public.teamup_messages;

create policy "teamup messages are public to read"
  on public.teamup_messages for select
  using (true);

create policy "signed in users can write teamup messages"
  on public.teamup_messages for insert
  with check (auth.uid() = author_id);
