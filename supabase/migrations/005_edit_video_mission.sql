-- NightCap - Edit entries, video, mission completed
-- Run after 004_user_stats.sql

-- Add video_url to entries
alter table public.entries add column if not exists video_url text;

-- Add missions_completed to user_stats
alter table public.user_stats add column if not exists missions_completed integer default 0 not null;

-- Update recalc_user_stats to include missions_completed
-- Count: entries with mission (tonightsObjective) AND missionCompleted = true
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
  v_missions int;
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

  select count(*) into v_missions
  from entries
  where user_id = p_user_id
    and prompts is not null
    and coalesce(trim(prompts->>'tonightsObjective'), '') != ''
    and (prompts->>'missionCompleted')::boolean = true;

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

  insert into public.user_stats (user_id, total_entries, avg_rating, total_rated_entries, kiss_count, missions_completed, top_club_name, top_club_visits, updated_at)
  values (p_user_id, v_total, v_avg, coalesce(v_rated, 0), v_kisses, coalesce(v_missions, 0), v_top_club, coalesce(v_top_visits, 0), now())
  on conflict (user_id) do update set
    total_entries = excluded.total_entries,
    avg_rating = excluded.avg_rating,
    total_rated_entries = excluded.total_rated_entries,
    kiss_count = excluded.kiss_count,
    missions_completed = coalesce(excluded.missions_completed, 0),
    top_club_name = excluded.top_club_name,
    top_club_visits = excluded.top_club_visits,
    updated_at = now();
end;
$$;

-- Backfill missions_completed for existing users
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
