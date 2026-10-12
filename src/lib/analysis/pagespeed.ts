import type { CategoryKey, CategoryResult, Metric, MetricStatus } from "./types";
import type { NetworkEntry } from "./renderArtifact";

/* ============================================================
   Integracja z Google PageSpeed Insights (Lighthouse) — po stronie serwera.
   Klucz API czytany wyłącznie ze zmiennej środowiskowej.

   Mapujemy szeroki katalog audytów Lighthouse na nasze kategorie.
   Każdy wpis ma stabilne id (id audytu Lighthouse), krótką etykietę i
   opis „co sprawdza i dlaczego". Audyt trafia do raportu tylko wtedy,
   gdy Lighthouse go zwrócił i policzył (score != null) — dzięki temu
   nie pokazujemy kontroli nieadekwatnych dla danej strony.
   ============================================================ */

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

interface PsiAudit {
  score: number | null;
  numericValue?: number;
  displayValue?: string;
}

/** Pozycja katalogu: id audytu Lighthouse + nasza etykieta i opis. */
interface AuditSpec {
  id: string;
  label: string;
  description: string;
}

function metricStatus(score01: number | null): MetricStatus {
  if (score01 == null) return "warn";
  if (score01 >= 0.9) return "good";
  if (score01 >= 0.5) return "warn";
  return "bad";
}

function toScore100(score01: number | null | undefined): number {
  return Math.round((score01 ?? 0) * 100);
}

const PERF_METRICS: AuditSpec[] = [
  { id: "largest-contentful-paint", label: "LCP — Largest Contentful Paint", description: "Time to render the largest content element visible in the viewport. A key Core Web Vital — aim for under 2.5 s." },
  { id: "cumulative-layout-shift", label: "CLS — Cumulative Layout Shift", description: "Sum of unexpected layout shifts during load. A stable layout keeps CLS below 0.1." },
  { id: "total-blocking-time", label: "TBT — Total Blocking Time", description: "Total time the main thread was blocked and unable to respond to user input, measured between FCP and interactivity." },
  { id: "first-contentful-paint", label: "FCP — First Contentful Paint", description: "Time until the first piece of content appears on screen. Aim for under 1.8 s." },
  { id: "speed-index", label: "Speed Index", description: "How quickly the visible part of the page is filled with content during load." },
  { id: "interactive", label: "TTI — Time to Interactive", description: "Time until the page is fully interactive and reliably responds to user actions." },
  { id: "server-response-time", label: "TTFB — server response time", description: "Time spent waiting for the server's first byte of response. A high value delays the entire load." },
  { id: "render-blocking-resources", label: "Render-blocking resources", description: "Scripts and stylesheets that delay the page's first render. Defer them or inline critical CSS." },
  { id: "uses-text-compression", label: "Text compression", description: "Checks compression (gzip/brotli) of text resources. It reduces transfer size and speeds up downloads." },
  { id: "unused-css-rules", label: "Unused CSS", description: "CSS rules not used on the page increase transfer size and parsing time." },
  { id: "modern-image-formats", label: "Modern image formats", description: "WebP/AVIF formats weigh far less than JPEG/PNG at the same visual quality." },
  { id: "uses-responsive-images", label: "Responsive images", description: "Serving images larger than displayed wastes bandwidth. Use srcset/sizes." },
];

