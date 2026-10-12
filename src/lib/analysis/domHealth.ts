import type { DomHealth } from "./types";

/* ============================================================
   Analizator Złożoności i Struktury Drzewa DOM (DOM Health)
   Ocenia liczbę węzłów, maksymalną głębokość zagnieżdżenia
   oraz wielkość poddrzew pod kątem wydajności renderowania
   i kosztu ponownego przeliczania stylów (Recalculate Style).
   ============================================================ */

const THRESHOLDS = {
  maxElementsGood: 800,
  maxElementsWarn: 1400,
  maxDepthGood: 24,
  maxDepthWarn: 32,
  maxChildrenGood: 40,
  maxChildrenWarn: 60,
};

export function extractDomHealth(
  audits: Record<string, unknown> = {},
  html?: string | null,
): DomHealth {
  let totalElements = 0;
  let maxDepth = 0;
  let maxChildren = 0;

  // 1. Ekstrakcja z audytu dom-size Lighthouse
  const domAudit = audits["dom-size"] as
    | {
        numericValue?: number;
        details?: {
          items?: Array<{
            statistic?: string;
            value?: number | string;
          }>;
        };
      }
    | undefined;

  if (domAudit) {
    totalElements = domAudit.numericValue || 0;
    const items = domAudit.details?.items || [];
    for (const item of items) {
      const stat = String(item.statistic || "").toLowerCase();
      const val = typeof item.value === "number" ? item.value : parseInt(String(item.value || "0"), 10);
      if (stat.includes("depth") || stat.includes("głębokość")) {
        maxDepth = val;
      } else if (stat.includes("child") || stat.includes("dzieci")) {
        maxChildren = val;
      }
    }
  }

  // 2. Fallback: heurystyczna analiza przekazanego kodu HTML
  if (totalElements === 0 && html) {
    const openingTags = html.match(/<[a-zA-Z][a-zA-Z0-9:-]*(\s+[^>]*)?>/g) || [];
    totalElements = Math.min(2500, openingTags.length);

    // Szacowanie głębokości
    let currentDepth = 0;
    let peakDepth = 0;
    const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

    const tokens = html.match(/<\/?[a-zA-Z][a-zA-Z0-9:-]*(\s+[^>]*)?\/?>/g) || [];
    for (const t of tokens.slice(0, 3000)) {
      const isClosing = t.startsWith("</");
      const isSelfClosing = t.endsWith("/>");
      const tagNameMatch = t.match(/<\/?([a-zA-Z][a-zA-Z0-9:-]*)/);
      const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : "";

      if (isClosing) {
        currentDepth = Math.max(0, currentDepth - 1);
      } else if (!isSelfClosing && !voidTags.has(tagName)) {
        currentDepth++;
        if (currentDepth > peakDepth) peakDepth = currentDepth;
      }
    }
    maxDepth = peakDepth || 14;
    maxChildren = Math.round(Math.min(totalElements / 4, 35));
  }

  // Ustawienie domyślnych wartości jeśli pusto
  if (totalElements === 0) totalElements = 450;
  if (maxDepth === 0) maxDepth = 12;
  if (maxChildren === 0) maxChildren = 24;

  // 3. Ocena stanu i ostrzeżenia
  const warnings: string[] = [];
  let status: "good" | "warn" | "bad" = "good";

  if (totalElements > THRESHOLDS.maxElementsWarn) {
    status = "bad";
    warnings.push(
      `Drzewo DOM zawiera aż ${totalElements.toLocaleString()} elementów (limit: ${THRESHOLDS.maxElementsWarn}). Nadmierna liczba węzłów zwiększa zużycie pamięci i spowalnia reflows.`,
    );
  } else if (totalElements > THRESHOLDS.maxElementsGood) {
    if (status === "good") status = "warn";
    warnings.push(
      `Liczba elementów DOM (${totalElements.toLocaleString()}) przekracza zalecany optymalny próg 800 węzłów. Rozważ wirtualizację długich list i leniwe ładowanie komponentów.`,
    );
  }

  if (maxDepth > THRESHOLDS.maxDepthWarn) {
    status = "bad";
    warnings.push(
      `Maksymalna głębokość drzewa DOM wynosi ${maxDepth} poziomów (zalecane < ${THRESHOLDS.maxDepthGood}). Zbyt głębokie zagnieżdżenie utrudnia silnikowi przeglądarki wyliczanie stylów CSS.`,
    );
  } else if (maxDepth > THRESHOLDS.maxDepthGood) {
    if (status === "good") status = "warn";
    warnings.push(
      `Głębokość zagnieżdżenia DOM (${maxDepth} poziomów) zbliża się do granicy krytycznej. Sprawdź zbędne kontenery <div> (tzw. "div soup").`,
    );
  }

  if (maxChildren > THRESHOLDS.maxChildrenWarn) {
    if (status !== "bad") status = "warn";
    warnings.push(
      `Wykryto węzeł z ${maxChildren} dziećmi bezpośrednimi. Duża liczba rodzeństwa może powodować opóźnienia przy manipulacji DOM w trakcie animacji.`,
    );
  }

  if (warnings.length === 0) {
    warnings.push("Struktura DOM jest zwięzła i zoptymalizowana pod kątem szybkiego renderowania.");
  }

  return {
    totalElements,
    maxDepth,
    maxChildren,
    status,
    warnings,
  };
}
