import { createServiceRoleClient } from "@/lib/supabase/server";
import { authorizeApiRequest } from "@/lib/apiV1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   Public REST API — /api/v1/projects.

   GET lists the tracked projects for the team the API key belongs
   to. Scope: projects:read. Service-role client after the key check
   (no user session), scoped to the key's team_id.
   ============================================================ */

/** GET /api/v1/projects — the team's tracked projects. */
export async function GET(request: Request) {
  const authed = await authorizeApiRequest(request, "projects:read");
  if (authed instanceof Response) return authed;

  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("projects")
    .select(
      "id, url, name, latest_audit_id, latest_score, default_strategy, created_at, updated_at",
    )
    .eq("team_id", authed.teamId)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: "query_failed" }, { status: 500 });

  const projects = (data ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    name: p.name,
    latest_audit_id: p.latest_audit_id,
    latest_score: p.latest_score,
    strategy: p.default_strategy,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  return Response.json(
    { projects },
    { headers: { "Cache-Control": "no-store" } },
  );
}
