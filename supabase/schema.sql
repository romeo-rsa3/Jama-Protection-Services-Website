-- ============================================================
-- JAMA PROTECTION SERVICES — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Project → SQL Editor → New query → paste → Run)
-- ============================================================

-- 1. REVIEWS TABLE ------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  rating      smallint not null check (rating between 1 and 5),
  message     text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Anyone (anonymous visitors) may submit a review, but ONLY as
-- 'pending' — they cannot insert a row that is already approved.
create policy "public can submit pending reviews"
  on public.reviews for insert
  to anon
  with check (status = 'pending');

-- Anyone may read reviews, but ONLY those already approved.
-- Pending/rejected reviews are invisible to the public.
create policy "public can read approved reviews"
  on public.reviews for select
  to anon
  using (status = 'approved');

-- 2. ADMINS TABLE ---------------------------------------------------
-- Marks which authenticated Supabase-Auth users are allowed to
-- moderate reviews. A user existing in Supabase Auth is NOT
-- enough on its own — they must also have a row here.
create table if not exists public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Admins may see only their own row (just enough to confirm status).
create policy "admin can read own row"
  on public.admins for select
  to authenticated
  using (auth.uid() = user_id);

-- 3. ADMIN ACCESS TO REVIEWS -----------------------------------------
-- Logged-in users who are listed in `admins` can read every review
-- regardless of status, and can update status (approve / reject /
-- unpublish). Everyone else is still restricted by the policies above.
create policy "admins can read all reviews"
  on public.reviews for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "admins can update review status"
  on public.reviews for update
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ============================================================
-- SETTING UP YOUR FIRST ADMIN LOGIN
-- ============================================================
-- 1. In Supabase: Authentication → Users → Add user
--    Create the admin's email + password (this is the login
--    they'll use on /admin.html).
-- 2. Copy that user's UUID from the Users table.
-- 3. Run this, replacing the values:
--
--    insert into public.admins (user_id, email)
--    values ('paste-the-user-uuid-here', 'admin@jamaprotection.co.za');
--
-- Only rows present in `admins` can moderate reviews — creating
-- a Supabase Auth login alone does not grant access.
-- ============================================================
