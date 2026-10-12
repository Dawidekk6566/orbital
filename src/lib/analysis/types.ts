import { z } from "zod";
import {
  NetworkEntrySchema,
  ConsoleEntrySchema,
  CookieEntrySchema,
  TlsInfoSchema,
  LabVitalsSchema,
} from "./renderArtifact";
export type { NetworkEntry } from "./renderArtifact";

/* ============================================================
   Wspólne typy i schematy walidacji (klient + serwer).
   Zod pełni rolę pojedynczego źródła prawdy dla kształtu danych.
   ============================================================ */

export const CATEGORY_KEYS = [
  "performance",
  "seo",
  "accessibility",
  "security",
] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const ANALYSIS_MODES = ["url", "files", "code", "screenshot"] as const;
export type AnalysisMode = (typeof ANALYSIS_MODES)[number];

export type MetricStatus = "good" | "warn" | "bad";

export const MetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  /** Wynik 0–100 dla metryki, jeśli policzalny. */
  score: z.number().min(0).max(100).optional(),
  /** Krótki opis: co ta kontrola sprawdza i dlaczego ma znaczenie. */
  description: z.string().optional(),
  /** Dynamiczny opis „co wykryto na tej stronie" (ponad samą `value`). */
  evidence: z.string().optional(),
  status: z.enum(["good", "warn", "bad"]),
});
export type Metric = z.infer<typeof MetricSchema>;

export const CategoryResultSchema = z.object({
  key: z.enum(CATEGORY_KEYS),
  score: z.number().min(0).max(100),
  metrics: z.array(MetricSchema),
});
export type CategoryResult = z.infer<typeof CategoryResultSchema>;

export const RecommendationSchema = z.object({
  id: z.string(),
  category: z.enum(CATEGORY_KEYS),
  severity: z.enum(SEVERITIES),
  title: z.string(),
  /** Na czym polega problem. */
  problem: z.string(),
  /** Konkretna instrukcja naprawy „co i jak". */
  fix: z.string(),
  /** Klucz do katalogu wiedzy (checkDocs) — UI dociąga opis + kod. */
  docId: z.string().optional(),
  /** Dynamiczny opis „co wykryto na tej stronie". */
  evidence: z.string().optional(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

/* ---------- Bogate sekcje raportu (opcjonalne, Faza 1+) ----------
   Wszystkie pola są opcjonalne: stare raporty (PSI/reguły/demo) nadal
   walidują, a nowe silniki (worker, CrUX, analizatory) dokładają dane
   przyrostowo. Panele informacyjne nie wpływają na `overallScore`. */

const RATING = z.enum(["good", "needs-improvement", "poor"]);

/** Dane terenowe (CrUX) — p75 realnych użytkowników. */
export const FieldMetricSchema = z.object({
  p75: z.number().optional(),
  rating: RATING.optional(),
});
export const VitalsSchema = z.object({
  lab: LabVitalsSchema.optional(),
  field: z
    .object({
      lcp: FieldMetricSchema.optional(),
      cls: FieldMetricSchema.optional(),
      inp: FieldMetricSchema.optional(),
      source: z.string().optional(), // np. "CrUX"
    })
    .optional(),
});
export type Vitals = z.infer<typeof VitalsSchema>;

export const TechEntrySchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  version: z.string().optional(),
  confidence: z.number().optional(),
});
export type TechEntry = z.infer<typeof TechEntrySchema>;

export const TrackerEntrySchema = z.object({
  domain: z.string(),
  category: z.string().optional(), // advertising | analytics | social | ...
  requests: z.number().optional(),
});
export type TrackerEntry = z.infer<typeof TrackerEntrySchema>;

export const SecurityHeaderSchema = z.object({
  name: z.string(),
  present: z.boolean(),
  value: z.string().optional(),
  severity: z.enum(SEVERITIES).optional(),
});
export type SecurityHeader = z.infer<typeof SecurityHeaderSchema>;

export const DnsRecordStatusSchema = z.object({
  present: z.boolean(),
  value: z.string().optional(),
  details: z.string().optional(),
  status: z.enum(["good", "warn", "bad"]),
});

export const DnsSecSchema = z.object({
  spf: DnsRecordStatusSchema.optional(),
  dmarc: DnsRecordStatusSchema.optional(),
  caa: DnsRecordStatusSchema.optional(),
  mx: z.array(z.string()).optional(),
});
export type DnsSecInfo = z.infer<typeof DnsSecSchema>;

export const CveEntrySchema = z.object({
  id: z.string(),
  library: z.string(),
  version: z.string(),
  severity: z.enum(SEVERITIES),
  title: z.string(),
  summary: z.string(),
  cve: z.string().optional(),
  fixVersion: z.string().optional(),
  link: z.string().optional(),
});
export type CveEntry = z.infer<typeof CveEntrySchema>;

export const CspFindingSchema = z.object({
  directive: z.string(),
  severity: z.enum(SEVERITIES),
  issue: z.string(),
  recommendation: z.string(),
});

export const CspEvaluationSchema = z.object({
  hasCsp: z.boolean(),
  score: z.number().min(0).max(100).optional(),
  findings: z.array(CspFindingSchema).optional(),
  missingDirectives: z.array(z.string()).optional(),
});
export type CspEvaluation = z.infer<typeof CspEvaluationSchema>;

export const SriCheckSchema = z.object({
  url: z.string(),
  hasIntegrity: z.boolean(),
  isThirdParty: z.boolean(),
  tag: z.enum(["script", "stylesheet"]),
});
export type SriCheck = z.infer<typeof SriCheckSchema>;

export const SocialMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  canonicalUrl: z.string().optional(),
  favicon: z.string().optional(),
  og: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    url: z.string().optional(),
    siteName: z.string().optional(),
    type: z.string().optional(),
  }),
  twitter: z.object({
    card: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    site: z.string().optional(),
    creator: z.string().optional(),
  }),
});
export type SocialMetadata = z.infer<typeof SocialMetadataSchema>;

