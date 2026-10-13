import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listProjects, countProjects, listSchedules } from "@/lib/dashboard/queries";
import { limitsFor } from "@/lib/plans";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { NewProjectForm } from "@/components/dashboard/NewProjectForm";
import { scoreTone, TONE_TEXT } from "@/lib/dashboard/score";

export const metadata: Metadata = {
  title: "Projects — Orbital",
};

/* ============================================================
   Projects (/dashboard/projects) — High-density fleet management.
   Displays tracked endpoints, average health score, URL capacity,
   and project creation workbench.
   ============================================================ */

export default async function ProjectsPage() {
  const [projects, count, team, schedules] = await Promise.all([
    listProjects(),
    countProjects(),
    getCurrentTeam(),
    listSchedules(),
  ]);

  const plan = team?.plan ?? "free";
  const limit = limitsFor(plan).urls;
  const atCap = limit !== null && count >= limit;
  const capPct = limit === null ? 0 : Math.min(100, Math.round((count / Math.max(1, limit)) * 100));

  const scoredProjects = projects.filter((p) => p.latest_score !== null);
  const avgScore =
    scoredProjects.length > 0
      ? Math.round(
          scoredProjects.reduce((acc, p) => acc + (p.latest_score ?? 0), 0) /
            scoredProjects.length,
        )
      : null;
  const avgTone = scoreTone(avgScore);
  const activeSchedules = schedules.filter((s) => s.enabled).length;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Pulse */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Fleet Directory / Monitored Domains
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Projects
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Manage your tracked domains, configure viewport strategies, and trigger manual or scheduled audits.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>{count} Endpoints Registered</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">{limit !== null ? `${limit - count} slots remaining` : "Unlimited"}</span>
        </div>
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Tracked Sites</span>
            <span className="font-mono text-[10.5px] text-gray-1">
              {limit === null ? "Unlimited" : `${capPct}% capacity`}
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {count}
            <span className="text-[14px] text-faint">
              {" / "}
              {limit === null ? "∞" : limit}
            </span>
          </p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ink transition-all duration-300"
              style={{ width: `${limit === null ? 14 : capPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Fleet Average</span>
            <span className="font-mono text-[10.5px] text-gray-1">
              {scoredProjects.length} audited
            </span>
          </div>
          <p
            className={`mt-2.5 font-mono text-[22px] font-semibold ${
              avgScore !== null ? TONE_TEXT[avgTone] : "text-gray-1"
            }`}
          >
            {avgScore !== null ? `${avgScore}/100` : "—"}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Aggregated CWV &amp; SEO</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Automated Cadence</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              Schedules
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {activeSchedules}
            <span className="text-[14px] text-faint"> active</span>
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <Link href="/dashboard/schedule" className="underline underline-offset-2 hover:text-ink">
              Configure timing →
            </Link>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Diagnostic Strategy</span>
            <span className="font-mono text-[10.5px] text-gray-1">Default</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            Desktop
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Emulated Moto G4 + 4G Lab</span>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section */}
      <div className="grid grid-cols-[1fr_340px] gap-6 max-[920px]:grid-cols-1">
        {/* Left: Projects Feed */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-ink">
                Monitored Sites ({projects.length})
              </h2>
            </div>
            <span className="font-mono text-[12px] text-muted">
              Sorted by newest
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-line bg-bg-soft/60 p-12 text-center">
              <span className="font-mono text-[12px] text-muted uppercase">Empty Directory</span>
              <h3 className="mt-1 text-[17px] font-semibold text-ink">
                No sites tracked yet
              </h3>
              <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] text-gray-1">
                Add your target URL using the form on the right. Once added, Orbital will store history,
                track Core Web Vitals over time, and allow automatic background re-audits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Add Project Form & Guide */}
        <aside className="flex flex-col gap-6">
          <div className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                Track a new website
              </h2>
              <p className="mt-0.5 text-[12.5px] text-muted">
                Add an endpoint to maintain score history.
              </p>
            </div>

            <div className="mt-4">
              {atCap ? (
                <div className="rounded-[6px] border border-line bg-bg-soft p-4 text-[13px] text-gray-1 font-mono">
                  <p>You&apos;ve reached your plan&apos;s limit of {limit} tracked URLs.</p>
                  <Link
                    href="/dashboard/billing"
                    className="mt-3 inline-block rounded bg-ink px-3 py-1.5 text-white hover:bg-[#222]"
                  >
                    Upgrade plan →
                  </Link>
                </div>
              ) : (
                <NewProjectForm />
              )}
            </div>
          </div>

          {/* Technical Tips */}
          <div className="rounded-[10px] border border-line bg-bg-soft/40 p-4 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Technical Note:</span>
            <p className="mt-1 text-gray-1 leading-[1.5]">
              Project audits automatically verify canonical origin, canonical headers, and robots.txt parity across staging and production.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
