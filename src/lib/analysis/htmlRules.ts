import {
  CATEGORY_KEYS,
  type CategoryKey,
  type CategoryResult,
  type Metric,
  type MetricStatus,
  type Recommendation,
  type Severity,
} from "./types";

/* ============================================================
   Statyczna analiza kodu oparta na regułach (bez zewnętrznych API).
   Każda kontrola ma stabilne id, etykietę oraz opis „co sprawdza i
   dlaczego to ważne". Kontrola zwraca metrykę (zdaną lub nie), a przy
   wykryciu problemu także rekomendację z instrukcją naprawy i karą
   punktową. Wynik jest później wzbogacany przez model AI (ai.ts).
   ============================================================ */

export interface Source {
  name: string;
  content: string;
}

export interface StaticResult {
  categories: CategoryResult[];
  recommendations: Recommendation[];
}

/** Kontekst współdzielony przez wszystkie kontrole. */
interface CheckContext {
  html: string;
  js: string;
  css: string;
  all: string;
  hasHtml: boolean;
}

/** Wynik pojedynczej kontroli; `finding` obecne tylko przy problemie. */
interface CheckOutcome {
  status: MetricStatus;
  /** Zwięzła wartość obok etykiety (np. „OK", „Brak", „3/7"). */
  value: string | number;
  finding?: { severity: Severity; problem: string; fix: string; penalty: number };
}

interface Check {
  id: string;
  category: CategoryKey;
  label: string;
  description: string;
  /** Zwraca wynik lub `null`, gdy kontrola nie dotyczy danego wejścia. */
  run: (ctx: CheckContext) => CheckOutcome | null;
}

