-- Night Out Journal - Social Features Migration
-- Run this in your Supabase SQL Editor after 001_initial_schema.sql

-- 1. follows table (one-way follow relationship)
create table public.follows (
  follower_id uuid references auth.users on delete cascade not null,
  following_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

alter table public.follows enable row level security;

create policy "Users can view all follows" on public.follows for select using (true);
create policy "Users can insert own follows" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can delete own follows" on public.follows for delete using (auth.uid() = follower_id);

create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);

-- 2. comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.entries on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Users can view comments on viewable entries" on public.comments for select using (
  exists (
    select 1 from public.entries e
    where e.id = comments.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = e.user_id))
    )
  )
);

create policy "Users can insert comments on viewable entries" on public.comments for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.entries e
    where e.id = comments.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = e.user_id))
    )
  )
);

create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

create index idx_comments_entry on public.comments(entry_id);

-- 3. reactions table (one reaction per user per entry)
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.entries on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('fire', 'heart', 'laugh', 'wild')) not null,
  created_at timestamptz default now() not null,
  unique(entry_id, user_id)
);

alter table public.reactions enable row level security;

create policy "Users can view reactions on viewable entries" on public.reactions for select using (
  exists (
    select 1 from public.entries e
    where e.id = reactions.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = e.user_id))
    )
  )
);

create policy "Users can manage own reactions" on public.reactions for all using (auth.uid() = user_id);
create policy "Users can insert reactions on viewable entries" on public.reactions for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.entries e
    where e.id = reactions.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = e.user_id))
    )
  )
);

create index idx_reactions_entry on public.reactions(entry_id);

-- 4. entry_tags table (tagged friends in entries)
create table public.entry_tags (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.entries on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(entry_id, user_id)
);

alter table public.entry_tags enable row level security;

create policy "Users can view entry tags on viewable entries" on public.entry_tags for select using (
  exists (
    select 1 from public.entries e
    where e.id = entry_tags.entry_id
    and (
      e.user_id = auth.uid()
      or (e.visibility = 'public')
      or (e.visibility = 'friends' and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = e.user_id))
    )
  )
);

create policy "Entry owner can add tags" on public.entry_tags for insert with check (
  exists (select 1 from public.entries e where e.id = entry_tags.entry_id and e.user_id = auth.uid())
);

create policy "Entry owner or tagged user can remove tags" on public.entry_tags for delete using (
  exists (select 1 from public.entries e where e.id = entry_tags.entry_id and e.user_id = auth.uid())
  or auth.uid() = user_id
);

create index idx_entry_tags_entry on public.entry_tags(entry_id);

-- 5. Update entries RLS - add policy for friends to view friends-only entries
create policy "Friends can view friends-only entries" on public.entries for select using (
  visibility = 'friends'
  and auth.role() = 'authenticated'
  and auth.uid() != user_id
  and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = user_id)
);

-- 6. Index on display_name for friend search
create index idx_profiles_display_name on public.profiles(display_name);
create index idx_profiles_display_name_lower on public.profiles(lower(display_name));
