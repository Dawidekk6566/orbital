import type { AnalysisReport, Recommendation, Severity } from "@/lib/analysis/types";
import type { ScoreDelta } from "@/lib/dashboard/diff";
import { diffSecurityHeaders, diffTechStack, diffFieldVitals } from "@/lib/dashboard/diff";
import { scoreTone, TONE_TEXT } from "@/lib/dashboard/score";

/* ============================================================
   Shared presentational pieces for the two comparison views
   (/dashboard/compare — same site over time, and /dashboard/versus
   — your site against a competitor). Both narrate a ReportDiff, so
   the score card, delta badge, severity chip and findings list are
   identical; only the framing/labels differ per page. Pure render
   helpers, server-safe (no hooks, no client events).
   ============================================================ */

/** Chip color by severity — mirrors ResultsDashboard's convention. */
const SEVERITY_CHIP: Record<Severity, string> = {
  critical: "border-bad-line bg-bad-soft text-bad",
  high: "border-bad-line bg-bad-soft text-bad",
  medium: "border-warn-line bg-warn-soft text-warn",
  low: "border-good-line bg-good-soft text-good",
};

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Audit timestamps render in UTC, en-US, to match the dashboard. */
export const auditDateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="text-faint">—</span>;
  if (delta === 0) return <span className="text-muted">±0</span>;
  const up = delta > 0;
  return (
    <span className={up ? "text-good" : "text-bad"}>
      {up ? "▲" : "▼"} {Math.abs(delta)}
    </span>
  );
}

/**
 * One score with its delta. The headline is the `target` score (tinted
 * by tone); `delta` is target − base. `caption` overrides the default
 * "base → target" line when a page needs different framing.
 */
export function ScoreCard({
  label,
  d,
  caption,
}: {
  label: string;
  d: ScoreDelta;
  caption?: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-white p-4">
      <div className="text-[11px] uppercase tracking-[0.06em] text-muted">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`font-mono text-[26px] leading-none ${TONE_TEXT[scoreTone(d.target)]}`}
        >
          {d.target ?? "—"}
        </span>
        <span className="font-mono text-[13px]">
          <DeltaBadge delta={d.delta} />
        </span>
      </div>
      <div className="mt-1.5 font-mono text-[11px] text-faint">
        {caption ?? (
          <>
            {d.base ?? "—"} → {d.target ?? "—"}
          </>
        )}
      </div>
    </div>
  );
}

