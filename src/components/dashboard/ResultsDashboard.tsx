"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { useAnalysisStore } from "@/lib/store";
import type {
  AnalysisReport,
  CategoryKey,
  CategoryResult,
  Metric,
  Recommendation,
} from "@/lib/analysis/types";
import { SEVERITY_ORDER } from "@/lib/analysis/types";
import { getCheckDoc, type CheckDoc } from "@/lib/analysis/checkDocs";
import { DnsPanel, CvePanel, CspSriPanel } from "./SecurityPanels";
import {
  SocialPreviewSimulator,
  StructuredDataPanel,
  CrawlerReadinessPanel,
} from "./SeoSocialPanels";
import { NetworkWaterfall } from "./NetworkWaterfall";

/* ============================================================
   Dashboard wyników — 1:1 z dashboard.html (light-monochrome),
   sterowany realnym AnalysisReport. Utility Tailwind inline;
   jedyny residual CSS to animowany łuk gauge (.gauge .arc).
   ============================================================ */

const GAUGE_C = 628.32;
const WRAP = "mx-auto max-w-[1200px] px-[clamp(24px,5vw,40px)]";
const RSEC_HEAD = "mb-[30px] flex flex-wrap items-baseline justify-between gap-4";
const RSEC_H2 = "text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.02em]";
const RSEC_NOTE = "font-mono text-[12.5px] text-muted";

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  seo: "SEO",
  security: "Security",
};

const CWV_FULL: Record<string, string> = {
  lcp: "Largest Contentful Paint",
  inp: "Interaction to Next Paint",
  fid: "First Input Delay",
  cls: "Cumulative Layout Shift",
  fcp: "First Contentful Paint",
  ttfb: "Time to First Byte",
  tbt: "Total Blocking Time",
  si: "Speed Index",
  tti: "Time to Interactive",
};

function bandOf(score: number): "good" | "warn" | "poor" {
  if (score >= 90) return "good";
  if (score >= 50) return "warn";
  return "poor";
}

const BAND_LABEL = { good: "Good", warn: "Fair", poor: "Poor" } as const;
const NUM_COLOR = { good: "text-good", warn: "text-warn", poor: "text-bad" } as const;
const DOT_BG = { good: "bg-good", warn: "bg-warn", poor: "bg-bad" } as const;
const FILL_BG = { good: "bg-good", warn: "bg-warn", poor: "bg-bad" } as const;

const CWV_STATUS: Record<Metric["status"], "good" | "ni" | "poor"> = {
  good: "good",
  warn: "ni",
  bad: "poor",
};

const CWV_STATUS_LABEL: Record<Metric["status"], string> = {
  good: "Good",
  warn: "Needs work",
  bad: "Poor",
};

const CWV_STATUS_CLS = {
  good: "text-good before:bg-good",
  ni: "text-warn before:bg-warn",
  poor: "text-bad before:bg-bad",
} as const;

const CWV_SCALE_BG = { good: "bg-good", ni: "bg-warn", poor: "bg-bad" } as const;

function useCountUp(target: number, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function useMountFlag() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return on;
}

function Gauge({ score }: { score: number }) {
  const band = bandOf(score);
  const count = useCountUp(score);
  const mounted = useMountFlag();
  const offset = mounted ? GAUGE_C * (1 - score / 100) : GAUGE_C;
  return (
    <div className={`gauge ${band} relative h-[220px] w-[220px]`}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle className="track" cx="110" cy="110" r="100" />
        <circle
          className="arc"
          cx="110"
          cy="110"
          r="100"
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono text-[56px] font-semibold leading-none tracking-[-0.03em] ${NUM_COLOR[band]}`}>{count}</span>
        <span className="mt-[2px] font-mono text-[15px] text-faint">/ 100</span>
        <span className="mt-1 font-mono text-[12.5px] uppercase tracking-[0.04em] text-muted">{BAND_LABEL[band]}</span>
      </div>
    </div>
  );
}

function CatCard({ cat }: { cat: CategoryResult }) {
  const band = bandOf(cat.score);
  const count = useCountUp(cat.score, 1000);
  const mounted = useMountFlag();
  return (
    <div className="rounded-[8px] border border-line px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium">{CATEGORY_LABEL[cat.key]}</span>
        <span className="font-mono text-[30px] font-semibold tracking-[-0.03em]">{count}</span>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none ${FILL_BG[band]}`}
          style={{ width: mounted ? `${cat.score}%` : 0 }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[12px] text-muted">
        <span>{cat.metrics.length} audits</span>
        <span>{BAND_LABEL[band]}</span>
      </div>
    </div>
  );
}

