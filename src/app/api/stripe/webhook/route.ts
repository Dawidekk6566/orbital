import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, isStripeWebhookConfigured, webhookSecret, planForPriceId } from "@/lib/billing/stripe";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/stripe/webhook — the ONLY writer of subscriptions +
   teams.plan. Verifies Stripe's signature over the RAW request body
   (constructEventAsync), then mirrors the subscription into Postgres
   via the service-role client (bypasses RLS — the caller is Stripe,
   not a signed-in user). Everything else in the app only reads plan.

   Unconfigured (no webhook secret or no service-role key) → 503 so
   the local app still builds and runs. Stripe retries on non-2xx.
   ============================================================ */

// Active-ish statuses that should unlock a paid plan. Anything else
// (canceled, unpaid, incomplete_expired…) falls back to free.
const LIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

function periodEndISO(sub: Stripe.Subscription): string | null {
  // The period moved from the subscription root onto its items in
  // recent API versions; read whichever the installed SDK exposes.
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
  const root = sub as unknown as { current_period_end?: number };
  const unix = item?.current_period_end ?? root.current_period_end;
  return unix ? new Date(unix * 1000).toISOString() : null;
}

async function resolveTeamId(
  supabase: ReturnType<typeof createServiceRoleClient>,
  sub: Stripe.Subscription,
  hint: string | null,
): Promise<string | null> {
  const fromMeta = sub.metadata?.team_id;
  if (fromMeta) return fromMeta;
  if (hint) return hint;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;

  const { data } = await supabase
    .from("teams")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function syncSubscription(sub: Stripe.Subscription, teamHint: string | null) {
  const supabase = createServiceRoleClient();
  const teamId = await resolveTeamId(supabase, sub, teamHint);
  if (!teamId) return; // Unmapped subscription — nothing to update.

  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const plan: PlanId = LIVE_STATUSES.has(sub.status)
    ? planForPriceId(priceId)
    : "free";
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const now = new Date().toISOString();

  await supabase.from("subscriptions").upsert(
    {
      team_id: teamId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: priceId,
      plan,
      current_period_end: periodEndISO(sub),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      updated_at: now,
    },
    { onConflict: "team_id" },
  );

  // teams.plan is the single gate input — keep it in lock-step.
  await supabase.from("teams").update({ plan }).eq("id", teamId);
}

export async function POST(request: NextRequest) {
  if (!isStripeWebhookConfigured() || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "billing not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      raw,
      signature,
      webhookSecret(),
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subId) {
          const sub = await stripe().subscriptions.retrieve(subId);
          await syncSubscription(sub, session.client_reference_id ?? null);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub, null);
        break;
      }
      default:
        break; // Ignore unrelated events.
    }
  } catch {
    // Let Stripe retry on a processing error.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
