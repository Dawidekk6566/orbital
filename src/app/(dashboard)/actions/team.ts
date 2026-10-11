"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getCurrentTeam, getTeamRole } from "@/lib/auth/dal";
import { limitsFor } from "@/lib/plans";
import type { ActionResult } from "./projects";

/* ============================================================
   Team management — invites, role changes, removals, rename.

   Authorization is layered: requireUser() gates the session, an
   explicit owner/admin check gates the mutation, and RLS on
   team_members re-checks at the database. Seat limits are a plan
   business rule enforced here (teamSeatCount vs limitsFor.seats).

   Invites are team_members rows with status='invited' + a null
   user_id; they're claimed on sign-in (migration 0006). We never
   remove or demote the last remaining owner.
   ============================================================ */

const EmailSchema = z.string().trim().toLowerCase().email();
const RoleSchema = z.enum(["admin", "member"]); // owners aren't invited directly
const AnyRoleSchema = z.enum(["owner", "admin", "member"]);

/** Owner or admin of the current team, or an error result. */
async function requireManager(): Promise<
  | { ok: true; teamId: string; role: "owner" | "admin"; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string }
> {
  await requireUser("/dashboard/team");
  const team = await getCurrentTeam();
  if (!team) return { ok: false, error: "No active team." };

  const role = await getTeamRole(team.id);
  if (role !== "owner" && role !== "admin") {
    return { ok: false, error: "Only an owner or admin can manage the team." };
  }
  const supabase = await createClient();
  return { ok: true, teamId: team.id, role, supabase };
}

/** Number of active owners on a team (last-owner guard). */
async function activeOwnerCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
): Promise<number> {
  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("role", "owner")
    .eq("status", "active");
  return count ?? 0;
}

export async function inviteMember(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };
  const { supabase, teamId } = gate;

  const parsedEmail = EmailSchema.safeParse(formData.get("email"));
  if (!parsedEmail.success) {
    return { fieldError: "Enter a valid email address." };
  }
  const email = parsedEmail.data;
  const parsedRole = RoleSchema.safeParse(formData.get("role") ?? "member");
  const role = parsedRole.success ? parsedRole.data : "member";

  // Load team plan for the seat gate.
  const { data: team } = await supabase
    .from("teams")
    .select("plan")
    .eq("id", teamId)
    .maybeSingle();
  const plan = (team?.plan as "free" | "pro" | "team") ?? "free";
  const seatLimit = limitsFor(plan).seats;

  // Seats consumed = every membership row (active + invited).
  const { count: seatsUsed } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);
  if (seatLimit !== null && (seatsUsed ?? 0) >= seatLimit) {
    return {
      error:
        plan === "free"
          ? "Your Free plan includes a single seat. Upgrade to invite teammates."
          : `Your ${plan} plan is limited to ${seatLimit} seats. Upgrade for more.`,
    };
  }

  // Already an active member with this email?
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id, profiles!inner(email)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .ilike("profiles.email", email)
    .maybeSingle();
  if (existingMember) {
    return { fieldError: "That person is already on the team." };
  }

  // Already invited?
  const { data: existingInvite } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("status", "invited")
    .ilike("invited_email", email)
    .maybeSingle();
  if (existingInvite) {
    return { fieldError: "That email already has a pending invite." };
  }

  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: null,
    role,
    status: "invited",
    invited_email: email,
  });
  if (error) return { error: "Couldn't send the invite. Try again." };

  // The invite is a team_members row (status='invited'); it's claimed
  // when the invitee signs in with this email (migration 0006). No
  // notification mail is sent — surface the pending invite in the UI.
  revalidatePath("/dashboard/team");
  return {};
}

export async function changeRole(
  memberId: string,
  role: string,
): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };
  const { supabase, teamId, role: callerRole } = gate;

  const parsed = AnyRoleSchema.safeParse(role);
  if (!parsed.success) return { error: "Invalid role." };
  const nextRole = parsed.data;

  // Only an owner may grant or revoke the owner role.
  if (nextRole === "owner" && callerRole !== "owner") {
    return { error: "Only an owner can promote someone to owner." };
  }

  const { data: target } = await supabase
    .from("team_members")
    .select("id, role, status")
    .eq("id", memberId)
    .eq("team_id", teamId)
    .maybeSingle();
  if (!target) return { error: "Member not found." };

  // Don't strip the last owner of ownership.
  if (
    target.role === "owner" &&
    nextRole !== "owner" &&
    (await activeOwnerCount(supabase, teamId)) <= 1
  ) {
    return { error: "A team must keep at least one owner." };
  }
  if (target.role === "owner" && callerRole !== "owner") {
    return { error: "Only an owner can change another owner's role." };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ role: nextRole })
    .eq("id", memberId)
    .eq("team_id", teamId);
  if (error) return { error: "Couldn't update the role." };

  revalidatePath("/dashboard/team");
  return {};
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };
  const { supabase, teamId } = gate;

  const { data: target } = await supabase
    .from("team_members")
    .select("id, role, status")
    .eq("id", memberId)
    .eq("team_id", teamId)
    .maybeSingle();
  if (!target) return { error: "Member not found." };

  if (
    target.role === "owner" &&
    target.status === "active" &&
    (await activeOwnerCount(supabase, teamId)) <= 1
  ) {
    return { error: "A team must keep at least one owner." };
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("team_id", teamId);
  if (error) return { error: "Couldn't remove the member." };

  revalidatePath("/dashboard/team");
  return {};
}

export async function renameTeam(name: string): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };
  const { supabase, teamId } = gate;

  const clean = name.trim();
  if (clean.length < 2 || clean.length > 60) {
    return { fieldError: "Team name must be 2–60 characters." };
  }

  const { error } = await supabase
    .from("teams")
    .update({ name: clean })
    .eq("id", teamId);
  if (error) return { error: "Couldn't rename the team." };

  revalidatePath("/dashboard/team");
  return {};
}
