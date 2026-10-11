"use client";

import { useActionState } from "react";
import { createProject, type ActionResult } from "@/app/(dashboard)/actions/projects";

/* ============================================================
   NewProjectForm — add a tracked URL. Submits to the createProject
   Server Action via useActionState; the action validates/normalizes
   the URL, gates on the plan's URL cap, and redirects to the new
   project on success. Field vs. general errors render inline.
   ============================================================ */

const INPUT =
  "w-full rounded-[8px] border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-ink";
const LABEL = "mb-1.5 block text-[13px] font-medium text-ink-2";

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createProject,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className={LABEL} htmlFor="url">
          Website URL
        </label>
        <input
          id="url"
          name="url"
          placeholder="example.com"
          required
          autoComplete="url"
          className={INPUT}
        />
        {state?.fieldError ? (
          <p className="mt-1 text-[12.5px] text-bad">{state.fieldError}</p>
        ) : null}
      </div>

      <div>
        <label className={LABEL} htmlFor="name">
          Name <span className="text-faint">(optional)</span>
        </label>
        <input id="name" name="name" className={INPUT} />
      </div>

      {state?.error ? <p className="text-[13px] text-bad">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222] disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add project"}
      </button>
    </form>
  );
}
