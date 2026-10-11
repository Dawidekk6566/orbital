import "server-only";

import { Client, Receiver } from "@upstash/qstash";
import type { PlanCadence } from "@/lib/plans";

/* ============================================================
   Upstash QStash — HTTP-push cron for scheduled re-audits.

   QStash calls our worker (`/api/worker/run-audit`) on a cron; the
   worker verifies the request signature before doing anything. Both
   the scheduling client and the receiver are optional: without keys
   the dashboard still records schedule intent (row + next_run_at)
   and simply doesn't dispatch — graceful degradation, no crash.

   NOTE: QStash can only reach a PUBLIC url. On localhost the schedule
   row is stored but QStash won't be able to call back until APP_URL
   points at a tunnnel/deployment.
   ============================================================ */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** True when we can create QStash schedules (token present). */
export function isQStashConfigured(): boolean {
  return Boolean(QSTASH_TOKEN);
}

/** True when we can verify inbound worker signatures. */
export function isQStashReceiverConfigured(): boolean {
  return Boolean(QSTASH_CURRENT_SIGNING_KEY && QSTASH_NEXT_SIGNING_KEY);
}

/** Cron expression for a cadence (UTC). Off-the-hour to spread load. */
export function cronFor(cadence: Exclude<PlanCadence, "none">): string {
  return cadence === "hourly" ? "13 * * * *" : "17 6 * * *"; // daily 06:17 UTC
}

/** Next fire time for a cadence, for display + prune bookkeeping. */
export function nextRunAt(
  cadence: Exclude<PlanCadence, "none">,
  from: Date = new Date(),
): Date {
  const next = new Date(from);
  if (cadence === "hourly") {
    next.setUTCMinutes(13, 0, 0);
    if (next <= from) next.setUTCHours(next.getUTCHours() + 1);
  } else {
    next.setUTCHours(6, 17, 0, 0);
    if (next <= from) next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

function client(): Client {
  if (!QSTASH_TOKEN) {
    throw new Error("QStash is not configured (QSTASH_TOKEN missing).");
  }
  return new Client({ token: QSTASH_TOKEN });
}

/** Receiver for verifying `Upstash-Signature`, or null when unconfigured. */
export function qstashReceiver(): Receiver | null {
  if (!QSTASH_CURRENT_SIGNING_KEY || !QSTASH_NEXT_SIGNING_KEY) return null;
  return new Receiver({
    currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: QSTASH_NEXT_SIGNING_KEY,
  });
}

/**
 * Create (or replace) the QStash schedule for a project. Deletes any
 * prior schedule id first so cadence changes don't leave orphans.
 * Returns the new QStash schedule id, or null when QStash isn't
 * configured (caller still persists the row).
 */
export async function upsertQStashSchedule(opts: {
  projectId: string;
  cadence: Exclude<PlanCadence, "none">;
  existingScheduleId?: string | null;
}): Promise<string | null> {
  if (!isQStashConfigured()) return null;
  const c = client();

  if (opts.existingScheduleId) {
    try {
      await c.schedules.delete(opts.existingScheduleId);
    } catch {
      // Already gone / never existed — safe to ignore and recreate.
    }
  }

  const res = await c.schedules.create({
    destination: `${APP_URL}/api/worker/run-audit`,
    cron: cronFor(opts.cadence),
    body: JSON.stringify({ projectId: opts.projectId }),
    headers: { "Content-Type": "application/json" },
  });
  return res.scheduleId;
}

/** Remove a QStash schedule by id. No-op when unconfigured or absent. */
export async function deleteQStashSchedule(
  scheduleId: string | null | undefined,
): Promise<void> {
  if (!scheduleId || !isQStashConfigured()) return;
  try {
    await client().schedules.delete(scheduleId);
  } catch {
    // Best-effort: an already-deleted schedule is not an error here.
  }
}
