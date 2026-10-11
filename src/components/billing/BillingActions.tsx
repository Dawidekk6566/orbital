"use client";

import { useTransition, useState } from "react";
import { startCheckout, openBillingPortal } from "@/app/(dashboard)/actions/billing";
import type { PaidPlan } from "@/lib/billing/stripe";

/* ============================================================
   BillingActions — the interactive CTAs on /dashboard/billing.
   Server Actions can't redirect() to an external Stripe URL with
   JS on (it becomes a client navigation and breaks), so the
   actions RETURN { url } and we navigate here with
   window.location.href. Owner/admin gating is re-checked server-
   side; these buttons just surface the result / errors.
   ============================================================ */

const BTN_BASE =
  "inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-[11px] text-[15px] font-medium transition-colors duration-[180ms] disabled:cursor-not-allowed disabled:opacity-55";
const BTN_OUTLINE = `${BTN_BASE} border border-line text-ink hover:border-ink hover:bg-bg-soft`;
const BTN_PRIMARY = `${BTN_BASE} bg-ink text-white hover:bg-[#222]`;

export function UpgradeButton({
  plan,
  label,
  primary,
  disabled,
}: {
  plan: PaidPlan;
  label: string;
  primary: boolean;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    start(async () => {
      const res = await startCheckout(plan);
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={disabled || pending}
        className={primary ? BTN_PRIMARY : BTN_OUTLINE}
      >
        {pending ? "Redirecting…" : label}
      </button>
      {error ? (
        <p className="mt-2 text-center text-[12px] text-bad">{error}</p>
      ) : null}
    </div>
  );
}

export function ManageBillingButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    start(async () => {
      const res = await openBillingPortal();
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition-colors duration-[180ms] hover:border-ink hover:bg-bg-soft disabled:opacity-55"
      >
        {pending ? "Opening…" : "Manage billing"}
      </button>
      {error ? <p className="text-[12px] text-bad">{error}</p> : null}
    </div>
  );
}
