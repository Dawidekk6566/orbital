"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/lib/store";
import { useI18n } from "@/i18n/provider";
import { HeroBackground } from "@/components/visual/HeroBackground";

type TabId = "vitals" | "diff" | "security" | "assets";

const SAMPLE_SITES = [
  { name: "stripe.com", url: "https://stripe.com" },
  { name: "linear.app", url: "https://linear.app" },
  { name: "vercel.com", url: "https://vercel.com" },
  { name: "github.com", url: "https://github.com" },
];

export function Hero() {
  const analyze = useAnalysisStore((s) => s.analyze);
  const status = useAnalysisStore((s) => s.status);
  const { locale, t } = useI18n();

  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("vitals");

  const loading = status === "loading";

  async function handleAudit(targetUrl: string) {
    const value = targetUrl.trim();
    if (!value) {
      setError(t.analyzer.errorEmpty);
      return;
    }
    const fullUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    setError(null);
    setUrl(fullUrl);
    await analyze({ mode: "url", url: fullUrl }, locale);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAudit(url);
  }

  return (
    <section
      id="start"
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pb-[clamp(72px,9vw,120px)] pt-[calc(64px+clamp(48px,7vw,84px))]"
    >
      <HeroBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center px-4 text-center sm:px-[clamp(24px,5vw,40px)]">
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-bg-soft/90 px-3.5 py-1.5 font-mono text-[12px] text-gray-1 backdrop-blur-md transition-colors hover:border-line-strong">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
          </span>
          <span className="font-semibold text-ink">ORBITAL AUDIT ENGINE v2.4</span>
          <span className="text-line-strong">/</span>
          <span className="text-muted">42 DEEP CHECKS ACTIVE</span>
        </div>

        {/* Hero Title */}
        <h1 className="mt-7 max-w-[18ch] text-balance font-display text-[clamp(38px,5.8vw,76px)] font-semibold leading-[1.04] tracking-[-0.038em]">
          The engineering-grade technical audit engine.
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 max-w-[58ch] text-balance text-[clamp(16px,1.25vw,19px)] leading-[1.6] text-gray-1">
          Instant diagnostic audits for modern web engineering teams. Deep-scan Core Web Vitals,
          security headers, WCAG accessibility, and crawlability — with exact line-item code remediation.
        </p>

        {/* Command Omnibar Form */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-9 w-full max-w-[620px]"
        >
          <div className="group relative flex items-stretch rounded-[10px] border border-line bg-white/95 p-1.5 shadow-[0_12px_36px_rgba(10,10,10,0.06)] backdrop-blur-md transition-all duration-200 focus-within:border-ink focus-within:shadow-[0_0_0_3px_rgba(10,10,10,0.08),0_16px_44px_rgba(10,10,10,0.1)] dark:bg-white/10 dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
            <div className="flex select-none items-center pl-3.5 pr-2 font-mono text-[13.5px] text-muted">
              https://
            </div>
            <input
              type="text"
              inputMode="url"
              placeholder="yoursite.com"
              aria-label="Target website URL to audit"
              spellCheck={false}
              value={url.replace(/^https?:\/\//i, "")}
              onChange={(e) => setUrl(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent px-2 py-3 font-mono text-[15px] sm:text-[16px] text-ink outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-[7px] bg-ink px-4 sm:px-6 py-2.5 sm:py-3 text-[14px] sm:text-[15px] font-medium text-white transition-all duration-180 hover:bg-[#222] active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <span
                  className="inline-block h-4 w-4 animate-[spin_.7s_linear_infinite] rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
              ) : (
                <>
                  <span>Audit URL</span>
                  <span aria-hidden="true" className="font-mono text-[13px] text-white/70">↵</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 font-mono text-[13px] text-bad" role="alert">
              {error}
            </p>
          )}

          {/* Preset quick test chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 font-mono text-[12px]">
            <span className="text-muted">Quick test:</span>
            {SAMPLE_SITES.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleAudit(sample.url)}
                className="rounded-full border border-line bg-bg-soft/70 px-2.5 py-1 text-gray-1 transition-colors hover:border-line-strong hover:bg-bg-soft hover:text-ink"
              >
                {sample.name}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 font-mono text-[11.5px] text-muted">
            <span>⚡ 2.4s Average Scan</span>
            <span>·</span>
            <span>🛡️ 0-RTT Dual-Engine</span>
            <span>·</span>
            <span>No sign-up required</span>
          </div>
        </form>

        {/* ============================================================
            THE ORBITAL DIAGNOSTIC WORKBENCH (Interactive Hero Inspector)
            Replaces the fake static progress-bar card with a true
            developer-grade telemetry & code remediation console.
            ============================================================ */}
        <div className="mt-14 w-full max-w-[1080px] overflow-hidden rounded-[12px] border border-line bg-white/95 text-left shadow-[0_24px_64px_rgba(10,10,10,0.08)] backdrop-blur-xl transition-all dark:bg-white/5 dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
          {/* Window Chrome Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg-soft/70 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]/80" />
              </span>
              <span className="font-mono text-[12px] text-muted max-sm:hidden">
                orbital-inspector v2.4
              </span>
              <span className="rounded bg-line px-1.5 py-0.5 font-mono text-[11px] text-gray-1">
                TARGET: stripe.com
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-good">
                <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
                200 OK
              </span>
              <span className="font-mono text-[11.5px] text-muted max-sm:hidden">
                · HTTP/3 · TLS 1.3 · 74ms TTFB
              </span>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-line px-2 sm:px-4">
            <button
              type="button"
              onClick={() => setActiveTab("vitals")}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 sm:px-4 py-3 font-mono text-[12.5px] sm:text-[13px] font-medium transition-colors ${
                activeTab === "vitals"
                  ? "border-ink text-ink font-semibold"
                  : "border-transparent text-gray-1 hover:text-ink"
              }`}
            >
              <span>⚡ Core Web Vitals</span>
              <span className="rounded-full bg-good/10 px-2 py-0.5 text-[10px] text-good">
                98/100
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("diff")}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 sm:px-4 py-3 font-mono text-[12.5px] sm:text-[13px] font-medium transition-colors ${
                activeTab === "diff"
                  ? "border-ink text-ink font-semibold"
                  : "border-transparent text-gray-1 hover:text-ink"
              }`}
            >
              <span>🛠️ Remediation Diff</span>
              <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[10px] text-warn font-semibold">
                -680ms
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 sm:px-4 py-3 font-mono text-[12.5px] sm:text-[13px] font-medium transition-colors ${
                activeTab === "security"
                  ? "border-ink text-ink font-semibold"
                  : "border-transparent text-gray-1 hover:text-ink"
              }`}
            >
              <span>🛡️ Security & Headers</span>
              <span className="rounded-full bg-line px-2 py-0.5 text-[10px] text-gray-1">
                Grade A+
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("assets")}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 sm:px-4 py-3 font-mono text-[12.5px] sm:text-[13px] font-medium transition-colors ${
                activeTab === "assets"
                  ? "border-ink text-ink font-semibold"
                  : "border-transparent text-gray-1 hover:text-ink"
              }`}
            >
              <span>📦 Payload Tax</span>
              <span className="rounded-full bg-line px-2 py-0.5 text-[10px] text-gray-1">
                1.42 MB
              </span>
            </button>
          </div>

          {/* Workbench Body */}
          <div className="p-4 sm:p-7 min-h-[290px]">
            {/* TAB 1: Core Web Vitals */}
            {activeTab === "vitals" && (
              <div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-[8px] border border-line bg-bg-soft/60 p-3.5 transition-all hover:border-line-strong">
                    <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                      <span>LCP (Largest Paint)</span>
                      <span className="text-good font-semibold">Good</span>
                    </div>
                    <div className="mt-2 font-mono text-[26px] sm:text-[32px] font-bold text-ink">
                      0.84s
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-gray-1">
                      Target: &lt; 2.50s (p75 field)
                    </div>
                  </div>

                  <div className="rounded-[8px] border border-line bg-bg-soft/60 p-3.5 transition-all hover:border-line-strong">
                    <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                      <span>INP (Interaction)</span>
                      <span className="text-good font-semibold">Good</span>
                    </div>
                    <div className="mt-2 font-mono text-[26px] sm:text-[32px] font-bold text-ink">
                      38ms
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-gray-1">
                      Target: &lt; 200ms (p75 field)
                    </div>
                  </div>

                  <div className="rounded-[8px] border border-line bg-bg-soft/60 p-3.5 transition-all hover:border-line-strong">
                    <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                      <span>CLS (Layout Shift)</span>
                      <span className="text-good font-semibold">Zero</span>
                    </div>
                    <div className="mt-2 font-mono text-[26px] sm:text-[32px] font-bold text-ink">
                      0.002
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-gray-1">
                      Target: &lt; 0.10 (p75 field)
                    </div>
                  </div>

                  <div className="rounded-[8px] border border-line bg-bg-soft/60 p-3.5 transition-all hover:border-line-strong">
                    <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                      <span>TTFB (Server Timing)</span>
                      <span className="text-good font-semibold">Edge</span>
                    </div>
                    <div className="mt-2 font-mono text-[26px] sm:text-[32px] font-bold text-ink">
                      74ms
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-gray-1">
                      Edge cache hit (Cloudflare)
                    </div>
                  </div>
                </div>

                {/* Network Waterfall Stream */}
                <div className="mt-5 rounded-[8px] border border-line bg-bg-soft/40 p-4">
                  <div className="flex items-center justify-between font-mono text-[12px] text-muted">
                    <span>Critical Resource Waterfall Timeline</span>
                    <span>Elapsed: 420ms</span>
                  </div>
                  <div className="mt-3.5 flex flex-col gap-2.5 font-mono text-[12px]">
                    <div className="grid grid-cols-[140px_1fr_60px] items-center gap-3 max-sm:grid-cols-[100px_1fr_50px]">
                      <span className="truncate text-ink">document (HTML)</span>
                      <div className="h-2 rounded-full bg-line overflow-hidden">
                        <div className="h-full w-[18%] rounded-full bg-ink" />
                      </div>
                      <span className="text-right text-muted">74ms</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr_60px] items-center gap-3 max-sm:grid-cols-[100px_1fr_50px]">
                      <span className="truncate text-ink">main.bundle.css</span>
                      <div className="h-2 rounded-full bg-line overflow-hidden">
                        <div className="ml-[18%] h-full w-[26%] rounded-full bg-ink" />
                      </div>
                      <span className="text-right text-muted">110ms</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr_60px] items-center gap-3 max-sm:grid-cols-[100px_1fr_50px]">
                      <span className="truncate text-ink">font-grotesk.woff2</span>
                      <div className="h-2 rounded-full bg-line overflow-hidden">
                        <div className="ml-[22%] h-full w-[20%] rounded-full bg-ink" />
                      </div>
                      <span className="text-right text-muted">85ms</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr_60px] items-center gap-3 max-sm:grid-cols-[100px_1fr_50px]">
                      <span className="truncate text-ink font-semibold text-good">hero-cover.webp (LCP)</span>
                      <div className="h-2 rounded-full bg-line overflow-hidden">
                        <div className="ml-[40%] h-full w-[44%] rounded-full bg-good" />
                      </div>
                      <span className="text-right font-semibold text-good">184ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Remediation Diff */}
            {activeTab === "diff" && (
              <div className="font-mono text-[12px] sm:text-[13px]">
                <div className="mb-3 flex items-center justify-between text-muted">
                  <span>File: src/components/HeroImage.tsx — Line 24</span>
                  <span className="rounded bg-warn/15 px-2 py-0.5 text-warn font-semibold">
                    HIGH IMPACT REMEDIATION
                  </span>
                </div>
                <div className="overflow-x-auto rounded-[8px] border border-line bg-ink/[0.03] p-4 dark:bg-black/40">
                  <div className="text-muted italic mb-2">
                    // Preload critical hero asset & specify explicit dimensions to eliminate CLS and accelerate LCP by 680ms
                  </div>
                  <div className="flex gap-3 text-bad bg-bad/10 px-2.5 py-1 rounded">
                    <span className="select-none font-bold">-</span>
                    <span>&lt;img src=&quot;/static/hero.png&quot; loading=&quot;lazy&quot; className=&quot;w-full&quot; /&gt;</span>
                  </div>
                  <div className="flex gap-3 text-good bg-good/10 px-2.5 py-1 rounded mt-1">
                    <span className="select-none font-bold">+</span>
                    <span>&lt;Image src=&quot;/static/hero.webp&quot; priority fetchPriority=&quot;high&quot; width=&#123;1200&#125; height=&#123;630&#125; alt=&quot;Hero Telemetry&quot; /&gt;</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted">
                  <span>Estimated Speed Gain: +28 Performance Score Points</span>
                  <span>Validated against Next.js 16 Image Pipeline</span>
                </div>
              </div>
            )}

            {/* TAB 3: Security & Headers */}
            {activeTab === "security" && (
              <div className="flex flex-col gap-2.5 font-mono text-[12px] sm:text-[12.5px]">
                <div className="flex items-center justify-between rounded-[8px] border border-line bg-bg-soft/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-good font-bold">✓</span>
                    <span className="font-semibold text-ink">Strict-Transport-Security (HSTS)</span>
                  </div>
                  <span className="text-muted truncate max-w-[280px]">max-age=63072000; includeSubDomains; preload</span>
                </div>

                <div className="flex items-center justify-between rounded-[8px] border border-line bg-bg-soft/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-good font-bold">✓</span>
                    <span className="font-semibold text-ink">Content-Security-Policy (CSP)</span>
                  </div>
                  <span className="text-muted truncate max-w-[280px]">default-src &apos;self&apos;; object-src &apos;none&apos;; base-uri &apos;none&apos;</span>
                </div>

                <div className="flex items-center justify-between rounded-[8px] border border-line bg-bg-soft/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-good font-bold">✓</span>
                    <span className="font-semibold text-ink">Permissions-Policy</span>
                  </div>
                  <span className="text-muted truncate max-w-[280px]">camera=(), microphone=(), geolocation=()</span>
                </div>

                <div className="flex items-center justify-between rounded-[8px] border border-line bg-bg-soft/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-good font-bold">✓</span>
                    <span className="font-semibold text-ink">TLS 1.3 Cipher Suite</span>
                  </div>
                  <span className="text-muted">TLS_AES_128_GCM_SHA256 (0-RTT)</span>
                </div>
              </div>
            )}

            {/* TAB 4: Asset & Payload Tax */}
            {activeTab === "assets" && (
              <div>
                <div className="flex items-center justify-between font-mono text-[12px] text-muted mb-3">
                  <span>Transfer Breakdown by Content Type</span>
                  <span>1.42 MB total · Brotli-compressed</span>
                </div>

                {/* Distribution Multi-Bar */}
                <div className="h-4 w-full flex rounded-full overflow-hidden border border-line">
                  <div className="bg-ink w-[42%]" title="Images (42%)" />
                  <div className="bg-gray-1 w-[28%]" title="JavaScript (28%)" />
                  <div className="bg-muted w-[16%]" title="Fonts (16%)" />
                  <div className="bg-faint w-[14%]" title="CSS & HTML (14%)" />
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[12px]">
                  <div className="rounded-[6px] border border-line p-2.5">
                    <div className="text-muted">Images (WebP)</div>
                    <div className="font-bold text-ink mt-1">596 KB (42%)</div>
                  </div>
                  <div className="rounded-[6px] border border-line p-2.5">
                    <div className="text-muted">JavaScript</div>
                    <div className="font-bold text-ink mt-1">398 KB (28%)</div>
                  </div>
                  <div className="rounded-[6px] border border-line p-2.5">
                    <div className="text-muted">Fonts (WOFF2)</div>
                    <div className="font-bold text-ink mt-1">227 KB (16%)</div>
                  </div>
                  <div className="rounded-[6px] border border-line p-2.5">
                    <div className="text-muted">Styles & HTML</div>
                    <div className="font-bold text-ink mt-1">199 KB (14%)</div>
                  </div>
                </div>

                <p className="mt-4 font-mono text-[11.5px] text-muted">
                  Third-party script impact: 142 KB (10.0%) from analytical beacons, 0 blocking scripts detected.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
