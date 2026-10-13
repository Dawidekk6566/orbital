"use client";

import { useState } from "react";
import { runAdHocAudit } from "@/app/(dashboard)/actions/projects";

const SAMPLES = ["stripe.com", "linear.app", "vercel.com", "github.com"];

export function DashboardQuickAudit() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAudit(targetUrl: string) {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError("Enter a website URL to audit.");
      return;
    }
    const fullUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    setError(null);
    setLoading(true);

    try {
      const res = await runAdHocAudit({ mode: "url", url: fullUrl });
      if (res && res.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      // In Next.js, redirect() throws an internal object containing digest;
      // re-throw it so Next.js navigates smoothly to the new audit.
      if (err && typeof err === "object" && "digest" in err) {
        throw err;
      }
      setError("Unable to complete audit. Check the URL and try again.");
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAudit(url);
  }

  return (
    <div className="rounded-[10px] border border-line bg-white/95 p-4 sm:p-5 shadow-[0_4px_20px_rgba(10,10,10,0.03)] backdrop-blur dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 text-[12px] font-mono">
        <div className="flex items-center gap-2 text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
          <span className="font-semibold text-ink">INSTANT DIAGNOSTIC SCAN</span>
          <span className="text-line-strong">/</span>
          <span className="text-muted">Run on-demand audit</span>
        </div>
        <span className="text-muted text-[11px] max-sm:hidden">
          Dual-engine: Lighthouse + Real Browser
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-3.5 flex flex-col gap-2.5">
        <div className="flex items-stretch rounded-[8px] border border-line bg-bg-soft/70 transition-colors focus-within:border-ink focus-within:bg-white dark:focus-within:bg-white/10">
          <span className="flex select-none items-center pl-3.5 pr-1 font-mono text-[13px] text-muted">
            https://
          </span>
          <input
            type="text"
            inputMode="url"
            placeholder="example.com or direct URL"
            aria-label="URL to audit"
            spellCheck={false}
            value={url.replace(/^https?:\/\//i, "")}
            onChange={(e) => setUrl(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent px-2 py-2.5 font-mono text-[14px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 rounded-r-[7px] bg-ink px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <span
                className="inline-block h-3.5 w-3.5 animate-[spin_.7s_linear_infinite] rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
            ) : (
              <>
                <span>Scan</span>
                <span className="font-mono text-[11px] opacity-70">↵</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="font-mono text-[12px] text-bad" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[11.5px]">
          <div className="flex flex-wrap items-center gap-1.5 text-muted">
            <span>Quick test:</span>
            {SAMPLES.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setUrl(sample);
                  handleAudit(sample);
                }}
                className="rounded border border-line bg-bg-soft px-2 py-0.5 text-gray-1 transition-colors hover:border-line-strong hover:text-ink"
              >
                {sample}
              </button>
            ))}
          </div>
          <span className="text-muted max-sm:hidden">
            Detailed Core Web Vitals, Security &amp; SEO
          </span>
        </div>
      </form>
    </div>
  );
}
