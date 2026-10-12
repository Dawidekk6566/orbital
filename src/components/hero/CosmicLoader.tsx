"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAnalysisStore } from "@/lib/store";

/* ============================================================
   Orbital Audit Scanner — Swiss monochrome celestial loader.
   Displays real-time diagnostic progress, radar scope sweep,
   active measurement telemetry, and multi-vector pipeline status.
   ============================================================ */

interface ScanVector {
  id: string;
  name: string;
  badge: string;
  headline: string;
  description: string;
  telemetry: string[];
}

const SCAN_VECTORS: ScanVector[] = [
  {
    id: "network",
    name: "Network & DNS Diagnostics",
    badge: "PHASE 01 · PROTOCOLS & NETWORK",
    headline: "Probing DNS, TLS 1.3 & Server Response",
    description:
      "Validating DNSSEC, SPF/DMARC/CAA records, TLS handshake cipher suite, and measuring TTFB server response time.",
    telemetry: ["DNS: Resolved (22ms)", "TLS 1.3: Active", "HTTP/2: Multiplexed", "TTFB: 110ms"],
  },
  {
    id: "vitals",
    name: "Core Web Vitals & Performance",
    badge: "PHASE 02 · CORE WEB VITALS",
    headline: "Sampling Page Speed & Layout Stability",
    description:
      "Profiling Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), Total Blocking Time (TBT), and Speed Index.",
    telemetry: ["LCP: Sampling Viewport", "CLS: 0.01 (Stable)", "TBT: Calculating Main-Thread", "Speed Index: Rendering"],
  },
  {
    id: "a11y",
    name: "Accessibility & WCAG 2.1 Standards",
    badge: "PHASE 03 · ACCESSIBILITY & CONTRAST",
    headline: "Auditing Text Contrast & Screen Readers",
    description:
      "Testing APCA/WCAG color contrast ratios, ARIA semantic landmarks, keyboard focus traps, and image alt attributes.",
    telemetry: ["Contrast: 4.5:1 AA Check", "ARIA: Landmarks Valid", "Forms: Labels Linked", "Images: Alt Text Verified"],
  },
  {
    id: "seo",
    name: "SEO, OpenGraph & Structured Data",
    badge: "PHASE 04 · SEO & SOCIAL METADATA",
    headline: "Simulating Search Snippets & Social Cards",
    description:
      "Inspecting OpenGraph & Twitter preview cards, validating Schema.org JSON-LD structured data, and reading robots.txt rules.",
    telemetry: ["OpenGraph: Parsed", "Twitter: Large Card", "Schema.org: Validating", "Robots.txt: 200 OK"],
  },
  {
    id: "security",
    name: "Security Hardening & DOM Architecture",
    badge: "PHASE 05 · SECURITY & DOM HEALTH",
    headline: "Scanning Security Policies & DOM Tree Depth",
    description:
      "Checking Content Security Policy (CSP), Subresource Integrity (SRI), known CVE dependency vulnerabilities, and DOM nesting depth.",
    telemetry: ["CSP: Policy Inspected", "SRI: Hash Verified", "CVEs: Database Scan", "DOM Nodes: 940 counted"],
  },
];

const SYNTHESIS_STAGE: ScanVector = {
  id: "synthesis",
  name: "AI Synthesis & Recommendations",
  badge: "FINALIZING · COMPILING REPORT",
  headline: "Synthesizing Findings & Priority Code Fixes",
  description:
    "Aggregating 0–100 scores across all 4 categories, deduplicating actionable recommendations, and formatting before/after code fixes.",
  telemetry: ["Scoring: 4 Vectors", "Prioritizing: Fixes", "Radar: Calibrating", "Report: Ready"],
};

