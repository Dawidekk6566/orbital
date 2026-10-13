import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentTeam } from "@/lib/auth/dal";
import { getProject, listAuditsForProject } from "@/lib/dashboard/queries";
import { RunAuditButton } from "@/components/dashboard/RunAuditButton";
import { DeleteProjectButton } from "@/components/dashboard/DeleteProjectButton";
import { CompetitorCompareForm } from "@/components/dashboard/CompetitorCompareForm";
import { AuditsTable } from "@/components/dashboard/AuditsTable";
import { scoreTone, TONE_TEXT } from "@/lib/dashboard/score";

export const metadata: Metadata = {
  title: "Project — Orbital",
};

/* ============================================================
   Project detail (/dashboard/projects/[id]) — header with the URL
   and latest score, a run-audit control, and the run history for
   this project (retention-filtered by plan). params is a Promise in
   Next 16 → await it. RLS scopes getProject to the caller's team;
   a foreign id returns null → notFound().
   ============================================================ */

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getCurrentTeam();
  const project = await getProject(id);
  if (!project) notFound();

  const audits = await listAuditsForProject(project.id, team?.plan ?? "free");
  const latestTone = scoreTone(project.latest_score);

  return (
    <div>
      <Link
        href="/dashboard/projects"
        className="text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
      >
        ← All projects
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="truncate text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
            {project.name || hostOf(project.url)}
          </h1>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block truncate font-mono text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
          >
            {project.url}
          </a>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block text-[11px] uppercase tracking-[0.08em] text-muted">
              Latest
            </span>
            <span
              className={`font-mono text-[30px] font-semibold tracking-[-0.02em] ${TONE_TEXT[latestTone]}`}
            >
              {project.latest_score ?? "—"}
            </span>
          </div>
          <RunAuditButton projectId={project.id} url={project.url} />
        </div>
      </header>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold tracking-[-0.01em]">
          Run history
        </h2>
        <AuditsTable audits={audits} />
      </section>

      <section className="mt-12 border-t border-line pt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
          Benchmark against a competitor
        </h2>
        <p className="mt-1 text-[13px] text-gray-1">
          Audit another site and compare it against this project&apos;s latest
          run, side by side.
        </p>
        <div className="mt-4 max-w-md">
          {project.latest_audit_id ? (
            <CompetitorCompareForm projectId={project.id} />
          ) : (
            <p className="text-[13px] text-muted">
              Run an audit for this project first, then you can compare it
              against a competitor.
            </p>
          )}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-6">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-bad">
          Danger zone
        </h2>
        <p className="mt-1 text-[13px] text-gray-1">
          Deleting a project removes it and all its audit history. This can&apos;t
          be undone.
        </p>
        <DeleteProjectButton projectId={project.id} />
      </section>
    </div>
  );
}
