"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RemediationRequest, RemediationResult } from "@/lib/analysis/remediationTypes";

export function AiRemediationModal({
  request,
  isOpen,
  onClose,
}: {
  request: RemediationRequest | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<RemediationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diff" | "split" | "rationale">("diff");
  const [copiedDiff, setCopiedDiff] = useState(false);
  const [copiedAfter, setCopiedAfter] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/analysis/remediation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: RemediationResult) => {
        if (isMounted) {
          setResult(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to generate patch.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleCopyDiff = async () => {
    if (!result?.diff) return;
    await navigator.clipboard.writeText(result.diff);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  const handleCopyAfter = async () => {
    if (!result?.afterCode) return;
    await navigator.clipboard.writeText(result.afterCode);
    setCopiedAfter(true);
    setTimeout(() => setCopiedAfter(false), 2000);
  };

  const handleDownloadPatch = () => {
    if (!result?.diff) return;
    const blob = new Blob([result.diff], { type: "text/x-diff" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbital-fix-${result.issueId.replace(/[^a-z0-9]/gi, "-")}.patch`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-[860px] flex-col rounded-[12px] border border-line bg-ink text-white shadow-2xl overflow-hidden theme-fixed">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 p-5 sm:p-6 bg-white/[0.02]">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-white/15 bg-white/5 font-mono text-[18px]">
              ✨
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                  AI Remediation Studio
                </span>
                <span className="rounded border border-white/15 px-2 py-0.5 font-mono text-[10.5px] uppercase text-white/70">
                  {request.category}
                </span>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[10.5px] uppercase ${
                    request.severity === "critical" || request.severity === "high"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {request.severity}
                </span>
              </div>
              <h3 className="mt-1 text-[18px] sm:text-[20px] font-semibold text-white tracking-tight">
                {request.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="font-mono text-[13px] text-white/70">
                Generating architectural code patch…
              </p>
              <p className="text-[12px] text-white/40">
                Evaluating Next.js 16 conventions and Core Web Vitals impact
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-[13.5px] text-rose-300 font-mono">
              ⚠️ {error}
            </div>
          ) : result ? (
            <>
              {/* Telemetry pill row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[12px]">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <span className="text-white/40 uppercase tracking-wider text-[10.5px]">
                    Target File:
                  </span>
                  <p className="mt-1 font-semibold text-white truncate">
                    {result.filePath}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <span className="text-white/40 uppercase tracking-wider text-[10.5px]">
                    Projected Gain:
                  </span>
                  <p className="mt-1 font-semibold text-emerald-400">
                    {result.cwbImpact}
                  </p>
                </div>
              </div>

              {/* Tab navigation */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("diff")}
                    className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors ${
                      activeTab === "diff"
                        ? "bg-white text-black font-semibold"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Unified Diff
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("split")}
                    className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors ${
                      activeTab === "split"
                        ? "bg-white text-black font-semibold"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Before / After
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("rationale")}
                    className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors ${
                      activeTab === "rationale"
                        ? "bg-white text-black font-semibold"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Architecture &amp; Steps
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPatch}
                    className="hidden sm:inline-flex rounded border border-white/20 px-2.5 py-1 font-mono text-[11px] text-white/80 hover:border-white hover:text-white"
                  >
                    Download .patch
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyDiff}
                    className="rounded border border-white/20 px-2.5 py-1 font-mono text-[11px] text-white/80 hover:border-white hover:text-white"
                  >
                    {copiedDiff ? "✓ Copied Diff" : "Copy Diff"}
                  </button>
                </div>
              </div>

              {/* Tab: Unified Diff */}
              {activeTab === "diff" && (
                <div className="overflow-hidden rounded-lg border border-white/10 bg-black/60">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-[11px] text-white/50">
                    <span>{result.filePath}</span>
                    <span>git diff --unified</span>
                  </div>
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed">
                    {result.diff.split("\n").map((line, idx) => {
                      const isAdd = line.startsWith("+") && !line.startsWith("+++");
                      const isDel = line.startsWith("-") && !line.startsWith("---");
                      const isHeader = line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++");

                      return (
                        <div
                          key={idx}
                          className={`${
                            isAdd
                              ? "bg-emerald-500/15 text-emerald-300"
                              : isDel
                                ? "bg-rose-500/15 text-rose-300"
                                : isHeader
                                  ? "text-sky-400 font-semibold"
                                  : "text-white/70"
                          } px-2 py-0.5 rounded-sm`}
                        >
                          {line || " "}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              )}

              {/* Tab: Split Before / After */}
              {activeTab === "split" && (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg border border-rose-500/30 bg-black/50">
                    <div className="border-b border-rose-500/20 bg-rose-500/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-rose-300">
                      Before (Problematic)
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-[12px] text-rose-200 leading-relaxed whitespace-pre">
                      {result.beforeCode}
                    </pre>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-emerald-500/30 bg-black/50">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">
                        After (Optimized Remediation)
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAfter}
                        className="rounded border border-emerald-500/40 px-2 py-0.5 font-mono text-[10.5px] text-emerald-300 hover:bg-emerald-500/20"
                      >
                        {copiedAfter ? "✓ Copied" : "Copy Code"}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-[12px] text-emerald-200 leading-relaxed whitespace-pre">
                      {result.afterCode}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab: Architecture Rationale */}
              {activeTab === "rationale" && (
                <div className="space-y-4 text-[13.5px] leading-relaxed text-white/80">
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                    <h4 className="font-mono text-[11px] uppercase tracking-wider text-white/50 mb-2">
                      Engineering Rationale
                    </h4>
                    <p>{result.explanation}</p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                    <h4 className="font-mono text-[11px] uppercase tracking-wider text-white/50 mb-2">
                      Deployment Checklist
                    </h4>
                    <ul className="space-y-2 font-mono text-[12.5px] text-white/70">
                      {result.instructions.map((inst, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{inst}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[12px]">
                    <span className="text-white/40 uppercase tracking-wider text-[10.5px]">
                      Quick Terminal Application:
                    </span>
                    <pre className="mt-2 text-white bg-black p-2.5 rounded border border-white/10">
                      git apply orbital-fix-{result.issueId}.patch
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-6 py-4">
          <span className="font-mono text-[11px] text-white/40">
            Powered by Claude 3.5 Sonnet &amp; Orbital Engineering Rules
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-5 py-1.5 text-[13px] font-semibold text-black transition-colors hover:bg-neutral-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
