import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  CATEGORY_KEYS,
  SEVERITIES,
  type CategoryKey,
  type Recommendation,
} from "./types";
import type { Source } from "./htmlRules";
import type { Locale } from "@/i18n/messages";

/* ============================================================
   Warstwa AI (Claude) — jakościowe rekomendacje i analiza zrzutów ekranu.
   Klucz API wyłącznie po stronie serwera. Brak klucza => zwraca null
   (warstwa nadrzędna używa wtedy reguł / trybu demo).
   ============================================================ */

const MODEL = process.env.ANALYSIS_MODEL ?? "claude-sonnet-5-5";

const AiOutputSchema = z.object({
  scores: z
    .object({
      performance: z.number().min(0).max(100).optional(),
      seo: z.number().min(0).max(100).optional(),
      accessibility: z.number().min(0).max(100).optional(),
      security: z.number().min(0).max(100).optional(),
    })
    .partial()
    .optional(),
  recommendations: z
    .array(
      z.object({
        category: z.string(),
        severity: z.string(),
        title: z.string(),
        problem: z.string(),
        fix: z.string(),
      }),
    )
    .max(20),
});

export interface AiResult {
  scores?: Partial<Record<CategoryKey, number>>;
  recommendations: Recommendation[];
}

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function extractJson(text: string): unknown {
  // model bywa gadatliwy — wyłuskujemy pierwszy obiekt JSON
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  return JSON.parse(match[0]);
}

function normalize(parsed: z.infer<typeof AiOutputSchema>): AiResult {
  const recs: Recommendation[] = [];
  parsed.recommendations.forEach((r, i) => {
    const category = (CATEGORY_KEYS as readonly string[]).includes(r.category)
      ? (r.category as CategoryKey)
      : "security";
    const severity = (SEVERITIES as readonly string[]).includes(r.severity)
      ? (r.severity as Recommendation["severity"])
      : "medium";
    recs.push({
      id: `ai-${i}`,
      category,
      severity,
      title: r.title.slice(0, 160),
      problem: r.problem.slice(0, 600),
      fix: r.fix.slice(0, 600),
    });
  });
  return { scores: parsed.scores, recommendations: recs };
}

const SYSTEM_PROMPT = (locale: Locale) => `Jesteś ekspertem od jakości stron WWW (wydajność, SEO, dostępność WCAG, bezpieczeństwo front-endu).
Analizujesz dostarczony materiał i zwracasz WYŁĄCZNIE poprawny JSON, bez komentarzy, w formacie:
{"scores":{"performance":0-100,"seo":0-100,"accessibility":0-100,"security":0-100},"recommendations":[{"category":"performance|seo|accessibility|security","severity":"critical|high|medium|low","title":"...","problem":"...","fix":"..."}]}
Zasady: maks. 8 rekomendacji, najważniejsze najpierw; "fix" musi być konkretną, wykonalną instrukcją.
Język pól tekstowych: ${locale === "pl" ? "polski" : "angielski"}.`;

/** Rekomendacje AI na podstawie kodu/plików. */
export async function aiFromCode(
  sources: Source[],
  locale: Locale,
): Promise<AiResult | null> {
  const client = getClient();
  if (!client) return null;

  // Ograniczamy rozmiar wejścia wysyłanego do modelu.
  const combined = sources
    .map((s) => `/* ${s.name} */\n${s.content}`)
    .join("\n\n")
    .slice(0, 60_000);

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT(locale),
      messages: [
        {
          role: "user",
          content: `Przeanalizuj poniższy kod strony i zwróć JSON zgodnie z instrukcją.\n\n${combined}`,
        },
      ],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    return normalize(AiOutputSchema.parse(extractJson(text)));
  } catch {
    return null;
  }
}

/** Analiza wizualna zrzutu ekranu (layout, kontrast, hierarchia, UX). */
export async function aiFromScreenshot(
  imageDataUrl: string,
  notes: string | undefined,
  locale: Locale,
): Promise<AiResult | null> {
  const client = getClient();
  if (!client) return null;

  const match = imageDataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
  if (!match) return null;
  const mediaType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const base64 = match[3];

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT(locale),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/png" | "image/jpeg" | "image/webp",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Oceń wizualnie ten zrzut ekranu strony: layout, kontrast, hierarchia, czytelność, UX. ${
                notes ? `Kontekst od autora: ${notes}. ` : ""
              }Zwróć JSON zgodnie z instrukcją.`,
            },
          ],
        },
      ],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    return normalize(AiOutputSchema.parse(extractJson(text)));
  } catch {
    return null;
  }
}

/** Krótkie, jakościowe podsumowanie/rekomendacje do wyniku PageSpeed (opcjonalne). */
export async function aiRefineFromPageSpeed(
  url: string,
  raw: unknown,
  locale: Locale,
): Promise<AiResult | null> {
  const client = getClient();
  if (!client) return null;
  const digest = JSON.stringify(raw).slice(0, 40_000);
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT(locale),
      messages: [
        {
          role: "user",
          content: `Na podstawie surowego wyniku Lighthouse dla ${url} sformułuj priorytetowe rekomendacje (pole scores pomiń). Dane:\n${digest}`,
        },
      ],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    return normalize(AiOutputSchema.parse(extractJson(text)));
  } catch {
    return null;
  }
}
