"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getCurrentTeam, getTeamRole } from "@/lib/auth/dal";
import { limitsFor, cadenceAllowed } from "@/lib/plans";
import {
  upsertQStashSchedule,
  deleteQStashSchedule,
  nextRunAt,
} from "@/lib/queue/qstash";
import type { ActionResult } from "./projects";

/* ============================================================
   Schedule mutations — create / update / remove a project's
   scheduled re-audit. Cadence is plan-gated server-side; the row
   is persisted even when QStash isn't configured (intent is kept,
   dispatch simply doesn't fire until keys + a public APP_URL exist).
   Writes are owner/admin only (RLS + the explicit role check here).
   ============================================================ */

type Cadence = "hourly" | "daily";

export async function upsertSchedule(input: {
  projectId: string;
  cadence: Cadence;
  strategy: "mobile" | "desktop";
  enabled: boolean;
}): Promise<ActionResult> {
  await requireUser("/dashboard/schedule");
  const team = await getCurrentTeam();
  if (!team) return { error: "No active team." };

  const role = await getTeamRole(team.id);
  if (role !== "owner" && role !== "admin") {
    return { error: "Only an owner or admin can change schedules." };
  }

  // Plan gate (business rule).
  if (limitsFor(team.plan).schedule === "none") {
    return { error: "Scheduled audits aren't available on your plan. Upgrade to enable them." };
  }
  if (!cadenceAllowed(team.plan, input.cadence)) {
    return { error: `Your ${team.plan} plan doesn't allow ${input.cadence} audits.` };
  }

  const supabase = await createClient();

  // Confirm the project belongs to the caller's team (RLS).
  const { data: project } = await supabase
    .from("projects")
    .select("id, team_id")
    .eq("id", input.projectId)
    .maybeSingle();
  if (!project) return { error: "Project not found." };

  // Re-read any existing schedule so we can reconcile the QStash id.
  const { data: existing } = await supabase
    .from("schedules")
    .select("id, qstash_schedule_id")
    .eq("project_id", input.projectId)
    .maybeSingle();

  let scheduleId: string | null = existing?.qstash_schedule_id ?? null;
  try {
    if (input.enabled) {
      scheduleId = await upsertQStashSchedule({
        projectId: input.projectId,
        cadence: input.cadence,
        existingScheduleId: existing?.qstash_schedule_id,
      });
    } else if (existing?.qstash_schedule_id) {
      // Disabled: tear down the remote schedule but keep the row.
      await deleteQStashSchedule(existing.qstash_schedule_id);
      scheduleId = null;
    }
  } catch {
    return { error: "Couldn't reach the scheduling service. Try again." };
  }

  const { error } = await supabase.from("schedules").upsert(
    {
      project_id: input.projectId,
      team_id: team.id,
      cadence: input.cadence,
      strategy: input.strategy,
      enabled: input.enabled,
      qstash_schedule_id: scheduleId,
      next_run_at: input.enabled ? nextRunAt(input.cadence).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" },
  );
  if (error) return { error: "Couldn't save the schedule." };

  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/projects/${input.projectId}`);
  return {};
}

export async function deleteSchedule(
  projectId: string,
): Promise<ActionResult> {
  await requireUser("/dashboard/schedule");
  const team = await getCurrentTeam();
  if (!team) return { error: "No active team." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("schedules")
    .select("qstash_schedule_id")
    .eq("project_id", projectId)
    .maybeSingle();

  await deleteQStashSchedule(existing?.qstash_schedule_id);

  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("project_id", projectId);
  if (error) return { error: "Couldn't remove the schedule." };

  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return {};
}
