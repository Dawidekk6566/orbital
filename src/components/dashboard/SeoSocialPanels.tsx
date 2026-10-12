"use client";

import { useState } from "react";
import type { SocialMetadata, SchemaEntity, CrawlerReadiness } from "@/lib/analysis/types";

export function SocialPreviewSimulator({
  social,
  url,
}: {
  social: SocialMetadata;
  url: string;
}) {
  const [platform, setPlatform] = useState<"google" | "twitter" | "facebook">("google");

  let domain = "example.com";
  try {
    domain = new URL(url).hostname;
  } catch {
    // fallback
  }

  const title = social.og.title || social.title || "Page Title";
  const desc = social.og.description || social.description || "Description preview.";
  const image = social.og.image || social.twitter.image;

  return (
    <div className="rounded-[8px] border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h3 className="font-mono text-[12.5px] uppercase tracking-[0.05em] text-muted">
            Live Social &amp; SERP Simulator
          </h3>
          <p className="text-[13px] text-gray-1">
            How this page renders when shared or discovered in search.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-line p-[2px]">
          <button
            type="button"
            onClick={() => setPlatform("google")}
            className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors ${
              platform === "google" ? "bg-ink text-white" : "text-gray-1 hover:text-ink"
            }`}
          >
            Google SERP
          </button>
          <button
            type="button"
            onClick={() => setPlatform("twitter")}
            className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors ${
              platform === "twitter" ? "bg-ink text-white" : "text-gray-1 hover:text-ink"
            }`}
          >
            X / Twitter
          </button>
          <button
            type="button"
            onClick={() => setPlatform("facebook")}
            className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors ${
              platform === "facebook" ? "bg-ink text-white" : "text-gray-1 hover:text-ink"
            }`}
          >
            OpenGraph
          </button>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        {/* Google SERP Preview */}
        {platform === "google" && (
          <div className="w-full max-w-[650px] rounded-[10px] border border-line bg-white p-4 shadow-sm font-sans">
            <div className="flex items-center gap-3">
              {social.favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={social.favicon}
                  alt="Favicon"
                  className="h-6 w-6 rounded-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-line" />
              )}
              <div className="flex flex-col text-[13px] leading-tight">
                <span className="font-medium text-ink">{social.og.siteName || domain}</span>
                <span className="text-[11.5px] text-muted truncate max-w-[400px]">{url}</span>
              </div>
            </div>
            <h4 className="mt-2 text-[18px] font-medium text-[#1a0dab] hover:underline cursor-pointer dark:text-[#8ab4f8] leading-snug">
              {title}
            </h4>
            <p className="mt-1 text-[13.5px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
              {desc}
            </p>
          </div>
        )}

        {/* X / Twitter Large Card */}
        {platform === "twitter" && (
          <div className="w-full max-w-[500px] overflow-hidden rounded-[14px] border border-line bg-white shadow-sm">
            {image ? (
              <div className="relative aspect-[1.91/1] w-full bg-bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Twitter card preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-bg-soft text-[12px] text-muted">
                No share image (og:image / twitter:image) found
              </div>
            )}
            <div className="p-3.5 bg-bg-soft/50">
              <span className="font-mono text-[11px] text-muted truncate block">{domain}</span>
              <h4 className="mt-0.5 text-[14px] font-semibold text-ink line-clamp-1">{title}</h4>
              <p className="mt-0.5 text-[12.5px] text-gray-1 line-clamp-2">{desc}</p>
            </div>
          </div>
        )}

        {/* Facebook / OpenGraph Card */}
        {platform === "facebook" && (
          <div className="w-full max-w-[500px] overflow-hidden rounded-[8px] border border-line bg-[#f0f2f5] dark:bg-[#242526] shadow-sm">
            {image ? (
              <div className="relative aspect-[1.91/1] w-full bg-bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="OpenGraph preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-bg-soft text-[12px] text-muted">
                Missing og:image
              </div>
            )}
            <div className="p-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-muted block">
                {domain}
              </span>
              <h4 className="mt-1 text-[15px] font-bold text-ink line-clamp-1">{title}</h4>
              <p className="mt-0.5 text-[12.5px] text-gray-1 line-clamp-2">{desc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StructuredDataPanel({
  entities,
}: {
  entities: SchemaEntity[];
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (entities.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-line bg-bg-soft p-8 text-center text-[13px] text-muted">
        No Schema.org (JSON-LD) structured data detected on this page.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entities.map((entity, idx) => {
        const isOpen = openIdx === idx;

        return (
          <div
            key={idx}
            className="rounded-[8px] border border-line bg-white p-4 transition-colors hover:border-line-strong"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[12px] font-semibold text-ink">
                  @{entity.type}
                </span>
                {entity.name && (
                  <span className="text-[13.5px] font-medium text-ink truncate max-w-[300px]">
                    {entity.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${
                    entity.valid
                      ? "border-good-line bg-good-soft text-good"
                      : "border-warn-line bg-warn-soft text-warn"
                  }`}
                >
                  {entity.valid ? "Valid Schema" : "Warnings"}
                </span>

                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="font-mono text-[12px] text-gray-1 underline hover:text-ink"
                >
                  {isOpen ? "Hide JSON" : "Inspect JSON"}
                </button>
              </div>
            </div>

            {entity.issues.length > 0 && (
              <div className="mt-2 text-[12px] text-warn">
                Issues: {entity.issues.join(", ")}
              </div>
            )}

            {isOpen && (
              <pre className="mt-3 max-h-[260px] overflow-x-auto rounded border border-line bg-bg-soft p-3 font-mono text-[11.5px] text-ink">
                {JSON.stringify(entity.raw, null, 2)}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CrawlerReadinessPanel({
  crawler,
}: {
  crawler: CrawlerReadiness;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Robots.txt */}
      <div className="rounded-[8px] border border-line bg-white p-5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.05em] text-muted">
            robots.txt
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${
              crawler.robots.disallowAll
                ? "border-bad-line bg-bad-soft text-bad"
                : crawler.robots.found
                ? "border-good-line bg-good-soft text-good"
                : "border-warn-line bg-warn-soft text-warn"
            }`}
          >
            {crawler.robots.disallowAll
              ? "Blocking All Crawlers!"
              : crawler.robots.found
              ? "Available"
              : "Missing"}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-gray-1">
          <div>
            Rules count: <strong className="text-ink font-mono">{crawler.robots.rulesCount}</strong>
          </div>
          <div>
            Sitemaps declared:{" "}
            <strong className="text-ink font-mono">{crawler.robots.sitemapsDeclared.length}</strong>
          </div>
        </div>

        {crawler.robots.contentSnippet && (
          <pre className="mt-3 max-h-[140px] overflow-x-auto rounded border border-line-2 bg-bg-soft p-2.5 font-mono text-[11px] text-ink">
            {crawler.robots.contentSnippet}
          </pre>
        )}
      </div>

      {/* Sitemap.xml */}
      <div className="rounded-[8px] border border-line bg-white p-5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.05em] text-muted">
            sitemap.xml
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${
              crawler.sitemap.found
                ? "border-good-line bg-good-soft text-good"
                : "border-warn-line bg-warn-soft text-warn"
            }`}
          >
            {crawler.sitemap.found ? "Detected (200 OK)" : "Not Found"}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-gray-1">
          {crawler.sitemap.url && (
            <div className="truncate">
              URL:{" "}
              <a
                href={crawler.sitemap.url}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-ink underline"
              >
                {crawler.sitemap.url}
              </a>
            </div>
          )}
          <div>
            Valid XML format:{" "}
            <strong className="text-ink font-mono">{crawler.sitemap.isXml ? "Yes" : "Unknown"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
