import Link from "next/link";
import type { ProjectRow } from "@/lib/dashboard/queries";
import { scoreTone, TONE_TEXT, timeAgo } from "@/lib/dashboard/score";

/* ============================================================
   ProjectCard — one tracked site in the projects grid. Shows the
   latest overall score (toned), host, and last-updated. Whole card
   links to the detail page. Hairline, monochrome.
   ============================================================ */

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ProjectCard({ project }: { project: ProjectRow }) {
  const score = project.latest_score;
  const tone = scoreTone(score);

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group flex items-center justify-between gap-4 rounded-[10px] border border-line bg-white p-5 transition-colors hover:border-ink"
    >
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium tracking-[-0.01em]">
          {project.name || hostOf(project.url)}
        </p>
        <p className="mt-0.5 truncate font-mono text-[12.5px] text-gray-1">
          {hostOf(project.url)}
        </p>
        <p className="mt-2 text-[12px] text-faint">
          {project.latest_audit_id
            ? `Updated ${timeAgo(project.updated_at)}`
            : "No audits yet"}
        </p>
      </div>
      <div className="flex-none text-right">
        <span
          className={`font-mono text-[26px] font-semibold tracking-[-0.02em] ${TONE_TEXT[tone]}`}
        >
          {score ?? "—"}
        </span>
      </div>
    </Link>
  );
}
