import type { NetworkEntry } from "./renderArtifact";
import type { ConsoleIssue } from "./types";

/* ============================================================
   Dziennik Błędów Konsoli i Błędnych Zapytań (Console & HTTP Errors)
   Wyodrębnia błędy JavaScript z konsoli przeglądarki
   oraz nieudane zapytania sieciowe (kody 4xx i 5xx).
   ============================================================ */

export function extractConsoleIssues(
  audits: Record<string, unknown> = {},
  network: NetworkEntry[] = [],
): ConsoleIssue[] {
  const issues: ConsoleIssue[] = [];

  // 1. Ekstrakcja z audytu errors-in-console Lighthouse
  const consoleAudit = audits["errors-in-console"] as
    | {
        details?: {
          items?: Array<{
            description?: string;
            source?: string;
            url?: string;
          }>;
        };
      }
    | undefined;

  if (consoleAudit?.details?.items) {
    for (const item of consoleAudit.details.items) {
      const desc = String(item.description || "");
      if (!desc) continue;

      let type: "error" | "warning" | "violation" = "error";
      if (desc.toLowerCase().includes("violat") || desc.toLowerCase().includes("csp")) {
        type = "violation";
      } else if (desc.toLowerCase().includes("warn") || desc.toLowerCase().includes("deprecated")) {
        type = "warning";
      }

      issues.push({
        type,
        message: desc,
        source: item.source || "Console",
        url: item.url,
      });
    }
  }

  // 2. Ekstrakcja nieudanych zapytań HTTP (status >= 400) z Network Waterfall
  for (const entry of network) {
    const status = entry.status;
    if (status && status >= 400) {
      issues.push({
        type: "network",
        message: `HTTP ${status}: Failed to load resource (${entry.resourceType || "request"})`,
        source: "Network",
        url: entry.url,
      });
    }
  }

  return issues;
}
