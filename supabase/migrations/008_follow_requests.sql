-- Follow requests: pending / accepted / rejected

alter table public.follows
  add column if not exists status text
  check (status in ('pending', 'accepted', 'rejected'))
  default 'pending' not null;

-- Existing instant follows become accepted
update public.follows set status = 'accepted';

create index if not exists idx_follows_status on public.follows(status);
create index if not exists idx_follows_following_status on public.follows(following_id, status);

-- Target user can accept or reject incoming requests
create policy "Users can respond to follow requests" on public.follows
  for update using (auth.uid() = following_id)
  with check (auth.uid() = following_id);

-- Helper: accepted follow check used in entry policies
create or replace function public.is_accepted_follow(viewer uuid, author uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.follows f
    where f.follower_id = viewer
      and f.following_id = author
      and f.status = 'accepted'
  );
$$;

-- Recreate entries friends policy with accepted status
drop policy if exists "Friends can view friends-only entries" on public.entries;
create policy "Friends can view friends-only entries" on public.entries for select using (
  visibility = 'friends'
  and auth.role() = 'authenticated'
  and auth.uid() != user_id
  and public.is_accepted_follow(auth.uid(), user_id)
);

-- Update comments policies
drop policy if exists "Users can view comments on viewable entries" on public.comments;
create policy "Users can view comments on viewable entries" on public.comments for select using (
  exists (
    select 1 from public.entries e
    where e.id = comments.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and public.is_accepted_follow(auth.uid(), e.user_id))
    )
  )
);

drop policy if exists "Users can insert comments on viewable entries" on public.comments;
create policy "Users can insert comments on viewable entries" on public.comments for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.entries e
    where e.id = comments.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and public.is_accepted_follow(auth.uid(), e.user_id))
    )
  )
);

-- Update reactions policies
drop policy if exists "Users can view reactions on viewable entries" on public.reactions;
create policy "Users can view reactions on viewable entries" on public.reactions for select using (
  exists (
    select 1 from public.entries e
    where e.id = reactions.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and public.is_accepted_follow(auth.uid(), e.user_id))
    )
  )
);

drop policy if exists "Users can insert reactions on viewable entries" on public.reactions;
create policy "Users can insert reactions on viewable entries" on public.reactions for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.entries e
    where e.id = reactions.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and public.is_accepted_follow(auth.uid(), e.user_id))
    )
  )
);

-- Update entry_tags policies
drop policy if exists "Users can view entry tags on viewable entries" on public.entry_tags;
create policy "Users can view entry tags on viewable entries" on public.entry_tags for select using (
  exists (
    select 1 from public.entries e
    where e.id = entry_tags.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and public.is_accepted_follow(auth.uid(), e.user_id))
    )
  )
);
