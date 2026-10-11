"use server";

import { z } from "zod";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getCurrentTeam } from "@/lib/auth/dal";
import { limitsFor } from "@/lib/plans";
import { analyze } from "@/lib/analysis/aggregate";
import { evaluateAndDispatchAlerts } from "@/lib/alerts/dispatch";
import {
  AnalysisReportSchema,
  AnalyzeRequestSchema,
  type AnalysisReport,
} from "@/lib/analysis/types";
import type { CategoryKey } from "@/lib/analysis/types";

/* ============================================================
   Project + audit mutations.

   The real authorization is defense-in-depth: requireUser() gates
   the session, and every write re-reads the target row under RLS
   (team-scoped) so a forged id can't touch another team's data.
   Plan limits (URL count, audits/month) are BUSINESS rules enforced
   here — never trusted from the client.
   ============================================================ */

export type ActionResult = { error?: string; fieldError?: string };

// Accepts "example.com" or a full URL; normalizes to a canonical origin+path.
const UrlSchema = z
  .string()
  .trim()
  .min(1, "Enter a website URL.")
  .max(2048)
  .transform((raw) => (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`))
  .pipe(z.string().url("That doesn't look like a valid URL."));

function scoreOf(report: AnalysisReport, key: CategoryKey): number | null {
  return report.categories.find((c) => c.key === key)?.score ?? null;
}

/** Create a tracked project for the current team (URL-cap gated). */
export async function createProject(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser("/dashboard/projects");
  const team = await getCurrentTeam();
  if (!team) return { error: "No active team. Finish setup and try again." };

  const parsed = UrlSchema.safeParse(formData.get("url"));
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0]?.message ?? "Invalid URL." };
  }
  const url = parsed.data;
  const nameRaw = (formData.get("name") as string | null)?.trim();

  const supabase = await createClient();

  // URL-count gating (business rule, server-side).
  const limit = limitsFor(team.plan).urls;
  if (limit !== null) {
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) >= limit) {
      return {
        error: `Your ${team.plan} plan tracks up to ${limit} URL${limit === 1 ? "" : "s"}. Upgrade to add more.`,
      };
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      team_id: team.id,
      url,
      name: nameRaw || new URL(url).hostname,
      created_by: (await requireUser()).id,
    })
    .select("id")
    .single();

  if (error) {
    // Unique (team_id, url) violation → friendly message.
    if (error.code === "23505") {
      return { error: "You're already tracking that URL." };
    }
    return { error: "Couldn't create the project. Try again." };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${data.id}`);
}

/**
 * Run an audit for a project the caller owns. Re-reads the URL from the
 * DB (never trusts a passed URL), enforces the monthly quota atomically,
 * runs the shared analyze() pipeline server-to-server, persists the
 * report, and redirects to the new report on success. Returns an error
 * (quota / failure) instead of throwing so the UI can show it inline.
 */
