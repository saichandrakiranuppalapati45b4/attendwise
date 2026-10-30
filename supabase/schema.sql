-- ==============================================================================
-- AttendWise Comprehensive Database Schema
-- Compatible with PostgreSQL 15+ / 17 on Supabase
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Helper Function to check if the current user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    coalesce(auth.jwt()->>'email', '') = '24pa1a45b4@vishnu.edu.in'
  );
end;
$$ language plpgsql security definer;

-- 2. Branches Table
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS for Branches
alter table public.branches enable row level security;

drop policy if exists "Anyone can view branches" on public.branches;
create policy "Anyone can view branches" on public.branches
  for select
  using (true);

drop policy if exists "Admins can insert branches" on public.branches;
create policy "Admins can insert branches" on public.branches
  for insert
  with check (public.is_admin());

drop policy if exists "Admins can update branches" on public.branches;
create policy "Admins can update branches" on public.branches
  for update
  using (public.is_admin());

drop policy if exists "Admins can delete branches" on public.branches;
create policy "Admins can delete branches" on public.branches
  for delete
  using (public.is_admin());

-- Pre-populate common branches
insert into public.branches (name) values
  ('Computer Science and Engineering (CSE)'),
  ('Information Technology (IT)'),
  ('Electronics and Communication Engineering (ECE)'),
  ('Electrical and Electronics Engineering (EEE)'),
  ('Mechanical Engineering (MECH)'),
  ('Civil Engineering (CIVIL)'),
  ('Artificial Intelligence & Data Science (AI&DS)'),
  ('Artificial Intelligence & Machine Learning (AI&ML)'),
  ('Computer Science and Business Systems (CSBS)')
on conflict (name) do nothing;

-- 3. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  branch text,
  required_percentage integer default 75 check (required_percentage >= 1 and required_percentage <= 100),
  sem_end_date date,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;

drop policy if exists "Users and admins can view profiles" on public.profiles;
create policy "Users and admins can view profiles" on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users and admins can delete profiles" on public.profiles;
create policy "Users and admins can delete profiles" on public.profiles
  for delete
  using (auth.uid() = id or public.is_admin());

-- Trigger for new user signup to automatically create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, branch, required_percentage)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'Student'),
    new.raw_user_meta_data->>'branch',
    75
  )
  on conflict (id) do update set
    name = excluded.name,
    branch = coalesce(excluded.branch, public.profiles.branch);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Subjects Table
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  subject_name text not null,
  subject_code text,
  past_conducted integer default 0 check (past_conducted >= 0),
  past_attended integer default 0 check (past_attended >= 0),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS for Subjects
alter table public.subjects enable row level security;

drop policy if exists "Users and admins can view subjects" on public.subjects;
create policy "Users and admins can view subjects" on public.subjects
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own subjects" on public.subjects;
create policy "Users can insert own subjects" on public.subjects
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own subjects" on public.subjects;
create policy "Users can update own subjects" on public.subjects
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users and admins can delete subjects" on public.subjects;
create policy "Users and admins can delete subjects" on public.subjects
  for delete
  using (auth.uid() = user_id or public.is_admin());

-- 5. Timetable Table
create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6), 
  period_number integer not null check (period_number >= 1 and period_number <= 12),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, day_of_week, period_number)
);

-- RLS for Timetable
alter table public.timetable enable row level security;

drop policy if exists "Users and admins can view timetable" on public.timetable;
create policy "Users and admins can view timetable" on public.timetable
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own timetable" on public.timetable;
create policy "Users can insert own timetable" on public.timetable
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own timetable" on public.timetable;
create policy "Users can update own timetable" on public.timetable
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users and admins can delete timetable" on public.timetable;
create policy "Users and admins can delete timetable" on public.timetable
  for delete
  using (auth.uid() = user_id or public.is_admin());

-- 6. Attendance Table
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  date date not null,
  status text not null check (status in ('present', 'absent', 'cancelled')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, subject_id, date) 
);

-- RLS for Attendance
alter table public.attendance enable row level security;

drop policy if exists "Users and admins can view attendance" on public.attendance;
create policy "Users and admins can view attendance" on public.attendance
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own attendance" on public.attendance;
create policy "Users can insert own attendance" on public.attendance
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own attendance" on public.attendance;
create policy "Users can update own attendance" on public.attendance
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users and admins can delete attendance" on public.attendance;
create policy "Users and admins can delete attendance" on public.attendance
  for delete
  using (auth.uid() = user_id or public.is_admin());

-- 7. Admin Delete Student RPC Function (Called from AdminStudents.jsx)
create or replace function public.delete_user(target_user_id uuid)
returns void as $$
begin
  -- Only the admin is permitted to delete other users
  if not public.is_admin() then
    raise exception 'Unauthorized: Only system administrators can delete users.';
  end if;

  -- Delete from auth.users (cascades to public.profiles and related tables)
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;

-- 8. Performance Indexes
create index if not exists idx_profiles_branch on public.profiles(branch);
create index if not exists idx_subjects_user_id on public.subjects(user_id);
create index if not exists idx_timetable_user_day on public.timetable(user_id, day_of_week);
create index if not exists idx_timetable_subject_id on public.timetable(subject_id);
create index if not exists idx_attendance_user_date on public.attendance(user_id, date);
create index if not exists idx_attendance_user_subject on public.attendance(user_id, subject_id);
create index if not exists idx_attendance_user_status on public.attendance(user_id, status);

-- 9. Explicit Grants for PostgREST Data API
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;
