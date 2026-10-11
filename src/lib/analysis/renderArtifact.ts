import { z } from "zod";

/* ============================================================
   RenderArtifact — kontrakt między workerem Playwright a aplikacją.
   Worker renderuje stronę w prawdziwej przeglądarce (po wykonaniu JS)
   i zwraca surowe obserwacje; analizatory (Faza 2) przerabiają je na
   sekcje raportu. Wszystko poza `finalUrl` jest OPCJONALNE — worker
   może pominąć pole, którego nie zdołał zebrać, a aplikacja degraduje
   się łaskawie (patrz plan: „degradacja łaskawa”).
   ============================================================ */

export const NetworkEntrySchema = z.object({
  url: z.string(),
  resourceType: z.string().optional(), // document | script | stylesheet | image | font | xhr | fetch | media | other
  method: z.string().optional(),
  status: z.number().optional(),
  mimeType: z.string().optional(),
  transferSize: z.number().optional(), // bajty „na drucie”
  startTime: z.number().optional(), // ms od startu nawigacji
  duration: z.number().optional(), // ms
  domain: z.string().optional(),
  thirdParty: z.boolean().optional(),
});
export type NetworkEntry = z.infer<typeof NetworkEntrySchema>;

export const ConsoleEntrySchema = z.object({
  level: z.string(), // log | info | warn | error | debug
  text: z.string(),
  url: z.string().optional(),
  line: z.number().optional(),
});
export type ConsoleEntry = z.infer<typeof ConsoleEntrySchema>;

export const CookieEntrySchema = z.object({
  name: z.string(),
  domain: z.string().optional(),
  thirdParty: z.boolean().optional(),
  secure: z.boolean().optional(),
  httpOnly: z.boolean().optional(),
  sameSite: z.string().optional(), // Strict | Lax | None | ""
  session: z.boolean().optional(),
});
export type CookieEntry = z.infer<typeof CookieEntrySchema>;

export const TlsInfoSchema = z.object({
  protocol: z.string().optional(), // np. "TLS 1.3"
  issuer: z.string().optional(),
  subject: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  daysToExpiry: z.number().optional(),
  valid: z.boolean().optional(),
});
export type TlsInfo = z.infer<typeof TlsInfoSchema>;

/** Metryki laboratoryjne (z renderu w przeglądarce), wartości w ms (poza CLS). */
export const LabVitalsSchema = z.object({
  lcp: z.number().optional(),
  cls: z.number().optional(),
  inp: z.number().optional(),
  fcp: z.number().optional(),
  ttfb: z.number().optional(),
  tbt: z.number().optional(),
  loadTime: z.number().optional(),
});
export type LabVitals = z.infer<typeof LabVitalsSchema>;

/** Pojedyncze naruszenie axe-core (realna dostępność). */
export const AxeViolationSchema = z.object({
  id: z.string(),
  impact: z.string().optional(), // minor | moderate | serious | critical
  help: z.string().optional(),
  helpUrl: z.string().optional(),
  description: z.string().optional(),
  nodes: z.number().optional(), // liczba dotkniętych węzłów
});
export type AxeViolation = z.infer<typeof AxeViolationSchema>;

export const RenderArtifactSchema = z.object({
  finalUrl: z.string(),
  redirectChain: z.array(z.string()).optional(),
  statusCode: z.number().optional(),
  /** Wyrenderowany DOM po wykonaniu JS. */
  html: z.string().optional(),
  /** Nagłówki odpowiedzi dokumentu głównego. */
  headers: z.record(z.string(), z.string()).optional(),
  tls: TlsInfoSchema.optional(),
  vitals: LabVitalsSchema.optional(),
  network: z.array(NetworkEntrySchema).optional(),
  console: z.array(ConsoleEntrySchema).optional(),
  cookies: z.array(CookieEntrySchema).optional(),
  axe: z.array(AxeViolationSchema).optional(),
  screenshots: z
    .object({ full: z.string().optional(), aboveFold: z.string().optional() })
    .optional(),
  /** Dodatkowe podstrony z crawla (opcjonalnie). */
  crawl: z
    .array(z.object({ url: z.string(), status: z.number().optional() }))
    .optional(),
  timing: z.object({ renderMs: z.number().optional() }).optional(),
});
export type RenderArtifact = z.infer<typeof RenderArtifactSchema>;
