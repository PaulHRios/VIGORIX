-- ============================================================
-- GymAI — Supabase schema
-- ============================================================
-- Run this once in your Supabase project's SQL editor.
-- All tables are scoped per-user via Row Level Security.
-- The anon key in your frontend can ONLY ever read/write a user's own rows.

-- 1) Profiles -------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  preferred_language text check (preferred_language in ('en', 'es')) default 'en',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self write" on public.profiles;
create policy "profiles self write" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) Workout requests (audit log of what users asked for) ----
create table if not exists public.workout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,            -- the request object {goal, muscle, equipment, time, level, condition}
  detected_conditions text[] default '{}',
  created_at timestamptz default now()
);

alter table public.workout_requests enable row level security;

drop policy if exists "wr self all" on public.workout_requests;
create policy "wr self all" on public.workout_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists workout_requests_user_idx on public.workout_requests(user_id, created_at desc);

-- 3) Saved routines ------------------------------------------
create table if not exists public.saved_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  payload jsonb not null,            -- the full routine, including exercises with prescriptions
  created_at timestamptz default now()
);

alter table public.saved_routines enable row level security;

drop policy if exists "sr self all" on public.saved_routines;
create policy "sr self all" on public.saved_routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists saved_routines_user_idx on public.saved_routines(user_id, created_at desc);

-- 4) Workout logs (per set) ----------------------------------
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  set_index integer,
  weight numeric,
  unit text check (unit in ('kg','lb')) default 'kg',
  reps integer,
  notes text,
  logged_at timestamptz default now()
);

alter table public.workout_logs enable row level security;

drop policy if exists "wl self all" on public.workout_logs;
create policy "wl self all" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists workout_logs_user_idx on public.workout_logs(user_id, logged_at desc);

-- 5) Body metrics --------------------------------------------
create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric not null,
  unit text check (unit in ('kg','lb')) default 'kg',
  measured_at timestamptz default now()
);

alter table public.body_metrics enable row level security;

drop policy if exists "bm self all" on public.body_metrics;
create policy "bm self all" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists body_metrics_user_idx on public.body_metrics(user_id, measured_at desc);
