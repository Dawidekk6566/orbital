"use client";

import { useEffect, useRef, useState } from "react";
import { AuditForm } from "./AuditForm";
import { useReveal } from "./useReveal";
import { OrbitalBackdrop } from "@/components/visual/OrbitalBackdrop";

/* ============================================================
   HERO — 2-kolumnowy .hero-grid. Lewa: copy + formularz audytu.
   Prawa: .card z licznikiem 0→97 i wypełnianiem pasków.
   ============================================================ */

const METRICS = [
  { name: "Performance", val: 94 },
  { name: "Accessibility", val: 100 },
  { name: "SEO", val: 98 },
  { name: "Best practices", val: 92 },
];

function HeroCard() {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const [score, setScore] = useState(0);
  const played = useRef(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!inView || played.current) return;
    played.current = true;

    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Mount-time media-query read (SSR-unavailable); jump straight to the
      // final score. Intentional state update outside render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScore(97);
      return;
    }

    const to = 97;
    const dur = 1300;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(to * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [inView]);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[600ms] ease-[ease] ${
        inView ? "translate-y-0 opacity-100" : "translate-y-[8px] opacity-0"
      }`}
    >
      <div
        className="rounded-[8px] border border-line bg-white p-[clamp(24px,3vw,32px)]"
        role="img"
        aria-label="Audit result for yoursite.com — overall score 97 of 100"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line pb-5">
          <span className="flex items-center gap-2 font-mono text-[13px] text-gray-1">
            <span className="h-[7px] w-[7px] flex-none rounded-full bg-ink" aria-hidden="true" />
            yoursite.com
          </span>
          <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">
            Live audit
          </span>
        </div>
        <div className="flex items-end gap-3 pb-1.5 pt-6">
          <span
            className="font-mono text-[clamp(64px,9vw,94px)] font-semibold leading-[0.86] tracking-[-0.04em]"
            id="heroScore"
          >
            {score}
          </span>
          <span className="pb-[9px] font-mono text-[19px] text-faint">/ 100</span>
          <span className="ml-auto pb-[11px] text-right font-mono text-[12px] text-gray-1">
            Overall
            <br />
            Good
          </span>
        </div>
        <div className="mt-[22px] flex flex-col gap-[17px]">
          {METRICS.map((m) => (
            <div key={m.name}>
              <div className="mb-2 flex items-baseline justify-between text-[13.5px]">
                <span className="text-ink">{m.name}</span>
                <span className="font-mono text-gray-1">{m.val}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full bg-ink transition-[width] duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{ width: played ? `${m.val}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between border-t border-line pt-4 font-mono text-[12px] text-muted">
          <span>40 audits run</span>
          <span>Scanned in 2.7s</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="start" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-[clamp(64px,8vw,110px)] pt-[calc(64px+clamp(40px,6vw,72px))] max-[920px]:min-h-0">
      <OrbitalBackdrop className="absolute inset-y-0 right-[-6%] -z-10 w-[64%] max-[920px]:hidden [mask-image:radial-gradient(68%_68%_at_56%_48%,#000_28%,transparent_80%)]" />
      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] items-center gap-[clamp(40px,6vw,84px)] px-[clamp(24px,5vw,40px)] max-[920px]:grid-cols-1 max-[920px]:gap-[clamp(40px,7vw,56px)]">
        <div>
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            Technical site audit
          </span>
          <h1 className="mt-[22px] max-w-[15ch] text-[clamp(40px,6vw,76px)] font-semibold leading-[1.03] tracking-[-0.035em] max-[920px]:max-w-[18ch]">
            Know exactly why your site is slow, and what to fix first.
          </h1>
          <p className="mt-6 max-w-[46ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            Orbital runs a full technical audit of any URL — performance,
            accessibility, SEO and best practices — and returns a scored,
            prioritized fix list in seconds.
          </p>
          <AuditForm />
        </div>
        <HeroCard />
      </div>
    </section>
  );
}
