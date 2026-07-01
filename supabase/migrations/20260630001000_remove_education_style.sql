update public.teamup_profiles
set
  style = 'Chill',
  tags = array_replace(array_replace(tags, 'Learning', 'Chill'), 'education', 'Chill')
where style in ('Learning', 'education')
  or 'Learning' = any(tags)
  or 'education' = any(tags);
