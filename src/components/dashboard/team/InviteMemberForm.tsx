"use client";

import { useActionState } from "react";
import { inviteMember } from "@/app/(dashboard)/actions/team";
import type { ActionResult } from "@/app/(dashboard)/actions/projects";

/* ============================================================
   InviteMemberForm — invite a teammate by email with a role.
   Submits to the inviteMember Server Action via useActionState;
   the action re-validates, gates on the plan's seat limit, and
   revalidates the team page on success. Disabled (with a reason)
   when the team is already at its seat cap.
   ============================================================ */

const INPUT =
  "w-full rounded-[8px] border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-ink focus:outline-none focus:ring-0 disabled:opacity-60";
const LABEL = "mb-1.5 block text-[13px] font-medium text-ink-2";

export function InviteMemberForm({
  seatsLeft,
  canManage,
}: {
  /** Remaining seats, or null when unlimited. */
  seatsLeft: number | null;
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    inviteMember,
    {},
  );

  const full = seatsLeft !== null && seatsLeft <= 0;
  const disabled = !canManage || full;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className={LABEL} htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="teammate@company.com"
            required
            autoComplete="off"
            disabled={disabled}
            className={INPUT}
          />
        </div>
        <div className="sm:w-40">
          <label className={LABEL} htmlFor="role">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="member"
            disabled={disabled}
            className={`${INPUT} cursor-pointer disabled:cursor-not-allowed`}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={disabled || pending}
          className="inline-flex flex-none items-center justify-center rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222] disabled:opacity-60"
        >
          {pending ? "Inviting…" : "Send invite"}
        </button>
      </div>

      {state?.fieldError ? (
        <p className="text-[12.5px] text-bad">{state.fieldError}</p>
      ) : null}
      {state?.error ? <p className="text-[13px] text-bad">{state.error}</p> : null}

      {!canManage ? (
        <p className="text-[12.5px] text-gray-1">
          Only an owner or admin can invite teammates.
        </p>
      ) : full ? (
        <p className="text-[12.5px] text-gray-1">
          You&apos;ve used every seat on your plan.{" "}
          <a href="/dashboard/billing" className="underline underline-offset-2 hover:text-ink">
            Upgrade
          </a>{" "}
          to invite more people.
        </p>
      ) : null}
    </form>
  );
}
