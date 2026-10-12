"use client";

import { create } from "zustand";
import type { AnalysisReport, AnalyzeRequest } from "./analysis/types";
import { buildDemoReport } from "./analysis/demoData";
import type { Locale } from "@/i18n/messages";

/* ============================================================
   Globalny stan klienta (Zustand): przepływ analizy i wyniki.
   ============================================================ */

export type AnalysisStatus = "idle" | "loading" | "done" | "error";

interface AnalysisState {
  status: AnalysisStatus;
  request: AnalyzeRequest | null;
  report: AnalysisReport | null;
  error: string | null;
  analyze: (request: AnalyzeRequest, locale?: Locale) => Promise<void>;
  loadDemo: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  status: "idle",
  request: null,
  report: null,
  error: null,

  analyze: async (request, locale = "en") => {
    set({ status: "loading", request, error: null });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify(request),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ status: "error", error: data?.error ?? "generic" });
        return;
      }

      set({ status: "done", report: data as AnalysisReport });
    } catch {
      set({ status: "error", error: "generic" });
    }
  },

  loadDemo: () => {
    set({ status: "done", request: { mode: "url", url: "https://example.com" }, report: buildDemoReport(), error: null });
  },

  reset: () => set({ status: "idle", request: null, report: null, error: null }),
}));
