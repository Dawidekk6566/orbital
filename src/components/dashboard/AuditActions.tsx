"use client";

import { useState, useTransition } from "react";
import { runAudit } from "@/app/(dashboard)/actions/projects";
import { createShareLink, revokeShareLink } from "@/app/(dashboard)/actions/share";

/* ============================================================
   AuditActions — the toolbar above an embedded report. Re-run (when
   the audit belongs to a project), a public copy-link share token,
   print (the browser's "Save as PDF"), and a JSON export served by
   /api/export/audit/[id]. Kept out of ResultsDashboard so the
   marketing modal is untouched.
   ============================================================ */

const BTN =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-[180ms] disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-ink text-white hover:bg-[#222]`;
const BTN_OUTLINE = `${BTN} border border-line text-ink hover:border-ink hover:bg-bg-soft`;

export function AuditActions({
  auditId,
  projectId,
  shareToken: initialShareToken = null,
}: {
  auditId: string;
  projectId: string | null;
  shareToken?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [copied, setCopied] = useState(false);

  function reRun() {
    if (!projectId) return;
    setError(null);
    startTransition(async () => {
      const result = await runAudit(projectId);
      if (result?.error) setError(result.error);
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
      <button type="button" onClick={() => window.print()} className={BTN_OUTLINE}>
        Print / PDF
      </button>
      <a
        href={`/api/export/audit/${auditId}`}
        download={`orbital-audit-${auditId}.json`}
        className={BTN_OUTLINE}
      >
        Export JSON
      </a>
      {error ? <p className="w-full text-[13px] text-bad">{error}</p> : null}
    </div>
  );
}
