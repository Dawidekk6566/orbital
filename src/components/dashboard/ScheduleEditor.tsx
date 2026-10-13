"use client";

import { useState, useTransition } from "react";
import { upsertSchedule, deleteSchedule } from "@/app/(dashboard)/actions/schedule";
import type { PlanId } from "@/lib/plans";
import { timeAgo } from "@/lib/dashboard/score";

/* ============================================================
   ScheduleEditor — configure a project's automatic re-audit.
   Cadence options are capped to what the plan allows (Pro = daily,
   Team = hourly). Saving routes through the upsertSchedule action;
   turning it off keeps the row but tears down the QStash schedule.
   ============================================================ */

type Cadence = "hourly" | "daily";

const CADENCE_LABEL: Record<Cadence, string> = {
  hourly: "Every hour",
  daily: "Every day",
};

export function ScheduleEditor({
  projectId,
  plan,
  maxCadence,
  initial,
}: {
  projectId: string;
  plan: PlanId;
  maxCadence: "daily" | "hourly";
  initial: {
    cadence: Cadence;
    strategy: "mobile" | "desktop";
    enabled: boolean;
    nextRunAt: string | null;
    lastRunAt: string | null;
  } | null;
}) {
  const options: Cadence[] = maxCadence === "hourly" ? ["hourly", "daily"] : ["daily"];

  const [cadence, setCadence] = useState<Cadence>(initial?.cadence ?? "daily");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">(
    initial?.strategy ?? "mobile",
  );
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await upsertSchedule({ projectId, cadence, strategy, enabled });
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  function remove() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await deleteSchedule(projectId);
      if (result?.error) setError(result.error);
      else {
        setEnabled(false);
        setSaved(true);
      }
    });
  }

  return (
    <div className="rounded-[10px] border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
            Automatic re-audit
          </h2>
          <p className="mt-1 text-[13px] text-gray-1">
            Orbital re-runs this audit on a schedule and records the result.
          </p>
        </div>
        <label className="flex flex-none cursor-pointer items-center gap-2 text-[13px] text-gray-1">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-ink"
          />
          Enabled
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-muted">
            Cadence
          </span>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as Cadence)}
            disabled={!enabled || pending}
            className="w-full cursor-pointer rounded-[8px] border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {options.map((c) => (
              <option key={c} value={c}>
                {CADENCE_LABEL[c]}
              </option>
            ))}
          </select>
          {maxCadence !== "hourly" ? (
            <span className="mt-1 block text-[12px] text-muted">
              Hourly audits need the Team plan.
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-muted">
            Strategy
          </span>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as "mobile" | "desktop")}
            disabled={!enabled || pending}
            className="w-full cursor-pointer rounded-[8px] border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </label>
      </div>

      {initial?.enabled ? (
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-[12px] text-gray-1">
          {initial.nextRunAt ? (
            <div>
              <dt className="inline text-muted">Next run: </dt>
              <dd className="inline font-mono">
                {new Date(initial.nextRunAt).toLocaleString("en-US")}
              </dd>
            </div>
          ) : null}
          {initial.lastRunAt ? (
            <div>
              <dt className="inline text-muted">Last run: </dt>
              <dd className="inline font-mono">{timeAgo(initial.lastRunAt)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center rounded-full bg-ink px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#222] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save schedule"}
        </button>
        {initial ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-[13px] text-gray-1 transition-colors hover:text-bad disabled:opacity-60"
          >
            Remove
          </button>
        ) : null}
        {saved ? <span className="text-[13px] text-good">Saved.</span> : null}
        {error ? <span className="text-[13px] text-bad">{error}</span> : null}
      </div>

      {plan === "free" ? (
        <p className="mt-4 border-t border-line pt-4 text-[13px] text-gray-1">
          Scheduled audits aren&apos;t part of the Free plan.
        </p>
      ) : null}
    </div>
  );
}
