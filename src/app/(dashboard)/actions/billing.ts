"use server";

import { requireUser, getCurrentTeam, getTeamRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  stripe,
  isStripeConfigured,
  priceIdForPlan,
  type PaidPlan,
} from "@/lib/billing/stripe";

/* ============================================================
   Billing actions — start a Stripe Checkout for an upgrade, or open
   the customer portal to manage/cancel an existing subscription.

   Both return a { url } for the client to navigate to (we do NOT
   redirect() to an external URL from a Server Action — with JS on,
   that becomes a client-side navigation and breaks). The webhook,
   not these actions, is what actually changes teams.plan.

   Owner/admin only. Everything is gated on isStripeConfigured() so
   the app degrades gracefully without test keys.
   ============================================================ */

export type BillingResult = { url?: string; error?: string };

async function requireBillingManager(): Promise<
  | { ok: true; teamId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string }
> {
  await requireUser("/dashboard/billing");
  const team = await getCurrentTeam();
  if (!team) return { ok: false, error: "No active team." };
  const role = await getTeamRole(team.id);
  if (role !== "owner" && role !== "admin") {
    return { ok: false, error: "Only an owner or admin can manage billing." };
  }
  const supabase = await createClient();
  return { ok: true, teamId: team.id, supabase };
}

/** Reuse the team's Stripe customer id, creating one on first use. */
async function ensureCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
): Promise<string> {
  const { data: team } = await supabase
    .from("teams")
    .select("name, stripe_customer_id")
    .eq("id", teamId)
    .maybeSingle();

  if (team?.stripe_customer_id) return team.stripe_customer_id;

  const user = await requireUser();
  const customer = await stripe().customers.create({
    email: user.email ?? undefined,
    name: team?.name ?? undefined,
    metadata: { team_id: teamId },
  });

  await supabase
    .from("teams")
    .update({ stripe_customer_id: customer.id })
    .eq("id", teamId);

  return customer.id;
}

export async function startCheckout(plan: PaidPlan): Promise<BillingResult> {
  if (!isStripeConfigured()) {
    return { error: "Billing isn't configured yet. Add Stripe keys to enable it." };
  }
  const gate = await requireBillingManager();
  if (!gate.ok) return { error: gate.error };

  const priceId = priceIdForPlan(plan);
  if (!priceId) return { error: "That plan isn't available for checkout." };

  const appUrl = process.env.APP_URL ?? "";
  try {
    const customerId = await ensureCustomer(gate.supabase, gate.teamId);
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: gate.teamId,
      subscription_data: { metadata: { team_id: gate.teamId } },
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
    });
    if (!session.url) return { error: "Couldn't start checkout. Try again." };
    return { url: session.url };
  } catch {
    return { error: "Couldn't reach Stripe. Try again in a moment." };
  }
}

export async function openBillingPortal(): Promise<BillingResult> {
  if (!isStripeConfigured()) {
    return { error: "Billing isn't configured yet." };
  }
  const gate = await requireBillingManager();
  if (!gate.ok) return { error: gate.error };

  const { data: team } = await gate.supabase
    .from("teams")
    .select("stripe_customer_id")
    .eq("id", gate.teamId)
    .maybeSingle();

  if (!team?.stripe_customer_id) {
    return { error: "No billing account yet. Upgrade to a paid plan first." };
  }

  const appUrl = process.env.APP_URL ?? "";
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: team.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    });
    return { url: session.url };
  } catch {
    return { error: "Couldn't open the billing portal. Try again." };
  }
}
