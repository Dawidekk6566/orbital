"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/lib/store";
import { useI18n } from "@/i18n/provider";

/* ============================================================
   Formularz audytu (.audit) — 1:1 z landingiem, ale podpięty
   do prawdziwego przepływu analizy (analyze → /api/analyze).
   ============================================================ */

export function AuditForm({
  helper = "No signup required · Results in seconds",
  onDark = false,
}: {
  helper?: string | null;
  onDark?: boolean;
}) {
  const analyze = useAnalysisStore((s) => s.analyze);
  const status = useAnalysisStore((s) => s.status);
  const { locale, t } = useI18n();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loading = status === "loading";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value) {
      setError(t.analyzer.errorEmpty);
      return;
    }
    if (!/^https?:\/\/.+/i.test(value)) {
      setError(t.analyzer.errorUrl);
      return;
    }
    setError(null);
    await analyze({ mode: "url", url: value }, locale);
  }

  return (
    <form
      className={`mt-[34px] max-w-[520px]${onDark ? " mx-auto" : ""}`}
      onSubmit={onSubmit}
      noValidate
    >
      <div
        className={`flex items-stretch rounded-[8px] border transition-shadow duration-[180ms] ${
          onDark
            ? "mt-9 border-white/50 bg-transparent focus-within:border-white focus-within:shadow-[0_0_0_3px_rgba(255,255,255,.14)]"
            : "border-ink bg-white focus-within:shadow-[0_0_0_3px_rgba(10,10,10,.09)]"
        }`}
      >
        <input
          className={`min-w-0 flex-1 border-none bg-transparent px-[18px] py-[15px] font-mono text-[16px] outline-none ${
            onDark
              ? "text-white placeholder:text-white/40"
              : "text-ink placeholder:text-faint"
          }`}
          type="url"
          inputMode="url"
          placeholder="https://yoursite.com"
          aria-label="Website URL to audit"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className={`flex items-center gap-2 rounded-r-[7px] px-[22px] text-[15px] font-medium transition-colors duration-[180ms] ${
            onDark
              ? "bg-white text-ink hover:bg-[#f0f0f0]"
              : "bg-ink text-white hover:bg-[#222]"
          }`}
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span
              className={`inline-block h-[14px] w-[14px] animate-[spin_.7s_linear_infinite] rounded-full border-2 ${
                onDark
                  ? "border-[rgba(10,10,10,.25)] border-t-ink"
                  : "border-white/[.32] border-t-white"
              }`}
              aria-hidden="true"
            />
          ) : (
            <>
              <span className="max-[600px]:hidden">Analyze</span> <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
      {error ? (
        <p
          className={`mt-[14px] font-mono text-[13px] tracking-[-0.01em] text-bad${onDark ? " text-center" : ""}`}
          role="alert"
        >
          {error}
        </p>
      ) : helper ? (
        <p
          className={`mt-[14px] font-mono text-[13px] tracking-[-0.01em] ${
            onDark ? "text-center text-white/45" : "text-muted"
          }`}
        >
          {helper}
        </p>
      ) : null}
    </form>
  );
}
