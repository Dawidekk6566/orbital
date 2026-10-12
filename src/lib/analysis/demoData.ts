import type { AnalysisReport, CategoryKey } from "./types";

/* ============================================================
   Dane przykładowe / tryb demo.
   Używane w sekcji „Demo raportu" oraz jako fallback, gdy
   brakuje kluczy API (aplikacja działa i wygląda dobrze bez konfiguracji).
   ============================================================ */

function statusFromScore(score: number): "good" | "warn" | "bad" {
  if (score >= 90) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

export function buildDemoReport(targetValue = "https://example.com"): AnalysisReport {
  const scores: Record<CategoryKey, number> = {
    performance: 72,
    seo: 88,
    accessibility: 64,
    security: 81,
  };

  const overall = Math.round(
    (scores.performance + scores.seo + scores.accessibility + scores.security) / 4,
  );

  return {
    target: { mode: "url", value: targetValue },
    overallScore: overall,
    categories: [
      {
        key: "performance",
        score: scores.performance,
        metrics: [
          { id: "lcp", label: "LCP — Largest Contentful Paint", value: 2.8, unit: "s", score: 68, status: "warn", description: "Time to render the largest content element. Aim for under 2.5 s." },
          { id: "cls", label: "CLS — Cumulative Layout Shift", value: 0.04, score: 96, status: "good", description: "Layout stability during load. Aim for under 0.1." },
          { id: "tbt", label: "TBT — Total Blocking Time", value: 320, unit: "ms", score: 61, status: "warn", description: "Time the main thread was blocked between FCP and interactivity." },
          { id: "fcp", label: "FCP — First Contentful Paint", value: 1.6, unit: "s", score: 82, status: "good", description: "Time until the first content appears. Aim for under 1.8 s." },
          { id: "si", label: "Speed Index", value: 3.4, unit: "s", score: 64, status: "warn", description: "How quickly the visible part of the page fills with content." },
          { id: "ttfb", label: "TTFB — server response time", value: 0.6, unit: "s", score: 78, status: "good", description: "Time waiting for the server's first byte of response." },
          { id: "render-blocking-resources", label: "Render-blocking resources", value: "2 resources", score: 55, status: "warn", description: "Scripts/styles that delay the page's first render." },
          { id: "modern-image-formats", label: "Modern image formats", value: "3 images", score: 60, status: "warn", description: "WebP/AVIF weigh less than JPEG/PNG at the same quality." },
        ],
      },
      {
        key: "seo",
        score: scores.seo,
        metrics: [
          { id: "document-title", label: "Document title", value: "OK", score: 100, status: "good", description: "The <title> element describes the page in search results." },
          { id: "meta-description", label: "Meta description", value: "Missing", score: 40, status: "bad", description: "Summary shown in search results. Affects click-through rate." },
          { id: "heading-order", label: "Heading structure H1–H6", value: "OK", score: 90, status: "good", description: "Logical heading hierarchy without skipped levels." },
          { id: "canonical", label: "Canonical URL", value: "OK", score: 100, status: "good", description: "The canonical tag prevents duplicate content." },
          { id: "seo-lang", label: "lang attribute", value: "OK", score: 100, status: "good", description: "Declares the document language for search engines and screen readers." },
          { id: "seo-viewport", label: "Meta viewport", value: "OK", score: 100, status: "good", description: "Correct scaling on mobile devices." },
          { id: "seo-og", label: "Open Graph", value: "Partial", score: 65, status: "warn", description: "Open Graph tags control the link preview on social media." },
          { id: "structured-data", label: "Structured data", value: "Missing", score: 50, status: "warn", description: "schema.org enables rich results in search." },
        ],
      },
      {
        key: "accessibility",
        score: scores.accessibility,
        metrics: [
          { id: "color-contrast", label: "Text contrast", value: "3 errors", score: 55, status: "warn", description: "Text needs at least 4.5:1 contrast against its background (WCAG AA)." },
          { id: "image-alt", label: "Alt text", value: "7 missing", score: 48, status: "bad", description: "The alt attribute describes images to screen readers." },
          { id: "aria-required-attr", label: "ARIA attributes", value: "OK", score: 85, status: "good", description: "Correct ARIA roles and attributes for assistive technology." },
          { id: "label", label: "Form field labels", value: "2 missing", score: 70, status: "warn", description: "Every field needs an associated label." },
          { id: "button-name", label: "Button names", value: "OK", score: 100, status: "good", description: "Buttons must have an accessible name (text or aria-label)." },
          { id: "link-name", label: "Link names", value: "1 empty", score: 78, status: "warn", description: "Links need recognizable content." },
          { id: "heading-order", label: "Heading order", value: "OK", score: 90, status: "good", description: "Headings keep a logical order of levels." },
          { id: "html-has-lang", label: "Document lang attribute", value: "OK", score: 100, status: "good", description: "Lets screen readers pronounce content correctly." },
        ],
      },
      {
        key: "security",
        score: scores.security,
        metrics: [
          { id: "is-on-https", label: "HTTPS", value: "Yes", score: 100, status: "good", description: "An encrypted connection protects data in transit." },
          { id: "csp-xss", label: "Content-Security-Policy", value: "Missing", score: 40, status: "bad", description: "CSP limits XSS attacks and script injection." },
          { id: "header-hsts", label: "HSTS", value: "OK", score: 100, status: "good", description: "Forces HTTPS on subsequent visits." },
          { id: "no-vulnerable-libraries", label: "Outdated libraries", value: "1", score: 75, status: "warn", description: "Front-end libraries with known vulnerabilities." },
          { id: "header-xfo", label: "X-Frame-Options", value: "Missing", score: 60, status: "warn", description: "Protects against clickjacking via framing." },
          { id: "header-referrer", label: "Referrer-Policy", value: "OK", score: 90, status: "good", description: "Limits URL leakage to third parties." },
          { id: "sec-https", label: "Mixed content", value: "OK", score: 100, status: "good", description: "No HTTP resources on an HTTPS page." },
          { id: "sec-sri", label: "Subresource Integrity", value: "Partial", score: 65, status: "warn", description: "The integrity attribute verifies that CDN resources are unchanged." },
        ],
      },
    ],
    radar: [
      { category: "performance", score: scores.performance },
      { category: "seo", score: scores.seo },
      { category: "accessibility", score: scores.accessibility },
      { category: "security", score: scores.security },
    ],
    recommendations: [
      {
        id: "r1",
        docId: "image-alt",
        category: "accessibility",
        severity: "critical",
        title: "Missing image alt text",
        problem:
          "7 images have no alt attribute, so screen readers cannot describe their content to blind users.",
        fix: 'Add a descriptive alt attribute to every meaningful <img>, e.g. alt="2025 revenue growth chart". Use alt="" for decorative images.',
      },
      {
        id: "r2",
        docId: "header-csp",
        category: "security",
        severity: "high",
        title: "Missing Content-Security-Policy header",
        problem:
          "Without a CSP the page is more exposed to XSS attacks and injection of external scripts.",
        fix: "Add a Content-Security-Policy header (e.g. default-src 'self') in your server config or next.config, then progressively tighten the allowed sources.",
      },
      {
        id: "r3",
        docId: "meta-description",
        category: "seo",
        severity: "high",
        title: "Missing meta description",
        problem:
          "The page has no meta description, so search engines auto-generate the snippet, which lowers CTR.",
        fix: 'Add <meta name="description" content="..."> of 150–160 characters containing the key phrase and a call to action.',
      },
      {
        id: "r4",
        docId: "largest-contentful-paint",
        category: "performance",
        severity: "medium",
        title: "High LCP (2.8 s)",
        problem:
          "The largest content element renders too slowly — above the recommended 2.5 s threshold.",
        fix: "Optimize the hero image (WebP/AVIF, preload), set a loading priority, and reduce render-blocking CSS/JS.",
      },
      {
        id: "r5",
        docId: "total-blocking-time",
        category: "performance",
        severity: "medium",
        title: "Total Blocking Time 320 ms",
        problem: "Long JavaScript tasks block the main thread and delay interactivity.",
        fix: "Split large bundles (code splitting), defer non-critical scripts, and remove unused JS.",
      },
      {
        id: "r6",
        docId: "color-contrast",
        category: "accessibility",
        severity: "low",
        title: "Low contrast in the footer",
        problem: "Gray footer text has a contrast of 3.9:1, below the WCAG AA requirement (4.5:1).",
        fix: "Lighten the text color or darken the background to reach at least 4.5:1 contrast for body text.",
      },
    ],
    meta: {
      engine: "demo",
      analyzedAt: new Date().toISOString(),
      demo: true,
      notes: ["Sample data (demo mode)."],
    },

    /* Bogate sekcje demo — pokazują nowe panele (CrUX, nagłówki/TLS,
       tech-stack) także w podglądzie dashboardu bez kluczy API. */
    vitals: {
      field: {
        source: "CrUX",
        lcp: { p75: 2600, rating: "needs-improvement" },
        inp: { p75: 180, rating: "good" },
        cls: { p75: 0.08, rating: "good" },
      },
    },
    securityHeaders: [
      { name: "Content-Security-Policy", present: false, severity: "high" },
      { name: "Strict-Transport-Security", present: true, value: "max-age=63072000; includeSubDomains" },
      { name: "X-Frame-Options", present: true, value: "DENY" },
      { name: "X-Content-Type-Options", present: true, value: "nosniff" },
      { name: "Referrer-Policy", present: true, value: "strict-origin-when-cross-origin" },
      { name: "Permissions-Policy", present: false, severity: "low" },
    ],
    tls: {
      protocol: "TLSv1.3",
      issuer: "Let's Encrypt",
      subject: "example.com",
      validTo: "Dec 31 23:59:59 2026 GMT",
      daysToExpiry: 68,
      valid: true,
    },
    techStack: [
      { name: "Next.js", category: "framework", version: "15" },
      { name: "React", category: "framework" },
      { name: "Vercel", category: "hosting" },
      { name: "Cloudflare", category: "cdn" },
      { name: "Google Analytics", category: "analytics" },
    ],
    dns: {
      spf: {
        present: true,
        value: "v=spf1 include:_spf.google.com ~all",
        details: "SPF configured with softfail (~all).",
        status: "good",
      },
      dmarc: {
        present: true,
        value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com",
        details: "Enforced DMARC policy active (p=quarantine).",
        status: "good",
      },
      caa: {
        present: true,
        value: 'issue "letsencrypt.org"',
        details: 'Configured for authorized CAs: issue "letsencrypt.org"',
        status: "good",
      },
      mx: ["aspmx.l.google.com (pri 1)", "alt1.aspmx.l.google.com (pri 5)"],
    },
    cveList: [
      {
        id: "cve-jquery-cve-2020-11022",
        library: "jQuery",
        version: "3.4.1",
        severity: "high",
        title: "Cross-Site Scripting (XSS) via jQuery.htmlPrefilter",
        summary: "Regex used in htmlPrefilter can result in vulnerability to XSS when passing untrusted HTML to jQuery methods.",
        cve: "CVE-2020-11022",
        fixVersion: "3.5.0+",
        link: "https://nvd.nist.gov/vuln/detail/CVE-2020-11022",
      },
    ],
    csp: {
      hasCsp: true,
      score: 70,
      findings: [
        {
          directive: "script-src",
          severity: "high",
          issue: "Contains 'unsafe-inline' which disables CSP protection against injected inline scripts.",
          recommendation: "Use nonces or hashes instead of 'unsafe-inline'.",
        },
      ],
      missingDirectives: ["object-src 'none'", "base-uri 'self'"],
    },
    social: {
      title: "Orbital — Technical Site Audit in Seconds",
      description: "Audit any URL for performance, SEO, accessibility and security in seconds. Deep developer diagnostics without signup.",
      canonicalUrl: "https://example.com/",
      favicon: "https://example.com/favicon.ico",
      og: {
        title: "Orbital — Technical Site Audit in Seconds",
        description: "Audit any URL for performance, SEO, accessibility and security in seconds.",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        siteName: "Orbital Audit",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Orbital — Technical Site Audit in Seconds",
        description: "Audit any URL for performance, SEO, accessibility and security in seconds.",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        site: "@orbital_dev",
      },
    },
    structuredData: [
      {
        type: "Organization",
        name: "Orbital Technologies Inc.",
        raw: {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Orbital Technologies Inc.",
          url: "https://example.com",
          logo: "https://example.com/logo.png",
        },
        valid: true,
        issues: [],
      },
      {
        type: "WebSite",
        name: "Orbital",
        raw: {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Orbital",
          url: "https://example.com",
        },
        valid: true,
        issues: [],
      },
    ],
    crawlerReadiness: {
      robots: {
        found: true,
        disallowAll: false,
        rulesCount: 3,
        sitemapsDeclared: ["https://example.com/sitemap.xml"],
        contentSnippet: "User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml",
      },
      sitemap: {
        found: true,
        url: "https://example.com/sitemap.xml",
        statusCode: 200,
        isXml: true,
      },
    },
    network: [
      {
        url: "https://example.com/",
        resourceType: "document",
        status: 200,
        mimeType: "text/html",
        transferSize: 18450,
        startTime: 0,
        duration: 180,
        domain: "example.com",
        thirdParty: false,
      },
      {
        url: "https://example.com/_next/static/css/app.css",
        resourceType: "stylesheet",
        status: 200,
        mimeType: "text/css",
        transferSize: 42100,
        startTime: 120,
        duration: 160,
        domain: "example.com",
        thirdParty: false,
      },
      {
        url: "https://example.com/_next/static/chunks/main.js",
        resourceType: "script",
        status: 200,
        mimeType: "application/javascript",
        transferSize: 128400,
        startTime: 140,
        duration: 320,
        domain: "example.com",
        thirdParty: false,
      },
      {
        url: "https://example.com/hero-satellite.webp",
        resourceType: "image",
        status: 200,
        mimeType: "image/webp",
        transferSize: 85200,
        startTime: 280,
        duration: 240,
        domain: "example.com",
        thirdParty: false,
      },
      {
        url: "https://www.googletagmanager.com/gtm.js?id=GTM-DEMO",
        resourceType: "script",
        status: 200,
        mimeType: "application/javascript",
        transferSize: 38900,
        startTime: 360,
        duration: 220,
        domain: "googletagmanager.com",
        thirdParty: true,
      },
      {
        url: "https://api.example.com/v1/user/session",
        resourceType: "fetch",
        status: 200,
        mimeType: "application/json",
        transferSize: 1240,
        startTime: 480,
        duration: 110,
        domain: "api.example.com",
        thirdParty: false,
      },
    ],
    budget: {
      budgets: [
        { name: "JavaScript", budgetBytes: 358400, actualBytes: 284500, status: "good", percentUsed: 79 },
        { name: "CSS", budgetBytes: 61440, actualBytes: 42100, status: "good", percentUsed: 69 },
        { name: "Images & Media", budgetBytes: 819200, actualBytes: 745000, status: "warn", percentUsed: 91 },
        { name: "Web Fonts", budgetBytes: 122880, actualBytes: 68400, status: "good", percentUsed: 56 },
        { name: "Total Transfer", budgetBytes: 1536000, actualBytes: 1140000, status: "good", percentUsed: 74 },
      ],
      bloatItems: [
        {
          url: "https://example.com/_next/static/chunks/main.js",
          label: "main.js",
          totalBytes: 128400,
          wastedBytes: 46200,
          wastedPercent: 36,
          type: "script",
        },
        {
          url: "https://www.googletagmanager.com/gtm.js?id=GTM-DEMO",
          label: "gtm.js",
          totalBytes: 38900,
          wastedBytes: 14200,
          wastedPercent: 36,
          type: "script",
        },
        {
          url: "https://example.com/_next/static/css/app.css",
          label: "app.css",
          totalBytes: 42100,
          wastedBytes: 18500,
          wastedPercent: 44,
          type: "stylesheet",
        },
      ],
      totalWastedBytes: 78900,
      potentialTimeSavingsMs: 160,
    },
    thirdParty: {
      entities: [
        {
          entity: "Google Tag Manager",
          category: "Tag Manager",
          transferSize: 38900,
          blockingTimeMs: 45,
          mainThreadTimeMs: 120,
          urlCount: 1,
        },
        {
          entity: "Google Fonts",
          category: "Typography",
          transferSize: 68400,
          blockingTimeMs: 0,
          mainThreadTimeMs: 15,
          urlCount: 2,
        },
      ],
      firstPartyBytes: 1032700,
      thirdPartyBytes: 107300,
      thirdPartyPercent: 9,
      firstPartyMainThreadMs: 200,
      thirdPartyMainThreadMs: 135,
    },
    domHealth: {
      totalElements: 540,
      maxDepth: 14,
      maxChildren: 28,
      status: "good",
      warnings: [
        "DOM structure is optimal and compact (540 elements, depth 14). Low risk of layout thrashing.",
      ],
    },
    consoleIssues: [
      {
        type: "warning",
        message: "Third-party cookie will be blocked in future Chrome versions as part of Privacy Sandbox.",
        source: "gtm.js:14",
        url: "https://www.googletagmanager.com/gtm.js?id=GTM-DEMO",
      },
    ],
  };
}

export { statusFromScore };
