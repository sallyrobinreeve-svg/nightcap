-- Track when user last viewed notifications (for unread badge)

alter table public.profiles
  add column if not exists last_notifications_seen_at timestamptz;
