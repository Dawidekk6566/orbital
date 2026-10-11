/* ============================================================
   Prosty rate limiting w pamięci (fixed window) per adres IP.
   Uwaga: w środowisku serverless pamięć jest per-instancja — do
   produkcji warto podpiąć Redis/Upstash. Tu chroni przed nadużyciem
   endpointu analizy (kosztowne wywołania zewnętrznych API).
   ============================================================ */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000; // 1 minuta
const MAX_REQUESTS = 10; // maks. 10 żądań / minutę / IP

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + WINDOW_MS;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: MAX_REQUESTS - bucket.count, resetAt: bucket.resetAt };
}

/** Wyciąga identyfikator klienta z nagłówków (za proxy/Vercel). */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
