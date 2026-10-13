import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listProjects, listAlertRules } from "@/lib/dashboard/queries";
import { limitsFor, PLAN_LABELS, type PlanId } from "@/lib/plans";
import { AlertRuleEditor } from "@/components/dashboard/AlertRuleEditor";

export const metadata: Metadata = {
  title: "Alerts — Orbital",
};

/* ============================================================
   Alerts (/dashboard/alerts) — Incident detection & notifications.
   Configure score regression triggers, Slack hooks and webhooks.
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
  const alertsAvailable = limitsFor(plan).alerts;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Regression Detectors / Incident Dispatch
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Alerts
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Get instant notifications when Core Web Vitals degrade, security scores drop, or critical regressions surface.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>Dispatch Channels: Slack, Webhook, In-App</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">{PLAN_LABELS[plan]} Plan</span>
        </div>
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Alert Integration</span>
            <span className="font-mono text-[10.5px] text-gray-1">Status</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {alertsAvailable ? "Enabled" : "Upgrade"}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>{alertsAvailable ? "Multi-channel active" : "Pro/Team required"}</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Delivery Latency</span>
            <span className="font-mono text-[10.5px] text-gray-1">Speed</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            &lt; 500ms
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Asynchronous worker dispatch</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Trigger Types</span>
            <span className="font-mono text-[10.5px] text-gray-1">Rules</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            4 Modes
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Score, delta, critical, cron</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Webhook Security</span>
            <span className="font-mono text-[10.5px] text-gray-1">Auth</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            HMAC-SHA256
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Signed payload verification</span>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line bg-bg-soft/60 p-12 text-center">
          <span className="font-mono text-[12px] text-muted uppercase">No Monitored Sites</span>
          <p className="mt-2 text-[14px] text-gray-1">
            Add a project first to set up automated regression triggers and Slack webhooks for it.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Add a project
          </Link>
        </div>
      ) : !alertsAvailable ? (
        <div className="rounded-[10px] border border-line bg-white/95 p-8 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5 text-center">
          <span className="font-mono text-[12px] text-muted uppercase">Pro &amp; Team Feature</span>
          <h2 className="mt-2 text-[18px] font-semibold text-ink">
            Automated regression alerting is included on Pro and Team
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] text-gray-1">
            Get pinged on Slack, webhooks, or in-app whenever an audit drops below your defined threshold.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-5 inline-block rounded bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            View Pro plans →
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
    <div className="flex flex-col gap-6">
      {/* Domain Selector Ribbon */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-[8px] border border-line bg-bg-soft/50 p-2 font-mono text-[12.5px]">
        <span className="px-2 text-muted uppercase text-[11px]">Select Domain:</span>
        {projects.map((p) => {
          const active = p.id === selected.id;
          return (
            <Link
              key={p.id}
              href={`/dashboard/alerts?project=${p.id}`}
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
        {/* Rules Editor */}
        <section className="rounded-[10px] border border-line bg-white/95 p-6 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
          <div className="mb-4 border-b border-line pb-3">
            <h2 className="text-[16px] font-semibold text-ink">
              Alert Rules: {selected.name || hostOf(selected.url)}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted">
              Define triggers, score deviation thresholds, and target channels.
            </p>
          </div>

          <AlertRuleEditor key={selected.id} projectId={selected.id} rules={rules} />
        </section>

        {/* Sidebar Help */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Active Rules for Site</span>
            <p className="mt-2 text-[20px] font-semibold text-ink">
              {rules.filter((r) => r.enabled).length} active
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              Total {rules.length} configured rules
            </p>
          </div>

          <div className="rounded-[10px] border border-line bg-bg-soft/40 p-4 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Webhook Integration:</span>
            <p className="mt-1 text-gray-1 leading-[1.5]">
              Outgoing alert payloads include full audit metadata, score deltas, and categorized violation summaries formatted for Slack Block Kit or standard JSON consumers.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