function CwvCard({ metric }: { metric: Metric }) {
  const st = CWV_STATUS[metric.status];
  const mounted = useMountFlag();
  const fallback =
    metric.status === "good" ? 80 : metric.status === "warn" ? 45 : 20;
  const fill = Math.max(4, Math.min(100, 100 - (metric.score ?? fallback)));
  const id = (metric.id ?? "").toLowerCase();
  const abbr = id && id.length <= 5 ? id.toUpperCase() : metric.label;
  const full = CWV_FULL[id];
  return (
    <div className="rounded-[8px] border border-line p-5">
      <div className="flex items-baseline justify-between gap-[10px]">
        <span className="font-mono tabular-nums text-[15px] font-semibold">{abbr}</span>
        {full && <span className="max-w-[60%] text-right text-[12px] text-muted">{full}</span>}
      </div>
      <div className="mt-4 flex items-baseline gap-1 font-mono">
        <b className="text-[34px] font-semibold tracking-[-0.03em]">{metric.value}</b>
        {metric.unit && <span className="text-[15px] text-faint">{metric.unit}</span>}
      </div>
      <span className={`mt-[14px] inline-flex items-center gap-1.5 font-mono text-[12px] before:h-[7px] before:w-[7px] before:rounded-full before:content-[''] ${CWV_STATUS_CLS[st]}`}>{CWV_STATUS_LABEL[metric.status]}</span>
      {metric.description && (
        <p className="mt-2.5 text-[12px] leading-[1.5] text-muted">{metric.description}</p>
      )}
      <div className="mt-[14px]">
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <i
            className={`block h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none ${CWV_SCALE_BG[st]}`}
            style={{ width: mounted ? `${fill}%` : 0 }}
          />
        </div>
      </div>
    </div>
  );
}

