-- NightCap - Prompts expansion, timeline emoji, username
-- Run after 002_social_features.sql

-- Add username to profiles
alter table public.profiles add column if not exists username text unique;
create index if not exists idx_profiles_username on public.profiles(username);

-- Add emoji to timeline_steps
alter table public.timeline_steps add column if not exists emoji text;

-- Entries.rating: support 1-10 for "chaos" scale (optional - keep 1-5 for night rating)
-- We'll store chaos_rating in prompts JSON for now, no schema change needed.
