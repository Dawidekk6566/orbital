#!/usr/bin/env node

/* ============================================================
   Orbital Audit CLI — npx orbital-audit <url>
   Deweloperskie narzędzie konsolowe do audytu stron z poziomu terminala,
   skryptów npm i pipeline'ów CI/CD.
   ============================================================ */

import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";

const HELP = `
🛰️  Orbital Audit CLI — Technical Site Auditor

Usage:
  npx orbital-audit <url> [options]

Arguments:
  <url>                 Target URL to analyze (e.g. https://example.com)

Options:
  --format <type>       Output format: table (default), json, markdown
  --fail-under <score>  Exit with code 1 if overall score is below threshold (e.g. 90)
  --output <file>       Save report output to a file
  --api-url <url>       Orbital server URL (default: http://localhost:3000 or env ORBITAL_API_URL)
  --api-key <key>       API key (orb_...) for authenticated project audits
  --help, -h            Show this help message

Examples:
  npx orbital-audit https://my-site.dev
  npx orbital-audit https://staging.example.com --fail-under 85
  npx orbital-audit https://example.com --format markdown --output report.md
`;

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      format: { type: "string", default: "table" },
      "fail-under": { type: "string" },
      output: { type: "string" },
      "api-url": { type: "string" },
      "api-key": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(HELP);
    process.exit(0);
  }

  let targetUrl = positionals[0].trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  const apiUrl =
    values["api-url"] ||
    process.env.ORBITAL_API_URL ||
    "http://localhost:3000";

  const apiKey = values["api-key"] || process.env.ORBITAL_API_KEY;

  console.log(`\x1b[36m🛰️  Orbital Audit\x1b[0m analyzing \x1b[1m${targetUrl}\x1b[0m...`);

  let report;
  try {
    const endpoint = apiKey
      ? `${apiUrl.replace(/\/$/, "")}/api/v1/audits`
      : `${apiUrl.replace(/\/$/, "")}/api/analyze`;

    const headers = {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ mode: "url", url: targetUrl }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`\x1b[31mError (${res.status}):\x1b[0m ${errBody}`);
      process.exit(1);
    }

    report = await res.json();
  } catch (err) {
    console.error(`\x1b[31mFailed to connect to Orbital API at ${apiUrl}:\x1b[0m ${err.message}`);
    console.error(`\x1b[33mHint:\x1b[0m Ensure the Orbital server is running (e.g. 'npm run dev' or 'npm start'), or specify an endpoint via --api-url <url> / ORBITAL_API_URL.`);
    process.exit(1);
  }

  const score = report.overallScore ?? 0;
  const scoreColor =
    score >= 90 ? "\x1b[32m" : score >= 50 ? "\x1b[33m" : "\x1b[31m";

  // 1. Format: JSON
  if (values.format === "json") {
    const jsonStr = JSON.stringify(report, null, 2);
    if (values.output) {
      writeFileSync(values.output, jsonStr, "utf-8");
      console.log(`Report saved to ${values.output}`);
    } else {
      console.log(jsonStr);
    }
  }

  // 2. Format: Markdown
  else if (values.format === "markdown") {
    const md = [
      `# 🛰️ Orbital Audit Report: ${targetUrl}`,
      `**Overall Score:** ${score}/100`,
      "",
      `| Category | Score |`,
      `| :--- | :---: |`,
      ...(report.categories || []).map(
        (c) => `| ${c.key} | ${c.score}/100 |`
      ),
      "",
      `### Top Findings (${(report.recommendations || []).length}):`,
      ...(report.recommendations || []).slice(0, 5).map(
        (r) => `- **[${r.severity.toUpperCase()}]** ${r.title}: ${r.fix}`
      ),
    ].join("\n");

    if (values.output) {
      writeFileSync(values.output, md, "utf-8");
      console.log(`Report saved to ${values.output}`);
    } else {
      console.log(md);
    }
  }

  // 3. Format: Table (default terminal view)
  else {
    console.log(`\n--------------------------------------------------`);
    console.log(`  OVERALL SCORE: ${scoreColor}\x1b[1m${score} / 100\x1b[0m`);
    console.log(`--------------------------------------------------`);

    console.log(`\n\x1b[1mCategories:\x1b[0m`);
    for (const cat of report.categories || []) {
      const cScore = cat.score;
      const cCol =
        cScore >= 90 ? "\x1b[32m" : cScore >= 50 ? "\x1b[33m" : "\x1b[31m";
      const padCat = (cat.key.toUpperCase() + "             ").slice(0, 15);
      console.log(`  • ${padCat} ${cCol}\x1b[1m${cScore}/100\x1b[0m`);
    }

    if (report.budget) {
      console.log(`\n\x1b[1mPerformance Budget:\x1b[0m`);
      for (const b of report.budget.budgets || []) {
        const bCol = b.status === "good" ? "\x1b[32m" : b.status === "warn" ? "\x1b[33m" : "\x1b[31m";
        const padName = (b.name + "                ").slice(0, 16);
        console.log(`  • ${padName} ${(b.actualBytes / 1024).toFixed(1)} KB / ${(b.budgetBytes / 1024).toFixed(1)} KB (${bCol}${b.percentUsed}%\x1b[0m)`);
      }
    }

    if (report.recommendations && report.recommendations.length > 0) {
      console.log(`\n\x1b[1mTop Opportunities (${report.recommendations.length}):\x1b[0m`);
      for (const rec of report.recommendations.slice(0, 6)) {
        const sCol =
          rec.severity === "critical" || rec.severity === "high"
            ? "\x1b[31m"
            : rec.severity === "medium"
            ? "\x1b[33m"
            : "\x1b[36m";
        console.log(`  ${sCol}[${rec.severity.toUpperCase()}]\x1b[0m ${rec.title}`);
        console.log(`     → \x1b[90m${rec.fix}\x1b[0m`);
      }
    }

    console.log(`\n--------------------------------------------------\n`);

    if (values.output) {
      writeFileSync(values.output, JSON.stringify(report, null, 2), "utf-8");
      console.log(`Report JSON saved to ${values.output}`);
    }
  }

  // CI/CD Quality Gate check
  if (values["fail-under"]) {
    const threshold = parseInt(values["fail-under"], 10);
    if (!isNaN(threshold) && score < threshold) {
      console.error(
        `\x1b[31m❌ QUALITY GATE FAILED:\x1b[0m Score ${score} is below threshold ${threshold}.`
      );
      process.exit(1);
    } else {
      console.log(
        `\x1b[32m✓ Quality gate passed:\x1b[0m Score ${score} >= ${threshold}.`
      );
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
