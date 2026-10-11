-- ============================================================
-- 0005_worker_support.sql — makes the scheduled-audit worker and
-- the in-app notification bell work end-to-end.
--
-- 1. increment_audit_usage now tolerates a NULL auth.uid() so the
--    service-role worker can consume quota for a team it is running
--    a scheduled audit for. A signed-in caller is still checked
--    against membership, so a user can never spend another team's
--    quota — only the trusted (keyed) worker skips the check.
-- 2. notifications is added to the Realtime publication so the bell
--    receives inserts pushed by the worker over the websocket.
-- ============================================================

-- ── increment_audit_usage: allow service-role (null uid) callers ────
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
  -- A signed-in user may only touch their own team's counter. The
  -- worker runs with the service role (auth.uid() is null) and is
  -- trusted, so it skips the membership gate.
  if auth.uid() is not null and not public.is_team_member(target_team) then
    raise exception 'not a member of team %', target_team
      using errcode = '42501';
  end if;

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

-- ── Realtime: stream notification inserts to the in-app bell ────────
-- Safe to re-run: only adds the table if it isn't already published.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
