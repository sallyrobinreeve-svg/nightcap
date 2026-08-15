-- Persist terms acceptance captured during Supabase signup.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, terms_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    nullif(new.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz
  );
  return new;
end;
$$ language plpgsql security definer;
