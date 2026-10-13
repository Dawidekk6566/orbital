"use client";

import { useState, useTransition } from "react";
import { runCompetitorAudit } from "@/app/(dashboard)/actions/projects";
import { CosmicLoader } from "@/components/hero/CosmicLoader";

/* ============================================================
   CompetitorCompareForm — audit a competitor URL and jump to the
   versus view (this project's latest audit vs the competitor). Calls
   runCompetitorAudit in a transition; on success the action redirects
   to /dashboard/versus, on failure it returns an inline error (quota,
   invalid/duplicate URL, no baseline audit yet).
   ============================================================ */

export function CompetitorCompareForm({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success the action redirects and never returns a value.
      const result = await runCompetitorAudit(projectId, url);
      if (result?.error || result?.fieldError) {
        setError(result.error ?? result.fieldError ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="competitor.com"
          disabled={pending}
          className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-[9px] font-mono text-[13px] text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || url.trim() === ""}
          className="inline-flex items-center justify-center rounded-full border border-line px-5 py-[9px] text-[13px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          {pending ? "Auditing…" : "Compare"}
        </button>
      </div>
      {error ? <p className="text-[13px] text-bad">{error}</p> : null}

      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <CosmicLoader
            target={
              url.trim()
                ? /^https?:\/\//i.test(url.trim())
                  ? url.trim()
                  : `https://${url.trim()}`
                : "Competitor Benchmark"
            }
          />
        </div>
      )}
    </form>
  );
}
