-- ============================================================
-- 0003_schedule_alerts.sql — scheduled re-audits, alert rules and
-- the in-app notification inbox.
--
-- schedules map 1:1 to a project and carry the QStash schedule id so
-- the worker can reconcile. alert_rules describe when to fire and
-- through which channels. notifications is the in-app bell feed
-- (Supabase Realtime streams inserts to the client).
-- ============================================================

-- ── schedules: cron cadence per project ─────────────────────────────
create table public.schedules (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null unique references public.projects (id) on delete cascade,
  team_id            uuid not null references public.teams (id) on delete cascade,
  cadence            text not null default 'daily'
                       check (cadence in ('hourly', 'daily')),
  enabled            boolean not null default true,
  strategy           text not null default 'mobile'
                       check (strategy in ('mobile', 'desktop')),
  qstash_schedule_id text,
  next_run_at        timestamptz,
  last_run_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index schedules_team_idx on public.schedules (team_id);

-- ── alert_rules: trigger + channels per project ─────────────────────
create table public.alert_rules (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  team_id      uuid not null references public.teams (id) on delete cascade,
  enabled      boolean not null default true,
  trigger_type text not null
                 check (trigger_type in (
                   'score_below', 'regression',
                   'new_critical_high', 'scheduled_complete'
                 )),
  threshold    int,                  -- used by score_below
  channels     jsonb not null default '[]'::jsonb,
                 -- [{ "type": "slack|webhook|email|inapp", "target": "..." }]
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index alert_rules_project_idx on public.alert_rules (project_id);

-- ── notifications: in-app inbox (Realtime source) ───────────────────
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete cascade,  -- null = team-wide
  project_id uuid references public.projects (id) on delete set null,
  audit_id   uuid references public.audits (id) on delete set null,
  type       text not null,
  title      text not null,
  body       text,
  severity   text not null default 'info'
               check (severity in ('info', 'warn', 'critical')),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_team_time_idx on public.notifications (team_id, created_at desc);

-- ── Row Level Security ──────────────────────────────────────────────
alter table public.schedules     enable row level security;
alter table public.alert_rules    enable row level security;
alter table public.notifications  enable row level security;

-- schedules: members read; owners/admins manage (mirrors project mgmt).
create policy schedules_select on public.schedules
  for select using (public.is_team_member(team_id));
create policy schedules_write on public.schedules
  for all using (public.team_role(team_id) in ('owner', 'admin'))
  with check (public.team_role(team_id) in ('owner', 'admin'));

-- alert_rules: same shape as schedules.
create policy alert_rules_select on public.alert_rules
  for select using (public.is_team_member(team_id));
create policy alert_rules_write on public.alert_rules
  for all using (public.team_role(team_id) in ('owner', 'admin'))
  with check (public.team_role(team_id) in ('owner', 'admin'));

-- notifications: a member reads team-wide rows plus their own; a user
-- may mark their visible rows read. Inserts come from the service role
-- (worker), so no client insert policy.
create policy notifications_select on public.notifications
  for select using (
    public.is_team_member(team_id)
    and (user_id is null or user_id = auth.uid())
  );
create policy notifications_update_read on public.notifications
  for update using (
    public.is_team_member(team_id)
    and (user_id is null or user_id = auth.uid())
  )
  with check (
    public.is_team_member(team_id)
    and (user_id is null or user_id = auth.uid())
  );

