import { Reveal } from "./Reveal";

/* Four dimensions analyzed by the audit engine with responsive divider borders */
const DIMENSIONS = [
  {
    name: "Performance",
    desc: "Core Web Vitals, lab metrics & CrUX field data",
    borderClass: "",
  },
  {
    name: "SEO",
    desc: "Metadata, crawlability & structured data",
    borderClass: "border-t border-line sm:border-t-0 sm:border-l sm:border-line",
  },
  {
    name: "Accessibility",
    desc: "WCAG checks: contrast, ARIA & labels",
    borderClass:
      "border-t border-line sm:border-t sm:border-l-0 lg:border-t-0 lg:border-l lg:border-line",
  },
  {
    name: "Security",
    desc: "HTTPS, TLS certificate & security headers",
    borderClass:
      "border-t border-line sm:border-t sm:border-l sm:border-line lg:border-t-0",
  },
] as const;

const BASE_CELL_CLASS =
  "min-w-0 px-4 py-5 sm:px-[clamp(16px,4vw,22px)] sm:py-[22px] lg:px-[clamp(18px,2.4vw,36px)] lg:py-0";
const NUM_CLASS =
  "font-mono text-[clamp(16px,2vw,22px)] font-semibold leading-[1.15] tracking-[-0.01em] break-words";
const LABEL_CLASS = "mt-2.5 text-[13.5px] leading-[1.5] text-gray-1";

export function StatStrip() {
  return (
    <section className="border-y border-line bg-bg-soft">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-[clamp(24px,5vw,40px)] py-[clamp(36px,4.6vw,58px)]">
        <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {DIMENSIONS.map((d) => (
            <div key={d.name} className={`${BASE_CELL_CLASS} ${d.borderClass}`}>
              <div className={NUM_CLASS}>{d.name}</div>
              <div className={LABEL_CLASS}>{d.desc}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
