
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  required_percentage integer default 75,
  sem_end_date date, -- Added semester end date
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Trigger for new user signup to automatically create profile
create or replace function public.handle_new_user()
returns trigger as $$$
begin
  insert into public.profiles (id, name, required_percentage)
  values (new.id, new.raw_user_meta_data->>'full_name', 75);
  return new;
end;
$$$ language plpgsql security definer;

-- Drop trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Subjects Table
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  subject_name text not null,
  subject_code text,
  past_conducted integer default 0, -- Prior periods held before the app
  past_attended integer default 0,  -- Prior periods attended before the app
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Subjects
alter table public.subjects enable row level security;
create policy "Users can view own subjects" on public.subjects for select using (auth.uid() = user_id);
create policy "Users can insert own subjects" on public.subjects for insert with check (auth.uid() = user_id);
create policy "Users can update own subjects" on public.subjects for update using (auth.uid() = user_id);
create policy "Users can delete own subjects" on public.subjects for delete using (auth.uid() = user_id);

-- 3. Timetable Table
create table if not exists public.timetable (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 1 and day_of_week <= 6), 
  period_number integer not null check (period_number >= 1 and period_number <= 8),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, day_of_week, period_number)
);

-- RLS for Timetable
alter table public.timetable enable row level security;
create policy "Users can view own timetable" on public.timetable for select using (auth.uid() = user_id);
create policy "Users can insert own timetable" on public.timetable for insert with check (auth.uid() = user_id);
create policy "Users can update own timetable" on public.timetable for update using (auth.uid() = user_id);
create policy "Users can delete own timetable" on public.timetable for delete using (auth.uid() = user_id);

-- 4. Attendance Table
create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  date date not null,
  status text check (status in ('present', 'absent', 'cancelled')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, subject_id, date) 
);

-- RLS for Attendance
alter table public.attendance enable row level security;
create policy "Users can view own attendance" on public.attendance for select using (auth.uid() = user_id);
create policy "Users can insert own attendance" on public.attendance for insert with check (auth.uid() = user_id);
create policy "Users can update own attendance" on public.attendance for update using (auth.uid() = user_id);
create policy "Users can delete own attendance" on public.attendance for delete using (auth.uid() = user_id);

