import type { Metadata } from "next";
import Link from "next/link";
import { getUser, getProfile, getCurrentTeam } from "@/lib/auth/dal";
import {
  listProjects,
  countProjects,
  getAuditsThisMonth,
} from "@/lib/dashboard/queries";
import { limitsFor } from "@/lib/plans";
import { QuotaMeter } from "@/components/dashboard/QuotaMeter";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Onboarding } from "@/components/dashboard/Onboarding";
import { GuestImportClaimer } from "@/components/dashboard/GuestImportClaimer";

export const metadata: Metadata = {
  title: "Overview — Orbital",
};

/* ============================================================
   Overview (/dashboard) — the account landing: greeting, live
   plan/quota summary from the DAL, and the tracked projects (or an
   empty state). Alert feed and the inline audit widget arrive with
   later phases.
   ============================================================ */

const CARD = "rounded-[10px] border border-line bg-white p-6";

export default async function OverviewPage() {
  const [user, profile, team, projects, urlCount, auditsUsed] =
    await Promise.all([
      getUser(),
      getProfile(),
      getCurrentTeam(),
      listProjects(),
      countProjects(),
      getAuditsThisMonth(),
    ]);

  const plan = team?.plan ?? "free";
  const limits = limitsFor(plan);
  const greetingName =
    profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div>
      <GuestImportClaimer />
      <header className="mb-8">
        <h1 className="text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em]">
          Welcome back, {greetingName}
        </h1>
        <p className="mt-2 text-[15px] text-gray-1">
          Track your sites, run audits and watch scores over time.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4 max-[820px]:grid-cols-1">
        <div className={CARD}>
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            Plan
          </span>
          <p className="mt-3 text-[22px] font-semibold capitalize tracking-[-0.01em]">
            {plan}
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-1 inline-block text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
          >
            Manage plan
          </Link>
        </div>
        <QuotaMeter
          label="Audits this month"
          used={auditsUsed}
          limit={limits.auditsPerMonth}
        />
        <QuotaMeter label="URLs tracked" used={urlCount} limit={limits.urls} />
      </div>

      {projects.length === 0 ? (
        <Onboarding />
      ) : (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              Your projects
            </h2>
            <Link
              href="/dashboard/projects"
              className="text-[13px] text-gray-1 underline underline-offset-2 hover:text-ink"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 max-[820px]:grid-cols-1">
            {projects.slice(0, 6).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
