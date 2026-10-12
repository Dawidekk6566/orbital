import type { Recommendation } from "./types";

/* ============================================================
   Walidator i ekstraktor danych strukturalnych Schema.org (JSON-LD)
   Weryfikuje poprawność semantyczną encji pod kątem Google Rich Results.
   ============================================================ */

export interface SchemaEntity {
  type: string;
  name?: string;
  raw: Record<string, unknown>;
  valid: boolean;
  issues: string[];
}

export function validateStructuredData(html: string): {
  entities: SchemaEntity[];
  recommendations: Recommendation[];
} {
  const entities: SchemaEntity[] = [];
  const recommendations: Recommendation[] = [];
  let recIdx = 0;

  const pushRec = (
    severity: Recommendation["severity"],
    title: string,
    problem: string,
    fix: string
  ) => {
    recommendations.push({
      id: `schema-rec-${recIdx++}`,
      category: "seo",
      severity,
      title,
      problem,
      fix,
    });
  };

  const scriptRegex = /<script\b[^>]*?type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const rawJson = match[1].trim();
    if (!rawJson) continue;

    try {
      const parsed = JSON.parse(rawJson);
      const items: Array<Record<string, unknown>> = Array.isArray(parsed)
        ? parsed
        : parsed["@graph"] && Array.isArray(parsed["@graph"])
        ? parsed["@graph"]
        : [parsed];

      for (const item of items) {
        if (typeof item !== "object" || !item) continue;

        const type = (item["@type"] as string) || "Unknown";
        const name =
          (item["name"] as string) ||
          (item["headline"] as string) ||
          (item["title"] as string) ||
          undefined;

        const issues: string[] = [];

        // Reguły walidacji dla popularnych encji
        if (type === "Product") {
          if (!item["name"]) issues.push("Missing required 'name' property.");
          if (!item["offers"] && !item["review"]) {
            issues.push("Missing 'offers' or 'review' required for Google rich snippet eligibility.");
          }
        } else if (type === "Article" || type === "NewsArticle" || type === "BlogPosting") {
          if (!item["headline"]) issues.push("Missing required 'headline' property.");
          if (!item["image"]) issues.push("Missing recommended 'image' property.");
          if (!item["datePublished"]) issues.push("Missing recommended 'datePublished' property.");
        } else if (type === "BreadcrumbList") {
          if (!item["itemListElement"] || !Array.isArray(item["itemListElement"])) {
            issues.push("Missing or invalid 'itemListElement' array.");
          }
        } else if (type === "Organization" || type === "LocalBusiness") {
          if (!item["name"]) issues.push("Missing 'name' property.");
          if (!item["url"]) issues.push("Missing recommended 'url' property.");
        }

        const isValid = issues.length === 0;

        entities.push({
          type,
          name,
          raw: item,
          valid: isValid,
          issues,
        });

        if (!isValid) {
          pushRec(
            "medium",
            `Incomplete Schema.org '${type}' metadata`,
            `The structured data for '${type}' has validation issues: ${issues.join("; ")}`,
            `Update your JSON-LD script to include all recommended fields according to Schema.org standards.`
          );
        }
      }
    } catch {
      pushRec(
        "high",
        "Syntax error in JSON-LD structured data",
        "One of the <script type='application/ld+json'> blocks on the page contains invalid JSON syntax and cannot be parsed by search engines.",
        "Check your JSON-LD script for missing quotes, trailing commas or unescaped characters using an online JSON validator."
      );
    }
  }

  if (entities.length === 0) {
    pushRec(
      "low",
      "No Schema.org structured data found",
      "The page does not provide any JSON-LD structured data (such as Organization, WebSite, or BreadcrumbList), missing opportunities for Google Rich Snippets in search results.",
      "Add a basic <script type='application/ld+json'> declaring your Organization or WebSite in the page's <head>."
    );
  }

  return { entities, recommendations };
}