function Opp({
  rec,
  open,
  onToggle,
}: {
  rec: Recommendation;
  open: boolean;
  onToggle: () => void;
}) {
  const gainColor =
    rec.severity === "critical" || rec.severity === "high"
      ? "border-bad-line bg-bad-soft text-bad"
      : rec.severity === "medium"
        ? "border-warn-line bg-warn-soft text-warn"
        : "border-good-line bg-good-soft text-good";
  const oppDoc = rec.docId ? getCheckDoc(rec.docId) : undefined;
  return (
    <div className="border-t border-line [&:first-child]:border-t-0">
      <button
        className="grid w-full grid-cols-[26px_1fr_auto_auto] items-center gap-[14px] px-5 py-[18px] text-left transition-[background] duration-150 hover:bg-bg-soft max-[560px]:grid-cols-[22px_1fr]"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span
          className={`relative h-4 w-4 flex-none before:absolute before:left-0 before:top-[7px] before:h-0.5 before:w-4 before:rounded-[2px] before:bg-ink before:content-[''] after:absolute after:left-[7px] after:top-0 after:h-4 after:w-0.5 after:rounded-[2px] after:bg-ink after:transition-transform after:duration-[250ms] after:content-[''] motion-reduce:after:transition-none ${open ? "after:rotate-90 after:scale-x-0" : ""}`}
          aria-hidden="true"
        />
        <span className="min-w-0 text-[15px] font-medium">{rec.title}</span>
        <span className="whitespace-nowrap font-mono tabular-nums text-[12px] text-muted max-[560px]:col-start-2 max-[560px]:justify-self-start">{CATEGORY_LABEL[rec.category]}</span>
        <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.04em] max-[560px]:col-start-2 max-[560px]:justify-self-start ${gainColor}`}>{rec.severity}</span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="pb-5 pl-[60px] pr-5 pt-0 text-[14.5px] leading-[1.6] text-gray-1 max-[560px]:pl-5">
            {rec.evidence && (
              <p className="mt-1 font-mono text-[12.5px] text-muted">On your page: {rec.evidence}</p>
            )}
            <p className="mt-1">{rec.problem}</p>
            {oppDoc?.why && <p className="mt-3">{oppDoc.why}</p>}
            <p className="mt-3">
              <strong className="font-semibold text-ink">Fix:</strong> {rec.fix}
            </p>
            {oppDoc?.code && <CodeFix code={oppDoc.code} />}
            {oppDoc?.docsUrl && (
              <a
                href={oppDoc.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-mono text-[12.5px] text-ink underline underline-offset-4 hover:text-gray-1"
              >
                Learn more →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          },
          () => {},
        );
      }}
      className="rounded-[5px] border border-white/20 px-2 py-1 font-mono text-[11px] text-white/70 transition-colors hover:text-white"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Blok kodu before/after w ciemnym panelu (theme-fixed = stała ciemna paleta). */
function CodeFix({ code }: { code: NonNullable<CheckDoc["code"]> }) {
  return (
    <div className="theme-fixed mt-3 overflow-hidden rounded-[6px] border border-line bg-ink">
      {code.bad && (
        <div className="border-b border-white/10">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#f2726d]">Before</span>
          </div>
          <pre className="overflow-x-auto px-4 pb-3 font-mono text-[12.5px] leading-[1.65] text-[#f2a6a3] whitespace-pre">{code.bad}</pre>
        </div>
      )}
      {code.good && (
        <div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#37d399]">After</span>
            <CopyButton text={code.good} />
          </div>
          <pre className="overflow-x-auto px-4 pb-3 font-mono text-[12.5px] leading-[1.65] text-[#9be8c6] whitespace-pre">{code.good}</pre>
        </div>
      )}
    </div>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{label}</div>
      <p className="mt-1 text-[14px] leading-[1.6] text-gray-1">{children}</p>
    </div>
  );
}

function CheckDetail({ metric }: { metric: Metric }) {
  const doc = getCheckDoc(metric.id);
  const isGood = metric.status === "good";
  const onPage = metric.evidence ?? `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`;
  return (
    <div className="min-h-0 overflow-hidden">
      <div className="pb-5 pt-2.5 pl-[42px] pr-3 max-[560px]:pl-3">
        {doc?.what && <DetailBlock label="What it checks">{doc.what}</DetailBlock>}
        <DetailBlock label="On your page">{onPage}</DetailBlock>
        {isGood && doc?.good && <DetailBlock label="What's working">{doc.good}</DetailBlock>}
        {!isGood && doc?.why && <DetailBlock label="Why it matters">{doc.why}</DetailBlock>}
        {!isGood && doc?.fix && <DetailBlock label="How to fix">{doc.fix}</DetailBlock>}
        {!isGood && doc?.code && <CodeFix code={doc.code} />}
        {!doc && metric.description && <DetailBlock label="About">{metric.description}</DetailBlock>}
        {doc?.docsUrl && (
          <a
            href={doc.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-mono text-[12.5px] text-ink underline underline-offset-4 hover:text-gray-1"
          >
            Learn more →
          </a>
        )}
      </div>
    </div>
  );
}

function MetricRow({ metric }: { metric: Metric }) {
  const [open, setOpen] = useState(false);
  const st = metric.status;
  const icon = st === "good" ? "✓" : st === "bad" ? "✕" : "!";
  const iconCls =
    st === "good"
      ? "bg-good text-white"
      : st === "bad"
        ? "border-[1.5px] border-bad text-bad"
        : "border-[1.5px] border-warn text-warn";
  return (
    <div className="border-t border-line-2 [&:first-of-type]:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-[18px_1fr_auto_14px] items-center gap-3 rounded-[6px] px-3 py-[12px] text-left transition-colors duration-150 hover:bg-bg-soft"
      >
        <span className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] leading-none ${iconCls}`}>
          {icon}
        </span>
        <span className={`min-w-0 text-[14px] leading-[1.4] ${st === "bad" ? "text-bad" : "text-ink"}`}>
          {metric.label}
        </span>
        <span className="whitespace-nowrap font-mono tabular-nums text-[12.5px] text-muted">
          {metric.value}
          {metric.unit ? ` ${metric.unit}` : ""}
        </span>
        <span
          aria-hidden="true"
          className={`relative h-3.5 w-3.5 flex-none text-muted before:absolute before:left-0 before:top-[6px] before:h-0.5 before:w-3.5 before:rounded before:bg-current before:content-[''] after:absolute after:left-[6px] after:top-0 after:h-3.5 after:w-0.5 after:rounded after:bg-current after:transition-transform after:duration-200 after:content-[''] motion-reduce:after:transition-none ${open ? "after:rotate-90 after:opacity-0" : ""}`}
        />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <CheckDetail metric={metric} />
      </div>
    </div>
  );
}

