"use client";

import { useState, useTransition } from "react";
import { deleteProject } from "@/app/(dashboard)/actions/projects";

/* ============================================================
   DeleteProjectButton — destructive, so it asks for confirmation
   before calling deleteProject. Runs in a transition; on success the
   action redirects to the projects list, on failure shows the error.
   ============================================================ */

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-bad transition-colors hover:border-bad"
        >
          Delete project
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-full bg-bad px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-gray-1 transition-colors hover:text-ink"
        >
          Cancel
        </button>
      </div>
      {error ? <p className="text-[13px] text-bad">{error}</p> : null}
    </div>
  );
}
