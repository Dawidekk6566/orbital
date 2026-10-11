import { Reveal } from "./Reveal";

export function FeatureTrio() {
  return (
    <section className="scroll-mt-16 py-[clamp(52px,6.5vw,92px)]" id="features">
      <div className="mx-auto max-w-[1200px] px-[clamp(24px,5vw,40px)]">
        <Reveal className="mb-[clamp(30px,3.8vw,48px)] max-w-[660px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">What we measure</span>
          <h2 className="mt-4 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em]">Four categories. One honest number.</h2>
          <p className="mt-[18px] max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            Every audit runs the same battery of checks Google&apos;s own
            tooling uses — then explains each result in plain language, ranked
            by the impact it has on your score.
          </p>
        </Reveal>
        <Reveal className="grid grid-cols-3 max-[920px]:grid-cols-1">
          <div className="border-l border-line px-[clamp(24px,2.6vw,40px)] py-[clamp(8px,1vw,12px)] first:border-l-0 first:pl-0 last:pr-0 max-[920px]:border-l-0 max-[920px]:border-t max-[920px]:border-line max-[920px]:px-0 max-[920px]:py-[clamp(28px,5vw,36px)] max-[920px]:first:border-t-0 max-[920px]:first:pt-0 max-[920px]:last:pb-0">
            <svg className="mb-[22px] h-[30px] w-[30px] text-ink" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 24a12 12 0 1 1 20 0" />
              <path d="M16 24l6-8" />
              <circle cx="16" cy="24" r="1.6" fill="currentColor" stroke="none" />
            </svg>
            <h3 className="mb-3 text-[20px] font-semibold tracking-[-0.01em]">Performance</h3>
            <p className="text-[15.5px] leading-[1.62] text-gray-1">
              Real Core Web Vitals — LCP, CLS and INP — measured on a throttled
              connection, not a synthetic best case. See the exact resources
              blocking your first paint.
            </p>
          </div>
          <div className="border-l border-line px-[clamp(24px,2.6vw,40px)] py-[clamp(8px,1vw,12px)] first:border-l-0 first:pl-0 last:pr-0 max-[920px]:border-l-0 max-[920px]:border-t max-[920px]:border-line max-[920px]:px-0 max-[920px]:py-[clamp(28px,5vw,36px)] max-[920px]:first:border-t-0 max-[920px]:first:pt-0 max-[920px]:last:pb-0">
            <svg className="mb-[22px] h-[30px] w-[30px] text-ink" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="16" cy="16" r="12" />
              <circle cx="16" cy="11" r="2.2" />
              <path d="M9 15h14M16 15v8M16 23l-3 3M16 23l3 3" />
            </svg>
            <h3 className="mb-3 text-[20px] font-semibold tracking-[-0.01em]">Accessibility</h3>
            <p className="text-[15.5px] leading-[1.62] text-gray-1">
              WCAG 2.2 checks across contrast, focus order, labels and
              landmarks. Every failure links straight to the offending element
              and the rule it breaks.
            </p>
          </div>
          <div className="border-l border-line px-[clamp(24px,2.6vw,40px)] py-[clamp(8px,1vw,12px)] first:border-l-0 first:pl-0 last:pr-0 max-[920px]:border-l-0 max-[920px]:border-t max-[920px]:border-line max-[920px]:px-0 max-[920px]:py-[clamp(28px,5vw,36px)] max-[920px]:first:border-t-0 max-[920px]:first:pt-0 max-[920px]:last:pb-0">
            <svg className="mb-[22px] h-[30px] w-[30px] text-ink" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="14" cy="14" r="9" />
              <path d="M21 21l6 6" />
            </svg>
            <h3 className="mb-3 text-[20px] font-semibold tracking-[-0.01em]">SEO &amp; best practices</h3>
            <p className="text-[15.5px] leading-[1.62] text-gray-1">
              Crawlability, structured data, HTTPS, console errors and 40+
              platform checks — the same standards search engines and browsers
              quietly hold you to.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
