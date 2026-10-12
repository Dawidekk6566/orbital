import type { NetworkEntry } from "./renderArtifact";
import type { PerformanceBudget, BudgetCategory, CodeBloatItem } from "./types";

/* ============================================================
   Analizator Budżetu Wydajnościowego i Kodu (Code Bloat / Unused Bytes)
   Oblicza zużycie limitów transferu (JS, CSS, Fonty, Obrazy)
   oraz szacuje nieużywany kod na bazie audytów Lighthouse
   lub zapytań sieciowych.
   ============================================================ */

const DEFAULT_BUDGETS = {
  javascript: 350 * 1024, // 350 KB
  css: 60 * 1024,         // 60 KB
  images: 800 * 1024,     // 800 KB
  fonts: 120 * 1024,      // 120 KB
  total: 1500 * 1024,     // 1.5 MB
};

export function extractPerformanceBudget(
  audits: Record<string, unknown> = {},
  network: NetworkEntry[] = [],
): PerformanceBudget {
  // 1. Obliczanie wag zasobów według typów z network waterfall
  let jsBytes = 0;
  let cssBytes = 0;
  let imgBytes = 0;
  let fontBytes = 0;
  let totalBytes = 0;

  for (const entry of network) {
    const size = entry.transferSize || 0;
    totalBytes += size;
    const type = (entry.resourceType || "").toLowerCase();
    const mime = (entry.mimeType || "").toLowerCase();

    if (type === "script" || mime.includes("javascript")) {
      jsBytes += size;
    } else if (type === "stylesheet" || mime.includes("css")) {
      cssBytes += size;
    } else if (type === "image" || mime.startsWith("image/")) {
      imgBytes += size;
    } else if (type === "font" || mime.includes("font")) {
      fontBytes += size;
    }
  }

  // Fallback z auditów Lighthouse jeśli brak network
  if (totalBytes === 0 && audits["total-byte-weight"]) {
    const byteAudit = audits["total-byte-weight"] as {
      numericValue?: number;
      details?: { items?: Array<{ url?: string; totalBytes?: number }> };
    };
    totalBytes = byteAudit.numericValue || 0;
    const items = byteAudit.details?.items || [];
    for (const item of items) {
      const url = item.url || "";
      const bytes = item.totalBytes || 0;
      if (url.match(/\.js(\?.*)?$/i)) jsBytes += bytes;
      else if (url.match(/\.css(\?.*)?$/i)) cssBytes += bytes;
      else if (url.match(/\.(png|jpe?g|webp|avif|svg|gif)(\?.*)?$/i)) imgBytes += bytes;
      else if (url.match(/\.(woff2?|ttf|otf|eot)(\?.*)?$/i)) fontBytes += bytes;
    }
  }

  function makeCategory(name: string, actual: number, budget: number): BudgetCategory {
    const percent = Math.round((actual / budget) * 100);
    let status: "good" | "warn" | "bad" = "good";
    if (actual > budget) {
      status = "bad";
    } else if (actual > budget * 0.8) {
      status = "warn";
    }
    return {
      name,
      budgetBytes: budget,
      actualBytes: actual,
      status,
      percentUsed: percent,
    };
  }

  const budgets: BudgetCategory[] = [
    makeCategory("JavaScript", jsBytes, DEFAULT_BUDGETS.javascript),
    makeCategory("CSS", cssBytes, DEFAULT_BUDGETS.css),
    makeCategory("Images & Media", imgBytes, DEFAULT_BUDGETS.images),
    makeCategory("Web Fonts", fontBytes, DEFAULT_BUDGETS.fonts),
    makeCategory("Total Transfer", totalBytes, DEFAULT_BUDGETS.total),
  ];

  // 2. Ekstrakcja nieużywanego kodu z unused-javascript i unused-css-rules
  const bloatItems: CodeBloatItem[] = [];
  let totalWastedBytes = 0;

  const unusedJs = audits["unused-javascript"] as
    | { details?: { items?: Array<Record<string, unknown>> } }
    | undefined;
  if (unusedJs?.details?.items) {
    for (const item of unusedJs.details.items) {
      const url = String(item.url || "");
      const total = typeof item.totalBytes === "number" ? item.totalBytes : 0;
      const wasted = typeof item.wastedBytes === "number" ? item.wastedBytes : 0;
      const wastedPercent = typeof item.wastedPercent === "number" ? Math.round(item.wastedPercent) : (total > 0 ? Math.round((wasted / total) * 100) : 0);
      if (wasted > 2048) { // > 2KB
        totalWastedBytes += wasted;
        let label = url;
        try {
          const u = new URL(url);
          label = u.pathname.split("/").pop() || u.hostname;
        } catch {
          // fallback
        }
        bloatItems.push({
          url,
          label,
          totalBytes: total,
          wastedBytes: wasted,
          wastedPercent,
          type: "script",
        });
      }
    }
  }

  const unusedCss = audits["unused-css-rules"] as
    | { details?: { items?: Array<Record<string, unknown>> } }
    | undefined;
  if (unusedCss?.details?.items) {
    for (const item of unusedCss.details.items) {
      const url = String(item.url || "");
      const total = typeof item.totalBytes === "number" ? item.totalBytes : 0;
      const wasted = typeof item.wastedBytes === "number" ? item.wastedBytes : 0;
      const wastedPercent = typeof item.wastedPercent === "number" ? Math.round(item.wastedPercent) : (total > 0 ? Math.round((wasted / total) * 100) : 0);
      if (wasted > 1024) { // > 1KB
        totalWastedBytes += wasted;
        let label = url;
        try {
          const u = new URL(url);
          label = u.pathname.split("/").pop() || u.hostname;
        } catch {
          // fallback
        }
        bloatItems.push({
          url,
          label,
          totalBytes: total,
          wastedBytes: wasted,
          wastedPercent,
          type: "stylesheet",
        });
      }
    }
  }

  // Szacowane oszczędności czasu ładowania (np. transfer 4G ~ 1.5MB/s + RTT + parsowanie)
  // ~ 100ms na każde 50KB zaoszczędzonego transferu JS/CSS
  const potentialTimeSavingsMs = Math.round((totalWastedBytes / 1024 / 50) * 100);

  return {
    budgets,
    bloatItems: bloatItems.slice(0, 10), // top 10 bloat items
    totalWastedBytes,
    potentialTimeSavingsMs,
  };
}
