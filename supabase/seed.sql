-- ============================================================
-- seed.sql — demo data for local development.
--
-- Applied after migrations by `supabase db reset`. It seeds two
-- projects and ~10 audits with varied scores across the last few
-- weeks so History / Trends / the radar have something to draw.
--
-- It attaches everything to an EXISTING auth user — seed.sql cannot
-- mint a working password login. Sign up once through the app (or the
-- Supabase dashboard), then run the reset. Set the email below if your
-- test user differs; if no user exists yet the block is a safe no-op.
-- ============================================================

-- Build a schema-valid AnalysisReport jsonb from a handful of scores,
-- so we don't hand-write the full object for every audit row.
create or replace function public.seed_report(
  p_mode text, p_value text,
  p_overall int, p_perf int, p_seo int, p_a11y int, p_sec int,
  p_at timestamptz
)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'target', jsonb_build_object('mode', p_mode, 'value', p_value),
    'overallScore', p_overall,
    'categories', jsonb_build_array(
      jsonb_build_object('key','performance','score',p_perf,'metrics',
        jsonb_build_array(
          jsonb_build_object('id','lcp','label','Largest Contentful Paint','value',2.4,'unit','s','score',p_perf,'status', case when p_perf>=90 then 'good' when p_perf>=50 then 'warn' else 'bad' end),
          jsonb_build_object('id','cls','label','Cumulative Layout Shift','value',0.04,'score',p_perf,'status', case when p_perf>=90 then 'good' when p_perf>=50 then 'warn' else 'bad' end)
        )),
      jsonb_build_object('key','seo','score',p_seo,'metrics',
        jsonb_build_array(
          jsonb_build_object('id','meta','label','Meta description','value','present','score',p_seo,'status', case when p_seo>=90 then 'good' when p_seo>=50 then 'warn' else 'bad' end)
        )),
      jsonb_build_object('key','accessibility','score',p_a11y,'metrics',
        jsonb_build_array(
          jsonb_build_object('id','contrast','label','Colour contrast','value','AA','score',p_a11y,'status', case when p_a11y>=90 then 'good' when p_a11y>=50 then 'warn' else 'bad' end)
        )),
      jsonb_build_object('key','security','score',p_sec,'metrics',
        jsonb_build_array(
          jsonb_build_object('id','https','label','HTTPS','value','enabled','score',p_sec,'status', case when p_sec>=90 then 'good' when p_sec>=50 then 'warn' else 'bad' end)
        ))
    ),
    'recommendations', jsonb_build_array(
      jsonb_build_object('id','img-next-gen','category','performance','severity','high','title','Serve images in next-gen formats','problem','Legacy JPEG/PNG assets inflate transfer size.','fix','Convert hero and thumbnail images to AVIF/WebP and set explicit dimensions.'),
      jsonb_build_object('id','meta-desc','category','seo','severity','medium','title','Add a meta description','problem','Some pages lack a descriptive meta tag.','fix','Add a unique 140–160 char meta description per route.')
    ),
    'radar', jsonb_build_array(
      jsonb_build_object('category','performance','score',p_perf),
      jsonb_build_object('category','seo','score',p_seo),
      jsonb_build_object('category','accessibility','score',p_a11y),
      jsonb_build_object('category','security','score',p_sec)
    ),
    'meta', jsonb_build_object('engine','demo','analyzedAt', to_char(p_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"'),'demo', true)
  );
$$;

do $$
declare
  -- ↓ set this to your test user's email if it differs.
  target_email text := 'demo@orbital.test';
  v_user   uuid;
  v_team   uuid;
  proj_a   uuid;
  proj_b   uuid;
  last_a   uuid;
  last_b   uuid;
  r        record;
  audit_id uuid;
  n        int;
begin
  -- Prefer the named test user; fall back to the earliest user so the
  -- seed still lights up whatever account exists locally.
  select id into v_user from auth.users where email = target_email limit 1;
  if v_user is null then
    select id into v_user from auth.users order by created_at asc limit 1;
  end if;

  if v_user is null then
    raise notice 'seed: no auth user found — sign up in the app, then re-run. Skipping.';
    return;
  end if;

  select default_team_id into v_team from public.profiles where id = v_user;
  if v_team is null then
    raise notice 'seed: user % has no default team (trigger not run?). Skipping.', v_user;
    return;
  end if;

  -- Two tracked projects.
  insert into public.projects (team_id, url, name, default_strategy, created_by)
  values (v_team, 'https://acme.store', 'Acme Store', 'mobile', v_user)
  on conflict (team_id, url) do update set name = excluded.name
  returning id into proj_a;

  insert into public.projects (team_id, url, name, default_strategy, created_by)
  values (v_team, 'https://linbase.io', 'Linbase', 'desktop', v_user)
  on conflict (team_id, url) do update set name = excluded.name
  returning id into proj_b;

  -- Wipe prior demo audits for a clean, repeatable reset.
  delete from public.audits where project_id in (proj_a, proj_b) and is_demo;

  -- ~6 audits for A (improving trend) + ~5 for B (a dip then recovery),
  -- spread back over ~5 weeks.
  n := 0;
  for r in
    select * from (values
      (proj_a, 'https://acme.store', 'mobile',  35, 71, 62, 88, 90, 74),
      (proj_a, 'https://acme.store', 'mobile',  28, 74, 66, 90, 90, 78),
      (proj_a, 'https://acme.store', 'mobile',  21, 79, 70, 92, 95, 81),
      (proj_a, 'https://acme.store', 'mobile',  14, 83, 74, 92, 95, 84),
      (proj_a, 'https://acme.store', 'mobile',   7, 88, 80, 96, 100, 88),
      (proj_a, 'https://acme.store', 'mobile',   1, 91, 84, 98, 100, 90),
      (proj_b, 'https://linbase.io', 'desktop', 30, 82, 88, 91, 96, 86),
      (proj_b, 'https://linbase.io', 'desktop', 20, 76, 85, 90, 96, 80),
      (proj_b, 'https://linbase.io', 'desktop', 12, 68, 80, 88, 92, 72),
      (proj_b, 'https://linbase.io', 'desktop',  5, 79, 86, 92, 96, 83),
      (proj_b, 'https://linbase.io', 'desktop',  1, 85, 90, 94, 98, 88)
    ) as t(project_id, url, strategy, days_ago, perf, seo, a11y, sec, overall)
  loop
    audit_id := gen_random_uuid();
    insert into public.audits (
      id, project_id, team_id, report, overall_score,
      perf_score, seo_score, a11y_score, security_score,
      engine, strategy, is_demo, triggered_by, created_by, created_at
    )
    values (
      audit_id, r.project_id, v_team,
      public.seed_report(
        'url', r.url, r.overall, r.perf, r.seo, r.a11y, r.sec,
        now() - make_interval(days => r.days_ago)
      ),
      r.overall, r.perf, r.seo, r.a11y, r.sec,
      'demo', r.strategy, true, 'scheduled', v_user,
      now() - make_interval(days => r.days_ago)
    );
    if r.project_id = proj_a then last_a := audit_id; else last_b := audit_id; end if;
    n := n + 1;
  end loop;

  -- Point each project at its most-recent (1-day-ago) audit.
  update public.projects set latest_audit_id = last_a, latest_score = 91 where id = proj_a;
  update public.projects set latest_audit_id = last_b, latest_score = 85 where id = proj_b;

  raise notice 'seed: inserted % audits across 2 projects for team %.', n, v_team;
end;
$$;
