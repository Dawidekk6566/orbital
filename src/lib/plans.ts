/* ============================================================
   Plan gating — mirrors the pricing page (src/app/(marketing)/
   pricing/page.tsx). RLS enforces ownership; THESE limits are the
   business rules, enforced server-side in Server Actions / RPC.
   `teams.plan` (kept fresh by the Stripe webhook) is the single
   gate input, read through the DAL. Never trust the UI.
   ============================================================ */

export type PlanId = "free" | "pro" | "team";

export type PlanCadence = "none" | "daily" | "hourly";

export type PlanLimits = {
  /** Audits per calendar month. null = unlimited. */
  auditsPerMonth: number | null;
  /** Distinct project URLs tracked. null = unlimited. */
  urls: number | null;
  /** Fastest scheduled re-audit cadence allowed. */
  schedule: PlanCadence;
  /** Run-history retention in days. null = unlimited. */
  historyDays: number | null;
  /** Team seats. null = unlimited. */
  seats: number | null;
  /** Slack/webhook alert rules available. */
  alerts: boolean;
  /** CI & REST API access. */
  api: boolean;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    auditsPerMonth: 25,
    urls: 1,
    schedule: "none",
    historyDays: 7,
    seats: 1,
    alerts: false,
    api: false,
  },
  pro: {
    auditsPerMonth: 2000,
    urls: 25,
    schedule: "daily",
    historyDays: 365,
    seats: 3,
    alerts: true,
    api: true,
  },
  team: {
    auditsPerMonth: null,
    urls: null,
    schedule: "hourly",
    historyDays: null,
    seats: null,
    alerts: true,
    api: true,
  },
};

export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

const CADENCE_RANK: Record<PlanCadence, number> = {
  none: 0,
  daily: 1,
  hourly: 2,
};

export function limitsFor(plan: PlanId): PlanLimits {
  return PLAN_LIMITS[plan];
}

/** True when `count` is still within (below) the plan's cap. */
export function withinLimit(limit: number | null, count: number): boolean {
  return limit === null || count < limit;
}

/** True when a requested cadence is allowed by the plan. */
export function cadenceAllowed(plan: PlanId, cadence: Exclude<PlanCadence, "none">): boolean {
  return CADENCE_RANK[cadence] <= CADENCE_RANK[PLAN_LIMITS[plan].schedule];
}

/** Cut-off date for history retention, or null when unlimited. */
export function historyCutoff(plan: PlanId, now: Date = new Date()): Date | null {
  const days = PLAN_LIMITS[plan].historyDays;
  if (days === null) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
