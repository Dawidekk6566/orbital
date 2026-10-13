import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam, getUser } from "@/lib/auth/dal";
import { listTeamMembers, teamSeatCount } from "@/lib/dashboard/queries";
import { limitsFor, PLAN_LABELS } from "@/lib/plans";
import { InviteMemberForm } from "@/components/dashboard/team/InviteMemberForm";
import { MemberList } from "@/components/dashboard/team/MemberList";
import { TeamNameForm } from "@/components/dashboard/team/TeamNameForm";

export const metadata: Metadata = {
  title: "Team — Orbital",
};

/* ============================================================
   Team (/dashboard/team) — Organization roster and access control.
   Manage members, seat allocations, role permissions and invites.
   ============================================================ */

export default async function TeamPage() {
  const [user, team] = await Promise.all([getUser(), getCurrentTeam()]);

  if (!team) {
    return (
      <div className="flex flex-col gap-8">
        <header className="border-b border-line pb-6">
          <h1 className="text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Team
          </h1>
        </header>
        <p className="rounded-[10px] border border-dashed border-line bg-bg-soft/60 p-12 text-center text-[14px] text-gray-1 font-mono">
          No active team found. Sign in or initialize team settings.
        </p>
      </div>
    );
  }

  const [members, seatCount] = await Promise.all([
    listTeamMembers(team.id),
    teamSeatCount(team.id),
  ]);

  const canManage = team.role === "owner" || team.role === "admin";
  const seatLimit = limitsFor(team.plan).seats;
  const seatsLeft = seatLimit === null ? null : Math.max(0, seatLimit - seatCount);
  const seatPct = seatLimit === null ? 0 : Math.min(100, Math.round((seatCount / Math.max(1, seatLimit)) * 100));

  const activeMembers = members.filter((m) => m.status === "active").length;
  const pendingInvites = members.filter((m) => m.status === "invited").length;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Organization Workspace / Team Roster
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Team
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Invite engineering colleagues, assign granular access roles, and manage organization seats.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>Role: {team.role.toUpperCase()}</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">{PLAN_LABELS[team.plan]} Plan</span>
        </div>
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Seat Allocation</span>
            <span className="font-mono text-[10.5px] text-gray-1">
              {seatLimit === null ? "Unlimited" : `${seatPct}%`}
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {seatCount}
            <span className="text-[14px] text-faint">
              {" / "}
              {seatLimit === null ? "∞" : seatLimit}
            </span>
          </p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ink transition-all duration-300"
              style={{ width: `${seatLimit === null ? 10 : seatPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Active Members</span>
            <span className="font-mono text-[10.5px] text-gray-1">Roster</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {activeMembers}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Full platform access</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Pending Invites</span>
            <span className="font-mono text-[10.5px] text-gray-1">Invited</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {pendingInvites}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Awaiting claim via email</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Access Control</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              RBAC
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink capitalize">
            {team.role}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>{canManage ? "Full admin permissions" : "Read-only access"}</span>
          </div>
        </div>
      </div>

      {/* 3. Team Settings & Member Directory */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Team Name & Members */}
        <div className="flex flex-col gap-6">
          {/* Team Name Card */}
          <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink">Organization Profile</h2>
              <p className="text-[12.5px] text-muted">The public name of your team workspace.</p>
            </div>
            <div className="mt-4">
              {canManage ? (
                <TeamNameForm name={team.name} />
              ) : (
                <p className="font-mono text-[15px] text-ink">{team.name}</p>
              )}
            </div>
          </section>

          {/* Members List */}
          <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Team Members</h2>
                <p className="text-[12.5px] text-muted">Active members and pending invitations.</p>
              </div>
              <span className="font-mono text-[12px] text-muted">{members.length} total</span>
            </div>
            <MemberList
              members={members}
              currentUserId={user?.id ?? ""}
              callerRole={team.role}
            />
          </section>
        </div>

        {/* Right Column: Invite Member */}
        <aside className="flex flex-col gap-5">
          <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink">Invite Colleague</h2>
              <p className="text-[12.5px] text-muted">Send an email invitation to join this workspace.</p>
            </div>
            <div className="mt-4">
              <InviteMemberForm seatsLeft={seatsLeft} canManage={canManage} />
            </div>
            {seatLimit === 1 ? (
              <p className="mt-3 font-mono text-[12px] text-muted">
                Free plan includes 1 seat.{" "}
                <Link href="/dashboard/billing" className="text-ink underline underline-offset-2">
                  Upgrade
                </Link>{" "}
                to unlock team seats.
              </p>
            ) : null}
          </section>

          <div className="rounded-[10px] border border-line bg-bg-soft/40 p-4 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Role Hierarchy:</span>
            <p className="mt-1 text-gray-1 leading-[1.5]">
              Owners and Admins can trigger audits, configure alert webhooks, manage API tokens, and invite members. Members have view-only access to audit logs.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
