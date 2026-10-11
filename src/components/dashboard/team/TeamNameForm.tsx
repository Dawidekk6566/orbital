"use client";

import { useState, useTransition } from "react";
import { renameTeam } from "@/app/(dashboard)/actions/team";

/* ============================================================
   TeamNameForm — inline rename for the current team. Owner/admin
   only (the caller-role gate lives on the server; this hides the
   control for members). Saves on submit via a Server Action.
   ============================================================ */

export function TeamNameForm({ name }: { name: string }) {
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = value.trim() !== name.trim();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await renameTeam(value);
      if (result?.error || result?.fieldError) {
        setError(result.error ?? result.fieldError ?? "Couldn't save.");
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        disabled={pending}
        maxLength={60}
        aria-label="Team name"
        className="w-full max-w-sm rounded-[8px] border border-line bg-white px-3.5 py-2 text-[15px] text-ink outline-none transition-colors focus:border-ink disabled:opacity-60"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending || !dirty}
        className="inline-flex flex-none items-center justify-center rounded-full border border-line px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink hover:bg-bg-soft disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {error ? <span className="text-[13px] text-bad">{error}</span> : null}
      {saved && !dirty ? (
        <span className="text-[13px] text-good">Saved</span>
      ) : null}
    </div>
  );
}
