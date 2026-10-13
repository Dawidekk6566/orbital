import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAudit, getPreviousAuditId } from "@/lib/dashboard/queries";
import { ResultsDashboard } from "@/components/dashboard/ResultsDashboard";
import { AuditActions } from "@/components/dashboard/AuditActions";

export const metadata: Metadata = {
  title: "Audit report — Orbital",
};

/* ============================================================
   Audit report (/dashboard/audits/[id]) — the persisted report,
   rendered through the existing ResultsDashboard in embedded mode
   (showReset=false) with dates pinned to en-US. The AuditActions bar
   adds re-run / print / export. RLS scopes getAudit; foreign id →
   notFound(). params is a Promise in Next 16.
   ============================================================ */

export default async function AuditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) notFound();

  const previousId = audit.project_id
    ? await getPreviousAuditId(audit.project_id, audit.created_at)
    : null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={
            audit.project_id
              ? `/dashboard/projects/${audit.project_id}`
              : "/dashboard/projects"
          }
          className="text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
        >
          ← Back to project
        </Link>
        <div className="flex items-center gap-4">
          {previousId ? (
            <Link
              href={`/dashboard/compare?base=${previousId}&target=${audit.id}`}
              className="text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
            >
              Compare with previous
            </Link>
          ) : null}
          <AuditActions
            auditId={audit.id}
            projectId={audit.project_id}
            shareToken={audit.share_token}
            report={audit.report}
          />
        </div>
      </div>

      <ResultsDashboard report={audit.report} showReset={false} dateLocale="en-US" />
    </div>
  );
}
