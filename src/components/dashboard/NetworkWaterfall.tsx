"use client";

import { useState, useMemo } from "react";
import type { NetworkEntry } from "@/lib/analysis/types";

function fmtBytes(bytes?: number): string {
  if (bytes == null || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtMs(ms?: number): string {
  if (ms == null) return "—";
  return `${Math.round(ms)} ms`;
}

type FilterType = "all" | "document" | "script" | "stylesheet" | "image" | "font" | "fetch";

export function NetworkWaterfall({
  entries,
  pageUrl,
}: {
  entries: NetworkEntry[];
  pageUrl: string;
}) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  // Stats
  const totalTransfer = useMemo(
    () => entries.reduce((acc, e) => acc + (e.transferSize ?? 0), 0),
    [entries]
  );

  const maxEndTime = useMemo(() => {
    let max = 1000;
    for (const e of entries) {
      const end = (e.startTime ?? 0) + (e.duration ?? 50);
      if (end > max) max = end;
    }
    return max;
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filter !== "all") {
        const type = (e.resourceType ?? "").toLowerCase();
        if (filter === "fetch" && !["xhr", "fetch"].includes(type)) return false;
        if (filter !== "fetch" && type !== filter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!e.url.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, filter, search]);

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "script", label: "JS" },
    { id: "stylesheet", label: "CSS" },
    { id: "image", label: "Img" },
    { id: "font", label: "Font" },
    { id: "fetch", label: "Fetch/XHR" },
    { id: "document", label: "Doc" },
  ];

  return (
    <div className="rounded-[8px] border border-line bg-white p-5">
      {/* Top statistics overview bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-mono text-[12.5px] uppercase tracking-[0.05em] text-muted">
            Network Waterfall &amp; Resource Timeline
          </h3>
          <p className="mt-0.5 text-[13px] text-gray-1">
            Visual breakdown of all assets requested during page load.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-mono text-[12px]">
          <div>
            <span className="text-muted">Requests: </span>
            <strong className="text-ink">{entries.length}</strong>
          </div>
          <div>
            <span className="text-muted">Transfer: </span>
            <strong className="text-ink">{fmtBytes(totalTransfer)}</strong>
          </div>
          <div>
            <span className="text-muted">Duration: </span>
            <strong className="text-ink">{Math.round(maxEndTime)} ms</strong>
          </div>
        </div>
      </div>

      {/* Controls: Search & Category Filter Pills */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-line p-[2px]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 font-mono text-[11.5px] transition-colors ${
                filter === f.id ? "bg-ink text-white" : "text-gray-1 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name / domain..."
            className="w-[200px] rounded-full border border-line bg-bg-soft px-3 py-1 text-[12px] font-mono outline-none transition-colors focus:border-ink"
          />
        </div>
      </div>

      {/* Waterfall Rows Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[12px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.04em] text-muted">
              <th className="py-2 pr-3 font-medium">Name / Asset</th>
              <th className="py-2 px-2 font-medium">Type</th>
              <th className="py-2 px-2 font-medium">Status</th>
              <th className="py-2 px-2 font-medium text-right">Size</th>
              <th className="py-2 px-2 font-medium text-right">Time</th>
              <th className="py-2 pl-4 font-medium min-w-[200px]">Waterfall</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((entry, idx) => {
              const start = entry.startTime ?? 0;
              const dur = entry.duration ?? 40;
              const leftPercent = Math.min(95, Math.max(0, (start / maxEndTime) * 100));
              const widthPercent = Math.max(2, Math.min(100 - leftPercent, (dur / maxEndTime) * 100));

              let pathname = entry.url;
              try {
                const u = new URL(entry.url);
                pathname = u.pathname.split("/").pop() || u.hostname;
                if (!pathname) pathname = u.pathname;
              } catch {
                // fallback
              }

              const isError = (entry.status ?? 200) >= 400;
              const isExpanded = expandedUrl === entry.url;

              return (
                <tr
                  key={idx}
                  onClick={() => setExpandedUrl(isExpanded ? null : entry.url)}
                  className="cursor-pointer border-b border-line-2 hover:bg-bg-soft/70 transition-colors"
                >
                  <td className="py-2 pr-3 max-w-[260px] truncate text-ink font-medium" title={entry.url}>
                    {pathname}
                    {entry.thirdParty ? (
                      <span className="ml-1.5 rounded bg-bg-soft px-1.5 py-0.5 text-[9.5px] text-muted border border-line">
                        3rd
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 px-2 text-muted uppercase text-[10.5px]">
                    {entry.resourceType ?? "other"}
                  </td>
                  <td className={`py-2 px-2 text-[11px] ${isError ? "text-bad font-semibold" : "text-good"}`}>
                    {entry.status ?? 200}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-1 tabular-nums">
                    {fmtBytes(entry.transferSize)}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-1 tabular-nums">
                    {fmtMs(entry.duration)}
                  </td>
                  <td className="py-2 pl-4 min-w-[200px]">
                    <div className="relative h-3 w-full rounded bg-line-2 overflow-hidden">
                      <div
                        className={`absolute top-0 bottom-0 rounded ${
                          isError
                            ? "bg-bad"
                            : entry.resourceType === "script"
                            ? "bg-[#3b82f6]"
                            : entry.resourceType === "stylesheet"
                            ? "bg-[#10b981]"
                            : entry.resourceType === "image"
                            ? "bg-[#f59e0b]"
                            : "bg-ink"
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length > 50 && (
          <p className="mt-3 text-center text-[11.5px] font-mono text-muted">
            Showing first 50 of {filtered.length} requests.
          </p>
        )}
      </div>

      {expandedUrl && (
        <div className="mt-4 rounded border border-line bg-bg-soft p-3 font-mono text-[11.5px] text-ink break-all">
          <span className="text-muted">Full URL: </span>
          {expandedUrl}
        </div>
      )}
    </div>
  );
}
