"use client";

import { useState, useTransition } from "react";
import { runAudit } from "@/app/(dashboard)/actions/projects";
import { CosmicLoaderModal } from "@/components/dashboard/CosmicLoaderModal";

/* ============================================================
   RunAuditButton — triggers a fresh audit for a project. Calls the
   runAudit Server Action inside a transition; on success the action
   redirects to the new report (nothing returns here), on failure it
   returns an inline error (quota reached, unreachable URL, …).
   ============================================================ */

export function RunAuditButton({
  projectId,
  label = "Run audit",
  url,
}: {
  projectId: string;
  label?: string;
  url?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      // On success the action redirects and never returns a value.
      const result = await runAudit(projectId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222] disabled:opacity-60"
      >
        {pending ? "Auditing…" : label}
      </button>
      {error ? <p className="text-[13px] text-bad">{error}</p> : null}

      <CosmicLoaderModal
        active={pending}
        target={url || "Project Audit"}
      />
    </div>
  );
}
