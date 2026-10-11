import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import type { AnalysisReport, Severity } from "@/lib/analysis/types";

/* ============================================================
   Alert evaluation + dispatch. Runs AFTER an audit is persisted
   (called from the worker via `after()`, or after a manual run),
   using the SERVICE ROLE — there is no user session in that
   context, so RLS is bypassed and every read is scoped explicitly
   by project_id / team_id.

   For each enabled alert_rule on the project we test its trigger
   against the new audit (and the previous one, for regressions /
   new findings) and fan out to its channels. A failed channel
   never throws — one broken webhook can't stop the others.
   ============================================================ */

export type AlertChannelType = "slack" | "webhook" | "inapp";
export type AlertChannel = { type: AlertChannelType; target?: string };

type TriggerType =
  | "score_below"
  | "regression"
  | "new_critical_high"
  | "scheduled_complete";

type AlertRuleRow = {
  id: string;
  project_id: string;
  team_id: string;
  enabled: boolean;
  trigger_type: TriggerType;
  threshold: number | null;
  channels: AlertChannel[];
};

type AuditRecord = {
  id: string;
  project_id: string | null;
  team_id: string;
  report: AnalysisReport;
  overall_score: number | null;
  triggered_by: string;
  created_at: string;
};

function countSevere(report: AnalysisReport): number {
  const severe: Severity[] = ["critical", "high"];
  return report.recommendations.filter((r) => severe.includes(r.severity))
    .length;
}

/** Evaluate one rule; returns a human reason when it fires, else null. */
function evaluate(
  rule: AlertRuleRow,
  curr: AuditRecord,
  prev: AuditRecord | null,
): string | null {
  const score = curr.overall_score;
  switch (rule.trigger_type) {
    case "score_below": {
      if (rule.threshold == null || score == null) return null;
      return score < rule.threshold
        ? `Overall score ${score} fell below your threshold of ${rule.threshold}.`
        : null;
    }
    case "regression": {
      if (score == null || !prev || prev.overall_score == null) return null;
      return score < prev.overall_score
        ? `Overall score dropped from ${prev.overall_score} to ${score}.`
        : null;
    }
    case "new_critical_high": {
      const now = countSevere(curr.report);
      const before = prev ? countSevere(prev.report) : 0;
      if (now === 0) return null;
      return !prev || now > before
        ? `${now} critical/high issue${now === 1 ? "" : "s"} found (was ${before}).`
        : null;
    }
    case "scheduled_complete": {
      return curr.triggered_by === "scheduled"
        ? "A scheduled audit finished."
        : null;
    }
    default:
      return null;
  }
}

async function postJson(url: string, payload: unknown): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Best-effort delivery; a dead endpoint must not break the run.
  }
}

/**
 * Evaluate every enabled alert rule for the audit's project and
 * dispatch the ones that fire. Safe to call in `after()` — swallows
 * its own errors and no-ops without a service-role key.
 */
export async function evaluateAndDispatchAlerts(
  auditId: string,
): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  const db = createServiceRoleClient();

  const { data: curr } = await db
    .from("audits")
    .select(
      "id, project_id, team_id, report, overall_score, triggered_by, created_at",
    )
    .eq("id", auditId)
    .maybeSingle();
  if (!curr || !curr.project_id) return;
  const current = curr as AuditRecord;

  const { data: rules } = await db
    .from("alert_rules")
    .select("id, project_id, team_id, enabled, trigger_type, threshold, channels")
    .eq("project_id", current.project_id)
    .eq("enabled", true);
  if (!rules || rules.length === 0) return;

  // Previous audit for this project (for regression / new-finding diffs).
  const { data: prevRows } = await db
    .from("audits")
    .select(
      "id, project_id, team_id, report, overall_score, triggered_by, created_at",
    )
    .eq("project_id", current.project_id)
    .lt("created_at", current.created_at)
    .order("created_at", { ascending: false })
    .limit(1);
  const previous = (prevRows?.[0] as AuditRecord | undefined) ?? null;

  const { data: project } = await db
    .from("projects")
    .select("name, url")
    .eq("id", current.project_id)
    .maybeSingle();
  const label = project?.name || project?.url || "your site";
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const reportUrl = `${appUrl}/dashboard/audits/${current.id}`;

  for (const raw of rules as AlertRuleRow[]) {
    const reason = evaluate(raw, current, previous);
    if (!reason) continue;

    const title = `${label}: ${reason}`;
    const channels = Array.isArray(raw.channels) ? raw.channels : [];

    for (const ch of channels) {
      switch (ch.type) {
        case "inapp":
          await db.from("notifications").insert({
            team_id: current.team_id,
            project_id: current.project_id,
            audit_id: current.id,
            type: raw.trigger_type,
            title,
            body: `View the full report at ${reportUrl}`,
            severity:
              raw.trigger_type === "new_critical_high" ? "critical" : "warn",
          });
          break;
        case "slack":
          if (ch.target)
            await postJson(ch.target, { text: `⚠️ ${title}\n${reportUrl}` });
          break;
        case "webhook":
          if (ch.target)
            await postJson(ch.target, {
              event: raw.trigger_type,
              project: label,
              auditId: current.id,
              overallScore: current.overall_score,
              reason,
              reportUrl,
            });
          break;
      }
    }
  }
}