function AuditGroup({ cat }: { cat: CategoryResult }) {
  const fails = cat.metrics.filter((m) => m.status !== "good");
  const passes = cat.metrics.filter((m) => m.status === "good");
  return (
    <div className="flex flex-col gap-9">
      <div>
        <div className="mb-1 flex items-center justify-between gap-[10px] border-b border-line pb-[14px]">
          <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-muted">Needs attention</span>
          <span className="font-mono tabular-nums text-[13px] font-medium text-muted">{fails.length}</span>
        </div>
        {fails.length === 0 ? (
          <p className="py-[14px] text-[14px] leading-[1.5] text-muted">
            Nothing flagged — every check in this category passed. Expand a passed item
            below to see what you&apos;re doing right.
          </p>
        ) : (
          fails.map((m) => <MetricRow key={m.id} metric={m} />)
        )}
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-[10px] border-b border-line pb-[14px]">
          <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-muted">Passed</span>
          <span className="font-mono tabular-nums text-[13px] font-medium text-muted">{passes.length}</span>
        </div>
        {passes.length === 0 ? (
          <p className="py-[14px] text-[14px] leading-[1.5] text-muted">No passing checks in this category.</p>
        ) : (
          passes.map((m) => <MetricRow key={m.id} metric={m} />)
        )}
      </div>
    </div>
  );
}

const CAT_ORDER: CategoryKey[] = ["performance", "accessibility", "seo", "security"];
const AUDIT_CATS: CategoryKey[] = ["accessibility", "seo", "security"];

/** Metryki pokazywane jako nagłówkowe karty w sekcji Web Vitals (reszta perf →
    rozwijany akordeon „Performance audits"). */
const VITAL_IDS = new Set([
  "lcp",
  "cls",
  "inp",
  "fid",
  "fcp",
  "tbt",
  "ttfb",
  "si",
  "tti",
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "interaction-to-next-paint",
  "total-blocking-time",
  "first-contentful-paint",
  "server-response-time",
  "speed-index",
  "interactive",
]);

/* ---------- Nowe panele: dane terenowe CrUX, nagłówki/TLS, tech-stack ---------- */

type FieldRating = "good" | "needs-improvement" | "poor";
const RATING_CLS: Record<FieldRating, string> = {
  good: "text-good before:bg-good",
  "needs-improvement": "text-warn before:bg-warn",
  poor: "text-bad before:bg-bad",
};
const RATING_LABEL: Record<FieldRating, string> = {
  good: "Good",
  "needs-improvement": "Needs work",
  poor: "Poor",
};

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

