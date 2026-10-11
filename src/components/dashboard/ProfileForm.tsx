"use client";

import { useActionState } from "react";
import {
  updateProfile,
  type ProfileResult,
} from "@/app/(dashboard)/actions/profile";

/* ============================================================
   ProfileForm — edit the current user's display name and avatar
   URL. Email comes from the auth identity and is read-only here.
   Submits to the updateProfile Server Action via useActionState;
   the action validates and scopes the write to the caller's row.
   ============================================================ */

const INPUT =
  "w-full rounded-[8px] border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-ink disabled:opacity-60";
const LABEL = "mb-1.5 block text-[13px] font-medium text-ink-2";

export function ProfileForm({
  email,
  fullName,
  avatarUrl,
}: {
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProfileResult, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <div>
        <label className={LABEL} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email ?? ""}
          readOnly
          disabled
          aria-describedby="email-hint"
          className={`${INPUT} cursor-not-allowed bg-bg-soft`}
        />
        <p id="email-hint" className="mt-1.5 text-[12.5px] text-gray-1">
          Your email is tied to your sign-in and can&apos;t be changed here.
        </p>
      </div>

      <div>
        <label className={LABEL} htmlFor="full_name">
          Display name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName ?? ""}
          placeholder="Your name"
          maxLength={80}
          autoComplete="name"
          disabled={pending}
          className={INPUT}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="avatar_url">
          Avatar URL
        </label>
        <input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={avatarUrl ?? ""}
          placeholder="https://…/avatar.png"
          disabled={pending}
          className={INPUT}
        />
        <p className="mt-1.5 text-[12.5px] text-gray-1">
          A link to an image. Leave blank to use your initials.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex flex-none items-center justify-center rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state?.ok ? (
          <span role="status" className="text-[13px] text-good">
            Saved
          </span>
        ) : null}
        {state?.fieldError ? (
          <span className="text-[12.5px] text-bad">{state.fieldError}</span>
        ) : null}
        {state?.error ? (
          <span className="text-[13px] text-bad">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