const SEO_METRICS: AuditSpec[] = [
  { id: "document-title", label: "Document title", description: "The <title> element describes the page in search results and the browser tab." },
  { id: "meta-description", label: "Meta description", description: "A short page summary shown in search results. It influences click-through rate (CTR)." },
  { id: "link-text", label: "Descriptive link text", description: "Link text should describe its destination rather than being generic — this helps both SEO and accessibility." },
  { id: "is-crawlable", label: "Indexability", description: "Checks that the page is not blocked from indexing via noindex or robots directives." },
  { id: "http-status-code", label: "HTTP status code", description: "The page should return a 200 status. Error codes prevent it from being indexed." },
  { id: "crawlable-anchors", label: "Crawlable links", description: "Links must use the href attribute so search engine crawlers can follow them." },
  { id: "robots-txt", label: "robots.txt file", description: "A valid robots.txt controls what crawlers may index. Errors there block visibility." },
  { id: "canonical", label: "Canonical URL", description: "The canonical tag points to the version of the page to index and prevents duplicate content." },
  { id: "hreflang", label: "hreflang", description: "Informs search engines about language versions of the page and directs users to the right one." },
  { id: "structured-data", label: "Structured data", description: "schema.org markup enables rich results (ratings, prices, FAQs) in search." },
  { id: "font-size", label: "Legible font size", description: "Text that is too small on mobile forces zooming and hurts both UX and SEO." },
  { id: "tap-targets", label: "Tap target size", description: "Buttons and links should be large and spaced enough to be tapped comfortably with a finger." },
];

const A11Y_METRICS: AuditSpec[] = [
  { id: "color-contrast", label: "Color contrast", description: "Text must have enough contrast against its background (WCAG AA) to stay readable for low-vision users." },
  { id: "image-alt", label: "Image alt text", description: "The alt attribute describes images to screen readers and appears when an image fails to load." },
  { id: "label", label: "Form field labels", description: "Every form field needs an associated label so screen readers can announce its purpose." },
  { id: "button-name", label: "Button names", description: "Buttons must have an accessible name (text or aria-label), otherwise they are unusable with a screen reader." },
  { id: "link-name", label: "Link names", description: "Links need recognizable content; empty links confuse users of assistive technology." },
  { id: "aria-required-attr", label: "Required ARIA attributes", description: "ARIA roles require specific attributes to convey an element's state correctly." },
  { id: "aria-valid-attr-value", label: "Valid ARIA values", description: "ARIA attributes must carry valid values, otherwise screen readers ignore them." },
  { id: "html-has-lang", label: "lang attribute", description: "The <html> element should have a lang attribute so screen readers use the correct pronunciation." },
  { id: "heading-order", label: "Heading order", description: "Headings (h1–h6) should keep a logical hierarchy without skipping levels." },
  { id: "list", label: "List structure", description: "Lists must be built correctly (<ul>/<ol> with <li>) so screen readers announce them properly." },
  { id: "meta-viewport", label: "Viewport scaling", description: "The viewport meta must not block zooming (user-scalable=no), which low-vision users rely on." },
  { id: "video-caption", label: "Video captions", description: "<video> elements should include a captions track for deaf and hard-of-hearing users." },
];

const SEC_METRICS: AuditSpec[] = [
  { id: "is-on-https", label: "HTTPS", description: "The page should be served over HTTPS to protect data in transit and establish trust." },
  { id: "csp-xss", label: "Content Security Policy (XSS)", description: "An effective CSP limits cross-site scripting and script-injection attacks." },
  { id: "no-vulnerable-libraries", label: "Libraries without known vulnerabilities", description: "Detects bundled front-end libraries with publicly known security flaws." },
  { id: "deprecations", label: "Deprecated APIs", description: "Using deprecated APIs risks breakage after a browser update and can be a source of risk." },
  { id: "errors-in-console", label: "Console errors", description: "Errors reported in the browser console signal problems that may affect security or stability." },
  { id: "geolocation-on-start", label: "Geolocation request on load", description: "Requesting location right after the page loads is intrusive and erodes user trust." },
  { id: "notification-on-start", label: "Notification request on load", description: "Requesting notification permission on entry hurts UX and is frequently abused." },
  { id: "doctype", label: "DOCTYPE declaration", description: "A missing <!doctype html> switches the browser into quirks mode and causes unpredictable rendering." },
  { id: "charset", label: "Charset declaration", description: "An explicit character encoding (UTF-8) prevents display errors and a class of injection attacks." },
  { id: "third-party-cookies", label: "Third-party cookies", description: "Third-party cookies are commonly used for tracking and are being phased out by browsers." },
];

const CATALOG: Record<CategoryKey, AuditSpec[]> = {
  performance: PERF_METRICS,
  seo: SEO_METRICS,
  accessibility: A11Y_METRICS,
  security: SEC_METRICS,
};

