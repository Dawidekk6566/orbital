-- ============================================================
-- 0006_team_invites.sql — pending invites + claim on sign-in.
--
-- Invites are just team_members rows with status='invited', a null
-- user_id and the target email in invited_email. When the invited
-- person authenticates we flip the row to their user_id + 'active'.
--
-- Two entry points:
--   • brand-new signups  → handle_new_user() claims inline (below)
--   • existing accounts  → claim_pending_invites() RPC, called from
--                          the auth callback / team page.
-- Seat gating (plan limits) is enforced server-side in inviteMember,
-- never here — this migration only wires the claim mechanics + an
-- index for the email lookup.
-- ============================================================

-- Fast lookup of a person's outstanding invites by email.
create index if not exists team_members_invited_email_idx
  on public.team_members (invited_email)
  where status = 'invited';

-- ── handle_new_user: now also claims any pending invites ────────────
-- Recreated wholesale (create or replace) so signup attaches the new
-- user to every team that already invited their email address.
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

  -- Claim any invites addressed to this email. A prior membership on
  -- the same team (shouldn't happen for a brand-new user) is skipped
  -- to respect the unique(team_id, user_id) constraint.
  update public.team_members m
  set user_id = new.id, status = 'active', invited_email = null
  where m.status = 'invited'
    and m.user_id is null
    and lower(m.invited_email) = lower(new.email)
    and not exists (
      select 1 from public.team_members x
      where x.team_id = m.team_id and x.user_id = new.id
    );

  return new;
end;
$$;

-- ── claim_pending_invites: for users who already had an account ─────
-- Runs as the signed-in caller (auth.uid()); resolves their email from
-- auth.users and activates matching invited rows. Returns how many
-- invites were claimed. Idempotent — a second call claims nothing.
create or replace function public.claim_pending_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  claimed integer;
begin
  if caller is null then
    return 0;
  end if;

  select email into caller_email from auth.users where id = caller;
  if caller_email is null then
    return 0;
  end if;

  update public.team_members m
  set user_id = caller, status = 'active', invited_email = null
  where m.status = 'invited'
    and m.user_id is null
    and lower(m.invited_email) = lower(caller_email)
    and not exists (
      select 1 from public.team_members x
      where x.team_id = m.team_id and x.user_id = caller
    );

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;
