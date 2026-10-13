import type { Metadata } from "next";
import Link from "next/link";
import { getUser, getProfile, getCurrentTeam } from "@/lib/auth/dal";
import {
  listProjects,
  countProjects,
  getAuditsThisMonth,
  listRecentAudits,
  listSchedules,
} from "@/lib/dashboard/queries";
import { limitsFor, PLAN_LABELS } from "@/lib/plans";
import { scoreTone, TONE_TEXT, timeAgo } from "@/lib/dashboard/score";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { GuestImportClaimer } from "@/components/dashboard/GuestImportClaimer";
import { DashboardQuickAudit } from "@/components/dashboard/DashboardQuickAudit";

export const metadata: Metadata = {
  title: "Overview — Orbital",
};

/* ============================================================
   Overview (/dashboard) — High-density, developer-grade telemetry
   command center. Features instant scan launcher, fleet stats,
   quick action ribbon, tracked projects, recent activity feed,
   and engine health monitor.
   ============================================================ */

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function OverviewPage() {
  const [user, profile, team, projects, urlCount, auditsUsed, recentAudits, schedules] =
    await Promise.all([
      getUser(),
      getProfile(),
      getCurrentTeam(),
      listProjects(),
      countProjects(),
      getAuditsThisMonth(),
      listRecentAudits(5),
      listSchedules(),
    ]);

  const plan = team?.plan ?? "free";
  const limits = limitsFor(plan);
  const greetingName =
    profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  // Calculate average score across tracked projects with audits
  const scoredProjects = projects.filter((p) => p.latest_score !== null);
  const avgScore =
    scoredProjects.length > 0
      ? Math.round(
          scoredProjects.reduce((acc, p) => acc + (p.latest_score ?? 0), 0) /
            scoredProjects.length,
        )
      : null;
  const avgTone = scoreTone(avgScore);

  const auditsLimit = limits.auditsPerMonth;
  const auditPct =
    auditsLimit === null
      ? 0
      : Math.min(100, Math.round((auditsUsed / Math.max(1, auditsLimit)) * 100));

  const urlLimit = limits.urls;
  const urlPct =
    urlLimit === null
      ? 0
      : Math.min(100, Math.round((urlCount / Math.max(1, urlLimit)) * 100));

  return (
    <div className="flex flex-col gap-8">
      <GuestImportClaimer />

      {/* 1. Header with Live Telemetry Pulse */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Diagnostic Workspace
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Welcome back, {greetingName}
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Real-time telemetry, continuous monitoring and performance regression tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>Nodes: 100% Operational</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">Global Edge CDN</span>
        </div>
      </div>

      {/* 2. Instant On-Demand Audit Scanner */}
      <DashboardQuickAudit />

      {/* 3. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Stat 1: Plan Tier */}
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Account Plan</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              Active
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {PLAN_LABELS[plan]}
          </p>
          <div className="mt-2 flex items-center justify-between text-[12px]">
            <Link
              href="/dashboard/billing"
              className="text-gray-1 underline underline-offset-2 transition-colors hover:text-ink"
            >
              Manage billing
            </Link>
            <span className="font-mono text-[11px] text-muted">
              {plan === "free" ? "Personal" : "Team seat"}
            </span>
          </div>
        </div>

        {/* Stat 2: Monthly Audits Quota */}
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Audits this month</span>
            <span className="font-mono text-[10.5px] text-gray-1">
              {auditsLimit === null ? "Unlimited" : `${auditPct}% used`}
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {auditsUsed}
            <span className="text-[14px] text-faint">
              {" / "}
              {auditsLimit === null ? "∞" : auditsLimit}
            </span>
          </p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ink transition-all duration-300"
              style={{ width: `${auditsLimit === null ? 8 : auditPct}%` }}
            />
          </div>
        </div>

        {/* Stat 3: Monitored URLs */}
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Monitored Sites</span>
            <span className="font-mono text-[10.5px] text-gray-1">
              {urlLimit === null ? "Unlimited" : `${urlPct}% capacity`}
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {urlCount}
            <span className="text-[14px] text-faint">
              {" / "}
              {urlLimit === null ? "∞" : urlLimit}
            </span>
          </p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ink transition-all duration-300"
              style={{ width: `${urlLimit === null ? 12 : urlPct}%` }}
            />
          </div>
        </div>

        {/* Stat 4: Fleet Average Score */}
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Fleet Health Score</span>
            <span className="font-mono text-[10.5px] text-gray-1">
              {scoredProjects.length} sites scored
            </span>
          </div>
          <p
            className={`mt-2.5 font-mono text-[22px] font-semibold ${
              avgScore !== null ? TONE_TEXT[avgTone] : "text-gray-1"
            }`}
          >
            {avgScore !== null ? `${avgScore}/100` : "—"}
          </p>
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted">
            <span>Core Web Vitals &amp; SEO</span>
            <Link
              href="/dashboard/history"
              className="text-gray-1 underline underline-offset-2 hover:text-ink"
            >
              Trends
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Quick Action Shortcuts Ribbon */}
      <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-line bg-bg-soft/50 p-2 text-[12.5px] font-mono">
        <span className="px-2 text-muted uppercase text-[11px]">Shortcuts:</span>
        <Link
          href="/dashboard/audits/new"
          className="rounded-[6px] border border-line bg-white px-3 py-1 text-ink transition-colors hover:border-ink hover:bg-bg-soft dark:bg-white/10"
        >
          + New custom audit
        </Link>
        <Link
          href="/dashboard/projects"
          className="rounded-[6px] border border-line bg-white px-3 py-1 text-gray-1 transition-colors hover:border-ink hover:text-ink dark:bg-white/10"
        >
          Track new project
        </Link>
        <Link
          href="/dashboard/compare"
          className="rounded-[6px] border border-line bg-white px-3 py-1 text-gray-1 transition-colors hover:border-ink hover:text-ink dark:bg-white/10"
        >
          Compare 2 runs
        </Link>
        <Link
          href="/dashboard/schedule"
          className="rounded-[6px] border border-line bg-white px-3 py-1 text-gray-1 transition-colors hover:border-ink hover:text-ink dark:bg-white/10"
        >
          Automated schedule ({schedules.filter((s) => s.enabled).length} active)
        </Link>
        <Link
          href="/dashboard/alerts"
          className="rounded-[6px] border border-line bg-white px-3 py-1 text-gray-1 transition-colors hover:border-ink hover:text-ink dark:bg-white/10"
        >
          Regression alerts
        </Link>
        <Link
          href="/dashboard/api-keys"
          className="rounded-[6px] border border-line bg-white px-3 py-1 text-gray-1 transition-colors hover:border-ink hover:text-ink dark:bg-white/10"
        >
          API tokens
        </Link>
      </div>

      {/* 5. Main Split Section: Projects & Live Telemetry Stream */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Tracked Projects or Interactive Setup Matrix */}
        <div className="flex flex-col gap-6">
          {projects.length > 0 ? (
            <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                    Tracked Projects
                  </h2>
                  <span className="rounded bg-line px-1.5 py-0.5 font-mono text-[11px] text-gray-1">
                    {projects.length}
                  </span>
                </div>
                <Link
                  href="/dashboard/projects"
                  className="font-mono text-[12px] text-gray-1 underline underline-offset-2 transition-colors hover:text-ink"
                >
                  View all projects →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {projects.slice(0, 6).map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-[10px] border border-line bg-white/95 p-6 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
              <div className="border-b border-line pb-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  Quickstart Setup Guide
                </span>
                <h2 className="mt-1 text-[17px] font-semibold text-ink">
                  Set up your diagnostic monitoring
                </h2>
                <p className="mt-1 text-[13.5px] text-gray-1">
                  Complete these steps to unlock automated tracking, score regression alerts and historical trends.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col justify-between rounded-[8px] border border-line bg-bg-soft/40 p-4 transition-colors hover:border-line-strong">
                  <div>
                    <span className="font-mono text-[11px] text-muted">01 / AUDIT</span>
                    <h3 className="mt-1 text-[14px] font-medium text-ink">
                      Run your first on-demand scan
                    </h3>
                    <p className="mt-1 text-[12.5px] text-gray-1">
                      Audit any live website URL using the scanner above or the custom audit tool.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/audits/new"
                    className="mt-3.5 inline-block text-[12.5px] font-medium text-ink underline underline-offset-2"
                  >
                    Launch custom audit →
                  </Link>
                </div>

                <div className="flex flex-col justify-between rounded-[8px] border border-line bg-bg-soft/40 p-4 transition-colors hover:border-line-strong">
                  <div>
                    <span className="font-mono text-[11px] text-muted">02 / TRACK</span>
                    <h3 className="mt-1 text-[14px] font-medium text-ink">
                      Add a project URL
                    </h3>
                    <p className="mt-1 text-[12.5px] text-gray-1">
                      Store your domain as a permanent project to keep history and compare runs over time.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/projects"
                    className="mt-3.5 inline-block text-[12.5px] font-medium text-ink underline underline-offset-2"
                  >
                    Add project →
                  </Link>
                </div>

                <div className="flex flex-col justify-between rounded-[8px] border border-line bg-bg-soft/40 p-4 transition-colors hover:border-line-strong">
                  <div>
                    <span className="font-mono text-[11px] text-muted">03 / AUTOMATE</span>
                    <h3 className="mt-1 text-[14px] font-medium text-ink">
                      Schedule recurrent audits
                    </h3>
                    <p className="mt-1 text-[12.5px] text-gray-1">
                      Run daily or hourly diagnostic jobs automatically to detect regressions before users do.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/schedule"
                    className="mt-3.5 inline-block text-[12.5px] font-medium text-ink underline underline-offset-2"
                  >
                    Set cadence schedule →
                  </Link>
                </div>

                <div className="flex flex-col justify-between rounded-[8px] border border-line bg-bg-soft/40 p-4 transition-colors hover:border-line-strong">
                  <div>
                    <span className="font-mono text-[11px] text-muted">04 / INTEGRATE</span>
                    <h3 className="mt-1 text-[14px] font-medium text-ink">
                      CI/CD &amp; REST API access
                    </h3>
                    <p className="mt-1 text-[12.5px] text-gray-1">
                      Trigger audits from GitHub Actions, GitLab CI or deployment webhooks with API keys.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/api-keys"
                    className="mt-3.5 inline-block text-[12.5px] font-medium text-ink underline underline-offset-2"
                  >
                    Generate API token →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Engine Capability Specifications */}
          <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-mono text-[11.5px] text-muted uppercase">
                Diagnostic Engine Modules
              </span>
              <span className="font-mono text-[11px] text-good">
                All engines ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-[12px]">
              <div className="rounded border border-line bg-bg-soft/40 p-2.5">
                <span className="text-muted block text-[10.5px]">Core Web Vitals</span>
                <span className="text-ink font-semibold mt-0.5 block">LCP, INP, CLS</span>
              </div>
              <div className="rounded border border-line bg-bg-soft/40 p-2.5">
                <span className="text-muted block text-[10.5px]">Security Analysis</span>
                <span className="text-ink font-semibold mt-0.5 block">HSTS, CSP, TLS 1.3</span>
              </div>
              <div className="rounded border border-line bg-bg-soft/40 p-2.5">
                <span className="text-muted block text-[10.5px]">Accessibility</span>
                <span className="text-ink font-semibold mt-0.5 block">WCAG 2.1 AA</span>
              </div>
              <div className="rounded border border-line bg-bg-soft/40 p-2.5">
                <span className="text-muted block text-[10.5px]">SEO &amp; Indexing</span>
                <span className="text-ink font-semibold mt-0.5 block">JSON-LD, Robots</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Recent Audits & Activity Feed */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="mb-3.5 flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                <h2 className="text-[14px] font-semibold text-ink">Recent Audits</h2>
              </div>
              <Link
                href="/dashboard/history"
                className="font-mono text-[11.5px] text-gray-1 underline underline-offset-2 hover:text-ink"
              >
                Full history
              </Link>
            </div>

            {recentAudits.length > 0 ? (
              <div className="flex flex-col divide-y divide-line">
                {recentAudits.map((a) => {
                  const project = projects.find((p) => p.id === a.project_id);
                  const title = project?.name || (project ? hostOf(project.url) : "Ad-hoc scan");
                  const tone = scoreTone(a.overall_score);

                  return (
                    <Link
                      key={a.id}
                      href={`/dashboard/audits/${a.id}`}
                      className="group flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-bg-soft/60 px-1 rounded"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[12.5px] font-medium text-ink group-hover:underline">
                          {title}
                        </p>
                        <p className="font-mono text-[11px] text-muted">
                          {timeAgo(a.created_at)} · {a.strategy ?? "desktop"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono text-[15px] font-semibold ${TONE_TEXT[tone]}`}
                        >
                          {a.overall_score ?? "—"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="font-mono text-[12px] text-muted">
                  No audits logged yet.
                </p>
                <p className="mt-1 text-[12.5px] text-gray-1">
                  Run an audit using the bar above to start collecting diagnostics.
                </p>
              </div>
            )}
          </section>

          {/* Quick Diagnostics Tip Card */}
          <div className="rounded-[10px] border border-line bg-bg-soft/50 p-4.5 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Pro tip:</span>
            <p className="mt-1 text-ink font-medium leading-[1.5]">
              Add automated cron schedules to detect Core Web Vitals regressions on production deployments.
            </p>
            <Link
              href="/dashboard/schedule"
              className="mt-2.5 inline-block text-[11.5px] text-gray-1 underline underline-offset-2 hover:text-ink"
            >
              Configure schedules →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