export const SchemaEntitySchema = z.object({
  type: z.string(),
  name: z.string().optional(),
  raw: z.record(z.string(), z.unknown()),
  valid: z.boolean(),
  issues: z.array(z.string()),
});
export type SchemaEntity = z.infer<typeof SchemaEntitySchema>;

export const CrawlerReadinessSchema = z.object({
  robots: z.object({
    found: z.boolean(),
    disallowAll: z.boolean(),
    rulesCount: z.number(),
    sitemapsDeclared: z.array(z.string()),
    contentSnippet: z.string().optional(),
  }),
  sitemap: z.object({
    found: z.boolean(),
    url: z.string().optional(),
    statusCode: z.number().optional(),
    isXml: z.boolean().optional(),
  }),
});
export type CrawlerReadiness = z.infer<typeof CrawlerReadinessSchema>;

export const BudgetCategorySchema = z.object({
  name: z.string(),
  budgetBytes: z.number(),
  actualBytes: z.number(),
  status: z.enum(["good", "warn", "bad"]),
  percentUsed: z.number(),
});
export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const CodeBloatItemSchema = z.object({
  url: z.string(),
  label: z.string(),
  totalBytes: z.number(),
  wastedBytes: z.number(),
  wastedPercent: z.number(),
  type: z.enum(["script", "stylesheet"]),
});
export type CodeBloatItem = z.infer<typeof CodeBloatItemSchema>;

export const PerformanceBudgetSchema = z.object({
  budgets: z.array(BudgetCategorySchema),
  bloatItems: z.array(CodeBloatItemSchema),
  totalWastedBytes: z.number(),
  potentialTimeSavingsMs: z.number(),
});
export type PerformanceBudget = z.infer<typeof PerformanceBudgetSchema>;

export const ThirdPartyEntitySchema = z.object({
  entity: z.string(),
  category: z.string(),
  transferSize: z.number(),
  blockingTimeMs: z.number(),
  mainThreadTimeMs: z.number(),
  urlCount: z.number(),
});
export type ThirdPartyEntity = z.infer<typeof ThirdPartyEntitySchema>;

