-- ============================================================
-- 0002_projects_audits.sql — tracked sites, their audit runs, and
-- monthly usage counters.
--
-- An audit stores the full AnalysisReport as jsonb (source of truth)
-- plus a few extracted score columns so trend queries stay index-fast
-- without unpacking jsonb. Trends are just `select created_at, *_score
-- ... order by created_at` — no separate metrics table.
-- ============================================================

-- ── projects: a URL a team tracks over time ─────────────────────────
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references public.teams (id) on delete cascade,
  url              text not null,
  name             text,
  favicon_url      text,
  latest_audit_id  uuid,              -- FK added after audits exists
  latest_score     int,
  default_strategy text not null default 'mobile'
                     check (default_strategy in ('mobile', 'desktop')),
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (team_id, url)
);

create index projects_team_idx on public.projects (team_id);

-- ── audits: one pipeline run ────────────────────────────────────────
create table public.audits (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references public.projects (id) on delete cascade,
  team_id        uuid not null references public.teams (id) on delete cascade,
  report         jsonb not null,
  overall_score  int,
  perf_score     int,
  seo_score      int,
  a11y_score     int,
  security_score int,
  engine         text,
  strategy       text check (strategy in ('mobile', 'desktop')),
  is_demo        boolean not null default false,
  triggered_by   text not null default 'manual'
                   check (triggered_by in ('manual', 'scheduled', 'guest_import', 'api')),
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index audits_project_time_idx on public.audits (project_id, created_at desc);
create index audits_team_time_idx on public.audits (team_id, created_at desc);

alter table public.projects
  add constraint projects_latest_audit_fk
  foreign key (latest_audit_id) references public.audits (id) on delete set null;

-- ── usage_counters: audits run per team per calendar month ──────────
create table public.usage_counters (
  team_id      uuid not null references public.teams (id) on delete cascade,
  period_month text not null,          -- 'YYYY-MM'
  audits_run   int not null default 0,
  primary key (team_id, period_month)
);

-- ── increment_audit_usage: atomic monthly quota gate ───────────────
-- Consumes one audit for the current month and returns whether the run
-- is allowed. A blocked run does NOT consume quota: if the team is
-- already at/over its cap, the counter is left untouched and over_cap
-- comes back true. NULL limit means unlimited (team plan).
-- SECURITY DEFINER so it can write the counter regardless of the
-- caller's RLS, but it verifies membership first (no cross-team use).
create or replace function public.increment_audit_usage(
  target_team uuid,
  monthly_limit int
)
returns table (over_cap boolean, used int)
language plpgsql
security definer
set search_path = public
as $$
declare
  this_month text := to_char(now(), 'YYYY-MM');
  cur int;
begin
  if not public.is_team_member(target_team) then
    raise exception 'not a member of team %', target_team
      using errcode = '42501';
  end if;

  -- Ensure a row exists, then lock it for the read-modify-write.
  insert into public.usage_counters (team_id, period_month, audits_run)
  values (target_team, this_month, 0)
  on conflict (team_id, period_month) do nothing;

  select audits_run into cur
  from public.usage_counters
  where team_id = target_team and period_month = this_month
  for update;

  if monthly_limit is not null and cur >= monthly_limit then
    return query select true as over_cap, cur as used;
    return;
  end if;

  update public.usage_counters
  set audits_run = cur + 1
  where team_id = target_team and period_month = this_month;

  return query select false as over_cap, (cur + 1) as used;
end;
$$;

-- ── Row Level Security ──────────────────────────────────────────────
alter table public.projects       enable row level security;
alter table public.audits          enable row level security;
alter table public.usage_counters  enable row level security;

-- projects: any team member reads; members create/update/delete.
create policy projects_select on public.projects
  for select using (public.is_team_member(team_id));
create policy projects_insert on public.projects
  for insert with check (public.is_team_member(team_id));
create policy projects_update on public.projects
  for update using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));
create policy projects_delete on public.projects
  for delete using (public.team_role(team_id) in ('owner', 'admin'));

-- audits: team members read; inserts go through the service role
-- (worker/actions) which bypasses RLS, so no client insert policy.
create policy audits_select on public.audits
  for select using (public.is_team_member(team_id));
create policy audits_insert on public.audits
  for insert with check (public.is_team_member(team_id));
create policy audits_delete on public.audits
  for delete using (public.team_role(team_id) in ('owner', 'admin'));

-- usage_counters: readable by members; writes only via the RPC /
-- service role. No direct write policy on purpose.
create policy usage_counters_select on public.usage_counters
  for select using (public.is_team_member(team_id));

