-- Allow viewing photos & timeline on entries the user can already see

drop policy if exists "Users can manage photos for own entries" on public.photos;

create policy "Users can manage own entry photos" on public.photos
  for all using (
    exists (
      select 1 from public.entries e
      where e.id = photos.entry_id and e.user_id = auth.uid()
    )
  );

create policy "View photos on viewable entries" on public.photos
  for select using (
    exists (
      select 1 from public.entries e
      where e.id = photos.entry_id
      and (
        e.user_id = auth.uid()
        or (e.visibility = 'public' and auth.role() = 'authenticated')
        or (e.visibility = 'friends' and public.is_accepted_follow(auth.uid(), e.user_id))
      )
    )
  );

drop policy if exists "Users can manage timeline steps for own entries" on public.timeline_steps;

create policy "Users can manage own timeline steps" on public.timeline_steps
  for all using (
    exists (
      select 1 from public.entries e
      where e.id = timeline_steps.entry_id and e.user_id = auth.uid()
    )
  );

create policy "View timeline on viewable entries" on public.timeline_steps
  for select using (
    exists (
      select 1 from public.entries e
      where e.id = timeline_steps.entry_id
      and (
        e.user_id = auth.uid()
        or (e.visibility = 'public' and auth.role() = 'authenticated')
        or (e.visibility = 'friends' and public.is_accepted_follow(auth.uid(), e.user_id))
      )
    )
  );
