import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentTeam } from "@/lib/auth/dal";
import { historyCutoff, type PlanId } from "@/lib/plans";
import type { AnalysisReport } from "@/lib/analysis/types";

/* ============================================================
   Dashboard read helpers — RLS-scoped queries for the account
   pages. Every read runs as the signed-in user, so Postgres RLS
   guarantees a team only ever sees its own rows; these helpers
   just shape the data. Mutations live in (dashboard)/actions/*.

   Each helper no-ops (empty/null) when Supabase isn't configured
   so the app still builds and prerenders without .env.local.
   ============================================================ */

export type ProjectRow = {
  id: string;
  team_id: string;
  url: string;
  name: string | null;
  favicon_url: string | null;
  latest_audit_id: string | null;
  latest_score: number | null;
  default_strategy: "mobile" | "desktop";
  created_at: string;
  updated_at: string;
};

export type AuditRow = {
  id: string;
  project_id: string | null;
  team_id: string;
  report: AnalysisReport;
  overall_score: number | null;
  perf_score: number | null;
  seo_score: number | null;
  a11y_score: number | null;
  security_score: number | null;
  engine: string | null;
  strategy: "mobile" | "desktop" | null;
  is_demo: boolean;
  triggered_by: string;
  share_token: string | null;
  created_at: string;
};

/** Columns safe/cheap for list + trend views (no heavy report jsonb). */
const AUDIT_LIST_COLS =
  "id, project_id, team_id, overall_score, perf_score, seo_score, a11y_score, security_score, engine, strategy, is_demo, triggered_by, created_at";

export type AuditListRow = Omit<AuditRow, "report">;

/** All projects for the current team, newest first. */
export async function listProjects(): Promise<ProjectRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, team_id, url, name, favicon_url, latest_audit_id, latest_score, default_strategy, created_at, updated_at",
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ProjectRow[];
}

/** One project by id (RLS scopes it to the caller's team) or null. */
export async function getProject(id: string): Promise<ProjectRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, team_id, url, name, favicon_url, latest_audit_id, latest_score, default_strategy, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectRow;
}

/** Full audit (with report jsonb) by id, or null. */
export async function getAudit(id: string): Promise<AuditRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as AuditRow;
}

/**
 * The id of the run immediately older than `createdAt` for a project
 * (for a "compare with previous" link), or null when it's the first run.
 * RLS scopes it to the caller's team.
 */
export async function getPreviousAuditId(
  projectId: string,
  createdAt: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audits")
    .select("id")
    .eq("project_id", projectId)
    .lt("created_at", createdAt)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

/**
 * Audit history for a project, newest first, filtered to the team's
 * plan retention window. Lightweight columns only (no report jsonb).
 */
export async function listAuditsForProject(
  projectId: string,
  plan: PlanId,
): Promise<AuditListRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("audits")
    .select(AUDIT_LIST_COLS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const cutoff = historyCutoff(plan);
  if (cutoff) query = query.gte("created_at", cutoff.toISOString());

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AuditListRow[];
}

/** Audits run by the current team in the current calendar month. */
export async function getAuditsThisMonth(): Promise<number> {
  const team = await getCurrentTeam();
  if (!team) return 0;
  const supabase = await createClient();
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data, error } = await supabase
    .from("usage_counters")
    .select("audits_run")
    .eq("team_id", team.id)
    .eq("period_month", period)
    .maybeSingle();
  if (error || !data) return 0;
  return data.audits_run ?? 0;
}

/** Number of projects the current team tracks (URL-cap gating). */
export async function countProjects(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });
  if (error || count == null) return 0;
  return count;
}

/* ---------- schedules · alert rules · notifications (Phase 4) ---------- */

export type ScheduleRow = {
  id: string;
  project_id: string;
  team_id: string;
  cadence: "hourly" | "daily";
  enabled: boolean;
  strategy: "mobile" | "desktop";
  qstash_schedule_id: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
};

export type AlertChannel = {
  type: "slack" | "webhook" | "inapp";
  target?: string;
};

export type AlertRuleRow = {
  id: string;
  project_id: string;
  team_id: string;
  enabled: boolean;
  trigger_type:
    | "score_below"
    | "regression"
    | "new_critical_high"
    | "scheduled_complete";
  threshold: number | null;
  channels: AlertChannel[];
};

