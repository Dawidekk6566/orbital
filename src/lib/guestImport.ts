import type { AnalysisReport } from "./analysis/types";

/* ============================================================
   Guest → account hand-off (client side).

   A logged-out visitor's landing audit lives only in the Zustand
   store. When they choose "Save to my account" we stash the report
   in localStorage and send them to sign up; after auth lands them on
   /dashboard, GuestImportClaimer reads the stash and persists it via
   the importGuestAudit Server Action (which re-validates it). The
   stash is same-origin and short-lived, so it survives the OAuth
   round-trip but is ignored if it goes stale.
   ============================================================ */

const KEY = "orbital:guest-import";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

type Stash = { report: AnalysisReport; ts: number };

/** Stash a guest report for import after sign-up. No-op server-side. */
export function stashGuestImport(report: AnalysisReport): void {
  if (typeof window === "undefined") return;
  try {
    const payload: Stash = { report, ts: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota — the hand-off is best-effort */
  }
}

/** Read a fresh stashed report (and forget stale/invalid ones), else null. */
export function readGuestImport(): AnalysisReport | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Stash>;
    if (!parsed || typeof parsed.ts !== "number" || !parsed.report) return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      clearGuestImport();
      return null;
    }
    return parsed.report;
  } catch {
    clearGuestImport();
    return null;
  }
}

/** Remove any stashed guest import. */
export function clearGuestImport(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
