-- ============================================================
-- 0007_share_tokens.sql — public share links for a single audit.
--
-- A share link is an opaque, unguessable token stored on the audit
-- row. The public /share/[token] page reads the report through the
-- service-role client (RLS-bypassing, server-only) scoped strictly
-- by this token, so no anon RLS policy is opened on `audits`.
--
-- Sharing is opt-in per audit and revocable (set share_token = null).
-- Only the report jsonb + created_at are ever exposed publicly; team,
-- project and user columns are never selected by the share page.
-- ============================================================

alter table public.audits
  add column if not exists share_token text,
  add column if not exists shared_at timestamptz;

-- One token ↔ one audit; also the lookup index for the share page.
create unique index if not exists audits_share_token_key
  on public.audits (share_token)
  where share_token is not null;
