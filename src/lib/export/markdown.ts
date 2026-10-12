import type { AnalysisReport } from "../analysis/types";
import { getCheckDoc } from "../analysis/checkDocs";

function statusEmoji(status: "good" | "warn" | "bad"): string {
  if (status === "good") return "🟢";
  if (status === "warn") return "🟡";
  return "🔴";
}

function scoreBand(score: number): string {
  if (score >= 90) return "🟢 Good";
  if (score >= 50) return "🟡 Needs Improvement";
  return "🔴 Poor";
}

export function formatReportToMarkdown(report: AnalysisReport): string {
  const lines: string[] = [];
  const targetUrl = report.target.value;
  const analyzedAt = new Date(report.meta.analyzedAt).toUTCString();

  // 1. Header
  lines.push(`# 🛰️ Orbital Technical Audit Report`);
  lines.push(`**Target:** \`${targetUrl}\``);
  lines.push(`**Analyzed At:** ${analyzedAt} (Engine: \`${report.meta.engine}\`)`);
  lines.push(`**Overall Score:** **${report.overallScore}/100** (${scoreBand(report.overallScore)})`);
  lines.push("");

  // 2. Categories Table
  lines.push(`## 📊 Category Scores`);
  lines.push(`| Category | Score | Status | Audits Run |`);
  lines.push(`| :--- | :---: | :---: | :---: |`);
  for (const cat of report.categories) {
    const catName = cat.key.charAt(0).toUpperCase() + cat.key.slice(1);
    lines.push(
      `| **${catName}** | **${cat.score}/100** | ${scoreBand(cat.score)} | ${cat.metrics.length} |`
    );
  }
  lines.push("");

  // 3. Web Vitals Table
  const perfMetrics = report.categories.find((c) => c.key === "performance")?.metrics ?? [];
  const vitals = perfMetrics.filter((m) =>
    ["lcp", "inp", "cls", "fcp", "ttfb", "tbt"].includes(m.id.toLowerCase())
  );

  if (vitals.length > 0) {
    lines.push(`## ⚡ Core Web Vitals (Lab)`);
    lines.push(`| Metric | Value | Rating | Description |`);
    lines.push(`| :--- | :---: | :---: | :--- |`);
    for (const v of vitals) {
      lines.push(
        `| **${v.label}** (\`${v.id.toUpperCase()}\`) | \`${v.value}${v.unit ?? ""}\` | ${statusEmoji(v.status)} ${v.status} | ${v.description ?? "—"} |`
      );
    }
    lines.push("");
  }

  // 4. CrUX Field Data (if available)
  const field = report.vitals?.field;
  if (field && (field.lcp?.p75 != null || field.cls?.p75 != null || field.inp?.p75 != null)) {
    lines.push(`## 👥 Real-World Field Data (Chrome UX Report / CrUX)`);
    lines.push(`| Metric | p75 Real Users | Rating |`);
    lines.push(`| :--- | :---: | :---: |`);
    if (field.lcp?.p75 != null) {
      const val = field.lcp.p75 >= 1000 ? `${(field.lcp.p75 / 1000).toFixed(2)} s` : `${field.lcp.p75} ms`;
      lines.push(`| **Largest Contentful Paint (LCP)** | \`${val}\` | ${field.lcp.rating ?? "—"} |`);
    }
    if (field.cls?.p75 != null) {
      lines.push(`| **Cumulative Layout Shift (CLS)** | \`${field.cls.p75.toFixed(2)}\` | ${field.cls.rating ?? "—"} |`);
    }
    if (field.inp?.p75 != null) {
      lines.push(`| **Interaction to Next Paint (INP)** | \`${field.inp.p75} ms\` | ${field.inp.rating ?? "—"} |`);
    }
    lines.push("");
  }

  // 5. Prioritized Opportunities & Recommendations
  if (report.recommendations.length > 0) {
    lines.push(`## 🛠️ Prioritized Fixes & Opportunities (${report.recommendations.length})`);
    lines.push("");

    for (const rec of report.recommendations) {
      const sevBadge =
        rec.severity === "critical"
          ? "🚨 CRITICAL"
          : rec.severity === "high"
          ? "⚠️ HIGH"
          : rec.severity === "medium"
          ? "🟡 MEDIUM"
          : "ℹ️ LOW";

      lines.push(`### ${sevBadge}: ${rec.title}`);
      lines.push(`*Category:* \`${rec.category}\` | *Severity:* \`${rec.severity}\``);
      lines.push("");
      lines.push(`**Problem:** ${rec.problem}`);
      lines.push("");
      lines.push(`**How to Fix:** ${rec.fix}`);

      const doc = rec.docId ? getCheckDoc(rec.docId) : undefined;
      if (doc?.code?.bad || doc?.code?.good) {
        const lang = doc.code.language ?? "html";
        lines.push("");
        if (doc.code.bad) {
          lines.push(`❌ **Before / Problematic:**`);
          lines.push(`\`\`\`${lang}`);
          lines.push(doc.code.bad);
          lines.push(`\`\`\``);
        }
        if (doc.code.good) {
          lines.push(`✅ **After / Recommended Solution:**`);
          lines.push(`\`\`\`${lang}`);
          lines.push(doc.code.good);
          lines.push(`\`\`\``);
        }
      }

      if (doc?.docsUrl) {
        lines.push(`📖 [Read documentation](${doc.docsUrl})`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // 6. Security Headers & TLS
  const headers = report.securityHeaders ?? [];
  if (headers.length > 0 || report.tls) {
    lines.push(`## 🔒 Security Headers & TLS`);
    if (headers.length > 0) {
      lines.push(`| Header | Status | Configured Value |`);
      lines.push(`| :--- | :---: | :--- |`);
      for (const h of headers) {
        const check = h.present ? "✅ Present" : `❌ Missing (${h.severity ?? "warn"})`;
        lines.push(`| \`${h.name}\` | ${check} | \`${h.value ?? "—"}\` |`);
      }
      lines.push("");
    }
    if (report.tls) {
      lines.push(`### TLS Certificate`);
      lines.push(`- **Protocol:** ${report.tls.protocol ?? "TLS"}`);
      lines.push(`- **Issuer:** ${report.tls.issuer ?? "Unknown"}`);
      lines.push(`- **Valid:** ${report.tls.valid ? "✅ Yes" : "❌ No"}`);
      if (report.tls.daysToExpiry != null) {
        lines.push(`- **Expires in:** ${report.tls.daysToExpiry} days`);
      }
      lines.push("");
    }
  }

  // 6b. DNS Security
  if (report.dns) {
    lines.push(`## 🌐 Domain & DNS Security`);
    lines.push(`| Record | Status | Configured Value / Details |`);
    lines.push(`| :--- | :---: | :--- |`);
    if (report.dns.spf) {
      lines.push(`| **SPF** | ${report.dns.spf.present ? "✅ Present" : "❌ Missing"} | \`${report.dns.spf.value ?? report.dns.spf.details ?? "—"}\` |`);
    }
    if (report.dns.dmarc) {
      lines.push(`| **DMARC** | ${report.dns.dmarc.present ? "✅ Present" : "❌ Missing"} | \`${report.dns.dmarc.value ?? report.dns.dmarc.details ?? "—"}\` |`);
    }
    if (report.dns.caa) {
      lines.push(`| **CAA** | ${report.dns.caa.present ? "✅ Present" : "⚠️ Missing"} | \`${report.dns.caa.value ?? report.dns.caa.details ?? "—"}\` |`);
    }
    lines.push("");
  }

  // 6c. Known Vulnerabilities (CVE)
  if (report.cveList && report.cveList.length > 0) {
    lines.push(`## 🚨 Known Vulnerabilities (${report.cveList.length} CVEs)`);
    for (const cve of report.cveList) {
      lines.push(`- **[${cve.severity.toUpperCase()}] ${cve.cve ?? cve.library}**: ${cve.title} (Detected: \`${cve.library} ${cve.version}\` → Fix: \`${cve.fixVersion ?? "Update"}\`)`);
    }
    lines.push("");
  }

  // 6d. CSP Evaluation
  if (report.csp) {
    lines.push(`## 🛡️ Content Security Policy (Score: ${report.csp.score ?? 0}/100)`);
    if (report.csp.findings && report.csp.findings.length > 0) {
      lines.push(`**Weaknesses Detected:**`);
      for (const f of report.csp.findings) {
        lines.push(`- \`${f.directive}\`: ${f.issue} (*Fix: ${f.recommendation}*)`);
      }
    }
    lines.push("");
  }

  // 7. Tech Stack
  const tech = report.techStack ?? [];
  if (tech.length > 0) {
    lines.push(`## 🧩 Detected Technologies`);
    lines.push(`| Technology | Category | Version |`);
    lines.push(`| :--- | :--- | :--- |`);
    for (const t of tech) {
      lines.push(`| **${t.name}** | ${t.category ?? "other"} | ${t.version ?? "detected"} |`);
    }
    lines.push("");
  }

  // 8. Social & SERP Metadata
  if (report.social) {
    lines.push(`## 📱 Social & Search Metadata`);
    lines.push(`- **Title:** ${report.social.title}`);
    lines.push(`- **Description:** ${report.social.description}`);
    if (report.social.canonicalUrl) lines.push(`- **Canonical:** \`${report.social.canonicalUrl}\``);
    if (report.social.og.image) lines.push(`- **OG Image:** \`${report.social.og.image}\``);
    if (report.social.twitter.card) lines.push(`- **Twitter Card:** \`${report.social.twitter.card}\``);
    lines.push("");
  }

  // 9. Structured Data (Schema.org)
  if (report.structuredData && report.structuredData.length > 0) {
    lines.push(`## 🏷️ Structured Data (Schema.org - ${report.structuredData.length} items)`);
    for (const s of report.structuredData) {
      const statusIcon = s.valid ? "✅ Valid" : `⚠️ Issues (${s.issues.join(", ")})`;
      lines.push(`- **@${s.type}** ${s.name ? `("${s.name}")` : ""}: ${statusIcon}`);
    }
    lines.push("");
  }

  // 10. Crawler Readiness
  if (report.crawlerReadiness) {
    lines.push(`## 🤖 Crawler Readiness (Robots & Sitemap)`);
    lines.push(`- **robots.txt:** ${report.crawlerReadiness.robots.found ? "✅ Found" : "❌ Missing"}${report.crawlerReadiness.robots.disallowAll ? " 🚨 (BLOCKING ALL CRAWLERS!)" : ""}`);
    lines.push(`- **sitemap.xml:** ${report.crawlerReadiness.sitemap.found ? "✅ Found (HTTP 200)" : "⚠️ Not Found"}`);
    lines.push("");
  }

  // 11. Performance Budget & Code Bloat
  if (report.budget) {
    lines.push(`## ⚖️ Performance Budget & Code Bloat`);
    lines.push(`| Resource | Actual | Budget | Status | Used |`);
    lines.push(`| :--- | :---: | :---: | :---: | :---: |`);
    for (const b of report.budget.budgets) {
      const act = (b.actualBytes / 1024).toFixed(1) + " KB";
      const lim = (b.budgetBytes / 1024).toFixed(1) + " KB";
      const icon = b.status === "good" ? "✅" : b.status === "warn" ? "⚠️" : "❌";
      lines.push(`| **${b.name}** | \`${act}\` | \`${lim}\` | ${icon} | ${b.percentUsed}% |`);
    }
    if (report.budget.totalWastedBytes > 0) {
      lines.push("");
      lines.push(`> 💡 **Potential Savings:** ${(report.budget.totalWastedBytes / 1024).toFixed(1)} KB unused code (~${report.budget.potentialTimeSavingsMs} ms faster load).`);
    }
    lines.push("");
  }

  // 12. Third-Party Scripts
  if (report.thirdParty && report.thirdParty.entities.length > 0) {
    lines.push(`## 🌐 Third-Party Impact Breakdown`);
    lines.push(`- **First-Party Code:** ${(report.thirdParty.firstPartyBytes / 1024).toFixed(1)} KB (${100 - report.thirdParty.thirdPartyPercent}%)`);
    lines.push(`- **Third-Party Scripts:** ${(report.thirdParty.thirdPartyBytes / 1024).toFixed(1)} KB (${report.thirdParty.thirdPartyPercent}%) | **CPU Load:** ${report.thirdParty.thirdPartyMainThreadMs} ms`);
    lines.push(`| Provider | Category | Size | CPU Time |`);
    lines.push(`| :--- | :--- | :---: | :---: |`);
    for (const e of report.thirdParty.entities) {
      lines.push(`| **${e.entity}** | ${e.category} | ${(e.transferSize / 1024).toFixed(1)} KB | ${e.mainThreadTimeMs} ms |`);
    }
    lines.push("");
  }

  // 13. DOM Tree Health
  if (report.domHealth) {
    lines.push(`## 🌳 DOM Tree Health`);
    lines.push(`- **Total DOM Elements:** \`${report.domHealth.totalElements.toLocaleString()}\` (optimal < 800)`);
    lines.push(`- **Maximum Nesting Depth:** \`${report.domHealth.maxDepth}\` levels (optimal < 24)`);
    lines.push(`- **Maximum Child Elements:** \`${report.domHealth.maxChildren}\` (optimal < 40)`);
    lines.push("");
  }

  // 14. Footer
  lines.push(`> *Generated by [Orbital Site Audit](https://orbital.dev) — Technical Analysis Engine*`);
  return lines.join("\n");
}
