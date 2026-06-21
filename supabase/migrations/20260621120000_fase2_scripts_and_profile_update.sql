-- IRIS.ai — Fase 2
-- Saved scripts ("Meus Roteiros") + allow users to edit their own profile.
-- Applied via the Supabase dashboard SQL editor on project "Sportfi 2.0".

-- 1) Saved scripts
create table if not exists public.scripts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  content       jsonb not null default '[]'::jsonb,  -- script lines (string[])
  note          text,
  art_template  text,
  caption       text,
  sport         text,
  format        text,
  description   text,
  tones         jsonb default '[]'::jsonb,           -- string[]
  created_at    timestamptz not null default now()
);

create index if not exists scripts_user_created_idx
  on public.scripts (user_id, created_at desc);

alter table public.scripts enable row level security;

drop policy if exists "scripts_select_own" on public.scripts;
create policy "scripts_select_own" on public.scripts
  for select using (auth.uid() = user_id);

drop policy if exists "scripts_insert_own" on public.scripts;
create policy "scripts_insert_own" on public.scripts
  for insert with check (auth.uid() = user_id);

drop policy if exists "scripts_delete_own" on public.scripts;
create policy "scripts_delete_own" on public.scripts
  for delete using (auth.uid() = user_id);

-- 2) Allow users to update their own profile (Perfil page)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
