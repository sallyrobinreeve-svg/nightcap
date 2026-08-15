-- NightCap - User statistics (compiled as each entry is entered)
-- Run after 003_prompts_and_emoji.sql

-- user_stats: per-user aggregates, updated by triggers
create table if not exists public.user_stats (
  user_id uuid references auth.users on delete cascade primary key,
  total_entries integer default 0 not null,
  avg_rating numeric(4,2) default null,
  total_rated_entries integer default 0 not null,
  kiss_count integer default 0 not null,  -- entries with whoKissedWho filled
  top_club_name text default null,
  top_club_visits integer default 0 not null,
  updated_at timestamptz default now() not null
);

alter table public.user_stats enable row level security;

create policy "Users can view own stats" on public.user_stats
  for select using (auth.uid() = user_id);

-- Function to recalculate stats for a user
create or replace function public.recalc_user_stats(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_avg numeric;
  v_rated int;
  v_kisses int;
  v_top_club text;
  v_top_visits int;
begin
  select count(*) into v_total from entries where user_id = p_user_id;

  select coalesce(avg(rating)::numeric(4,2), null), count(*)
  into v_avg, v_rated
  from entries where user_id = p_user_id and rating is not null;

  select count(*) into v_kisses
  from entries
  where user_id = p_user_id
    and prompts is not null
    and coalesce(trim(prompts->>'whoKissedWho'), '') != '';

  select location_name, cnt into v_top_club, v_top_visits
  from (
    select ts.location_name, count(*)::int as cnt
    from timeline_steps ts
    join entries e on e.id = ts.entry_id and e.user_id = p_user_id
    where ts.type = 'club' and ts.location_name is not null and trim(ts.location_name) != ''
    group by ts.location_name
    order by cnt desc
    limit 1
  ) sub;

  insert into public.user_stats (user_id, total_entries, avg_rating, total_rated_entries, kiss_count, top_club_name, top_club_visits, updated_at)
  values (p_user_id, v_total, v_avg, coalesce(v_rated, 0), v_kisses, v_top_club, coalesce(v_top_visits, 0), now())
  on conflict (user_id) do update set
    total_entries = excluded.total_entries,
    avg_rating = excluded.avg_rating,
    total_rated_entries = excluded.total_rated_entries,
    kiss_count = excluded.kiss_count,
    top_club_name = excluded.top_club_name,
    top_club_visits = excluded.top_club_visits,
    updated_at = now();
end;
$$;

-- Trigger: when entry is inserted/updated/deleted, recalc that user's stats
create or replace function public.trigger_recalc_stats_on_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    perform recalc_user_stats(old.user_id);
    return old;
  else
    perform recalc_user_stats(new.user_id);
    return new;
  end if;
end;
$$;

drop trigger if exists on_entry_change_recalc_stats on public.entries;
create trigger on_entry_change_recalc_stats
  after insert or update or delete on public.entries
  for each row execute procedure public.trigger_recalc_stats_on_entry();

-- Trigger: when timeline_step is inserted/updated/deleted, recalc stats for entry owner
create or replace function public.trigger_recalc_stats_on_timeline_step()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if TG_OP = 'DELETE' then
    select user_id into v_user_id from entries where id = old.entry_id;
  else
    select user_id into v_user_id from entries where id = new.entry_id;
  end if;
  if v_user_id is not null then
    perform recalc_user_stats(v_user_id);
  end if;
  if TG_OP = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists on_timeline_step_change_recalc_stats on public.timeline_steps;
create trigger on_timeline_step_change_recalc_stats
  after insert or update or delete on public.timeline_steps
  for each row execute procedure public.trigger_recalc_stats_on_timeline_step();

-- Backfill: run recalc for all existing users with entries
do $$
declare
  r record;
begin
  for r in select distinct user_id from public.entries
  loop
    perform recalc_user_stats(r.user_id);
  end loop;
end;
$$;
