create table if not exists public.teamup_user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  icon text not null default 'TU',
  updated_at timestamptz not null default now()
);

alter table public.teamup_user_settings enable row level security;

drop policy if exists "users can read their own teamup settings" on public.teamup_user_settings;
drop policy if exists "users can write their own teamup settings" on public.teamup_user_settings;

create policy "users can read their own teamup settings"
  on public.teamup_user_settings for select
  using (auth.uid() = user_id);

create policy "users can write their own teamup settings"
  on public.teamup_user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
