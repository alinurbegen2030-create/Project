create table if not exists public.teamup_reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.teamup_reviews enable row level security;

drop policy if exists "teamup reviews are public to read" on public.teamup_reviews;
drop policy if exists "signed in users can write teamup reviews" on public.teamup_reviews;
drop policy if exists "users can delete their own teamup reviews" on public.teamup_reviews;

create policy "teamup reviews are public to read"
  on public.teamup_reviews for select
  using (true);

create policy "signed in users can write teamup reviews"
  on public.teamup_reviews for insert
  with check (auth.uid() = author_id);

create policy "users can delete their own teamup reviews"
  on public.teamup_reviews for delete
  using (auth.uid() = author_id);
