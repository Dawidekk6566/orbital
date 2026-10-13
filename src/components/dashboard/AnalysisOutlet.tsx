"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { useAnalysisStore } from "@/lib/store";
import { stashGuestImport } from "@/lib/guestImport";
import { CosmicLoader } from "@/components/hero/CosmicLoader";
import { ResultsDashboard } from "./ResultsDashboard";

/* ============================================================
   Warstwa wyników — nakładka pełnoekranowa pokazywana podczas
   analizy (loader) oraz po jej zakończeniu (dashboard).
   Zamykanie przez „Analizuj ponownie" (reset store'u). Gość może
   też zapisać wynik na koncie: stash → /signup, a po zalogowaniu
   GuestImportClaimer przenosi raport do bazy.
   ============================================================ */

export function AnalysisOutlet() {
  const { t } = useI18n();
  const router = useRouter();
  const status = useAnalysisStore((s) => s.status);
  const report = useAnalysisStore((s) => s.report);
  const reset = useAnalysisStore((s) => s.reset);
  const storeRequest = useAnalysisStore((s) => s.request);

  const active = status === "loading" || (status === "done" && report !== null);

  function saveToAccount() {
    if (report) stashGuestImport(report);
    router.push("/signup?import=1");
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-void/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={t.dashboard.recommendations}
        >
          <div className="min-h-full w-full max-w-full px-2 xs:px-4 py-8 sm:px-6 sm:py-16">
            {status === "loading" && (
              <div className="flex min-h-[70vh] items-center justify-center">
                <CosmicLoader
                  target={
                    storeRequest?.mode === "url"
                      ? storeRequest.url
                      : storeRequest?.mode === "code"
                      ? "Pasted Code Analysis"
                      : storeRequest?.mode === "files"
                      ? `${storeRequest.files.length} Files Analysis`
                      : storeRequest?.mode === "screenshot"
                      ? "Screenshot Inspection"
                      : "Website Audit"
                  }
                />
              </div>
            )}
            {status === "done" && report && (
              <ResultsDashboard
                report={report}
                headerActions={
                  <>
                    <button
                      onClick={saveToAccount}
                      className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#222]"
                    >
                      {t.common.saveToAccount}
                    </button>
                    <button
                      onClick={reset}
                      aria-label={t.common.close}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-lg text-ink transition-colors hover:border-line-strong hover:bg-bg-soft"
                    >
                      ✕
                    </button>
                  </>
                }
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
