import Link from "next/link";

/* ============================================================
   Onboarding — the first-run guided empty state shown on the
   Overview when a team has no projects yet. A short numbered
   checklist that points at the first audit (the primary action)
   and the next things worth setting up. Presentational; the
   Overview decides when to render it.
   ============================================================ */

type Step = {
  title: string;
  body: string;
  href: string;
  cta: string;
  primary?: boolean;
};

const STEPS: readonly Step[] = [
  {
    title: "Run your first audit",
    body: "Point Orbital at any URL to score performance, SEO, accessibility and best practices.",
    href: "/dashboard/audits/new",
    cta: "New audit",
    primary: true,
  },
  {
    title: "Track a site as a project",
    body: "Save a URL as a project to keep its audit history and watch scores over time.",
    href: "/dashboard/projects",
    cta: "Add a project",
  },
  {
    title: "Schedule automatic re-audits",
    body: "Let Orbital re-run audits on a cadence so regressions surface on their own.",
    href: "/dashboard/schedule",
    cta: "Set up a schedule",
  },
  {
    title: "Invite your team or use the API",
    body: "Bring teammates in, or run audits from CI with the REST API.",
    href: "/dashboard/team",
    cta: "Manage team",
  },
];

export function Onboarding() {
  return (
    <section className="mt-8 rounded-[10px] border border-line bg-white p-[clamp(20px,3vw,32px)]">
      <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
        Get started with Orbital
      </h2>
      <p className="mt-2 max-w-[52ch] text-[14px] text-gray-1">
        A few steps to set up your account. Start with your first audit — the
        rest can wait until you need them.
      </p>

      <ol className="mt-7 flex flex-col gap-6">
        {STEPS.map((step, i) => (
          <li key={step.href} className="flex gap-4">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line font-mono text-[12px] text-gray-1"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
              <div className="max-w-[46ch]">
                <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-1 text-[13.5px] text-gray-1">{step.body}</p>
              </div>
              <Link
                href={step.href}
                className={
                  step.primary
                    ? "inline-flex flex-none items-center justify-center rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222]"
                    : "inline-flex flex-none items-center justify-center rounded-full border border-line px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink hover:bg-bg-soft"
                }
              >
                {step.cta}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
