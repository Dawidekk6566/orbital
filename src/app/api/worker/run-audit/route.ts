import { after } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { qstashReceiver, isQStashReceiverConfigured } from "@/lib/queue/qstash";
import { evaluateAndDispatchAlerts } from "@/lib/alerts/dispatch";
import { analyze } from "@/lib/analysis/aggregate";
import {
  AnalysisReportSchema,
  type AnalysisReport,
  type CategoryKey,
} from "@/lib/analysis/types";
import { limitsFor, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   Scheduled-audit worker. QStash POSTs here on a project's cron.

   Security: the request MUST carry a valid `Upstash-Signature`
   over the raw body — this is the only auth (there is no user
   session). We load the project with the SERVICE ROLE (RLS bypass),
   run the shared pipeline, persist the audit, bump the project +
   monthly usage, and fan out alerts AFTER the response via after().
   ============================================================ */

function scoreOf(report: AnalysisReport, key: CategoryKey): number | null {
  return report.categories.find((c) => c.key === key)?.score ?? null;
}

export async function POST(request: Request) {
  if (!isServiceRoleConfigured() || !isQStashReceiverConfigured()) {
    return Response.json(
      { error: "Worker not configured." },
      { status: 503 },
    );
  }

  // Verify the QStash signature over the exact raw body.
  const raw = await request.text();
  const signature = request.headers.get("upstash-signature") ?? "";
  const receiver = qstashReceiver();
  try {
    const valid = await receiver!.verify({ signature, body: raw });
    if (!valid) throw new Error("invalid");
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let projectId: string | undefined;
  try {
    projectId = JSON.parse(raw)?.projectId;
  } catch {
    // fall through to the guard below
  }
  if (!projectId) {
    return Response.json({ error: "Missing projectId." }, { status: 400 });
  }

  const db = createServiceRoleClient();

  const { data: project } = await db
    .from("projects")
    .select("id, team_id, url, default_strategy")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  // Resolve the team's plan for the monthly quota gate.
  const { data: team } = await db
    .from("teams")
    .select("plan")
    .eq("id", project.team_id)
    .maybeSingle();
  const plan: PlanId = (team?.plan as PlanId) ?? "free";

  // Atomic monthly quota (service-role caller is trusted; see migration 0005).
  const { data: usage, error: usageError } = await db.rpc(
    "increment_audit_usage",
    { target_team: project.team_id, monthly_limit: limitsFor(plan).auditsPerMonth },
  );
  if (usageError) {
    return Response.json({ error: "Usage check failed." }, { status: 500 });
  }
  const usageRow = Array.isArray(usage) ? usage[0] : usage;
  if (usageRow?.over_cap) {
    // Not an error for QStash — ack so it doesn't retry a capped team.
    return Response.json({ skipped: "over_cap" }, { status: 200 });
  }

  let report: AnalysisReport;
  try {
    const rawReport = await analyze({ mode: "url", url: project.url }, "en");
    report = AnalysisReportSchema.parse(rawReport);
  } catch {
    return Response.json({ error: "Audit failed." }, { status: 502 });
  }

  const { data: audit, error: insertError } = await db
    .from("audits")
    .insert({
      project_id: project.id,
      team_id: project.team_id,
      report,
      overall_score: report.overallScore,
      perf_score: scoreOf(report, "performance"),
      seo_score: scoreOf(report, "seo"),
      a11y_score: scoreOf(report, "accessibility"),
      security_score: scoreOf(report, "security"),
      engine: report.meta.engine,
      strategy: project.default_strategy,
      is_demo: report.meta.demo,
      triggered_by: "scheduled",
    })
    .select("id")
    .single();
  if (insertError || !audit) {
    return Response.json({ error: "Couldn't save audit." }, { status: 500 });
  }

  await Promise.all([
    db
      .from("projects")
      .update({
        latest_audit_id: audit.id,
        latest_score: report.overallScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id),
    db
      .from("schedules")
      .update({ last_run_at: new Date().toISOString() })
      .eq("project_id", project.id),
  ]);

  // Evaluate + dispatch alerts after the response is sent.
  after(() => evaluateAndDispatchAlerts(audit.id));

  return Response.json({ auditId: audit.id, score: report.overallScore });
}
