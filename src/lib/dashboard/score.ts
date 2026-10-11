/* Score → tone mapping shared across dashboard views. Mirrors the
   bands in ResultsDashboard (good ≥ 90, warn ≥ 50, else poor) so the
   account pages read the same as the embedded report. Pure + isomorphic
   (no "use client"/"server-only") — safe in Server or Client Components. */

export type ScoreTone = "good" | "warn" | "poor" | "none";

export function scoreTone(score: number | null | undefined): ScoreTone {
  if (score == null) return "none";
  if (score >= 90) return "good";
  if (score >= 50) return "warn";
  return "poor";
}

export const TONE_TEXT: Record<ScoreTone, string> = {
  good: "text-good",
  warn: "text-warn",
  poor: "text-bad",
  none: "text-faint",
};

export const TONE_BG: Record<ScoreTone, string> = {
  good: "bg-good",
  warn: "bg-warn",
  poor: "bg-bad",
  none: "bg-line",
};

/** Short relative-time label, e.g. "3d ago", "just now". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}
