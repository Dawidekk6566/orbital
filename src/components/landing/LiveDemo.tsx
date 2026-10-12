"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

/* ============================================================
   LIVE DEMO — odtworzenie pipeline'u z landingu 1:1:
   presety → sekwencyjne etapy → wynik (licznik + paski).
   ============================================================ */

type Metric = "perf" | "a11y" | "seo" | "bp";
type Preset = {
  host: string;
  score: number;
  perf: number;
  a11y: number;
  seo: number;
  bp: number;
  issues: number;
  time: string;
};

const PRESETS: Record<string, Preset> = {
  acme: { host: "acme.store", score: 97, perf: 94, a11y: 100, seo: 98, bp: 92, issues: 12, time: "2.7s" },
  linbase: { host: "linbase.io", score: 78, perf: 64, a11y: 88, seo: 81, bp: 79, issues: 23, time: "3.4s" },
  fern: { host: "fern-docs.dev", score: 88, perf: 82, a11y: 95, seo: 90, bp: 86, issues: 16, time: "2.1s" },
};

const STAGES = [
  "Fetching page & assets",
  "Measuring Core Web Vitals",
  "Auditing accessibility tree",
  "Compiling prioritized report",
];

const METRIC_KEYS: Metric[] = ["perf", "a11y", "seo", "bp"];
const METRIC_NAMES: Record<Metric, string> = {
  perf: "Performance",
  a11y: "Accessibility",
  seo: "SEO",
  bp: "Best practices",
};

