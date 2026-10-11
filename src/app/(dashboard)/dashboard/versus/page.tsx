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
} from "@/components/dashboard/compare-ui";
import { scoreTone, TONE_TEXT } from "@/lib/dashboard/score";

export const metadata: Metadata = {
  title: "Competitor comparison — Orbital",
};

/* ============================================================
   Versus (/dashboard/versus?you=&them=) — benchmark your tracked
   site against a competitor. Both audits are RLS-scoped via getAudit
   (the competitor run is a team-owned ad-hoc audit), so a foreign id
   → 404. The diff is framed you-vs-them: scores lead with your number
   and a delta (you − them, ▲ green = you lead), and findings split
   into issues only they have / only you have / shared. searchParams
   is a Promise in Next 16. Card/finding UI is shared with
   /dashboard/compare via compare-ui.
   ============================================================ */

export default async function VersusPage({
  searchParams,
}: {
  searchParams: Promise<{ you?: string; them?: string }>;
}) {
  const { you: youId, them: themId } = await searchParams;

  if (!youId || !themId) {
    return (
      <div>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          Competitor comparison
        </h1>
        <div className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center">
          <p className="text-[14px] text-gray-1">
            Open a project and compare it against a competitor URL.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Your projects
          </Link>
        </div>
      </div>
    );
  }

  const [you, them] = await Promise.all([getAudit(youId), getAudit(themId)]);
  if (!you || !them) notFound();

  // base = them, target = you → every delta reads as "you − them".
  const diff = diffReports(them.report, you.report);
  const yourHost = hostOf(you.report.target.value);
  const theirHost = hostOf(them.report.target.value);
  const backHref = you.project_id
    ? `/dashboard/projects/${you.project_id}`
    : "/dashboard/projects";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={backHref}
          className="text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
        >
          ← Back to project
        </Link>
        <div className="flex gap-3 text-[13px]">
          <Link
            href={`/dashboard/audits/${you.id}`}
            className="text-gray-1 underline underline-offset-2 hover:text-ink"
          >
            Your report
          </Link>
          <Link
            href={`/dashboard/audits/${them.id}`}
            className="text-gray-1 underline underline-offset-2 hover:text-ink"
          >
            Their report
          </Link>
        </div>
      </div>

      <header>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          {yourHost}{" "}
          <span className="text-muted">vs</span> {theirHost}
        </h1>
        <p className="mt-1 font-mono text-[12px] text-muted">
          Scores are your site; <span className="text-good">▲</span> means you
          lead, <span className="text-bad">▼</span> means the competitor does.
        </p>
      </header>

      {/* score deltas — headline is your score, caption is theirs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ScoreCard
          label="Overall"
          d={diff.overall}
          caption={<>{theirHost}: {diff.overall.base ?? "—"}</>}
        />
        {diff.categories.map((c) => (
          <ScoreCard
            key={c.key}
            label={c.label}
            d={c}
            caption={<>{theirHost}: {c.base ?? "—"}</>}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* findings */}
        <div className="flex flex-col gap-4">
          <FindingSection
            title={`Only on ${theirHost}`}
            countTone="text-good"
            recs={diff.resolved}
            empty="Nothing they have that your site avoids."
          />
          <FindingSection
            title={`Only on ${yourHost}`}
            countTone="text-bad"
            recs={diff.added}
            empty="No issues unique to your site."
          />
          <FindingSection
            title="On both sites"
            countTone="text-muted"
            recs={diff.persistent}
            empty="No issues in common."
          />
        </div>

        {/* radar: your site over the competitor */}
        <section className="h-fit rounded-[10px] border border-line bg-white p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              Categories
            </h2>
            <span
              className={`font-mono text-[13px] ${TONE_TEXT[scoreTone(you.report.overallScore)]}`}
            >
              {you.report.overallScore}
            </span>
          </div>
          <RadarChart
            current={categoryAxes(you.report)}
            previous={categoryAxes(them.report)}
          />
          <p className="mt-3 text-center text-[11px] text-muted">
            Solid = you · dashed = {theirHost}
          </p>
        </section>
      </div>

      <RichDiffCards
        base={them.report}
        target={you.report}
        baseLabel={theirHost}
        targetLabel={yourHost}
        changeLabels={{ added: "you only", removed: "them only" }}
      />
    </div>
  );
}
