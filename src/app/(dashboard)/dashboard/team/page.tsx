import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam, getUser } from "@/lib/auth/dal";
import { listTeamMembers, teamSeatCount } from "@/lib/dashboard/queries";
import { limitsFor } from "@/lib/plans";
import { InviteMemberForm } from "@/components/dashboard/team/InviteMemberForm";
import { MemberList } from "@/components/dashboard/team/MemberList";
import { TeamNameForm } from "@/components/dashboard/team/TeamNameForm";

export const metadata: Metadata = {
  title: "Team — Orbital",
};

/* ============================================================
   Team (/dashboard/team) — manage the current team: rename it,
   see the roster (active members + pending invites), change roles,
   remove people, and invite new teammates. Seat count is gated by
   the plan; owners/admins get the management controls, members get
   a read-only view. All mutations re-check the role server-side.
   ============================================================ */

export default async function TeamPage() {
  const [user, team] = await Promise.all([getUser(), getCurrentTeam()]);

  if (!team) {
    return (
      <div>
        <header>
          <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
            Team
          </h1>
        </header>
        <p className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center text-[14px] text-gray-1">
          No active team. Sign in to manage your team.
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
  const seatLabel =
    seatLimit === null ? `${seatCount} seats` : `${seatCount} / ${seatLimit} seats`;

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
            Team
          </h1>
          <p className="mt-1 text-[13px] text-gray-1">
            Invite teammates and manage their access.
          </p>
        </div>
        <span className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-gray-1">
          {seatLabel}
        </span>
      </header>

      {/* Team name */}
      <section className="mt-8">
        <h2 className="text-[12px] uppercase tracking-[0.06em] text-muted">
          Team name
        </h2>
        <div className="mt-2">
          {canManage ? (
            <TeamNameForm name={team.name} />
          ) : (
            <p className="text-[15px] text-ink">{team.name}</p>
          )}
        </div>
      </section>

      {/* Roster */}
      <section className="mt-10">
        <h2 className="text-[12px] uppercase tracking-[0.06em] text-muted">
          Members
        </h2>
        <div className="mt-3">
          <MemberList
            members={members}
            currentUserId={user?.id ?? ""}
            callerRole={team.role}
          />
        </div>
      </section>

      {/* Invite */}
      <section className="mt-10 max-w-2xl">
        <h2 className="text-[12px] uppercase tracking-[0.06em] text-muted">
          Invite a teammate
        </h2>
        <div className="mt-3 rounded-[10px] border border-line bg-white p-5">
          <InviteMemberForm seatsLeft={seatsLeft} canManage={canManage} />
        </div>
        {seatLimit === 1 ? (
          <p className="mt-3 text-[12.5px] text-gray-1">
            Your plan includes a single seat.{" "}
            <Link
              href="/dashboard/billing"
              className="underline underline-offset-2 hover:text-ink"
            >
              Upgrade
            </Link>{" "}
            to add teammates.
          </p>
        ) : null}
      </section>
    </div>
  );
}
