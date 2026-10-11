import type { Metadata } from "next";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listProjects, countProjects } from "@/lib/dashboard/queries";
import { limitsFor } from "@/lib/plans";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { NewProjectForm } from "@/components/dashboard/NewProjectForm";

export const metadata: Metadata = {
  title: "Projects — Orbital",
};

/* ============================================================
   Projects (/dashboard/projects) — the tracked-site list plus the
   add-project form. The form is gated server-side in createProject;
   here we also surface the URL cap so the UI reads honestly.
   ============================================================ */

export default async function ProjectsPage() {
  const [projects, count, team] = await Promise.all([
    listProjects(),
    countProjects(),
    getCurrentTeam(),
  ]);

  const limit = limitsFor(team?.plan ?? "free").urls;
  const atCap = limit !== null && count >= limit;

  return (
    <div>
      <header className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em]">
            Projects
          </h1>
          <p className="mt-2 text-[15px] text-gray-1">
            The sites you track. Run an audit any time or on a schedule.
          </p>
        </div>
        <span className="flex-none font-mono text-[13px] text-gray-1">
          {count}
          {limit !== null ? ` / ${limit}` : ""} URLs
        </span>
      </header>

      <div className="grid grid-cols-[1fr_320px] gap-8 max-[820px]:grid-cols-1">
        <div className="flex flex-col gap-3">
          {projects.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-line bg-bg-soft p-10 text-center">
              <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
                No projects yet
              </h2>
              <p className="mx-auto mt-2 max-w-[42ch] text-[14px] text-gray-1">
                Add your first site with the form to start auditing.
              </p>
            </div>
          ) : (
            projects.map((p) => <ProjectCard key={p.id} project={p} />)
          )}
        </div>

        <aside className="rounded-[10px] border border-line bg-white p-6 h-fit">
          <h2 className="mb-4 text-[15px] font-semibold tracking-[-0.01em]">
            Add a project
          </h2>
          {atCap ? (
            <p className="text-[14px] text-gray-1">
              You&apos;ve reached your plan&apos;s URL limit.{" "}
              <a
                href="/dashboard/billing"
                className="text-ink underline underline-offset-2"
              >
                Upgrade
              </a>{" "}
              to track more sites.
            </p>
          ) : (
            <NewProjectForm />
          )}
        </aside>
      </div>
    </div>
  );
}
