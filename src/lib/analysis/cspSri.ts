import type { CspEvaluation, SriCheck, Recommendation } from "./types";

/* ============================================================
   Ewaluator CSP (Content-Security-Policy) oraz audyt SRI (Subresource Integrity)
   Sprawdza odporność strony na XSS, clickjacking i ataki na łańcuch dostaw (supply chain).
   ============================================================ */

export function evaluateCspAndSri(
  headers: Record<string, string>,
  html: string | null,
  pageUrl: string
): {
  csp: CspEvaluation;
  sri: SriCheck[];
  recommendations: Recommendation[];
} {
  const recommendations: Recommendation[] = [];
  let recIdx = 0;

  const pushRec = (
    severity: Recommendation["severity"],
    title: string,
    problem: string,
    fix: string,
    docId?: string
  ) => {
    recommendations.push({
      id: `csp-sri-${recIdx++}`,
      category: "security",
      severity,
      title,
      problem,
      fix,
      docId,
    });
  };

  // 1. Analiza CSP
  const cspHeader = headers["content-security-policy"] || "";
  const hasCsp = Boolean(cspHeader.trim());
  const findings: NonNullable<CspEvaluation["findings"]> = [];
  const missingDirectives: string[] = [];

  let cspScore = 100;

  if (!hasCsp) {
    cspScore = 0;
    pushRec(
      "high",
      "Missing Content-Security-Policy (CSP)",
      "The page does not define a Content-Security-Policy HTTP header, leaving it defenseless against Cross-Site Scripting (XSS) and code injection.",
      "Configure a strict CSP header: Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';",
      "header-csp"
    );
  } else {
    const lower = cspHeader.toLowerCase();

    // Check unsafe-inline
    if (lower.includes("'unsafe-inline'")) {
      cspScore -= 30;
      findings.push({
        directive: "script-src / style-src",
        severity: "high",
        issue: "Contains 'unsafe-inline' which disables CSP protection against injected inline scripts.",
        recommendation: "Use nonces (e.g. 'nonce-rAnd0m') or SHA hashes instead of 'unsafe-inline'.",
      });
      pushRec(
        "high",
        "CSP contains 'unsafe-inline'",
        "The Content-Security-Policy header allows 'unsafe-inline' scripts, defeating key defenses against XSS.",
        "Remove 'unsafe-inline' and migrate inline scripts to nonces or external files."
      );
    }

    // Check unsafe-eval
    if (lower.includes("'unsafe-eval'")) {
      cspScore -= 20;
      findings.push({
        directive: "script-src",
        severity: "medium",
        issue: "Allows 'unsafe-eval', permitting eval(), setTimeout(string) and new Function().",
        recommendation: "Refactor code to avoid dynamic code evaluation.",
      });
    }

    // Check missing object-src 'none'
    if (!lower.includes("object-src")) {
      cspScore -= 10;
      missingDirectives.push("object-src 'none'");
    }

    // Check missing base-uri
    if (!lower.includes("base-uri")) {
      cspScore -= 10;
      missingDirectives.push("base-uri 'self'");
    }

    // Check missing frame-ancestors
    if (!lower.includes("frame-ancestors") && !headers["x-frame-options"]) {
      cspScore -= 15;
      missingDirectives.push("frame-ancestors 'none' (or 'self')");
    }

    cspScore = Math.max(0, cspScore);
  }

  // 2. Analiza SRI (Subresource Integrity)
  const sriChecks: SriCheck[] = [];
  if (html) {
    let pageOrigin = "";
    try {
      pageOrigin = new URL(pageUrl).origin;
    } catch {
      // fallback
    }

    // Wyszukaj skrypty z src
    const scriptRegex = /<script\b([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    let match: RegExpExecArray | null;
    while ((match = scriptRegex.exec(html)) !== null) {
      const fullAttrs = `${match[1]} ${match[3]}`;
      const src = match[2];
      const hasIntegrity = /integrity=["'][^"']+["']/i.test(fullAttrs);

      let isThirdParty = false;
      try {
        const u = new URL(src, pageUrl);
        isThirdParty = pageOrigin ? u.origin !== pageOrigin : /^https?:\/\//i.test(src);
      } catch {
        isThirdParty = /^https?:\/\//i.test(src);
      }

      sriChecks.push({
        url: src,
        hasIntegrity,
        isThirdParty,
        tag: "script",
      });
    }

    // Wyszukaj style CSS z href
    const linkRegex = /<link\b([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi;
    while ((match = linkRegex.exec(html)) !== null) {
      const fullAttrs = `${match[1]} ${match[3]}`;
      if (!/rel=["']stylesheet["']/i.test(fullAttrs)) continue;
      const href = match[2];
      const hasIntegrity = /integrity=["'][^"']+["']/i.test(fullAttrs);

      let isThirdParty = false;
      try {
        const u = new URL(href, pageUrl);
        isThirdParty = pageOrigin ? u.origin !== pageOrigin : /^https?:\/\//i.test(href);
      } catch {
        isThirdParty = /^https?:\/\//i.test(href);
      }

      sriChecks.push({
        url: href,
        hasIntegrity,
        isThirdParty,
        tag: "stylesheet",
      });
    }

    const unverifiedCdnResources = sriChecks.filter(
      (s) => s.isThirdParty && !s.hasIntegrity && (s.url.includes("cdn.") || s.url.includes("cdnjs") || s.url.includes("jsdelivr") || s.url.includes("unpkg"))
    );

    if (unverifiedCdnResources.length > 0) {
      pushRec(
        "medium",
        `Missing Subresource Integrity (SRI) on ${unverifiedCdnResources.length} CDN asset(s)`,
        `External scripts or stylesheets from public CDNs (${unverifiedCdnResources[0]?.url}) are loaded without cryptographic hashes (integrity attribute). If the CDN is compromised, malicious code could run on your site.`,
        "Add integrity='sha384-...' and crossorigin='anonymous' to all third-party CDN script and stylesheet tags."
      );
    }
  }

  return {
    csp: {
      hasCsp,
      score: hasCsp ? cspScore : 0,
      findings: findings.length > 0 ? findings : undefined,
      missingDirectives: missingDirectives.length > 0 ? missingDirectives : undefined,
    },
    sri: sriChecks,
    recommendations,
  };
}