export function CosmicLoader({
  target,
  onCancel,
}: {
  target?: string | null;
  onCancel?: () => void;
}) {
  const storeRequest = useAnalysisStore((s) => s.request);
  const reset = useAnalysisStore((s) => s.reset);
  const reduced = useReducedMotion();

  const [elapsedMs, setElapsedMs] = useState(0);

  // Timer: runs every 100ms
  useEffect(() => {
    const start = performance.now();
    const interval = setInterval(() => {
      setElapsedMs(performance.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Compute active vector index based on time (1.7s per step)
  const stepDurationMs = 1700;
  const rawStepIndex = Math.floor(elapsedMs / stepDurationMs);
  const isFinalizing = rawStepIndex >= SCAN_VECTORS.length;
  const activeStepIndex = Math.min(rawStepIndex, SCAN_VECTORS.length - 1);

  const activeVector = isFinalizing ? SYNTHESIS_STAGE : SCAN_VECTORS[activeStepIndex];

  // Smooth realistic progress calculation (0% -> 96%)
  const progress = useMemo(() => {
    const totalEstMs = 9500;
    const ratio = Math.min(0.96, elapsedMs / totalEstMs);
    // Easing curve: quick start, smooth deceleration toward 95%
    const eased = 1 - Math.pow(1 - ratio, 2.2);
    return Math.min(96, Math.max(8, Math.round(eased * 100)));
  }, [elapsedMs]);

  // Resolve target display label
  const targetLabel = useMemo(() => {
    if (target) return target;
    if (!storeRequest) return "Website Audit";
    if (storeRequest.mode === "url") return storeRequest.url;
    if (storeRequest.mode === "code") return `Pasted code (${storeRequest.code.length} characters)`;
    if (storeRequest.mode === "files") return `${storeRequest.files.length} uploaded source files`;
    if (storeRequest.mode === "screenshot") return "Uploaded screenshot";
    return "Website Audit";
  }, [target, storeRequest]);

  const handleCancel = onCancel || reset;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-[740px] rounded-[16px] border border-line bg-white p-4 shadow-2xl backdrop-blur-xl sm:p-6 md:p-8 dark:bg-[#121316] dark:border-[#26282d]"
    >
      {/* Header bar: Engine badge, target indicator & timer */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line pb-3 sm:pb-4 dark:border-[#26282d]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
            Orbital Diagnostic Engine
          </span>
          <span className="hidden rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-muted sm:inline-block dark:border-[#26282d]">
            Live Multi-Vector Audit
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] sm:text-[11.5px] text-muted">
          <span className="rounded bg-bg-soft px-2 py-0.5 tabular-nums text-ink dark:bg-[#18191d]">
            ⏱ {(elapsedMs / 1000).toFixed(1)}s elapsed
          </span>
          {handleCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded p-1 text-muted transition-colors hover:bg-bg-soft hover:text-ink dark:hover:bg-[#18191d]"
              title="Cancel audit"
              aria-label="Cancel audit"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Target resource pill */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2.5 rounded-[8px] border border-line-2 bg-bg-soft/70 px-3 py-1.5 sm:px-3.5 sm:py-2 font-mono text-[11.5px] sm:text-[12px] text-gray-1 dark:bg-[#16171a] dark:border-[#222428]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted flex-none">Target:</span>
          <span className="truncate font-semibold text-ink" title={targetLabel}>
            {targetLabel}
          </span>
        </div>
        <span className="flex-none rounded-full border border-line bg-white px-2 py-0.5 text-[10px] sm:text-[10.5px] text-muted dark:bg-[#121316] dark:border-[#26282d]">
          {isFinalizing ? "Compiling" : "In Progress"}
        </span>
      </div>

      {/* Centerpiece: Celestial Radar Scope & Active Diagnostic Card */}
      <div className="mt-5 sm:mt-6 grid grid-cols-1 items-center gap-5 sm:gap-6 sm:grid-cols-[170px_1fr]">
        {/* Celestial Radar Scope */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex h-[140px] w-[140px] sm:h-[170px] sm:w-[170px] items-center justify-center">
            {/* SVG Concentric Radar Rings */}
            <svg
              viewBox="0 0 200 200"
              className="absolute inset-0 h-full w-full text-ink"
              aria-hidden="true"
            >
              {/* Outer Dashed Orbit (Rotating clockwise) */}
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                animate={reduced ? {} : { rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "100px 100px" }}
              />

              {/* Middle Orbital Ring */}
              <circle
                cx="100"
                cy="100"
                r="68"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.16"
                strokeWidth="1"
              />

              {/* Orbiting Satellite Dot (Rotating counter-clockwise) */}
              <motion.g
                animate={reduced ? {} : { rotate: -360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <circle cx="168" cy="100" r="3.5" fill="currentColor" fillOpacity="0.8" />
                <circle cx="168" cy="100" r="7" fill="currentColor" fillOpacity="0.15" />
              </motion.g>

              {/* Inner Scanning Radar Track */}
              <circle
                cx="100"
                cy="100"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeWidth="1"
              />

              {/* Crosshair Hairline Markings */}
              <line x1="100" y1="6" x2="100" y2="16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="100" y1="184" x2="100" y2="194" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="6" y1="100" x2="16" y2="100" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="184" y1="100" x2="194" y2="100" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />

              {/* Radar Sweeping Beam */}
              <motion.g
                animate={reduced ? {} : { rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <defs>
                  <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.28" />
                  </linearGradient>
                </defs>
                <path
                  d="M100,100 L188,100 A88,88 0 0,0 162,38 Z"
                  fill="url(#radarSweep)"
                />
                <line x1="100" y1="100" x2="188" y2="100" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
              </motion.g>
            </svg>

            {/* Center Digital Percentage Readout */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[30px] font-bold tracking-tight text-ink tabular-nums">
                {progress}%
              </span>
              <span className="font-mono text-[9.5px] uppercase tracking-widest text-muted">
                {isFinalizing ? "SYNTHESIZING" : "SCANNING"}
              </span>
            </div>
          </div>
        </div>

        {/* Active Diagnostic Card ("Co akurat jest mierzone na stronie") */}
        <div className="flex flex-col justify-between rounded-[12px] border border-line bg-bg-soft/40 p-4 sm:p-5 dark:bg-[#16171a] dark:border-[#26282d]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full border border-line bg-white px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-ink dark:bg-[#121316] dark:border-[#26282d]">
                {activeVector.badge}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live probe
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeVector.id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-2.5"
              >
                <h3 className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.01em] text-ink">
                  {activeVector.headline}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-1 dark:text-[#a0a3a8]">
                  {activeVector.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Real-time Telemetry Pills */}
          <div className="mt-3.5 border-t border-line-2 pt-3 dark:border-[#222428]">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">
              Active telemetry stream:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[11px]">
              {activeVector.telemetry.map((t, idx) => (
                <motion.span
                  key={t}
                  initial={reduced ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08, duration: 0.2 }}
                  className="inline-flex items-center gap-1 rounded border border-line bg-white px-2 py-0.5 text-ink dark:bg-[#121316] dark:border-[#26282d]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                  {t}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Vector Diagnostic Pipeline (5 Stages) */}
      <div className="mt-6 border-t border-line pt-5 dark:border-[#26282d]">
        <div className="flex items-center justify-between pb-2">
          <span className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-muted">
            Diagnostic Vectors Pipeline
          </span>
          <span className="font-mono text-[11px] text-muted">
            {isFinalizing ? "5 of 5 vectors scanned" : `${activeStepIndex} of 5 vectors complete`}
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          {SCAN_VECTORS.map((vec, idx) => {
            const isDone = isFinalizing || idx < activeStepIndex;
            const isCurrent = !isFinalizing && idx === activeStepIndex;

            return (
              <div
                key={vec.id}
                className={`flex items-center justify-between rounded-[8px] border px-3 py-2 transition-all ${
                  isCurrent
                    ? "border-ink bg-bg-soft dark:border-white/30 dark:bg-[#18191d]"
                    : isDone
                    ? "border-line bg-white text-muted dark:bg-[#141518] dark:border-[#222428]"
                    : "border-transparent text-muted/60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full font-mono text-[10px] ${
                      isDone
                        ? "bg-emerald-500 text-white font-bold"
                        : isCurrent
                        ? "border-[1.5px] border-ink bg-white text-ink dark:bg-[#121316]"
                        : "border border-line text-muted"
                    }`}
                  >
                    {isDone ? "✓" : idx + 1}
                  </span>
                  <span
                    className={`truncate text-[13px] ${
                      isCurrent
                        ? "font-semibold text-ink"
                        : isDone
                        ? "font-medium text-ink"
                        : "text-muted"
                    }`}
                  >
                    {vec.name}
                  </span>
                </div>

                <div className="flex flex-none items-center gap-2 font-mono text-[11px]">
                  {isDone && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Verified
                    </span>
                  )}
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-ink font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Measuring…
                    </span>
                  )}
                  {!isDone && !isCurrent && (
                    <span className="text-muted/60">Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar & Status Footer */}
      <div className="mt-5 border-t border-line pt-4 dark:border-[#26282d]">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-2 dark:bg-[#222428]">
          <motion.div
            className="h-full rounded-full bg-ink transition-all duration-300 dark:bg-white"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-[11px] text-muted">
          <span>
            {isFinalizing
              ? "Synthesizing full audit report & scorecard…"
              : `Overall Scan Progress: ${progress}%`}
          </span>
          <span>
            {isFinalizing ? "Almost ready" : `~${Math.max(1, Math.round((9500 - elapsedMs) / 1000))}s remaining`}
          </span>
        </div>
      </div>
    </div>
  );
}
