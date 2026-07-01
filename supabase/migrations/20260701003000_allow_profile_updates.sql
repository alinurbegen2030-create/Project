drop policy if exists "users can update their own teamup profiles" on public.teamup_profiles;

create policy "users can update their own teamup profiles"
  on public.teamup_profiles for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
