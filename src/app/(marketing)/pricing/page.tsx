import type { Metadata } from "next";
import Link from "next/link";
import {
  PlanCard,
  type PlanCardData,
  type PlanFeature,
} from "@/components/billing/PlanCard";

/* ============================================================
   /pricing — pełnoekranowa strona wyboru pakietu (1 widok, bez
   scrolla na desktopie). Każdy plan ma pełną rozpiskę limitów
   i funkcji. Stopka ukryta przez ConditionalFooter. Karta planu
   jest współdzielona z /dashboard/billing (components/billing).
   ============================================================ */

export const metadata: Metadata = {
  title: "Pricing — choose your Orbital plan",
  description:
    "Compare Free, Pro and Team. Same audit engine on every plan — you pay for history, automation and seats.",
};

type Plan = PlanCardData & { cta: { label: string; primary: boolean } };

const FEATURE_LABELS = [
  "Audits / month",
  "URLs tracked",
  "Scheduled re-audits",
  "Run history",
  "Team seats",
  "Slack & webhook alerts",
  "CI & REST API access",
] as const;

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "/ forever",
    tagline: "Everything you need to audit a single site.",
    cta: { label: "Get started free", primary: false },
    features: build(["25", "1", null, "7 days", "1", null, null]),
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "/ month",
    popular: true,
    tagline: "Automation, history and API for growing teams.",
    cta: { label: "Upgrade to Pro", primary: true },
    features: build(["2,000", "25", "Daily", "1 year", "3", "Yes", "Yes"]),
  },
  {
    name: "Team",
    price: "$99",
    cadence: "/ month",
    tagline: "Unlimited scale with SSO and priority support.",
    cta: { label: "Contact sales", primary: false },
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

const BTN_BASE =
  "inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-[11px] text-[15px] font-medium transition-colors duration-[180ms]";
const BTN_OUTLINE = `${BTN_BASE} border border-line text-ink hover:border-ink hover:bg-bg-soft`;
const BTN_PRIMARY = `${BTN_BASE} bg-ink text-white hover:bg-[#222]`;

export default function PricingPage() {
  return (
    <section className="flex h-dvh flex-col overflow-hidden pt-16 max-[920px]:h-auto max-[920px]:min-h-dvh max-[920px]:overflow-visible">
      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col justify-center px-[clamp(24px,5vw,40px)] py-[clamp(20px,3.5vh,44px)]">
        <header className="mx-auto max-w-[640px] text-center [animation:fade-up_.6s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            Pricing
          </span>
          <h1 className="mt-3 text-[clamp(30px,4vw,44px)] font-semibold leading-[1.06] tracking-[-0.025em]">
            Choose your plan
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[clamp(14px,1.1vw,16px)] leading-[1.55] text-gray-1">
            Every plan runs the same 40+ checks — you pay for history,
            automation and seats, never for a better score.
          </p>
        </header>
        <div className="mt-[clamp(22px,3.5vh,40px)] grid grid-cols-3 gap-[clamp(14px,1.5vw,22px)] max-[920px]:grid-cols-1 max-[920px]:gap-4">
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              index={i}
              cta={
                <Link
                  href="/#start"
                  className={plan.cta.primary ? BTN_PRIMARY : BTN_OUTLINE}
                >
                  {plan.cta.label}
                </Link>
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}



