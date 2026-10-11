import "server-only";

import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";

/* ============================================================
   Stripe (test mode) — lazy client + config guards, mirroring the
   QStash helper. Everything degrades gracefully: without a secret
   key the billing actions return a friendly error and the webhook
   replies 503, so the app still builds and runs on localhost.

   `teams.plan` is the single source of truth for gating and is
   written ONLY by the webhook (service role). Checkout/portal just
   start Stripe-hosted flows; the subscription state flows back in.
   ============================================================ */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PRICE_PRO = process.env.STRIPE_PRICE_PRO;
const PRICE_TEAM = process.env.STRIPE_PRICE_TEAM;

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY && PRICE_PRO && PRICE_TEAM);
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET);
}

let _client: Stripe | null = null;

/** The Stripe client. Throws if unconfigured — guard with isStripeConfigured. */
export function stripe(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY).");
  }
  if (!_client) {
    _client = new Stripe(STRIPE_SECRET_KEY, {
      // Pin nothing here — the installed SDK's default API version is used.
      typescript: true,
    });
  }
  return _client;
}

export function webhookSecret(): string {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret is not configured.");
  }
  return STRIPE_WEBHOOK_SECRET;
}

/** Paid plans that map to a Stripe price. `free` has no price. */
export type PaidPlan = Exclude<PlanId, "free">;

/** The Stripe price id for a paid plan, or null when not configured. */
export function priceIdForPlan(plan: PaidPlan): string | null {
  if (plan === "pro") return PRICE_PRO ?? null;
  if (plan === "team") return PRICE_TEAM ?? null;
  return null;
}

/** Reverse map: which plan a Stripe price id represents. */
export function planForPriceId(priceId: string | null | undefined): PlanId {
  if (priceId && priceId === PRICE_PRO) return "pro";
  if (priceId && priceId === PRICE_TEAM) return "team";
  return "free";
}
