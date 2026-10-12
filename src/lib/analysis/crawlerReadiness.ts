import type { Recommendation } from "./types";

/* ============================================================
   Weryfikacja gotowości do indeksowania (Crawler Readiness)
   Parsuje robots.txt oraz sprawdza dostępność sitemap.xml.
   ============================================================ */

export interface CrawlerReadiness {
  robots: {
    found: boolean;
    disallowAll: boolean;
    rulesCount: number;
    sitemapsDeclared: string[];
    contentSnippet?: string;
  };
  sitemap: {
    found: boolean;
    url?: string;
    statusCode?: number;
    isXml?: boolean;
  };
}

export async function checkCrawlerReadiness(pageUrl: string): Promise<{
  crawler: CrawlerReadiness;
  recommendations: Recommendation[];
}> {
  const recommendations: Recommendation[] = [];
  let recIdx = 0;

  const pushRec = (
    severity: Recommendation["severity"],
    title: string,
    problem: string,
    fix: string
  ) => {
    recommendations.push({
      id: `crawler-rec-${recIdx++}`,
      category: "seo",
      severity,
      title,
      problem,
      fix,
    });
  };

  let origin = "";
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return {
      crawler: {
        robots: { found: false, disallowAll: false, rulesCount: 0, sitemapsDeclared: [] },
        sitemap: { found: false },
      },
      recommendations: [],
    };
  }

  // 1. Pobierz robots.txt
  let robotsFound = false;
  let disallowAll = false;
  let rulesCount = 0;
  const sitemapsDeclared: string[] = [];
  let snippet: string | undefined;

  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "OrbitalSiteAudit/1.0" },
    });

    if (robotsRes.ok) {
      robotsFound = true;
      const text = await robotsRes.text();
      snippet = text.slice(0, 500);

      const lines = text.split("\n").map((l) => l.trim());
      let currentAgent = "";

      for (const line of lines) {
        if (!line || line.startsWith("#")) continue;

        if (/^User-agent:\s*(.*)/i.test(line)) {
          currentAgent = line.split(":")[1]?.trim() || "";
        } else if (/^Disallow:\s*(.*)/i.test(line)) {
          rulesCount++;
          const path = line.split(":")[1]?.trim() || "";
          if ((currentAgent === "*" || !currentAgent) && path === "/") {
            disallowAll = true;
          }
        } else if (/^Sitemap:\s*(.*)/i.test(line)) {
          const sUrl = line.slice(8).trim();
          if (sUrl && !sitemapsDeclared.includes(sUrl)) {
            sitemapsDeclared.push(sUrl);
          }
        }
      }
    }
  } catch {
    // Timeout lub błąd sieci
  }

  if (disallowAll) {
    pushRec(
      "critical",
      "robots.txt is blocking all search engines (Disallow: /)",
      `Your /robots.txt contains 'Disallow: /' for all user-agents, completely preventing Google, Bing and other search engines from indexing the site.`,
      `If this is a production website, remove 'Disallow: /' from ${origin}/robots.txt.`
    );
  }

  if (!robotsFound) {
    pushRec(
      "low",
      "Missing robots.txt file",
      `No /robots.txt file was found at ${origin}/robots.txt. While not strictly required, robots.txt helps manage crawler crawl budgets and declare sitemaps.`,
      `Create a simple robots.txt file in your public root with 'User-agent: * Allow: /' and a reference to your sitemap.`
    );
  }

  // 2. Sprawdź sitemap.xml
  const sitemapTarget = sitemapsDeclared[0] || `${origin}/sitemap.xml`;
  let sitemapFound = false;
  let sitemapStatusCode: number | undefined;
  let isXml = false;

  try {
    const sitemapRes = await fetch(sitemapTarget, {
      method: "HEAD",
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "OrbitalSiteAudit/1.0" },
    });

    sitemapStatusCode = sitemapRes.status;
    if (sitemapRes.ok) {
      sitemapFound = true;
      const cType = sitemapRes.headers.get("content-type") || "";
      isXml = cType.includes("xml") || sitemapTarget.endsWith(".xml");
    }
  } catch {
    // Timeout
  }

  if (!sitemapFound && sitemapsDeclared.length === 0) {
    pushRec(
      "medium",
      "Missing XML Sitemap (sitemap.xml)",
      `No XML sitemap was declared in robots.txt or found at ${origin}/sitemap.xml. An XML sitemap accelerates indexing of newly published pages.`,
      `Generate a sitemap.xml for your website and declare it at the bottom of your robots.txt: 'Sitemap: ${origin}/sitemap.xml'.`
    );
  }

  return {
    crawler: {
      robots: {
        found: robotsFound,
        disallowAll,
        rulesCount,
        sitemapsDeclared,
        contentSnippet: snippet,
      },
      sitemap: {
        found: sitemapFound,
        url: sitemapTarget,
        statusCode: sitemapStatusCode,
        isXml,
      },
    },
    recommendations,
  };
}
