import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listProjects, getSchedule } from "@/lib/dashboard/queries";
import { limitsFor, type PlanId } from "@/lib/plans";
import { ScheduleEditor } from "@/components/dashboard/ScheduleEditor";

export const metadata: Metadata = {
  title: "Schedule — Orbital",
};

/* ============================================================
   Schedule (/dashboard/schedule) — pick a project (?project=) and
   configure its automatic re-audit. Cadence is plan-gated; Free
   sees an upgrade prompt instead of the editor. params/searchParams
   are Promises in Next 16 → await.
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
  const projects = await listProjects();

  return (
    <div>
      <header>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          Schedule
        </h1>
        <p className="mt-1 text-[13px] text-gray-1">
          Re-audit your sites automatically and keep an up-to-date score.
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center">
          <p className="text-[14px] text-gray-1">
            No projects yet. Add a site to schedule audits for it.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Add a project
          </Link>
        </div>
      ) : limits.schedule === "none" ? (
        <div className="mt-8 rounded-[10px] border border-line bg-white p-8 text-center">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
            Scheduled audits are a paid feature
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-gray-1">
            Upgrade to Pro for daily automatic re-audits, or Team for hourly.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-5 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            View plans
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
    <>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {projects.map((p) => {
          const active = p.id === selected.id;
          return (
            <Link
              key={p.id}
              href={`/dashboard/schedule?project=${p.id}`}
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

      <div className="mt-6 max-w-2xl">
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
      </div>
    </>
  );
}
