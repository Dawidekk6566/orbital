"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/* ============================================================
   CHECKS EXPLORER — filtr kategorii + akordeon. 1:1 z HTML.
   ============================================================ */

type Cat = "perf" | "a11y" | "seo" | "bp";

type CheckDef = {
  cat: Cat;
  title: string;
  catLabel: string;
  gain: string;
  body: string;
  code: ReactNode;
};

const CHECKS: CheckDef[] = [
  {
    cat: "perf",
    title: "Serve images in next-gen formats",
    catLabel: "Performance",
    gain: "+8 pts",
    body: "PNG and JPEG heroes are often 30–50% heavier than they need to be. Encode to AVIF or WebP, let the browser pick, and you shed the bytes that hold up your Largest Contentful Paint — at identical visual quality.",
    code: `<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" width="1200" height="630" alt="…">
</picture>`,
  },
  {
    cat: "perf",
    title: "Eliminate render-blocking resources",
    catLabel: "Performance",
    gain: "+6 pts",
    body: "Stylesheets and synchronous scripts in the head delay first paint until they finish downloading. Inline what's critical above the fold, and defer or preload everything else.",
    code: (
      <>
        {`<link rel="preload" as="style" href="/app.css"
      onload="this.rel='stylesheet'">
<script src="/app.js" defer></script>  `}
        <span className="text-[#888]">{`// was blocking`}</span>
      </>
    ),
  },
  {
    cat: "a11y",
    title: "Interactive controls have accessible names",
    catLabel: "Accessibility",
    gain: "+5 pts",
    body: "An icon-only button reads as just “button” to a screen reader. A label — visible text, an aria-label, or a visually-hidden span — tells assistive tech what the control actually does.",
    code: `<button aria-label="Close dialog">
  <svg aria-hidden="true">…</svg>
</button>`,
  },
  {
    cat: "a11y",
    title: "Text has sufficient color contrast",
    catLabel: "Accessibility",
    gain: "+3 pts",
    body: "Body text below a 4.5:1 contrast ratio (3:1 for large text) fails WCAG 2.2 AA and is hard to read on dimmer screens. Orbital reports the measured ratio and the nearest passing color.",
    code: (
      <>
        <span className="text-[#888]">{`/* 2.8:1 — fails  */`}</span>
        {` color:#9b9b9b; background:#fff;
`}
        <span className="text-[#888]">{`/* 4.6:1 — passes */`}</span>
        {` color:#767676; background:#fff;`}
      </>
    ),
  },
  {
    cat: "seo",
    title: "Document has a meta description",
    catLabel: "SEO",
    gain: "+2 pts",
    body: "With no description, search engines synthesize snippet text from the page — usually badly. One concise, unique sentence per page controls how your result reads in search.",
    code: `<meta name="description"
      content="Orbital audits any URL in seconds.">`,
  },
  {
    cat: "bp",
    title: "Avoids deprecated APIs & console errors",
    catLabel: "Best practices",
    gain: "+2 pts",
    body: "Deprecated browser APIs and uncaught console errors signal fragile code — to Orbital and to Chrome's own quality heuristics. Every logged error links back to the source frame that threw it.",
    code: (
      <>
        {`$ orbital audit acme.store --verbose
  `}
        <span className="text-[#888]">{`⚠ Deprecated: \`unload\` listener   (app.js:214)`}</span>
        {`
  `}
        <span className="text-[#888]">{`✕ Uncaught TypeError: cfg undefined (init.js:12)`}</span>
      </>
    ),
  },
];

const FILTERS: { cat: Cat | "all"; label: string }[] = [
  { cat: "all", label: "All" },
  { cat: "perf", label: "Performance" },
  { cat: "a11y", label: "Accessibility" },
  { cat: "seo", label: "SEO" },
  { cat: "bp", label: "Best practices" },
];

const CHIP_BASE =
  "whitespace-nowrap rounded-full border px-[13px] py-1.5 font-mono text-[12.5px] transition-[border-color,color,background] duration-150";
const ROW_CLASS =
  "grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-1 py-[19px] text-left transition-colors duration-150 hover:bg-bg-soft";
const PLUS_BASE =
  "relative h-4 w-4 flex-none transition-colors duration-200 " +
  "before:absolute before:left-0 before:top-[7px] before:h-0.5 before:w-4 before:rounded-[2px] before:bg-current before:content-[''] " +
  "after:absolute after:left-[7px] after:top-0 after:h-4 after:w-0.5 after:rounded-[2px] after:bg-current after:transition-[transform,opacity] after:duration-[250ms] after:content-[''] motion-reduce:after:transition-none";

export function ChecksExplorer() {
  const [filter, setFilter] = useState<Cat | "all">("all");
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-[clamp(52px,6.5vw,92px)]" id="checks">
      <div className="mx-auto max-w-[1200px] px-[clamp(24px,5vw,40px)]">
        <Reveal className="mb-[clamp(30px,3.8vw,48px)] max-w-[660px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">The checks</span>
          <h2 className="mt-4 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em]">Every rule, in the open.</h2>
          <p className="mt-[18px] max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            Browse the checks Orbital runs. Each one explains what it looks for,
            what it costs you, and exactly how to fix it — no black box.
          </p>
        </Reveal>
        <Reveal>
          <div className="mb-[26px] flex flex-wrap gap-[9px]">
            {FILTERS.map((f) => (
              <button
                key={f.cat}
                className={`${CHIP_BASE} ${
                  filter === f.cat
                    ? "border-ink bg-ink text-white"
                    : "border-line text-gray-1 hover:border-muted hover:text-ink"
                }`}
                type="button"
                onClick={() => setFilter(f.cat)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="border-t border-line">
            {CHECKS.map((c, i) => {
              const hidden = filter !== "all" && c.cat !== filter;
              const isOpen = open === i;
              return (
                <div
                  className={`border-b border-line${hidden ? " hidden" : ""}`}
                  key={c.title}
                >
                  <button
                    className={ROW_CLASS}
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span
                      className={`${PLUS_BASE} ${
                        isOpen ? "text-ink after:rotate-90 after:opacity-0" : "text-muted"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-[16px] font-medium tracking-[-0.01em] text-ink">{c.title}</span>
                    <span className="flex items-center gap-[14px] font-mono text-[12px] max-[600px]:gap-[10px]">
                      <span className="whitespace-nowrap rounded-[4px] border border-line px-2 py-[3px] text-[10px] uppercase tracking-[0.05em] text-muted max-[600px]:hidden">{c.catLabel}</span>
                      <span className="min-w-[50px] text-right text-ink">{c.gain}</span>
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="max-w-[74ch] px-1 pb-[26px]">
                        <p className="text-[15px] leading-[1.62] text-gray-1">{c.body}</p>
                        <div className="theme-fixed mt-4 overflow-x-auto whitespace-pre rounded-[6px] bg-ink px-[18px] py-[15px] font-mono text-[12.5px] leading-[1.7] text-[#e6e6e6]">{c.code}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
