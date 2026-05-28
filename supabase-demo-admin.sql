-- Demo admin promotion helper
-- Paste this into the Supabase SQL Editor after you have created a user account
-- with the email you want to use as your demo admin.
--
-- Replace the email below with the email of an existing auth user.

begin;

do $$
declare
  target_email text := 'you@example.com';
  target_user_id uuid;
  target_user_email text;
begin
  select id, email
    into target_user_id, target_user_email
  from auth.users
  where email = target_email
  limit 1;

  if target_user_id is null then
    raise exception 'No auth user found for %', target_email;
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    target_user_id,
    target_user_email,
    'Demo Admin',
    'admin'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        role = 'admin';
end
$$;

commit;

-- After running this script, sign out and sign back in if needed,
-- then open `/admin` to view the admin dashboard.
