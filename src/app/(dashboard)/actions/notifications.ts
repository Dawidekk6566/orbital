"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/dal";
import type { ActionResult } from "./projects";

/* ============================================================
   Notification mutations — mark the in-app inbox read. RLS scopes
   every row to the caller's team, so we only need requireUser();
   a passed id that isn't the team's simply matches nothing.
   ============================================================ */

/** Mark one notification read. */
export async function markNotificationRead(id: string): Promise<ActionResult> {
  await requireUser("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) return { error: "Couldn't update the notification." };
  revalidatePath("/dashboard");
  return {};
}

/** Mark every unread notification for the team read (bell "clear"). */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  await requireUser("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) return { error: "Couldn't update notifications." };
  revalidatePath("/dashboard");
  return {};
}
