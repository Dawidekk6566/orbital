import {
  AnalysisReportSchema,
  CATEGORY_KEYS,
  SEVERITY_ORDER,
  type AnalysisReport,
  type AnalyzeRequest,
  type CategoryKey,
  type CategoryResult,
  type Recommendation,
} from "./types";
import { runPageSpeed } from "./pagespeed";
import { runStaticRules, type Source } from "./htmlRules";
import { aiFromCode, aiFromScreenshot, aiRefineFromPageSpeed, type AiResult } from "./ai";
import { assertSafeUrl } from "../ssrf";
import { buildDemoReport } from "./demoData";
import { runCrux } from "./crux";
import { inspectHttp } from "./httpInspect";
import { analyzeSecurity } from "./security";
import { detectTechStack } from "./techstack";
import type { Locale } from "@/i18n/messages";

/* ============================================================
   Orkiestracja analizy: dobiera silnik wg trybu, łączy wyniki
   (Lighthouse + reguły + AI) i składa spójny raport. Zapewnia
   fallback do trybu demo, gdy brak kluczy/danych.
   ============================================================ */

function overallFrom(categories: CategoryResult[]): number {
  if (categories.length === 0) return 0;
  return Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length,
  );
}

function sortRecs(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

function dedupeRecs(recs: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  const out: Recommendation[] = [];
  for (const r of recs) {
    const k = r.title.toLowerCase().trim();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...r, id: `rec-${out.length}` });
  }
  return out;
}

function radarFrom(categories: CategoryResult[]) {
  return categories.map((c) => ({ category: c.key, score: c.score }));
}

/* HTTP/TLS/HTML pobiera teraz inspectHttp() (httpInspect.ts) — jedno,
   bezpieczne (SSRF) pobranie reużywane przez security/tech-stack i
   silnik reguł. Dawne fetchPageHtml/concat zostały usunięte. */

/** Uzupełnia brakujące kategorie neutralnym wynikiem (dla trybu screenshot). */
function categoriesFromScores(
  scores: Partial<Record<CategoryKey, number>>,
): CategoryResult[] {
  return CATEGORY_KEYS.map((key) => {
    const score = scores[key] ?? 70;
    return {
      key,
      score,
      metrics: [
        {
          id: `${key}-visual`,
          label: "Visual assessment (AI)",
          value: `${score}/100`,
          score,
          description:
            "A qualitative assessment of this category made by the AI model from the screenshot (no access to the page's code).",
          status: score >= 90 ? "good" : score >= 50 ? "warn" : "bad",
        },
      ],
    };
  });
}

function finalize(
  report: Omit<AnalysisReport, "overallScore" | "radar" | "recommendations"> & {
    categories: CategoryResult[];
    recommendations: Recommendation[];
  },
): AnalysisReport {
  const recommendations = sortRecs(dedupeRecs(report.recommendations));
  const full: AnalysisReport = {
    ...report,
    overallScore: overallFrom(report.categories),
    radar: radarFrom(report.categories),
    recommendations,
  };
  return AnalysisReportSchema.parse(full);
}

export async function analyze(
  request: AnalyzeRequest,
  locale: Locale,
): Promise<AnalysisReport> {
  const analyzedAt = new Date().toISOString();

  // ---------- Tryb URL ----------
  if (request.mode === "url") {
    // SSRF: waliduje adres zanim cokolwiek pobierzemy.
    await assertSafeUrl(request.url);

    // Równolegle: Lighthouse (PSI), dane terenowe CrUX oraz bezprzeglądarkowa
    // inspekcja HTTP/TLS (nagłówki + HTML + certyfikat). Wszystko opcjonalne.
    const [psi, cruxField, inspection] = await Promise.all([
      runPageSpeed(request.url),
      runCrux(request.url),
      inspectHttp(request.url).catch(() => null),
    ]);

    // Wspólne wzbogacenia (niezależne od ścieżki PSI/reguł).
    const sec = inspection
      ? analyzeSecurity(inspection.headers, inspection.finalUrl, inspection.tls)
      : null;
    const tech = inspection ? detectTechStack(inspection.headers, inspection.html) : [];
    const enrichment = {
      ...(cruxField ? { vitals: { field: cruxField } } : {}),
      ...(sec ? { securityHeaders: sec.securityHeaders } : {}),
      ...(inspection?.tls ? { tls: inspection.tls } : {}),
      ...(tech.length ? { techStack: tech } : {}),
    };
    const enrichRecs = sec?.recommendations ?? [];

    if (psi) {
      const ai = await aiRefineFromPageSpeed(request.url, psi.raw, locale);
      return finalize({
        target: { mode: "url", value: request.url },
        categories: psi.categories,
        recommendations: [...(ai?.recommendations ?? []), ...enrichRecs],
        meta: {
          engine: ai ? "hybrid" : "pagespeed",
          analyzedAt,
          demo: false,
          notes: ai ? undefined : ["AI recommendations unavailable (no API key)."],
        },
        ...enrichment,
      });
    }

    // Fallback: użyj HTML z inspekcji i przeanalizuj regułami + AI.
    const html = inspection?.html ?? null;
    if (html) {
      const rules = runStaticRules([{ name: "page.html", content: html }]);
      const ai = await aiFromCode([{ name: "page.html", content: html }], locale);
      return finalize({
        target: { mode: "url", value: request.url },
        categories: rules.categories,
        recommendations: [...rules.recommendations, ...(ai?.recommendations ?? []), ...enrichRecs],
        meta: {
          engine: ai ? "hybrid" : "rules",
          analyzedAt,
          demo: false,
          notes: ["Local analysis (PageSpeed unavailable)."],
        },
        ...enrichment,
      });
    }

    // Ostateczny fallback: demo.
    const demo = buildDemoReport(request.url);
    demo.meta.notes = ["Could not fetch the page — showing sample data."];
    return demo;
  }

  // ---------- Tryb code / files ----------
  if (request.mode === "code" || request.mode === "files") {
    const sources: Source[] =
      request.mode === "code"
        ? [{ name: `snippet.${request.language === "auto" ? "html" : request.language}`, content: request.code }]
        : request.files;

    const rules = runStaticRules(sources);
    const ai = await aiFromCode(sources, locale);

    // Jeśli AI podało wyniki, uśredniamy je z regułami (lekki blend).
    const categories = rules.categories.map((c) => {
      const aiScore = ai?.scores?.[c.key];
      if (aiScore == null) return c;
      return { ...c, score: Math.round((c.score + aiScore) / 2) };
    });

    return finalize({
      target: {
        mode: request.mode,
        value: request.mode === "files" ? `${request.files.length} files` : "pasted code",
      },
      categories,
      recommendations: [...rules.recommendations, ...(ai?.recommendations ?? [])],
      meta: {
        engine: ai ? "hybrid" : "rules",
        analyzedAt,
        demo: false,
        notes: ai ? undefined : ["AI recommendations unavailable (no API key) — rule-based analysis."],
      },
    });
  }

  // ---------- Tryb screenshot ----------
  const ai: AiResult | null = await aiFromScreenshot(
    request.image,
    request.notes,
    locale,
  );
  if (ai) {
    return finalize({
      target: { mode: "screenshot", value: "screenshot" },
      categories: categoriesFromScores(ai.scores ?? {}),
      recommendations: ai.recommendations,
      meta: { engine: "ai", analyzedAt, demo: false },
    });
  }

  // Brak AI → demo.
  const demo = buildDemoReport("screenshot");
  demo.target.mode = "screenshot";
  demo.meta.notes = ["AI analysis unavailable (no API key) — sample data."];
  return demo;
}
