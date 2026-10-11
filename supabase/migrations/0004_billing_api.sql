-- ============================================================
-- 0004_billing_api.sql — Stripe subscription mirror and REST API keys.
--
-- subscriptions is written ONLY by the Stripe webhook (service role);
-- it mirrors Stripe state and drives teams.plan. api_keys stores a
-- SHA-256 hash of each key — the plaintext is shown once at creation
-- and never persisted.
-- ============================================================

-- ── subscriptions: Stripe mirror, one per team ──────────────────────
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  team_id                uuid not null unique references public.teams (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  status                 text,        -- active|trialing|past_due|canceled|...
  price_id               text,
  plan                   text not null default 'free'
                           check (plan in ('free', 'pro', 'team')),
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ── api_keys: hashed bearer tokens for the public REST API ──────────
create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams (id) on delete cascade,
  name         text not null,
  key_prefix   text not null,        -- shown in the UI (e.g. "orb_live_a1b2")
  key_hash     text not null unique, -- SHA-256 of the full key
  scopes       jsonb not null default '["audits:read","audits:write"]'::jsonb,
  created_by   uuid references public.profiles (id) on delete set null,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index api_keys_team_idx on public.api_keys (team_id);

-- ── Row Level Security ──────────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.api_keys       enable row level security;

-- subscriptions: members may read their team's billing state; all
-- writes flow through the webhook (service role bypasses RLS).
create policy subscriptions_select on public.subscriptions
  for select using (public.is_team_member(team_id));

-- api_keys: owners/admins manage keys. key_hash is never exposed to
-- the browser in practice (selects pick columns), but RLS still scopes
-- rows to the team. Verification runs server-side via service role.
create policy api_keys_select on public.api_keys
  for select using (public.team_role(team_id) in ('owner', 'admin'));
create policy api_keys_insert on public.api_keys
  for insert with check (public.team_role(team_id) in ('owner', 'admin'));
create policy api_keys_update on public.api_keys
  for update using (public.team_role(team_id) in ('owner', 'admin'))
  with check (public.team_role(team_id) in ('owner', 'admin'));
create policy api_keys_delete on public.api_keys
  for delete using (public.team_role(team_id) in ('owner', 'admin'));