export const ThirdPartySummarySchema = z.object({
  entities: z.array(ThirdPartyEntitySchema),
  firstPartyBytes: z.number(),
  thirdPartyBytes: z.number(),
  thirdPartyPercent: z.number(),
  firstPartyMainThreadMs: z.number(),
  thirdPartyMainThreadMs: z.number(),
});
export type ThirdPartySummary = z.infer<typeof ThirdPartySummarySchema>;

export const DomHealthSchema = z.object({
  totalElements: z.number(),
  maxDepth: z.number(),
  maxChildren: z.number(),
  status: z.enum(["good", "warn", "bad"]),
  warnings: z.array(z.string()),
});
export type DomHealth = z.infer<typeof DomHealthSchema>;

export const ConsoleIssueSchema = z.object({
  type: z.enum(["error", "warning", "violation", "network"]),
  message: z.string(),
  source: z.string().optional(),
  url: z.string().optional(),
});
export type ConsoleIssue = z.infer<typeof ConsoleIssueSchema>;

export const CrawlSchema = z.object({
  sitemapFound: z.boolean().optional(),
  pages: z
    .array(z.object({ url: z.string(), status: z.number().optional(), score: z.number().optional() }))
    .optional(),
  brokenLinks: z
    .array(z.object({ url: z.string(), status: z.number().optional() }))
    .optional(),
});

export const AnalysisReportSchema = z.object({
  target: z.object({
    mode: z.enum(ANALYSIS_MODES),
    value: z.string(),
  }),
  overallScore: z.number().min(0).max(100),
  categories: z.array(CategoryResultSchema),
  recommendations: z.array(RecommendationSchema),
  radar: z.array(z.object({ category: z.enum(CATEGORY_KEYS), score: z.number() })),
  meta: z.object({
    engine: z.enum(["pagespeed", "ai", "rules", "demo", "hybrid", "render"]),
    analyzedAt: z.string(),
    demo: z.boolean(),
    notes: z.array(z.string()).optional(),
  }),

  /* ---- Bogate sekcje (opcjonalne) — wypełniane przez worker/analizatory ---- */
  vitals: VitalsSchema.optional(),
  network: z.array(NetworkEntrySchema).optional(),
  console: z.array(ConsoleEntrySchema).optional(),
  cookies: z.array(CookieEntrySchema).optional(),
  tls: TlsInfoSchema.optional(),
  securityHeaders: z.array(SecurityHeaderSchema).optional(),
  techStack: z.array(TechEntrySchema).optional(),
  trackers: z.array(TrackerEntrySchema).optional(),
  crawl: CrawlSchema.optional(),
  screenshots: z
    .object({ full: z.string().optional(), aboveFold: z.string().optional() })
    .optional(),
  dns: DnsSecSchema.optional(),
  cveList: z.array(CveEntrySchema).optional(),
  csp: CspEvaluationSchema.optional(),
  sri: z.array(SriCheckSchema).optional(),
  social: SocialMetadataSchema.optional(),
  structuredData: z.array(SchemaEntitySchema).optional(),
  crawlerReadiness: CrawlerReadinessSchema.optional(),
  budget: PerformanceBudgetSchema.optional(),
  thirdParty: ThirdPartySummarySchema.optional(),
  domHealth: DomHealthSchema.optional(),
  consoleIssues: z.array(ConsoleIssueSchema).optional(),
});
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

/* ---------- Schemat żądania analizy (walidacja wejścia) ---------- */

const MAX_CODE_LENGTH = 500_000; // ~500 KB tekstu

export const AnalyzeRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("url"),
    url: z.string().url().max(2048),
  }),
  z.object({
    mode: z.literal("code"),
    code: z.string().min(1).max(MAX_CODE_LENGTH),
    language: z.enum(["html", "css", "js", "auto"]).default("auto"),
  }),
  z.object({
    mode: z.literal("files"),
    files: z
      .array(
        z.object({
          name: z.string().max(260),
          content: z.string().max(MAX_CODE_LENGTH),
        }),
      )
      .min(1)
      .max(30),
  }),
  z.object({
    mode: z.literal("screenshot"),
    /** data URL obrazu (image/png|jpeg|webp), base64. */
    image: z.string().max(8_000_000),
    notes: z.string().max(2000).optional(),
  }),
]);
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
