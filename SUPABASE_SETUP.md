# Supabase Setup Guide

Follow these steps to configure Supabase for the Life Tracker app.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose an organization, name your project, set a database password, and select a region
4. Wait for the project to be provisioned

## 2. Create Tables

In the Supabase Dashboard, go to **SQL Editor** and run the following in order.

### track_types table

```sql
create table track_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null,
  color text not null,
  value_type text not null check (value_type in ('count', 'duration', 'boolean')),
  value_unit text,
  duration_unit text check (duration_unit in ('minutes', 'hours')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index track_types_user_id on track_types(user_id);
```

### entries table

```sql
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
```

## 3. Enable Row Level Security (RLS)

Run in SQL Editor:

```sql
alter table track_types enable row level security;
alter table entries enable row level security;

create policy "Users can CRUD own track_types"
  on track_types for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can CRUD own entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## 4. Get API Credentials

1. Go to **Project Settings** (gear icon) → **API**
2. Copy the **Project URL**
3. Copy the **anon public** key (not the service_role key)

## 5. Configure the App

1. Run `npm install` to install the Supabase client dependency
2. Create a `.env` file in the project root (see `.env.example` for template)
3. Add:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Restart the dev server after adding env vars
