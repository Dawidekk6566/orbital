import type { Metadata } from "next";
import { getCurrentTeam } from "@/lib/auth/dal";
import { getAuditsThisMonth } from "@/lib/dashboard/queries";
import { limitsFor, type PlanId } from "@/lib/plans";
import { runAdHocAudit } from "@/app/(dashboard)/actions/projects";
import { AuditInput } from "@/components/audit/AuditInput";

export const metadata: Metadata = {
  title: "New audit — Orbital",
};

/* ============================================================
   New audit (/dashboard/audits/new) — run a one-off audit from any
   input mode. The AuditInput CC builds the AnalyzeRequest and calls
   runAdHocAudit (quota-gated, validated server-side), which redirects
   to the resulting report. A URL that matches a tracked project is
   attached to it automatically.
   ============================================================ */

export default async function NewAuditPage() {
  const team = await getCurrentTeam();
  const plan: PlanId = team?.plan ?? "free";
  const used = await getAuditsThisMonth();
  const cap = limitsFor(plan).auditsPerMonth;

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          New audit
        </h1>
        <p className="mt-1 text-[13px] text-gray-1">
          Audit a live URL, pasted code, uploaded files or a screenshot.
        </p>
      </header>

      <div className="mt-7 rounded-[12px] border border-line bg-white p-[clamp(18px,3vw,28px)]">
        <AuditInput action={runAdHocAudit} />
      </div>

      <p className="mt-4 font-mono text-[12px] text-muted">
        {cap === null
          ? `${used} audits this month · unlimited on ${plan}`
          : `${used}/${cap} audits used this month on ${plan}`}
      </p>
    </div>
  );
}
