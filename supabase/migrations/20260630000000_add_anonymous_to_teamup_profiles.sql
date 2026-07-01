alter table public.teamup_profiles
  add column if not exists anonymous boolean not null default false;
