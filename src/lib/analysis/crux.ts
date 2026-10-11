import type { Vitals } from "./types";

/* ============================================================
   CrUX — Chrome UX Report API: realne (terenowe) Core Web Vitals
   z p75 prawdziwych użytkowników Chrome. Klucz z CRUX_API_KEY lub
   (fallback) PAGESPEED_API_KEY — oba to klucze Google. Brak klucza
   lub brak danych dla adresu → zwraca null (degradacja łaskawa).
   ============================================================ */

const ENDPOINT = "https://chromeuxreport.googleapis.com/v1/records:queryRecord";

type Rating = "good" | "needs-improvement" | "poor";

/** Progi Core Web Vitals (p75). CLS bez jednostki, reszta w ms. */
function rate(metric: "lcp" | "cls" | "inp", p75: number): Rating {
  const t = {
    lcp: [2500, 4000],
    inp: [200, 500],
    cls: [0.1, 0.25],
  }[metric];
  if (p75 <= t[0]) return "good";
  if (p75 <= t[1]) return "needs-improvement";
  return "poor";
}

interface CruxMetric {
  percentiles?: { p75?: number | string };
}

interface CruxResponse {
  record?: {
    metrics?: {
      largest_contentful_paint?: CruxMetric;
      cumulative_layout_shift?: CruxMetric;
      interaction_to_next_paint?: CruxMetric;
    };
  };
}

function p75Of(m: CruxMetric | undefined): number | undefined {
  const raw = m?.percentiles?.p75;
  if (raw == null) return undefined;
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  return Number.isFinite(n) ? n : undefined;
}

async function query(body: object, key: string): Promise<CruxResponse | null> {
  try {
    const res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CruxResponse;
  } catch {
    return null;
  }
}

/** Zwraca sekcję `field` do raportu (vitals.field) albo null. */
export async function runCrux(url: string): Promise<Vitals["field"] | null> {
  const key = process.env.CRUX_API_KEY ?? process.env.PAGESPEED_API_KEY;
  if (!key) return null;

  // Najpierw dokładny URL; gdy brak danych — origin (szersza próbka).
  let data = await query({ url, formFactor: "PHONE" }, key);
  if (!data?.record?.metrics) {
    try {
      data = await query({ origin: new URL(url).origin }, key);
    } catch {
      return null;
    }
  }
  const metrics = data?.record?.metrics;
  if (!metrics) return null;

  const lcp = p75Of(metrics.largest_contentful_paint);
  const cls = p75Of(metrics.cumulative_layout_shift);
  const inp = p75Of(metrics.interaction_to_next_paint);
  if (lcp == null && cls == null && inp == null) return null;

  return {
    source: "CrUX",
    ...(lcp != null ? { lcp: { p75: lcp, rating: rate("lcp", lcp) } } : {}),
    ...(cls != null ? { cls: { p75: cls, rating: rate("cls", cls) } } : {}),
    ...(inp != null ? { inp: { p75: inp, rating: rate("inp", inp) } } : {}),
  };
}
