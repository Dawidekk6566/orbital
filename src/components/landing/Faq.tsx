"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

/* ============================================================
   FAQ — końcowa sekcja landingu (zastępuje dawny CTA band).
   Akordeon pytań i odpowiedzi w kosmicznym stylu: przezroczyste
   tło (gwiazdy prześwitują), hairline'owe wiersze, animowane
   rozwijanie przez grid-template-rows (jak ChecksExplorer).
   Reduced-motion wyłącza animację rozwijania.
   ============================================================ */

type Qa = { q: string; a: string };

const FAQS: Qa[] = [
  {
    q: "Do I need to install anything?",
    a: "No. Paste a URL and Orbital audits the live page in seconds. You can also drop in raw HTML, source files, or a screenshot — there's no SDK, no agent, and nothing to add to your site.",
  },
  {
    q: "How accurate are the scores?",
    a: "Orbital runs the same Lighthouse engine Google uses, plus its own static checks, then explains every result in plain language. Scores map to the familiar 0–100 bands, and each finding links to the exact element or request behind it.",
  },
  {
    q: "Is my data stored anywhere?",
    a: "Guest audits you run from the homepage aren't tied to an account. Once you sign in, your audits live in your workspace so you can track history and compare runs — and you can delete any of them whenever you like.",
  },
  {
    q: "What's included in the free plan?",
    a: "25 audits a month, one tracked URL, and 7 days of run history — no credit card. Upgrade when you need more URLs, longer history, scheduled re-audits, alerts, or API access.",
  },
  {
    q: "Can I run audits in CI?",
    a: "Yes. On Pro and Team you get a REST API and a GitHub Action, so you can fail a build the moment a score drops or a Core Web Vital regresses.",
  },
  {
    q: "What exactly gets checked?",
    a: "Four categories — performance, SEO, accessibility, and best practices — across 40+ checks, including real Core Web Vitals (LCP, CLS, INP), metadata, color contrast, security headers and more.",
  },
];

const PLUS_BASE =
  "relative h-4 w-4 flex-none transition-colors duration-200 " +
  "before:absolute before:left-0 before:top-[7px] before:h-0.5 before:w-4 before:rounded-[2px] before:bg-current before:content-[''] " +
  "after:absolute after:left-[7px] after:top-0 after:h-4 after:w-0.5 after:rounded-[2px] after:bg-current after:transition-[transform,opacity] after:duration-[250ms] after:content-[''] motion-reduce:after:transition-none";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-[clamp(60px,8vw,110px)]" id="faq">
      <div className="mx-auto max-w-[820px] px-[clamp(24px,5vw,40px)]">
        <Reveal className="mb-[clamp(30px,3.8vw,48px)] text-center">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            Frequently asked
          </span>
          <h2 className="mt-4 text-[clamp(30px,4.4vw,50px)] font-semibold leading-[1.06] tracking-[-0.03em]">
            Questions, answered.
          </h2>
          <p className="mx-auto mt-[18px] max-w-[52ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            Everything you might want to know before running your first audit.
          </p>
        </Reveal>

        <Reveal>
          <div className="border-t border-line">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div className="border-b border-line" key={item.q}>
                  <button
                    className="grid w-full grid-cols-[auto_1fr] items-center gap-4 px-1 py-[21px] text-left transition-colors duration-150 hover:bg-bg-soft"
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
                    <span className="text-[clamp(16px,1.6vw,19px)] font-medium tracking-[-0.01em] text-ink">
                      {item.q}
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="max-w-[64ch] pb-[26px] pl-8 pr-1 text-[15.5px] leading-[1.65] text-gray-1">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-[clamp(28px,3.5vw,44px)] text-center font-mono text-[13.5px] text-muted">
            Still have a question?{" "}
            <a href="#start" className="text-ink underline-offset-4 hover:underline">
              Run a free audit
            </a>{" "}
            or{" "}
            <a href="/signup" className="text-ink underline-offset-4 hover:underline">
              create an account
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

