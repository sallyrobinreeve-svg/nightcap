-- NightCapt - UGC Safeguards (App Store Guideline 1.2)
-- Block users, report content, terms acceptance

-- 1. blocks table
create table if not exists public.blocks (
  blocker_id uuid references auth.users on delete cascade not null,
  blocked_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id != blocked_id)
);

alter table public.blocks enable row level security;

create policy "Users can view own blocks" on public.blocks for select using (auth.uid() = blocker_id);
create policy "Users can block others" on public.blocks for insert with check (auth.uid() = blocker_id);
create policy "Users can unblock" on public.blocks for delete using (auth.uid() = blocker_id);

create index if not exists idx_blocks_blocker on public.blocks(blocker_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);

-- 2. reports table
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references auth.users on delete cascade not null,
  reported_user_id uuid references auth.users on delete cascade not null,
  entry_id uuid references public.entries on delete cascade,
  comment_id uuid references public.comments on delete cascade,
  reason text,
  status text check (status in ('pending', 'reviewed', 'resolved')) default 'pending' not null,
  created_at timestamptz default now() not null
);

alter table public.reports enable row level security;

create policy "Users can create reports" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "Users can view own reports" on public.reports for select using (auth.uid() = reporter_id);

create index if not exists idx_reports_reporter on public.reports(reporter_id);
create index if not exists idx_reports_status on public.reports(status);

-- 3. terms_accepted_at on profiles
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
