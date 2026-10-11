"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getCurrentTeam, getTeamRole } from "@/lib/auth/dal";
import { limitsFor } from "@/lib/plans";
import type { ActionResult } from "./projects";

/* ============================================================
   Alert-rule mutations. Alerts are a paid feature (plan-gated).
   Channels are validated with Zod before insert; a score_below
   rule must carry a threshold. Owner/admin only (RLS + check here).
   ============================================================ */

const ChannelSchema = z.object({
  type: z.enum(["slack", "webhook", "inapp"]),
  target: z.string().trim().max(2048).optional(),
});

const RuleSchema = z
  .object({
    id: z.string().uuid().optional(),
    projectId: z.string().uuid(),
    triggerType: z.enum([
      "score_below",
      "regression",
      "new_critical_high",
      "scheduled_complete",
    ]),
    threshold: z.number().int().min(0).max(100).nullable().optional(),
    enabled: z.boolean().default(true),
    channels: z.array(ChannelSchema).min(1, "Add at least one channel."),
  })
  .refine(
    (v) => v.triggerType !== "score_below" || typeof v.threshold === "number",
    { message: "Set a score threshold.", path: ["threshold"] },
  )
  .refine(
    (v) =>
      v.channels.every(
        (c) =>
          c.type === "inapp" || (typeof c.target === "string" && c.target.length > 0),
      ),
    { message: "Slack and webhook channels need a target.", path: ["channels"] },
  );

export async function upsertAlertRule(
  input: unknown,
): Promise<ActionResult> {
  await requireUser("/dashboard/alerts");
  const team = await getCurrentTeam();
  if (!team) return { error: "No active team." };

  if (!limitsFor(team.plan).alerts) {
    return { error: "Alerts aren't available on your plan. Upgrade to enable them." };
  }

  const role = await getTeamRole(team.id);
  if (role !== "owner" && role !== "admin") {
    return { error: "Only an owner or admin can change alerts." };
  }

  const parsed = RuleSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0]?.message ?? "Invalid alert rule." };
  }
  const rule = parsed.data;

  const supabase = await createClient();

  // Confirm project ownership under RLS.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", rule.projectId)
    .maybeSingle();
  if (!project) return { error: "Project not found." };

  const payload = {
    project_id: rule.projectId,
    team_id: team.id,
    enabled: rule.enabled,
    trigger_type: rule.triggerType,
    threshold: rule.triggerType === "score_below" ? rule.threshold ?? null : null,
    channels: rule.channels,
    updated_at: new Date().toISOString(),
  };

  const { error } = rule.id
    ? await supabase.from("alert_rules").update(payload).eq("id", rule.id)
    : await supabase.from("alert_rules").insert(payload);
  if (error) return { error: "Couldn't save the alert rule." };

  revalidatePath("/dashboard/alerts");
  return {};
}

export async function toggleAlertRule(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  await requireUser("/dashboard/alerts");
  const supabase = await createClient();
  const { error } = await supabase
    .from("alert_rules")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't update the alert rule." };
  revalidatePath("/dashboard/alerts");
  return {};
}

export async function deleteAlertRule(id: string): Promise<ActionResult> {
  await requireUser("/dashboard/alerts");
  const supabase = await createClient();
  const { error } = await supabase.from("alert_rules").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the alert rule." };
  revalidatePath("/dashboard/alerts");
  return {};
}
