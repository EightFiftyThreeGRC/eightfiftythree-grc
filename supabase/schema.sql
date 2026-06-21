-- EightFiftyThree GRC — multi-user backend schema (Phase 1)
-- ============================================================================
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- Model (Phase 1, single-blob):
--   * One row in `programs` per GRC program. The entire client `state` object
--     is stored as a single JSONB column (`state`). This keeps the existing
--     app's data model intact — almost no rendering code changes.
--   * Access control is by EMAIL membership: a person can read/write a program
--     if they are the program owner OR their email appears in the program's
--     roster (`state -> 'users'`). The roster is managed in-app under
--     Users & roles exactly as today, so adding a user there grants access.
--   * Roles (CISO / control owner / AO / …) come from that same roster entry,
--     so the signed-in identity is locked to one real person — no impersonation.
--
-- Phase 2 (not in this file): normalize hot collections (controls, owners,
-- attestations, boundaries) into their own tables with per-row RLS + realtime
-- for true concurrent editing. The single-blob model here is last-write-wins.
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- programs
-- ----------------------------------------------------------------------------
create table if not exists public.programs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'GRC Program',
  owner_id    uuid not null references auth.users (id) on delete cascade,
  state       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

create index if not exists programs_owner_idx on public.programs (owner_id);

-- ----------------------------------------------------------------------------
-- Helper: is the calling user listed in a program roster (state.users[].email)?
-- SECURITY DEFINER + STABLE so it can be used inside RLS without recursion and
-- without exposing the roster contents directly.
-- ----------------------------------------------------------------------------
create or replace function public.email_in_roster(p_state jsonb)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(p_state -> 'users', '[]'::jsonb)) as u
    where lower(coalesce(u ->> 'email', '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and coalesce((u ->> 'isDemoPlaceholder')::boolean, false) = false
      and coalesce(u ->> 'email', '') <> ''
  );
$$;

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------
alter table public.programs enable row level security;

-- Read: owner, or anyone whose work email is on the roster.
drop policy if exists programs_select on public.programs;
create policy programs_select on public.programs
  for select
  using (
    owner_id = auth.uid()
    or public.email_in_roster(state)
  );

-- Insert: a signed-in user may create a program they own.
drop policy if exists programs_insert on public.programs;
create policy programs_insert on public.programs
  for insert
  with check (owner_id = auth.uid());

-- Update: owner or any roster member may edit (single-blob, last-write-wins).
-- owner_id is immutable here because USING also gates the pre-update row.
drop policy if exists programs_update on public.programs;
create policy programs_update on public.programs
  for update
  using (
    owner_id = auth.uid()
    or public.email_in_roster(state)
  )
  with check (
    owner_id = auth.uid()
    or public.email_in_roster(state)
  );

-- Delete: owner only.
drop policy if exists programs_delete on public.programs;
create policy programs_delete on public.programs
  for delete
  using (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Keep updated_at fresh on every write.
-- ----------------------------------------------------------------------------
create or replace function public.touch_program_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists programs_touch_updated_at on public.programs;
create trigger programs_touch_updated_at
  before update on public.programs
  for each row execute function public.touch_program_updated_at();

-- ----------------------------------------------------------------------------
-- Realtime (optional but recommended): lets other signed-in users see changes
-- without a manual refresh. Safe to run more than once.
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.programs;
  exception
    when duplicate_object then null;
    when undefined_object then null;  -- publication not present on some setups
  end;
end $$;
