import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listProjects, listAuditsForProject } from "@/lib/dashboard/queries";
import type { PlanId } from "@/lib/plans";
import { AgencySettingsForm } from "@/components/dashboard/agency/AgencySettingsForm";

export const metadata: Metadata = {
  title: "Agency & White-Label — Orbital",
};

/* ============================================================
   Agency & Client Reporting (/dashboard/agency)
   Configure white-label branding, executive summaries, and generate
   prestigious client PDF audits.
   ============================================================ */

export default async function AgencyPage() {
  const team = await getCurrentTeam();
  const plan: PlanId = team?.plan ?? "free";
  const projects = await listProjects();

  // Grab the latest audit across projects for quick test-drive
  let latestAuditId: string | null = null;
  let latestAuditTarget: string | null = null;
  if (projects.length > 0) {
    const audits = await listAuditsForProject(projects[0].id, plan);
    if (audits.length > 0) {
      latestAuditId = audits[0].id;
      latestAuditTarget = projects[0].url;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Client Advisory / White-Label Studio
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Agency &amp; Client Reporting
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Brand your audit reports, prepare executive C-level briefings, and generate publication-ready PDFs for your clients.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>White-Label: Enabled</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">A4 Vector PDF</span>
        </div>
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Export Engine</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              v2.4
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[20px] font-semibold text-ink">
            Vector A4
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>High-DPI Print Stylesheet</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Branding Mode</span>
            <span className="font-mono text-[10.5px] text-good">Active</span>
          </div>
          <p className="mt-2.5 font-mono text-[20px] font-semibold text-ink">
            White-Label
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Custom Logo &amp; Sign-off</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>ROI Calculator</span>
            <span className="font-mono text-[10.5px] text-gray-1">CrUX+Lighthouse</span>
          </div>
          <p className="mt-2.5 font-mono text-[20px] font-semibold text-ink">
            Executive
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Conversion Impact modeling</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>AI Studio</span>
            <span className="font-mono text-[10.5px] text-good">Ready</span>
          </div>
          <p className="mt-2.5 font-mono text-[20px] font-semibold text-ink">
            Patch Gen
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Git diff &amp; fix generation</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Banner if audits exist */}
      {latestAuditId && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-line bg-bg-soft/70 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white font-mono text-[12px]">
              📄
            </span>
            <div>
              <p className="text-[13.5px] font-medium text-ink">
                Test Export with Recent Audit: <span className="font-mono text-muted">{latestAuditTarget}</span>
              </p>
              <p className="text-[12px] text-muted">
                Open the latest audit report to preview the interactive agency export modal.
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/audits/${latestAuditId}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-[13px] font-medium text-ink shadow-sm transition-colors hover:border-ink dark:bg-black"
          >
            Open Audit Report →
          </Link>
        </div>
      )}

      {/* 4. Main Settings & Live Preview Grid */}
      <AgencySettingsForm />
    </div>
  );
}
