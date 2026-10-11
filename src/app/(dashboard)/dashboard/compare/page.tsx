import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAudit } from "@/lib/dashboard/queries";
import { RadarChart } from "@/components/dashboard/charts/RadarChart";
import { diffReports, categoryAxes } from "@/lib/dashboard/diff";
import {
  ScoreCard,
  FindingSection,
  RichDiffCards,
  hostOf,
  auditDateFmt as fmt,
} from "@/components/dashboard/compare-ui";
import { scoreTone, TONE_TEXT } from "@/lib/dashboard/score";

export const metadata: Metadata = {
  title: "Compare audits — Orbital",
};

/* ============================================================
   Compare (/dashboard/compare?base=&target=) — side-by-side diff
   of two persisted audits: per-category score deltas, a radar with
   the newer run over the older, and the findings split into fixed /
   new / still-present buckets (matched by recommendation id). Both
   audits are RLS-scoped via getAudit; a foreign/missing id → 404.
   Runs are ordered by created_at so the diff always reads older →
   newer regardless of the query-param order. searchParams is a
   Promise in Next 16. Shared card/finding UI lives in compare-ui;
   /dashboard/versus reuses it for competitor comparisons.
   ============================================================ */

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ base?: string; target?: string }>;
}) {
  const { base: baseId, target: targetId } = await searchParams;

  if (!baseId || !targetId) {
    return (
      <div>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          Compare audits
        </h1>
        <div className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center">
          <p className="text-[14px] text-gray-1">
            Pick two runs to compare from a project&apos;s history.
          </p>
          <Link
            href="/dashboard/history"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Open history
          </Link>
        </div>
      </div>
    );
  }

  const [a, b] = await Promise.all([getAudit(baseId), getAudit(targetId)]);
  if (!a || !b) notFound();

  // Always read older → newer regardless of the query-param order.
  const [older, newer] =
    new Date(a.created_at) <= new Date(b.created_at) ? [a, b] : [b, a];

  const diff = diffReports(older.report, newer.report);
  const host = hostOf(newer.report.target.value);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/history"
          className="text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
        >
          ← Back to history
        </Link>
        <div className="flex gap-3 text-[13px]">
          <Link
            href={`/dashboard/audits/${older.id}`}
            className="text-gray-1 underline underline-offset-2 hover:text-ink"
          >
            Open older
          </Link>
          <Link
            href={`/dashboard/audits/${newer.id}`}
            className="text-gray-1 underline underline-offset-2 hover:text-ink"
          >
            Open newer
          </Link>
        </div>
      </div>

      <header>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          {host}
        </h1>
        <p className="mt-1 font-mono text-[12px] text-muted">
          {fmt.format(new Date(older.created_at))}
          <span className="mx-2 text-faint">→</span>
          {fmt.format(new Date(newer.created_at))}
        </p>
      </header>

      {/* score deltas */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ScoreCard label="Overall" d={diff.overall} />
        {diff.categories.map((c) => (
          <ScoreCard key={c.key} label={c.label} d={c} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* findings */}
        <div className="flex flex-col gap-4">
          <FindingSection
            title="Fixed in newer run"
            countTone="text-good"
            recs={diff.resolved}
            empty="No issues were resolved between these runs."
          />
          <FindingSection
            title="New in newer run"
            countTone="text-bad"
            recs={diff.added}
            empty="No new issues appeared."
          />
          <FindingSection
            title="Still present"
            countTone="text-muted"
            recs={diff.persistent}
            empty="Nothing carried over."
          />
        </div>

        {/* radar: newer over older */}
        <section className="h-fit rounded-[10px] border border-line bg-white p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              Categories
            </h2>
            <span
              className={`font-mono text-[13px] ${TONE_TEXT[scoreTone(newer.report.overallScore)]}`}
            >
              {newer.report.overallScore}
            </span>
          </div>
          <RadarChart
            current={categoryAxes(newer.report)}
            previous={categoryAxes(older.report)}
          />
          <p className="mt-3 text-center text-[11px] text-muted">
            Solid = newer · dashed = older
          </p>
        </section>
      </div>

      <RichDiffCards
        base={older.report}
        target={newer.report}
        baseLabel="older"
        targetLabel="newer"
        changeLabels={{ added: "new", removed: "lost" }}
      />
    </div>
  );
}
