import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listProjects, listAuditsForProject } from "@/lib/dashboard/queries";
import type { AuditListRow } from "@/lib/dashboard/queries";
import { limitsFor, PLAN_LABELS, type PlanId } from "@/lib/plans";
import { TrendChart, type TrendPoint } from "@/components/dashboard/charts/TrendChart";
import { RadarChart, type RadarAxis } from "@/components/dashboard/charts/RadarChart";
import { AuditsTable } from "@/components/dashboard/AuditsTable";
import { scoreTone, TONE_TEXT } from "@/lib/dashboard/score";

export const metadata: Metadata = {
  title: "History — Orbital",
};

/* ============================================================
   History + trends (/dashboard/history) — Developer-grade
   time-series inspection and regression tracking.
   ============================================================ */

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function toAxes(row: AuditListRow): RadarAxis[] {
  return [
    { label: "Perf", score: row.perf_score },
    { label: "SEO", score: row.seo_score },
    { label: "A11y", score: row.a11y_score },
    { label: "Security", score: row.security_score },
  ];
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: requested } = await searchParams;
  const team = await getCurrentTeam();
  const plan: PlanId = team?.plan ?? "free";
  const projects = await listProjects();
  const retentionDays = limitsFor(plan).historyDays;

  if (projects.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <div className="border-b border-line pb-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Time-Series Analytics / Regression Logs
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            History &amp; Trends
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Historical score evolution, categorical radar comparisons, and granular audit run logs.
          </p>
        </div>

        <div className="rounded-[10px] border border-dashed border-line bg-bg-soft/60 p-12 text-center">
          <span className="font-mono text-[12px] text-muted uppercase">No Projects Configured</span>
          <p className="mt-2 text-[14px] text-gray-1">
            Add a site to start recording time-series audits and tracking performance regressions.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Add a project
          </Link>
        </div>
      </div>
    );
  }

  const selected = projects.find((p) => p.id === requested) ?? projects[0];
  const audits = await listAuditsForProject(selected.id, plan);

  const chrono = [...audits].reverse();
  const points: TrendPoint[] = chrono.map((a) => ({
    date: a.created_at,
    overall: a.overall_score,
    perf: a.perf_score,
    seo: a.seo_score,
    a11y: a.a11y_score,
    security: a.security_score,
  }));

  const latest = audits[0];
  const previous = audits[1];
  const oldest = audits[audits.length - 1];
  const netDelta =
    latest && oldest && latest.overall_score !== null && oldest.overall_score !== null
      ? latest.overall_score - oldest.overall_score
      : null;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Time-Series Analytics / Regression Logs
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            History &amp; Trends
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Historical score evolution, categorical radar comparisons, and granular audit run logs.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>Retention: {retentionDays === null ? "Unlimited" : `${retentionDays} Days`}</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">{PLAN_LABELS[plan]} Plan</span>
        </div>
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Runs Recorded</span>
            <span className="font-mono text-[10.5px] text-gray-1">In window</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {audits.length}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>{selected.name || hostOf(selected.url)}</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Latest Overall</span>
            <span className="font-mono text-[10.5px] text-gray-1">Most recent</span>
          </div>
          <p
            className={`mt-2.5 font-mono text-[22px] font-semibold ${
              latest ? TONE_TEXT[scoreTone(latest.overall_score)] : "text-gray-1"
            }`}
          >
            {latest?.overall_score ?? "—"}/100
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>{latest ? `${latest.engine ?? "dual"}` : "No audits yet"}</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Window Trajectory</span>
            <span className="font-mono text-[10.5px] text-gray-1">Net shift</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {netDelta === null
              ? "—"
              : netDelta > 0
                ? `+${netDelta} pts`
                : `${netDelta} pts`}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Comparing oldest ↔ latest</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Comparison Tool</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              Diff
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {audits.length >= 2 ? "Ready" : "Single run"}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            {audits.length >= 2 && latest && previous ? (
              <Link
                href={`/dashboard/compare?base=${previous.id}&target=${latest.id}`}
                className="text-ink underline underline-offset-2 hover:text-gray-1"
              >
                Compare latest ↔ prev →
              </Link>
            ) : (
              <span>Need 2+ runs to compare</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Project Filter Ribbon */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-[8px] border border-line bg-bg-soft/50 p-2 font-mono text-[12.5px]">
        <span className="px-2 text-muted uppercase text-[11px]">Select Domain:</span>
        {projects.map((p) => {
          const active = p.id === selected.id;
          return (
            <Link
              key={p.id}
              href={`/dashboard/history?project=${p.id}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-[6px] border px-3 py-1 transition-colors ${
                active
                  ? "border-ink bg-ink text-white font-medium"
                  : "border-line bg-white text-gray-1 hover:border-ink hover:text-ink dark:bg-white/10"
              }`}
            >
              {p.name || hostOf(p.url)}
            </Link>
          );
        })}
      </div>

      {/* 4. Time-Series Trend & Radar Analysis */}
      {audits.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line bg-bg-soft/60 p-12 text-center">
          <span className="font-mono text-[12px] text-muted uppercase">No Run Data</span>
          <p className="mt-2 text-[14px] text-gray-1">
            No audits recorded for {selected.name || hostOf(selected.url)} within the plan retention window.
          </p>
          <Link
            href={`/dashboard/projects/${selected.id}`}
            className="mt-4 inline-block rounded border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink hover:border-ink dark:bg-white/10"
          >
            Open project &amp; trigger scan →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Trend Chart */}
          <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="mb-2 flex items-baseline justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">
                  Overall Score Trajectory
                </h2>
                <p className="font-mono text-[12px] text-muted">
                  Time-series progression across all recorded runs
                </p>
              </div>
              <span className="font-mono text-[12px] text-gray-1">
                {audits.length} data points
              </span>
            </div>
            <div className="pt-2">
              <TrendChart points={points} />
            </div>
          </section>

          {/* Categorical Radar */}
          <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="mb-3 flex items-baseline justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">
                  Category Breakdown
                </h2>
                <p className="font-mono text-[12px] text-muted">
                  Latest run vs previous run
                </p>
              </div>
              {latest ? (
                <span
                  className={`font-mono text-[13px] font-semibold ${TONE_TEXT[scoreTone(latest.overall_score)]}`}
                >
                  {latest.overall_score ?? "—"}
                </span>
              ) : null}
            </div>
            {latest ? (
              <RadarChart
                current={toAxes(latest)}
                previous={previous ? toAxes(previous) : undefined}
              />
            ) : null}
          </section>
        </div>
      )}

      {/* 5. Granular Run History Table */}
      {audits.length > 0 && (
        <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
          <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-ink">
                Audit Run History
              </h2>
              <span className="rounded bg-line px-1.5 py-0.5 font-mono text-[11px] text-gray-1">
                {audits.length} runs
              </span>
            </div>
            <span className="font-mono text-[12px] text-muted">
              Click run time for full diagnostic report
            </span>
          </div>
          <AuditsTable audits={audits} showCompare />
        </section>
      )}
    </div>
  );
}
