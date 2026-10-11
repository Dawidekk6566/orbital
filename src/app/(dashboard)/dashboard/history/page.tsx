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
   History + trends (/dashboard/history) — pick a project (?project=),
   see its score trend over time, a category radar (latest run with
   the previous run overlaid), and the full run table. Audits are
   retention-filtered by plan inside listAuditsForProject. searchParams
   is a Promise in Next 16 → await it.
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

  if (projects.length === 0) {
    return (
      <div>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          History &amp; trends
        </h1>
        <div className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center">
          <p className="text-[14px] text-gray-1">
            No projects yet. Add a site and run an audit to build a history.
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

  const selected =
    projects.find((p) => p.id === requested) ?? projects[0];
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
  const retentionDays = limitsFor(plan).historyDays;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
            History &amp; trends
          </h1>
          <p className="mt-1 text-[13px] text-gray-1">
            {retentionDays === null
              ? "Showing full history."
              : `${PLAN_LABELS[plan]} plan retains ${retentionDays} days of history.`}
            {retentionDays !== null && plan === "free" ? (
              <>
                {" "}
                <Link
                  href="/dashboard/billing"
                  className="underline underline-offset-2 hover:text-ink"
                >
                  Upgrade for more
                </Link>
                .
              </>
            ) : null}
          </p>
        </div>
        {audits.length >= 2 && latest && previous ? (
          <Link
            href={`/dashboard/compare?base=${previous.id}&target=${latest.id}`}
            className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-ink"
          >
            Compare latest ↔ previous
          </Link>
        ) : null}
      </header>

      {/* project selector */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {projects.map((p) => {
          const active = p.id === selected.id;
          return (
            <Link
              key={p.id}
              href={`/dashboard/history?project=${p.id}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-line text-gray-1 hover:border-ink hover:text-ink"
              }`}
            >
              {p.name || hostOf(p.url)}
            </Link>
          );
        })}
      </div>

      {audits.length === 0 ? (
        <div className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center">
          <p className="text-[14px] text-gray-1">
            No audits for {selected.name || hostOf(selected.url)} in the retained
            window.
          </p>
          <Link
            href={`/dashboard/projects/${selected.id}`}
            className="mt-4 inline-block rounded-full border border-line px-5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-ink"
          >
            Open project
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* trend */}
          <section className="rounded-[10px] border border-line bg-white p-5">
            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                Score trend
              </h2>
              <span className="text-[12px] text-muted">
                {audits.length} {audits.length === 1 ? "audit" : "audits"}
              </span>
            </div>
            <TrendChart points={points} />
          </section>

          {/* radar */}
          <section className="rounded-[10px] border border-line bg-white p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                Categories
              </h2>
              {latest ? (
                <span
                  className={`font-mono text-[13px] ${TONE_TEXT[scoreTone(latest.overall_score)]}`}
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

      {audits.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[15px] font-semibold tracking-[-0.01em]">
            All runs
          </h2>
          <AuditsTable audits={audits} showCompare />
        </section>
      )}
    </div>
  );
}
