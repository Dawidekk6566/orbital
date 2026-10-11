"use client";

import { useMemo, useState } from "react";
import { Reveal } from "./Reveal";

/* ============================================================
   SCORE SIMULATOR — model wydajności przeliczany na żywo (1:1).
   Uwaga: `.sim-range` pozostaje jako residual CSS (pseudo-elementy
   suwaka ::-webkit-slider-thumb / ::-moz-range-thumb).
   ============================================================ */

function comma(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const FIELDS = [
  { key: "img", label: "Image weight", min: 200, max: 4000, step: 50, def: 1400, unit: "kb" },
  { key: "js", label: "JavaScript shipped", min: 80, max: 2000, step: 20, def: 620, unit: "kb" },
  { key: "req", label: "HTTP requests", min: 15, max: 200, step: 1, def: 74, unit: "raw" },
  { key: "ttfb", label: "Server TTFB", min: 60, max: 1200, step: 10, def: 420, unit: "ms" },
] as const;

type Key = (typeof FIELDS)[number]["key"];

function outLabel(key: Key, v: number) {
  if (key === "img" || key === "js") return `${comma(v)} KB`;
  if (key === "ttfb") return `${v} ms`;
  return `${v}`;
}

export function Simulator() {
  const [vals, setVals] = useState<Record<Key, number>>({
    img: 1400,
    js: 620,
    req: 74,
    ttfb: 420,
  });

  const { score, lcp, verdict } = useMemo(() => {
    const { img, js, req, ttfb } = vals;
    const penalty =
      ((img - 200) / 3800) * 34 +
      ((js - 80) / 1920) * 30 +
      ((req - 15) / 185) * 16 +
      ((ttfb - 60) / 1140) * 20;
    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
    const lcpRaw = 0.5 + ttfb / 1000 + img / 1600 + js / 2600 + req / 260;
    const verdict =
      score >= 90
        ? "Excellent"
        : score >= 75
          ? "Good"
          : score >= 50
            ? "Needs work"
            : "Poor";
    return { score, lcp: `${lcpRaw.toFixed(1)} s`, verdict };
  }, [vals]);

  return (
    <section className="py-[clamp(52px,6.5vw,92px)]" id="simulator">
      <div className="mx-auto max-w-[1200px] px-[clamp(24px,5vw,40px)]">
        <Reveal className="mb-[clamp(30px,3.8vw,48px)] max-w-[660px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">What-if simulator</span>
          <h2 className="mt-4 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em]">See what a fix is worth.</h2>
          <p className="mt-[18px] max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            Drag the sliders to model a page. The performance score and
            estimated LCP recompute live — so you can decide what&apos;s worth
            doing before you touch a line of code.
          </p>
        </Reveal>
        <Reveal className="grid grid-cols-[1fr_minmax(0,410px)] items-center gap-[clamp(40px,6vw,72px)] max-[920px]:grid-cols-1 max-[920px]:gap-[38px]">
          <div className="flex flex-col gap-[25px]">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="mb-3 flex items-baseline justify-between">
                  <label className="text-[15px] text-ink" htmlFor={`sim-${f.key}`}>{f.label}</label>
                  <output className="font-mono text-[14px] text-gray-1">{outLabel(f.key, vals[f.key])}</output>
                </div>
                <input
                  className="sim-range"
                  type="range"
                  id={`sim-${f.key}`}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={vals[f.key]}
                  onChange={(e) =>
                    setVals((prev) => ({
                      ...prev,
                      [f.key]: parseInt(e.target.value, 10),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="rounded-[8px] border border-line p-[clamp(28px,3vw,38px)] text-center">
            <span className="mb-4 block text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Estimated performance</span>
            <div className="font-mono text-[clamp(72px,10vw,104px)] font-semibold leading-[0.85] tracking-[-0.04em] text-ink">{score}</div>
            <div className="mt-[22px] h-1 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full bg-ink transition-[width] duration-[250ms] motion-reduce:transition-none" style={{ width: `${score}%` }} />
            </div>
            <div className="mt-[18px] font-mono text-[13px] tracking-[0.02em] text-gray-1">{verdict}</div>
            <div className="mt-[22px] flex justify-between border-t border-line pt-5 font-mono text-[13px] text-muted">
              <span>Estimated LCP</span>
              <b className="font-medium text-ink">{lcp}</b>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
