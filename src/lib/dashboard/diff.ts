import type {
  AnalysisReport,
  CategoryKey,
  Recommendation,
} from "@/lib/analysis/types";
import { CATEGORY_KEYS, SEVERITY_ORDER } from "@/lib/analysis/types";

/* ============================================================
   Audit diff — pure comparison of two persisted reports. Scores
   are compared per category (target − base); recommendations are
   matched by their stable `id` so a run reads as three buckets:
   resolved (was in base, gone in target), added (new in target),
   and persistent (present in both). Isomorphic + side-effect free
   so it runs in a Server Component or the client.
   ============================================================ */

export type ScoreDelta = {
  base: number | null;
  target: number | null;
  /** target − base, or null when either side is missing. */
  delta: number | null;
};

export type CategoryDelta = ScoreDelta & {
  key: CategoryKey;
  label: string;
};

export type ReportDiff = {
  overall: ScoreDelta;
  categories: CategoryDelta[];
  /** In base but not target — the fixes that landed. */
  resolved: Recommendation[];
  /** In target but not base — regressions / newly surfaced issues. */
  added: Recommendation[];
  /** In both runs (target's copy) — still outstanding. */
  persistent: Recommendation[];
};

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  performance: "Perf",
  seo: "SEO",
  accessibility: "A11y",
  security: "Security",
};

function scoreForKey(report: AnalysisReport, key: CategoryKey): number | null {
  return report.categories.find((c) => c.key === key)?.score ?? null;
}

function deltaOf(base: number | null, target: number | null): number | null {
  if (base == null || target == null) return null;
  return target - base;
}

function bySeverity(a: Recommendation, b: Recommendation): number {
  return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
}

/** Compare `base` (older) against `target` (newer). */
export function diffReports(
  base: AnalysisReport,
  target: AnalysisReport,
): ReportDiff {
  const baseIds = new Set(base.recommendations.map((r) => r.id));
  const targetIds = new Set(target.recommendations.map((r) => r.id));

  const resolved = base.recommendations
    .filter((r) => !targetIds.has(r.id))
    .sort(bySeverity);
  const added = target.recommendations
    .filter((r) => !baseIds.has(r.id))
    .sort(bySeverity);
  const persistent = target.recommendations
    .filter((r) => baseIds.has(r.id))
    .sort(bySeverity);

  const categories: CategoryDelta[] = CATEGORY_KEYS.map((key) => {
    const b = scoreForKey(base, key);
    const t = scoreForKey(target, key);
    return { key, label: CATEGORY_LABEL[key], base: b, target: t, delta: deltaOf(b, t) };
  });

  return {
    overall: {
      base: base.overallScore,
      target: target.overallScore,
      delta: deltaOf(base.overallScore, target.overallScore),
    },
    categories,
    resolved,
    added,
    persistent,
  };
}

/** Category scores as radar axes (Perf/SEO/A11y/Security), for RadarChart. */
export function categoryAxes(
  report: AnalysisReport,
): { label: string; score: number | null }[] {
  return CATEGORY_KEYS.map((key) => ({
    label: CATEGORY_LABEL[key],
    score: scoreForKey(report, key),
  }));
}

/* ============================================================
   Diff bogatych sekcji (nagłówki bezpieczeństwa, tech-stack, CrUX)
   między dwoma raportami — na potrzeby widoku porównania. Czyste,
   bez efektów ubocznych; pomijają sekcje nieobecne w obu raportach.
   ============================================================ */

export type HeaderDiff = {
  name: string;
  base: boolean;
  target: boolean;
  change: "added" | "removed" | "same";
};

/** Union nazw nagłówków z obu raportów; „added” = pojawił się w nowszym. */
export function diffSecurityHeaders(
  base: AnalysisReport,
  target: AnalysisReport,
): HeaderDiff[] {
  const b = base.securityHeaders ?? [];
  const t = target.securityHeaders ?? [];
  if (b.length === 0 && t.length === 0) return [];
  const names = [...new Set([...b.map((h) => h.name), ...t.map((h) => h.name)])];
  const present = (list: typeof b, name: string) =>
    list.find((h) => h.name === name)?.present ?? false;
  return names.map((name) => {
    const bp = present(b, name);
    const tp = present(t, name);
    return {
      name,
      base: bp,
      target: tp,
      change: bp === tp ? "same" : tp ? "added" : "removed",
    };
  });
}

export type TechDiff = { added: string[]; removed: string[]; kept: string[] };

export function diffTechStack(
  base: AnalysisReport,
  target: AnalysisReport,
): TechDiff {
  const b = new Set((base.techStack ?? []).map((t) => t.name));
  const t = new Set((target.techStack ?? []).map((x) => x.name));
  return {
    added: [...t].filter((n) => !b.has(n)),
    removed: [...b].filter((n) => !t.has(n)),
    kept: [...t].filter((n) => b.has(n)),
  };
}

export type FieldMetricDiff = {
  key: "lcp" | "inp" | "cls";
  label: string;
  base: number | null;
  target: number | null;
  delta: number | null;
};

const FIELD_KEYS: FieldMetricDiff["key"][] = ["lcp", "inp", "cls"];
const FIELD_LABEL: Record<FieldMetricDiff["key"], string> = {
  lcp: "LCP",
  inp: "INP",
  cls: "CLS",
};

/** Porównanie danych terenowych (CrUX) p75; null gdy brak w obu raportach. */
export function diffFieldVitals(
  base: AnalysisReport,
  target: AnalysisReport,
): FieldMetricDiff[] | null {
  const bf = base.vitals?.field;
  const tf = target.vitals?.field;
  if (!bf && !tf) return null;
  const rows = FIELD_KEYS.map((key) => {
    const b = bf?.[key]?.p75 ?? null;
    const t = tf?.[key]?.p75 ?? null;
    return {
      key,
      label: FIELD_LABEL[key],
      base: b,
      target: t,
      delta: b != null && t != null ? t - b : null,
    };
  }).filter((r) => r.base != null || r.target != null);
  return rows.length ? rows : null;
}
