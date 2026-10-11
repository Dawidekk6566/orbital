"use client";

import { useActionState, useState, useTransition } from "react";
import { createApiKey, revokeApiKey, type CreateKeyResult } from "@/app/(dashboard)/actions/apiKeys";
import type { ApiKeyRow } from "@/lib/dashboard/queries";

/* ============================================================
   ApiKeyManager — list existing keys, mint a new one (the plaintext
   is shown exactly once in a copyable box), and revoke keys. All
   mutations re-check owner/admin + plan server-side; this is UI.
   ============================================================ */

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ApiKeyManager({
  keys,
  canManage,
}: {
  keys: ApiKeyRow[];
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    CreateKeyResult,
    FormData
  >(createApiKey, {});

  const active = keys.filter((k) => !k.revoked_at);
  const revoked = keys.filter((k) => k.revoked_at);

  return (
    <div>
      {/* New key result — shown once */}
      {state.key ? (
        <div className="mb-6 rounded-[10px] border border-line bg-bg-soft p-4">
          <p className="text-[13px] font-medium text-ink">
            Your new API key — copy it now, it won&rsquo;t be shown again.
          </p>
          <CopyableKey value={state.key} />
        </div>
      ) : null}

      {/* Create form */}
      {canManage ? (
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[12px] uppercase tracking-[0.06em] text-muted">
              New key name
            </span>
            <input
              name="name"
              type="text"
              required
              maxLength={60}
              placeholder="CI pipeline"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-ink px-5 py-[9px] text-[14px] font-medium text-white transition-colors hover:bg-[#222] disabled:opacity-55"
          >
            {pending ? "Creating…" : "Create key"}
          </button>
        </form>
      ) : (
        <p className="text-[13px] text-gray-1">
          Only an owner or admin can create API keys.
        </p>
      )}
      {state.fieldError ? (
        <p className="mt-2 text-[12px] text-bad">{state.fieldError}</p>
      ) : null}
      {state.error ? (
        <p className="mt-2 text-[12px] text-bad">{state.error}</p>
      ) : null}

      {/* Key list */}
      <div className="mt-8">
        {active.length === 0 && revoked.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-line bg-bg-soft p-8 text-center text-[13px] text-gray-1">
            No API keys yet.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-[10px] border border-line bg-white">
            {active.map((k) => (
              <KeyRow key={k.id} apiKey={k} canManage={canManage} />
            ))}
            {revoked.map((k) => (
              <KeyRow key={k.id} apiKey={k} canManage={canManage} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KeyRow({
  apiKey,
  canManage,
}: {
  apiKey: ApiKeyRow;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const revoked = Boolean(apiKey.revoked_at);

  function revoke() {
    setError(null);
    start(async () => {
      const res = await revokeApiKey(apiKey.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-[14px] font-medium ${revoked ? "text-muted line-through" : "text-ink"}`}
          >
            {apiKey.name}
          </span>
          {revoked ? (
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] text-muted">
              Revoked
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-gray-1">
          <code className="font-mono">{apiKey.key_prefix}…</code>
          <span>Created {fmtDate(apiKey.created_at)}</span>
          <span>Last used {fmtDate(apiKey.last_used_at)}</span>
        </div>
      </div>
      {canManage && !revoked ? (
        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className="rounded-full border border-line px-3 py-1.5 text-[12.5px] text-ink transition-colors hover:border-bad hover:text-bad disabled:opacity-55"
        >
          {pending ? "Revoking…" : "Revoke"}
        </button>
      ) : null}
      {error ? <p className="w-full text-[12px] text-bad">{error}</p> : null}
    </li>
  );
}

function CopyableKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — the value is selectable in the field.
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-white px-3 py-2 font-mono text-[13px] text-ink">
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className="whitespace-nowrap rounded-full border border-line px-3 py-2 text-[12.5px] text-ink transition-colors hover:border-ink hover:bg-white"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
