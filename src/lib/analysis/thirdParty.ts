import type { NetworkEntry } from "./renderArtifact";
import type { ThirdPartySummary, ThirdPartyEntity } from "./types";

/* ============================================================
   Analizator Usług Zewnętrznych (Third-Party Impact Breakdown)
   Wykrywa wpływ zewnętrznych bibliotek, tagów i skryptów
   na wagę transferu i czas blokowania wątku głównego (CPU).
   ============================================================ */

const KNOWN_ENTITIES: Record<string, { name: string; category: string }> = {
  "googletagmanager.com": { name: "Google Tag Manager", category: "Tag Manager" },
  "google-analytics.com": { name: "Google Analytics", category: "Analytics" },
  "analytics.google.com": { name: "Google Analytics", category: "Analytics" },
  "facebook.net": { name: "Meta Pixel", category: "Marketing" },
  "connect.facebook.net": { name: "Meta SDK", category: "Marketing" },
  "doubleclick.net": { name: "Google AdSense / Ads", category: "Advertising" },
  "adservice.google.com": { name: "Google Ads", category: "Advertising" },
  "hotjar.com": { name: "Hotjar", category: "User Experience" },
  "sentry.io": { name: "Sentry Error Monitoring", category: "Monitoring" },
  "sentry-cdn.com": { name: "Sentry SDK", category: "Monitoring" },
  "intercom.io": { name: "Intercom Chat", category: "Customer Support" },
  "crisp.chat": { name: "Crisp Chat", category: "Customer Support" },
  "stripe.com": { name: "Stripe Elements", category: "Payments" },
  "paypal.com": { name: "PayPal SDK", category: "Payments" },
  "clarity.ms": { name: "Microsoft Clarity", category: "Analytics" },
  "tiktok.com": { name: "TikTok Pixel", category: "Marketing" },
  "cloudflare.com": { name: "Cloudflare Web Analytics / CDN", category: "CDN / Utility" },
  "cdnjs.cloudflare.com": { name: "CDNJS (Cloudflare)", category: "CDN / Libraries" },
  "unpkg.com": { name: "Unpkg CDN", category: "CDN / Libraries" },
  "jsdelivr.net": { name: "jsDelivr CDN", category: "CDN / Libraries" },
  "fonts.googleapis.com": { name: "Google Fonts (CSS)", category: "Typography" },
  "fonts.gstatic.com": { name: "Google Fonts (Woff2)", category: "Typography" },
};

function matchEntity(domain: string): { name: string; category: string } {
  for (const [key, val] of Object.entries(KNOWN_ENTITIES)) {
    if (domain === key || domain.endsWith("." + key)) {
      return val;
    }
  }
  return { name: domain, category: "Third-Party" };
}

export function extractThirdPartySummary(
  audits: Record<string, unknown> = {},
  network: NetworkEntry[] = [],
  pageHost?: string,
): ThirdPartySummary {
  const entityMap = new Map<string, ThirdPartyEntity>();

  let firstPartyBytes = 0;
  let thirdPartyBytes = 0;
  let firstPartyMainThreadMs = 0;
  let thirdPartyMainThreadMs = 0;

  // 1. Ekstrakcja z audytu Lighthouse third-party-summary (jeśli dostępny)
  const lhThirdParty = audits["third-party-summary"] as
    | {
        details?: {
          items?: Array<{
            entity?: { text?: string };
            transferSize?: number;
            blockingTime?: number;
            mainThreadTime?: number;
            subItems?: { items?: Array<{ url?: string; transferSize?: number; blockingTime?: number }> };
          }>;
        };
      }
    | undefined;

  if (lhThirdParty?.details?.items && lhThirdParty.details.items.length > 0) {
    for (const item of lhThirdParty.details.items) {
      const name = item.entity?.text || "Unknown Entity";
      const size = item.transferSize || 0;
      const blocking = typeof item.blockingTime === "number" ? Math.round(item.blockingTime) : 0;
      const mainThread = typeof item.mainThreadTime === "number" ? Math.round(item.mainThreadTime) : blocking;
      const count = item.subItems?.items?.length || 1;

      thirdPartyBytes += size;
      thirdPartyMainThreadMs += mainThread;

      const matched = matchEntity(name.toLowerCase());
      entityMap.set(name, {
        entity: name,
        category: matched.category,
        transferSize: size,
        blockingTimeMs: blocking,
        mainThreadTimeMs: mainThread,
        urlCount: count,
      });
    }
  } else if (network.length > 0) {
    // 2. Fallback: grupowanie na bazie network waterfall
    for (const entry of network) {
      const size = entry.transferSize || 0;
      const isThirdParty = Boolean(entry.thirdParty);
      const domain = entry.domain || "";

      if (isThirdParty && domain) {
        thirdPartyBytes += size;
        const matched = matchEntity(domain);
        const existing = entityMap.get(matched.name);
        if (existing) {
          existing.transferSize += size;
          existing.urlCount += 1;
        } else {
          entityMap.set(matched.name, {
            entity: matched.name,
            category: matched.category,
            transferSize: size,
            blockingTimeMs: 0,
            mainThreadTimeMs: 0,
            urlCount: 1,
          });
        }
      } else {
        firstPartyBytes += size;
      }
    }
  }

  // Obliczenie wagi first-party jeśli Lighthouse nie dał bezpośrednio
  if (firstPartyBytes === 0 && network.length > 0) {
    for (const entry of network) {
      if (!entry.thirdParty) {
        firstPartyBytes += entry.transferSize || 0;
      }
    }
  }

  // Szacowany czas CPU first-party na bazie TBT
  const tbtAudit = audits["total-blocking-time"] as { numericValue?: number } | undefined;
  const totalTbt = tbtAudit?.numericValue || 0;
  firstPartyMainThreadMs = Math.max(0, Math.round(totalTbt - thirdPartyMainThreadMs));

  const totalBytes = firstPartyBytes + thirdPartyBytes;
  const thirdPartyPercent = totalBytes > 0 ? Math.round((thirdPartyBytes / totalBytes) * 100) : 0;

  const entities = Array.from(entityMap.values()).sort(
    (a, b) => b.transferSize - a.transferSize,
  );

  return {
    entities,
    firstPartyBytes,
    thirdPartyBytes,
    thirdPartyPercent,
    firstPartyMainThreadMs,
    thirdPartyMainThreadMs,
  };
}
