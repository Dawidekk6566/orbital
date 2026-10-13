"use client";

import { useState, useTransition } from "react";
import {
  upsertAlertRule,
  toggleAlertRule,
  deleteAlertRule,
} from "@/app/(dashboard)/actions/alerts";
import type { AlertRuleRow, AlertChannel } from "@/lib/dashboard/queries";

/* ============================================================
   AlertRuleEditor — manage a project's alert rules. Lists existing
   rules with an enable toggle + delete, and a form to add a new
   rule: a trigger, an optional threshold (score_below only), and
   one or more delivery channels. Validation mirrors the server
   action; the action re-validates and is the real gate.
   ============================================================ */

type TriggerType = AlertRuleRow["trigger_type"];
type ChannelType = AlertChannel["type"];

const TRIGGER_LABEL: Record<TriggerType, string> = {
  score_below: "Overall score drops below…",
  regression: "Any score regression vs. the previous run",
  new_critical_high: "A new critical or high issue appears",
  scheduled_complete: "Every completed scheduled audit",
};

const CHANNEL_LABEL: Record<ChannelType, string> = {
  inapp: "In-app",
  slack: "Slack",
  webhook: "Webhook",
};

const CHANNEL_PLACEHOLDER: Record<ChannelType, string> = {
  inapp: "",
  slack: "https://hooks.slack.com/services/…",
  webhook: "https://example.com/hooks/orbital",
};

function channelSummary(channels: AlertChannel[]): string {
  return channels.map((c) => CHANNEL_LABEL[c.type]).join(", ");
}

export function AlertRuleEditor({
  projectId,
  rules,
}: {
  projectId: string;
  rules: AlertRuleRow[];
}) {
  const [trigger, setTrigger] = useState<TriggerType>("score_below");
  const [threshold, setThreshold] = useState(70);
  const [channels, setChannels] = useState<AlertChannel[]>([{ type: "inapp" }]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setChannel(i: number, patch: Partial<AlertChannel>) {
    setChannels((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addChannel() {
    setChannels((cs) => [...cs, { type: "webhook", target: "" }]);
  }
  function removeChannel(i: number) {
    setChannels((cs) => cs.filter((_, idx) => idx !== i));
  }

  function create() {
    setError(null);
    startTransition(async () => {
      const result = await upsertAlertRule({
        projectId,
        triggerType: trigger,
        threshold: trigger === "score_below" ? threshold : null,
        enabled: true,
        channels,
      });
      if (result?.error || result?.fieldError) {
        setError(result.error ?? result.fieldError ?? "Couldn't save.");
      } else {
        setChannels([{ type: "inapp" }]);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* existing rules */}
      {rules.length > 0 ? (
        <ul className="divide-y divide-line rounded-[10px] border border-line bg-white">
          {rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} />
          ))}
        </ul>
      ) : (
        <p className="rounded-[10px] border border-dashed border-line bg-bg-soft px-5 py-6 text-center text-[13px] text-gray-1">
          No alert rules yet. Add one below.
        </p>
      )}

      {/* new rule */}
      <div className="rounded-[10px] border border-line bg-white p-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">New rule</h2>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-muted">
            Trigger
          </span>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as TriggerType)}
            disabled={pending}
            className="w-full cursor-pointer rounded-[8px] border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(Object.keys(TRIGGER_LABEL) as TriggerType[]).map((t) => (
              <option key={t} value={t}>
                {TRIGGER_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        {trigger === "score_below" ? (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-muted">
              Threshold — score {threshold}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={pending}
              className="sim-range w-full"
            />
          </label>
        ) : null}

        <div className="mt-4">
          <span className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-muted">
            Channels
          </span>
          <div className="space-y-2">
            {channels.map((ch, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={ch.type}
                  onChange={(e) =>
                    setChannel(i, {
                      type: e.target.value as ChannelType,
                      target: e.target.value === "inapp" ? undefined : ch.target ?? "",
                    })
                  }
                  disabled={pending}
                  className="flex-none cursor-pointer rounded-[8px] border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(Object.keys(CHANNEL_LABEL) as ChannelType[]).map((t) => (
                    <option key={t} value={t}>
                      {CHANNEL_LABEL[t]}
                    </option>
                  ))}
                </select>
                {ch.type !== "inapp" ? (
                  <input
                    type="url"
                    value={ch.target ?? ""}
                    onChange={(e) => setChannel(i, { target: e.target.value })}
                    placeholder={CHANNEL_PLACEHOLDER[ch.type]}
                    disabled={pending}
                    className="min-w-0 flex-1 rounded-[8px] border border-line bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-ink disabled:opacity-60"
                  />
                ) : (
                  <span className="flex-1 text-[13px] text-gray-1">
                    Shows in the notification bell.
                  </span>
                )}
                {channels.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeChannel(i)}
                    disabled={pending}
                    aria-label="Remove channel"
                    className="flex-none px-2 text-[16px] leading-none text-gray-1 transition-colors hover:text-bad disabled:opacity-60"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addChannel}
            disabled={pending}
            className="mt-2 text-[13px] text-gray-1 underline underline-offset-2 transition-colors hover:text-ink disabled:opacity-60"
          >
            + Add channel
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={create}
            disabled={pending}
            className="inline-flex items-center rounded-full bg-ink px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#222] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Add rule"}
          </button>
          {error ? <span className="text-[13px] text-bad">{error}</span> : null}
        </div>
      </div>
    </div>
  );
}

function RuleRow({ rule }: { rule: AlertRuleRow }) {
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(rule.enabled);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await toggleAlertRule(rule.id, next);
      if (result?.error) setEnabled(!next); // revert on failure
    });
  }
  function remove() {
    startTransition(async () => {
      await deleteAlertRule(rule.id);
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="truncate text-[14px] text-ink">
          {TRIGGER_LABEL[rule.trigger_type]}
          {rule.trigger_type === "score_below" && rule.threshold != null
            ? ` ${rule.threshold}`
            : ""}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-gray-1">
          {channelSummary(rule.channels)}
        </p>
      </div>
      <div className="flex flex-none items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-gray-1">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            disabled={pending}
            className="h-4 w-4 accent-ink"
          />
          {enabled ? "On" : "Off"}
        </label>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-[13px] text-gray-1 transition-colors hover:text-bad disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
