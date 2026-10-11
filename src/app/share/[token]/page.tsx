import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { ResultsDashboard } from "@/components/dashboard/ResultsDashboard";
import { AnalysisReportSchema, type AnalysisReport } from "@/lib/analysis/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared audit — Orbital",
  // A share link is opaque and unlisted; keep it out of search indexes.
  robots: { index: false, follow: false },
};

/* ============================================================
   Public shared audit (/share/[token]) — a read-only report view
   for anyone with the link. Lives OUTSIDE the (dashboard)/(auth)
   groups so it carries no account chrome and no auth gate. The row
   is fetched by token through the service-role client (RLS-bypass,
   server-only), selecting ONLY the report + created_at — never any
   team / project / user column. An unknown or revoked token → 404.
   ============================================================ */

async function loadSharedReport(
  token: string,
): Promise<{ report: AnalysisReport; createdAt: string } | null> {
  if (!isServiceRoleConfigured()) return null;
  // Reject anything that isn't a well-formed token before hitting the DB.
  if (!/^sh_[A-Za-z0-9_-]{16,64}$/.test(token)) return null;

  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("audits")
    .select("report, created_at")
    .eq("share_token", token)
    .maybeSingle();
  if (error || !data) return null;

  const parsed = AnalysisReportSchema.safeParse(data.report);
  if (!parsed.success) return null;
  return { report: parsed.data, createdAt: data.created_at as string };
}

export default async function SharedAuditPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await loadSharedReport(token);
  if (!shared) notFound();

  const when = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(shared.createdAt));

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-[clamp(20px,4vw,36px)] py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]"
            aria-label="Orbital"
          >
            <span
              className="relative block h-4 w-4 flex-none rounded-full border-[1.6px] border-ink after:absolute after:left-1/2 after:top-[1.5px] after:-ml-[1.7px] after:h-[3.4px] after:w-[3.4px] after:rounded-full after:bg-ink after:content-['']"
              aria-hidden="true"
            />
            Orbital
          </Link>
          <span className="font-mono text-[12px] text-muted">
            Shared audit · {when} UTC
          </span>
        </div>
      </header>

      <main className="py-[clamp(24px,4vw,44px)]">
        <ResultsDashboard
          report={shared.report}
          showReset={false}
          dateLocale="en-US"
        />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-[1200px] px-[clamp(20px,4vw,36px)] py-6 text-[13px] text-gray-1">
          Generated with{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-ink">
            Orbital
          </Link>{" "}
          — audit your own site free.
        </div>
      </footer>
    </div>
  );
}
