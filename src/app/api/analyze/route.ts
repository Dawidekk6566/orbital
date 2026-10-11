import { NextResponse } from "next/server";
import { AnalyzeRequestSchema } from "@/lib/analysis/types";
import { analyze } from "@/lib/analysis/aggregate";
import { SsrfError } from "@/lib/ssrf";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/messages";

/* ============================================================
   Endpoint analizy. Zabezpieczenia:
   - rate limiting per IP,
   - walidacja i limity rozmiaru wejścia (zod),
   - ochrona SSRF w warstwie analizy (tryb url),
   - klucze API czytane wyłącznie po stronie serwera.
   ============================================================ */

export const runtime = "nodejs"; // potrzebne dla node:dns (SSRF)
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12_000_000; // ~12 MB (obejmuje zrzuty ekranu w base64)

export async function POST(req: Request) {
  // 1) Rate limiting
  const limit = rateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  // 2) Limit rozmiaru ciała żądania
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  // 3) Parsowanie + walidacja
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = AnalyzeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const headerLocale = req.headers.get("x-locale") ?? "";
  const locale: Locale = (LOCALES as readonly string[]).includes(headerLocale)
    ? (headerLocale as Locale)
    : DEFAULT_LOCALE;

  // 4) Analiza
  try {
    const report = await analyze(parsed.data, locale);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof SsrfError) {
      return NextResponse.json({ error: "ssrf_blocked", message: err.message }, { status: 400 });
    }
    console.error("[analyze] error", err);
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}
