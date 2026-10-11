import type { Recommendation, SecurityHeader } from "./types";
import type { TlsInfo } from "./renderArtifact";

/* ============================================================
   Security analyzer (no browser): evaluates HTTP response security
   headers and the TLS certificate/config. Returns the informational
   `securityHeaders[]` panel + recommendations (merged into the
   report's shared list). Each recommendation carries a `docId` so the
   UI pulls the full description + before/after code from checkDocs.
   ============================================================ */

interface HeaderSpec {
  name: string; // panel label
  key: string; // header name (lowercase)
  docId: string; // checkDocs key
  severity: Recommendation["severity"];
  /** Alternative header that also satisfies the requirement (e.g. CSP frame-ancestors). */
  altSatisfied?: (headers: Record<string, string>) => boolean;
}

const HEADER_SPECS: HeaderSpec[] = [
  { name: "Content-Security-Policy", key: "content-security-policy", docId: "header-csp", severity: "high" },
  { name: "Strict-Transport-Security", key: "strict-transport-security", docId: "header-hsts", severity: "medium" },
  {
    name: "X-Frame-Options",
    key: "x-frame-options",
    docId: "header-xfo",
    severity: "medium",
    altSatisfied: (h) => /frame-ancestors/i.test(h["content-security-policy"] ?? ""),
  },
  { name: "X-Content-Type-Options", key: "x-content-type-options", docId: "header-xcto", severity: "low" },
  { name: "Referrer-Policy", key: "referrer-policy", docId: "header-referrer", severity: "low" },
  { name: "Permissions-Policy", key: "permissions-policy", docId: "header-permissions", severity: "low" },
];

export interface SecurityResult {
  securityHeaders: SecurityHeader[];
  tls?: TlsInfo;
  recommendations: Recommendation[];
}

/** Evaluate headers + TLS. `finalUrl` is used for the HTTPS check. */
export function analyzeSecurity(
  headers: Record<string, string>,
  finalUrl: string,
  tls?: TlsInfo,
): SecurityResult {
  const securityHeaders: SecurityHeader[] = [];
  const recommendations: Recommendation[] = [];
  let i = 0;
  const push = (
    severity: Recommendation["severity"],
    title: string,
    problem: string,
    fix: string,
    docId: string,
  ) =>
    recommendations.push({
      id: `sec-${i++}`,
      category: "security",
      severity,
      title,
      problem,
      fix,
      docId,
    });

  // HTTPS
  const isHttps = (() => {
    try {
      return new URL(finalUrl).protocol === "https:";
    } catch {
      return false;
    }
  })();
  if (!isHttps) {
    push(
      "critical",
      "Not served over HTTPS",
      "The page is served over unencrypted HTTP, so traffic can be read and tampered with in transit.",
      "Install a TLS certificate and redirect all http:// traffic to https://.",
      "is-on-https",
    );
  }

  // Security headers
  for (const spec of HEADER_SPECS) {
    const value = headers[spec.key];
    const present = Boolean(value) || Boolean(spec.altSatisfied?.(headers));
    securityHeaders.push({
      name: spec.name,
      present,
      value: value || undefined,
      severity: present ? undefined : spec.severity,
    });
    if (!present) {
      push(
        spec.severity,
        `Missing ${spec.name} header`,
        `The ${spec.name} security header is not set on the response.`,
        `Add the ${spec.name} header — see the example below.`,
        spec.docId,
      );
    }
  }

  // TLS / certificate
  if (isHttps && tls) {
    if (tls.valid === false) {
      push(
        "high",
        "Invalid TLS certificate",
        "The certificate chain did not validate (expired, untrusted, or not matching the domain).",
        "Install a valid certificate from a trusted CA (e.g. Let's Encrypt) that covers this domain.",
        "tls-invalid",
      );
    } else if (typeof tls.daysToExpiry === "number" && tls.daysToExpiry <= 21) {
      push(
        tls.daysToExpiry <= 7 ? "high" : "medium",
        "TLS certificate expiring soon",
        `The certificate expires in ${tls.daysToExpiry} days — once it lapses the site stops loading.`,
        "Set up automatic certificate renewal (e.g. ACME / Let's Encrypt).",
        "tls-expiry",
      );
    }
  }

  return { securityHeaders, tls, recommendations };
}