export function FindingRow({ rec }: { rec: Recommendation }) {
  return (
    <li className="flex items-start justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0">
      <div className="min-w-0">
        <p className="text-[14px] font-medium">{rec.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-1">
          {rec.problem}
        </p>
      </div>
      <span
        className={`mt-0.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.04em] ${SEVERITY_CHIP[rec.severity]}`}
      >
        {rec.severity}
      </span>
    </li>
  );
}

export function FindingSection({
  title,
  countTone,
  recs,
  empty,
}: {
  title: string;
  countTone: string;
  recs: Recommendation[];
  empty: string;
}) {
  return (
    <section className="rounded-[10px] border border-line bg-white">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em]">{title}</h2>
        <span className={`font-mono text-[13px] ${countTone}`}>
          {recs.length}
        </span>
      </header>
      {recs.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-muted">{empty}</p>
      ) : (
        <ul>
          {recs.map((r) => (
            <FindingRow key={r.id} rec={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** p75 CrUX: CLS bez jednostki, LCP/INP w ms (→ s powyżej 1000). */
function fmtField(key: "lcp" | "inp" | "cls", v: number | null): string {
  if (v == null) return "—";
  if (key === "cls") return v.toFixed(2);
  return v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`;
}

/**
 * Rich-section diff shared by /compare (time) and /versus (competitor):
 * security-header changes, CrUX p75 deltas and tech-stack add/remove.
 * `baseLabel → targetLabel` frames the direction; `changeLabels` renames
 * the header add/remove tag per view. Returns null when neither report
 * carries any of these sections.
 */
export function RichDiffCards({
  base,
  target,
  baseLabel,
  targetLabel,
  changeLabels = { added: "new", removed: "lost" },
}: {
  base: AnalysisReport;
  target: AnalysisReport;
  baseLabel: string;
  targetLabel: string;
  changeLabels?: { added: string; removed: string };
}) {
  const headerDiffs = diffSecurityHeaders(base, target);
  const techDiff = diffTechStack(base, target);
  const fieldDiffs = diffFieldVitals(base, target);
  const hasTech =
    techDiff.added.length + techDiff.removed.length + techDiff.kept.length > 0;
  if (headerDiffs.length === 0 && !hasTech && !fieldDiffs) return null;

  const caption = (
    <p className="mt-0.5 font-mono text-[11px] text-faint">
      {baseLabel} <span className="text-faint">→</span> {targetLabel}
    </p>
  );

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {headerDiffs.length > 0 && (
        <section className="h-fit rounded-[10px] border border-line bg-white p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Security headers</h2>
          {caption}
          <div className="mt-3 flex flex-col">
            {headerDiffs.map((h) => (
              <div
                key={h.name}
                className="flex items-center justify-between gap-2 border-t border-line-2 py-2 [&:first-child]:border-t-0"
              >
                <span className="truncate font-mono text-[12px] text-ink">{h.name}</span>
                <span className="flex flex-none items-center gap-2 font-mono text-[12px]">
                  <span className={h.base ? "text-good" : "text-faint"}>{h.base ? "✓" : "✕"}</span>
                  <span className="text-faint">→</span>
                  <span className={h.target ? "text-good" : "text-faint"}>{h.target ? "✓" : "✕"}</span>
                  {h.change !== "same" && (
                    <span className={`text-[10px] uppercase tracking-[0.04em] ${h.change === "added" ? "text-good" : "text-bad"}`}>
                      {h.change === "added" ? changeLabels.added : changeLabels.removed}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {fieldDiffs && (
        <section className="h-fit rounded-[10px] border border-line bg-white p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Field data (CrUX)</h2>
          {caption}
          <div className="mt-3 flex flex-col">
            {fieldDiffs.map((r) => {
              const better = r.delta != null && r.delta < 0;
              const worse = r.delta != null && r.delta > 0;
              return (
                <div
                  key={r.key}
                  className="flex items-center justify-between gap-2 border-t border-line-2 py-2 [&:first-child]:border-t-0"
                >
                  <span className="font-mono text-[12px] font-semibold text-ink">{r.label}</span>
                  <span className="flex items-center gap-2 font-mono text-[12px] text-gray-1">
                    {fmtField(r.key, r.base)}
                    <span className="text-faint">→</span>
                    <span className="text-ink">{fmtField(r.key, r.target)}</span>
                    {r.delta != null && r.delta !== 0 && (
                      <span className={better ? "text-good" : worse ? "text-bad" : "text-muted"}>
                        {better ? "↓" : "↑"}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasTech && (
        <section className="h-fit rounded-[10px] border border-line bg-white p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Tech stack</h2>
          {caption}
          <div className="mt-3 flex flex-wrap gap-2">
            {techDiff.added.map((n) => (
              <span key={`a-${n}`} className="rounded-full border border-good-line bg-good-soft px-2.5 py-1 font-mono text-[11.5px] text-good">+ {n}</span>
            ))}
            {techDiff.removed.map((n) => (
              <span key={`r-${n}`} className="rounded-full border border-bad-line bg-bad-soft px-2.5 py-1 font-mono text-[11.5px] text-bad">− {n}</span>
            ))}
            {techDiff.kept.map((n) => (
              <span key={`k-${n}`} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11.5px] text-muted">{n}</span>
            ))}
          </div>
          {techDiff.added.length === 0 && techDiff.removed.length === 0 && (
            <p className="mt-3 text-[11px] text-muted">No stack changes.</p>
          )}
        </section>
      )}
    </div>
  );
}
