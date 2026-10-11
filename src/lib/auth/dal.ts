import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PlanId } from "@/lib/plans";

/* ============================================================
   Data Access Layer — the real authorization gate.

   Every server read/mutation of user data goes through here.
   `getUser()` verifies the token via auth.getUser() (never
   getSession() for authz) and is memoized per render pass with
   React cache(). Combined with Postgres RLS (team-scoped policies),
   this is defense in depth: even a missed check can't leak another
   team's rows because RLS filters at the database.
   ============================================================ */

export type SessionUser = {
  id: string;
  email: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  default_team_id: string | null;
};

export type TeamRole = "owner" | "admin" | "member";

/** Verified auth user, or null. Memoized for the render pass. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
});

/** Require a signed-in user; redirect to /login otherwise. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    const params = nextPath
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";
    redirect(`/login${params}`);
  }
  return user;
}

/** Full profile row for the current user (RLS: own row). */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, default_team_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
});

/**
 * The current user's role in a team, or null if not a member.
 * RLS ensures a non-member sees no membership row → null.
 */
export const getTeamRole = cache(
  async (teamId: string): Promise<TeamRole | null> => {
    const user = await getUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) return null;
    return data.role as TeamRole;
  },
);

/** Require membership (optionally a minimum set of roles) in a team. */
export async function requireTeamRole(
  teamId: string,
  allowed: TeamRole[] = ["owner", "admin", "member"],
): Promise<TeamRole> {
  const role = await getTeamRole(teamId);
  if (!role || !allowed.includes(role)) {
    // Not a member (or insufficient role): treat as not-found so we
    // never confirm the resource exists to an unauthorized caller.
    redirect("/dashboard");
  }
  return role;
}

export type CurrentTeam = {
  id: string;
  name: string;
  plan: PlanId;
  role: TeamRole;
};

/**
 * The user's default (personal) team with its plan and the user's
 * role. Returns null when unconfigured or the schema isn't migrated
 * yet, so the shell can fall back to a "free" view without crashing.
 */
export const getCurrentTeam = cache(async (): Promise<CurrentTeam | null> => {
  const profile = await getProfile();
  if (!profile?.default_team_id) return null;

  const supabase = await createClient();
  const [teamRes, roleRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, plan")
      .eq("id", profile.default_team_id)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("role")
      .eq("team_id", profile.default_team_id)
      .eq("user_id", profile.id)
      .maybeSingle(),
  ]);

  if (teamRes.error || !teamRes.data) return null;

  return {
    id: teamRes.data.id,
    name: teamRes.data.name,
    plan: (teamRes.data.plan as PlanId) ?? "free",
    role: (roleRes.data?.role as TeamRole) ?? "member",
  };
});
