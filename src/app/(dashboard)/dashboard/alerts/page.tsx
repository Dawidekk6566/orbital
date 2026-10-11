import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listProjects, listAlertRules } from "@/lib/dashboard/queries";
import { limitsFor, type PlanId } from "@/lib/plans";
import { AlertRuleEditor } from "@/components/dashboard/AlertRuleEditor";

export const metadata: Metadata = {
  title: "Alerts — Orbital",
};

/* ============================================================
   Alerts (/dashboard/alerts) — pick a project (?project=) and manage
   its alert rules. Alerts are plan-gated (Pro+); Free sees an upgrade
   prompt. searchParams is a Promise in Next 16 → await.
   ============================================================ */

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: requested } = await searchParams;
  const team = await getCurrentTeam();
  const plan: PlanId = team?.plan ?? "free";
  const projects = await listProjects();

  return (
    <div>
      <header>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          Alerts
        </h1>
        <p className="mt-1 text-[13px] text-gray-1">
          Get notified when a site regresses — in-app, Slack or webhook.
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center">
          <p className="text-[14px] text-gray-1">
            No projects yet. Add a site to set up alerts for it.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Add a project
          </Link>
        </div>
      ) : !limitsFor(plan).alerts ? (
        <div className="mt-8 rounded-[10px] border border-line bg-white p-8 text-center">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
            Alerts are a paid feature
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-gray-1">
            Upgrade to Pro or Team to send alerts to Slack and webhooks.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-5 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            View plans
          </Link>
        </div>
      ) : (
        <AlertsSection projects={projects} requested={requested} />
      )}
    </div>
  );
}

async function AlertsSection({
  projects,
  requested,
}: {
  projects: Awaited<ReturnType<typeof listProjects>>;
  requested: string | undefined;
}) {
  const selected = projects.find((p) => p.id === requested) ?? projects[0];
  const rules = await listAlertRules(selected.id);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {projects.map((p) => {
          const active = p.id === selected.id;
          return (
            <Link
              key={p.id}
              href={`/dashboard/alerts?project=${p.id}`}
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
        <AlertRuleEditor key={selected.id} projectId={selected.id} rules={rules} />
      </div>
    </>
  );
}