function count(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

/** Skrót: kontrola zdana. */
const ok = (value: string | number = "OK"): CheckOutcome => ({ status: "good", value });

/** Skrót: kontrola z problemem (status wynika z wagi). */
function fail(
  severity: Severity,
  value: string | number,
  problem: string,
  fix: string,
  penalty: number,
): CheckOutcome {
  return {
    status: severity === "critical" || severity === "high" ? "bad" : "warn",
    value,
    finding: { severity, problem, fix, penalty },
  };
}

const titleText = (html: string): string =>
  html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";

const CHECKS: Check[] = [
  // ---------- SEO ----------
  {
    id: "seo-title",
    category: "seo",
    label: "<title> tag",
    description:
      "The title is the primary on-page SEO signal and browser tab headline displayed in search engine results.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!titleText(c.html))
        return fail("high", "Missing", "The page lacks a <title> tag — essential for SEO rankings and browser tabs.", "Add a unique, descriptive <title> tag inside <head>.", 25);
      return ok("Present");
    },
  },
  {
    id: "seo-title-length",
    category: "seo",
    label: "Title length",
    description:
      "Optimal title length is 30–60 characters. Too short wastes ranking potential; too long gets truncated in search results.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const len = titleText(c.html).length;
      if (len === 0) return null;
      if (len < 30 || len > 60)
        return fail("low", `${len} chars`, `Title is ${len} characters long — outside the recommended 30–60 character range.`, "Adjust title length to 30–60 characters, front-loading the primary keyword.", 6);
      return ok(`${len} chars`);
    },
  },
  {
    id: "seo-meta-description",
    category: "seo",
    label: "Meta description",
    description:
      "A concise page summary displayed below the title in search results, directly impacting click-through rate (CTR).",
    run: (c) => {
      if (!c.hasHtml) return null;
      const desc = c.html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim();
      if (desc == null)
        return fail("medium", "Missing", "Missing meta description lowers CTR and allows search engines to pick arbitrary page snippets.", 'Add a <meta name="description" content="..."> summarizing the page (150–160 characters).', 15);
      if (desc.length < 50 || desc.length > 160)
        return fail("low", `${desc.length} chars`, `Description is ${desc.length} characters long — outside the recommended 50–160 character range.`, "Adjust description length to 50–160 characters with an engaging call to action.", 6);
      return ok(`${desc.length} chars`);
    },
  },
  {
    id: "seo-h1",
    category: "seo",
    label: "H1 heading",
    description:
      "The H1 heading declares the page's main topic to users and search engines. There should be exactly one.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<h1[\s>]/gi);
      if (n === 0)
        return fail("medium", "Missing", "Missing an H1 heading defining the primary topic of the page.", "Add exactly one <h1> heading describing the page content.", 12);
      if (n > 1)
        return fail("low", `${n}`, `Found ${n} H1 headings — exactly one is recommended for a clean document outline.`, "Keep one primary H1 heading and convert the others to H2–H6.", 6);
      return ok("1");
    },
  },
  {
    id: "seo-lang",
    category: "seo",
    label: "Document language (lang)",
    description:
      "The lang attribute on <html> instructs search engines and screen readers which pronunciation and indexing rules to use.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<html[^>]+lang=/i.test(c.html))
        return fail("low", "Missing", "The <html> element lacks a lang attribute — hindering indexing and assistive-tech pronunciation.", 'Set the document language, e.g. <html lang="en">.', 8);
      return ok("Present");
    },
  },
  {
    id: "seo-viewport",
    category: "seo",
    label: "Meta viewport",
    description:
      "The viewport meta tag enables responsive scaling on mobile devices. Without it, mobile browsers simulate desktop width.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+name=["']viewport["']/i.test(c.html))
        return fail("medium", "Missing", "Missing meta viewport — the page will not adapt or scale properly on mobile devices.", 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>.', 12);
      return ok("Present");
    },
  },
  {
    id: "seo-charset",
    category: "seo",
    label: "Charset declaration",
    description:
      "Declaring UTF-8 character encoding at the top of <head> prevents display errors and encoding-based injection attacks.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+charset=/i.test(c.html))
        return fail("low", "Missing", "Missing character encoding declaration — risk of garbled characters and encoding injection.", 'Add <meta charset="utf-8"> as the first element in <head>.', 5);
      return ok("Present");
    },
  },
  {
    id: "seo-canonical",
    category: "seo",
    label: "Canonical link",
    description:
      "A canonical URL informs search engines which URL version to index, preventing duplicate content dilution.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<link[^>]+rel=["']canonical["']/i.test(c.html))
        return fail("low", "Missing", "Missing canonical tag may split search ranking signals across duplicate URL variants.", 'Add <link rel="canonical" href="..."> to <head>.', 6);
      return ok("Present");
    },
  },
  {
    id: "seo-og",
    category: "seo",
    label: "Open Graph tags",
    description:
      "Open Graph tags (og:title, og:image) control the headline, summary, and preview card when shared on social platforms.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+property=["']og:(title|image)["']/i.test(c.html))
        return fail("low", "Missing", "Missing Open Graph tags — shared links will lack a custom preview image and title.", "Add og:title, og:description, and og:image meta tags in <head>.", 5);
      return ok("Present");
    },
  },
  {
    id: "seo-noindex",
    category: "seo",
    label: "Indexability",
    description:
      "Verifies the page does not inadvertently block search engine crawlers with a robots noindex directive.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(c.html))
        return fail("high", "noindex", "The page has a meta robots=noindex tag — search engines are blocked from indexing it.", "Remove the noindex directive if the page is intended to be indexed in search results.", 20);
      return ok("Allowed");
    },
  },
  {
    id: "seo-structured-data",
    category: "seo",
    label: "Structured data (JSON-LD)",
    description:
      "JSON-LD (schema.org) unlocks Google Rich Results: ratings, FAQs, product cards, and breadcrumbs.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<script[^>]+type=["']application\/ld\+json["']/i.test(c.html))
        return fail("low", "Missing", "Missing structured data — the page is ineligible for rich search snippets and enhanced cards.", "Add a JSON-LD script relevant to the page content.", 4);
      return ok("Present");
    },
  },
  // ---------- Accessibility ----------
  {
    id: "a11y-img-alt",
    category: "accessibility",
    label: "Image alt text",
    description:
      "The alt attribute describes images to screen readers and appears when graphics fail to load (WCAG AA requirement).",
    run: (c) => {
      if (!c.hasHtml) return null;
      const total = count(c.html, /<img\b[^>]*>/gi);
      if (total === 0) return null;
      const noAlt = count(c.html, /<img\b(?![^>]*\balt=)[^>]*>/gi);
      if (noAlt > 0)
        return fail(noAlt > 3 ? "critical" : "high", `${noAlt}/${total}`, `${noAlt} of ${total} images lack an alt attribute — screen readers cannot announce them.`, 'Add descriptive alt text to meaningful images; for purely decorative images use alt="".', Math.min(40, noAlt * 8));
      return ok(`${total} with alt`);
    },
  },
  {
    id: "a11y-input-labels",
    category: "accessibility",
    label: "Form field labels",
    description:
      "Every form field requires an associated label (label/aria-label) so screen readers can announce its purpose.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const inputs = count(c.html, /<input\b(?![^>]*\btype=["'](hidden|submit|button|reset)["'])[^>]*>/gi);
      if (inputs === 0) return null;
      const noLabel = count(c.html, /<input\b(?![^>]*\b(aria-label|aria-labelledby|id)=)[^>]*>/gi);
      if (noLabel > 0)
        return fail("medium", `${noLabel}`, `${noLabel} form input(s) lack an associated label — inaccessible to assistive technology.`, "Associate each input with a <label for> element or add an aria-label attribute.", Math.min(25, noLabel * 6));
      return ok("OK");
    },
  },
  {
    id: "a11y-empty-buttons",
    category: "accessibility",
    label: "Accessible button names",
    description:
      "Buttons without text or aria-label have no accessible name. Icon-only buttons require text alternatives.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const empty = count(c.html, /<button\b(?![^>]*\baria-label=)[^>]*>\s*<\/button>/gi);
      if (empty > 0)
        return fail("medium", `${empty}`, `${empty} button(s) lack visible text content or an aria-label.`, "Add descriptive text inside the button or provide an aria-label describing the action.", Math.min(20, empty * 6));
      return ok("OK");
    },
  },
  {
    id: "a11y-empty-links",
    category: "accessibility",
    label: "Link text content",
    description:
      "Links without text (icon-only) are not announced by screen readers and disrupt keyboard navigation.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const empty = count(c.html, /<a\b(?![^>]*\baria-label=)[^>]*>\s*<\/a>/gi);
      if (empty > 0)
        return fail("low", `${empty}`, `${empty} link(s) lack text content or an aria-label.`, "Add visible link text or an aria-label describing the destination.", Math.min(15, empty * 4));
      return ok("OK");
    },
  },
  {
    id: "a11y-tabindex",
    category: "accessibility",
    label: "Focus order (tabindex)",
    description:
      "Positive tabindex values force an artificial focus order that disorients keyboard and assistive tech users.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const pos = count(c.html, /tabindex=["'][1-9]/gi);
      if (pos > 0)
        return fail("low", `${pos}`, `Found ${pos} element(s) with positive tabindex — disrupts natural keyboard navigation order.`, "Use tabindex=0 or natural DOM source order instead of positive tabindex values.", Math.min(12, pos * 4));
      return ok("OK");
    },
  },
  {
    id: "a11y-iframe-title",
    category: "accessibility",
    label: "Iframe frame titles",
    description:
      "Every <iframe> requires a title attribute so screen readers can identify its content before navigating inside.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const total = count(c.html, /<iframe\b[^>]*>/gi);
      if (total === 0) return null;
      const noTitle = count(c.html, /<iframe\b(?![^>]*\btitle=)[^>]*>/gi);
      if (noTitle > 0)
        return fail("medium", `${noTitle}`, `${noTitle} iframe element(s) lack a title attribute.`, "Add a title attribute to each <iframe> describing its embedded content.", Math.min(15, noTitle * 5));
      return ok("OK");
    },
  },
  {
    id: "a11y-video-captions",
    category: "accessibility",
    label: "Video captions",
    description:
      "Video content should include a captions track (<track kind=captions>) for deaf and hard-of-hearing users.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (count(c.html, /<video\b[^>]*>/gi) === 0) return null;
      if (count(c.html, /<track\b[^>]*kind=["']captions["']/gi) === 0)
        return fail("medium", "Missing", "Video content lacks a captions track — inaccessible to deaf and hard-of-hearing users.", 'Add <track kind="captions" srclang="en" src="..."> inside <video>.', 10);
      return ok("Present");
    },
  },
  {
    id: "a11y-zoom",
    category: "accessibility",
    label: "Viewport zoom locking",
    description:
      "user-scalable=no or maximum-scale=1 blocks zooming on mobile — severely harming low-vision users.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (/<meta[^>]+name=["']viewport["'][^>]*content=["'][^"']*(user-scalable=no|maximum-scale=1)/i.test(c.html))
        return fail("medium", "Locked", "Viewport configuration blocks pinch-to-zoom — prevents low-vision users from magnifying content.", "Remove user-scalable=no and maximum-scale attributes from meta viewport.", 10);
      return ok("Allowed");
    },
  },
  // ---------- Security / Best Practices ----------
  {
    id: "sec-https",
    category: "security",
    label: "HTTPS resources",
    description:
      "Resources loaded over http:// on an HTTPS page trigger mixed content warnings and risk interception (MITM).",
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /(?:src|href)=["']http:\/\//gi);
      if (n > 0)
        return fail("low", `${n}`, `${n} resource(s) loaded over unencrypted http:// (mixed content) on an HTTPS page.`, "Update URLs from http:// to https:// or use protocol-relative/local paths.", Math.min(15, n * 3));
      return ok("OK");
    },
  },
  {
    id: "sec-blank-noopener",
    category: "security",
    label: 'target="_blank" link security',
    description:
      'Links opening in a new tab without rel="noopener" allow the target page to access window.opener (tabnabbing).',
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<a\b(?=[^>]*target=["']_blank["'])(?![^>]*rel=["'][^"']*noopener)[^>]*>/gi);
      if (n > 0)
        return fail("medium", `${n}`, `${n} target="_blank" link(s) lack rel="noopener" — vulnerable to tabnabbing phishing attacks.`, 'Add rel="noopener noreferrer" to all links with target="_blank".', 10);
      return ok("OK");
    },
  },
  {
    id: "sec-eval",
    category: "security",
    label: "eval() & new Function()",
    description:
      "Dynamic code execution (eval, new Function) introduces critical XSS vulnerabilities and prevents strict CSP.",
    run: (c) => {
      if (/\beval\s*\(/.test(c.all) || /new\s+Function\s*\(/.test(c.all))
        return fail("high", "Detected", "Use of eval()/new Function() allows arbitrary code execution and injection vulnerabilities (XSS).", "Replace eval/new Function with safe alternatives (JSON.parse, lookup maps).", 20);
      return ok("None");
    },
  },
  {
    id: "sec-innerhtml",
    category: "security",
    label: "innerHTML assignments",
    description:
      "Injecting untrusted data via innerHTML is a primary vector for cross-site scripting (XSS).",
    run: (c) => {
      const n = count(c.all, /\.innerHTML\s*=/g);
      if (n > 0)
        return fail("medium", `${n}`, `Found ${n} assignment(s) to innerHTML — risk of XSS if inserting untrusted content.`, "Use textContent or sanitize HTML with DOMPurify before inserting.", 12);
      return ok("None");
    },
  },
  {
    id: "sec-secrets",
    category: "security",
    label: "Hardcoded secrets in client code",
    description:
      "API keys, passwords, and private tokens embedded in client-side code are visible to anyone. Keep secrets on the server.",
    run: (c) => {
      if (/(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}/i.test(c.all))
        return fail("critical", "Detected", "Found string(s) resembling private API keys or tokens in client code — secrets must never reach the browser.", "Move secrets to server-side environment variables and rotate the exposed credentials immediately.", 30);
      return ok("None");
    },
  },
  {
    id: "sec-inline-handlers",
    category: "security",
    label: "Inline event handlers",
    description:
      'Inline attributes like onclick="..." mix markup with logic and require permissive CSP (unsafe-inline).',
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<[^>]+\son[a-z]+=["']/gi);
      if (n > 0)
        return fail("low", `${n}`, `${n} inline event handler(s) (e.g. onclick) — prevent strict Content Security Policy enforcement.`, "Move event logic to JavaScript files and attach listeners using addEventListener.", Math.min(12, n * 2));
      return ok("None");
    },
  },
  {
    id: "sec-document-write",
    category: "security",
    label: "document.write()",
    description:
      "document.write blocks parsing, can wipe the document, and degrades performance and security.",
    run: (c) => {
      const n = count(c.all, /document\.write\s*\(/g);
      if (n > 0)
        return fail("low", `${n}`, `Found ${n} call(s) to document.write() — blocks page render and poses security risks.`, "Replace document.write with modern DOM manipulation (createElement/append) or templating.", 6);
      return ok("None");
    },
  },
  {
    id: "sec-csp",
    category: "security",
    label: "Content-Security-Policy",
    description:
      "CSP restricts origins of scripts and resources — a primary defense against XSS and data exfiltration.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+http-equiv=["']content-security-policy["']/i.test(c.html))
        return fail("low", "Missing (meta)", "Missing CSP meta tag — if not configured via HTTP headers, the site is more vulnerable to XSS.", "Configure a strict Content-Security-Policy header on your server.", 6);
      return ok("Present");
    },
  },
  {
    id: "sec-sri",
    category: "security",
    label: "Subresource Integrity (SRI)",
    description:
      "The integrity attribute on third-party CDN scripts guarantees execution only of untampered code.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const ext = count(c.html, /<script\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>/gi);
      if (ext === 0) return null;
      const withSri = count(c.html, /<script\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*\bintegrity=/gi);
      if (withSri < ext)
        return fail("low", `${ext - withSri}`, `${ext - withSri} external script(s) lack the integrity attribute (SRI).`, "Add integrity and crossorigin attributes to scripts loaded from public CDNs.", Math.min(10, (ext - withSri) * 3));
      return ok("OK");
    },
  },
  {
    id: "sec-password-form",
    category: "security",
    label: "Password form transmission",
    description:
      "Password fields must submit exclusively over HTTPS; unencrypted submission exposes credentials.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<input\b[^>]*type=["']password["']/i.test(c.html)) return null;
      if (/<form\b[^>]*action=["']http:\/\//i.test(c.html))
        return fail("high", "HTTP", "Password form submits data over unencrypted http://.", "Set the form action attribute to an https:// endpoint.", 20);
      return ok("OK");
    },
  },
  // ---------- Performance (Static) ----------
  {
    id: "perf-blocking-scripts",
    category: "performance",
    label: "Render-blocking scripts",
    description:
      "External scripts without async or defer halt HTML parsing and delay first contentful paint.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<script\b(?![^>]*\b(async|defer)\b)(?![^>]*type=["']module)[^>]*\bsrc=/gi);
      if (n > 0)
        return fail("medium", `${n}`, `${n} external script(s) without async/defer block page rendering.`, "Add defer (or async) to scripts or move them to the end of <body>.", Math.min(25, n * 6));
      return ok("0");
    },
  },
  {
    id: "perf-img-dims",
    category: "performance",
    label: "Image dimensions (width & height)",
    description:
      "Images without explicit width and height reserve 0px until loaded, causing layout shifts (CLS).",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (count(c.html, /<img\b[^>]*>/gi) === 0) return null;
      const n = count(c.html, /<img\b(?![^>]*\b(width|height)=)[^>]*>/gi);
      if (n > 0)
        return fail("low", `${n}`, `${n} image(s) lack width/height attributes — causes unexpected layout shifts (CLS).`, "Set explicit width and height attributes (or CSS aspect-ratio) on all images.", Math.min(18, n * 5));
      return ok("OK");
    },
  },
  {
    id: "perf-lazy",
    category: "performance",
    label: "Lazy loading images",
    description:
      'The loading="lazy" attribute defers off-screen images, accelerating initial page display and saving bandwidth.',
    run: (c) => {
      if (!c.hasHtml) return null;
      const total = count(c.html, /<img\b[^>]*>/gi);
      if (total < 4) return null;
      const lazy = count(c.html, /<img\b[^>]*loading=["']lazy["']/gi);
      if (lazy === 0)
        return fail("low", "Missing", `None of the ${total} images use loading="lazy".`, 'Add loading="lazy" to images located below the initial viewport fold.', 6);
      return ok(`${lazy}/${total}`);
    },
  },
  {
    id: "perf-preconnect",
    category: "performance",
    label: "Preconnect resource hints",
    description:
      "rel=preconnect/dns-prefetch reduces connection handshake latency for third-party domains (fonts, CDNs, APIs).",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<(script|link)\b[^>]*(src|href)=["']https?:\/\//i.test(c.html)) return null;
      if (!/<link[^>]+rel=["'](preconnect|dns-prefetch)["']/i.test(c.html))
        return fail("low", "Missing", "Page connects to external origins without preconnect or dns-prefetch resource hints.", 'Add <link rel="preconnect" href="..."> for critical external domains.', 4);
      return ok("Present");
    },
  },
  {
    id: "perf-inline-css",
    category: "performance",
    label: "Large inline CSS blocks",
    description:
      "Oversized inline <style> blocks inflate initial HTML size and cannot be cached across site pages.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const total = (c.html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi) ?? []).reduce((n, s) => n + s.length, 0);
      if (total > 50_000)
        return fail("low", `${Math.round(total / 1024)} KB`, `Inline CSS weighs ${Math.round(total / 1024)} KB — inflates document size and cannot be cached.`, "Extract large stylesheet blocks into external .css files.", 6);
      return ok(total > 0 ? `${Math.round(total / 1024)} KB` : "OK");
    },
  },
  {
    id: "perf-font-display",
    category: "performance",
    label: "font-display property",
    description:
      "font-display: swap prevents Flash of Invisible Text (FOIT) while custom web fonts are downloading.",
    run: (c) => {
      if (!/@font-face/i.test(c.all)) return null;
      if (!/font-display\s*:/i.test(c.all))
        return fail("low", "Missing", "@font-face rules without font-display can hide text while fonts download (FOIT).", "Add font-display: swap to @font-face rules.", 5);
      return ok("Present");
    },
  },
  // ---------- Rozszerzenie (nowe reguły, Faza D) ----------
  {
    id: "seo-favicon",
    category: "seo",
    label: "Favicon",
    description:
      "A favicon is the small icon shown in browser tabs, bookmarks and search results — part of a credible, polished presence.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<link[^>]+rel=["'][^"']*icon/i.test(c.html))
        return fail("low", "Missing", "No favicon link found.", "Add a <link rel=\"icon\"> to the <head>.", 3);
      return ok("Present");
    },
  },
  {
    id: "seo-twitter-card",
    category: "seo",
    label: "Twitter Card",
    description:
      "Twitter/X Card tags control how the page looks when shared on X — a large image card drives far more engagement than a bare link.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+name=["']twitter:card["']/i.test(c.html))
        return fail("low", "Missing", "No twitter:card meta found.", "Add twitter:card (and twitter:title/image) meta tags.", 3);
      return ok("Present");
    },
  },
  {
    id: "a11y-skip-link",
    category: "accessibility",
    label: "Skip to content link",
    description:
      "A skip link lets keyboard and screen-reader users jump past repetitive navigation straight to the main content.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const hasNav = /<nav[\s>]/i.test(c.html);
      if (!hasNav) return null;
      if (!/<a[^>]+href=["']#[^"']+["'][^>]*>\s*(skip|przejd[źz])/i.test(c.html))
        return fail("low", "Missing", "No 'skip to content' link detected before the navigation.", "Add a visually-hidden skip link as the first focusable element.", 4);
      return ok("Present");
    },
  },
  {
    id: "a11y-landmark-main",
    category: "accessibility",
    label: "Main landmark",
    description:
      "A <main> landmark (or role=\"main\") lets assistive tech jump directly to the primary content region of the page.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<main[\s>]/i.test(c.html) && !/role=["']main["']/i.test(c.html))
        return fail("medium", "Missing", "No <main> landmark found.", "Wrap the primary content in a single <main> element.", 8);
      return ok("Present");
    },
  },
  {
    id: "a11y-duplicate-id",
    category: "accessibility",
    label: "Unique element IDs",
    description:
      "Duplicate id attributes break label associations, aria-* references and in-page anchors, confusing assistive tech.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const ids = [...c.html.matchAll(/\sid=["']([^"']+)["']/gi)].map((m) => m[1]);
      const seen = new Set<string>();
      const dupes = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) dupes.add(id);
        seen.add(id);
      }
      if (dupes.size > 0)
        return fail("medium", `${dupes.size}`, `${dupes.size} id value(s) are used more than once.`, "Make every id unique within the page.", Math.min(18, dupes.size * 6));
      return ok("OK");
    },
  },
  {
    id: "perf-dom-size",
    category: "performance",
    label: "DOM size",
    description:
      "A very large DOM slows style, layout and script work on every interaction and inflates memory use.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<[a-z][a-z0-9-]*(\s|>)/gi);
      if (n > 1500)
        return fail("medium", `~${n} els`, `The page renders roughly ${n} elements — large DOMs slow rendering and interaction.`, "Reduce nesting, virtualize long lists, and split heavy pages.", 12);
      return ok(`~${n} els`);
    },
  },
];