export type NotificationRow = {
  id: string;
  project_id: string | null;
  audit_id: string | null;
  type: string;
  title: string;
  body: string | null;
  severity: "info" | "warn" | "critical";
  read_at: string | null;
  created_at: string;
};

/** The schedule for a project (unique), or null when none/unconfigured. */
export async function getSchedule(
  projectId: string,
): Promise<ScheduleRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, project_id, team_id, cadence, enabled, strategy, qstash_schedule_id, next_run_at, last_run_at",
    )
    .eq("project_id", projectId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ScheduleRow;
}

/** All schedules for the current team (schedule overview page). */
export async function listSchedules(): Promise<ScheduleRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, project_id, team_id, cadence, enabled, strategy, qstash_schedule_id, next_run_at, last_run_at",
    );
  if (error || !data) return [];
  return data as ScheduleRow[];
}

/** Alert rules for a project, newest first. */
export async function listAlertRules(
  projectId: string,
): Promise<AlertRuleRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alert_rules")
    .select("id, project_id, team_id, enabled, trigger_type, threshold, channels")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as AlertRuleRow[];
}

/** Recent notifications for the current user's team (bell feed). */
export async function listNotifications(
  limit = 20,
): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, project_id, audit_id, type, title, body, severity, read_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as NotificationRow[];
}

/** Count of unread notifications (bell badge). */
export async function unreadNotificationCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error || count == null) return 0;
  return count;
}

/* ---------- team · billing · api keys (Phase 5) ---------- */

export type TeamMemberRow = {
  id: string;
  team_id: string;
  user_id: string | null;
  role: "owner" | "admin" | "member";
  status: "active" | "invited";
  invited_email: string | null;
  created_at: string;
  /** Joined from profiles when the seat is claimed. */
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

/**
 * Roster for a team: active members (with their profile) plus pending
 * invites. RLS lets any member read membership rows for their team.
 * Owners sort first, then admins, then members, then invites.
 */
export async function listTeamMembers(
  teamId: string,
): Promise<TeamMemberRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(
      "id, team_id, user_id, role, status, invited_email, created_at, profiles(email, full_name, avatar_url)",
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  const ROLE_RANK = { owner: 0, admin: 1, member: 2 } as const;
  return (data as unknown[])
    .map((raw) => {
      const r = raw as {
        id: string;
        team_id: string;
        user_id: string | null;
        role: "owner" | "admin" | "member";
        status: "active" | "invited";
        invited_email: string | null;
        created_at: string;
        profiles:
          | { email: string | null; full_name: string | null; avatar_url: string | null }
          | null;
      };
      return {
        id: r.id,
        team_id: r.team_id,
        user_id: r.user_id,
        role: r.role,
        status: r.status,
        invited_email: r.invited_email,
        created_at: r.created_at,
        email: r.profiles?.email ?? null,
        full_name: r.profiles?.full_name ?? null,
        avatar_url: r.profiles?.avatar_url ?? null,
      } satisfies TeamMemberRow;
    })
    .sort((a, b) => {
      // Active before invited; then by role rank; then oldest first.
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      if (a.role !== b.role) return ROLE_RANK[a.role] - ROLE_RANK[b.role];
      return a.created_at.localeCompare(b.created_at);
    });
}

/** Seats consumed = active members + outstanding invites (gating). */
export async function teamSeatCount(teamId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);
  if (error || count == null) return 0;
  return count;
}

export type SubscriptionRow = {
  team_id: string;
  status: string;
  plan: PlanId;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

/** The team's Stripe subscription mirror, or null when on free/none. */
export async function getSubscription(
  teamId: string,
): Promise<SubscriptionRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("team_id, status, plan, price_id, current_period_end, cancel_at_period_end")
    .eq("team_id", teamId)
    .maybeSingle();
  if (error || !data) return null;
  return data as SubscriptionRow;
}

export type ApiKeyRow = {
  id: string;
  team_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

/** API keys for a team, active first then revoked, newest first. */
export async function listApiKeys(teamId: string): Promise<ApiKeyRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, team_id, name, key_prefix, scopes, last_used_at, revoked_at, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ApiKeyRow[];
}
