import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { getSubscription } from "@/lib/dashboard/queries";
import { isStripeConfigured, type PaidPlan } from "@/lib/billing/stripe";
import { PLAN_LABELS, type PlanId } from "@/lib/plans";
import {
  PlanCard,
  type PlanCardData,
  type PlanFeature,
} from "@/components/billing/PlanCard";
import { UpgradeButton, ManageBillingButton } from "@/components/billing/BillingActions";

export const metadata: Metadata = {
  title: "Billing — Orbital",
};

/* ============================================================
   Billing (/dashboard/billing) — Subscription management & tiers.
   Inspect active plan, monthly quotas, invoices and upgrades.
   ============================================================ */

type BillingPlan = PlanCardData & { id: PlanId };

const FEATURE_LABELS = [
  "Audits / month",
  "URLs tracked",
  "Scheduled re-audits",
  "Run history",
  "Team seats",
  "Slack & webhook alerts",
  "CI & REST API access",
] as const;

const PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "/ forever",
    tagline: "Essential diagnostics for single projects.",
    features: build(["25", "1", null, "7 days", "1", null, null]),
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    cadence: "/ month",
    popular: true,
    tagline: "Automation, 1-year history and API for growing teams.",
    features: build(["2,000", "25", "Daily", "1 year", "3", "Yes", "Yes"]),
  },
  {
    id: "team",
    name: "Team",
    price: "$99",
    cadence: "/ month",
    tagline: "Unlimited scale with hourly schedules & priority support.",
    features: build([
      "Unlimited",
      "Unlimited",
      "Hourly",
      "Unlimited",
      "Unlimited",
      "Yes",
      "Yes",
    ]),
  },
];

function build(values: (string | null)[]): PlanFeature[] {
  return FEATURE_LABELS.map((label, i) => ({ label, value: values[i] }));
}

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, team: 2 };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [team, { checkout }] = await Promise.all([getCurrentTeam(), searchParams]);

  if (!team) {
    return (
      <div className="flex flex-col gap-8">
        <header className="border-b border-line pb-6">
          <h1 className="text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Billing
          </h1>
        </header>
        <p className="rounded-[10px] border border-dashed border-line bg-bg-soft/60 p-12 text-center text-[14px] text-gray-1 font-mono">
          No active team found. Sign in to manage billing.
        </p>
      </div>
    );
  }

  const subscription = await getSubscription(team.id);
  const configured = isStripeConfigured();
  const canManage = team.role === "owner" || team.role === "admin";
  const current = team.plan;
  const hasCustomer = subscription !== null;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Subscription Management / Stripe Portal
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Billing &amp; Plans
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Current subscription details, monthly audit allowances, and organization tier upgrades.
          </p>
        </div>

        {canManage && hasCustomer ? (
          <ManageBillingButton />
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
            <span className="h-1.5 w-1.5 rounded-full bg-good" />
            <span>Active Tier: {PLAN_LABELS[current]}</span>
            <span className="text-line-strong">·</span>
            <span className="text-muted">Invoices synced</span>
          </div>
        )}
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Current Tier</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              Active
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {PLAN_LABELS[current]}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>
              {subscription?.cancel_at_period_end
                ? "Cancels at end of cycle"
                : "Renews automatically"}
            </span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Audit Capacity</span>
            <span className="font-mono text-[10.5px] text-gray-1">Monthly</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {current === "free" ? "25" : current === "pro" ? "2,000" : "Unlimited"}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Dual-engine executions</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Monitored Domains</span>
            <span className="font-mono text-[10.5px] text-gray-1">Endpoints</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {current === "free" ? "1 site" : current === "pro" ? "25 sites" : "Unlimited"}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Project history tracking</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>API &amp; CI/CD</span>
            <span className="font-mono text-[10.5px] text-gray-1">Tokens</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {current === "free" ? "Locked" : "Unlocked"}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>{current === "free" ? "Pro required" : "REST + CLI active"}</span>
          </div>
        </div>
      </div>

      {checkout === "success" ? (
        <div className="rounded-[8px] border border-line bg-bg-soft px-4 py-3 font-mono text-[13px] text-ink">
          Payment confirmed. Plan privileges are updated automatically.
        </div>
      ) : null}
      {checkout === "cancelled" ? (
        <div className="rounded-[8px] border border-line bg-bg-soft px-4 py-3 font-mono text-[13px] text-gray-1">
          Checkout was cancelled — your current subscription remains untouched.
        </div>
      ) : null}

      {!configured ? (
        <div className="rounded-[8px] border border-dashed border-line bg-bg-soft px-4 py-3 font-mono text-[12.5px] text-muted">
          Stripe billing is not configured in this local environment. Plans are displayed for reference.
        </div>
      ) : !canManage ? (
        <div className="rounded-[8px] border border-dashed border-line bg-bg-soft px-4 py-3 font-mono text-[12.5px] text-muted">
          Only team owners or admins have authority to upgrade subscription plans.
        </div>
      ) : null}

      {/* 3. Plans Grid */}
      <div className="grid grid-cols-3 gap-5 max-[920px]:grid-cols-1">
        {PLANS.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            index={i}
            badge={plan.id === current ? "Current plan" : undefined}
            highlight={plan.id === current || plan.popular}
            cta={renderCta({ plan, current, configured, canManage })}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4 font-mono text-[12px] text-muted">
        <span>Invoices &amp; tax receipts handled via Stripe Customer Portal.</span>
        <Link href="/pricing" className="text-gray-1 underline underline-offset-2 hover:text-ink">
          Detailed feature matrix →
        </Link>
      </div>
    </div>
  );
}

function renderCta({
  plan,
  current,
  configured,
  canManage,
}: {
  plan: BillingPlan;
  current: PlanId;
  configured: boolean;
  canManage: boolean;
}) {
  if (plan.id === current) {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-full border border-line px-5 py-[11px] text-[14px] font-medium text-muted">
        Current plan
      </span>
    );
  }

  if (plan.id === "free") {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-full border border-line px-5 py-[11px] text-[13px] text-gray-1">
        Cancel in portal to downgrade
      </span>
    );
  }

  const target = plan.id as PaidPlan;
  const rankUp = PLAN_RANK[plan.id] > PLAN_RANK[current];
  const label = rankUp ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;

  return (
    <UpgradeButton
      plan={target}
      label={label}
      primary={plan.popular ?? false}
      disabled={!configured || !canManage}
    />
  );
}
