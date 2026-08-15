-- Phone auth: do not fall back to email as a display name.
-- New users sign in with SMS OTP; display_name comes from signup metadata or complete-profile.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, terms_accepted_at)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz
  );
  return new;
end;
$$ language plpgsql security definer;
