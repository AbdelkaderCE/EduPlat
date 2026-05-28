-- EduPlat Supabase schema
-- Paste this script into the Supabase SQL Editor.
--
-- What it creates:
-- 1) `profiles` linked to `auth.users`
-- 2) `courses`
-- 3) `bundles`
-- 4) `bundle_courses` junction table
-- 5) `user_access` for course/bundle grants
--
-- It also enables Row-Level Security (RLS) and adds helper functions,
-- triggers, and a couple of title-only views for public discovery.

begin;

-- Extensions ---------------------------------------------------------------
create extension if not exists pgcrypto;

-- Enums --------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_role') then
    create type public.profile_role as enum ('student', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'access_item_type') then
    create type public.access_item_type as enum ('course', 'bundle');
  end if;
end
$$;

-- Helper functions ---------------------------------------------------------
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.has_course_access(course_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_is_admin()
    or exists (
      select 1
      from public.user_access ua
      where ua.user_id = auth.uid()
        and ua.access_type = 'course'
        and ua.access_id = course_uuid
    );
$$;

create or replace function public.has_bundle_access(bundle_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_is_admin()
    or exists (
      select 1
      from public.user_access ua
      where ua.user_id = auth.uid()
        and ua.access_type = 'bundle'
        and ua.access_id = bundle_uuid
    );
$$;

-- Core tables --------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.profile_role not null default 'student'
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.bundle_courses (
  bundle_id uuid not null references public.bundles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  primary key (bundle_id, course_id)
);

create table if not exists public.user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  access_type public.access_item_type not null,
  access_id uuid not null,
  granted_at timestamptz not null default now(),
  unique (user_id, access_type, access_id)
);

-- Helpful indexes ----------------------------------------------------------
create index if not exists idx_bundle_courses_bundle_id on public.bundle_courses (bundle_id);
create index if not exists idx_bundle_courses_course_id on public.bundle_courses (course_id);
create index if not exists idx_user_access_user_id on public.user_access (user_id);
create index if not exists idx_user_access_lookup on public.user_access (access_type, access_id);

-- Keep profiles in sync with auth.users ------------------------------------
create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ''),
    'student'::public.profile_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user();

-- Row-Level Security -------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.bundles enable row level security;
alter table public.bundle_courses enable row level security;
alter table public.user_access enable row level security;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.bundles to authenticated;
grant select, insert, update, delete on public.bundle_courses to authenticated;
grant select, insert, update, delete on public.user_access to authenticated;

-- Profiles: users read their own row, admins read all.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

-- Courses: authenticated users discover titles via `course_catalog` below.
-- Direct access to the base table is restricted to users with verified course access.
drop policy if exists "courses_select_verified" on public.courses;
create policy "courses_select_verified"
  on public.courses
  for select
  to authenticated
  using (public.has_course_access(id));

drop policy if exists "courses_write_admin" on public.courses;
create policy "courses_write_admin"
  on public.courses
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Bundles: authenticated users discover titles via `bundle_catalog` below.
-- Direct access to the base table is restricted to users with verified bundle access.
drop policy if exists "bundles_select_verified" on public.bundles;
create policy "bundles_select_verified"
  on public.bundles
  for select
  to authenticated
  using (public.has_bundle_access(id));

drop policy if exists "bundles_write_admin" on public.bundles;
create policy "bundles_write_admin"
  on public.bundles
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- bundle_courses: bundle structure is visible only to users who can access the bundle.
drop policy if exists "bundle_courses_select_verified" on public.bundle_courses;
create policy "bundle_courses_select_verified"
  on public.bundle_courses
  for select
  to authenticated
  using (public.has_bundle_access(bundle_id));

drop policy if exists "bundle_courses_write_admin" on public.bundle_courses;
create policy "bundle_courses_write_admin"
  on public.bundle_courses
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- user_access: users can see only their own grants; admins can read/write all.
drop policy if exists "user_access_select_own" on public.user_access;
create policy "user_access_select_own"
  on public.user_access
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_access_select_admin" on public.user_access;
create policy "user_access_select_admin"
  on public.user_access
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "user_access_write_admin" on public.user_access;
create policy "user_access_write_admin"
  on public.user_access
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "user_access_update_admin" on public.user_access;
create policy "user_access_update_admin"
  on public.user_access
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "user_access_delete_admin" on public.user_access;
create policy "user_access_delete_admin"
  on public.user_access
  for delete
  to authenticated
  using (public.current_user_is_admin());

-- Public catalog views -----------------------------------------------------
-- These views expose only the safe, title-level metadata for authenticated users.
-- The base tables remain protected by RLS for structural content.
create or replace view public.course_catalog as
select
  c.id,
  c.title,
  c.created_at
from public.courses c;

create or replace view public.bundle_catalog as
select
  b.id,
  b.title,
  b.created_at
from public.bundles b;

grant select on public.course_catalog to authenticated;
grant select on public.bundle_catalog to authenticated;

commit;
