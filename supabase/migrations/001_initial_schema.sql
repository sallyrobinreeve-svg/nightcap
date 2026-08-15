-- Night Out Journal - Initial Schema
-- Run this in your Supabase SQL Editor to create the tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Entries (night out journal entries)
create table public.entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date_of_night date not null,
  rating integer check (rating >= 1 and rating <= 5),
  prompts jsonb default '{}',
  visibility text check (visibility in ('private', 'friends', 'public')) default 'friends',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Timeline steps (Pres, Club, Bar, Afters, Other)
create table public.timeline_steps (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.entries on delete cascade not null,
  type text check (type in ('pres', 'club', 'bar', 'afters', 'other')) not null,
  location_name text,
  time_at time,
  notes text,
  photo_url text,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Photos (outfit, favourite, timeline step)
create table public.photos (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.entries on delete cascade not null,
  type text check (type in ('outfit', 'favourite', 'step')) not null,
  url text not null,
  timeline_step_id uuid references public.timeline_steps on delete set null,
  created_at timestamptz default now() not null
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.timeline_steps enable row level security;
alter table public.photos enable row level security;

-- Profiles: users can read all, update own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Entries: CRUD for own, read based on visibility
create policy "Users can create own entries" on public.entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on public.entries for update using (auth.uid() = user_id);
create policy "Users can delete own entries" on public.entries for delete using (auth.uid() = user_id);
create policy "Users can view own entries" on public.entries for select using (auth.uid() = user_id);
create policy "Public entries viewable by authenticated users" on public.entries for select using (
  visibility = 'public' and auth.role() = 'authenticated'
);

-- Timeline steps: via entry ownership
create policy "Users can manage timeline steps for own entries" on public.timeline_steps for all using (
  exists (select 1 from public.entries where entries.id = timeline_steps.entry_id and entries.user_id = auth.uid())
);

-- Photos: via entry ownership
create policy "Users can manage photos for own entries" on public.photos for all using (
  exists (select 1 from public.entries where entries.id = photos.entry_id and entries.user_id = auth.uid())
);

-- Storage bucket for photos (run separately in Supabase Dashboard or add to migration)
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', true);
-- create policy "Authenticated users can upload photos" on storage.objects for insert with check (auth.role() = 'authenticated');
-- create policy "Photos are publicly readable" on storage.objects for select using (true);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
