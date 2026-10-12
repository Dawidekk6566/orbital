import type { Recommendation } from "./types";

/* ============================================================
   Ekstrakcja i walidacja metadanych społecznościowych i SERP
   (OpenGraph, Twitter Cards, Google Snippet, Canonical)
   ============================================================ */

export interface SocialMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  favicon?: string;
  og: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
    type?: string;
  };
  twitter: {
    card?: string; // "summary_large_image" | "summary"
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
  };
}

export function extractSocialMetadata(
  html: string,
  pageUrl: string
): {
  metadata: SocialMetadata;
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
      id: `social-rec-${recIdx++}`,
      category: "seo",
      severity,
      title,
      problem,
      fix,
      docId,
    });
  };

  // Helper do wyciągania atrybutów content z tagów meta
  const getMeta = (attr: string, val: string): string | undefined => {
    const re = new RegExp(
      `<meta[^>]+${attr}=["']${val}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${val}["']`,
      "i"
    );
    const m = html.match(re);
    return (m?.[1] ?? m?.[2])?.trim() || undefined;
  };

  // Standard SEO
  const rawTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || "";
  const metaDesc = getMeta("name", "description") || "";
  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)?.[1]?.trim() ||
    undefined;

  // OpenGraph
  const ogTitle = getMeta("property", "og:title") || getMeta("name", "og:title");
  const ogDesc = getMeta("property", "og:description") || getMeta("name", "og:description");
  const ogImage = getMeta("property", "og:image") || getMeta("name", "og:image");
  const ogUrl = getMeta("property", "og:url") || getMeta("name", "og:url");
  const ogSiteName = getMeta("property", "og:site_name") || getMeta("name", "og:site_name");
  const ogType = getMeta("property", "og:type") || getMeta("name", "og:type");

  // Twitter
  const twCard = getMeta("name", "twitter:card") || getMeta("property", "twitter:card");
  const twTitle = getMeta("name", "twitter:title") || getMeta("property", "twitter:title");
  const twDesc = getMeta("name", "twitter:description") || getMeta("property", "twitter:description");
  const twImage = getMeta("name", "twitter:image") || getMeta("property", "twitter:image");
  const twSite = getMeta("name", "twitter:site") || getMeta("property", "twitter:site");
  const twCreator = getMeta("name", "twitter:creator") || getMeta("property", "twitter:creator");

  // Favicon
  const favMatch =
    html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']*)["']/i)?.[1] ||
    "/favicon.ico";

  let fullFavicon = favMatch;
  try {
    fullFavicon = new URL(favMatch, pageUrl).toString();
  } catch {
    // fallback
  }

  // Walidacje
  if (!ogImage && !twImage) {
    pushRec(
      "medium",
      "Missing OpenGraph and Twitter share image (og:image)",
      "When users share this page on Twitter/X, LinkedIn, Discord or Facebook, no preview image will be displayed, severely reducing click-through rate.",
      "Add <meta property='og:image' content='https://.../og-image.jpg'> with a high-resolution 1200x630px image.",
      "seo-og-image"
    );
  } else if (ogImage && !ogImage.startsWith("http")) {
    pushRec(
      "medium",
      "OpenGraph image must be an absolute URL",
      `The og:image tag (${ogImage}) uses a relative path. Many social platforms (Twitter, LinkedIn) fail to resolve relative images.`,
      `Change the og:image content to an absolute URL starting with https://.`
    );
  }

  if (!ogTitle && !twTitle) {
    pushRec(
      "low",
      "Missing og:title tag",
      "The page lacks an explicit OpenGraph title for social media sharing cards.",
      "Add <meta property='og:title' content='...'> in <head>."
    );
  }

  if (!canonical) {
    pushRec(
      "low",
      "Missing canonical URL tag",
      "A canonical tag tells search engines which URL is the master version, preventing duplicate content penalties across tracking params and www/non-www variants.",
      "Add <link rel='canonical' href='https://...'> in <head>."
    );
  }

  return {
    metadata: {
      title: rawTitle || ogTitle || "Page Title",
      description: metaDesc || ogDesc || "No description provided.",
      canonicalUrl: canonical,
      favicon: fullFavicon,
      og: {
        title: ogTitle,
        description: ogDesc,
        image: ogImage,
        url: ogUrl,
        siteName: ogSiteName,
        type: ogType,
      },
      twitter: {
        card: twCard,
        title: twTitle,
        description: twDesc,
        image: twImage,
        site: twSite,
        creator: twCreator,
      },
    },
    recommendations,
  };
}
