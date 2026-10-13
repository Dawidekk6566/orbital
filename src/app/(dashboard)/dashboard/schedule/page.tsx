import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listProjects, getSchedule, listSchedules } from "@/lib/dashboard/queries";
import { limitsFor, PLAN_LABELS, type PlanId } from "@/lib/plans";
import { ScheduleEditor } from "@/components/dashboard/ScheduleEditor";
import { timeAgo } from "@/lib/dashboard/score";

export const metadata: Metadata = {
  title: "Schedule — Orbital",
};

/* ============================================================
   Schedule (/dashboard/schedule) — Continuous monitoring engine.
   Configure cron intervals, inspect execution queues, and
   automate performance regression discovery.
   ============================================================ */

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: requested } = await searchParams;
  const team = await getCurrentTeam();
  const plan: PlanId = team?.plan ?? "free";
  const limits = limitsFor(plan);
  const [projects, allSchedules] = await Promise.all([
    listProjects(),
    listSchedules(),
  ]);

  const activeCount = allSchedules.filter((s) => s.enabled).length;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Continuous Monitoring / Cron Dispatch
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Schedule
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Automate recurring technical re-audits across daily or hourly cadences to catch regressions early.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>Cadence Cap: {limits.schedule === "none" ? "Upgrade required" : limits.schedule}</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">{PLAN_LABELS[plan]} Tier</span>
        </div>
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Active Schedules</span>
            <span className="font-mono text-[10.5px] text-gray-1">Running</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {activeCount}
            <span className="text-[14px] text-faint"> / {projects.length} sites</span>
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Automated cron triggers</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Interval Resolution</span>
            <span className="font-mono text-[10.5px] text-gray-1">Plan limit</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink capitalize">
            {limits.schedule === "none" ? "Manual only" : `${limits.schedule} runs`}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            {limits.schedule === "none" ? (
              <Link href="/dashboard/billing" className="underline underline-offset-2 hover:text-ink">
                Upgrade to Pro →
              </Link>
            ) : (
              <span>QStash queue enabled</span>
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Regression Watch</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              Alerts
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            Enabled
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <Link href="/dashboard/alerts" className="underline underline-offset-2 hover:text-ink">
              Configure alert rules →
            </Link>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Worker Queue</span>
            <span className="font-mono text-[10.5px] text-gray-1">Engine</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            Serverless
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Sub-second worker execution</span>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line bg-bg-soft/60 p-12 text-center">
          <span className="font-mono text-[12px] text-muted uppercase">No Sites to Schedule</span>
          <p className="mt-2 text-[14px] text-gray-1">
            Add a website as a project first to set up its background re-audit schedule.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Add a project
          </Link>
        </div>
      ) : limits.schedule === "none" ? (
        <div className="rounded-[10px] border border-line bg-white/95 p-8 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5 text-center">
          <span className="font-mono text-[12px] text-muted uppercase">Pro &amp; Team Feature</span>
          <h2 className="mt-2 text-[18px] font-semibold text-ink">
            Continuous scheduled audits are available on Pro and Team
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] text-gray-1">
            Upgrade your plan to automate daily or hourly re-audits without needing to trigger them manually.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-5 inline-block rounded bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Upgrade to Pro →
          </Link>
        </div>
      ) : (
        <ScheduleSection
          projects={projects}
          requested={requested}
          plan={plan}
          maxCadence={limits.schedule}
        />
      )}
    </div>
  );
}

async function ScheduleSection({
  projects,
  requested,
  plan,
  maxCadence,
}: {
  projects: Awaited<ReturnType<typeof listProjects>>;
  requested: string | undefined;
  plan: PlanId;
  maxCadence: "daily" | "hourly";
}) {
  const selected = projects.find((p) => p.id === requested) ?? projects[0];
  const schedule = await getSchedule(selected.id);

  return (
    <div className="flex flex-col gap-6">
      {/* Domain Selector Ribbon */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-[8px] border border-line bg-bg-soft/50 p-2 font-mono text-[12.5px]">
        <span className="px-2 text-muted uppercase text-[11px]">Select Domain:</span>
        {projects.map((p) => {
          const active = p.id === selected.id;
          return (
            <Link
              key={p.id}
              href={`/dashboard/schedule?project=${p.id}`}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Editor Workbench */}
        <section className="rounded-[10px] border border-line bg-white/95 p-6 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
          <div className="mb-4 border-b border-line pb-3">
            <h2 className="text-[16px] font-semibold text-ink">
              Schedule Configuration: {selected.name || hostOf(selected.url)}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted">
              Control recurrence cadence, audit strategy and notification triggers.
            </p>
          </div>

          <ScheduleEditor
            key={selected.id}
            projectId={selected.id}
            plan={plan}
            maxCadence={maxCadence}
            initial={
              schedule
                ? {
                    cadence: schedule.cadence,
                    strategy: schedule.strategy,
                    enabled: schedule.enabled,
                    nextRunAt: schedule.next_run_at,
                    lastRunAt: schedule.last_run_at,
                  }
                : null
            }
          />
        </section>

        {/* Schedule Telemetry Sidebar */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Schedule Telemetry</span>
            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-muted">Status:</span>
                <span className={schedule?.enabled ? "text-good font-semibold" : "text-muted"}>
                  {schedule?.enabled ? "● Active" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-muted">Last run:</span>
                <span className="text-ink">
                  {schedule?.last_run_at ? timeAgo(schedule.last_run_at) : "Never"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Target Strategy:</span>
                <span className="text-ink uppercase">{schedule?.strategy ?? "desktop"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-line bg-bg-soft/40 p-4 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Execution Note:</span>
            <p className="mt-1 text-gray-1 leading-[1.5]">
              Scheduled audits are dispatched using Upstash QStash and run via isolated Playwright workers to guarantee zero noisy-neighbor drift.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
