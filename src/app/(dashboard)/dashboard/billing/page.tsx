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
   Billing (/dashboard/billing) — shows the three plans with the
   team's current plan marked, and owner/admin controls to upgrade
   (Stripe Checkout) or manage the subscription (Stripe portal).
   teams.plan is the source of truth (written only by the webhook);
   this page just reflects it. Everything degrades gracefully when
   Stripe isn't configured.
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
    tagline: "Everything you need to audit a single site.",
    features: build(["25", "1", null, "7 days", "1", null, null]),
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    cadence: "/ month",
    popular: true,
    tagline: "Automation, history and API for growing teams.",
    features: build(["2,000", "25", "Daily", "1 year", "3", "Yes", "Yes"]),
  },
  {
    id: "team",
    name: "Team",
    price: "$99",
    cadence: "/ month",
    tagline: "Unlimited scale with SSO and priority support.",
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
      <div>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          Billing
        </h1>
        <p className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center text-[14px] text-gray-1">
          No active team. Sign in to manage billing.
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
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
            Billing
          </h1>
          <p className="mt-1 text-[13px] text-gray-1">
            You&rsquo;re on the{" "}
            <span className="font-medium text-ink">{PLAN_LABELS[current]}</span>{" "}
            plan.
            {subscription?.cancel_at_period_end
              ? " Cancels at the end of the current period."
              : null}
          </p>
        </div>
        {canManage && hasCustomer ? <ManageBillingButton /> : null}
      </header>

      {checkout === "success" ? (
        <p className="mt-6 rounded-[10px] border border-line bg-bg-soft px-4 py-3 text-[13px] text-ink">
          Checkout complete. Your plan updates within a few seconds once Stripe
          confirms the payment.
        </p>
      ) : null}
      {checkout === "cancelled" ? (
        <p className="mt-6 rounded-[10px] border border-line bg-bg-soft px-4 py-3 text-[13px] text-gray-1">
          Checkout cancelled — no changes were made.
        </p>
      ) : null}

      {!configured ? (
        <p className="mt-6 rounded-[10px] border border-dashed border-line bg-bg-soft px-4 py-3 text-[13px] text-gray-1">
          Billing isn&rsquo;t configured in this environment. Plans are shown for
          reference; upgrades are disabled until Stripe keys are added.
        </p>
      ) : !canManage ? (
        <p className="mt-6 rounded-[10px] border border-dashed border-line bg-bg-soft px-4 py-3 text-[13px] text-gray-1">
          Only an owner or admin can change the plan. Ask a team manager to
          upgrade.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-3 gap-[clamp(14px,1.5vw,22px)] max-[920px]:grid-cols-1 max-[920px]:gap-4">
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

      <p className="mt-6 text-[12.5px] text-gray-1">
        Downgrades and cancellations are handled in{" "}
        {hasCustomer ? "Manage billing" : "the billing portal"} — your data and
        history are kept.{" "}
        <Link
          href="/pricing"
          className="underline underline-offset-2 hover:text-ink"
        >
          Compare plans
        </Link>
        .
      </p>
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
  // Current plan: no action, just a marker.
  if (plan.id === current) {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-full border border-line px-5 py-[11px] text-[15px] font-medium text-muted">
        Current plan
      </span>
    );
  }

  // The Free tier is reached by cancelling in the portal, not checkout.
  if (plan.id === "free") {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-full border border-line px-5 py-[11px] text-[13px] text-gray-1">
        Cancel to downgrade
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
