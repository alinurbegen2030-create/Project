create table if not exists public.teamup_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  anonymous boolean not null default false,
  age integer not null,
  gender text not null,
  game text not null,
  platform text not null,
  style text not null,
  language text not null,
  play_time text not null,
  mic boolean not null,
  region text not null,
  goal text not null,
  mode text not null,
  rank text not null,
  experience text not null,
  contact text not null,
  about text not null,
  tags text[] not null default '{}',
  color text not null,
  created_at timestamptz not null default now()
);

alter table public.teamup_profiles enable row level security;

drop policy if exists "teamup profiles are public to read" on public.teamup_profiles;
drop policy if exists "teamup profiles are public to insert" on public.teamup_profiles;
drop policy if exists "teamup profiles are public to delete" on public.teamup_profiles;

create policy "teamup profiles are public to read"
  on public.teamup_profiles for select
  using (true);

create policy "teamup profiles are public to insert"
  on public.teamup_profiles for insert
  with check (true);

create policy "teamup profiles are public to delete"
  on public.teamup_profiles for delete
  using (true);
