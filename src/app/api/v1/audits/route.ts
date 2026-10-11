import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { authorizeApiRequest } from "@/lib/apiV1";
import { analyze } from "@/lib/analysis/aggregate";
import { SsrfError } from "@/lib/ssrf";
import { limitsFor } from "@/lib/plans";
import {
  AnalysisReportSchema,
  type AnalysisReport,
  type CategoryKey,
} from "@/lib/analysis/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   Public REST API — /api/v1/audits.

   Auth: `Authorization: Bearer orb_…`. The key maps to a team; the
   team's plan gates the monthly quota. There is no user session, so
   everything runs with the service-role client after the key check.
   Audits are ad-hoc by default; if the team already tracks a project
   with the same URL, the run is linked to it and its latest_* bumped.
   ============================================================ */

const RunSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .transform((raw) => (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`))
    .pipe(z.string().url()),
  strategy: z.enum(["mobile", "desktop"]).optional(),
});

function scoreOf(report: AnalysisReport, key: CategoryKey): number | null {
  return report.categories.find((c) => c.key === key)?.score ?? null;
}

/** POST /api/v1/audits — run an audit for a URL. Scope: audits:write. */
export async function POST(request: Request) {
  const authed = await authorizeApiRequest(request, "audits:write");
  if (authed instanceof Response) return authed;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = RunSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { url, strategy = "mobile" } = parsed.data;

  const db = createServiceRoleClient();

  // Atomic monthly quota (service-role caller is trusted; migration 0005).
  const { data: usage, error: usageError } = await db.rpc(
    "increment_audit_usage",
    { target_team: authed.teamId, monthly_limit: limitsFor(authed.plan).auditsPerMonth },
  );
  if (usageError) {
    return Response.json({ error: "usage_check_failed" }, { status: 500 });
  }
  const usageRow = Array.isArray(usage) ? usage[0] : usage;
  if (usageRow?.over_cap) {
    return Response.json({ error: "quota_exceeded" }, { status: 429 });
  }

  // Link to an existing tracked project with the same URL, if any.
  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("team_id", authed.teamId)
    .eq("url", url)
    .maybeSingle();

  let report: AnalysisReport;
  try {
    const raw = await analyze({ mode: "url", url }, "en");
    report = AnalysisReportSchema.parse(raw);
  } catch (err) {
    if (err instanceof SsrfError) {
      return Response.json({ error: "ssrf_blocked" }, { status: 400 });
    }
    return Response.json({ error: "analysis_failed" }, { status: 502 });
  }

  const { data: audit, error: insertError } = await db
    .from("audits")
    .insert({
      project_id: project?.id ?? null,
      team_id: authed.teamId,
      report,
      overall_score: report.overallScore,
      perf_score: scoreOf(report, "performance"),
      seo_score: scoreOf(report, "seo"),
      a11y_score: scoreOf(report, "accessibility"),
      security_score: scoreOf(report, "security"),
      engine: report.meta.engine,
      strategy,
      is_demo: report.meta.demo,
      triggered_by: "api",
    })
    .select("id, created_at")
    .single();

  if (insertError || !audit) {
    return Response.json({ error: "save_failed" }, { status: 500 });
  }

  if (project?.id) {
    await db
      .from("projects")
      .update({
        latest_audit_id: audit.id,
        latest_score: report.overallScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);
  }

  return Response.json(
    {
      id: audit.id,
      url,
      strategy,
      created_at: audit.created_at,
      project_id: project?.id ?? null,
      overall_score: report.overallScore,
      scores: {
        performance: scoreOf(report, "performance"),
        seo: scoreOf(report, "seo"),
        accessibility: scoreOf(report, "accessibility"),
        security: scoreOf(report, "security"),
      },
      report,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

/** GET /api/v1/audits — recent audits for the team. Scope: audits:read. */
export async function GET(request: Request) {
  const authed = await authorizeApiRequest(request, "audits:read");
  if (authed instanceof Response) return authed;

  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 25) || 25),
  );

  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("audits")
    .select(
      "id, project_id, overall_score, perf_score, seo_score, a11y_score, security_score, engine, strategy, triggered_by, created_at",
    )
    .eq("team_id", authed.teamId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return Response.json({ error: "query_failed" }, { status: 500 });

  const audits = (data ?? []).map((a) => ({
    id: a.id,
    project_id: a.project_id,
    overall_score: a.overall_score,
    scores: {
      performance: a.perf_score,
      seo: a.seo_score,
      accessibility: a.a11y_score,
      security: a.security_score,
    },
    engine: a.engine,
    strategy: a.strategy,
    triggered_by: a.triggered_by,
    created_at: a.created_at,
  }));

  return Response.json(
    { audits },
    { headers: { "Cache-Control": "no-store" } },
  );
}