export function LiveDemo() {
  const [current, setCurrent] = useState<keyof typeof PRESETS>("acme");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageState, setStageState] = useState<("idle" | "active" | "done")[]>(
    () => STAGES.map(() => "idle"),
  );
  const [score, setScore] = useState(0);
  const [vals, setVals] = useState<Record<Metric, number | null>>({
    perf: null,
    a11y: null,
    seo: null,
    bp: null,
  });

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = useRef<number>(0);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimationFrame(raf.current);
  };

  useEffect(() => () => clearTimers(), []);

  const preset = PRESETS[current];

  function reset() {
    clearTimers();
    setProgress(0);
    setDone(false);
    setScore(0);
    setStageState(STAGES.map(() => "idle"));
    setVals({ perf: null, a11y: null, seo: null, bp: null });
  }

  function selectPreset(key: keyof typeof PRESETS) {
    if (running) return;
    setCurrent(key);
    reset();
  }

  function countUp(to: number, dur: number) {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setScore(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(to * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function finish() {
    const d = PRESETS[current];
    setDone(true);
    countUp(d.score, 1100);
    setVals({ perf: d.perf, a11y: d.a11y, seo: d.seo, bp: d.bp });
    setRunning(false);
  }

  function runStage(i: number) {
    if (i >= STAGES.length) {
      finish();
      return;
    }
    setStageState((prev) => prev.map((s, idx) => (idx === i ? "active" : s)));
    setProgress(Math.round(((i + 1) / STAGES.length) * 100));
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = reduce ? 60 : 520 + Math.random() * 260;
    const t = setTimeout(() => {
      setStageState((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
      runStage(i + 1);
    }, wait);
    timers.current.push(t);
  }

  function run() {
    if (running) return;
    reset();
    setRunning(true);
    runStage(0);
  }

  return (
    <section className="py-[clamp(52px,6.5vw,92px)]" id="demo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-[clamp(24px,5vw,40px)]">
        <Reveal className="mb-[clamp(30px,3.8vw,48px)] max-w-[660px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Live demo</span>
          <h2 className="mt-4 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em]">Run an audit right here.</h2>
          <p className="mt-[18px] max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            Pick a sample site and watch the real pipeline work — fetch,
            measure, audit, report. Same engine that runs on your own URLs.
          </p>
        </Reveal>
        <Reveal className="overflow-hidden rounded-[8px] border border-line bg-white">
          <div className="flex flex-wrap items-center gap-3 sm:gap-[14px] border-b border-line px-3.5 sm:px-[18px] py-4">
            <span className="flex items-center w-full sm:w-auto min-w-0 rounded-[6px] border border-line bg-bg-soft px-3 sm:px-[14px] py-2 font-mono text-[13.5px] sm:text-[14px]">
              <span className="truncate">
                <span className="text-faint">https://</span>
                <span className="text-ink">{preset.host}</span>
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="mr-0.5 font-mono text-[12px] text-muted max-[600px]:hidden">Try</span>
              {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
                <button
                  key={key}
                  className={`whitespace-nowrap rounded-full border px-2.5 sm:px-[13px] py-1 sm:py-1.5 font-mono text-[12px] sm:text-[12.5px] transition-[border-color,color,background] duration-150 ${
                    current === key
                      ? "border-ink bg-ink text-white"
                      : "border-line text-gray-1 hover:border-muted hover:text-ink"
                  }`}
                  type="button"
                  onClick={() => selectPreset(key)}
                >
                  {PRESETS[key].host}
                </button>
              ))}
            </span>
            <button
              className="w-full sm:w-auto ml-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222] max-[920px]:ml-0 max-[920px]:w-full"
              type="button"
              onClick={run}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="inline-block h-[14px] w-[14px] animate-[spin_.7s_linear_infinite] rounded-full border-2 border-white/[.32] border-t-white" aria-hidden="true" /> Scanning
                </>
              ) : done ? (
                <>
                  Run again <span aria-hidden="true">→</span>
                </>
              ) : (
                <>
                  Run audit <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 sm:p-[clamp(20px,3vw,30px)]">
            <div className="mb-6 h-[3px] overflow-hidden rounded-full bg-line" aria-hidden="true">
              <span className="block h-full rounded-full bg-ink transition-[width] duration-[400ms] ease-[ease] motion-reduce:transition-none" style={{ width: `${progress}%` }} />
            </div>
            <ul className="flex flex-col">
              {STAGES.map((name, i) => {
                const st = stageState[i];
                const markState =
                  st === "active"
                    ? "border-ink after:absolute after:inset-[2px] after:rounded-full after:border-[1.5px] after:border-ink after:border-t-transparent after:content-[''] after:animate-[spin_.7s_linear_infinite] motion-reduce:after:animate-none"
                    : st === "done"
                      ? "border-ink bg-ink before:absolute before:left-[4.5px] before:top-[2px] before:h-[7px] before:w-1 before:rotate-45 before:border-solid before:border-white before:content-[''] before:[border-width:0_1.5px_1.5px_0]"
                      : "border-line";
                return (
                  <li
                    className={`grid grid-cols-[20px_1fr_auto] items-center gap-[14px] border-b border-line-2 py-[11px] text-[14.5px] transition-colors duration-200 last:border-b-0 ${
                      st === "idle" ? "text-faint" : "text-ink"
                    }`}
                    key={name}
                  >
                    <span className={`relative h-4 w-4 rounded-full border-[1.5px] transition-[border-color] duration-200 ${markState}`} aria-hidden="true" />
                    <span>{name}</span>
                    <span className="font-mono text-[12px] text-faint">
                      {st === "idle"
                        ? "idle"
                        : st === "active"
                          ? "scanning"
                          : "done"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div
              className={`mt-[26px] grid-cols-[minmax(0,210px)_1fr] items-center gap-[clamp(24px,4vw,44px)] border-t border-line pt-[26px] max-[920px]:grid-cols-1 max-[920px]:gap-[26px] ${
                done ? "grid" : "hidden"
              }`}
            >
              <div>
                <div className="flex items-end gap-3">
                  <span className="font-mono text-[clamp(64px,9vw,94px)] font-semibold leading-[0.86] tracking-[-0.04em]">{score}</span>
                  <span className="pb-[9px] font-mono text-[19px] text-faint">/ 100</span>
                </div>
                <p className="mt-4 font-mono text-[12.5px] leading-[1.7] text-muted">
                  {done
                    ? `${preset.issues} issues found · scan completed in ${preset.time}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-col gap-[17px]">
                {METRIC_KEYS.map((m) => (
                  <div key={m}>
                    <div className="mb-2 flex items-baseline justify-between text-[13.5px]">
                      <span className="text-ink">{METRIC_NAMES[m]}</span>
                      <span className="font-mono text-gray-1">{vals[m] ?? "—"}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-ink transition-[width] duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
                        style={{ width: vals[m] != null ? `${vals[m]}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
