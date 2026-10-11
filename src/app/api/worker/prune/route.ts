import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { qstashReceiver, isQStashReceiverConfigured } from "@/lib/queue/qstash";
import { historyCutoff, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   Retention prune worker. A daily QStash cron POSTs here to drop
   audits older than each team's plan retention window.

   Security: same as run-audit — a valid `Upstash-Signature` over
   the raw body is the only auth. Runs with the SERVICE ROLE.

   We never delete a project's current `latest_audit_id` even if it
   has aged past the window, so the project detail/overview keeps a
   score to show. Teams on an unlimited-history plan are skipped.
   ============================================================ */

export async function POST(request: Request) {
  if (!isServiceRoleConfigured() || !isQStashReceiverConfigured()) {
    return Response.json({ error: "Worker not configured." }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("upstash-signature") ?? "";
  const receiver = qstashReceiver();
  try {
    const valid = await receiver!.verify({ signature, body: raw });
    if (!valid) throw new Error("invalid");
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  const db = createServiceRoleClient();

  const { data: teams, error: teamsError } = await db
    .from("teams")
    .select("id, plan");
  if (teamsError || !teams) {
    return Response.json({ error: "Couldn't load teams." }, { status: 500 });
  }

  let deleted = 0;
  for (const team of teams) {
    const cutoff = historyCutoff((team.plan as PlanId) ?? "free");
    if (!cutoff) continue; // unlimited retention → nothing to prune

    // Keep each project's current latest audit regardless of age.
    const { data: projects } = await db
      .from("projects")
      .select("latest_audit_id")
      .eq("team_id", team.id);
    const keep = (projects ?? [])
      .map((p) => p.latest_audit_id)
      .filter((id): id is string => Boolean(id));

    let query = db
      .from("audits")
      .delete({ count: "exact" })
      .eq("team_id", team.id)
      .lt("created_at", cutoff.toISOString());
    if (keep.length > 0) {
      query = query.not("id", "in", `(${keep.join(",")})`);
    }

    const { count } = await query;
    deleted += count ?? 0;
  }

  return Response.json({ pruned: deleted });
}
