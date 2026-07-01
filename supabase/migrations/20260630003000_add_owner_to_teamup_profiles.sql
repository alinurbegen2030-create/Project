alter table public.teamup_profiles
  add column if not exists owner_id uuid references auth.users (id) on delete set null;
