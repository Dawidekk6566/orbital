import type { TechEntry, CveEntry, Recommendation } from "./types";

/* ============================================================
   Baza znanych podatności CVE dla popularnych bibliotek i serwerów.
   Wzorowana na katalogu Retire.js / OSV / NVD.
   Sprawdza wykryte wersje z analizy techStack i zgłasza realne luki.
   ============================================================ */

interface KnownVulnerability {
  library: string;
  maxVulnerableVersion: string; // semver poniżej lub równe
  minVulnerableVersion?: string;
  cve: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  summary: string;
  fixVersion: string;
  link: string;
}

const KNOWN_VULNERABILITIES: KnownVulnerability[] = [
  {
    library: "jQuery",
    maxVulnerableVersion: "3.4.99",
    cve: "CVE-2020-11022",
    severity: "high",
    title: "Cross-Site Scripting (XSS) via jQuery.htmlPrefilter",
    summary:
      "Regex used in htmlPrefilter can result in vulnerability to cross-site scripting when passing HTML from untrusted sources to jQuery manipulation methods.",
    fixVersion: "3.5.0+",
    link: "https://nvd.nist.gov/vuln/detail/CVE-2020-11022",
  },
  {
    library: "jQuery",
    maxVulnerableVersion: "2.9.99",
    cve: "CVE-2015-9251",
    severity: "medium",
    title: "XSS in jQuery.ajax() with dataType 'script'",
    summary:
      "Cross-site scripting vulnerability allows remote attackers to inject arbitrary JavaScript via cross-domain Ajax requests.",
    fixVersion: "3.0.0+",
    link: "https://nvd.nist.gov/vuln/detail/CVE-2015-9251",
  },
  {
    library: "WordPress",
    maxVulnerableVersion: "6.2.99",
    cve: "CVE-2023-38000",
    severity: "critical",
    title: "Multiple Core Vulnerabilities in WordPress < 6.3",
    summary:
      "WordPress versions prior to 6.3 are susceptible to unauthenticated cache poisoning, stored XSS in navigation blocks, and privilege escalation.",
    fixVersion: "6.4+",
    link: "https://wordpress.org/news/category/security/",
  },
  {
    library: "Apache",
    maxVulnerableVersion: "2.4.49",
    cve: "CVE-2021-41773",
    severity: "critical",
    title: "Path Traversal and Remote Code Execution in Apache HTTP Server",
    summary:
      "A flaw was found in a change made to path normalization in Apache HTTP Server 2.4.49 allowing attackers to map URLs to files outside the document root.",
    fixVersion: "2.4.51+",
    link: "https://nvd.nist.gov/vuln/detail/CVE-2021-41773",
  },
  {
    library: "PHP",
    maxVulnerableVersion: "7.4.99",
    cve: "CVE-2022-31629",
    severity: "critical",
    title: "PHP 7.x End-of-Life & Multiple Unpatched CVEs",
    summary:
      "PHP 7.4 reached official End-of-Life in November 2022 and no longer receives security fixes for known remote vulnerabilities.",
    fixVersion: "8.2+",
    link: "https://www.php.net/supported-versions.php",
  },
  {
    library: "Nginx",
    maxVulnerableVersion: "1.20.0",
    cve: "CVE-2021-23017",
    severity: "high",
    title: "1-byte memory overwrite in resolver",
    summary:
      "A security issue in nginx resolver allows an unauthenticated remote attacker to cause 1-byte memory overwrite.",
    fixVersion: "1.20.1+",
    link: "https://nvd.nist.gov/vuln/detail/CVE-2021-23017",
  },
];

function parseSemver(v: string): number[] {
  return v
    .replace(/^v/i, "")
    .split(".")
    .map((num) => parseInt(num, 10) || 0);
}

function compareSemver(a: string, b: string): number {
  const pA = parseSemver(a);
  const pB = parseSemver(b);
  for (let i = 0; i < Math.max(pA.length, pB.length); i++) {
    const numA = pA[i] ?? 0;
    const numB = pB[i] ?? 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

export function scanTechStackCve(techStack: TechEntry[]): {
  cveList: CveEntry[];
  recommendations: Recommendation[];
} {
  const cveList: CveEntry[] = [];
  const recommendations: Recommendation[] = [];
  let recIdx = 0;

  for (const tech of techStack) {
    if (!tech.version) continue;

    const matches = KNOWN_VULNERABILITIES.filter(
      (v) =>
        v.library.toLowerCase() === tech.name.toLowerCase() &&
        compareSemver(tech.version!, v.maxVulnerableVersion) <= 0
    );

    for (const match of matches) {
      const id = `cve-${tech.name}-${match.cve}`.toLowerCase();
      cveList.push({
        id,
        library: tech.name,
        version: tech.version,
        severity: match.severity,
        title: match.title,
        summary: match.summary,
        cve: match.cve,
        fixVersion: match.fixVersion,
        link: match.link,
      });

      recommendations.push({
        id: `cve-rec-${recIdx++}`,
        category: "security",
        severity: match.severity,
        title: `Vulnerable ${tech.name} ${tech.version} (${match.cve})`,
        problem: `${tech.name} version ${tech.version} contains a known security flaw (${match.cve}): ${match.summary}`,
        fix: `Upgrade ${tech.name} to version ${match.fixVersion} or newer to remediate this vulnerability.`,
      });
    }
  }

  return { cveList, recommendations };
}
