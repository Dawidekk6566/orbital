import type { ReactNode } from "react";

/* ============================================================
   PlanCard — shared presentational pricing card, used by the
   marketing /pricing grid and the in-dashboard /dashboard/billing
   page. Purely presentational: the caller injects the CTA node
   (a marketing <Link>, or the interactive upgrade/portal button on
   the billing page) and an optional badge ("Popular" / "Current
   plan"). Strict monochrome tokens; no new colors.
   ============================================================ */

export type PlanFeature = { label: string; value: string | null };

export type PlanCardData = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  popular?: boolean;
  features: PlanFeature[];
};

export function Check() {
  return (
    <svg
      className="mt-[3px] h-[13px] w-[13px] flex-none text-ink"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13.5 4.5 6.5 11.5 3 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlanCard({
  plan,
  index = 0,
  cta,
  badge,
  highlight,
}: {
  plan: PlanCardData;
  index?: number;
  /** Footer action — a Link (marketing) or a button (billing). */
  cta: ReactNode;
  /** Overrides the default "Popular" badge (e.g. "Current plan"). */
  badge?: string;
  /** Force the emphasized border independent of `popular`. */
  highlight?: boolean;
}) {
  const emphasized = highlight ?? plan.popular ?? false;
  const badgeText = badge ?? (plan.popular ? "Popular" : undefined);

  return (
    <div
      className={`relative flex flex-col rounded-[10px] bg-white p-[clamp(20px,1.7vw,28px)] transition-colors duration-200 [animation:fade-up_.6s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none ${
        emphasized
          ? "border-2 border-ink"
          : "border border-line hover:border-muted"
      }`}
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      {badgeText ? (
        <span className="absolute right-[clamp(20px,1.7vw,28px)] top-[clamp(20px,1.7vw,28px)] rounded-full bg-ink px-[9px] py-[3px] font-mono text-[9.5px] uppercase tracking-[0.06em] text-white">
          {badgeText}
        </span>
      ) : null}
      <span className="text-[19px] font-semibold tracking-[-0.01em] text-ink">
        {plan.name}
      </span>
      <div className="mt-2.5 flex items-end gap-1.5">
        <span className="font-mono text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
          {plan.price}
        </span>
        <span className="pb-1 font-mono text-[13px] text-muted">
          {plan.cadence}
        </span>
      </div>
      <p className="mt-3 min-h-[2.9em] text-[13.5px] leading-[1.5] text-gray-1">
        {plan.tagline}
      </p>
      <ul className="mt-[clamp(12px,1.8vh,18px)] flex flex-col border-t border-line pt-[clamp(12px,1.8vh,18px)]">
        {plan.features.map((f) => {
          const included = f.value !== null;
          return (
            <li
              key={f.label}
              className="flex items-start gap-2.5 py-[5px] text-[13.5px]"
            >
              {included ? (
                <Check />
              ) : (
                <span
                  className="mt-[9px] h-px w-3 flex-none bg-faint"
                  aria-hidden="true"
                />
              )}
              <span
                className={`flex-1 leading-[1.4] ${included ? "text-ink-2" : "text-faint"}`}
              >
                {f.label}
              </span>
              <span
                className={`font-mono text-[12.5px] ${included ? "text-gray-1" : "text-faint"}`}
              >
                {f.value ?? "—"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto pt-6">{cta}</div>
    </div>
  );
}
