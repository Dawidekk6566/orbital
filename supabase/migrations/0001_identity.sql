-- ============================================================
-- 0001_identity.sql — profiles, teams, team_members.
--
-- The authorization spine. Every other table hangs off a team_id
-- and reuses the security-definer helpers defined here. A personal
-- team + owner membership is auto-created on signup so solo users
-- never think about teams.
--
-- RLS note: membership checks route through SECURITY DEFINER helpers
-- (is_team_member / team_role) so policies never re-query team_members
-- under RLS — that recursion is the classic Supabase footgun.
-- ============================================================

create extension if not exists "pgcrypto";

-- ── profiles: 1:1 with auth.users ───────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text,
  full_name       text,
  avatar_url      text,
  default_team_id uuid,               -- FK added after teams exists
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── teams: the billing + ownership unit ─────────────────────────────
create table public.teams (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text unique,
  is_personal        boolean not null default false,
  plan               text not null default 'free'
                       check (plan in ('free', 'pro', 'team')),
  stripe_customer_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── team_members: who belongs to a team and in what role ────────────
create table public.team_members (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams (id) on delete cascade,
  user_id       uuid references public.profiles (id) on delete cascade,
  role          text not null default 'member'
                  check (role in ('owner', 'admin', 'member')),
  invited_email text,
  status        text not null default 'active'
                  check (status in ('active', 'invited')),
  created_at    timestamptz not null default now(),
  unique (team_id, user_id)
);

create index team_members_user_idx on public.team_members (user_id);
create index team_members_team_idx on public.team_members (team_id);

-- default_team_id FK now that teams exists.
alter table public.profiles
  add constraint profiles_default_team_fk
  foreign key (default_team_id) references public.teams (id) on delete set null;

-- ── security-definer membership helpers ────────────────────────────
-- SECURITY DEFINER + a locked search_path lets policies ask "is the
-- caller in this team?" without themselves triggering team_members RLS.
create or replace function public.is_team_member(target_team uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = target_team
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.team_role(target_team uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select m.role from public.team_members m
  where m.team_id = target_team
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

-- ── handle_new_user: profile + personal team + owner membership ─────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_team_id uuid;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    display_name,
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.teams (name, is_personal, plan)
  values (coalesce(display_name, 'Personal') || '''s team', true, 'free')
  returning id into new_team_id;

  insert into public.team_members (team_id, user_id, role, status)
  values (new_team_id, new.id, 'owner', 'active');

  update public.profiles set default_team_id = new_team_id where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;

-- profiles: a user sees and edits only their own row.
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- teams: any active member can read; owners/admins can update.
create policy teams_select_member on public.teams
  for select using (public.is_team_member(id));
create policy teams_update_admin on public.teams
  for update using (public.team_role(id) in ('owner', 'admin'))
  with check (public.team_role(id) in ('owner', 'admin'));

-- team_members: a member reads the roster; owners/admins manage it.
-- The self row is always visible so is_team_member can bootstrap.
create policy team_members_select on public.team_members
  for select using (user_id = auth.uid() or public.is_team_member(team_id));
create policy team_members_insert_admin on public.team_members
  for insert with check (public.team_role(team_id) in ('owner', 'admin'));
create policy team_members_update_admin on public.team_members
  for update using (public.team_role(team_id) in ('owner', 'admin'));
create policy team_members_delete_admin on public.team_members
  for delete using (public.team_role(team_id) in ('owner', 'admin'));

