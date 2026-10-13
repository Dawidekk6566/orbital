"use client";

import { useState, useTransition } from "react";
import { runAudit } from "@/app/(dashboard)/actions/projects";
import { createShareLink, revokeShareLink } from "@/app/(dashboard)/actions/share";
import { CosmicLoaderModal } from "@/components/dashboard/CosmicLoaderModal";
import type { AnalysisReport } from "@/lib/analysis/types";
import { AgencyReportModal } from "@/components/dashboard/agency/AgencyReportModal";

/* ============================================================
   AuditActions — the toolbar above an embedded report. Re-run (when
   the audit belongs to a project), a public copy-link share token,
   print / branded Agency PDF, and a JSON/MD export served by
   /api/export/audit/[id].
   ============================================================ */

const BTN =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-[180ms] disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-ink text-white hover:bg-[#222]`;
const BTN_OUTLINE = `${BTN} border border-line text-ink hover:border-ink hover:bg-bg-soft`;

export function AuditActions({
  auditId,
  projectId,
  shareToken: initialShareToken = null,
  report,
}: {
  auditId: string;
  projectId: string | null;
  shareToken?: string | null;
  report?: AnalysisReport;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isReRunning, setIsReRunning] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [copied, setCopied] = useState(false);
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);

  function reRun() {
    if (!projectId) return;
    setError(null);
    setIsReRunning(true);
    startTransition(async () => {
      const result = await runAudit(projectId);
      if (result?.error) {
        setError(result.error);
        setIsReRunning(false);
      }
    });
  }

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link. Copy it from the address bar of /share.");
    }
  }

  function share() {
    setError(null);
    if (shareToken) {
      void copyLink(shareToken);
      return;
    }
    startTransition(async () => {
      const result = await createShareLink(auditId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.token) {
        setShareToken(result.token);
        await copyLink(result.token);
      }
    });
  }

  function revoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeShareLink(auditId);
      if (result.error) setError(result.error);
      else setShareToken(null);
    });
  }

  const [copiedMd, setCopiedMd] = useState(false);

  async function copyMarkdown() {
    try {
      const res = await fetch(`/api/export/audit/${auditId}?format=markdown`);
      if (!res.ok) throw new Error();
      const md = await res.text();
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch {
      setError("Failed to copy markdown report to clipboard.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {projectId ? (
        <button type="button" onClick={reRun} disabled={pending} className={BTN_PRIMARY}>
          {pending ? "Auditing…" : "Re-run audit"}
        </button>
      ) : null}
      <button type="button" onClick={share} disabled={pending} className={BTN_OUTLINE}>
        {copied ? "Link copied" : shareToken ? "Copy share link" : "Share"}
      </button>
      {shareToken ? (
        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className="text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
        >
          Revoke link
        </button>
      ) : null}
      {report ? (
        <button
          type="button"
          onClick={() => setAgencyModalOpen(true)}
          className={`${BTN_OUTLINE} border-ink/40 font-medium hover:border-ink`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden="true" />
          <span>Agency PDF Report</span>
        </button>
      ) : null}
      <button type="button" onClick={() => window.print()} className={BTN_OUTLINE}>
        Print
      </button>
      <button type="button" onClick={copyMarkdown} className={BTN_OUTLINE}>
        {copiedMd ? "MD copied!" : "Copy MD"}
      </button>
      <a
        href={`/api/export/audit/${auditId}?format=markdown`}
        download={`orbital-audit-${auditId}.md`}
        className={BTN_OUTLINE}
      >
        Export MD
      </a>
      <a
        href={`/api/export/audit/${auditId}`}
        download={`orbital-audit-${auditId}.json`}
        className={BTN_OUTLINE}
      >
        Export JSON
      </a>
      {error ? <p className="w-full text-[13px] text-bad">{error}</p> : null}

      <CosmicLoaderModal
        active={isReRunning && pending}
        target="Re-running Audit"
        onCancel={() => setIsReRunning(false)}
      />

      {report ? (
        <AgencyReportModal
          report={report}
          auditId={auditId}
          isOpen={agencyModalOpen}
          onClose={() => setAgencyModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
