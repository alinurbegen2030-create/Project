alter table public.teamup_profiles
  add column if not exists avatar_url text not null default '',
  add column if not exists effect text not null default 'glow';