export async function runAudit(
  projectId: string,
): Promise<ActionResult | void> {
  const user = await requireUser("/dashboard");
  const team = await getCurrentTeam();
  if (!team) return { error: "No active team." };

  const supabase = await createClient();

  // Re-read the project under RLS: a foreign id yields null → not found.
  const { data: project } = await supabase
    .from("projects")
    .select("id, team_id, url, default_strategy")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return { error: "Project not found." };

  // Atomic monthly quota gate; a blocked run does not consume quota.
  const { data: usage, error: usageError } = await supabase.rpc(
    "increment_audit_usage",
    { target_team: team.id, monthly_limit: limitsFor(team.plan).auditsPerMonth },
  );
  if (usageError) return { error: "Couldn't check your usage. Try again." };
  const row = Array.isArray(usage) ? usage[0] : usage;
  if (row?.over_cap) {
    return {
      error: `You've used all ${limitsFor(team.plan).auditsPerMonth} audits this month on the ${team.plan} plan. Upgrade for more.`,
    };
  }

  // Run the shared pipeline directly (no HTTP hop); dashboard is en.
  let report: AnalysisReport;
  try {
    const raw = await analyze({ mode: "url", url: project.url }, "en");
    report = AnalysisReportSchema.parse(raw);
  } catch {
    return { error: "The audit couldn't complete. Check the URL and retry." };
  }

  const { data: audit, error: insertError } = await supabase
    .from("audits")
    .insert({
      project_id: project.id,
      team_id: team.id,
      report,
      overall_score: report.overallScore,
      perf_score: scoreOf(report, "performance"),
      seo_score: scoreOf(report, "seo"),
      a11y_score: scoreOf(report, "accessibility"),
      security_score: scoreOf(report, "security"),
      engine: report.meta.engine,
      strategy: project.default_strategy,
      is_demo: report.meta.demo,
      triggered_by: "manual",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !audit) return { error: "Couldn't save the audit." };

  await supabase
    .from("projects")
    .update({
      latest_audit_id: audit.id,
      latest_score: report.overallScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id);

  // Fan out any matching alert rules after the response (score_below,
  // regression, new critical/high). No-ops without a service-role key.
  after(() => evaluateAndDispatchAlerts(audit.id));

  revalidatePath(`/dashboard/projects/${project.id}`);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  redirect(`/dashboard/audits/${audit.id}`);
}

/**
 * Benchmark a project against a competitor URL. Re-reads the project
 * under RLS (needs its latest audit as the "you" side), audits the
 * competitor URL through the shared pipeline, and stores that run as
 * an ad-hoc audit (project_id null — it isn't the project's own site).
 * The competitor's URL is validated + SSRF-guarded inside analyze();
 * the run is quota-gated like any other. Redirects to the versus view
 * (you = the project's latest audit, them = the competitor run).
 */
export async function runCompetitorAudit(
  projectId: string,
  competitorUrlRaw: string,
): Promise<ActionResult | void> {
  const user = await requireUser("/dashboard/projects");
  const team = await getCurrentTeam();
  if (!team) return { error: "No active team." };

  const parsed = UrlSchema.safeParse(competitorUrlRaw);
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0]?.message ?? "Invalid URL." };
  }
  const competitorUrl = parsed.data;

  const supabase = await createClient();

  // Re-read the project under RLS; a foreign id yields null → not found.
  const { data: project } = await supabase
    .from("projects")
    .select("id, url, latest_audit_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return { error: "Project not found." };
  if (!project.latest_audit_id) {
    return { error: "Run an audit for this project first, then compare." };
  }
  if (new URL(competitorUrl).hostname === new URL(project.url).hostname) {
    return { fieldError: "Enter a different site to compare against." };
  }

  // Atomic monthly quota gate; a blocked run does not consume quota.
  const { data: usage, error: usageError } = await supabase.rpc(
    "increment_audit_usage",
    { target_team: team.id, monthly_limit: limitsFor(team.plan).auditsPerMonth },
  );
  if (usageError) return { error: "Couldn't check your usage. Try again." };
  const row = Array.isArray(usage) ? usage[0] : usage;
  if (row?.over_cap) {
    return {
      error: `You've used all ${limitsFor(team.plan).auditsPerMonth} audits this month on the ${team.plan} plan. Upgrade for more.`,
    };
  }

  let report: AnalysisReport;
  try {
    const raw = await analyze({ mode: "url", url: competitorUrl }, "en");
    report = AnalysisReportSchema.parse(raw);
  } catch {
    return { error: "Couldn't audit that URL. Check it and retry." };
  }

  const { data: audit, error: insertError } = await supabase
    .from("audits")
    .insert({
      project_id: null,
      team_id: team.id,
      report,
      overall_score: report.overallScore,
      perf_score: scoreOf(report, "performance"),
      seo_score: scoreOf(report, "seo"),
      a11y_score: scoreOf(report, "accessibility"),
      security_score: scoreOf(report, "security"),
      engine: report.meta.engine,
      strategy: null,
      is_demo: report.meta.demo,
      triggered_by: "manual",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !audit) return { error: "Couldn't save the audit." };

  revalidatePath("/dashboard");
  redirect(
    `/dashboard/versus?you=${project.latest_audit_id}&them=${audit.id}`,
  );
}

/**
 * Run a one-off audit from any input mode (url / code / files / screenshot)
 * that isn't tied to creating a project. Same quota gate + pipeline as
 * runAudit; the input is Zod-validated (never trusted). A URL audit whose
 * host matches a tracked project is linked to it (and updates its latest_*);
 * everything else is stored as an ad-hoc audit (project_id null). Redirects
 * to the new report on success.
 */
export async function runAdHocAudit(
  input: unknown,
): Promise<ActionResult | void> {
  const user = await requireUser("/dashboard/audits/new");
  const team = await getCurrentTeam();
  if (!team) return { error: "No active team." };

  const parsed = AnalyzeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const request = parsed.data;

  const supabase = await createClient();

  // Atomic monthly quota gate; a blocked run does not consume quota.
  const { data: usage, error: usageError } = await supabase.rpc(
    "increment_audit_usage",
    { target_team: team.id, monthly_limit: limitsFor(team.plan).auditsPerMonth },
  );
  if (usageError) return { error: "Couldn't check your usage. Try again." };
  const row = Array.isArray(usage) ? usage[0] : usage;
  if (row?.over_cap) {
    return {
      error: `You've used all ${limitsFor(team.plan).auditsPerMonth} audits this month on the ${team.plan} plan. Upgrade for more.`,
    };
  }

  let report: AnalysisReport;
  try {
    const raw = await analyze(request, "en");
    report = AnalysisReportSchema.parse(raw);
  } catch {
    return { error: "The audit couldn't complete. Check your input and retry." };
  }

  // A URL audit for a site we already track is attached to that project.
  let projectId: string | null = null;
  let strategy: "mobile" | "desktop" | null = null;
  if (request.mode === "url") {
    const { data: project } = await supabase
      .from("projects")
      .select("id, default_strategy")
      .eq("url", request.url)
      .maybeSingle();
    if (project) {
      projectId = project.id;
      strategy = project.default_strategy;
    }
  }

  const { data: audit, error: insertError } = await supabase
    .from("audits")
    .insert({
      project_id: projectId,
      team_id: team.id,
      report,
      overall_score: report.overallScore,
      perf_score: scoreOf(report, "performance"),
      seo_score: scoreOf(report, "seo"),
      a11y_score: scoreOf(report, "accessibility"),
      security_score: scoreOf(report, "security"),
      engine: report.meta.engine,
      strategy,
      is_demo: report.meta.demo,
      triggered_by: "manual",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !audit) return { error: "Couldn't save the audit." };

  if (projectId) {
    await supabase
      .from("projects")
      .update({
        latest_audit_id: audit.id,
        latest_score: report.overallScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/projects");
  }

  after(() => evaluateAndDispatchAlerts(audit.id));
  revalidatePath("/dashboard");
  redirect(`/dashboard/audits/${audit.id}`);
}

export type ImportResult = { error?: string; auditId?: string };

/**
 * Claim a guest's landing-page audit into the freshly-signed-up account.
 * The report is re-validated server-side (never trusted from the client),
 * saved under the personal team, and — for a URL audit — attached to a
 * project created for that host. Guarded to a team's first audit only, so
 * it can't be replayed to spam rows; it does not consume monthly quota
 * (the audit was already run as a guest). Returns the new audit id so the
 * client can navigate to the report.
 */
export async function importGuestAudit(input: unknown): Promise<ImportResult> {
  const user = await requireUser("/dashboard");
  const team = await getCurrentTeam();
  if (!team) return { error: "No active team." };

  const parsed = AnalysisReportSchema.safeParse(input);
  if (!parsed.success) return { error: "That saved audit couldn't be read." };
  const report = parsed.data;

  const supabase = await createClient();

  // One import per fresh account: bail quietly if the team already has audits.
  const { count } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return {};

  // Attach a URL audit to a project for its host (reuse if one exists).
  let projectId: string | null = null;
  let strategy: "mobile" | "desktop" | null = null;
  if (report.target.mode === "url") {
    const url = report.target.value;
    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      /* keep the raw value as the name fallback */
    }
    const { data: existing } = await supabase
      .from("projects")
      .select("id, default_strategy")
      .eq("url", url)
      .maybeSingle();
    if (existing) {
      projectId = existing.id;
      strategy = existing.default_strategy;
    } else {
      const { data: created } = await supabase
        .from("projects")
        .insert({ team_id: team.id, url, name: host, created_by: user.id })
        .select("id, default_strategy")
        .single();
      if (created) {
        projectId = created.id;
        strategy = created.default_strategy;
      }
    }
  }

  const { data: audit, error: insertError } = await supabase
    .from("audits")
    .insert({
      project_id: projectId,
      team_id: team.id,
      report,
      overall_score: report.overallScore,
      perf_score: scoreOf(report, "performance"),
      seo_score: scoreOf(report, "seo"),
      a11y_score: scoreOf(report, "accessibility"),
      security_score: scoreOf(report, "security"),
      engine: report.meta.engine,
      strategy,
      is_demo: report.meta.demo,
      triggered_by: "guest_import",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !audit) return { error: "Couldn't save the audit." };

  if (projectId) {
    await supabase
      .from("projects")
      .update({
        latest_audit_id: audit.id,
        latest_score: report.overallScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/projects");
  }
  revalidatePath("/dashboard");

  return { auditId: audit.id };
}

/** Delete a project (and its audits, via FK cascade). Owner/admin only per RLS. */
export async function deleteProject(projectId: string): Promise<ActionResult | void> {
  await requireUser("/dashboard/projects");
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return { error: "Couldn't delete the project." };
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  redirect("/dashboard/projects");
}
