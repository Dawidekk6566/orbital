"use client";

import { useState, useTransition } from "react";
import { changeRole, removeMember } from "@/app/(dashboard)/actions/team";
import type { TeamMemberRow } from "@/lib/dashboard/queries";
import type { TeamRole } from "@/lib/auth/dal";

/* ============================================================
   MemberList — the team roster. Active members show their profile
   and a role control; pending invites show the invited email with a
   "Cancel" action. Role changes / removals route through Server
   Actions (useTransition); the server re-checks the caller's role
   and the last-owner guard, so the UI is optimistic-but-safe.
   ============================================================ */

function initials(name: string | null, email: string | null): string {
  const src = (name ?? email ?? "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function MemberList({
  members,
  currentUserId,
  callerRole,
}: {
  members: TeamMemberRow[];
  currentUserId: string;
  callerRole: TeamRole;
}) {
  const canManage = callerRole === "owner" || callerRole === "admin";

  return (
    <ul className="divide-y divide-line rounded-[10px] border border-line bg-white">
      {members.map((m) => (
        <MemberRow
          key={m.id}
          member={m}
          currentUserId={currentUserId}
          callerRole={callerRole}
          canManage={canManage}
        />
      ))}
    </ul>
  );
}

function MemberRow({
  member,
  currentUserId,
  callerRole,
  canManage,
}: {
  member: TeamMemberRow;
  currentUserId: string;
  callerRole: TeamRole;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<TeamRole>(member.role);
  const [error, setError] = useState<string | null>(null);

  const isSelf = member.user_id === currentUserId;
  const invited = member.status === "invited";
  const displayName = invited
    ? member.invited_email
    : member.full_name ?? member.email ?? "Unknown";

  // Owners can edit anyone; admins can edit members/admins but not owners.
  const editable =
    canManage &&
    !invited &&
    (callerRole === "owner" || member.role !== "owner");

  // Role options: only an owner may grant the owner role.
  const roleOptions: TeamRole[] =
    callerRole === "owner" ? ["owner", "admin", "member"] : ["admin", "member"];

  function onRoleChange(next: TeamRole) {
    const prev = role;
    setRole(next);
    setError(null);
    startTransition(async () => {
      const result = await changeRole(member.id, next);
      if (result?.error) {
        setRole(prev);
        setError(result.error);
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMember(member.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line bg-bg-soft font-mono text-[12px] text-gray-1"
          aria-hidden="true"
        >
          {invited ? "@" : initials(member.full_name, member.email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] text-ink">
            {displayName}
            {isSelf ? <span className="text-gray-1"> (you)</span> : null}
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-[12px] text-gray-1">
            {invited ? (
              <span className="rounded-full border border-line px-2 py-[1px] font-mono text-[10px] uppercase tracking-[0.05em] text-muted">
                Invited
              </span>
            ) : null}
            {!invited && member.email ? (
              <span className="truncate">{member.email}</span>
            ) : null}
            {invited ? <span>Pending sign-in</span> : null}
          </p>
        </div>
      </div>

      <div className="flex flex-none items-center gap-3">
        {editable ? (
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as TeamRole)}
            disabled={pending}
            aria-label="Role"
            className="rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-ink disabled:opacity-60"
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        ) : (
          <span className="rounded-full border border-line px-2.5 py-[3px] font-mono text-[11px] uppercase tracking-[0.05em] text-gray-1">
            {ROLE_LABEL[member.role]}
          </span>
        )}

        {canManage && !isSelf ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-[13px] text-gray-1 transition-colors hover:text-bad disabled:opacity-60"
          >
            {invited ? "Cancel" : "Remove"}
          </button>
        ) : null}

        {error ? <span className="text-[12px] text-bad">{error}</span> : null}
      </div>
    </li>
  );
}
