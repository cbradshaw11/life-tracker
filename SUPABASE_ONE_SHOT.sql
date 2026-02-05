-- Life Tracker - Supabase One-Shot Setup
-- Copy this entire file and paste into Supabase Dashboard → SQL Editor → New Query, then Run.

-- 1. Create track_types table
create table track_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null,
  color text not null,
  value_type text not null check (value_type in ('count', 'duration', 'boolean')),
  value_unit text,
  duration_unit text check (duration_unit in ('minutes', 'hours')),
  created_at timestamptz default now()
);

create index track_types_user_id on track_types(user_id);

-- 2. Create entries table
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date text not null,
  track_type_id uuid references track_types(id) on delete cascade not null,
  value numeric,
  note text,
  created_at timestamptz default now()
);

create index entries_user_id on entries(user_id);
create index entries_date on entries(user_id, date);

-- 3. Enable Row Level Security
alter table track_types enable row level security;
alter table entries enable row level security;

-- 4. RLS Policies
create policy "Users can CRUD own track_types"
  on track_types for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can CRUD own entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