const FIELD_DEFS = [
  { key: "lcp" as const, label: "LCP", full: "Largest Contentful Paint" },
  { key: "inp" as const, label: "INP", full: "Interaction to Next Paint" },
  { key: "cls" as const, label: "CLS", full: "Cumulative Layout Shift" },
];

function FieldVitals({ field }: { field: NonNullable<AnalysisReport["vitals"]>["field"] }) {
  if (!field) return null;
  return (
    <div className="mt-7">
      <div className="mb-4 flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-[0.05em] text-muted">
        Field data — real users
        <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] normal-case tracking-normal text-gray-1">
          {field.source ?? "CrUX"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 max-[560px]:grid-cols-1">
        {FIELD_DEFS.map((d) => {
          const m = field[d.key];
          if (!m || m.p75 == null) return null;
          const rating = (m.rating ?? "needs-improvement") as FieldRating;
          const val = d.key === "cls" ? m.p75.toFixed(2) : fmtMs(m.p75);
          return (
            <div key={d.key} className="rounded-[8px] border border-line p-5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[15px] font-semibold">{d.label}</span>
                <span className="max-w-[62%] text-right text-[11.5px] text-muted">{d.full}</span>
              </div>
              <div className="mt-3 font-mono text-[30px] font-semibold tracking-[-0.03em]">{val}</div>
              <span className={`mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] before:h-[7px] before:w-[7px] before:rounded-full before:content-[''] ${RATING_CLS[rating]}`}>
                {RATING_LABEL[rating]} · p75
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeadersTls({
  headers,
  tls,
}: {
  headers: NonNullable<AnalysisReport["securityHeaders"]>;
  tls?: AnalysisReport["tls"];
}) {
  return (
    <div className="grid grid-cols-[1fr_300px] gap-6 max-[920px]:grid-cols-1">
      <div className="overflow-hidden rounded-[8px] border border-line">
        {headers.map((h) => (
          <div key={h.name} className="flex items-center justify-between gap-3 border-t border-line-2 px-[18px] py-[13px] [&:first-child]:border-t-0">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] leading-none ${h.present ? "bg-good text-white" : "border-[1.5px] border-faint text-faint"}`}>
                {h.present ? "✓" : "✕"}
              </span>
              <span className="truncate font-mono text-[13px] text-ink">{h.name}</span>
            </span>
            {h.present ? (
              <span className="whitespace-nowrap font-mono text-[12px] text-good">Present</span>
            ) : (
              <span className="whitespace-nowrap rounded-full border border-line px-2 py-[2px] font-mono text-[10.5px] uppercase tracking-[0.04em] text-muted">
                {h.severity ?? "missing"}
              </span>
            )}
          </div>
        ))}
      </div>
      {tls && (
        <div className="rounded-[8px] border border-line p-5">
          <div className="font-mono text-[12.5px] uppercase tracking-[0.05em] text-muted">TLS / certificate</div>
          <dl className="mt-3 flex flex-col gap-2 text-[13px]">
            {[
              ["Protocol", tls.protocol],
              ["Issuer", tls.issuer],
              ["Valid", tls.valid == null ? undefined : tls.valid ? "Yes" : "No"],
              ["Expires in", typeof tls.daysToExpiry === "number" ? `${tls.daysToExpiry} days` : undefined],
            ]
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-mono tabular-nums text-ink">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function TechStack({ tech }: { tech: NonNullable<AnalysisReport["techStack"]> }) {
  const groups = new Map<string, string[]>();
  for (const t of tech) {
    const cat = t.category ?? "other";
    const label = t.version ? `${t.name} ${t.version}` : t.name;
    groups.set(cat, [...(groups.get(cat) ?? []), label]);
  }
  return (
    <div className="flex flex-col gap-5">
      {[...groups.entries()].map(([cat, names]) => (
        <div key={cat}>
          <div className="mb-2.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-muted">{cat}</div>
          <div className="flex flex-wrap gap-2">
            {names.map((n) => (
              <span key={n} className="rounded-full border border-line px-3 py-1.5 font-mono text-[12.5px] text-ink">
                {n}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


export function ResultsDashboard({
  report,
  showReset = true,
  dateLocale,
  headerActions,
}: {
  report: AnalysisReport;
  showReset?: boolean;
  /** Pin timestamp formatting (e.g. "en-US" for the dashboard). Defaults to the UI locale. */
  dateLocale?: string;
  /** Extra controls shown on the right of the sticky header (e.g. guest Save/Close). */
  headerActions?: React.ReactNode;
}) {
  const { locale } = useI18n();
  const analyze = useAnalysisStore((s) => s.analyze);
  const [openOpp, setOpenOpp] = useState<string | null>(null);
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");

  const embedded = !showReset;
  const rsecCls = `border-t border-line py-[clamp(40px,5vw,60px)] [&:first-of-type]:border-t-0 ${
    embedded ? "scroll-mt-[200px]" : "scroll-mt-[140px]"
  }`;

  const catOf = (k: CategoryKey) => report.categories.find((c) => c.key === k);
  const recs = [...report.recommendations].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
  const perf = catOf("performance");
  const perfMetrics = perf?.metrics ?? [];
  const vitalMetrics = perfMetrics.filter((m) => VITAL_IDS.has(m.id));
  const perfAudits = perfMetrics.filter((m) => !VITAL_IDS.has(m.id));
  const hasVitals = vitalMetrics.length > 0;
  const field = report.vitals?.field;
  const hasField =
    !!field && (field.lcp?.p75 != null || field.cls?.p75 != null || field.inp?.p75 != null);
  const showVitals = hasVitals || hasField;
  const headers = report.securityHeaders ?? [];
  const tech = report.techStack ?? [];

  const sections: { id: string; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(showVitals ? [{ id: "vitals", label: "Web Vitals" }] : []),
    ...(report.network && report.network.length > 0 ? [{ id: "network", label: "Waterfall" }] : []),
    ...(perfAudits.length ? [{ id: "performance", label: "Performance" }] : []),
    ...(recs.length ? [{ id: "opportunities", label: "Opportunities" }] : []),
    ...AUDIT_CATS.filter((k) => (catOf(k)?.metrics.length ?? 0) > 0).map((k) => ({
      id: k,
      label: CATEGORY_LABEL[k],
    })),
    ...(headers.length ? [{ id: "headers", label: "Headers & TLS" }] : []),
    ...(report.dns ? [{ id: "dns", label: "DNS & Domain" }] : []),
    ...(report.cveList && report.cveList.length > 0 ? [{ id: "cve", label: "Vulnerabilities (CVE)" }] : []),
    ...(report.csp || (report.sri && report.sri.length > 0) ? [{ id: "csp", label: "CSP & SRI" }] : []),
    ...(tech.length ? [{ id: "techstack", label: "Tech stack" }] : []),
    ...(report.social ? [{ id: "social", label: "Social & SERP" }] : []),
    ...(report.structuredData && report.structuredData.length > 0
      ? [{ id: "schema", label: "Structured Data" }]
      : []),
    ...(report.crawlerReadiness ? [{ id: "crawler", label: "Robots & Sitemap" }] : []),
  ];

  const [activeSec, setActiveSec] = useState(sections[0]?.id ?? "overview");

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSec(visible[0].target.id);
      },
      { root: null, rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.map((s) => s.id).join("|")]);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const rerun = () => {
    if (report.target.mode === "url" && report.target.value) {
      analyze({ mode: "url", url: report.target.value }, locale);
    }
  };

  const analyzedAt = new Date(report.meta.analyzedAt).toLocaleString(
    dateLocale ?? (locale === "pl" ? "pl-PL" : "en-US"),
    { dateStyle: "medium", timeStyle: "short" },
  );

  const overall = report.overallScore;
  const vitalsNote =
    device === "mobile"
      ? "Simulated mobile conditions — throttled CPU and network."
      : "Desktop conditions — fast connection, no throttling.";

  return (
    <div>
      <div
        className="sticky z-40 border-b border-line bg-white/[0.82] backdrop-blur-[14px] backdrop-saturate-[1.4]"
        style={{ top: embedded ? "var(--app-header-h, 64px)" : 0 }}
      >
      <div className={WRAP}>
        <div className="flex flex-wrap items-start justify-between gap-6 pt-3 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-[10px] font-mono tabular-nums text-[15px] text-ink">
              <span className={`h-[9px] w-[9px] flex-none rounded-full transition-[background] duration-500 ${DOT_BG[bandOf(overall)]}`} aria-hidden="true" />
              {report.target.value}
            </div>
            <div className="mt-[10px] flex flex-wrap gap-x-4 gap-y-[6px] font-mono text-[12.5px] text-muted">
              <span>{report.meta.engine}</span>
              <span>·</span>
              <span>{analyzedAt}</span>
              {report.meta.demo && (
                <>
                  <span>·</span>
                  <span>demo</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-[14px]">
            <div className="inline-flex rounded-full border border-line p-[3px]" role="tablist" aria-label="Device">
              <button
                className={`rounded-full px-[14px] py-1.5 font-mono text-[13px] transition-[background,color] duration-[180ms] ${device === "mobile" ? "bg-ink text-white" : "text-gray-1"}`}
                role="tab"
                aria-selected={device === "mobile"}
                onClick={() => setDevice("mobile")}
              >
                Mobile
              </button>
              <button
                className={`rounded-full px-[14px] py-1.5 font-mono text-[13px] transition-[background,color] duration-[180ms] ${device === "desktop" ? "bg-ink text-white" : "text-gray-1"}`}
                role="tab"
                aria-selected={device === "desktop"}
                onClick={() => setDevice("desktop")}
              >
                Desktop
              </button>
            </div>
            {showReset && report.target.mode === "url" && (
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-[11px] text-[15px] font-medium transition-[background,transform,color] duration-[180ms]"
                onClick={rerun}
              >
                Re-run
              </button>
            )}
            {headerActions}
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className={`${WRAP} flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
          {sections.map((s) => (
            <button
              key={s.id}
              className={`whitespace-nowrap border-b-2 px-[14px] py-[15px] text-[13.5px] transition-[color,border-color] duration-[180ms] hover:text-ink ${
                activeSec === s.id ? "border-ink text-ink" : "border-transparent text-gray-1"
              }`}
              onClick={() => goTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      </div>

      <section id="overview" className={rsecCls}>
        <div className={WRAP}>
          <div className={RSEC_HEAD}>
            <h2 className={RSEC_H2}>Overview</h2>
            <span className={RSEC_NOTE}>Overall technical health across all categories.</span>
          </div>
          <div className="grid grid-cols-[280px_1fr] items-center gap-[clamp(28px,4vw,52px)] max-[920px]:grid-cols-1 max-[920px]:gap-9">
            <div className="flex flex-col items-center">
              <Gauge score={overall} />
            </div>
            <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
              {CAT_ORDER.map((k) => {
                const c = catOf(k);
                return c ? <CatCard key={k} cat={c} /> : null;
              })}
            </div>
          </div>
        </div>
      </section>

      {showVitals && (
        <section id="vitals" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Web Vitals</h2>
              <span className={RSEC_NOTE}>
                {hasVitals ? vitalsNote : "Field data from real Chrome users."}
              </span>
            </div>
            {hasVitals && (
              <div className="grid grid-cols-3 gap-4 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">
                {vitalMetrics.map((m) => (
                  <CwvCard key={m.id} metric={m} />
                ))}
              </div>
            )}
            {hasField && <FieldVitals field={field} />}
          </div>
        </section>
      )}

      {report.network && report.network.length > 0 && (
        <section id="network" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Network Waterfall</h2>
              <span className={RSEC_NOTE}>
                {report.network.length} requests captured · HAR resource waterfall.
              </span>
            </div>
            <NetworkWaterfall entries={report.network} pageUrl={report.target.value} />
          </div>
        </section>
      )}

      {perfAudits.length > 0 && (
        <section id="performance" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Performance</h2>
              <span className={RSEC_NOTE}>
                {perfAudits.length} checks · expand any for details &amp; code.
              </span>
            </div>
            <div>
              {perfAudits.map((m) => (
                <MetricRow key={m.id} metric={m} />
              ))}
            </div>
          </div>
        </section>
      )}

      {recs.length > 0 && (
        <section id="opportunities" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Opportunities</h2>
              <span className={RSEC_NOTE}>
                Prioritized fixes, highest impact first.
              </span>
            </div>
            <div className="overflow-hidden rounded-[8px] border border-line">
              {recs.map((rec) => (
                <Opp
                  key={rec.id}
                  rec={rec}
                  open={openOpp === rec.id}
                  onToggle={() => setOpenOpp((cur) => (cur === rec.id ? null : rec.id))}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      {AUDIT_CATS.map((k) => {
        const c = catOf(k);
        if (!c || c.metrics.length === 0) return null;
        return (
          <section key={k} id={k} className={rsecCls}>
            <div className={WRAP}>
              <div className={RSEC_HEAD}>
                <h2 className={RSEC_H2}>{CATEGORY_LABEL[k]}</h2>
                <span className={RSEC_NOTE}>{c.metrics.length} audits checked.</span>
              </div>
              <AuditGroup cat={c} />
            </div>
          </section>
        );
      })}

      {headers.length > 0 && (
        <section id="headers" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Headers &amp; TLS</h2>
              <span className={RSEC_NOTE}>Response security headers and certificate.</span>
            </div>
            <HeadersTls headers={headers} tls={report.tls} />
          </div>
        </section>
      )}

      {report.dns && (
        <section id="dns" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>DNS &amp; Domain</h2>
              <span className={RSEC_NOTE}>SPF, DMARC, CAA and mail exchange records.</span>
            </div>
            <DnsPanel dns={report.dns} />
          </div>
        </section>
      )}

      {report.cveList && report.cveList.length > 0 && (
        <section id="cve" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Vulnerabilities (CVE)</h2>
              <span className={RSEC_NOTE}>{report.cveList.length} known library security advisory(s).</span>
            </div>
            <CvePanel cveList={report.cveList} />
          </div>
        </section>
      )}

      {(report.csp || (report.sri && report.sri.length > 0)) && (
        <section id="csp" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>CSP &amp; SRI</h2>
              <span className={RSEC_NOTE}>Content Security Policy &amp; supply-chain integrity.</span>
            </div>
            <CspSriPanel csp={report.csp} sri={report.sri} />
          </div>
        </section>
      )}

      {tech.length > 0 && (
        <section id="techstack" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Tech stack</h2>
              <span className={RSEC_NOTE}>Detected technologies ({tech.length}).</span>
            </div>
            <TechStack tech={tech} />
          </div>
        </section>
      )}

      {report.social && (
        <section id="social" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Social &amp; SERP Preview</h2>
              <span className={RSEC_NOTE}>OpenGraph, Twitter Cards and search snippets.</span>
            </div>
            <SocialPreviewSimulator social={report.social} url={report.target.value} />
          </div>
        </section>
      )}

      {report.structuredData && report.structuredData.length > 0 && (
        <section id="schema" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Structured Data (Schema.org)</h2>
              <span className={RSEC_NOTE}>
                {report.structuredData.length} JSON-LD entities validated.
              </span>
            </div>
            <StructuredDataPanel entities={report.structuredData} />
          </div>
        </section>
      )}

      {report.crawlerReadiness && (
        <section id="crawler" className={rsecCls}>
          <div className={WRAP}>
            <div className={RSEC_HEAD}>
              <h2 className={RSEC_H2}>Robots &amp; Sitemap</h2>
              <span className={RSEC_NOTE}>Search engine crawler readiness &amp; discovery.</span>
            </div>
            <CrawlerReadinessPanel crawler={report.crawlerReadiness} />
          </div>
        </section>
      )}
    </div>
  );
}