export function runStaticRules(sources: Source[]): StaticResult {
  const html = sources
    .filter((s) => /\.html?$/i.test(s.name) || /<html|<!doctype|<body|<div/i.test(s.content))
    .map((s) => s.content)
    .join("\n");
  const js = sources
    .filter((s) => /\.(m?js|ts|jsx|tsx)$/i.test(s.name))
    .map((s) => s.content)
    .join("\n");
  const css = sources
    .filter((s) => /\.css$/i.test(s.name))
    .map((s) => s.content)
    .join("\n");
  const all = sources.map((s) => s.content).join("\n");

  const ctx: CheckContext = { html, js, css, all, hasHtml: html.trim().length > 0 };

  const baseScores: Record<CategoryKey, number> = {
    performance: 100,
    seo: 100,
    accessibility: 100,
    security: 100,
  };
  const metricsByCat: Record<CategoryKey, Metric[]> = {
    performance: [],
    seo: [],
    accessibility: [],
    security: [],
  };
  const recommendations: Recommendation[] = [];

  for (const check of CHECKS) {
    const outcome = check.run(ctx);
    if (!outcome) continue; // kontrola nie dotyczy tego wejścia

    metricsByCat[check.category].push({
      id: check.id,
      label: check.label,
      value: outcome.value,
      description: check.description,
      status: outcome.status,
    });

    if (outcome.finding) {
      baseScores[check.category] -= outcome.finding.penalty;
      recommendations.push({
        id: `static-${recommendations.length}`,
        category: check.category,
        severity: outcome.finding.severity,
        title: check.label,
        problem: outcome.finding.problem,
        fix: outcome.finding.fix,
        docId: check.id,
        evidence: String(outcome.value),
      });
    }
  }

  const categories: CategoryResult[] = CATEGORY_KEYS.map((key) => {
    const metrics = metricsByCat[key];
    if (metrics.length === 0) {
      // Żadna kontrola nie dotyczyła kategorii (np. samodzielny arkusz CSS).
      return {
        key,
        score: 80,
        metrics: [
          {
            id: `${key}-na`,
            label: "No analysis data in this category",
            value: "—",
            description: "The provided input did not contain content required for these checks.",
            status: "warn" as MetricStatus,
          },
        ],
      };
    }
    return { key, score: Math.max(0, Math.min(100, baseScores[key])), metrics };
  });

  return { categories, recommendations };
}