/** Buduje pojedynczą metrykę z audytu Lighthouse i naszej specyfikacji. */
function buildMetric(spec: AuditSpec, audit: PsiAudit): Metric {
  const status = metricStatus(audit.score);
  const fallback = status === "good" ? "OK" : status === "warn" ? "Review" : "Problem";
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    value: audit.displayValue && audit.displayValue.trim() !== "" ? audit.displayValue : fallback,
    score: toScore100(audit.score),
    status,
  };
}

/** Składa kategorię z audytów, które Lighthouse faktycznie policzył (score != null). */
function categoryFrom(
  key: CategoryKey,
  audits: Record<string, PsiAudit>,
  categoryScore01: number | null,
): CategoryResult {
  const specs = CATALOG[key];
  const metrics: Metric[] = [];
  for (const spec of specs) {
    const audit = audits[spec.id];
    if (!audit || audit.score == null) continue; // pokazujemy tylko adekwatne kontrole
    metrics.push(buildMetric(spec, audit));
  }

  const score =
    categoryScore01 != null
      ? toScore100(categoryScore01)
      : metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + (m.score ?? 0), 0) / metrics.length)
        : 0;

  return { key, score, metrics };
}

/**
 * Uruchamia PageSpeed Insights dla adresu URL (strategia mobile).
 * Zwraca kategorie + surowe audyty (do dalszego doprecyzowania przez AI),
 * albo null, gdy API zawiedzie.
 */
export async function runPageSpeed(
  rawUrl: string,
): Promise<{ categories: CategoryResult[]; raw: unknown; network?: NetworkEntry[] } | null> {
  const params = new URLSearchParams();
  params.set("url", rawUrl);
  params.set("strategy", "mobile");
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) {
    params.append("category", c);
  }
  const key = process.env.PAGESPEED_API_KEY;
  if (key) params.set("key", key);

  try {
    const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      lighthouseResult?: {
        audits?: Record<string, PsiAudit>;
        categories?: Record<string, { score: number | null }>;
      };
    };

    const lh = data.lighthouseResult;
    const audits = lh?.audits ?? {};
    const cats = lh?.categories ?? {};

    // best-practices Lighthouse ↦ nasza kategoria „security".
    const categories: CategoryResult[] = [
      categoryFrom("performance", audits, cats["performance"]?.score ?? null),
      categoryFrom("seo", audits, cats["seo"]?.score ?? null),
      categoryFrom("accessibility", audits, cats["accessibility"]?.score ?? null),
      categoryFrom("security", audits, cats["best-practices"]?.score ?? null),
    ];

    // Ekstrakcja zapytań sieciowych (network waterfall)
    const networkRaw = audits["network-requests"] as
      | { details?: { items?: Array<Record<string, unknown>> } }
      | undefined;
    const networkItems = networkRaw?.details?.items ?? [];
    const network: NetworkEntry[] = networkItems.map((item) => {
      const url = String(item.url || "");
      let domain: string | undefined;
      let thirdParty = false;
      try {
        domain = new URL(url).hostname;
        const pageHost = new URL(rawUrl).hostname;
        thirdParty = domain !== pageHost;
      } catch {
        // fallback
      }

      const startTime = typeof item.startTime === "number" ? Math.round(item.startTime * 1000) : undefined;
      const endTime = typeof item.endTime === "number" ? Math.round(item.endTime * 1000) : undefined;
      const duration = endTime != null && startTime != null ? Math.max(0, endTime - startTime) : undefined;

      return {
        url,
        resourceType: typeof item.resourceType === "string" ? item.resourceType.toLowerCase() : undefined,
        status: typeof item.statusCode === "number" ? item.statusCode : undefined,
        mimeType: typeof item.mimeType === "string" ? item.mimeType : undefined,
        transferSize: typeof item.transferSize === "number" ? item.transferSize : undefined,
        startTime,
        duration,
        domain,
        thirdParty,
      };
    });

    return { categories, raw: audits, network: network.length > 0 ? network : undefined };
  } catch {
    return null;
  }
}
