"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importGuestAudit } from "@/app/(dashboard)/actions/projects";
import { readGuestImport, clearGuestImport } from "@/lib/guestImport";

/* ============================================================
   GuestImportClaimer — runs once on the dashboard after sign-up.
   If the visitor stashed a landing-page audit before creating an
   account, it hands the report to importGuestAudit (server-validated)
   and routes to the saved report. Renders a small inline notice while
   importing; nothing once there's nothing to claim.
   ============================================================ */

export function GuestImportClaimer() {
  const router = useRouter();
  const ran = useRef(false);
  const [status, setStatus] = useState<"idle" | "importing" | "error">("idle");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const report = readGuestImport();
    if (!report) return;
    // Consume the stash immediately so a re-render can't double-import.
    clearGuestImport();

    void (async () => {
      setStatus("importing");
      try {
        const result = await importGuestAudit(report);
        if (result.auditId) {
          router.push(`/dashboard/audits/${result.auditId}`);
          return;
        }
        setStatus(result.error ? "error" : "idle");
      } catch {
        setStatus("error");
      }
    })();
  }, [router]);

  if (status === "idle") return null;

  return (
    <div
      role="status"
      className="mb-6 rounded-[8px] border border-line bg-bg-soft px-4 py-3 text-[13px] text-gray-1"
    >
      {status === "importing"
        ? "Saving your audit to this account…"
        : "We couldn't import your earlier audit. You can run a new one anytime."}
    </div>
  );
}
